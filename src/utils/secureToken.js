const crypto = require('crypto');

// Generates a cryptographically secure random token (URL-safe).
function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

// We store only a SHA-256 hash of tokens (return tokens, refresh tokens),
// never the raw value, so a database leak doesn't expose usable tokens.
function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

module.exports = { generateToken, hashToken };
