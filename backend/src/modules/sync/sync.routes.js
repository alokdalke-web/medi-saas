const express = require('express');
const syncController = require('./sync.controller');

const router = express.Router();

router.post('/push', syncController.pushEvents);
router.get('/pull', syncController.pullEvents);

module.exports = router;
