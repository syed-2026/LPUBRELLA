const { z } = require('zod');
const { uuid, returnToken } = require('./common');

const generateReturnTokenSchema = z.object({
  rentalId: uuid,
});

const confirmReturnSchema = z.object({
  token: returnToken,
});

module.exports = { generateReturnTokenSchema, confirmReturnSchema };
