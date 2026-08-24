const request = require('supertest');
const { app } = require('./factories');
const prisma = require('../src/config/prisma');

describe('Auth', () => {
  test('1. Student can register and login', async () => {
    const registerRes = await request(app).post('/api/v1/auth/register').send({
      lpuId: 'LPU2026999',
      name: 'New Student',
      email: 'newstudent@lpu.test',
      password: 'Test@1234',
    });
    expect(registerRes.status).toBe(201);
    expect(registerRes.body.user.email).toBe('newstudent@lpu.test');
    expect(registerRes.body.accessToken).toBeDefined();

    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'newstudent@lpu.test',
      password: 'Test@1234',
    });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.accessToken).toBeDefined();
  });

  test('2. Password is hashed, never stored or returned in plaintext', async () => {
    await request(app).post('/api/v1/auth/register').send({
      lpuId: 'LPU2026998',
      name: 'Hash Check',
      email: 'hashcheck@lpu.test',
      password: 'Test@1234',
    });

    const dbUser = await prisma.user.findUnique({ where: { email: 'hashcheck@lpu.test' } });
    expect(dbUser.passwordHash).not.toBe('Test@1234');
    expect(dbUser.passwordHash.startsWith('$2b$') || dbUser.passwordHash.startsWith('$2a$')).toBe(true);

    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'hashcheck@lpu.test',
      password: 'Test@1234',
    });
    expect(loginRes.body.user.passwordHash).toBeUndefined();
  });
});
