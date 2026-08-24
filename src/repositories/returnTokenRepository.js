const prisma = require('../config/prisma');

const returnTokenRepository = {
  create: (data) => prisma.returnToken.create({ data }),
  findByTokenHash: (tokenHash) => prisma.returnToken.findUnique({ where: { tokenHash } }),
  findByTokenHashTx: (tx, tokenHash) => tx.returnToken.findUnique({ where: { tokenHash } }),
  markUsedTx: (tx, id, usedAt) =>
    tx.returnToken.update({ where: { id }, data: { used: true, usedAt } }),
};

module.exports = returnTokenRepository;
