const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, status: user.status },
    env.jwt.secret,
    { expiresIn: env.jwt.accessExpiresIn }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    { sub: user.id, tokenType: 'refresh', jti: crypto.randomUUID() },
    env.jwt.refreshSecret,
    {
      expiresIn: env.jwt.refreshExpiresIn,
    }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.secret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
