require('dotenv').config();

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    // Fail fast at boot rather than later with a confusing runtime error.
    // eslint-disable-next-line no-console
    console.error(`[config] Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}


const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),

  databaseUrl: required('DATABASE_URL'),

  jwt: {
    secret: required('JWT_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  payment: {
    provider: process.env.PAYMENT_PROVIDER || 'razorpay',
    key: process.env.PAYMENT_KEY || '',
    secret: process.env.PAYMENT_SECRET || '',
    webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || '',
  },

  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  returnTokenTtlSeconds: parseInt(process.env.RETURN_TOKEN_TTL_SECONDS || '30', 10),

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '10', 10),
    qrMax: parseInt(process.env.QR_RATE_LIMIT_MAX || '20', 10),
    paymentMax: parseInt(process.env.PAYMENT_RATE_LIMIT_MAX || '15', 10),
  },

  isProduction: (process.env.NODE_ENV || 'development') === 'production',
  isTest: (process.env.NODE_ENV || 'development') === 'test',
};

module.exports = env;
