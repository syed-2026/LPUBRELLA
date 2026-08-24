/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 10; // lower than prod default for faster seeding

const TEST_PASSWORD = 'Test@1234'; // same password for all seeded accounts, for convenience

async function main() {
  console.log('Seeding LPU Umbrella database...');

  const passwordHash = await bcrypt.hash(TEST_PASSWORD, BCRYPT_ROUNDS);

  // ---------------- Stations (5) ----------------
  const stationDefs = [
    {
      code: 'LPU-BB1',
      name: 'Block 32 - Main Gate',
      description: 'Primary station near the university main entrance.',
      latitude: 31.2551,
      longitude: 75.7038,
      capacity: 40,
      openingTime: '06:30',
      closingTime: '22:00',
    },
    {
      code: 'LPU-LIB',
      name: 'Central Library',
      description: 'Station outside the Central Library building.',
      latitude: 31.2565,
      longitude: 75.7051,
      capacity: 30,
      openingTime: '07:00',
      closingTime: '23:00',
    },
    {
      code: 'LPU-HOS1',
      name: 'Boys Hostel Complex 1',
      description: 'Near Boys Hostel Block 1 entrance.',
      latitude: 31.2531,
      longitude: 75.7012,
      capacity: 25,
      openingTime: '06:00',
      closingTime: '23:30',
    },
    {
      code: 'LPU-HOS7',
      name: 'Girls Hostel Complex 7',
      description: 'Near Girls Hostel Block 7 entrance.',
      latitude: 31.2589,
      longitude: 75.7065,
      capacity: 25,
      openingTime: '06:00',
      closingTime: '23:30',
    },
    {
      code: 'LPU-FOOD',
      name: 'Food Court Plaza',
      description: 'Station beside the central food court.',
      latitude: 31.2549,
      longitude: 75.7079,
      capacity: 20,
      openingTime: '07:00',
      closingTime: '22:30',
    },
  ];

  const stations = [];
  for (const def of stationDefs) {
    const station = await prisma.station.upsert({
      where: { code: def.code },
      update: {},
      create: { ...def, status: 'ACTIVE' },
    });
    stations.push(station);
  }
  console.log(`Created ${stations.length} stations.`);

  // ---------------- Pricing plans (4) ----------------
  const planDefs = [
    { name: 'Quick', durationMinutes: 30, pricePaise: 1000 },
    { name: 'Campus', durationMinutes: 120, pricePaise: 2000 },
    { name: 'Day', durationMinutes: 360, pricePaise: 3000 },
    { name: 'Home', durationMinutes: 1440, pricePaise: 4000 },
  ];
  const plans = [];
  for (const def of planDefs) {
    const plan = await prisma.pricingPlan.upsert({
      where: { name: def.name },
      update: {},
      create: { ...def, active: true },
    });
    plans.push(plan);
  }
  console.log(`Created ${plans.length} pricing plans.`);

  // ---------------- Admin (1) ----------------
  const admin = await prisma.user.upsert({
    where: { email: 'admin@lpu.test' },
    update: {},
    create: {
      lpuId: 'LPUADM001',
      name: 'Admin Officer',
      email: 'admin@lpu.test',
      phone: '+91-9000000001',
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log(`Created admin: ${admin.email}`);

  // ---------------- Staff (2) ----------------
  const staffDefs = [
    { lpuId: 'LPUSTF001', name: 'Ramandeep Kaur', email: 'staff1@lpu.test', stationCode: 'LPU-BB1' },
    { lpuId: 'LPUSTF002', name: 'Harpreet Singh', email: 'staff2@lpu.test', stationCode: 'LPU-LIB' },
  ];
  const staffUsers = [];
  for (const def of staffDefs) {
    const station = stations.find((s) => s.code === def.stationCode);
    const staff = await prisma.user.upsert({
      where: { email: def.email },
      update: {},
      create: {
        lpuId: def.lpuId,
        name: def.name,
        email: def.email,
        phone: '+91-9000000002',
        passwordHash,
        role: 'STAFF',
        status: 'ACTIVE',
        assignedStationId: station.id,
      },
    });
    staffUsers.push(staff);
  }
  console.log(`Created ${staffUsers.length} staff users.`);

  // ---------------- Students (10) ----------------
  const studentNames = [
    'Aarav Sharma',
    'Vivaan Gupta',
    'Ishaan Verma',
    'Ananya Reddy',
    'Diya Mehta',
    'Kabir Nair',
    'Saanvi Iyer',
    'Reyansh Chauhan',
    'Myra Kapoor',
    'Arjun Malhotra',
  ];
  const students = [];
  for (let i = 0; i < studentNames.length; i += 1) {
    const idNum = String(i + 1).padStart(3, '0');
    const email = `student${i + 1}@lpu.test`;
    const student = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        lpuId: `LPU2026${idNum}`,
        name: studentNames[i],
        email,
        phone: `+91-90000${idNum}00`,
        passwordHash,
        role: 'STUDENT',
        status: 'ACTIVE',
      },
    });
    students.push(student);
  }
  console.log(`Created ${students.length} students.`);

  // ---------------- Umbrellas (30, 6 per station) ----------------
  let umbrellaCounter = 1;
  const umbrellas = [];
  for (const station of stations) {
    for (let i = 0; i < 6; i += 1) {
      const code = String(umbrellaCounter).padStart(4, '0');
      const publicCode = `UMB-${code}`;
      const umbrella = await prisma.umbrella.upsert({
        where: { publicCode },
        update: {},
        create: {
          publicCode,
          qrIdentifier: publicCode, // QR encodes the same human-readable code
          status: 'AVAILABLE',
          condition: 'GOOD',
          currentStationId: station.id,
        },
      });
      umbrellas.push(umbrella);
      umbrellaCounter += 1;
    }
  }
  console.log(`Created ${umbrellas.length} umbrellas.`);

  console.log('\nSeed complete.');
  console.log('----------------------------------------');
  console.log('Test password for ALL seeded accounts:', TEST_PASSWORD);
  console.log('Admin login:', admin.email);
  console.log('Staff logins:', staffUsers.map((s) => s.email).join(', '));
  console.log('Student logins:', students.map((s) => s.email).join(', '));
  console.log('----------------------------------------');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
