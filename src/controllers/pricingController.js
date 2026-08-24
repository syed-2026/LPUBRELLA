const asyncHandler = require('../utils/asyncHandler');
const pricingRepository = require('../repositories/pricingRepository');

const pricingController = {
  list: asyncHandler(async (req, res) => {
    const plans = await pricingRepository.listActive();
    res.status(200).json({ plans });
  }),
};

module.exports = pricingController;
