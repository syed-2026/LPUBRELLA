const express = require('express');
const { z } = require('zod');
const rentalController = require('../controllers/rentalController');
const authenticate = require('../middleware/authenticate');
const { requireStudent } = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { createRentalSchema } = require('../validators/rentalValidators');
const { uuid, pagination } = require('../validators/common');

const router = express.Router();

router.post('/', authenticate, requireStudent, validate(createRentalSchema), rentalController.create);
router.get('/active', authenticate, requireStudent, rentalController.active);
router.get('/history', authenticate, requireStudent, validate(pagination, 'query'), rentalController.history);
router.get('/:id', authenticate, validate(z.object({ id: uuid }), 'params'), rentalController.getById);

module.exports = router;
