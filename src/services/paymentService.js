const { Prisma } = require('@prisma/client');
const prisma = require('../config/prisma');
const paymentRepository = require('../repositories/paymentRepository');
const rentalRepository = require('../repositories/rentalRepository');
const auditRepository = require('../repositories/auditRepository');
const rentalStateMachine = require('./rentalStateMachine');
const umbrellaStateMachine = require('./umbrellaStateMachine');
const provider = require('./payment/RazorpayProvider');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

function paymentTraceError(error) {
  return logger.sanitize({
    constructorName: error && error.constructor ? error.constructor.name : typeof error,
    statusCode: error && error.statusCode,
    code: error && error.code,
    message: error && error.message,
    error: error && error.error,
    responseData: error && error.response && error.response.data,
    stack: error && error.stack,
  });
}

// The direct-verify endpoint and the provider webhook can race each
// other for the same payment. SERIALIZABLE isolation ensures only one
// of them actually performs the activation; the other safely observes
// the already-VERIFIED result (see the idempotency check below) instead
// of double-activating.
async function runSerializable(fn) {
  try {
    return await prisma.$transaction(fn, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2034') {
      // Losing side of the race: re-read current state and return it
      // rather than surfacing an error for what is, from the caller's
      // perspective, a successful outcome achieved by the other request.
      const payment = await paymentRepository.findById(paymentId);
      if (payment) {
        return rentalRepository.findById(payment.rentalId);
      }
    }
    throw err;
  }
}

// Activates a rental + rents the umbrella atomically once payment is
// confirmed VERIFIED. Shared by both the direct-verify endpoint and the
// webhook handler so both paths are equally safe and idempotent.
async function activateRentalForVerifiedPayment(paymentId) {
  return runSerializable(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw AppError.notFound('Payment not found');

    // Idempotency: if this payment already led to activation, do nothing.
    if (payment.status === 'VERIFIED') {
      const rental = await tx.rental.findUnique({ where: { id: payment.rentalId } });
      return rental;
    }

    const rental = await tx.rental.findUnique({ where: { id: payment.rentalId } });
    if (!rental) throw AppError.notFound('Rental not found');

    // If rental is already ACTIVE (e.g. race between verify call and
    // webhook), treat as success without double-processing.
    if (rental.status === 'ACTIVE') {
      return rental;
    }

    rentalStateMachine.assertTransition(rental.status, 'ACTIVE');

    const umbrella = await tx.umbrella.findUnique({ where: { id: rental.umbrellaId } });
    if (!umbrella) throw AppError.notFound('Umbrella not found');

    // Re-verify umbrella is still AVAILABLE at activation time - it's
    // possible (though guarded against) that state drifted since the
    // rental was created.
    if (umbrella.status !== 'AVAILABLE') {
      throw AppError.conflict(
        `Cannot activate rental: umbrella is ${umbrella.status}`,
        'UMBRELLA_NOT_AVAILABLE'
      );
    }
    umbrellaStateMachine.assertTransition(umbrella.status, 'RENTED');

    const now = new Date();
    const dueAt = new Date(now.getTime() + rental.durationMinutesAtRental * 60 * 1000);

    const updatedRental = await tx.rental.update({
      where: { id: rental.id },
      data: { status: 'ACTIVE', startedAt: now, dueAt },
    });

    await tx.umbrella.update({ where: { id: umbrella.id }, data: { status: 'RENTED' } });

    await tx.payment.update({
      where: { id: payment.id },
      data: { status: 'VERIFIED', verifiedAt: now },
    });

    await auditRepository.logTx(tx, {
      actorId: rental.studentId,
      action: 'PAYMENT_VERIFIED',
      entity: 'Payment',
      entityId: payment.id,
    });
    await auditRepository.logTx(tx, {
      actorId: rental.studentId,
      action: 'RENTAL_ACTIVATED',
      entity: 'Rental',
      entityId: rental.id,
    });

    return updatedRental;
  });
}

