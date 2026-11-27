const prisma = require('../config/database');
const { sendSuccess, sendError, sendPaginatedResponse } = require('../utils/responseUtils');
const { asyncHandler } = require('../middleware/errorHandler');
const { notifyJobCreated, notifyJobStatusChange, notifyDriverAssignment } = require('../services/notificationService');
const { generateTrackingId } = require('../utils/trackingIdGenerator');
const { notifyCustomerOfStatus, sendCustomerMessage } = require('../services/customerMessageService');
const { canAccessJob, canEditJob, canEditJobValue, jobScopeFor } = require('../utils/jobAccess');
const { actorOf, toJobStatus, jobStatusLabel, checkJobMove, assignmentProblem } = require('../utils/statuses');
const { normalizeLines, lineTotals } = require('../utils/packages');
const { splitJob } = require('../services/jobSplit');
const { runLater } = require('../utils/background');
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
    search = '',
  } = req.query;

  const skip = (page - 1) * limit;
  const text = String(search).trim().slice(0, 100);
  const matches = { contains: text, mode: 'insensitive' };

  // ?status= takes one status or several separated by commas
  const statuses = String(status).split(',').filter(Boolean).map(toJobStatus);
  if (statuses.includes(null)) return sendError(res, 400, 'Unknown status');

  // Each role only sees the jobs it may open; the scope comes last so it cannot be overridden
  const where = {
    ...(statuses.length > 0 && { status: { in: statuses } }),
    ...(customerId && { customerId }),
    ...(assignedDriverId && { assignedDriverId }),
    ...(priority && { priority }),
    // ?search= finds a job by tracking ID, reference, customer or receiver
    ...(text && {
      OR: [
        { trackingId: matches },
        { referenceNumber: matches },
        { receiverName: matches },
        { customer: { name: matches } },
      ],
    }),
    ...(startDate && endDate && {
      pickupDate: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    }),
    ...jobScopeFor(req.user),
  };

  // Lists only need who and where; a job's history, documents and notes come with GET /jobs/:id
  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true, customerType: true } },
        assignedDriver: { select: { id: true, name: true } },
        assignedDeliveryAgent: { select: { id: true, name: true } },
        batch: { select: { id: true, batchId: true, name: true, destination: true } },
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

  // A split order: every part, the first job included, so each part can link to the others
  const rootId = job.splitFromId || (job.partNumber ? job.id : null);
  const parts = rootId
    ? await prisma.job.findMany({
      where: { OR: [{ id: rootId }, { splitFromId: rootId }] },
      select: { id: true, trackingId: true, partNumber: true, status: true, description: true },
      orderBy: { partNumber: 'asc' },
    })
    : [];

  return sendSuccess(res, 200, 'Job retrieved successfully', { job: { ...job, parts } });
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

  // Item lines (utils/packages.js) decide the description, weight, number of items and, when every
  // line has a price, the value. Jobs without lines keep the single description and value sent.
  const packageList = normalizeLines(parcelDetails?.packages);
  const itemTotals = lineTotals(packageList);
  const hasLines = packageList.length > 0;
  const normalizedDescription = hasLines ? itemTotals.description : (parcelDetails?.description || '');
  const totalPackageWeight = hasLines ? itemTotals.weight : (parcelDetails?.weight != null ? Number(parcelDetails.weight) : null);
  const packageQuantity = hasLines ? itemTotals.quantity : (parcelDetails?.quantity || 1);
  // A new job is a draft or booked; when a driver is chosen straight away it is assigned
  const isDraft = toJobStatus(status) === 'draft';
  let driverId = null;
  if (assignedDriverId && !isDraft) {
    if (!['uk', 'office'].includes(actorOf(req.user))) {
      return sendError(res, 403, 'Only the office and the UK warehouse assign drivers');
    }
    const driver = await prisma.user.findUnique({ where: { id: assignedDriverId }, select: { role: true, active: true } });
    if (!driver || driver.role !== 'driver' || !driver.active) return sendError(res, 400, 'Choose an active driver');
    driverId = assignedDriverId;
  }
  // A job the UK warehouse books is already there (the customer brought it in), unless a driver is
  // sent to collect it or they say it is still with the customer (`atWarehouse: false`).
  // Everyone else books collections.
  const atWarehouse = !isDraft && !driverId && actorOf(req.user) === 'uk' && req.body.atWarehouse !== false;
  if (!isDraft && !atWarehouse && !String(pickupAddress || '').trim()) {
    return sendError(res, 400, 'Pickup address is required for a job that has to be collected');
  }
  const requestedStatus = isDraft ? 'draft' : (driverId ? 'assigned' : (atWarehouse ? 'at_uk_warehouse' : 'pending_collection'));

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

      pickupAddress: String(pickupAddress || '').trim() || (atWarehouse ? 'Brought to the UK warehouse by the customer' : ''),
      deliveryAddress,
      pickupDate: pickupDate ? new Date(pickupDate) : (atWarehouse ? new Date() : null),
      estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
      // A job created by warehouse staff belongs to their warehouse
      warehouseLocation: req.user.role === 'warehouse' ? req.user.warehouseLocation || null : null,
      description: normalizedDescription || null,
      weight: totalPackageWeight != null ? totalPackageWeight : null,
      dimensionsLength: parcelDetails?.dimensions?.length,
      dimensionsWidth: parcelDetails?.dimensions?.width,
      dimensionsHeight: parcelDetails?.dimensions?.height,
      value: (hasLines && itemTotals.value !== null) ? itemTotals.value : parcelDetails?.value,
      quantity: packageQuantity,
      specialInstructions,
      priority,
      status: requestedStatus,
      assignedDriverId: driverId,
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
      notes: isDraft ? 'Job saved as draft' : (driverId ? 'Job created and assigned to driver' : (atWarehouse ? 'Brought to the UK warehouse by the customer' : 'Job created')),
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

  // Staff and the customer are told after the answer is sent, so creating a job never waits for them
  runLater('new job notifications', () => notifyJobCreated(jobWithDocuments, req.user.id));
  if (!isDraft) {
    runLater('booking message', () => sendCustomerMessage('pending_collection', { customer: jobWithDocuments.customer, job: jobWithDocuments }));
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
  if (data.status) runLater('booking message', () => notifyCustomerOfStatus(job, data.status, existingJob.status));

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
  const reason = String(notes || '').trim();

  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) {
    return sendError(res, 404, 'Job not found');
  }
  if (!canAccessJob(req.user, job)) {
    return sendError(res, 403, 'Access denied. You can only update jobs assigned to you');
  }

  // The allowed next steps, and whether they need a reason or photos, come from utils/statuses.js
  const target = toJobStatus(status);
  const move = checkJobMove(req.user, job, target);
  if (!move.ok) {
    return sendError(res, 400, move.message);
  }
  if (move.reason && !reason) {
    return sendError(res, 400, 'Please give a reason');
  }

  const images = Array.isArray(proofImages) ? proofImages.filter((image) => image?.fileData) : [];
  if (images.length > MAX_PROOF_IMAGES) {
    return sendError(res, 400, `Please attach at most ${MAX_PROOF_IMAGES} photos`);
  }
  const photos = images.map((image, index) => parseImage(image, `${target}-photo-${index + 1}`));
  if (move.photos && !photos.some(Boolean)) {
    return sendError(res, 400, target === 'delivered'
      ? 'Please attach at least one photo of the item being delivered'
      : 'Please attach at least one photo of the collected items');
  }
  // Files are saved before the status moves, so a job is never collected or delivered without its photos
  await saveJobFiles(photos.filter(Boolean), { jobId: id, documentType: target === 'delivered' ? 'proof_of_delivery' : 'photo', uploadedBy: req.user.id });
  await saveJobFiles(images.filter((_, index) => !photos[index]), { jobId: id, documentType: 'attachment', uploadedBy: req.user.id });

  // Only moves the job if nobody changed its status in the meantime
  const { count } = await prisma.job.updateMany({
    where: { id, status: job.status },
    data: { status: target, ...(target === 'delivered' && { actualDelivery: new Date() }) },
  });
  if (count === 0) {
    return sendError(res, 409, 'Someone else has just changed this job. Refresh and try again.');
  }
  await prisma.jobTimeline.create({
    data: { jobId: id, status: target, notes: reason, updatedBy: req.user.id },
  });

  const updatedJob = await prisma.job.findUnique({
    where: { id },
    include: { customer: true, assignedDriver: { select: { name: true, email: true } } },
  });

  // Every delivered job gets a draft invoice
  if (target === 'delivered') {
    try {
      const invoiceController = require('./invoiceController');
      await invoiceController.createDraftInvoice(id, req.user.id);
    } catch (error) {
      console.error('⚠️ Failed to auto-create invoice, but job was updated:', error.message);
    }
  }

  // Staff and the customer are told after the answer is sent
  runLater('status notifications', () => notifyJobStatusChange(updatedJob, target, req.user.id));
  runLater('customer status message', () => notifyCustomerOfStatus(updatedJob, target, job.status));

  return sendSuccess(res, 200, 'Job status updated successfully', { job: updatedJob });
});

