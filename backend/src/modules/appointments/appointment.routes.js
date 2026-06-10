const express = require('express');
const appointmentController = require('./appointment.controller');
const { protect } = require('../../core/middlewares/auth.middleware');
const { requireTenant } = require('../../core/middlewares/tenant.middleware');

const router = express.Router();

router.use(protect);
router.use(requireTenant);

router.route('/')
  .get(appointmentController.getAllAppointments)
  .post(appointmentController.createAppointment);

router.route('/:id')
  .put(appointmentController.updateAppointment)
  .delete(appointmentController.deleteAppointment);

module.exports = router;
