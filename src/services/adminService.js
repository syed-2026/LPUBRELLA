const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const userRepository = require('../repositories/userRepository');
const stationRepository = require('../repositories/stationRepository');
const umbrellaRepository = require('../repositories/umbrellaRepository');
const pricingRepository = require('../repositories/pricingRepository');
const rentalRepository = require('../repositories/rentalRepository');
const paymentRepository = require('../repositories/paymentRepository');
const damageRepository = require('../repositories/damageRepository');
const auditRepository = require('../repositories/auditRepository');
const AppError = require('../utils/AppError');

const BCRYPT_ROUNDS = 12;

function sanitizeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

const adminService = {
  // ---- Users (staff/admin provisioning + student management) ----
  async createStaffOrAdmin(actorId, data) {
    const [existingEmail, existingLpuId] = await Promise.all([
      userRepository.findByEmail(data.email),
      userRepository.findByLpuId(data.lpuId),
    ]);
    if (existingEmail) throw AppError.conflict('Email already registered', 'EMAIL_TAKEN');
    if (existingLpuId) throw AppError.conflict('LPU ID already registered', 'LPU_ID_TAKEN');

    if (data.assignedStationId) {
      const station = await stationRepository.findById(data.assignedStationId);
      if (!station) throw AppError.badRequest('assignedStationId does not reference a real station');
    }

    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
    const user = await userRepository.create({
      lpuId: data.lpuId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      passwordHash,
      role: data.role,
      status: 'ACTIVE',
      assignedStationId: data.assignedStationId,
    });

    await auditRepository.log({ actorId, action: 'ADMIN_ACTION', entity: 'User', entityId: user.id, metadata: { op: 'create_staff_or_admin' } });
    return sanitizeUser(user);
  },

  async listUsers({ page = 1, limit = 20, role, status }) {
    const skip = (page - 1) * limit;
    const where = { ...(role ? { role } : {}), ...(status ? { status } : {}) };
    const [users, total] = await Promise.all([
      userRepository.list({ skip, take: limit, where }),
      userRepository.count(where),
    ]);
    return { users: users.map(sanitizeUser), total, page, limit };
  },

  async updateUser(actorId, userId, data) {
    const user = await userRepository.findById(userId);
    if (!user) throw AppError.notFound('User not found');

    if (data.assignedStationId) {
      const station = await stationRepository.findById(data.assignedStationId);
      if (!station) throw AppError.badRequest('assignedStationId does not reference a real station');
    }

    const updated = await userRepository.update(userId, data);
    await auditRepository.log({ actorId, action: 'ADMIN_ACTION', entity: 'User', entityId: userId, metadata: { op: 'update_user', data } });
    return sanitizeUser(updated);
  },

  // ---- Stations ----
  async createStation(actorId, data) {
    const existing = await stationRepository.findByCode(data.code);
    if (existing) throw AppError.conflict('Station code already exists');
    const station = await stationRepository.create(data);
    await auditRepository.log({ actorId, action: 'ADMIN_ACTION', entity: 'Station', entityId: station.id, metadata: { op: 'create_station' } });
    return station;
  },

  async updateStation(actorId, stationId, data) {
    const station = await stationRepository.findById(stationId);
    if (!station) throw AppError.notFound('Station not found');
    const updated = await stationRepository.update(stationId, data);
    await auditRepository.log({ actorId, action: 'ADMIN_ACTION', entity: 'Station', entityId: stationId, metadata: { op: 'update_station', data } });
    return updated;
  },

  async listStations({ page = 1, limit = 20 }) {
    const skip = (page - 1) * limit;
    const [stations, total] = await Promise.all([
      stationRepository.list({ skip, take: limit }),
      stationRepository.count(),
    ]);
    return { stations, total, page, limit };
  },

  // ---- Umbrellas ----
  async createUmbrella(actorId, data) {
    const [existingCode, existingQr] = await Promise.all([
      umbrellaRepository.findByPublicCode(data.publicCode),
      umbrellaRepository.findByQrIdentifier(data.qrIdentifier),
    ]);
    if (existingCode) throw AppError.conflict('publicCode already exists');
    if (existingQr) throw AppError.conflict('qrIdentifier already exists');

    const station = await stationRepository.findById(data.currentStationId);
    if (!station) throw AppError.badRequest('currentStationId does not reference a real station');

    const umbrella = await umbrellaRepository.create({ ...data, status: 'AVAILABLE' });
    await auditRepository.log({ actorId, action: 'ADMIN_ACTION', entity: 'Umbrella', entityId: umbrella.id, metadata: { op: 'create_umbrella' } });
    return umbrella;
  },

  async updateUmbrella(actorId, umbrellaId, data) {
    const umbrella = await umbrellaRepository.findById(umbrellaId);
    if (!umbrella) throw AppError.notFound('Umbrella not found');

    // Admin reconciliation may force a status; route through the state
    // machine when a status change is requested to avoid silently
    // creating an invalid state, unless it's the same status (no-op).
    if (data.status && data.status !== umbrella.status) {
      const umbrellaStateMachine = require('./umbrellaStateMachine');
      umbrellaStateMachine.assertTransition(umbrella.status, data.status);
    }

    const updated = await umbrellaRepository.update(umbrellaId, data);
    await auditRepository.log({ actorId, action: 'ADMIN_ACTION', entity: 'Umbrella', entityId: umbrellaId, metadata: { op: 'update_umbrella', data } });
    return updated;
  },

  async listUmbrellas({ page = 1, limit = 20, status, stationId }) {
    const skip = (page - 1) * limit;
    const where = { ...(status ? { status } : {}), ...(stationId ? { currentStationId: stationId } : {}) };
    const [umbrellas, total] = await Promise.all([
      umbrellaRepository.list({ skip, take: limit, where }),
      umbrellaRepository.count(where),
    ]);
    return { umbrellas, total, page, limit };
  },

  // ---- Pricing ----
  async createPricingPlan(actorId, data) {
    const plan = await pricingRepository.create(data);
    await auditRepository.log({ actorId, action: 'ADMIN_ACTION', entity: 'PricingPlan', entityId: plan.id, metadata: { op: 'create_pricing_plan' } });
    return plan;
  },

  async updatePricingPlan(actorId, planId, data) {
    const plan = await pricingRepository.findById(planId);
    if (!plan) throw AppError.notFound('Pricing plan not found');
    const updated = await pricingRepository.update(planId, data);
    await auditRepository.log({ actorId, action: 'ADMIN_ACTION', entity: 'PricingPlan', entityId: planId, metadata: { op: 'update_pricing_plan', data } });
    return updated;
  },

  async listPricingPlans() {
    return pricingRepository.list();
  },

  // ---- Rentals / Payments / Damage / Audit (read models) ----
  async listRentals({ page = 1, limit = 20, status, studentId }) {
    const skip = (page - 1) * limit;
    const where = { ...(status ? { status } : {}), ...(studentId ? { studentId } : {}) };
    const [rentals, total] = await Promise.all([
      rentalRepository.listForAdmin({ skip, take: limit, where }),
      rentalRepository.countForAdmin(where),
    ]);
    return { rentals, total, page, limit };
  },

  async listPayments({ page = 1, limit = 20, status }) {
    const skip = (page - 1) * limit;
    const where = { ...(status ? { status } : {}) };
    const [payments, total] = await Promise.all([
      paymentRepository.list({ skip, take: limit, where }),
      paymentRepository.count(where),
    ]);
    return { payments, total, page, limit };
  },

  async listDamageReports({ page = 1, limit = 20, status }) {
    const skip = (page - 1) * limit;
    const where = { ...(status ? { status } : {}) };
    const [reports, total] = await Promise.all([
      damageRepository.list({ skip, take: limit, where }),
      damageRepository.count(where),
    ]);
    return { reports, total, page, limit };
  },

  async listAuditLogs({ page = 1, limit = 50, action, entity }) {
    const skip = (page - 1) * limit;
    const where = { ...(action ? { action } : {}), ...(entity ? { entity } : {}) };
    const [logs, total] = await Promise.all([
      auditRepository.list({ skip, take: limit, where }),
      auditRepository.count(where),
    ]);
    return { logs, total, page, limit };
  },

  async createRebalancingTask(actorId, data) {
    const task = await prisma.rebalancingTask.create({ data: { ...data, status: 'PENDING' } });
    await auditRepository.log({ actorId, action: 'ADMIN_ACTION', entity: 'RebalancingTask', entityId: task.id, metadata: { op: 'create_rebalancing_task' } });
    return task;
  },

  async listRebalancingTasks({ page = 1, limit = 20, status }) {
    const skip = (page - 1) * limit;
    const where = { ...(status ? { status } : {}) };
    const [tasks, total] = await Promise.all([
      prisma.rebalancingTask.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.rebalancingTask.count({ where }),
    ]);
    return { tasks, total, page, limit };
  },

  // ---- Analytics ----
  async analytics() {
    const [rentalCounts, umbrellaCounts, revenueAgg, activeRentals] = await Promise.all([
      prisma.rental.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.umbrella.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.payment.aggregate({
        where: { status: 'VERIFIED' },
        _sum: { amountPaise: true },
        _count: { _all: true },
      }),
      prisma.rental.count({ where: { status: { in: ['ACTIVE', 'OVERDUE'] } } }),
    ]);

    return {
      rentalsByStatus: Object.fromEntries(rentalCounts.map((r) => [r.status, r._count._all])),
      umbrellasByStatus: Object.fromEntries(umbrellaCounts.map((u) => [u.status, u._count._all])),
      totalRevenuePaise: revenueAgg._sum.amountPaise || 0,
      verifiedPaymentsCount: revenueAgg._count._all,
      currentlyActiveRentals: activeRentals,
    };
  },
};

module.exports = adminService;
