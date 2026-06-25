const express = require('express');
const dashboardController = require('./dashboard.controller');
const { protect } = require('../../core/middlewares/auth.middleware');
const { requireTenant } = require('../../core/middlewares/tenant.middleware');

const router = express.Router();

router.use(protect);
router.use(requireTenant);

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Analytics and dashboard statistics
 */

/**
 * @swagger
 * /api/v1/dashboard:
 *   get:
 *     summary: Get dashboard statistics for the clinic
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */
router.route('/')
  .get(dashboardController.getDashboardStats);

module.exports = router;
