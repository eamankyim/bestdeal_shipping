const prisma = require('../config/database');
const { sendSuccess, sendError, sendPaginatedResponse } = require('../utils/responseUtils');
const { asyncHandler } = require('../middleware/errorHandler');
const { notifyJobCreated, notifyJobStatusChange, notifyDriverAssignment } = require('../services/notificationService');
const { generateTrackingId } = require('../utils/trackingIdGenerator');
const { notifyCustomerOfStatus, sendCustomerMessage } = require('../services/customerMessageService');
const { DELIVERY_STATUSES, normalizeStatus, canAccessJob, canEditJob, canEditJobValue } = require('../utils/jobAccess');
const { buildJobUpdate } = require('../utils/jobEdit');
const { decodeFile, parseImage, contentDisposition } = require('../utils/imageUpload');

const MAX_NOTE_LENGTH = 5000;
const MAX_PROOF_IMAGES = 10;

/** Attach uploaded files ({ fileData, fileName, mimeType }) to a job. */
const saveJobFiles = async (files, { jobId, documentType, uploadedBy }) => {
  // One by one: createMany doesn't support Bytes
  for (const [index, file] of files.entries()) {
    const buffer = file?.buffer || decodeFile(file?.fileData);
    if (!buffer) continue;
    await prisma.jobDocument.create({
      data: {
        jobId,
        documentType,
        fileName: file.fileName || `${documentType}-${index + 1}`,
        fileData: buffer,
        fileSize: buffer.length,
        mimeType: file.mimeType || null,
        uploadedBy,
      },
    });
  }
};

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

  // Normalize role for consistent matching (case-insensitive, hyphen and spaces to underscore)
  const role = typeof req.user.role === 'string'
    ? req.user.role.toLowerCase().replace(/-/g, '_').replace(/\s+/g, '_')
    : '';

  console.log('📋 GET /api/jobs', {
    userId: req.user.id,
    email: req.user.email,
    rawRole: req.user.role,
    normalizedRole: role,
  });

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

  // Apply role-based filtering (role normalized above)
  switch (role) {
    case 'driver':
      // Drivers only see jobs assigned to them
      where.assignedDriverId = req.user.id;
      break;

    case 'delivery_agent': {
      // Same as delivery dashboard: jobs in delivery statuses that are assigned to this agent OR unassigned
      where.status = { in: DELIVERY_STATUSES };
      where.OR = [
        { assignedDeliveryAgentId: req.user.id },
        { assignedDeliveryAgentId: null },
      ];
      break;
    }

    case 'warehouse':
      // Warehouse staff see jobs at their location or in transit
      break;

    case 'customer_service':
    case 'finance':
    case 'admin':
    case 'superadmin':
      // These roles can see all jobs
      break;

    default:
      // Unknown role, restrict to their own created jobs
      where.createdBy = req.user.id;
  }

  console.log('📋 GET /api/jobs filter', { role, where: JSON.stringify(where) });

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
        assignedDeliveryAgent: {
          select: {
            id: true,
            name: true,
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

  console.log('📋 GET /api/jobs result', { total, returned: jobs.length, page, limit });

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
        take: 100,
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
        take: 50,
        orderBy: { uploadedAt: 'desc' },
        select: {
          id: true,
          documentType: true,
          fileName: true,
          fileUrl: true,
          fileSize: true,
          mimeType: true,
          uploadedAt: true,
          uploadedBy: true,
          uploader: {
            select: {
              name: true,
            },
          },
        },
      },
      creator: {
        select: {
          name: true,
          email: true,
        },
      },
      jobNotes: {
        take: 100,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          note: true,
          createdAt: true,
          author: {
            select: {
              name: true,
              role: true,
            },
          },
        },
      },
    },
  });

  if (!job) {
    return sendError(res, 404, 'Job not found');
  }

  if (!canAccessJob(req.user, job)) {
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
    estimatedDelivery,
    parcelDetails,
    specialInstructions,
    priority = 'Standard',
    assignedDriverId,
    documents,
    status,
  } = req.body;

  const packageList = Array.isArray(parcelDetails?.packages) ? parcelDetails.packages.filter(Boolean) : [];
  const normalizedDescription = packageList.length > 0
    ? packageList.map((pkg) => pkg.description || `${pkg.packageType || 'Package'}${pkg.weight ? ` (${pkg.weight}kg)` : ''}`).filter(Boolean).join('; ')
    : (parcelDetails?.description || '');
  const totalPackageWeight = packageList.length > 0
    ? packageList.reduce((sum, pkg) => sum + (Number(pkg.weight) || 0), 0)
    : (parcelDetails?.weight != null ? Number(parcelDetails.weight) : null);
  const packageQuantity = packageList.length > 0 ? packageList.length : (parcelDetails?.quantity || 1);
  const requestedStatus = status || (assignedDriverId ? 'Assigned' : 'Pending Collection');

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
      referenceNumber: req.body.referenceNumber || null,
      receiverName: req.body.receiverName || null,
      receiverAddress: req.body.receiverAddress || null,
      receiverContact: req.body.receiverContact || req.body.receiverPhone || null,
      freightType: req.body.freightType || null,
      packages: packageList,

      pickupAddress,
      deliveryAddress,
      pickupDate: pickupDate ? new Date(pickupDate) : null,
      estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
      // A job created by warehouse staff belongs to their warehouse
      warehouseLocation: req.user.role === 'warehouse' ? req.user.warehouseLocation || null : null,
      description: normalizedDescription || null,
      weight: totalPackageWeight != null ? totalPackageWeight : null,
      dimensionsLength: parcelDetails?.dimensions?.length,
      dimensionsWidth: parcelDetails?.dimensions?.width,
      dimensionsHeight: parcelDetails?.dimensions?.height,
      value: parcelDetails?.value,
      quantity: packageQuantity,
      specialInstructions,
      priority,
      status: requestedStatus,
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
      status: requestedStatus,
      notes: requestedStatus === 'Draft' ? 'Job saved as draft' : (assignedDriverId ? 'Job created and assigned to driver' : 'Job created'),
      updatedBy: req.user.id,
    },
  });

  if (Array.isArray(documents) && documents.length > 0) {
    await saveJobFiles(documents, { jobId: job.id, documentType: 'attachment', uploadedBy: req.user.id });
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
        select: {
          id: true,
          documentType: true,
          fileName: true,
          fileSize: true,
          mimeType: true,
          uploadedAt: true,
          uploadedBy: true,
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

  if (normalizeStatus(requestedStatus) !== 'draft') {
    await sendCustomerMessage('job_created', { customer: jobWithDocuments.customer, job: jobWithDocuments });
  }

  return sendSuccess(res, 201, 'Job created successfully', { job: jobWithDocuments });
});

