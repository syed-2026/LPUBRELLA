const asyncHandler = require('../utils/asyncHandler');
const notificationService = require('../services/notificationService');

const notificationController = {
  list: asyncHandler(async (req, res) => {
    const result = await notificationService.listForUser(req.user.id, req.query);
    res.status(200).json(result);
  }),

  markRead: asyncHandler(async (req, res) => {
    await notificationService.markRead(req.user.id, req.params.id);
    res.status(200).json({ success: true });
  }),
};

module.exports = notificationController;
