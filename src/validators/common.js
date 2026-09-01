const { z } = require('zod');

const uuid = z.string().uuid('Must be a valid UUID');

const lpuId = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9]{6,15}$/, 'LPU ID must be 6-15 alphanumeric characters');

const email = z
  .string()
  .trim()
  .toLowerCase()
  .email('Must be a valid email address');

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/[0-9]/, 'Password must contain a number');

const qrIdentifier = z
  .string()
  .trim()
  .regex(/^UMB-[A-Za-z0-9]{4,10}$/, 'Invalid umbrella QR identifier format');

const returnToken = z.string().trim().min(20).max(512);

const pagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
const adminUsersQuery = pagination.extend({
  role: z.enum(['STUDENT', 'STAFF', 'ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'INACTIVE']).optional(),
});

module.exports = { uuid, lpuId, email, password, qrIdentifier, returnToken, pagination, adminUsersQuery };
