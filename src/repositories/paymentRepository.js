const prisma = require('../config/prisma');

const paymentRepository = {
  findById: (id) => prisma.payment.findUnique({ where: { id } }),
  findByRentalId: (rentalId) => prisma.payment.findUnique({ where: { rentalId } }),
  findByProviderOrderId: (providerOrderId) => prisma.payment.findUnique({ where: { providerOrderId } }),
  findByProviderPaymentId: (providerPaymentId) =>
    prisma.payment.findUnique({ where: { providerPaymentId } }),
  create: (data) => prisma.payment.create({ data }),
  update: (id, data) => prisma.payment.update({ where: { id }, data }),
  updateTx: (tx, id, data) => tx.payment.update({ where: { id }, data }),
  list: ({ skip, take, where }) =>
    prisma.payment.findMany({ skip, take, where, orderBy: { createdAt: 'desc' } }),
  count: (where) => prisma.payment.count({ where }),
};

module.exports = paymentRepository;
