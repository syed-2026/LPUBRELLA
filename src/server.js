const app = require('./app');
const env = require('./config/env');
const prisma = require('./config/prisma');
const logger = require('./utils/logger');
const { scheduleOverdueRentalsJob } = require('./jobs/overdueRentalsJob');

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
