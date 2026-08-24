const AppError = require('../utils/AppError');

// Single source of truth for valid Rental status transitions.
// Every transition in the entire codebase MUST go through
// assertTransition() so invalid transitions are impossible.
const TRANSITIONS = {
  CREATED: ['PAYMENT_PENDING', 'CANCELLED'],
  PAYMENT_PENDING: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['OVERDUE', 'RETURN_PENDING', 'LOST'],
  OVERDUE: ['RETURN_PENDING', 'LOST'],
  RETURN_PENDING: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
  LOST: [],
};

function assertTransition(currentStatus, nextStatus) {
  const allowed = TRANSITIONS[currentStatus];
  if (!allowed) {
    throw AppError.internal(`Unknown rental status: ${currentStatus}`);
  }
  if (!allowed.includes(nextStatus)) {
    throw AppError.conflict(
      `Invalid rental transition: ${currentStatus} -> ${nextStatus}`,
      'INVALID_RENTAL_TRANSITION'
    );
  }
  return true;
}

function canReturn(status) {
  return status === 'ACTIVE' || status === 'OVERDUE';
}

module.exports = { TRANSITIONS, assertTransition, canReturn };
