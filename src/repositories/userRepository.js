const prisma = require('../config/prisma');

const userRepository = {
  findByEmail: (email) => prisma.user.findUnique({ where: { email } }),
  findByLpuId: (lpuId) => prisma.user.findUnique({ where: { lpuId } }),
  findById: (id) => prisma.user.findUnique({ where: { id } }),
  create: (data) => prisma.user.create({ data }),
  update: (id, data) => prisma.user.update({ where: { id }, data }),
  list: ({ skip, take, where }) =>
    prisma.user.findMany({ skip, take, where, orderBy: { createdAt: 'desc' } }),
  count: (where) => prisma.user.count({ where }),
};

module.exports = userRepository;
