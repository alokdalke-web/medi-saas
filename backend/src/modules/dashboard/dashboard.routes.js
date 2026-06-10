const express = require('express');
const dashboardController = require('./dashboard.controller');
const { protect } = require('../../core/middlewares/auth.middleware');
const { requireTenant } = require('../../core/middlewares/tenant.middleware');

const router = express.Router();

router.use(protect);
router.use(requireTenant);

router.route('/')
  .get(dashboardController.getDashboardStats);

module.exports = router;
