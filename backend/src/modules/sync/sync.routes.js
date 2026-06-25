const express = require('express');
const syncController = require('./sync.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Sync
 *   description: Offline Event Sourcing Synchronization
 */

/**
 * @swagger
 * /api/v1/sync/push:
 *   post:
 *     summary: Push local events to the cloud
 *     tags: [Sync]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               events:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Events processed successfully
 */
router.post('/push', syncController.pushEvents);

/**
 * @swagger
 * /api/v1/sync/pull:
 *   get:
 *     summary: Pull new events from the cloud
 *     tags: [Sync]
 *     parameters:
 *       - in: query
 *         name: since
 *         schema:
 *           type: string
 *         description: ISO date string to fetch events since
 *     responses:
 *       200:
 *         description: List of new events
 */
router.get('/pull', syncController.pullEvents);

module.exports = router;
