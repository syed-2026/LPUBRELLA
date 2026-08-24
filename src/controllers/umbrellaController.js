const asyncHandler = require('../utils/asyncHandler');
const umbrellaService = require('../services/umbrellaService');

const umbrellaController = {
  validate: asyncHandler(async (req, res) => {
    const umbrella = await umbrellaService.validateForRental(req.body.qrIdentifier);
    res.status(200).json({
      umbrella: {
        id: umbrella.id,
        publicCode: umbrella.publicCode,
        status: umbrella.status,
        condition: umbrella.condition,
        station: umbrella.currentStation && {
          id: umbrella.currentStation.id,
          name: umbrella.currentStation.name,
          code: umbrella.currentStation.code,
        },
      },
    });
  }),
};

module.exports = umbrellaController;
