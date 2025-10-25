const express = require('express');
const router = express.Router();
const batchController = require('../controllers/batchController');
const { authenticate, authorize } = require('../middleware/auth');
const { createBatchValidation, updateBatchStatusValidation } = require('../middleware/validation');

// All batch routes require authentication and admin/warehouse role
router.use(authenticate);

// Create batch (Admin, Warehouse)
router.post('/', authorize('admin', 'warehouse'), createBatchValidation, batchController.createBatch);

// Get all batches (Admin, Warehouse)
router.get('/', authorize('admin', 'warehouse'), batchController.getAllBatches);

// Get batch by ID (Admin, Warehouse)
router.get('/:id', authorize('admin', 'warehouse'), batchController.getBatchById);

// Update batch status (Admin, Warehouse)
router.patch('/:id/status', authorize('admin', 'warehouse'), updateBatchStatusValidation, batchController.updateBatchStatus);

module.exports = router;

