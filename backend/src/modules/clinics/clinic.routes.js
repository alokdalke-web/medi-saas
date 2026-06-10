const express = require('express');
const clinicController = require('./clinic.controller');
const { protect, restrictTo } = require('../../core/middlewares/auth.middleware');
const { requireTenant } = require('../../core/middlewares/tenant.middleware');

const router = express.Router();

router.use(protect);
router.use(requireTenant);

router.route('/my-clinic')
  .get(clinicController.getMyClinic)
  .put(restrictTo('clinic_admin'), clinicController.updateMyClinic);

module.exports = router;
