const express = require('express');
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const { authLimiter } = require('../middleware/rateLimiters');
const { registerSchema, loginSchema, refreshSchema } = require('../validators/authValidators');

const router = express.Router();

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authLimiter, validate(refreshSchema), authController.refresh);
router.post('/logout', authLimiter, validate(refreshSchema), authController.logout);
router.get('/me', authenticate, authController.me);

module.exports = router;