/**
 * @route   PUT /api/jobs/:id
 * @desc    Update job details. Blank fields keep their stored value, files are only ever added,
 *          and the previous values are kept in the edit history.
 * @access  All staff (drivers and delivery agents: their own jobs)
 */
exports.updateJob = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existingJob = await prisma.job.findUnique({
    where: { id },
  });

  if (!existingJob) {
    return sendError(res, 404, 'Job not found');
  }

  if (!canEditJob(req.user, existingJob)) {
    return sendError(res, 403, 'Access denied. You can only edit jobs assigned to you');
  }

  const { data, oldValues, newValues } = buildJobUpdate(existingJob, req.body, req.user);

  if (data.customerId) {
    const customer = await prisma.customer.findUnique({ where: { id: data.customerId }, select: { id: true } });
    if (!customer) return sendError(res, 400, 'Customer not found');
  }

  const include = {
    customer: true,
    assignedDriver: { select: { id: true, name: true, email: true } },
  };

  // The change and the record of what it replaced are saved together.
  const job = Object.keys(data).length === 0
    ? await prisma.job.findUnique({ where: { id }, include })
    : await prisma.$transaction(async (tx) => {
      const updated = await tx.job.update({ where: { id }, data, include });
      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'update',
          entityType: 'job',
          entityId: id,
          oldValues,
          newValues,
        },
      });
      return updated;
    });

  if (Array.isArray(req.body.documents) && req.body.documents.length > 0) {
    await saveJobFiles(req.body.documents, { jobId: id, documentType: 'attachment', uploadedBy: req.user.id });
  }

  // The only status an edit can change is a draft being finished
  if (data.status) await notifyCustomerOfStatus(job, data.status, existingJob.status);

  return sendSuccess(res, 200, 'Job updated successfully', { job });
});

