const { PrismaClient } = require('@prisma/client');
const env = require('./env');

// Reuse a single PrismaClient instance across the app (and across
// hot reloads in dev) to avoid exhausting database connections.
const prisma = new PrismaClient({
  log: env.isProduction ? ['error', 'warn'] : ['warn', 'error'],
});

module.exports = prisma;
