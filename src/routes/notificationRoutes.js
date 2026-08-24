const express = require('express');
const { z } = require('zod');
const notificationController = require('../controllers/notificationController');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { uuid, pagination } = require('../validators/common');

const router = express.Router();

router.get('/', authenticate, validate(pagination, 'query'), notificationController.list);
router.post(
  '/:id/read',
  authenticate,
  validate(z.object({ id: uuid }), 'params'),
  notificationController.markRead
);

module.exports = router;
