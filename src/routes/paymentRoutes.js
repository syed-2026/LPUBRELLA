const express = require('express');
const paymentController = require('../controllers/paymentController');
const authenticate = require('../middleware/authenticate');
const { requireStudent } = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { paymentLimiter } = require('../middleware/rateLimiters');
const { createOrderSchema, verifyPaymentSchema } = require('../validators/paymentValidators');

const router = express.Router();

// NOTE: /webhook is intentionally NOT defined here. It is mounted
// separately in app.js, before the global JSON body parser, with
// express.raw() so the payment provider's signature can be verified
// against the exact raw request bytes. See app.js for details.

router.post(
  '/create-order',
  authenticate,
  requireStudent,
  paymentLimiter,
  validate(createOrderSchema),
  paymentController.createOrder
);

router.post(
  '/verify',
  authenticate,
  requireStudent,
  paymentLimiter,
  validate(verifyPaymentSchema),
  paymentController.verify
);

module.exports = router;
