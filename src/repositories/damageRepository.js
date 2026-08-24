const prisma = require('../config/prisma');

const damageRepository = {
  create: (data) => prisma.damageReport.create({ data }),
  list: ({ skip, take, where }) =>
    prisma.damageReport.findMany({
      skip,
      take,
      where,
      orderBy: { createdAt: 'desc' },
      include: { umbrella: true, reportedBy: true },
    }),
  count: (where) => prisma.damageReport.count({ where }),
  update: (id, data) => prisma.damageReport.update({ where: { id }, data }),
};

module.exports = damageRepository;
