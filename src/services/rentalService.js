const { Prisma } = require('@prisma/client');
const prisma = require('../config/prisma');
const rentalRepository = require('../repositories/rentalRepository');
const auditRepository = require('../repositories/auditRepository');
const AppError = require('../utils/AppError');

// Under Postgres's default READ COMMITTED isolation, two concurrent
// createRental calls for the same umbrella (or same student) could each
// read "no active rental exists" before either has committed its insert,
// producing two active rentals for one umbrella/student. We run this
// transaction at SERIALIZABLE isolation so Postgres detects that
// conflict and aborts one side with a serialization failure, which we
// convert into a clean 409 rather than a silent double-booking.
async function runSerializable(fn) {
  try {
    return await prisma.$transaction(fn, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (err) {
    // Postgres SQLSTATE 40001 (serialization_failure), surfaced by
    // Prisma as error code P2034.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2034') {
      throw AppError.conflict(
        'This umbrella or your account was updated concurrently - please try again',
        'CONCURRENT_UPDATE'
      );
    }
    throw err;
  }
}

const rentalService = {
  // Creates a rental in CREATED status. Does NOT touch umbrella status
  // yet - the umbrella only becomes RENTED once payment is verified
  // (see paymentService.verifyPayment). This keeps "reserved but unpaid"
  // umbrellas from silently disappearing from availability for long.
  async createRental({ studentId, umbrellaId, pricingPlanId }) {
    return runSerializable(async (tx) => {
      // Rule: student must be ACTIVE (already enforced by authenticate
      // middleware loading a fresh user, but re-checked defensively).
      const student = await tx.user.findUnique({ where: { id: studentId } });
      if (!student || student.status !== 'ACTIVE') {
        throw AppError.forbidden('Only active students can rent umbrellas');
      }
      if (student.role !== 'STUDENT') {
        throw AppError.forbidden('Only students can create rentals');
      }

      // Rule: student can have only ONE active rental at a time.
      const existingActive = await tx.rental.findFirst({
        where: { studentId, status: { in: rentalRepository.ACTIVE_STATUSES } },
      });
      if (existingActive) {
        throw AppError.conflict('You already have an active rental', 'ACTIVE_RENTAL_EXISTS');
      }

      // Rule: umbrella must exist, be AVAILABLE, and have no active rental.
      const umbrella = await tx.umbrella.findUnique({ where: { id: umbrellaId } });
      if (!umbrella) throw AppError.notFound('Umbrella not found');
      if (umbrella.status !== 'AVAILABLE') {
        throw AppError.conflict(
          `Umbrella is not available (status: ${umbrella.status})`,
          'UMBRELLA_NOT_AVAILABLE'
        );
      }
      const umbrellaActiveRental = await tx.rental.findFirst({
        where: { umbrellaId, status: { in: rentalRepository.ACTIVE_STATUSES } },
      });
      if (umbrellaActiveRental) {
        // Defensive: should be impossible if status is AVAILABLE, but
        // guards against any race/data inconsistency.
        throw AppError.conflict('Umbrella already has an active rental', 'UMBRELLA_ALREADY_RENTED');
      }

      const plan = await tx.pricingPlan.findUnique({ where: { id: pricingPlanId } });
      if (!plan || !plan.active) {
        throw AppError.badRequest('Selected pricing plan is not available', 'INVALID_PRICING_PLAN');
      }

      if (!umbrella.currentStationId) {
        throw AppError.conflict('Umbrella has no current station assigned', 'UMBRELLA_NO_STATION');
      }

      const rental = await tx.rental.create({
        data: {
          studentId,
          umbrellaId,
          pricingPlanId,
          // Snapshot price/duration so future pricing edits never affect
          // this historical rental.
          priceAtRentalPaise: plan.pricePaise,
          durationMinutesAtRental: plan.durationMinutes,
          status: 'CREATED',
          originStationId: umbrella.currentStationId,
        },
      });

      await auditRepository.logTx(tx, {
        actorId: studentId,
        action: 'RENTAL_CREATED',
        entity: 'Rental',
        entityId: rental.id,
        metadata: { umbrellaId, pricingPlanId },
      });

      return rental;
    });
  },

  async getActiveForStudent(studentId) {
    const rental = await rentalRepository.findActiveForStudent(studentId);
    if (!rental) throw AppError.notFound('No active rental found', 'NO_ACTIVE_RENTAL');
    return rental;
  },

  async getById(id, requester) {
    const rental = await rentalRepository.findById(id);
    if (!rental) throw AppError.notFound('Rental not found');
    // Students may only view their own rentals.
    if (requester.role === 'STUDENT' && rental.studentId !== requester.id) {
      throw AppError.forbidden('You cannot view another student\'s rental');
    }
    return rental;
  },

  async history(studentId, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const [rentals, total] = await Promise.all([
      rentalRepository.history({ studentId, skip, take: limit }),
      rentalRepository.historyCount(studentId),
    ]);
    return { rentals, total, page, limit };
  },
};

module.exports = rentalService;
