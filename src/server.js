const app = require('./app');
const env = require('./config/env');
const prisma = require('./config/prisma');
const logger = require('./utils/logger');
const { scheduleOverdueRentalsJob } = require('./jobs/overdueRentalsJob');
const paymentProvider = require('./services/payment/RazorpayProvider');

function getGitCommit() {
  return process.env.RAILWAY_GIT_COMMIT_SHA
    || process.env.RAILWAY_GIT_COMMIT
    || process.env.GIT_COMMIT_SHA
    || 'unknown';
}

logger.info('[BOOT_DIAGNOSTICS]', {
  NODE_ENV: env.nodeEnv,
  isProduction: env.isProduction,
  isTest: env.isTest,
  paymentProvider: env.payment.provider,
  paymentKeyConfigured: Boolean(env.payment.key),
  paymentSecretConfigured: Boolean(env.payment.secret),
  paymentWebhookSecretConfigured: Boolean(env.payment.webhookSecret),
  sandboxMode: Boolean(paymentProvider.sandboxMode),
  razorpayVersion: require('razorpay/package.json').version,
  gitCommit: getGitCommit(),
});

const server = app.listen(env.port, () => {
  logger.info('server_started', { port: env.port, env: env.nodeEnv });

  // The overdue-rentals sweep is not needed while running the test
  // suite (tests manage time-based transitions explicitly).
  if (!env.isTest) {
    scheduleOverdueRentalsJob();
    logger.info('overdue_rentals_job_scheduled');
  }
});

async function shutdown(signal) {
  logger.info('shutdown_initiated', { signal });
  server.close(async () => {
    await prisma.$disconnect();
    logger.info('shutdown_complete');
    process.exit(0);
  });

  // Force-exit if graceful shutdown hangs.
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('unhandled_rejection', { reason: reason && reason.message });
});

module.exports = server;