/**
 * @route   GET /api/jobs/:id/edit-history
 * @desc    Who changed which details, and what they were before
 * @access  All staff (drivers and delivery agents: their own jobs)
 */
exports.getJobEditHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) return sendError(res, 404, 'Job not found');
  if (!canAccessJob(req.user, job)) return sendError(res, 403, 'Access denied');

  const logs = await prisma.auditLog.findMany({
    where: { entityType: 'job', entityId: id, action: 'update' },
    include: { user: { select: { name: true } } },
    orderBy: { timestamp: 'desc' },
    take: 50,
  });

  const customerIds = logs.flatMap((log) => [log.oldValues?.customerId, log.newValues?.customerId]).filter(Boolean);
  const customers = customerIds.length
    ? await prisma.customer.findMany({ where: { id: { in: customerIds } }, select: { id: true, name: true } })
    : [];
  const display = (field, value) =>
    (field === 'customerId' ? customers.find((customer) => customer.id === value)?.name || value : value);

  // Package prices are part of the packages list, so it is hidden together with the job value.
  const hiddenFields = canEditJobValue(req.user) ? [] : ['value', 'packages'];
  const history = logs.map((log) => ({
    id: log.id,
    editedBy: log.user?.name || 'Unknown',
    timestamp: log.timestamp,
    changes: Object.keys(log.newValues || {})
      .filter((field) => !hiddenFields.includes(field))
      .map((field) => ({
        field,
        from: display(field, log.oldValues?.[field] ?? null),
        to: display(field, log.newValues[field]),
      })),
  })).filter((entry) => entry.changes.length > 0);

  return sendSuccess(res, 200, 'Edit history retrieved successfully', { history });
});

/**
 * @route   POST /api/jobs/:id/notes
 * @desc    Add an internal note to a job (staff only, never shown on public tracking)
 * @access  All staff (drivers and delivery agents: their own jobs)
 */
exports.addJobNote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const note = String(req.body.note ?? '').trim();

  if (!note) return sendError(res, 400, 'Please enter a note');
  if (note.length > MAX_NOTE_LENGTH) return sendError(res, 400, `Notes can be up to ${MAX_NOTE_LENGTH} characters`);

  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) return sendError(res, 404, 'Job not found');
  if (!canAccessJob(req.user, job)) return sendError(res, 403, 'Access denied. You can only add notes to jobs assigned to you');

  const jobNote = await prisma.jobNote.create({
    data: { jobId: id, note, createdBy: req.user.id },
    select: {
      id: true,
      note: true,
      createdAt: true,
      author: { select: { name: true, role: true } },
    },
  });

  return sendSuccess(res, 201, 'Note added', { note: jobNote });
});

/**
 * @route   PATCH /api/jobs/:id/status
 * @desc    Update job status
 * @access  Private (role-based)
 */
