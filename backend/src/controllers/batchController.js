const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/responseUtils');
const { notifyBatchCreated } = require('../services/notificationService');
const { notifyCustomersOfStatus } = require('../services/customerMessageService');
const { isGhanaWarehouse, normalizeStatus } = require('../utils/jobAccess');
const { isBlank } = require('../utils/jobEdit');

const WAREHOUSE_STATUSES = ['arrived_at_warehouse', 'At Warehouse', 'at_warehouse', 'at_uk_warehouse', 'at_ghana_warehouse'];
const EDITABLE_BATCH_STATUSES = ['In Preparation', 'Ready to Ship'];

const destinationFromRoute = (route) => route.split('→')[1]?.trim() || route;
/** Tell the customers of these jobs that they are in a batch. */
const notifyBatched = async (jobIds) => {
  if (jobIds.length === 0) return;
  const jobs = await prisma.job.findMany({ where: { id: { in: jobIds } }, include: { customer: true } });
  await notifyCustomersOfStatus(jobs, 'batched');
};

const sumField = (jobs, field) => jobs.reduce((sum, job) => sum + (parseFloat(job[field]) || 0), 0);

// Map batch DB fields to legacy client-friendly names to avoid mobile crashes
const mapBatchForClient = (batch) => {
  if (!batch) return batch;

  // Clone to avoid mutating Prisma object
  const b = JSON.parse(JSON.stringify(batch));

  // Legacy/compat fields expected by mobile app
  b.vesselName = b.carrier || null;
  b.flightNumber = b.trackingNumber || null;
  b.departureDate = b.estimatedShipDate || null;
  b.estimatedArrivalDate = b.estimatedArrival || null;
  b.sealNumber = b.trackingNumber || null;

  // Ensure jobs is always an array
  b.jobs = Array.isArray(b.jobs) ? b.jobs : [];

  // Map jobs to include safe customer object and expected fields
  b.jobs = b.jobs.map((job) => ({
    ...job,
    referenceNumber: job.referenceNumber || null,
    customer: job.customer || null,
  }));

  return b;
};

/**
 * Create a new batch
 * POST /api/batches
 */
exports.createBatch = async (req, res) => {
  try {
    const {
      name,
      route,
      vessel,
      containerNumber,
      departureDate,
      eta,
      notes,
      jobs // Array of job IDs
    } = req.body;

    // Validation
    if (!name || !route || !jobs || jobs.length === 0) {
      return sendError(res, 400, 'Batch name, route, and at least one job are required');
    }

    // Generate batch ID
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const batchId = `BATCH-${timestamp}-${random}`;

    // Get job details to calculate totals
    const jobDetails = await prisma.job.findMany({
      where: {
        id: { in: jobs },
        batchId: null,
        status: { in: WAREHOUSE_STATUSES }
      },
      select: {
        id: true,
        weight: true,
        value: true,
        status: true
      }
    });

    if (jobDetails.length === 0) {
      return sendError(res, 400, 'No valid jobs found. Jobs must have "arrived_at_warehouse" status');
    }

    if (jobDetails.length !== jobs.length) {
      return sendError(res, 400, 'Some jobs are not available for batching');
    }

    // Calculate totals
    const totalWeight = sumField(jobDetails, 'weight');
    const totalValue = sumField(jobDetails, 'value');

    // Create batch and update jobs in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the batch
      const batch = await tx.batch.create({
        data: {
          batchId,
          name,
          route: route, // Store full route
          destination: destinationFromRoute(route),
          carrier: vessel,
          trackingNumber: containerNumber,
          totalJobs: jobDetails.length,
          totalWeight,
          totalValue,
          status: 'In Preparation',
          estimatedShipDate: departureDate ? new Date(departureDate) : null,
          estimatedArrival: eta ? new Date(eta) : null,
          notes,
          createdBy: req.user.id
        }
      });

      // Update all jobs to "batched" status and assign batchId
      await tx.job.updateMany({
        where: {
          id: { in: jobs }
        },
        data: {
          status: 'batched',
          batchId: batch.id
        }
      });

      // Create timeline entries for all jobs
      const timelineEntries = jobs.map(jobId => ({
        jobId,
        status: 'batched',
        notes: `Job added to batch ${batchId}`,
        updatedBy: req.user.id,
        timestamp: new Date()
      }));

      await tx.jobTimeline.createMany({
        data: timelineEntries
      });

      return batch;
    });

    // Send notifications
    try {
      const notificationCount = await notifyBatchCreated(result, req.user.id);
      console.log(`📬 Sent ${notificationCount} notifications for batch ${result.batchId}`);
    } catch (error) {
      console.error('⚠️ Failed to send batch notifications:', error);
    }

    try {
      await notifyBatched(jobs);
    } catch (error) {
      console.error('⚠️ Failed to message customers about the batch:', error);
    }

    const clientBatch = mapBatchForClient(result);

    return sendSuccess(res, 201, 'Batch created successfully', {
      batch: clientBatch,
      jobsUpdated: jobDetails.length
    });

  } catch (error) {
    console.error('Error creating batch:', error);
    return sendError(res, 500, 'Failed to create batch', error.message);
  }
};

