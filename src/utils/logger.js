// Minimal structured logger. Deliberately avoids logging request bodies
// wholesale so secrets (passwords, tokens, payment secrets) never leak
// into logs. Callers must pass explicit, pre-sanitized fields.

const REDACTED = '[REDACTED]';
const SENSITIVE_KEYS = new Set([
  'password',
  'passwordHash',
  'jwtSecret',
  'jwt_secret',
  'token',
  'refreshToken',
  'accessToken',
  'rawToken',
  'paymentSecret',
  'payment_secret',
  'authorization',
]);

function sanitize(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key)) {
      out[key] = REDACTED;
    } else if (typeof value === 'object' && value !== null) {
      out[key] = sanitize(value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

function log(level, message, meta) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(meta ? { meta: sanitize(meta) } : {}),
  };
  // eslint-disable-next-line no-console
  console[level === 'error' ? 'error' : 'log'](JSON.stringify(entry));
}

module.exports = {
  info: (message, meta) => log('info', message, meta),
  warn: (message, meta) => log('warn', message, meta),
  error: (message, meta) => log('error', message, meta),
  sanitize,
};
