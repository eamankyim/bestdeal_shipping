const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { authenticate, authorize, authorizeIf } = require('../middleware/auth');
const { canViewInvoices } = require('../utils/jobAccess');

const invoiceViewers = authorizeIf(canViewInvoices, 'Only finance, admin and Ghana warehouse staff can view invoices.');

// All invoice routes require authentication
router.use(authenticate);

// View invoices (Admin, Finance, Customer Service, Ghana Warehouse)
router.get('/', invoiceViewers, invoiceController.getAllInvoices);
router.get('/:id', invoiceViewers, invoiceController.getInvoiceById);

// Notes on the state of an invoice (Admin, Finance, Customer Service, Ghana Warehouse)
router.post('/:id/notes', invoiceViewers, invoiceController.addInvoiceNote);
router.get('/notes/:noteId/image', invoiceViewers, invoiceController.getInvoiceNoteImage);

// Update invoice (Admin, Finance, Customer Service) - Only for drafts
router.put('/:id', authorize('admin', 'finance', 'customer-service'), invoiceController.updateInvoice);

// Send invoice - Finalize draft (Admin, Finance, Customer Service)
router.post('/:id/send', authorize('admin', 'finance', 'customer-service'), invoiceController.sendInvoice);

// Mark as paid (Admin, Finance, Customer Service)
router.post('/:id/pay', authorize('admin', 'finance', 'customer-service'), invoiceController.markAsPaid);

// Cancel invoice (Admin, Finance, Customer Service)
router.post('/:id/cancel', authorize('admin', 'finance', 'customer-service'), invoiceController.cancelInvoice);

module.exports = router;





