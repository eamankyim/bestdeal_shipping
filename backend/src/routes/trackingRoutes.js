const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/responseUtils');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @swagger
 * /api/tracking/{trackingId}:
 *   get:
 *     summary: Track shipment by tracking ID (Public - No Auth)
 *     tags: [Tracking]
 *     parameters:
 *       - in: path
 *         name: trackingId
 *         required: true
 *         schema:
 *           type: string
 *         description: The tracking ID of the shipment
 *         example: SHIP-20241010-A3B9F
 *     responses:
 *       200:
 *         description: Tracking information retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     job:
 *                       type: object
 *                       properties:
 *                         trackingId:
 *                           type: string
 *                         status:
 *                           type: string
 *                         pickupAddress:
 *                           type: string
 *                         deliveryAddress:
 *                           type: string
 *                         estimatedDelivery:
 *                           type: string
 *                           format: date-time
 *                         timeline:
 *                           type: array
 *                           items:
 *                             type: object
 *       404:
 *         description: Tracking ID not found
 */
router.get('/:trackingId', asyncHandler(async (req, res) => {
  const { trackingId } = req.params;

  const job = await prisma.job.findUnique({
    where: { trackingId },
    select: {
      trackingId: true,
      status: true,
      pickupAddress: true,
      deliveryAddress: true,
      estimatedDelivery: true,
      actualDelivery: true,
      priority: true,
      description: true,
      weight: true,
      value: true,
      quantity: true,
      createdAt: true,
      timeline: {
        select: {
          status: true,
          location: true,
          timestamp: true,
          notes: true,
        },
        orderBy: { timestamp: 'asc' },
      },
      customer: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!job) {
    return sendError(res, 404, 'Tracking ID not found');
  }

  return sendSuccess(res, 200, 'Tracking info retrieved successfully', { job });
}));

module.exports = router;


