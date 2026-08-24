const AppError = require('../utils/AppError');

// Generic role gate. Usage: requireRole('ADMIN', 'STAFF')
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }
    if (!roles.includes(req.user.role)) {
      return next(AppError.forbidden('You do not have permission to perform this action'));
    }
    next();
  };
}

const requireStudent = requireRole('STUDENT');
const requireStaff = requireRole('STAFF');
const requireAdmin = requireRole('ADMIN');
// Staff dashboards are often also useful to admins for support purposes.
const requireStaffOrAdmin = requireRole('STAFF', 'ADMIN');

module.exports = {
  requireRole,
  requireStudent,
  requireStaff,
  requireAdmin,
  requireStaffOrAdmin,
};
