const { Prisma } = require('@prisma/client');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const env = require('../config/env');

// Translates known Prisma errors into AppError so callers get consistent,
// non-leaky responses instead of raw database error messages.
function normalizeError(err) {
  if (err instanceof AppError) return err;

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return AppError.conflict(
        `A record with this ${(err.meta && err.meta.target) || 'value'} already exists`,
        'DUPLICATE_RECORD'
      );
    }
    if (err.code === 'P2025') {
      return AppError.notFound('Record not found');
    }
    if (err.code === 'P2034') {
      // Serializable transaction conflict that wasn't already caught and
      // translated by the originating service - safe generic fallback.
      return AppError.conflict('Record was updated concurrently - please try again', 'CONCURRENT_UPDATE');
    }
  }

  return AppError.internal();
}

// Must be registered last, after all routes.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const normalized = normalizeError(err);

  logger.error('request_error', {
    path: req.originalUrl,
    method: req.method,
    statusCode: normalized.statusCode,
    code: normalized.code,
    message: normalized.message || (err && err.message) || 'unhandled error',
    userId: req.user && req.user.id,
    // Only include stack traces outside production, and never in the
    // HTTP response itself.
    ...(env.isProduction ? {} : { stack: err.stack }),
  });

  const body = {
    error: {
      code: normalized.code,
      message: normalized.message,
    },
  };

  if (normalized.details) {
    body.error.details = normalized.details;
  }

  res.status(normalized.statusCode).json(body);
}

module.exports = errorHandler;
