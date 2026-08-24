const request = require('supertest');
const crypto = require('crypto');
const { app, createUser, loginAs, createStation, createUmbrella, createPlan } = require('./factories');
const prisma = require('../src/config/prisma');

async function setupRental() {
  const { user } = await createUser({ role: 'STUDENT' });
  const token = await loginAs(user);
  const station = await createStation();
  const umbrella = await createUmbrella(station.id);
  const plan = await createPlan({ pricePaise: 1000 });

  const rentalRes = await request(app)
    .post('/api/v1/rentals')
    .set('Authorization', `Bearer ${token}`)
    .send({ umbrellaId: umbrella.id, pricingPlanId: plan.id });

  return { user, token, station, umbrella, plan, rental: rentalRes.body.rental };
}

function mockSignature(orderId, paymentId, secret = 'mock_secret') {
  return crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
}

describe('Payments', () => {
  test('6. Successful payment activates rental', async () => {
    const { token, rental, umbrella } = await setupRental();

    const orderRes = await request(app)
      .post('/api/v1/payments/create-order')
      .set('Authorization', `Bearer ${token}`)
      .send({ rentalId: rental.id });
    expect(orderRes.status).toBe(201);

    const providerPaymentId = 'pay_mock_123';
    const signature = mockSignature(orderRes.body.providerOrderId, providerPaymentId);

    const verifyRes = await request(app)
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({
        rentalId: rental.id,
        providerOrderId: orderRes.body.providerOrderId,
        providerPaymentId,
        providerSignature: signature,
      });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.rental.status).toBe('ACTIVE');

    const dbUmbrella = await prisma.umbrella.findUnique({ where: { id: umbrella.id } });
    expect(dbUmbrella.status).toBe('RENTED');
  });

  test('7. Failed payment (bad signature) does not activate rental', async () => {
    const { token, rental } = await setupRental();

    const orderRes = await request(app)
      .post('/api/v1/payments/create-order')
      .set('Authorization', `Bearer ${token}`)
      .send({ rentalId: rental.id });

    const verifyRes = await request(app)
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({
        rentalId: rental.id,
        providerOrderId: orderRes.body.providerOrderId,
        providerPaymentId: 'pay_mock_bad',
        providerSignature: 'totally-wrong-signature',
      });

    expect(verifyRes.status).toBe(400);
    expect(verifyRes.body.error.code).toBe('PAYMENT_VERIFICATION_FAILED');

    const dbRental = await prisma.rental.findUnique({ where: { id: rental.id } });
    expect(dbRental.status).not.toBe('ACTIVE');
  });

  test('18. Payment webhook is idempotent', async () => {
    const { token, rental } = await setupRental();

    const orderRes = await request(app)
      .post('/api/v1/payments/create-order')
      .set('Authorization', `Bearer ${token}`)
      .send({ rentalId: rental.id });

    const webhookPayload = JSON.stringify({
      event: 'payment.captured',
      payload: { order_id: orderRes.body.providerOrderId, payment_id: 'pay_webhook_1' },
    });
    const signature = crypto.createHmac('sha256', 'mock_webhook_secret').update(webhookPayload).digest('hex');

    const first = await request(app)
      .post('/api/v1/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', signature)
      .send(webhookPayload);
    expect(first.status).toBe(200);

    const second = await request(app)
      .post('/api/v1/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', signature)
      .send(webhookPayload);
    expect(second.status).toBe(200);
    expect(second.body.idempotent).toBe(true);

    const dbRental = await prisma.rental.findUnique({ where: { id: rental.id } });
    expect(dbRental.status).toBe('ACTIVE');
  });
});