/**
 * Get all batches
 * GET /api/batches
 */
exports.getAllBatches = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    }

    const batches = await prisma.batch.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        jobs: {
          select: {
            id: true,
            trackingId: true,
            referenceNumber: true,
            status: true,
            weight: true,
            value: true,
            priority: true,
            deliveryAddress: true,
            customer: {
              select: {
                name: true
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

    const total = await prisma.batch.count({ where });

    // Map batches for client compatibility
    const clientBatches = batches.map(mapBatchForClient);

    return sendSuccess(res, 200, 'Batches retrieved successfully', {
      batches: clientBatches,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching batches:', error);
    return sendError(res, 500, 'Failed to fetch batches', error.message);
  }
};

/**
 * Get batch by ID
 * GET /api/batches/:id
 */
exports.getBatchById = async (req, res) => {
  try {
    const { id } = req.params;

    const batch = await prisma.batch.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        jobs: {
          include: {
            customer: {
              select: {
                name: true,
                email: true,
                phone: true
              }
            }
          }
        }
      }
    });

    if (!batch) {
      return sendError(res, 404, 'Batch not found');
    }

    const clientBatch = mapBatchForClient(batch);

    return sendSuccess(res, 200, 'Batch retrieved successfully', { batch: clientBatch });

  } catch (error) {
    console.error('Error fetching batch:', error);
    return sendError(res, 500, 'Failed to fetch batch', error.message);
  }
};

/**
 * Edit a batch while it is still being prepared. Blank fields keep their stored value.
 * When `jobs` is sent it is the full list of jobs the batch should hold: new ones are added,
 * and ones left out go back to the warehouse (they are never deleted).
 * PUT /api/batches/:id
 */
exports.updateBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, route, vessel, containerNumber, departureDate, eta, notes, jobs } = req.body;

    if (isGhanaWarehouse(req.user)) {
      return sendError(res, 403, 'Ghana Warehouse users can view batches but cannot edit them');
    }

    const result = await prisma.$transaction(async (tx) => {
      // Lock the batch so it cannot be shipped or edited by someone else halfway through
      await tx.$queryRaw`SELECT id FROM batches WHERE id = ${id} FOR UPDATE`;
      const batch = await tx.batch.findUnique({ where: { id }, include: { jobs: { select: { id: true } } } });
      if (!batch) return { error: 'Batch not found', code: 404 };
      if (!EDITABLE_BATCH_STATUSES.includes(batch.status)) {
        return { error: `Only batches in preparation can be edited. This batch is ${batch.status}.`, code: 400 };
      }

      let added = [];
      if (Array.isArray(jobs)) {
        const current = batch.jobs.map((job) => job.id);
        const wanted = [...new Set(jobs)];
        added = wanted.filter((jobId) => !current.includes(jobId));
        const removed = current.filter((jobId) => !wanted.includes(jobId));

        if (added.length > 0) {
          const { count } = await tx.job.updateMany({
            where: { id: { in: added }, batchId: null, status: { in: WAREHOUSE_STATUSES } },
            data: { status: 'batched', batchId: id },
          });
          // Throw so that the whole edit is rolled back
          if (count !== added.length) throw Object.assign(new Error('Some jobs are no longer available for batching'), { statusCode: 400 });
          await tx.jobTimeline.createMany({
            data: added.map((jobId) => ({
              jobId,
              status: 'batched',
              notes: `Job added to batch ${batch.batchId}`,
              updatedBy: req.user.id,
            })),
          });
        }

        for (const jobId of removed) {
          const lastWarehouseEntry = await tx.jobTimeline.findFirst({
            where: { jobId, status: { in: WAREHOUSE_STATUSES } },
            orderBy: { timestamp: 'desc' },
          });
          const status = normalizeStatus(lastWarehouseEntry?.status) || 'arrived_at_warehouse';
          await tx.job.update({
            where: { id: jobId },
            data: { status: status === 'at_warehouse' ? 'arrived_at_warehouse' : status, batchId: null },
          });
          await tx.jobTimeline.create({
            data: {
              jobId,
              status: status === 'at_warehouse' ? 'arrived_at_warehouse' : status,
              notes: `Job removed from batch ${batch.batchId}`,
              updatedBy: req.user.id,
            },
          });
        }
      }

      const batchJobs = await tx.job.findMany({ where: { batchId: id }, select: { weight: true, value: true } });
      const fields = {
        ...(!isBlank(name) && { name: name.trim() }),
        ...(!isBlank(route) && { route: route.trim(), destination: destinationFromRoute(route.trim()) }),
        ...(!isBlank(vessel) && { carrier: vessel.trim() }),
        ...(!isBlank(containerNumber) && { trackingNumber: containerNumber.trim() }),
        ...(!isBlank(departureDate) && { estimatedShipDate: new Date(departureDate) }),
        ...(!isBlank(eta) && { estimatedArrival: new Date(eta) }),
        ...(!isBlank(notes) && { notes: notes.trim() }),
      };
      const updated = await tx.batch.update({
        where: { id },
        data: {
          ...fields,
          totalJobs: batchJobs.length,
          totalWeight: sumField(batchJobs, 'weight'),
          totalValue: sumField(batchJobs, 'value'),
        },
        include: {
          jobs: { include: { customer: { select: { name: true, email: true, phone: true } } } },
        },
      });
      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'update',
          entityType: 'batch',
          entityId: id,
          oldValues: {
            ...Object.fromEntries(Object.keys(fields).map((field) => [field, batch[field]])),
            jobs: batch.jobs.map((job) => job.id),
          },
          newValues: { ...fields, jobs: updated.jobs.map((job) => job.id) },
        },
      });
      return { batch: updated, added };
    }, { timeout: 20000 });

    if (result.error) return sendError(res, result.code, result.error);

    try {
      await notifyBatched(result.added);
    } catch (error) {
      console.error('⚠️ Failed to message customers about the batch:', error);
    }
    return sendSuccess(res, 200, 'Batch updated successfully', { batch: mapBatchForClient(result.batch) });
  } catch (error) {
    if (error.statusCode) return sendError(res, error.statusCode, error.message);
    console.error('Error updating batch:', error);
    return sendError(res, 500, 'Failed to update batch', error.message);
  }
};

