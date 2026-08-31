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

const staffRentalsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().trim().optional(),
  search: z.string().trim().max(100).optional(),
});

const umbrellaLookupQuerySchema = z.object({
  umbrellaCode: z
    .string()
    .trim()
    .min(3, 'Umbrella ID is required')
    .max(30, 'Umbrella ID is too long'),
});

module.exports = {
  damageReportSchema,
  missingReportSchema,
  staffRentalsQuerySchema,
  umbrellaLookupQuerySchema,
};
