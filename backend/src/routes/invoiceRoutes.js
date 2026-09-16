const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { authenticate, authorize } = require('../middleware/auth');

// All invoice routes require authentication
router.use(authenticate);

// Get all invoices (Admin, Finance, Customer Service)
router.get('/', authorize('admin', 'finance', 'customer-service'), invoiceController.getAllInvoices);

// Get invoice by ID (Admin, Finance, Customer Service)
router.get('/:id', authorize('admin', 'finance', 'customer-service'), invoiceController.getInvoiceById);

// Update invoice (Admin, Finance, Customer Service) - Only for drafts
router.put('/:id', authorize('admin', 'finance', 'customer-service'), invoiceController.updateInvoice);

// Send invoice - Finalize draft (Admin, Finance, Customer Service)
router.post('/:id/send', authorize('admin', 'finance', 'customer-service'), invoiceController.sendInvoice);

// Mark as paid (Admin, Finance, Customer Service)
router.post('/:id/pay', authorize('admin', 'finance', 'customer-service'), invoiceController.markAsPaid);

// Cancel invoice (Admin, Finance, Customer Service)
router.post('/:id/cancel', authorize('admin', 'finance', 'customer-service'), invoiceController.cancelInvoice);

module.exports = router;





