const prisma = require('../src/config/prisma');

// Truncates all application tables (keeping schema) before each test file
// runs, so tests are independent and repeatable. Requires a real
// PostgreSQL test database configured via DATABASE_URL (see README for
// setup instructions) - these are integration tests, not mocked unit tests,
// because the business rules under test (unique active rental, atomic
// return transaction, etc.) are enforced partly at the database/transaction
// level and are only meaningfully verified against a real database.
async function truncateAll() {
  const tableNames = [
    '"AuditLog"',
    '"Notification"',
    '"RebalancingTask"',
    '"DamageReport"',
    '"ReturnToken"',
    '"Payment"',
    '"Rental"',
    '"PricingPlan"',
    '"Umbrella"',
    '"Station"',
    '"RefreshToken"',
    '"User"',
  ];
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableNames.join(', ')} CASCADE;`);
}

beforeEach(async () => {
  await truncateAll();
});

afterAll(async () => {
  await prisma.$disconnect();
});

module.exports = { truncateAll };
