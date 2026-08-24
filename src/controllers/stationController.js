const asyncHandler = require('../utils/asyncHandler');
const stationService = require('../services/stationService');

const stationController = {
  list: asyncHandler(async (req, res) => {
    const result = await stationService.list(req.query);
    res.status(200).json(result);
  }),

  getById: asyncHandler(async (req, res) => {
    const station = await stationService.getById(req.params.id);
    res.status(200).json({ station });
  }),
};

module.exports = stationController;
