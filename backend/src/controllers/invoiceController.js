const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/responseUtils');

/**
 * Auto-create draft invoice for delivered job
 * Called internally when job status changes to "delivered"
 */
exports.createDraftInvoice = async (jobId, userId) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        customer: true
      }
    });

    if (!job) {
      throw new Error('Job not found');
    }

    // Check if invoice already exists for this job
    const existingInvoiceItem = await prisma.invoiceItem.findFirst({
      where: { jobId }
    });

    if (existingInvoiceItem) {
      console.log(`Invoice already exists for job ${job.trackingId}`);
      return null;
    }

    // Calculate pricing based on weight and service
    const basePrice = job.priority === 'Urgent' ? 100 : job.priority === 'Express' ? 75 : 50;
    const pricePerKg = job.priority === 'Urgent' ? 4 : job.priority === 'Express' ? 3 : 2;
    const weight = parseFloat(job.weight) || 0;
    const subtotal = basePrice + (weight * pricePerKg);
    const tax = subtotal * 0.20; // 20% VAT
    const total = subtotal + tax;

    // Generate invoice number
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    const invoiceNumber = `INV-${timestamp}-${random}`;

    // Create invoice with job as line item
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId: job.customerId,
        subtotal,
        tax,
        total,
        status: 'Draft', // Auto-created drafts
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        createdBy: userId,
        items: {
          create: {
            jobId: job.id,
            description: `Shipping Service - ${job.trackingId} (${job.priority})`,
            quantity: 1,
            unitPrice: subtotal,
            total: subtotal
          }
        }
      },
      include: {
        customer: true,
        items: true
      }
    });

    console.log(`✅ Draft invoice ${invoiceNumber} created for job ${job.trackingId}`);
    return invoice;

  } catch (error) {
    console.error('Error creating draft invoice:', error);
    throw error;
  }
};

/**
 * Get all invoices
 * GET /api/invoices
 */
exports.getAllInvoices = async (req, res) => {
  try {
    const { status, customerId, page = 1, limit = 50 } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    }
    if (customerId) {
      where.customerId = customerId;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        items: {
          include: {
            job: {
              select: {
                id: true,
                trackingId: true,
                status: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    const total = await prisma.invoice.count({ where });

    return sendSuccess(res, 200, 'Invoices retrieved successfully', {
      invoices,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching invoices:', error);
    return sendError(res, 500, 'Failed to fetch invoices', error.message);
  }
};

/**
 * Get invoice by ID
 * GET /api/invoices/:id
 */
exports.getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        items: {
          include: {
            job: {
              select: {
                trackingId: true,
                pickupAddress: true,
                deliveryAddress: true,
                weight: true,
                status: true
              }
            }
          }
        }
      }
    });

    if (!invoice) {
      return sendError(res, 404, 'Invoice not found');
    }

    return sendSuccess(res, 200, 'Invoice retrieved successfully', { invoice });

  } catch (error) {
    console.error('Error fetching invoice:', error);
    return sendError(res, 500, 'Failed to fetch invoice', error.message);
  }
};

/**
 * Update invoice (for editing drafts)
 * PUT /api/invoices/:id
 */
exports.updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { subtotal, tax, notes, dueDate } = req.body;

    const invoice = await prisma.invoice.findUnique({
      where: { id }
    });

    if (!invoice) {
      return sendError(res, 404, 'Invoice not found');
    }

    // Only drafts can be edited
    if (invoice.status !== 'Draft') {
      return sendError(res, 400, 'Only draft invoices can be edited');
    }

    const total = (parseFloat(subtotal) || 0) + (parseFloat(tax) || 0);

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        ...(subtotal && { subtotal: parseFloat(subtotal) }),
        ...(tax && { tax: parseFloat(tax) }),
        total,
        ...(notes && { notes }),
        ...(dueDate && { dueDate: new Date(dueDate) })
      },
      include: {
        customer: true,
        items: {
          include: {
            job: true
          }
        }
      }
    });

    return sendSuccess(res, 200, 'Invoice updated successfully', { invoice: updatedInvoice });

  } catch (error) {
    console.error('Error updating invoice:', error);
    return sendError(res, 500, 'Failed to update invoice', error.message);
  }
};

/**
 * Send invoice (finalize draft)
 * POST /api/invoices/:id/send
 */
exports.sendInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id }
    });

    if (!invoice) {
      return sendError(res, 404, 'Invoice not found');
    }

    if (invoice.status !== 'Draft') {
      return sendError(res, 400, 'Only draft invoices can be sent');
    }

    const sentInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: 'Pending',
        issueDate: new Date()
      },
      include: {
        customer: true,
        items: {
          include: {
            job: true
          }
        }
      }
    });

    // TODO: Send email notification to customer
    console.log(`📧 Invoice ${sentInvoice.invoiceNumber} sent to ${sentInvoice.customer.email}`);

    return sendSuccess(res, 200, 'Invoice sent successfully', { invoice: sentInvoice });

  } catch (error) {
    console.error('Error sending invoice:', error);
    return sendError(res, 500, 'Failed to send invoice', error.message);
  }
};

/**
 * Mark invoice as paid
 * POST /api/invoices/:id/pay
 */
exports.markAsPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, paymentReference, notes } = req.body;

    const invoice = await prisma.invoice.findUnique({
      where: { id }
    });

    if (!invoice) {
      return sendError(res, 404, 'Invoice not found');
    }

    if (invoice.status === 'Paid') {
      return sendError(res, 400, 'Invoice is already marked as paid');
    }

    const paidInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: 'Paid',
        paidDate: new Date(),
        paymentMethod,
        paymentReference,
        ...(notes && { notes })
      },
      include: {
        customer: true,
        items: true
      }
    });

    return sendSuccess(res, 200, 'Invoice marked as paid', { invoice: paidInvoice });

  } catch (error) {
    console.error('Error marking invoice as paid:', error);
    return sendError(res, 500, 'Failed to mark invoice as paid', error.message);
  }
};

/**
 * Cancel invoice
 * POST /api/invoices/:id/cancel
 */
exports.cancelInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id }
    });

    if (!invoice) {
      return sendError(res, 404, 'Invoice not found');
    }

    if (invoice.status === 'Paid') {
      return sendError(res, 400, 'Cannot cancel paid invoices');
    }

    const cancelledInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: 'Cancelled'
      }
    });

    return sendSuccess(res, 200, 'Invoice cancelled', { invoice: cancelledInvoice });

  } catch (error) {
    console.error('Error cancelling invoice:', error);
    return sendError(res, 500, 'Failed to cancel invoice', error.message);
  }
};