exports.updateJobStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes = '', proofImages } = req.body;

  // Get current job
  const job = await prisma.job.findUnique({
    where: { id },
  });

  if (!job) {
    return sendError(res, 404, 'Job not found');
  }

  if (!canAccessJob(req.user, job)) {
    return sendError(res, 403, 'Access denied. You can only update jobs assigned to you');
  }

  // When marking as collected, require 1–10 proof images from drivers
  const normalizedStatus = normalizeStatus(status);
  const images = Array.isArray(proofImages) ? proofImages.filter((image) => image?.fileData) : [];
  if (req.user.role === 'driver' && normalizedStatus === 'collected') {
    if (images.length < 1 || images.length > MAX_PROOF_IMAGES) {
      return sendError(res, 400, 'Collection requires between 1 and 10 proof images');
    }
  }

  // Whoever marks an item delivered must photograph it, so everyone can see what was handed over.
  if (normalizedStatus === 'delivered') {
    const photos = images.map((image, index) => parseImage(image, `delivery-photo-${index + 1}`));
    const deliveryPhotos = photos.filter(Boolean);
    if (deliveryPhotos.length < 1 || images.length > MAX_PROOF_IMAGES) {
      return sendError(res, 400, 'Please attach between 1 and 10 photos of the item being delivered');
    }
    // Files are stored before the status moves, so a job is never "delivered" without its photo.
    await saveJobFiles(deliveryPhotos, { jobId: id, documentType: 'proof_of_delivery', uploadedBy: req.user.id });
    await saveJobFiles(images.filter((_, index) => !photos[index]), { jobId: id, documentType: 'attachment', uploadedBy: req.user.id });
  } else if (images.length > 0) {
    await saveJobFiles(
      images.map((image, index) => ({
        ...image,
        fileName: image.fileName || `${normalizedStatus}-proof-${index + 1}.jpg`,
        mimeType: image.mimeType || 'image/jpeg',
      })),
      { jobId: id, documentType: 'photo', uploadedBy: req.user.id }
    );
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

  if (normalizedStatus !== normalizeStatus(job.status)) {
    await notifyCustomerOfStatus(updatedJob, status, job.status);
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

  // Check that the user exists and is a driver or delivery agent
  const assignee = await prisma.user.findUnique({
    where: { id: driverId },
  });

  if (!assignee) {
    return sendError(res, 400, 'Invalid driver ID');
  }
  if (!['driver', 'delivery_agent', 'delivery-agent'].includes(assignee.role)) {
    return sendError(res, 400, 'Invalid driver ID');
  }

  const existingJob = await prisma.job.findUnique({ where: { id }, select: { status: true } });
  if (!existingJob) {
    return sendError(res, 404, 'Job not found');
  }

  const isDriver = assignee.role === 'driver';
  const updateData = {
    status: 'Assigned',
    ...(isDriver ? { assignedDriverId: driverId } : { assignedDeliveryAgentId: driverId }),
  };

  // Update job
  const job = await prisma.job.update({
    where: { id },
    data: updateData,
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
      notes: `Assigned to ${isDriver ? 'driver' : 'delivery agent'} ${assignee.name}`,
      updatedBy: req.user.id,
    },
  });

  // Send notification to assignee
  try {
    await notifyDriverAssignment(job, driverId, req.user.id);
    console.log(`📬 Notification sent for job ${job.trackingId}`);
  } catch (error) {
    console.error('⚠️ Failed to send driver assignment notification:', error);
  }

  // Swapping one driver for another is not news for the customer
  if (normalizeStatus(existingJob.status) !== 'assigned') {
    await notifyCustomerOfStatus(job, 'Assigned', existingJob.status);
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

  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) return sendError(res, 404, 'Job not found');
  if (!canAccessJob(req.user, job)) return sendError(res, 403, 'Access denied');

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
  const agent = deliveryAgentId
    ? await prisma.user.findUnique({ where: { id: deliveryAgentId } })
    : null;

  if (!agent || !agent.active || (agent.role !== 'delivery-agent' && agent.role !== 'delivery_agent')) {
    return sendError(res, 400, 'Choose an active dispatch rider');
  }

  const existingJob = await prisma.job.findUnique({ where: { id } });
  if (!existingJob) {
    return sendError(res, 404, 'Job not found');
  }
  if (['delivered', 'cancelled', 'closed', 'draft'].includes(normalizeStatus(existingJob.status))) {
    return sendError(res, 400, `This job is ${existingJob.status.toLowerCase()}, so it cannot be dispatched`);
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
      notes: `Assigned to dispatch rider ${agent.name}`,
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

  if (normalizeStatus(existingJob.status) !== 'out_for_delivery') {
    await notifyCustomerOfStatus(job, 'out_for_delivery');
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
          status: true,
          assignedDriverId: true,
          assignedDeliveryAgentId: true,
          createdBy: true,
        },
      },
    },
  });

  if (!document) {
    return sendError(res, 404, 'Document not found');
  }

  if (!canAccessJob(req.user, document.job)) {
    return sendError(res, 403, 'Access denied');
  }

  if (!document.fileData) {
    return sendError(res, 404, 'File data not found');
  }

  // Set appropriate headers
  res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
  res.setHeader('Content-Disposition', contentDisposition(document.fileName));
  res.setHeader('Content-Length', document.fileData.length);

  // Send the file
  return res.send(document.fileData);
});



