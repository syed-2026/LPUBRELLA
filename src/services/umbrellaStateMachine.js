const AppError = require('../utils/AppError');

// Single source of truth for valid Umbrella status transitions.
const TRANSITIONS = {
  AVAILABLE: ['RENTED', 'MAINTENANCE', 'MISSING', 'RETIRED'],
  RENTED: ['AVAILABLE', 'MAINTENANCE', 'MISSING', 'LOST'],
  MAINTENANCE: ['AVAILABLE', 'RETIRED'],
  MISSING: ['AVAILABLE', 'LOST', 'RETIRED'],
  LOST: ['RETIRED'],
  RETIRED: [],
};

function assertTransition(currentStatus, nextStatus) {
  const allowed = TRANSITIONS[currentStatus];
  if (!allowed) {
    throw AppError.internal(`Unknown umbrella status: ${currentStatus}`);
  }
  if (!allowed.includes(nextStatus)) {
    throw AppError.conflict(
      `Invalid umbrella transition: ${currentStatus} -> ${nextStatus}`,
      'INVALID_UMBRELLA_TRANSITION'
    );
  }
  return true;
}

module.exports = { TRANSITIONS, assertTransition };
