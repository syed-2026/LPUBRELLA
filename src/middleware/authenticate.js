const { verifyAccessToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const prisma = require('../config/prisma');

// Verifies the Bearer access token, loads the current user from the DB
// (so suspended/deleted users are rejected immediately, not just at
// token expiry), and attaches a safe user object to req.user.
const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw AppError.unauthorized('Missing or invalid Authorization header');
  }

  const token = header.slice('Bearer '.length).trim();

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    throw AppError.unauthorized('Invalid or expired access token');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw AppError.unauthorized('User no longer exists');
  }
  if (user.status !== 'ACTIVE') {
    throw AppError.forbidden(`Account is ${user.status.toLowerCase()}`, 'ACCOUNT_NOT_ACTIVE');
  }

  const { passwordHash, ...safeUser } = user;
  req.user = safeUser;
  next();
});

module.exports = authenticate;
