const express = require('express');
const staffController = require('../controllers/staffController');
const authenticate = require('../middleware/authenticate');
const { requireStaff } = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { damageReportSchema, missingReportSchema, staffRentalsQuerySchema, umbrellaLookupQuerySchema } = require('../validators/staffValidators');

const router = express.Router();

router.get('/dashboard', authenticate, requireStaff, staffController.dashboard);
router.get(
  '/rentals',
  authenticate,
  requireStaff,
  validate(staffRentalsQuerySchema, 'query'),
  staffController.rentals
);
router.get(
  '/rentals/lookup',
  authenticate,
  requireStaff,
  validate(umbrellaLookupQuerySchema, 'query'),
  staffController.lookupRentalByUmbrella
);
router.get('/inventory', authenticate, requireStaff, staffController.inventory);
router.post('/damage', authenticate, requireStaff, validate(damageReportSchema), staffController.reportDamage);
router.post('/missing', authenticate, requireStaff, validate(missingReportSchema), staffController.reportMissing);

module.exports = router;
