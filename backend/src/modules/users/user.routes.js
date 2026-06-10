const express = require('express');
const userController = require('./user.controller');
const { protect, restrictTo } = require('../../core/middlewares/auth.middleware');
const { requireTenant } = require('../../core/middlewares/tenant.middleware');

const router = express.Router();

router.use(protect);
router.use(requireTenant);
// Only clinic admins can manage users
router.use(restrictTo('clinic_admin'));

router.route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router.route('/:id')
  .put(userController.updateUser)
  .delete(userController.deleteUser);

router.patch('/:id/status', userController.updateUserStatus);

module.exports = router;
