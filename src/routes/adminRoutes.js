const express = require('express');
const { z } = require('zod');
const adminController = require('../controllers/adminController');
const authenticate = require('../middleware/authenticate');
const { requireAdmin } = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { uuid, pagination,adminUsersQuery } = require('../validators/common');
const {
  createStaffOrAdminSchema,
  updateUserSchema,
  createStationSchema,
  updateStationSchema,
  createUmbrellaSchema,
  updateUmbrellaSchema,
  createPricingPlanSchema,
  updatePricingPlanSchema,
} = require('../validators/adminValidators');

const router = express.Router();

// Every route in this file requires an authenticated ADMIN.
router.use(authenticate, requireAdmin);

const idParam = validate(z.object({ id: uuid }), 'params');


// Users
router.post('/users', validate(createStaffOrAdminSchema), adminController.createStaffOrAdmin);
router.get('/users', validate(adminUsersQuery, 'query'), adminController.listUsers);
router.patch('/users/:id', idParam, validate(updateUserSchema), adminController.updateUser);

// Stations
router.post('/stations', validate(createStationSchema), adminController.createStation);
router.get('/stations', validate(pagination, 'query'), adminController.listStations);
router.patch('/stations/:id', idParam, validate(updateStationSchema), adminController.updateStation);

// Umbrellas
router.post('/umbrellas', validate(createUmbrellaSchema), adminController.createUmbrella);
router.get('/umbrellas', validate(adminUsersQuery, 'query'), adminController.listUmbrellas);
router.patch('/umbrellas/:id', idParam, validate(updateUmbrellaSchema), adminController.updateUmbrella);

// Pricing
router.post('/pricing', validate(createPricingPlanSchema), adminController.createPricingPlan);
router.get('/pricing', adminController.listPricingPlans);
router.patch('/pricing/:id', idParam, validate(updatePricingPlanSchema), adminController.updatePricingPlan);

// Read models
router.get('/rentals', validate(pagination, 'query'), adminController.listRentals);
router.get('/payments', validate(pagination, 'query'), adminController.listPayments);
router.get('/damage-reports', validate(pagination, 'query'), adminController.listDamageReports);
router.get('/audit-logs', validate(pagination, 'query'), adminController.listAuditLogs);

// Rebalancing tasks
router.post(
  '/rebalancing-tasks',
  validate(
    z.object({
      fromStationId: uuid,
      toStationId: uuid,
      umbrellaCount: z.number().int().min(1),
      assignedStaffId: uuid.optional(),
      notes: z.string().trim().max(1000).optional(),
    })
  ),
  adminController.createRebalancingTask
);
router.get('/rebalancing-tasks', validate(pagination, 'query'), adminController.listRebalancingTasks);

// Analytics
router.get('/analytics', adminController.analytics);

module.exports = router;
