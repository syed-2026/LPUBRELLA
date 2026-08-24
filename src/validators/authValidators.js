const { z } = require('zod');
const { lpuId, email, password } = require('./common');

// Only STUDENT self-registration is exposed publicly. Staff/Admin
// accounts are provisioned by an Admin via /api/v1/admin routes.
const registerSchema = z.object({
  lpuId,
  name: z.string().trim().min(2).max(100),
  email,
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{7,15}$/)
    .optional(),
  password,
});

const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

module.exports = { registerSchema, loginSchema, refreshSchema };
