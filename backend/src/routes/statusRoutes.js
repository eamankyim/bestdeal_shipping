const express = require('express');
const { authenticate } = require('../middleware/auth');
const { sendSuccess } = require('../utils/responseUtils');
const { statusesFor } = require('../utils/statuses');

const router = express.Router();

/**
 * @swagger
 * /api/statuses:
 *   get:
 *     summary: Job and batch statuses, and which moves the signed-in user may make
 *     description: The website takes every status name, colour and stage from here. `job.moves` and
 *       `batch.moves` map a status to the statuses this user may move it to; `job.rules` says which
 *       of those need a reason or photos; `assignDriverFrom` / `assignRiderFrom` list the statuses
 *       from which this user may assign a driver / dispatch rider.
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statuses for this user
 */
router.get('/', authenticate, (req, res) => sendSuccess(res, 200, 'Statuses retrieved successfully', statusesFor(req.user)));

module.exports = router;
