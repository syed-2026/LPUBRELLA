const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');

const authController = {
  register: asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  }),

  login: asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    res.status(200).json(result);
  }),

  refresh: asyncHandler(async (req, res) => {
    const result = await authService.refresh(req.body);
    res.status(200).json(result);
  }),

  logout: asyncHandler(async (req, res) => {
    const result = await authService.logout(req.body);
    res.status(200).json(result);
  }),

  me: asyncHandler(async (req, res) => {
    res.status(200).json({ user: req.user });
  }),
};

module.exports = authController;
