const express = require('express');
const doctorController = require('./doctor.controller');
const { protect, restrictTo } = require('../../core/middlewares/auth.middleware');
const { requireTenant } = require('../../core/middlewares/tenant.middleware');

const router = express.Router();

router.use(protect);
router.use(requireTenant);

/**
 * @swagger
 * tags:
 *   name: Doctors
 *   description: Doctor management
 */

/**
 * @swagger
 * /api/v1/doctors:
 *   get:
 *     summary: Get all doctors for the clinic
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of doctors
 *   post:
 *     summary: Create a new doctor (Admin only)
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Doctor created
 */
router.route('/')
  .get(doctorController.getAllDoctors)
  .post(restrictTo('clinic_admin'), doctorController.createDoctor);

/**
 * @swagger
 * /api/v1/doctors/{id}:
 *   get:
 *     summary: Get a specific doctor by ID
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Doctor details
 *   put:
 *     summary: Update doctor details (Admin only)
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Doctor updated
 *   delete:
 *     summary: Soft delete a doctor (Admin only)
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Doctor deleted
 */
router.route('/:id')
  .get(doctorController.getDoctor)
  .put(restrictTo('clinic_admin'), doctorController.updateDoctor)
  .delete(restrictTo('clinic_admin'), doctorController.deleteDoctor);

module.exports = router;
