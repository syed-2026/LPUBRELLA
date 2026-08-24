const asyncHandler = require('../utils/asyncHandler');
const rentalService = require('../services/rentalService');

const rentalController = {
  create: asyncHandler(async (req, res) => {
    const rental = await rentalService.createRental({
      studentId: req.user.id,
      umbrellaId: req.body.umbrellaId,
      pricingPlanId: req.body.pricingPlanId,
    });
    res.status(201).json({ rental });
  }),

  active: asyncHandler(async (req, res) => {
    const rental = await rentalService.getActiveForStudent(req.user.id);
    res.status(200).json({ rental });
  }),

  history: asyncHandler(async (req, res) => {
    const result = await rentalService.history(req.user.id, req.query);
    res.status(200).json(result);
  }),

  getById: asyncHandler(async (req, res) => {
    const rental = await rentalService.getById(req.params.id, req.user);
    res.status(200).json({ rental });
  }),
};

module.exports = rentalController;