const paymentService = {
  // Step 1: student selects a plan; backend computes price server-side
  // (never trusts a client-supplied amount) and opens a provider order.
  async createOrder({ rentalId, studentId }) {
    logger.info('[PAYMENT_CREATE_ORDER_TRACE] entered', { rentalId });
    let providerTraceLogged = false;
    try {
      const rental = await rentalRepository.findByIdTx(prisma, rentalId);
      logger.info('[PAYMENT_CREATE_ORDER_TRACE] rental lookup complete', { rentalFound: Boolean(rental), rentalId });
      if (!rental) throw AppError.notFound('Rental not found');
      if (rental.studentId !== studentId) {
        throw AppError.forbidden('This rental does not belong to you');
      }
      if (rental.status !== 'CREATED' && rental.status !== 'PAYMENT_PENDING') {
        throw AppError.conflict(`Cannot create payment order for rental in status ${rental.status}`);
      }

      let payment = await paymentRepository.findByRentalId(rentalId);
      logger.info('[PAYMENT_CREATE_ORDER_TRACE] payment lookup complete', { paymentFound: Boolean(payment), rentalId });

      const amountPaise = rental.priceAtRentalPaise; // server-computed, immutable snapshot

      if (!payment) {
        logger.info('[PAYMENT_CREATE_ORDER_TRACE] provider about to create order', { rentalId, amountPaise });
        let order;
        try {
          order = await provider.createOrder({
            amountPaise,
            receiptId: rental.id,
            notes: { rentalId: rental.id, studentId },
          });
          logger.info('[PAYMENT_CREATE_ORDER_TRACE] provider returned', { rentalId, providerOrderIdConfigured: Boolean(order && order.providerOrderId) });
        } catch (error) {
          providerTraceLogged = true;
          logger.error('[PAYMENT_CREATE_ORDER_TRACE] provider threw', { rentalId, ...paymentTraceError(error) });
          throw error;
        }
        payment = await paymentRepository.create({
          rentalId,
          provider: 'razorpay',
          providerOrderId: order.providerOrderId,
          amountPaise,
          status: 'CREATED',
        });
      }

      if (rental.status === 'CREATED') {
        rentalStateMachine.assertTransition(rental.status, 'PAYMENT_PENDING');
        await rentalRepository.update(rental.id, { status: 'PAYMENT_PENDING' });
      }

      await auditRepository.log({
        actorId: studentId,
        action: 'PAYMENT_CREATED',
        entity: 'Payment',
        entityId: payment.id,
        metadata: { amountPaise },
      });

      return {
        paymentId: payment.id,
        providerOrderId: payment.providerOrderId,
        amountPaise,
        currency: 'INR',
        providerKey: env.payment.key || process.env.PAYMENT_KEY || null,
      };
    } catch (error) {
      if (!providerTraceLogged) {
        logger.error('[PAYMENT_CREATE_ORDER_TRACE] failed', { rentalId, ...paymentTraceError(error) });
      }
      throw error;
    }
  },

  // Step 2: client reports it completed payment. Backend independently
  // re-verifies with the provider before trusting anything - this is
  // the "never trust frontend success" checkpoint.
  async verifyPayment({ rentalId, providerOrderId, providerPaymentId, providerSignature, studentId }) {
    const rental = await rentalRepository.findByIdTx(prisma, rentalId);
    if (!rental) throw AppError.notFound('Rental not found');
    if (rental.studentId !== studentId) {
      throw AppError.forbidden('This rental does not belong to you');
    }

    const payment = await paymentRepository.findByRentalId(rentalId);
    if (!payment) throw AppError.notFound('Payment order not found for this rental');
    if (payment.providerOrderId !== providerOrderId) {
      throw AppError.badRequest('Order ID mismatch', 'ORDER_ID_MISMATCH');
    }

    // Idempotent: already verified -> return current state without
    // re-processing.
    if (payment.status === 'VERIFIED') {
      return rentalRepository.findById(rentalId);
    }

    const result = await provider.verifyPayment({ providerOrderId, providerPaymentId, providerSignature });

    if (!result.verified) {
      await paymentRepository.update(payment.id, {
        status: 'FAILED',
        failureReason: 'Signature verification failed',
      });
      await auditRepository.log({
        actorId: studentId,
        action: 'PAYMENT_FAILED',
        entity: 'Payment',
        entityId: payment.id,
      });
      throw AppError.badRequest('Payment verification failed', 'PAYMENT_VERIFICATION_FAILED');
    }

    await paymentRepository.update(payment.id, { providerPaymentId, status: 'PENDING' });

    const activatedRental = await activateRentalForVerifiedPayment(payment.id);
    return activatedRental;
  },

  // Step 3 (alternative/parallel path): provider webhook, independently
  // verified via signature, and idempotent by providerPaymentId.
  async handleWebhook({ rawBody, signatureHeader }) {
    const { valid, event } = await provider.parseWebhook({ rawBody, signatureHeader });
    if (!valid || !event) {
      throw AppError.badRequest('Invalid webhook signature', 'INVALID_WEBHOOK_SIGNATURE');
    }

    // Normalized shape expected: { event: 'payment.captured', payload: { order_id, payment_id } }
    const eventType = event.event;
    const orderId = event.payload && event.payload.order_id;
    const paymentProviderId = event.payload && event.payload.payment_id;

    if (!orderId) {
      // Nothing actionable; acknowledge without error to prevent retries storm.
      return { processed: false };
    }

    const payment = await paymentRepository.findByProviderOrderId(orderId);
    if (!payment) {
      return { processed: false };
    }

    // Idempotency guard: if a payment with this providerPaymentId was
    // already recorded as VERIFIED, do nothing further.
    if (payment.status === 'VERIFIED') {
      return { processed: true, idempotent: true };
    }

    if (eventType === 'payment.captured' || eventType === 'payment.authorized') {
      await paymentRepository.update(payment.id, { providerPaymentId: paymentProviderId, status: 'PENDING' });
      await activateRentalForVerifiedPayment(payment.id);
      return { processed: true };
    }

    if (eventType === 'payment.failed') {
      await paymentRepository.update(payment.id, { status: 'FAILED', failureReason: 'Provider reported failure' });
      await auditRepository.log({ action: 'PAYMENT_FAILED', entity: 'Payment', entityId: payment.id });
      return { processed: true };
    }

    return { processed: false };
  },

  activateRentalForVerifiedPayment,
};

module.exports = paymentService;
