const express = require('express');
const stationController = require('../controllers/stationController');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { uuid, pagination } = require('../validators/common');
const { z } = require('zod');

const router = express.Router();

router.get('/', authenticate, validate(pagination, 'query'), stationController.list);
router.get('/:id', authenticate, validate(z.object({ id: uuid }), 'params'), stationController.getById);

module.exports = router;
