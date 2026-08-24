const prisma = require('../config/prisma');

const auditRepository = {
  log: (data) => prisma.auditLog.create({ data }),
  logTx: (tx, data) => tx.auditLog.create({ data }),
  list: ({ skip, take, where }) =>
    prisma.auditLog.findMany({
      skip,
      take,
      where,
      orderBy: { createdAt: 'desc' },
      include: { actor: { select: { id: true, name: true, email: true, role: true } } },
    }),
  count: (where) => prisma.auditLog.count({ where }),
};

module.exports = auditRepository;
