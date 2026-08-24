const { z } = require('zod');
const { uuid, lpuId, email, password } = require('./common');

const createStaffOrAdminSchema = z.object({
  lpuId,
  name: z.string().trim().min(2).max(100),
  email,
  phone: z.string().trim().optional(),
  password,
  role: z.enum(['STAFF', 'ADMIN']),
  assignedStationId: uuid.optional(),
});

const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'INACTIVE']).optional(),
  assignedStationId: uuid.nullable().optional(),
});

const createStationSchema = z.object({
  code: z.string().trim().min(2).max(20),
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().max(1000).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  capacity: z.number().int().min(1).max(1000),
  openingTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm 24h format'),
  closingTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm 24h format'),
});

const updateStationSchema = createStationSchema.partial().extend({
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']).optional(),
});

const createUmbrellaSchema = z.object({
  publicCode: z.string().trim().min(3).max(30),
  qrIdentifier: z.string().trim().min(3).max(50),
  currentStationId: uuid,
  condition: z.enum(['GOOD', 'FAIR', 'DAMAGED']).default('GOOD'),
});

const updateUmbrellaSchema = z.object({
  status: z.enum(['AVAILABLE', 'RENTED', 'MAINTENANCE', 'MISSING', 'LOST', 'RETIRED']).optional(),
  condition: z.enum(['GOOD', 'FAIR', 'DAMAGED']).optional(),
  currentStationId: uuid.optional(),
});

const createPricingPlanSchema = z.object({
  name: z.string().trim().min(2).max(50),
  durationMinutes: z.number().int().min(1).max(60 * 24 * 7),
  pricePaise: z.number().int().min(0),
  active: z.boolean().default(true),
});

const updatePricingPlanSchema = createPricingPlanSchema.partial();

module.exports = {
  createStaffOrAdminSchema,
  updateUserSchema,
  createStationSchema,
  updateStationSchema,
  createUmbrellaSchema,
  updateUmbrellaSchema,
  createPricingPlanSchema,
  updatePricingPlanSchema,
};
