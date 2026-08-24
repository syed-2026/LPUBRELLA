const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const userRepository = require('../repositories/userRepository');
const auditRepository = require('../repositories/auditRepository');
const AppError = require('../utils/AppError');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { generateToken, hashToken } = require('../utils/secureToken');
const env = require('../config/env');

const BCRYPT_ROUNDS = 12;

function sanitizeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

function parseExpiryToMs(expiresIn) {
  // supports formats like "15m", "7d", "1h"
  const match = /^(\d+)([smhd])$/.exec(expiresIn);
  if (!match) return 15 * 60 * 1000;
  const [, num, unit] = match;
  const n = parseInt(num, 10);
  const multipliers = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return n * multipliers[unit];
}

async function issueTokenPair(user) {
  const accessToken = signAccessToken(user);
  const refreshTokenRaw = signRefreshToken(user);

  // Persist a hash of the refresh token so it can be revoked on logout
  // and so a leaked token alone (without the DB) isn't directly reusable
  // for anything beyond its natural JWT expiry.
  const tokenHash = hashToken(refreshTokenRaw);
  const expiresAt = new Date(Date.now() + parseExpiryToMs(env.jwt.refreshExpiresIn));

  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  return { accessToken, refreshToken: refreshTokenRaw };
}

const authService = {
  async register({ lpuId, name, email, phone, password }) {
    const [existingEmail, existingLpuId] = await Promise.all([
      userRepository.findByEmail(email),
      userRepository.findByLpuId(lpuId),
    ]);
    if (existingEmail) throw AppError.conflict('Email already registered', 'EMAIL_TAKEN');
    if (existingLpuId) throw AppError.conflict('LPU ID already registered', 'LPU_ID_TAKEN');

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Public registration only ever creates STUDENT accounts.
    const user = await userRepository.create({
      lpuId,
      name,
      email,
      phone,
      passwordHash,
      role: 'STUDENT',
      status: 'ACTIVE',
    });

    await auditRepository.log({
      actorId: user.id,
      action: 'REGISTER',
      entity: 'User',
      entityId: user.id,
    });

    const tokens = await issueTokenPair(user);
    return { user: sanitizeUser(user), ...tokens };
  },

  async login({ email, password }) {
    const user = await userRepository.findByEmail(email);
    // Constant-shape error regardless of whether email exists, to avoid
    // user enumeration.
    if (!user) throw AppError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) throw AppError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');

    if (user.status !== 'ACTIVE') {
      throw AppError.forbidden(`Account is ${user.status.toLowerCase()}`, 'ACCOUNT_NOT_ACTIVE');
    }

    await auditRepository.log({ actorId: user.id, action: 'LOGIN', entity: 'User', entityId: user.id });

    const tokens = await issueTokenPair(user);
    return { user: sanitizeUser(user), ...tokens };
  },

  async refresh({ refreshToken: rawRefreshToken }) {
    let payload;
    try {
      payload = verifyRefreshToken(rawRefreshToken);
    } catch (err) {
      throw AppError.unauthorized('Invalid or expired refresh token');
    }

    const tokenHash = hashToken(rawRefreshToken);
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw AppError.unauthorized('Refresh token is no longer valid');
    }

    const user = await userRepository.findById(payload.sub);
    if (!user || user.status !== 'ACTIVE') {
      throw AppError.unauthorized('User is not eligible for a new session');
    }

    // Rotate: revoke the used refresh token and issue a new pair.
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
    const tokens = await issueTokenPair(user);
    return { user: sanitizeUser(user), ...tokens };
  },

  async logout({ refreshToken: rawRefreshToken }) {
    const tokenHash = hashToken(rawRefreshToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revoked: true },
    });
    return { success: true };
  },

  sanitizeUser,
};

module.exports = authService;
