const asyncHandler = require('../utils/asyncHandler');
const paymentService = require('../services/paymentService');

const paymentController = {
  createOrder: asyncHandler(async (req, res) => {
    const result = await paymentService.createOrder({
      rentalId: req.body.rentalId,
      studentId: req.user.id,
    });
    res.status(201).json(result);
  }),

  verify: asyncHandler(async (req, res) => {
    const rental = await paymentService.verifyPayment({
      rentalId: req.body.rentalId,
      providerOrderId: req.body.providerOrderId,
      providerPaymentId: req.body.providerPaymentId,
      providerSignature: req.body.providerSignature,
      studentId: req.user.id,
    });
    res.status(200).json({ rental });
  }),

  // Note: this route must be mounted with a raw body parser (see app.js)
  // so the provider's signature can be verified against the exact bytes
  // received, before any JSON parsing/mutation occurs.
  webhook: asyncHandler(async (req, res) => {
    const signatureHeader = req.headers['x-razorpay-signature'] || req.headers['x-webhook-signature'];
    const result = await paymentService.handleWebhook({
      rawBody: req.body, // Buffer, thanks to express.raw()
      signatureHeader,
    });
    // Always 200 on a validly-signed, parseable webhook so the provider
    // doesn't retry unnecessarily. Invalid signatures throw and produce 400.
    res.status(200).json(result);
  }),
};

module.exports = paymentController;
