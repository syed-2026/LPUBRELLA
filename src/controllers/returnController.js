const asyncHandler = require('../utils/asyncHandler');
const returnService = require('../services/returnService');

const returnController = {
  generateToken: asyncHandler(async (req, res) => {
    const result = await returnService.generateReturnToken({
      rentalId: req.body.rentalId,
      staff: req.user,
    });
    res.status(201).json(result);
  }),

  confirm: asyncHandler(async (req, res) => {
    const result = await returnService.confirmReturn({
      rawToken: req.body.token,
      studentId: req.user.id,
    });
    res.status(200).json(result);
  }),
};

module.exports = returnController;
