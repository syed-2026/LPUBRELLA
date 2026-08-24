const { z } = require('zod');
const { uuid, qrIdentifier } = require('./common');

const validateUmbrellaSchema = z.object({
  qrIdentifier,
});

const createRentalSchema = z.object({
  umbrellaId: uuid,
  pricingPlanId: uuid,
});

module.exports = { validateUmbrellaSchema, createRentalSchema };
