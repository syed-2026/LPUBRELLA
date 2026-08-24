const express = require('express');
const umbrellaController = require('../controllers/umbrellaController');
const authenticate = require('../middleware/authenticate');
const { requireStudent } = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { qrLimiter } = require('../middleware/rateLimiters');
const { validateUmbrellaSchema } = require('../validators/rentalValidators');

const router = express.Router();

router.post(
  '/validate',
  authenticate,
  requireStudent,
  qrLimiter,
  validate(validateUmbrellaSchema),
  umbrellaController.validate
);

module.exports = router;
