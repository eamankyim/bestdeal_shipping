const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');
const { dashboardLimiter } = require('../middleware/rateLimiter');

// Apply dashboard-specific rate limiter to all dashboard routes
router.use(dashboardLimiter);
router.use(authenticate);

// Superadmin and customer service pass every authorize() check (middleware/auth.js).
// Each dashboard's lists use the status keys from utils/statuses.js.

/**
 * @swagger
 * /api/dashboard/overview:
 *   get:
 *     summary: The office's overview
 *     description: Jobs in each status, jobs needing attention (failed collections and deliveries), recent jobs, revenue this month and unpaid invoices.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 */
router.get('/overview', authorize('admin'), dashboardController.getOverview);

/**
 * @swagger
 * /api/dashboard/warehouse/uk:
 *   get:
 *     summary: UK warehouse dashboard
 *     description: Jobs waiting for a driver, coming in with drivers, waiting at the warehouse for a batch, and batches being prepared. For UK warehouse staff and the office.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 */
router.get('/warehouse/uk', authorize('warehouse', 'admin'), dashboardController.getUKWarehouseDashboard);

/**
 * @swagger
 * /api/dashboard/warehouse/ghana:
 *   get:
 *     summary: Ghana warehouse dashboard
 *     description: Batches on the way, parcels to check in, parcels needing a dispatch rider, and parcels out for delivery. For Ghana warehouse staff and the office.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 */
router.get('/warehouse/ghana', authorize('warehouse', 'admin'), dashboardController.getGhanaWarehouseDashboard);

/**
 * @swagger
 * /api/dashboard/driver:
 *   get:
 *     summary: The signed-in driver's collections
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 */
router.get('/driver', authorize('driver'), dashboardController.getDriverDashboard);

/**
 * @swagger
 * /api/dashboard/delivery:
 *   get:
 *     summary: The signed-in dispatch rider's deliveries
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 */
router.get('/delivery', authorize('delivery-agent'), dashboardController.getDeliveryDashboard);

/**
 * @swagger
 * /api/dashboard/finance:
 *   get:
 *     summary: Invoices and revenue
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 */
router.get('/finance', authorize('finance', 'admin'), dashboardController.getFinanceDashboard);

module.exports = router;
