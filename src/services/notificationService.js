const prisma = require('../config/prisma');

const notificationService = {
  create: ({ userId, type, title, message }) =>
    prisma.notification.create({ data: { userId, type, title, message } }),

  listForUser: async (userId, { page = 1, limit = 20 } = {}) => {
    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where: { userId } }),
    ]);
    return { notifications, total, page, limit };
  },

  markRead: (userId, id) =>
    prisma.notification.updateMany({ where: { id, userId }, data: { read: true } }),
};

module.exports = notificationService;
