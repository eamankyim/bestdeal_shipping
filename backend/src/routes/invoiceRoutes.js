const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { authenticate, authorize } = require('../middleware/auth');

// All invoice routes require authentication
router.use(authenticate);

// Get all invoices (Admin, Finance)
router.get('/', authorize('admin', 'finance'), invoiceController.getAllInvoices);

// Get invoice by ID (Admin, Finance)
router.get('/:id', authorize('admin', 'finance'), invoiceController.getInvoiceById);

// Update invoice (Admin, Finance) - Only for drafts
router.put('/:id', authorize('admin', 'finance'), invoiceController.updateInvoice);

// Send invoice - Finalize draft (Admin, Finance)
router.post('/:id/send', authorize('admin', 'finance'), invoiceController.sendInvoice);

// Mark as paid (Admin, Finance)
router.post('/:id/pay', authorize('admin', 'finance'), invoiceController.markAsPaid);

// Cancel invoice (Admin, Finance)
router.post('/:id/cancel', authorize('admin', 'finance'), invoiceController.cancelInvoice);

module.exports = router;





