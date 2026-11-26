const express = require('express');
const router = express.Router();
const packageDetails = require('../middleware/packageDetails');
const jobController = require('../controllers/jobController');
const { authenticate, authorize, authorizeIf } = require('../middleware/auth');
const { canCreateJob, isStaff, canEditJobs } = require('../utils/jobAccess');
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
 *         description: One status key, or several separated by commas
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         description: Part of a tracking ID, reference, customer name or receiver name
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
// Admin, customer service and UK-side warehouse staff can create jobs
router.post('/', authorizeIf(canCreateJob, 'Only admin, customer service and UK warehouse staff can create jobs.'), packageDetails, createJobValidation, jobController.createJob);

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
// All staff can edit job details (the controller limits drivers and delivery agents to their own jobs)
router.put('/:id', authorizeIf(canEditJobs, 'Only staff can edit jobs; dispatch riders cannot.'), uuidValidation, packageDetails, jobController.updateJob);

// All staff can add notes to a job, and see what was changed by earlier edits
router.post('/:id/notes', authorizeIf(isStaff, 'Only staff can add notes.'), uuidValidation, jobController.addJobNote);
router.get('/:id/edit-history', authorizeIf(isStaff, 'Only staff can view the edit history.'), uuidValidation, jobController.getJobEditHistory);

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
 *                 description: The status key to move to. GET /api/statuses lists the moves the signed-in user may make, and which need a reason (notes) or photos (proofImages).
 *                 example: collected
 *               notes:
 *                 type: string
 *               proofImages:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Status updated successfully
 */
// Which role may make which move is checked in the controller (utils/statuses.js)
router.patch('/:id/status', authorize('admin', 'driver', 'delivery-agent', 'warehouse'), uuidValidation, updateJobStatusValidation, jobController.updateJobStatus);

/**
 * @swagger
 * /api/jobs/{id}/split:
 *   post:
 *     summary: Split a job at the UK warehouse
 *     description: Some of the job's items go now and the rest wait for a later batch. `going` has one number per
 *       item line (in the job's `packages` order) - how many of that item stay in this job. The rest becomes a new
 *       part of the same order with its own tracking ID (e.g. SHIP-...-2), status, batch, delivery and invoice.
 *       Only for the UK warehouse and the office, while the job is At UK Warehouse and not in a batch.
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [going]
 *             properties:
 *               going:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [3, 0]
 *     responses:
 *       200:
 *         description: The job (what goes now) and the new part (what waits)
 */
router.post('/:id/split', authorize('admin', 'warehouse'), uuidValidation, jobController.splitJob);

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

router.post('/:id/payment', authorize('admin', 'finance'), uuidValidation, jobController.recordPayment);
router.post('/:id/revert-status', authorize('admin'), uuidValidation, jobController.revertStatus);

module.exports = router;


