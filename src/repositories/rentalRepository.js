const prisma = require('../config/prisma');

const ACTIVE_STATUSES = ['CREATED', 'PAYMENT_PENDING', 'ACTIVE', 'OVERDUE', 'RETURN_PENDING'];

const rentalRepository = {
  findById: (id) =>
    prisma.rental.findUnique({
      where: { id },
      include: { umbrella: true, pricingPlan: true, originStation: true, returnStation: true, payment: true },
    }),

  // Used by services inside a transaction for consistent reads/writes.
  findByIdTx: (tx, id) => tx.rental.findUnique({ where: { id } }),

  findActiveForStudent: (studentId) =>
    prisma.rental.findFirst({
      where: { studentId, status: { in: ACTIVE_STATUSES } },
      include: { umbrella: true, pricingPlan: true, originStation: true },
    }),

  findActiveForUmbrella: (umbrellaId) =>
    prisma.rental.findFirst({
      where: { umbrellaId, status: { in: ACTIVE_STATUSES } },
    }),

  // Used by the staff "return by umbrella code" lookup: an umbrella can be
  // returned at any participating station, not only the one it was rented
  // from, so this intentionally does NOT filter by originStationId.
  findActiveOrOverdueForUmbrellaWithDetails: (umbrellaId) =>
    prisma.rental.findFirst({
      where: { umbrellaId, status: { in: ['ACTIVE', 'OVERDUE'] } },
      include: {
        umbrella: true,
        pricingPlan: true,
        originStation: true,
        student: { select: { id: true, name: true, lpuId: true, email: true, phone: true } },
      },
    }),

  create: (data) => prisma.rental.create({ data }),
  update: (id, data) => prisma.rental.update({ where: { id }, data }),
  updateTx: (tx, id, data) => tx.rental.update({ where: { id }, data }),

  history: ({ studentId, skip, take }) =>
    prisma.rental.findMany({
      where: { studentId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { umbrella: true, pricingPlan: true, originStation: true, returnStation: true, payment: true },
    }),

  historyCount: (studentId) => prisma.rental.count({ where: { studentId } }),

  listForAdmin: ({ skip, take, where }) =>
    prisma.rental.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { umbrella: true, student: true, originStation: true, returnStation: true, payment: true },
    }),

  countForAdmin: (where) => prisma.rental.count({ where }),

  // Rentals whose planned duration has elapsed but which are still ACTIVE.
  findExpiredActive: (asOf) =>
    prisma.rental.findMany({
      where: { status: 'ACTIVE', dueAt: { lt: asOf } },
    }),

  ACTIVE_STATUSES,
};

module.exports = rentalRepository;
