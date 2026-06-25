const express = require('express');
const clinicController = require('./clinic.controller');
const { protect, restrictTo } = require('../../core/middlewares/auth.middleware');
const { requireTenant } = require('../../core/middlewares/tenant.middleware');

const router = express.Router();

router.use(protect);
router.use(requireTenant);

/**
 * @swagger
 * tags:
 *   name: Clinics
 *   description: Clinic management and settings
 */

/**
 * @swagger
 * /api/v1/clinics/my-clinic:
 *   get:
 *     summary: Get details of the current clinic
 *     tags: [Clinics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Clinic details retrieved successfully
 *   put:
 *     summary: Update clinic settings (Admin only)
 *     tags: [Clinics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Clinic updated successfully
 *       403:
 *         description: Forbidden (Requires clinic_admin role)
 */
router.route('/my-clinic')
  .get(clinicController.getMyClinic)
  .put(restrictTo('clinic_admin'), clinicController.updateMyClinic);

module.exports = router;
