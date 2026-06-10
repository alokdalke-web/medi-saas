const express = require('express');
const patientController = require('./patient.controller');
const { protect } = require('../../core/middlewares/auth.middleware');
const { requireTenant } = require('../../core/middlewares/tenant.middleware');

const router = express.Router();

router.use(protect);
router.use(requireTenant);

router.route('/')
  .get(patientController.getAllPatients)
  .post(patientController.createPatient);

router.route('/:id')
  .get(patientController.getPatient)
  .put(patientController.updatePatient)
  .delete(patientController.deletePatient);

module.exports = router;
