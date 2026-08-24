const express = require('express');
const returnController = require('../controllers/returnController');
const authenticate = require('../middleware/authenticate');
const { requireStudent, requireStaff } = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { returnLimiter } = require('../middleware/rateLimiters');
const { generateReturnTokenSchema, confirmReturnSchema } = require('../validators/returnValidators');

const router = express.Router();

router.post(
  '/token',
  authenticate,
  requireStaff,
  returnLimiter,
  validate(generateReturnTokenSchema),
  returnController.generateToken
);

router.post(
  '/confirm',
  authenticate,
  requireStudent,
  returnLimiter,
  validate(confirmReturnSchema),
  returnController.confirm
);

module.exports = router;