// Both clients use these endpoints. Payment writes are serialized per job to
// prevent concurrent requests from overwriting balances or overpaying a job.
exports.recordPayment = asyncHandler(async (req, res) => {
  const { amountPaid, paymentMethod, paymentReference = '', notes = '' } = req.body;
  const amount = Number(amountPaid);
  if (!Number.isFinite(amount) || amount <= 0 || Math.abs(Math.round(amount * 100) - amount * 100) > 1e-7) {
    return sendError(res, 400, 'Enter a positive amount with at most two decimal places');
  }
  if (!['cash', 'bank', 'pos', 'bank_transfer'].includes(String(paymentMethod).toLowerCase())) {
    return sendError(res, 400, 'Invalid payment method');
  }
  const result = await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM jobs WHERE id = ${req.params.id} FOR UPDATE`;
    const job = await tx.job.findUnique({ where: { id: req.params.id } });
    if (!job) return { error: 'Job not found', code: 404 };
    const paid = Math.round(Number(job.amountPaid) * 100);
    const total = Math.round(Number(job.value || 0) * 100);
    const cents = Math.round(amount * 100);
    if (paid + cents > total) return { error: 'Payment exceeds the outstanding balance', code: 400 };
    const updated = await tx.job.update({ where: { id: job.id }, data: { amountPaid: (paid + cents) / 100 } });
    await tx.jobTimeline.create({ data: {
      jobId: job.id, status: job.status, updatedBy: req.user.id,
      notes: `Payment GBP ${amount.toFixed(2)} (${paymentMethod}); reference: ${paymentReference}. ${notes}`,
    } });
    return { job: updated };
  });
  if (result.error) return sendError(res, result.code, result.error);
  return sendSuccess(res, 200, 'Payment recorded successfully', result);
});

exports.revertStatus = asyncHandler(async (req, res) => {
  const { previousStatus, comment } = req.body;
  if (!previousStatus || !String(comment || '').trim()) return sendError(res, 400, 'Previous status and reason are required');
  const result = await prisma.$transaction(async tx => {
    const job = await tx.job.findUnique({ where: { id: req.params.id }, include: { timeline: true } });
    if (!job) return { error: 'Job not found', code: 404 };
    if (!job.timeline.some(entry => entry.status === previousStatus) || previousStatus === job.status) {
      return { error: 'Choose a previous status from this job history', code: 400 };
    }
    const updated = await tx.job.update({ where: { id: job.id }, data: { status: previousStatus } });
    await tx.jobTimeline.create({ data: { jobId: job.id, status: previousStatus, notes: `Reverted from ${job.status}: ${comment}`, updatedBy: req.user.id } });
    return { job: updated };
  });
  if (result.error) return sendError(res, result.code, result.error);
  return sendSuccess(res, 200, 'Status reverted successfully', result);
});
