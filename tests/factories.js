const bcrypt = require('bcryptjs');
const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

const TEST_PASSWORD = 'Test@1234';

async function createUser({ role = 'STUDENT', assignedStationId = null, suffix = Math.random().toString(36).slice(2, 8) } = {}) {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 4); // low rounds for fast tests
  const user = await prisma.user.create({
    data: {
      lpuId: `LPU${suffix}`,
      name: `Test ${role} ${suffix}`,
      email: `${role.toLowerCase()}_${suffix}@lpu.test`,
      passwordHash,
      role,
      status: 'ACTIVE',
      assignedStationId,
    },
  });
  return { user, rawPassword: TEST_PASSWORD };
}

async function loginAs(user) {
  const res = await request(app).post('/api/v1/auth/login').send({
    email: user.email,
    password: TEST_PASSWORD,
  });
  return res.body.accessToken;
}

async function createStation(overrides = {}) {
  const suffix = Math.random().toString(36).slice(2, 8);
  return prisma.station.create({
    data: {
      code: `STN-${suffix}`,
      name: `Test Station ${suffix}`,
      latitude: 31.25,
      longitude: 75.7,
      capacity: 10,
      status: 'ACTIVE',
      openingTime: '06:00',
      closingTime: '23:00',
      ...overrides,
    },
  });
}

async function createUmbrella(stationId, overrides = {}) {
  const suffix = Math.random().toString(36).slice(2, 8);
  return prisma.umbrella.create({
    data: {
      publicCode: `UMB-${suffix}`,
      qrIdentifier: `UMB-${suffix}`,
      status: 'AVAILABLE',
      condition: 'GOOD',
      currentStationId: stationId,
      ...overrides,
    },
  });
}

async function createPlan(overrides = {}) {
  const suffix = Math.random().toString(36).slice(2, 8);
  return prisma.pricingPlan.create({
    data: {
      name: `Plan-${suffix}`,
      durationMinutes: 30,
      pricePaise: 1000,
      active: true,
      ...overrides,
    },
  });
}

module.exports = { createUser, loginAs, createStation, createUmbrella, createPlan, TEST_PASSWORD, app };
