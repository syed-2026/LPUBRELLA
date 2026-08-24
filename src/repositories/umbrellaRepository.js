const prisma = require('../config/prisma');

const umbrellaRepository = {
  findById: (id) => prisma.umbrella.findUnique({ where: { id } }),
  findByQrIdentifier: (qrIdentifier) =>
    prisma.umbrella.findUnique({ where: { qrIdentifier }, include: { currentStation: true } }),
  findByPublicCode: (publicCode) => prisma.umbrella.findUnique({ where: { publicCode } }),
  list: ({ skip, take, where } = {}) =>
    prisma.umbrella.findMany({ skip, take, where, orderBy: { publicCode: 'asc' } }),
  count: (where) => prisma.umbrella.count({ where }),
  create: (data) => prisma.umbrella.create({ data }),
  update: (id, data) => prisma.umbrella.update({ where: { id }, data }),

  // Convenience for the tx-scoped update inside the return transaction.
  updateTx: (tx, id, data) => tx.umbrella.update({ where: { id }, data }),
};

module.exports = umbrellaRepository;
