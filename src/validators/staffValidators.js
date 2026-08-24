const { z } = require('zod');
const { uuid } = require('./common');

const damageReportSchema = z.object({
  umbrellaId: uuid,
  severity: z.enum(['MINOR', 'MAJOR', 'UNUSABLE']),
  description: z.string().trim().min(3).max(1000),
});

const missingReportSchema = z.object({
  umbrellaId: uuid,
  description: z.string().trim().min(3).max(1000).optional(),
});

module.exports = { damageReportSchema, missingReportSchema };