/**
 * @route   POST /api/jobs/:id/split
 * @desc    Split a job at the UK warehouse: `going` says how many of each item line stay in this job;
 *          the rest becomes a new part of the same order, waiting for a later batch.
 * @access  UK warehouse and office (utils/statuses.js)
 */
exports.splitJob = asyncHandler(async (req, res) => {
  try {
    const result = await prisma.$transaction((tx) => splitJob(tx, req.params.id, req.body.going, req.user), { timeout: 20000 });
    if (!result.part) return sendError(res, 400, 'Everything goes now, so there is nothing to split');
    return sendSuccess(res, 200, `Split: part ${result.part.partNumber} is ${result.part.trackingId}`, result);
  } catch (error) {
    if (error.statusCode) return sendError(res, error.statusCode, error.message);
    throw error;
  }
});

/**
 * @route   POST /api/jobs/:id/assign-driver
 * @desc    Assign driver to job
 * @access  Admin/Warehouse
 */
exports.assignDriver = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { driverId } = req.body;

  const driver = driverId ? await prisma.user.findUnique({ where: { id: driverId } }) : null;
  if (!driver || driver.role !== 'driver' || !driver.active) {
    return sendError(res, 400, 'Choose an active driver');
  }

  const existingJob = await prisma.job.findUnique({ where: { id }, select: { status: true } });
  if (!existingJob) {
    return sendError(res, 404, 'Job not found');
  }
  const problem = assignmentProblem('driver', req.user, existingJob);
  if (problem) {
    return sendError(res, problem.code, problem.message);
  }

  const { count } = await prisma.job.updateMany({
    where: { id, status: existingJob.status },
    data: { status: 'assigned', assignedDriverId: driverId },
  });
  if (count === 0) {
    return sendError(res, 409, 'Someone else has just changed this job. Refresh and try again.');
  }
  await prisma.jobTimeline.create({
    data: { jobId: id, status: 'assigned', notes: `Assigned to driver ${driver.name}`, updatedBy: req.user.id },
  });

  const job = await prisma.job.findUnique({
    where: { id },
    include: { customer: true, assignedDriver: { select: { id: true, name: true, email: true } } },
  });

  runLater('driver notification', () => notifyDriverAssignment(job, driverId, req.user.id));
  // Swapping one driver for another is not news for the customer
  if (toJobStatus(existingJob.status) !== 'assigned') {
    runLater('customer status message', () => notifyCustomerOfStatus(job, 'assigned', existingJob.status));
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

  // Anything that has happened to a real job stays on record; cancel it instead
  if (!['draft', 'cancelled'].includes(toJobStatus(job.status))) {
    return sendError(res, 400, 'Only drafts and cancelled jobs can be deleted. Cancel the job first.');
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

  const agent = deliveryAgentId ? await prisma.user.findUnique({ where: { id: deliveryAgentId } }) : null;
  if (!agent || !agent.active || agent.role !== 'delivery-agent') {
    return sendError(res, 400, 'Choose an active dispatch rider');
  }

  const existingJob = await prisma.job.findUnique({ where: { id }, select: { status: true } });
  if (!existingJob) {
    return sendError(res, 404, 'Job not found');
  }
  const problem = assignmentProblem('rider', req.user, existingJob);
  if (problem) {
    return sendError(res, problem.code, problem.message);
  }

  const { count } = await prisma.job.updateMany({
    where: { id, status: existingJob.status },
    data: { assignedDeliveryAgentId: deliveryAgentId, status: 'out_for_delivery' },
  });
  if (count === 0) {
    return sendError(res, 409, 'Someone else has just changed this job. Refresh and try again.');
  }
  await prisma.jobTimeline.create({
    data: { jobId: id, status: 'out_for_delivery', notes: `Assigned to dispatch rider ${agent.name}`, updatedBy: req.user.id },
  });

  const job = await prisma.job.findUnique({
    where: { id },
    include: { customer: true, assignedDeliveryAgent: { select: { id: true, name: true, email: true } } },
  });

  const { createNotification } = require('../services/notificationService');
  runLater('rider notification', () => createNotification({
      userId: deliveryAgentId,
      type: 'assignment',
      title: 'New Delivery Assignment',
      message: `You have been assigned to deliver job ${job.trackingId}`,
      relatedEntityType: 'job',
      relatedEntityId: job.id,
    }));
  // Swapping one rider for another is not news for the customer
  if (toJobStatus(existingJob.status) !== 'out_for_delivery') {
    runLater('customer status message', () => notifyCustomerOfStatus(job, 'out_for_delivery', existingJob.status));
  }

  return sendSuccess(res, 200, 'Dispatch rider assigned successfully', { job });
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
  // A saved file never changes, so this browser can keep it (only this user's browser: "private")
  res.setHeader('Cache-Control', 'private, max-age=31536000, immutable');

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
  const target = toJobStatus(previousStatus);
  if (!target || !String(comment || '').trim()) return sendError(res, 400, 'Previous status and reason are required');
  // These follow the job's batch or rider; setting them by hand would leave the job out of step
  const followsSomethingElse = ['batched', 'shipped', 'arrived_in_ghana', 'out_for_delivery'];
  const result = await prisma.$transaction(async tx => {
    const job = await tx.job.findUnique({ where: { id: req.params.id }, include: { timeline: true } });
    if (!job) return { error: 'Job not found', code: 404 };
    const current = toJobStatus(job.status);
    if (followsSomethingElse.includes(current) || followsSomethingElse.includes(target)) {
      return { error: 'This status follows the job\'s batch or dispatch rider. Change the batch or the rider instead.', code: 400 };
    }
    if (target === current || !job.timeline.some(entry => toJobStatus(entry.status) === target)) {
      return { error: 'Choose a previous status from this job history', code: 400 };
    }
    const updated = await tx.job.update({ where: { id: job.id }, data: { status: target } });
    await tx.jobTimeline.create({ data: { jobId: job.id, status: target, notes: `Reverted from ${jobStatusLabel(current)}: ${comment}`, updatedBy: req.user.id } });
    return { job: updated };
  });
  if (result.error) return sendError(res, result.code, result.error);
  return sendSuccess(res, 200, 'Status reverted successfully', result);
});
