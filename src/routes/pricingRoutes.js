const express = require('express');
const pricingController = require('../controllers/pricingController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.get('/', authenticate, pricingController.list);

module.exports = router;
