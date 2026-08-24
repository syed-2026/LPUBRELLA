const cron = require('node-cron');
const prisma = require('../config/prisma');
const rentalRepository = require('../repositories/rentalRepository');
const rentalStateMachine = require('../services/rentalStateMachine');
const auditRepository = require('../repositories/auditRepository');
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

// Identifies ACTIVE rentals whose planned duration has elapsed and
// transitions them to OVERDUE. Deliberately does NOT charge any late
// fee - that logic is intentionally left as a configurable future
// extension point (see README assumptions).
async function runOverdueSweep() {
  const now = new Date();
  const expired = await rentalRepository.findExpiredActive(now);

  for (const rental of expired) {
    try {
      await prisma.$transaction(async (tx) => {
        const fresh = await tx.rental.findUnique({ where: { id: rental.id } });
        if (!fresh || fresh.status !== 'ACTIVE') return; // already handled/raced

        rentalStateMachine.assertTransition(fresh.status, 'OVERDUE');
        await tx.rental.update({ where: { id: fresh.id }, data: { status: 'OVERDUE' } });

        await auditRepository.logTx(tx, {
          action: 'RENTAL_MARKED_OVERDUE',
          entity: 'Rental',
          entityId: fresh.id,
        });
      });

      await notificationService.create({
        userId: rental.studentId,
        type: 'RENTAL_OVERDUE',
        title: 'Umbrella rental overdue',
        message:
          'Your umbrella rental has passed its included duration. Please return it at any participating station as soon as possible.',
      });
    } catch (err) {
      logger.error('overdue_sweep_failed_for_rental', { rentalId: rental.id, error: err.message });
    }
  }

  if (expired.length > 0) {
    logger.info('overdue_sweep_completed', { count: expired.length });
  }

  return expired.length;
}

// Runs every minute. Adjust the cron expression for production load
// as needed (e.g. every 5 minutes is likely sufficient in practice).
function scheduleOverdueRentalsJob() {
  cron.schedule('* * * * *', () => {
    runOverdueSweep().catch((err) => logger.error('overdue_sweep_error', { error: err.message }));
  });
}

module.exports = { scheduleOverdueRentalsJob, runOverdueSweep };
