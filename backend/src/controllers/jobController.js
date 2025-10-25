const prisma = require('../config/database');
const { sendSuccess, sendError, sendPaginatedResponse } = require('../utils/responseUtils');
const { asyncHandler } = require('../middleware/errorHandler');
const { notifyJobCreated, notifyJobStatusChange, notifyDriverAssignment } = require('../services/notificationService');
const { generateTrackingId } = require('../utils/trackingIdGenerator');

/**
 * @route   GET /api/jobs
 * @desc    Get all jobs (paginated & filterable)
 * @access  Private
 */
exports.getAllJobs = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status = '',
    customerId = '',
    assignedDriverId = '',
    priority = '',
    startDate = '',
    endDate = '',
  } = req.query;

  const skip = (page - 1) * limit;

  // Build filter based on user role
  const where = {
    ...(status && { status }),
    ...(customerId && { customerId }),
    ...(assignedDriverId && { assignedDriverId }),
    ...(priority && { priority }),
    ...(startDate && endDate && {
      pickupDate: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    }),
  };

  // Apply role-based filtering
  switch (req.user.role) {
    case 'driver':
      // Drivers only see jobs assigned to them
      where.assignedDriverId = req.user.id;
      break;
    
    case 'delivery-agent':
      // Delivery agents only see jobs assigned to them
      where.assignedDeliveryAgentId = req.user.id;
      break;
    
    case 'warehouse':
      // Warehouse staff see jobs at their location or in transit
      // TODO: Add warehouse location filtering when warehouse assignment is implemented
      // For now, they can see all jobs (will be filtered by location later)
      break;
    
    case 'customer-service':
    case 'finance':
    case 'admin':
      // These roles can see all jobs
      break;
    
    default:
      // Unknown role, restrict to their own created jobs
      where.createdBy = req.user.id;
  }

  // Get jobs
  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            customerType: true,
          },
        },
        assignedDriver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        batch: {
          select: {
            id: true,
            batchId: true,
            destination: true,
          },
        },
        timeline: {
          include: {
            updater: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            timestamp: 'asc'
          }
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.job.count({ where }),
  ]);

  return sendPaginatedResponse(res, jobs, page, limit, total);
});

/**
 * @route   GET /api/jobs/:id
 * @desc    Get single job by ID
 * @access  Private
 */
exports.getJobById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      customer: true,
      assignedDriver: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      assignedDeliveryAgent: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      batch: true,
      timeline: {
        include: {
          updater: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { timestamp: 'asc' },
      },
      documents: {
        include: {
          uploader: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { uploadedAt: 'desc' },
      },
      creator: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!job) {
    return sendError(res, 404, 'Job not found');
  }

  // Check ownership for drivers and delivery agents
  if (req.user.role === 'driver' && job.assignedDriverId !== req.user.id) {
    return sendError(res, 403, 'Access denied. You can only view jobs assigned to you');
  }
  
  if (req.user.role === 'delivery-agent' && job.assignedDeliveryAgentId !== req.user.id) {
    return sendError(res, 403, 'Access denied. You can only view jobs assigned to you');
  }

  return sendSuccess(res, 200, 'Job retrieved successfully', { job });
});

/**
 * @route   POST /api/jobs
 * @desc    Create new job
 * @access  Private
 */
