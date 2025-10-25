const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { authenticate, authorize } = require('../middleware/auth');
const {
  createJobValidation,
  updateJobStatusValidation,
  paginationValidation,
  uuidValidation,
} = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: Get all jobs
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of jobs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Job'
 */
// All authenticated users can view jobs (filtered by role in controller)
router.get('/', paginationValidation, jobController.getAllJobs);

/**
 * @swagger
 * /api/jobs/{id}:
 *   get:
 *     summary: Get job by ID
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Job details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Job'
 */
// All authenticated users can view job details (ownership checked in controller)
router.get('/:id', uuidValidation, jobController.getJobById);

/**
 * @swagger
 * /api/jobs:
 *   post:
 *     summary: Create new job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - pickupAddress
 *               - deliveryAddress
 *             properties:
 *               customerId:
 *                 type: string
 *                 format: uuid
 *               pickupAddress:
 *                 type: string
 *               deliveryAddress:
 *                 type: string
 *               description:
 *                 type: string
 *               weight:
 *                 type: number
 *               value:
 *                 type: number
 *               priority:
 *                 type: string
 *                 enum: [Standard, Express, Urgent]
 *     responses:
 *       201:
 *         description: Job created successfully
 */
// Only admin and customer-service can create jobs
router.post('/', authorize('admin', 'customer-service'), createJobValidation, jobController.createJob);

/**
 * @swagger
 * /api/jobs/{id}:
 *   put:
 *     summary: Update job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pickupAddress:
 *                 type: string
 *               deliveryAddress:
 *                 type: string
 *               description:
 *                 type: string
 *               weight:
 *                 type: number
 *               value:
 *                 type: number
 *     responses:
 *       200:
 *         description: Job updated successfully
 */
// Only admin can fully update job details
router.put('/:id', authorize('admin'), uuidValidation, jobController.updateJob);

/**
 * @swagger
 * /api/jobs/{id}:
 *   delete:
 *     summary: Delete job (Admin only)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Job deleted successfully
 *       403:
 *         description: Forbidden - Admin only
 */
router.delete('/:id', authorize('admin'), uuidValidation, jobController.deleteJob);

/**
 * @swagger
 * /api/jobs/{id}/status:
 *   patch:
 *     summary: Update job status
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Pending Collection, Assigned, En Route to Customer, Collected, Returning to Warehouse, At Warehouse, Batched, Shipped, In Transit, Arrived at Destination, Out for Delivery, Delivered]
 *     responses:
 *       200:
 *         description: Status updated successfully
 */
// Drivers, delivery agents, warehouse staff, and admins can update job status
router.patch('/:id/status', authorize('admin', 'driver', 'delivery-agent', 'warehouse'), uuidValidation, updateJobStatusValidation, jobController.updateJobStatus);

/**
 * @swagger
 * /api/jobs/{id}/assign-driver:
 *   post:
 *     summary: Assign driver to job (Admin/Warehouse only)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - driverId
 *             properties:
 *               driverId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Driver assigned successfully
 */
router.post('/:id/assign-driver', authorize('admin', 'warehouse'), uuidValidation, jobController.assignDriver);

/**
 * @swagger
 * /api/jobs/{id}/assign-delivery-agent:
 *   post:
 *     summary: Assign delivery agent to job (Admin/Warehouse only)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deliveryAgentId
 *             properties:
 *               deliveryAgentId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Delivery agent assigned successfully
 */
router.post('/:id/assign-delivery-agent', authorize('admin', 'warehouse'), uuidValidation, jobController.assignDeliveryAgent);

/**
 * @swagger
 * /api/jobs/{id}/timeline:
 *   get:
 *     summary: Get job timeline/history
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Job timeline
 */
// All authenticated users can view job timeline
router.get('/:id/timeline', uuidValidation, jobController.getJobTimeline);

/**
 * @swagger
 * /api/jobs/documents/{documentId}:
 *   get:
 *     summary: Download/view document
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Document file
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 */
// All authenticated users can download documents (permissions checked in controller)
router.get('/documents/:documentId', jobController.getDocument);

module.exports = router;


