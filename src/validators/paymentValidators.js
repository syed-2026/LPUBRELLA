const { z } = require('zod');
const { uuid } = require('./common');

const createOrderSchema = z.object({
  rentalId: uuid,
});

// The client only ever confirms which order/payment it attempted;
// the backend independently re-verifies against the provider/webhook
// before trusting any success signal (see paymentService).
const verifyPaymentSchema = z.object({
  rentalId: uuid,
  providerOrderId: z.string().min(1),
  providerPaymentId: z.string().min(1),
  providerSignature: z.string().min(1),
});

module.exports = { createOrderSchema, verifyPaymentSchema };
