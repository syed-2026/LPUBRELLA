const request = require('supertest');
const crypto = require('crypto');
const {
  app,
  createUser,
  loginAs,
  createStation,
  createUmbrella,
  createPlan,
} = require('./factories');
const prisma = require('../src/config/prisma');
const { hashToken } = require('../src/utils/secureToken');

function mockSignature(orderId, paymentId, secret = 'mock_secret') {
  return crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
}

async function setupActiveRental() {
  const { user: student } = await createUser({ role: 'STUDENT' });
  const studentToken = await loginAs(student);
  const station = await createStation();
  const { user: staff } = await createUser({ role: 'STAFF', assignedStationId: station.id });
  const staffToken = await loginAs(staff);
  const umbrella = await createUmbrella(station.id);
  const plan = await createPlan();

  const rentalRes = await request(app)
    .post('/api/v1/rentals')
    .set('Authorization', `Bearer ${studentToken}`)
    .send({ umbrellaId: umbrella.id, pricingPlanId: plan.id });
  const rental = rentalRes.body.rental;

  const orderRes = await request(app)
    .post('/api/v1/payments/create-order')
    .set('Authorization', `Bearer ${studentToken}`)
    .send({ rentalId: rental.id });

  const providerPaymentId = 'pay_mock_return_flow';
  const signature = mockSignature(orderRes.body.providerOrderId, providerPaymentId);

  await request(app)
    .post('/api/v1/payments/verify')
    .set('Authorization', `Bearer ${studentToken}`)
    .send({
      rentalId: rental.id,
      providerOrderId: orderRes.body.providerOrderId,
      providerPaymentId,
      providerSignature: signature,
    });

  return { student, studentToken, staff, staffToken, station, umbrella, plan, rentalId: rental.id };
}

describe('Return flow', () => {
  test('8. Invalid Return QR is rejected', async () => {
    const { studentToken } = await setupActiveRental();

    const res = await request(app)
      .post('/api/v1/returns/confirm')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ token: 'not-a-real-token-that-exists-anywhere-1234' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_RETURN_TOKEN');
  });

  test('9. Expired Return QR is rejected', async () => {
    const { studentToken, staff, rentalId } = await setupActiveRental();

    const rawToken = 'raw-expired-token-value-1234567890';
    await prisma.returnToken.create({
      data: {
        tokenHash: hashToken(rawToken),
        rentalId,
        studentId: (await prisma.rental.findUnique({ where: { id: rentalId } })).studentId,
        staffId: staff.id,
        stationId: staff.assignedStationId,
        expiresAt: new Date(Date.now() - 1000), // already expired
      },
    });

    const res = await request(app)
      .post('/api/v1/returns/confirm')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ token: rawToken });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('RETURN_TOKEN_EXPIRED');
  });

  test('10. Used Return QR is rejected (single-use)', async () => {
    const { studentToken, staffToken, rentalId } = await setupActiveRental();

    const tokenRes = await request(app)
      .post('/api/v1/returns/token')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ rentalId });
    expect(tokenRes.status).toBe(201);
    const rawToken = tokenRes.body.token;

    const first = await request(app)
      .post('/api/v1/returns/confirm')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ token: rawToken });
    expect(first.status).toBe(200);

    const second = await request(app)
      .post('/api/v1/returns/confirm')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ token: rawToken });
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('RETURN_TOKEN_USED');
  });

  test('11. Wrong-station Return QR is rejected', async () => {
    const { studentToken, rentalId, staff } = await setupActiveRental();

    // Simulate a token that references a station the staff is no longer
    // assigned to (e.g. staff got reassigned after token creation).
    const rawToken = 'raw-wrong-station-token-abcdefghi';
    const otherStation = await createStation();
    await prisma.returnToken.create({
      data: {
        tokenHash: hashToken(rawToken),
        rentalId,
        studentId: (await prisma.rental.findUnique({ where: { id: rentalId } })).studentId,
        staffId: staff.id,
        stationId: otherStation.id, // mismatched vs staff.assignedStationId
        expiresAt: new Date(Date.now() + 30000),
      },
    });

    const res = await request(app)
      .post('/api/v1/returns/confirm')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ token: rawToken });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('STAFF_STATION_MISMATCH');
  });

  test('12. Student without active rental cannot return', async () => {
    const { user: student } = await createUser({ role: 'STUDENT' });
    const studentToken = await loginAs(student);

    const res = await request(app)
      .post('/api/v1/returns/confirm')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ token: 'some-token-that-does-not-belong-to-this-student' });

    expect(res.status).toBe(400); // token itself doesn't exist -> INVALID_RETURN_TOKEN
  });

  test('13 & 14. Successful return completes rental and frees umbrella', async () => {
    const { studentToken, staffToken, rentalId, umbrella } = await setupActiveRental();

    const tokenRes = await request(app)
      .post('/api/v1/returns/token')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ rentalId });

    const confirmRes = await request(app)
      .post('/api/v1/returns/confirm')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ token: tokenRes.body.token });

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.rental.status).toBe('COMPLETED');
    expect(confirmRes.body.umbrella.status).toBe('AVAILABLE');

    const dbUmbrella = await prisma.umbrella.findUnique({ where: { id: umbrella.id } });
    expect(dbUmbrella.status).toBe('AVAILABLE');
  });

  test('15. Duplicate return cannot occur (double confirm race)', async () => {
    const { studentToken, staffToken, rentalId } = await setupActiveRental();

    const tokenRes = await request(app)
      .post('/api/v1/returns/token')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ rentalId });

    const results = await Promise.all([
      request(app)
        .post('/api/v1/returns/confirm')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ token: tokenRes.body.token }),
      request(app)
        .post('/api/v1/returns/confirm')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ token: tokenRes.body.token }),
    ]);

    const successes = results.filter((r) => r.status === 200);
    expect(successes.length).toBe(1);
  });

  test('16. Staff cannot generate Return QR for unauthorized station (no station assigned)', async () => {
    const { user: unassignedStaff } = await createUser({ role: 'STAFF', assignedStationId: null });
    const staffToken = await loginAs(unassignedStaff);
    const { rentalId } = await setupActiveRental();

    const res = await request(app)
      .post('/api/v1/returns/token')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ rentalId });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('STAFF_NO_STATION');
  });
});
