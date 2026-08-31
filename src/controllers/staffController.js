const asyncHandler = require('../utils/asyncHandler');
const staffService = require('../services/staffService');

const staffController = {
  dashboard: asyncHandler(async (req, res) => {
    const result = await staffService.dashboard(req.user);
    res.status(200).json(result);
  }),

  rentals: asyncHandler(async (req, res) => {
    const result = await staffService.recentRentals(req.user, req.query);
    res.status(200).json(result);
  }),

  inventory: asyncHandler(async (req, res) => {
    const result = await staffService.inventory(req.user);
    res.status(200).json(result);
  }),

  reportDamage: asyncHandler(async (req, res) => {
    const report = await staffService.reportDamage(req.user, req.body);
    res.status(201).json({ report });
  }),

  reportMissing: asyncHandler(async (req, res) => {
    const umbrella = await staffService.reportMissing(req.user, req.body);
    res.status(200).json({ umbrella });
  }),
};

module.exports = staffController;
