const express = require('express');
const doctorController = require('./doctor.controller');
const { protect, restrictTo } = require('../../core/middlewares/auth.middleware');
const { requireTenant } = require('../../core/middlewares/tenant.middleware');

const router = express.Router();

router.use(protect);
router.use(requireTenant);

// Only clinic admins can manage doctors (create, update, delete)
// But receptionists and doctors might need to list doctors.
router.route('/')
  .get(doctorController.getAllDoctors)
  .post(restrictTo('clinic_admin'), doctorController.createDoctor);

router.route('/:id')
  .get(doctorController.getDoctor)
  .put(restrictTo('clinic_admin'), doctorController.updateDoctor)
  .delete(restrictTo('clinic_admin'), doctorController.deleteDoctor);

module.exports = router;