/**
 * Update batch status
 * PATCH /api/batches/:id/status
 */
exports.updateBatchStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const existingBatch = await prisma.batch.findUnique({ where: { id } });
    if (!existingBatch) {
      return sendError(res, 404, 'Batch not found');
    }

    const batch = await prisma.batch.update({
      where: { id },
      data: {
        status,
        ...(status === 'Shipped' && { shippedAt: new Date() }),
        // Keep the notes written while the batch was being prepared
        ...(notes && { notes: [existingBatch.notes, notes].filter(Boolean).join('\n') })
      },
      include: {
        jobs: {
          select: {
            id: true
          }
        }
      }
    });

    // Update all jobs in the batch based on batch status
    let jobStatus = null;
    let jobStatusNotes = '';

    switch (status) {
      case 'Shipped':
        jobStatus = 'shipped';
        jobStatusNotes = `Batch ${batch.batchId} shipped`;
        break;
      case 'In Transit':
        jobStatus = 'in_transit';
        jobStatusNotes = `Batch ${batch.batchId} in transit`;
        break;
      case 'Arrived':
        jobStatus = 'arrived_at_destination';
        jobStatusNotes = `Batch ${batch.batchId} arrived at destination`;
        break;
      case 'Distributed':
        jobStatus = 'out_for_delivery';
        jobStatusNotes = `Batch ${batch.batchId} distributed for delivery`;
        break;
    }

    // Update jobs if there's a corresponding job status
    if (jobStatus) {
      await prisma.job.updateMany({
        where: {
          batchId: id
        },
        data: {
          status: jobStatus
        }
      });

      // Create timeline entries
      const timelineEntries = batch.jobs.map(job => ({
        jobId: job.id,
        status: jobStatus,
        notes: jobStatusNotes,
        updatedBy: req.user.id,
        timestamp: new Date()
      }));

      await prisma.jobTimeline.createMany({
        data: timelineEntries
      });

      console.log(`✅ Updated ${batch.jobs.length} jobs to status: ${jobStatus}`);

      // Send notifications for each job status change
      const { notifyJobStatusChange } = require('../services/notificationService');
      try {
        // Fetch updated jobs with full details for notifications
        const updatedJobs = await prisma.job.findMany({
          where: {
            batchId: id
          },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        });

        await notifyCustomersOfStatus(updatedJobs, jobStatus);

        // Send notification for each job
        for (const job of updatedJobs) {
          try {
            await notifyJobStatusChange(job, jobStatus, req.user.id);
          } catch (error) {
            console.error(`⚠️ Failed to send notification for job ${job.trackingId}:`, error);
          }
        }
        console.log(`📬 Sent notifications for ${updatedJobs.length} job status changes from batch ${batch.batchId}`);
      } catch (error) {
        console.error('⚠️ Failed to send batch status change notifications:', error);
      }
    }

    // Update shippedAt timestamp for Shipped status
    if (status === 'Shipped') {
      await prisma.batch.update({
        where: { id },
        data: { shippedAt: new Date() }
      });
    }

    return sendSuccess(res, 200, 'Batch status updated successfully', { batch });

  } catch (error) {
    console.error('Error updating batch status:', error);
    return sendError(res, 500, 'Failed to update batch status', error.message);
  }
};




