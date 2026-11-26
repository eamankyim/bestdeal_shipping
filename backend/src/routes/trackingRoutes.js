const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/responseUtils');
const { asyncHandler } = require('../middleware/errorHandler');
const { STAGES, toJobStatus, jobStatusInfo, jobStatusLabel } = require('../utils/statuses');

/**
 * @swagger
 * /api/tracking/{trackingId}:
 *   get:
 *     summary: Track shipment by tracking ID (Public - No Auth)
 *     description: Only where the parcel is - no names, contact details, addresses, prices or staff notes.
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
 *                           description: A status key (see GET /api/statuses)
 *                         statusLabel:
 *                           type: string
 *                         stages:
 *                           type: array
 *                           description: The journey's stages, with `done` and `current` flags
 *                           items:
 *                             type: object
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

  // Anyone with the tracking ID can see this, so it shows where the parcel is and nothing more:
  // no names, contact details, addresses, prices or staff notes
  const job = await prisma.job.findUnique({
    where: { trackingId },
    select: {
      trackingId: true,
      status: true,
      estimatedDelivery: true,
      actualDelivery: true,
      priority: true,
      weight: true,
      quantity: true,
      createdAt: true,
      id: true,
      splitFromId: true,
      partNumber: true,
      timeline: {
        select: { status: true, location: true, timestamp: true },
        orderBy: { timestamp: 'asc' },
      },
    },
  });

  if (!job || toJobStatus(job.status) === 'draft') {
    return sendError(res, 404, 'Tracking ID not found');
  }

  // How the customer can reach us (Settings → Organisation)
  const organisation = await prisma.setting.findUnique({ where: { key: 'organisation' } });
  let company = {};
  try {
    company = JSON.parse(organisation?.value || '{}');
  } catch (error) {
    company = {};
  }

  // A split order: every part, so the customer can follow all of it from any one tracking ID
  const rootId = job.splitFromId || (job.partNumber ? job.id : null);
  const parts = rootId
    ? (await prisma.job.findMany({
      where: { OR: [{ id: rootId }, { splitFromId: rootId }] },
      select: { id: true, trackingId: true, partNumber: true, status: true },
      orderBy: { partNumber: 'asc' },
    })).map((part) => ({
      trackingId: part.trackingId,
      partNumber: part.partNumber,
      statusLabel: jobStatusLabel(part.status),
      statusColor: jobStatusInfo(part.status)?.color || 'default',
      thisOne: part.id === job.id,
    }))
    : [];
  const { id, splitFromId, ...publicJob } = job;

  const current = jobStatusInfo(job.status);
  const stageIndex = STAGES.findIndex((stage) => stage.key === current?.stage);
  // One entry per change of status (payments and notes are also recorded against the status)
  const timeline = job.timeline
    .map((entry) => ({ ...entry, status: toJobStatus(entry.status) }))
    .filter((entry, index, all) => entry.status && entry.status !== 'draft' && entry.status !== all[index - 1]?.status)
    .map((entry) => ({ ...entry, label: jobStatusLabel(entry.status) }));

  return sendSuccess(res, 200, 'Tracking info retrieved successfully', {
    job: {
      ...publicJob,
      parts,
      status: current?.key || job.status,
      statusLabel: current?.label || job.status,
      statusDescription: current?.description || '',
      statusColor: current?.color || 'default',
      problem: Boolean(current?.problem),
      cancelled: current?.key === 'cancelled',
      stages: STAGES.map((stage, index) => ({ ...stage, done: stageIndex >= 0 && index < stageIndex, current: index === stageIndex })),
      timeline,
    },
    support: {
      companyName: company.companyName || 'BestDeal Shipping',
      email: company.supportEmail || null,
      phone: company.supportPhone || null,
    },
  });
}));

module.exports = router;
