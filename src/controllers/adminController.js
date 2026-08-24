const asyncHandler = require('../utils/asyncHandler');
const adminService = require('../services/adminService');

const adminController = {
  // Users
  createStaffOrAdmin: asyncHandler(async (req, res) => {
    const user = await adminService.createStaffOrAdmin(req.user.id, req.body);
    res.status(201).json({ user });
  }),
  listUsers: asyncHandler(async (req, res) => {
    const result = await adminService.listUsers(req.query);
    res.status(200).json(result);
  }),
  updateUser: asyncHandler(async (req, res) => {
    const user = await adminService.updateUser(req.user.id, req.params.id, req.body);
    res.status(200).json({ user });
  }),

  // Stations
  createStation: asyncHandler(async (req, res) => {
    const station = await adminService.createStation(req.user.id, req.body);
    res.status(201).json({ station });
  }),
  listStations: asyncHandler(async (req, res) => {
    const result = await adminService.listStations(req.query);
    res.status(200).json(result);
  }),
  updateStation: asyncHandler(async (req, res) => {
    const station = await adminService.updateStation(req.user.id, req.params.id, req.body);
    res.status(200).json({ station });
  }),

  // Umbrellas
  createUmbrella: asyncHandler(async (req, res) => {
    const umbrella = await adminService.createUmbrella(req.user.id, req.body);
    res.status(201).json({ umbrella });
  }),
  listUmbrellas: asyncHandler(async (req, res) => {
    const result = await adminService.listUmbrellas(req.query);
    res.status(200).json(result);
  }),
  updateUmbrella: asyncHandler(async (req, res) => {
    const umbrella = await adminService.updateUmbrella(req.user.id, req.params.id, req.body);
    res.status(200).json({ umbrella });
  }),

  // Pricing
  createPricingPlan: asyncHandler(async (req, res) => {
    const plan = await adminService.createPricingPlan(req.user.id, req.body);
    res.status(201).json({ plan });
  }),
  listPricingPlans: asyncHandler(async (req, res) => {
    const plans = await adminService.listPricingPlans();
    res.status(200).json({ plans });
  }),
  updatePricingPlan: asyncHandler(async (req, res) => {
    const plan = await adminService.updatePricingPlan(req.user.id, req.params.id, req.body);
    res.status(200).json({ plan });
  }),

  // Read models
  listRentals: asyncHandler(async (req, res) => {
    const result = await adminService.listRentals(req.query);
    res.status(200).json(result);
  }),
  listPayments: asyncHandler(async (req, res) => {
    const result = await adminService.listPayments(req.query);
    res.status(200).json(result);
  }),
  listDamageReports: asyncHandler(async (req, res) => {
    const result = await adminService.listDamageReports(req.query);
    res.status(200).json(result);
  }),
  listAuditLogs: asyncHandler(async (req, res) => {
    const result = await adminService.listAuditLogs(req.query);
    res.status(200).json(result);
  }),

  // Rebalancing
  createRebalancingTask: asyncHandler(async (req, res) => {
    const task = await adminService.createRebalancingTask(req.user.id, req.body);
    res.status(201).json({ task });
  }),
  listRebalancingTasks: asyncHandler(async (req, res) => {
    const result = await adminService.listRebalancingTasks(req.query);
    res.status(200).json(result);
  }),

  // Analytics
  analytics: asyncHandler(async (req, res) => {
    const result = await adminService.analytics();
    res.status(200).json(result);
  }),
};

module.exports = adminController;
