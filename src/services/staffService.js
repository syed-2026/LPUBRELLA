const prisma = require('../config/prisma');
const stationRepository = require('../repositories/stationRepository');
const umbrellaRepository = require('../repositories/umbrellaRepository');
const rentalRepository = require('../repositories/rentalRepository');
const damageRepository = require('../repositories/damageRepository');
const auditRepository = require('../repositories/auditRepository');
const umbrellaStateMachine = require('./umbrellaStateMachine');
const AppError = require('../utils/AppError');

function requireStationAssignment(staff) {
  if (!staff.assignedStationId) {
    throw AppError.forbidden('You are not assigned to a station', 'STAFF_NO_STATION');
  }
  return staff.assignedStationId;
}

const staffService = {
  async dashboard(staff) {
    const stationId = requireStationAssignment(staff);
    const [station, inventory, recentRentals] = await Promise.all([
      stationRepository.findById(stationId),
      stationRepository.inventoryCounts(stationId),
      prisma.rental.findMany({
        where: { originStation: { id: stationId }, status: { in: ['ACTIVE', 'OVERDUE'] } },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { student: { select: { id: true, name: true, lpuId: true } }, umbrella: true },
      }),
    ]);
    if (!station) throw AppError.notFound('Assigned station not found');
    return { station, inventory, recentRentals };
  },

  async recentRentals(staff, { page = 1, limit = 20, status, search } = {}) {
    const stationId = requireStationAssignment(staff);
    const skip = (page - 1) * limit;
    const where = { originStationId: stationId };

    // Optional status filter (comma-separated list, e.g. "ACTIVE,OVERDUE"),
    // additive and backward-compatible: omitting it preserves the original
    // "all statuses" behavior.
    if (status) {
      const statuses = Array.isArray(status) ? status : String(status).split(',').map((s) => s.trim());
      where.status = { in: statuses };
    }

    // Optional free-text search across umbrella code, student name/LPU ID,
    // or exact rental ID - backs the staff "Active Rentals" / "Rental
    // History" search UX (umbrella ID is the primary, human-friendly key).
    if (search) {
      const term = String(search).trim();
      if (term) {
        where.OR = [
          { id: term },
          { umbrella: { publicCode: { contains: term, mode: 'insensitive' } } },
          { student: { name: { contains: term, mode: 'insensitive' } } },
          { student: { lpuId: { contains: term, mode: 'insensitive' } } },
        ];
      }
    }

    const [rentals, total] = await Promise.all([
      prisma.rental.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { student: { select: { id: true, name: true, lpuId: true } }, umbrella: true, payment: true },
      }),
      prisma.rental.count({ where }),
    ]);
    return { rentals, total, page, limit };
  },

  // Staff-facing return-workflow lookup: given a human-friendly umbrella
  // code (e.g. "UMB-0001"), finds the umbrella's current ACTIVE/OVERDUE
  // rental so staff never has to know or type the internal rental UUID.
  // Deliberately NOT scoped to the staff member's own station, because an
  // umbrella can be returned at any participating station per the
  // business rules - a station-scoped lookup would make cross-station
  // returns impossible to service.
  async lookupRentalByUmbrellaCode(staff, umbrellaCode) {
    requireStationAssignment(staff);

    const umbrella = await umbrellaRepository.findByPublicCode(umbrellaCode);
    if (!umbrella) {
      throw AppError.notFound('No umbrella found with that ID', 'UMBRELLA_NOT_FOUND');
    }

    const rental = await rentalRepository.findActiveOrOverdueForUmbrellaWithDetails(umbrella.id);
    if (!rental) {
      throw AppError.notFound(
        'This umbrella has no active rental to return',
        'NO_ACTIVE_RENTAL_FOR_UMBRELLA'
      );
    }

    return rental;
  },

  async inventory(staff) {
    const stationId = requireStationAssignment(staff);
    const [umbrellas, counts] = await Promise.all([
      umbrellaRepository.list({ where: { currentStationId: stationId } }),
      stationRepository.inventoryCounts(stationId),
    ]);
    return { umbrellas, counts };
  },

  async reportDamage(staff, { umbrellaId, severity, description }) {
    const stationId = requireStationAssignment(staff);
    const umbrella = await umbrellaRepository.findById(umbrellaId);
    if (!umbrella) throw AppError.notFound('Umbrella not found');

    // Staff may report damage on an umbrella currently RENTED (e.g.
    // inspecting on return before the return flow completes) since it
    // isn't physically at any station yet. If it's already AVAILABLE, it
    // must be sitting at the staff member's own station - staff shouldn't
    // be able to action inventory they don't physically have in front of
    // them.
    if (umbrella.status === 'AVAILABLE' && umbrella.currentStationId !== stationId) {
      throw AppError.forbidden('Umbrella is not at your assigned station', 'STATION_MISMATCH');
    }

    umbrellaStateMachine.assertTransition(umbrella.status, 'MAINTENANCE');

    const [report] = await prisma.$transaction([
      damageRepository.create({ umbrellaId, reportedById: staff.id, severity, description }),
      umbrellaRepository.update(umbrellaId, { status: 'MAINTENANCE' }),
    ]);

    await auditRepository.log({
      actorId: staff.id,
      action: 'UMBRELLA_MARKED_MAINTENANCE',
      entity: 'Umbrella',
      entityId: umbrellaId,
      metadata: { severity, description },
    });

    return report;
  },

  async reportMissing(staff, { umbrellaId, description }) {
    const umbrella = await umbrellaRepository.findById(umbrellaId);
    if (!umbrella) throw AppError.notFound('Umbrella not found');

    umbrellaStateMachine.assertTransition(umbrella.status, 'MISSING');

    const updated = await umbrellaRepository.update(umbrellaId, { status: 'MISSING' });

    if (description) {
      await damageRepository.create({
        umbrellaId,
        reportedById: staff.id,
        severity: 'UNUSABLE',
        description: `Reported missing: ${description}`,
        status: 'OPEN',
      });
    }

    await auditRepository.log({
      actorId: staff.id,
      action: 'UMBRELLA_MARKED_MISSING',
      entity: 'Umbrella',
      entityId: umbrellaId,
    });

    return updated;
  },
};

module.exports = staffService;
