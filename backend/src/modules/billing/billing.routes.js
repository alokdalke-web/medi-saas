const express = require('express');
const billingController = require('./billing.controller');
const authMiddleware = require('../../core/middlewares/auth.middleware');

const router = express.Router();

// Protect all routes
router.use(authMiddleware.protect);

router
  .route('/')
  .get(billingController.getAllBilling)
  .post(billingController.createBilling);

router
  .route('/:id')
  .get(billingController.getBilling)
  .put(billingController.updateBilling)
  .delete(billingController.deleteBilling);

module.exports = router;
