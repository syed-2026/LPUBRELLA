const prisma = require('../config/prisma');

const pricingRepository = {
  findById: (id) => prisma.pricingPlan.findUnique({ where: { id } }),
  listActive: () =>
    prisma.pricingPlan.findMany({ where: { active: true }, orderBy: { durationMinutes: 'asc' } }),
  list: () => prisma.pricingPlan.findMany({ orderBy: { durationMinutes: 'asc' } }),
  create: (data) => prisma.pricingPlan.create({ data }),
  update: (id, data) => prisma.pricingPlan.update({ where: { id }, data }),
};

module.exports = pricingRepository;
