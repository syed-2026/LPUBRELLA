const express = require('express');

const authRoutes = require('./authRoutes');
const stationRoutes = require('./stationRoutes');
const umbrellaRoutes = require('./umbrellaRoutes');
const pricingRoutes = require('./pricingRoutes');
const rentalRoutes = require('./rentalRoutes');
const paymentRoutes = require('./paymentRoutes');
const returnRoutes = require('./returnRoutes');
const staffRoutes = require('./staffRoutes');
const adminRoutes = require('./adminRoutes');
const notificationRoutes = require('./notificationRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/stations', stationRoutes);
router.use('/umbrellas', umbrellaRoutes);
router.use('/pricing', pricingRoutes);
router.use('/rentals', rentalRoutes);
router.use('/payments', paymentRoutes); // /webhook mounted separately in app.js
router.use('/returns', returnRoutes);
router.use('/staff', staffRoutes);
router.use('/admin', adminRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;
