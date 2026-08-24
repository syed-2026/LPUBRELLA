const express = require('express');
const staffController = require('../controllers/staffController');
const authenticate = require('../middleware/authenticate');
const { requireStaff } = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { pagination } = require('../validators/common');
const { damageReportSchema, missingReportSchema } = require('../validators/staffValidators');

const router = express.Router();

router.get('/dashboard', authenticate, requireStaff, staffController.dashboard);
router.get('/rentals', authenticate, requireStaff, validate(pagination, 'query'), staffController.rentals);
router.get('/inventory', authenticate, requireStaff, staffController.inventory);
router.post('/damage', authenticate, requireStaff, validate(damageReportSchema), staffController.reportDamage);
router.post('/missing', authenticate, requireStaff, validate(missingReportSchema), staffController.reportMissing);

module.exports = router;
