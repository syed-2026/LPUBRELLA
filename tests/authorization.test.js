const request = require('supertest');
const { app, createUser, loginAs, createStation } = require('./factories');

describe('Authorization', () => {
  test('17. Admin-only routes reject students and staff', async () => {
    const { user: student } = await createUser({ role: 'STUDENT' });
    const { user: staff } = await createUser({ role: 'STAFF' });
    const studentToken = await loginAs(student);
    const staffToken = await loginAs(staff);

    const studentRes = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(studentRes.status).toBe(403);

    const staffRes = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${staffToken}`);
    expect(staffRes.status).toBe(403);
  });

  test('Admin can access admin routes', async () => {
    const { user: admin } = await createUser({ role: 'ADMIN' });
    const adminToken = await loginAs(admin);

    const res = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  test('Unauthenticated requests are rejected', async () => {
    const res = await request(app).get('/api/v1/admin/users');
    expect(res.status).toBe(401);
  });

  test('Admin can create a station', async () => {
    const { user: admin } = await createUser({ role: 'ADMIN' });
    const adminToken = await loginAs(admin);

    const res = await request(app)
      .post('/api/v1/admin/stations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        code: 'ADMTEST01',
        name: 'Admin Test Station',
        latitude: 31.25,
        longitude: 75.7,
        capacity: 10,
        openingTime: '06:00',
        closingTime: '22:00',
      });
    expect(res.status).toBe(201);
    expect(res.body.station.code).toBe('ADMTEST01');
  });
});
