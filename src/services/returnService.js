const { Prisma } = require('@prisma/client');
const prisma = require('../config/prisma');
const rentalRepository = require('../repositories/rentalRepository');
const returnTokenRepository = require('../repositories/returnTokenRepository');
const auditRepository = require('../repositories/auditRepository');
const rentalStateMachine = require('./rentalStateMachine');
const umbrellaStateMachine = require('./umbrellaStateMachine');
const { generateToken, hashToken } = require('../utils/secureToken');
const AppError = require('../utils/AppError');
const env = require('../config/env');

// See rentalService.js for the rationale: two simultaneous scans of the
// same (still-valid-looking) Return QR could both pass the "not used yet"
// read-check before either commits its "mark used" write. SERIALIZABLE
// isolation makes Postgres detect and reject the losing transaction
// instead of allowing a double return.
async function runSerializable(fn) {
  try {
    return await prisma.$transaction(fn, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2034') {
      throw AppError.conflict('This return was processed concurrently - please try again', 'CONCURRENT_UPDATE');
    }
    throw err;
  }
}

const returnService = {
  // Staff presses "Generate Return QR" after physically receiving the
  // umbrella from the student. Produces a short-lived, single-use token.
  async generateReturnToken({ rentalId, staff }) {
    if (!staff.assignedStationId) {
      throw AppError.forbidden('Staff member is not assigned to a station', 'STAFF_NO_STATION');
    }

    const rental = await rentalRepository.findById(rentalId);
    if (!rental) throw AppError.notFound('Rental not found');

    if (!rentalStateMachine.canReturn(rental.status)) {
      throw AppError.conflict(
        `Rental cannot be returned from status ${rental.status}`,
        'RENTAL_NOT_RETURNABLE'
      );
    }

    // Rule: staff must belong to the station where the return occurs.
    // We treat "the station where return occurs" as the staff member's
    // assigned station (the station they are physically operating at).
    const stationId = staff.assignedStationId;

    const rawToken = generateToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + env.returnTokenTtlSeconds * 1000);

    const record = await returnTokenRepository.create({
      tokenHash,
      rentalId: rental.id,
      studentId: rental.studentId,
      staffId: staff.id,
      stationId,
      expiresAt,
    });

    await auditRepository.log({
      actorId: staff.id,
      action: 'RETURN_TOKEN_CREATED',
      entity: 'ReturnToken',
      entityId: record.id,
      metadata: { rentalId: rental.id, stationId },
    });

    // Return the RAW token to the caller (it is never persisted in raw
    // form) - this is what gets encoded into the temporary Return QR
    // shown to the student to scan.
    return { token: rawToken, expiresAt, expiresInSeconds: env.returnTokenTtlSeconds };
  },

  // Student scans the Return QR. Everything is validated and applied
  // atomically inside a single transaction, per spec.
  async confirmReturn({ rawToken, studentId }) {
    const tokenHash = hashToken(rawToken);

    return runSerializable(async (tx) => {
      // 1. Validate ReturnToken exists.
      const returnToken = await returnTokenRepository.findByTokenHashTx(tx, tokenHash);
      if (!returnToken) {
        throw AppError.badRequest('Invalid return token', 'INVALID_RETURN_TOKEN');
      }

      // 8. Validate token unused (checked early to fail fast).
      if (returnToken.used) {
        throw AppError.conflict('This return token has already been used', 'RETURN_TOKEN_USED');
      }

      // 7. Validate token expiry.
      if (returnToken.expiresAt < new Date()) {
        throw AppError.conflict('This return token has expired', 'RETURN_TOKEN_EXPIRED');
      }

      // 2. Validate student: the token must belong to the scanning student.
      if (returnToken.studentId !== studentId) {
        throw AppError.forbidden('This return token does not belong to you', 'RETURN_TOKEN_WRONG_STUDENT');
      }

      // 3. Find rental (from the token, authoritative).
      const rental = await rentalRepository.findByIdTx(tx, returnToken.rentalId);
      if (!rental) throw AppError.notFound('Rental not found');

      if (rental.studentId !== studentId) {
        throw AppError.forbidden('This rental does not belong to you');
      }

      // 4. Validate rental status is returnable.
      if (!rentalStateMachine.canReturn(rental.status)) {
        throw AppError.conflict(
          `Rental cannot be returned from status ${rental.status}`,
          'RENTAL_NOT_RETURNABLE'
        );
      }

      // 5. Validate staff still exists/authorized.
      const staff = await tx.user.findUnique({ where: { id: returnToken.staffId } });
      if (!staff || staff.role !== 'STAFF' || staff.status !== 'ACTIVE') {
        throw AppError.forbidden('Return staff member is not authorized', 'STAFF_NOT_AUTHORIZED');
      }
      if (staff.assignedStationId !== returnToken.stationId) {
        throw AppError.forbidden('Staff is not assigned to the return station', 'STAFF_STATION_MISMATCH');
      }

      // 6. Validate station.
      const station = await tx.station.findUnique({ where: { id: returnToken.stationId } });
      if (!station || station.status !== 'ACTIVE') {
        throw AppError.conflict('Return station is not currently active', 'STATION_NOT_ACTIVE');
      }

      const umbrella = await tx.umbrella.findUnique({ where: { id: rental.umbrellaId } });
      if (!umbrella) throw AppError.notFound('Umbrella not found');

      rentalStateMachine.assertTransition(rental.status, 'RETURN_PENDING');
      rentalStateMachine.assertTransition('RETURN_PENDING', 'COMPLETED');
      umbrellaStateMachine.assertTransition(umbrella.status, 'AVAILABLE');

      const now = new Date();

      // 9-11. Update rental.
      const updatedRental = await rentalRepository.updateTx(tx, rental.id, {
        returnStationId: station.id,
        completedAt: now,
        status: 'COMPLETED',
      });

      // 12-13. Update umbrella.
      const updatedUmbrella = await tx.umbrella.update({
        where: { id: umbrella.id },
        data: { status: 'AVAILABLE', currentStationId: station.id },
      });

      // 14. Mark ReturnToken as USED (single-use enforcement).
      await returnTokenRepository.markUsedTx(tx, returnToken.id, now);

      await auditRepository.logTx(tx, {
        actorId: studentId,
        action: 'RETURN_COMPLETED',
        entity: 'Rental',
        entityId: rental.id,
        metadata: { umbrellaId: umbrella.id, stationId: station.id, staffId: staff.id },
      });

      if (rental.originStationId !== station.id) {
        await auditRepository.logTx(tx, {
          actorId: staff.id,
          action: 'INVENTORY_MOVED',
          entity: 'Umbrella',
          entityId: umbrella.id,
          metadata: { fromStationId: rental.originStationId, toStationId: station.id },
        });
      }

      return { rental: updatedRental, umbrella: updatedUmbrella };
    });
  },
};

module.exports = returnService;
