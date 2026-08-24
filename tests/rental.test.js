const request = require('supertest');
const { app, createUser, loginAs, createStation, createUmbrella, createPlan } = require('./factories');

describe('Rental creation business rules', () => {
  test('3. Student cannot rent an unavailable umbrella', async () => {
    const { user } = await createUser({ role: 'STUDENT' });
    const token = await loginAs(user);
    const station = await createStation();
    const umbrella = await createUmbrella(station.id, { status: 'MAINTENANCE' });
    const plan = await createPlan();

    const res = await request(app)
      .post('/api/v1/rentals')
      .set('Authorization', `Bearer ${token}`)
      .send({ umbrellaId: umbrella.id, pricingPlanId: plan.id });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('UMBRELLA_NOT_AVAILABLE');
  });

  test('4. Student cannot have two active rentals', async () => {
    const { user } = await createUser({ role: 'STUDENT' });
    const token = await loginAs(user);
    const station = await createStation();
    const umbrella1 = await createUmbrella(station.id);
    const umbrella2 = await createUmbrella(station.id);
    const plan = await createPlan();

    const first = await request(app)
      .post('/api/v1/rentals')
      .set('Authorization', `Bearer ${token}`)
      .send({ umbrellaId: umbrella1.id, pricingPlanId: plan.id });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/api/v1/rentals')
      .set('Authorization', `Bearer ${token}`)
      .send({ umbrellaId: umbrella2.id, pricingPlanId: plan.id });
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('ACTIVE_RENTAL_EXISTS');
  });

  test('5. Umbrella cannot have two active rentals', async () => {
    const { user: student1 } = await createUser({ role: 'STUDENT' });
    const { user: student2 } = await createUser({ role: 'STUDENT' });
    const token1 = await loginAs(student1);
    const token2 = await loginAs(student2);
    const station = await createStation();
    const umbrella = await createUmbrella(station.id);
    const plan = await createPlan();

    const first = await request(app)
      .post('/api/v1/rentals')
      .set('Authorization', `Bearer ${token1}`)
      .send({ umbrellaId: umbrella.id, pricingPlanId: plan.id });
    expect(first.status).toBe(201);

    // Umbrella is still AVAILABLE at this point (only becomes RENTED on
    // payment verification), so we simulate the race by directly
    // attempting a second CREATED rental request for the same umbrella
    // from a different student before payment completes.
    const second = await request(app)
      .post('/api/v1/rentals')
      .set('Authorization', `Bearer ${token2}`)
      .send({ umbrellaId: umbrella.id, pricingPlanId: plan.id });

    // Because a rental in CREATED status already exists for this umbrella,
    // the second attempt must be rejected.
    expect(second.status).toBe(409);
  });
});
