const express = require('express');
const authController = require('./auth.controller');
const { protect } = require('../../core/middlewares/auth.middleware');

const router = express.Router();

router.post('/login', authController.login);
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);

module.exports = router;