exports.createJob = asyncHandler(async (req, res) => {
  const {
    customerId,
    newCustomer,
    pickupAddress,
    deliveryAddress,
    pickupDate,
    parcelDetails,
    specialInstructions,
    priority = 'Standard',
    assignedDriverId,
    documents,
  } = req.body;

  let finalCustomerId = customerId;

  // If creating a new customer
  if (!customerId && newCustomer) {
    const customer = await prisma.customer.create({
      data: {
        name: newCustomer.name,
        email: newCustomer.email,
        phone: newCustomer.phone,
        address: newCustomer.address,
        customerType: newCustomer.customerType,
        createdBy: req.user.id,
      },
    });
    finalCustomerId = customer.id;
  }

  if (!finalCustomerId) {
    return sendError(res, 400, 'Please provide either customerId or newCustomer details');
  }

  // Generate tracking ID
  let trackingId;
  let isUnique = false;
  
  while (!isUnique) {
    trackingId = generateTrackingId();
    const existing = await prisma.job.findUnique({
      where: { trackingId },
    });
    if (!existing) isUnique = true;
  }

  // Create job
  const job = await prisma.job.create({
    data: {
      trackingId,
      customerId: finalCustomerId,
      pickupAddress,
      deliveryAddress,
      pickupDate: pickupDate ? new Date(pickupDate) : null,
      description: parcelDetails?.description,
      weight: parcelDetails?.weight,
      dimensionsLength: parcelDetails?.dimensions?.length,
      dimensionsWidth: parcelDetails?.dimensions?.width,
      dimensionsHeight: parcelDetails?.dimensions?.height,
      value: parcelDetails?.value,
      quantity: parcelDetails?.quantity || 1,
      specialInstructions,
      priority,
      status: assignedDriverId ? 'assigned' : 'pending',
      assignedDriverId: assignedDriverId || null,
      createdBy: req.user.id,
    },
    include: {
      customer: true,
      assignedDriver: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // Create initial timeline entry
  await prisma.jobTimeline.create({
    data: {
      jobId: job.id,
      status: assignedDriverId ? 'assigned' : 'pending',
      notes: assignedDriverId ? 'Job created and assigned to driver' : 'Job created',
      updatedBy: req.user.id,
    },
  });

  // Create documents if provided
  if (documents && Array.isArray(documents) && documents.length > 0) {
    // Create documents one by one (createMany doesn't support Bytes)
    for (const doc of documents) {
      let fileBuffer = null;
      
      // Convert base64 to Buffer if fileData is provided
      if (doc.fileData) {
        // Remove data URL prefix (e.g., "data:image/png;base64,")
        const base64Data = doc.fileData.split(',')[1] || doc.fileData;
        fileBuffer = Buffer.from(base64Data, 'base64');
      }
      
      await prisma.jobDocument.create({
        data: {
          jobId: job.id,
          documentType: 'attachment',
          fileName: doc.fileName,
          fileData: fileBuffer,
          fileSize: doc.fileSize || null,
          mimeType: doc.mimeType || null,
          uploadedBy: req.user.id,
        },
      });
    }
  }

  // Fetch job with documents
  const jobWithDocuments = await prisma.job.findUnique({
    where: { id: job.id },
    include: {
      customer: true,
      assignedDriver: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      documents: {
        include: {
          uploader: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  // Send notifications
  try {
    const notificationCount = await notifyJobCreated(jobWithDocuments, req.user.id);
    console.log(`📬 Sent ${notificationCount} notifications for job ${jobWithDocuments.trackingId}`);
  } catch (error) {
    console.error('⚠️ Failed to send notifications:', error);
    // Don't fail the request if notifications fail
  }

  return sendSuccess(res, 201, 'Job created successfully', { job: jobWithDocuments });
});

/**
 * @route   PUT /api/jobs/:id
 * @desc    Update job details
 * @access  Private
 */
exports.updateJob = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    pickupAddress,
    deliveryAddress,
    pickupDate,
    parcelDetails,
    specialInstructions,
    priority,
  } = req.body;

  // Check if job exists
  const existingJob = await prisma.job.findUnique({
    where: { id },
  });

  if (!existingJob) {
    return sendError(res, 404, 'Job not found');
  }

  // Update job
  const job = await prisma.job.update({
    where: { id },
    data: {
      ...(pickupAddress && { pickupAddress }),
      ...(deliveryAddress && { deliveryAddress }),
      ...(pickupDate && { pickupDate: new Date(pickupDate) }),
      ...(parcelDetails?.description !== undefined && { description: parcelDetails.description }),
      ...(parcelDetails?.weight && { weight: parcelDetails.weight }),
      ...(parcelDetails?.dimensions?.length && { dimensionsLength: parcelDetails.dimensions.length }),
      ...(parcelDetails?.dimensions?.width && { dimensionsWidth: parcelDetails.dimensions.width }),
      ...(parcelDetails?.dimensions?.height && { dimensionsHeight: parcelDetails.dimensions.height }),
      ...(parcelDetails?.value !== undefined && { value: parcelDetails.value }),
      ...(parcelDetails?.quantity && { quantity: parcelDetails.quantity }),
      ...(specialInstructions !== undefined && { specialInstructions }),
      ...(priority && { priority }),
    },
    include: {
      customer: true,
    },
  });

  return sendSuccess(res, 200, 'Job updated successfully', { job });
});

/**
 * @route   PATCH /api/jobs/:id/status
 * @desc    Update job status
 * @access  Private (role-based)
 */
exports.updateJobStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes = '' } = req.body;

  // Get current job
  const job = await prisma.job.findUnique({
    where: { id },
  });

  if (!job) {
    return sendError(res, 404, 'Job not found');
  }

  // Check ownership for non-admin users
  if (req.user.role === 'driver') {
    if (job.assignedDriverId !== req.user.id) {
      return sendError(res, 403, 'Access denied. You can only update jobs assigned to you');
    }
  } else if (req.user.role === 'delivery-agent') {
    if (job.assignedDeliveryAgentId !== req.user.id) {
      return sendError(res, 403, 'Access denied. You can only update jobs assigned to you');
    }
  }

  // Update job status
  const updatedJob = await prisma.job.update({
    where: { id },
    data: { status },
    include: {
      customer: true,
      assignedDriver: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  // Create timeline entry
  await prisma.jobTimeline.create({
    data: {
      jobId: id,
      status,
      notes,
      updatedBy: req.user.id,
    },
  });

  // Auto-create draft invoice when job is delivered
  if (status === 'delivered') {
    try {
      const invoiceController = require('./invoiceController');
      await invoiceController.createDraftInvoice(id, req.user.id);
      console.log(`✅ Draft invoice auto-created for delivered job ${updatedJob.trackingId}`);
    } catch (error) {
      console.error('⚠️ Failed to auto-create invoice, but job was updated:', error.message);
      // Don't fail the job update if invoice creation fails
    }
  }

  // Send notifications for status change
  try {
    const notificationCount = await notifyJobStatusChange(updatedJob, status, req.user.id);
    console.log(`📬 Sent ${notificationCount} notifications for status change: ${status}`);
  } catch (error) {
    console.error('⚠️ Failed to send status change notifications:', error);
  }

  return sendSuccess(res, 200, 'Job status updated successfully', { job: updatedJob });
});

/**
 * @route   POST /api/jobs/:id/assign-driver
 * @desc    Assign driver to job
 * @access  Admin/Warehouse
 */
exports.assignDriver = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { driverId } = req.body;

  // Check if driver exists
  const driver = await prisma.user.findUnique({
    where: { id: driverId },
  });

  if (!driver || driver.role !== 'driver') {
    return sendError(res, 400, 'Invalid driver ID');
  }

  // Update job
  const job = await prisma.job.update({
    where: { id },
    data: {
      assignedDriverId: driverId,
      status: 'Assigned',
    },
    include: {
      customer: true,
      assignedDriver: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  // Create timeline entry
  await prisma.jobTimeline.create({
    data: {
      jobId: id,
      status: 'Assigned',
      notes: `Assigned to driver ${driver.name}`,
      updatedBy: req.user.id,
    },
  });

  // Send notification to driver
  try {
    await notifyDriverAssignment(job, driverId, req.user.id);
    console.log(`📬 Notification sent to driver for job ${job.trackingId}`);
  } catch (error) {
    console.error('⚠️ Failed to send driver assignment notification:', error);
  }

  return sendSuccess(res, 200, 'Driver assigned successfully', { job });
});

/**
 * @route   GET /api/jobs/:id/timeline
 * @desc    Get job timeline/history
 * @access  Private
 */
exports.getJobTimeline = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const timeline = await prisma.jobTimeline.findMany({
    where: { jobId: id },
    include: {
      updater: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { timestamp: 'asc' },
  });

  return sendSuccess(res, 200, 'Timeline retrieved successfully', { timeline });
});

/**
 * @route   DELETE /api/jobs/:id
 * @desc    Cancel/Delete job
 * @access  Admin
 */
exports.deleteJob = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if job can be deleted (only if not yet collected)
  const job = await prisma.job.findUnique({
    where: { id },
  });

  if (!job) {
    return sendError(res, 404, 'Job not found');
  }

  const unDeletableStatuses = ['Collected', 'At Warehouse', 'Batched', 'Shipped', 'In Transit', 'Delivered'];
  
  if (unDeletableStatuses.includes(job.status)) {
    return sendError(res, 400, `Cannot delete job with status: ${job.status}`);
  }

  // Delete job (cascade will delete timeline and documents)
  await prisma.job.delete({
    where: { id },
  });

  return sendSuccess(res, 200, 'Job deleted successfully');
});

/**
 * @route   POST /api/jobs/:id/assign-delivery-agent
 * @desc    Assign delivery agent to job
 * @access  Admin/Warehouse
 */
exports.assignDeliveryAgent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { deliveryAgentId } = req.body;

  // Check if delivery agent exists
  const agent = await prisma.user.findUnique({
    where: { id: deliveryAgentId },
  });

  if (!agent || agent.role !== 'delivery-agent') {
    return sendError(res, 400, 'Invalid delivery agent ID');
  }

  // Update job
  const job = await prisma.job.update({
    where: { id },
    data: {
      assignedDeliveryAgentId: deliveryAgentId,
      status: 'out_for_delivery',
    },
    include: {
      customer: true,
      assignedDeliveryAgent: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  // Create timeline entry
  await prisma.jobTimeline.create({
    data: {
      jobId: id,
      status: 'out_for_delivery',
      notes: `Assigned to delivery agent ${agent.name}`,
      updatedBy: req.user.id,
    },
  });

  // Send notification to delivery agent
  try {
    const { createNotification } = require('../services/notificationService');
    await createNotification({
      userId: deliveryAgentId,
      type: 'assignment',
      title: 'New Delivery Assignment',
      message: `You have been assigned to deliver job ${job.trackingId}`,
      relatedEntityType: 'job',
      relatedEntityId: job.id,
    });
    console.log(`📬 Notification sent to delivery agent for job ${job.trackingId}`);
  } catch (error) {
    console.error('⚠️ Failed to send delivery agent notification:', error);
  }

  return sendSuccess(res, 200, 'Delivery agent assigned successfully', { job });
});

/**
 * @route   GET /api/jobs/documents/:documentId
 * @desc    Download/view document
 * @access  Private
 */
exports.getDocument = asyncHandler(async (req, res) => {
  const { documentId } = req.params;

  const document = await prisma.jobDocument.findUnique({
    where: { id: documentId },
    include: {
      job: {
        select: {
          id: true,
          assignedDriverId: true,
          assignedDeliveryAgentId: true,
        },
      },
    },
  });

  if (!document) {
    return sendError(res, 404, 'Document not found');
  }

  // Check permissions (drivers/agents can only view their assigned jobs)
  if (req.user.role === 'driver' && document.job.assignedDriverId !== req.user.id) {
    return sendError(res, 403, 'Access denied');
  }
  
  if (req.user.role === 'delivery-agent' && document.job.assignedDeliveryAgentId !== req.user.id) {
    return sendError(res, 403, 'Access denied');
  }

  if (!document.fileData) {
    return sendError(res, 404, 'File data not found');
  }

  // Set appropriate headers
  res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `inline; filename="${document.fileName}"`);
  res.setHeader('Content-Length', document.fileData.length);

  // Send the file
  return res.send(document.fileData);
});


