const rateLimit = require('express-rate-limit');
const env = require('../config/env');

// Shared handler so rate-limited responses match our standard error shape.
function limitHandler(code) {
  return (req, res) => {
    res.status(429).json({
      error: { code, message: 'Too many requests, please try again shortly' },
    });
  };
}

const authLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.isTest,
  handler: limitHandler('AUTH_RATE_LIMITED'),
});

// Applies to umbrella QR validation/scan endpoints.
const qrLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.qrMax,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.isTest,
  handler: limitHandler('QR_RATE_LIMITED'),
});

// Applies to Return QR generation/confirmation endpoints specifically,
// since these are highly sensitive (single-use, short-lived tokens).
const returnLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.qrMax,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.isTest,
  handler: limitHandler('RETURN_RATE_LIMITED'),
});

const paymentLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.paymentMax,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.isTest,
  handler: limitHandler('PAYMENT_RATE_LIMITED'),
});

const globalLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.isTest,
  handler: limitHandler('RATE_LIMITED'),
});

module.exports = {
  authLimiter,
  qrLimiter,
  returnLimiter,
  paymentLimiter,
  globalLimiter,
};
