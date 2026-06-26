const express = require('express');
const medicalRecordController = require('./medical-record.controller');
const authMiddleware = require('../../core/middlewares/auth.middleware');

const router = express.Router();

router.use(authMiddleware.protect);

router
  .route('/')
  .get(medicalRecordController.getAllRecords)
  .post(
    authMiddleware.restrictTo('clinic_admin', 'doctor'),
    medicalRecordController.createRecord
  );

router
  .route('/:id')
  .get(medicalRecordController.getRecord)
  .put(
    authMiddleware.restrictTo('clinic_admin', 'doctor'),
    medicalRecordController.updateRecord
  )
  .delete(
    authMiddleware.restrictTo('clinic_admin', 'doctor'),
    medicalRecordController.deleteRecord
  );

module.exports = router;
