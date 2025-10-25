const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @swagger
 * /api/dashboard/warehouse:
 *   get:
 *     summary: Get warehouse dashboard data
 *     description: Retrieve comprehensive warehouse statistics including jobs, batches, and recent activity
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Warehouse dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     jobStats:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         pendingCollection:
 *                           type: integer
 *                         collected:
 *                           type: integer
 *                         atWarehouse:
 *                           type: integer
 *                         arrivedAtWarehouse:
 *                           type: integer
 *                         batched:
 *                           type: integer
 *                         shipped:
 *                           type: integer
 *                     batchStats:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         inPreparation:
 *                           type: integer
 *                         shipped:
 *                           type: integer
 *                     jobsReadyForBatching:
 *                       type: object
 *                       properties:
 *                         count:
 *                           type: integer
 *                         totalWeight:
 *                           type: number
 *                         totalValue:
 *                           type: number
 *                         jobs:
 *                           type: array
 *                           items:
 *                             type: object
 *                     recentBatches:
 *                       type: array
 *                       items:
 *                         type: object
 *                     jobsAtWarehouse:
 *                       type: array
 *                       items:
 *                         type: object
 *                     todayActivity:
 *                       type: integer
 *                     unassignedJobs:
 *                       type: integer
 *                     recentActivity:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Warehouse role required
 */
router.get('/warehouse', authenticate, authorize('warehouse', 'admin', 'superadmin'), dashboardController.getWarehouseDashboard);

/**
 * @swagger
 * /api/dashboard/driver:
 *   get:
 *     summary: Get driver dashboard data
 *     description: Retrieve driver's assigned jobs and statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Driver dashboard data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Driver role required
 */
router.get('/driver', authenticate, authorize('driver', 'admin', 'superadmin'), dashboardController.getDriverDashboard);

/**
 * @swagger
 * /api/dashboard/delivery:
 *   get:
 *     summary: Get delivery agent dashboard data
 *     description: Retrieve delivery agent's assigned deliveries and statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Delivery dashboard data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Delivery agent role required
 */
router.get('/delivery', authenticate, authorize('delivery-agent', 'admin', 'superadmin'), dashboardController.getDeliveryDashboard);

/**
 * @swagger
 * /api/dashboard/finance:
 *   get:
 *     summary: Get finance dashboard data
 *     description: Retrieve comprehensive financial statistics including invoices, revenue, and payments
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Finance dashboard data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Finance role required
 */
router.get('/finance', authenticate, authorize('finance', 'admin', 'superadmin'), dashboardController.getFinanceDashboard);

module.exports = router;

