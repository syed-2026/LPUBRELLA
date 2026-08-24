const prisma = require('../config/prisma');

const stationRepository = {
  findById: (id) => prisma.station.findUnique({ where: { id } }),
  findByCode: (code) => prisma.station.findUnique({ where: { code } }),
  list: ({ skip, take, where } = {}) =>
    prisma.station.findMany({ skip, take, where, orderBy: { name: 'asc' } }),
  count: (where) => prisma.station.count({ where }),
  create: (data) => prisma.station.create({ data }),
  update: (id, data) => prisma.station.update({ where: { id }, data }),

  // Inventory is computed live from umbrella rows rather than trusted
  // counters, per spec ("Do not rely only on manually stored counts").
  inventoryCounts: async (stationId) => {
    const grouped = await prisma.umbrella.groupBy({
      by: ['status'],
      where: { currentStationId: stationId },
      _count: { _all: true },
    });
    const counts = {
      AVAILABLE: 0,
      RENTED: 0,
      MAINTENANCE: 0,
      MISSING: 0,
      LOST: 0,
      RETIRED: 0,
    };
    for (const row of grouped) {
      counts[row.status] = row._count._all;
    }
    return counts;
  },
};

module.exports = stationRepository;
