const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/responseUtils');
const { notifyBatchCreated } = require('../services/notificationService');
const { notifyCustomersOfStatus } = require('../services/customerMessageService');
const { isBlank } = require('../utils/jobEdit');
const { splitJob } = require('../services/jobSplit');
const { runLater } = require('../utils/background');
const {
  BATCHABLE, toBatchStatus, batchStatusInfo, nextBatchStatuses, canEditBatch, canCreateBatch,
} = require('../utils/statuses');

const destinationFromRoute = (route) => route.split('→')[1]?.trim() || route;
/** Tell the customers of these jobs that they are in a batch. */
const notifyBatched = async (jobIds) => {
  if (jobIds.length === 0) return;
  const jobs = await prisma.job.findMany({ where: { id: { in: jobIds } }, include: { customer: true } });
  await notifyCustomersOfStatus(jobs, 'batched');
};

const sumField = (jobs, field) => jobs.reduce((sum, job) => sum + (parseFloat(job[field]) || 0), 0);

/** A `split` request ({ jobId: [counts] }) may only name jobs that are going in the batch. */
const checkSplitRequest = (split, jobs) => {
  if (!split || typeof split !== 'object' || Array.isArray(split)) return 'Split must say, for each job, how many of each item go now';
  const stray = Object.keys(split).find((jobId) => !jobs.includes(jobId));
  return stray ? 'Only jobs going in this batch can be split' : null;
};

/** Splits the jobs that go only in part (services/jobSplit.js); returns the new parts left waiting. */
const splitForBatch = async (tx, split, user) => {
  const parts = [];
  for (const [jobId, going] of Object.entries(split)) {
    const { part } = await splitJob(tx, jobId, going, user);
    if (part) parts.push(part);
  }
  return parts;
};

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
  b.containerNumber = b.trackingNumber || null;
  b.sealNumber = b.sealNumber || null;

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
      sealNumber,
      departureDate,
      eta,
      notes,
      jobs, // Array of job IDs
      split = {}, // { jobId: [how many of each item line go now] } for jobs that go only in part
    } = req.body;

    if (!canCreateBatch(req.user)) {
      return sendError(res, 403, 'Only the office and the UK warehouse make batches');
    }
    if (!name || !route || !Array.isArray(jobs) || jobs.length === 0) {
      return sendError(res, 400, 'Batch name, route, and at least one job are required');
    }
    const splitProblem = checkSplitRequest(split, jobs);
    if (splitProblem) return sendError(res, 400, splitProblem);

    // Generate batch ID
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const batchId = `BATCH-${timestamp}-${random}`;

    // Splitting and batching happen together, so a job is never left half-moved
    const result = await prisma.$transaction(async (tx) => {
      const parts = await splitForBatch(tx, split, req.user);

      const jobDetails = await tx.job.findMany({
        where: { id: { in: jobs }, batchId: null, status: BATCHABLE },
        select: { id: true, weight: true, value: true, status: true },
      });
      if (jobDetails.length === 0) {
        throw Object.assign(new Error('No jobs can be batched. Only jobs at the UK warehouse can go in a batch.'), { statusCode: 400 });
      }
      if (jobDetails.length !== jobs.length) {
        throw Object.assign(new Error('Some jobs are not available for batching'), { statusCode: 400 });
      }

      const batch = await tx.batch.create({
        data: {
          batchId,
          name,
          route,
          destination: destinationFromRoute(route),
          carrier: vessel,
          trackingNumber: containerNumber,
          sealNumber: String(sealNumber || '').trim() || null,
          totalJobs: jobDetails.length,
          totalWeight: sumField(jobDetails, 'weight'),
          totalValue: sumField(jobDetails, 'value'),
          status: 'in_preparation',
          estimatedShipDate: departureDate ? new Date(departureDate) : null,
          estimatedArrival: eta ? new Date(eta) : null,
          notes,
          createdBy: req.user.id,
        },
      });

      // Only moves jobs still waiting at the warehouse; anything else means someone changed them meanwhile
      const { count } = await tx.job.updateMany({
        where: { id: { in: jobs }, batchId: null, status: BATCHABLE },
        data: { status: 'batched', batchId: batch.id },
      });
      if (count !== jobs.length) {
        throw Object.assign(new Error('Some jobs were changed by someone else just now. Refresh and try again.'), { statusCode: 409 });
      }
      await tx.jobTimeline.createMany({
        data: jobs.map((jobId) => ({ jobId, status: 'batched', notes: `Job added to batch ${batchId}`, updatedBy: req.user.id })),
      });

      return { batch, parts, jobsUpdated: jobDetails.length };
    }, { timeout: 30000 });

    // Staff and customers are told after the answer is sent
    runLater('batch notifications', () => notifyBatchCreated(result.batch, req.user.id));
    runLater('batch customer messages', () => notifyBatched(jobs));

    return sendSuccess(res, 201, 'Batch created successfully', {
      batch: mapBatchForClient(result.batch),
      jobsUpdated: result.jobsUpdated,
      parts: result.parts.map((part) => ({ id: part.id, trackingId: part.trackingId, description: part.description })),
    });
  } catch (error) {
    if (error.statusCode) return sendError(res, error.statusCode, error.message);
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
      where.status = toBatchStatus(status);
      if (!where.status) return sendError(res, 400, 'Unknown batch status');
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
            partNumber: true,
            description: true,
            quantity: true,
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
    const { name, route, vessel, containerNumber, sealNumber, departureDate, eta, notes, jobs, split = {} } = req.body;

    if (!canCreateBatch(req.user)) {
      return sendError(res, 403, 'Only the office and the UK warehouse edit batches');
    }
    // Only jobs being added can be split; jobs already in the batch are no longer at the warehouse
    const splitProblem = checkSplitRequest(split, Array.isArray(jobs) ? jobs : []);
    if (splitProblem) return sendError(res, 400, splitProblem);

    const result = await prisma.$transaction(async (tx) => {
      // Lock the batch so it cannot be shipped or edited by someone else halfway through
      await tx.$queryRaw`SELECT id FROM batches WHERE id = ${id} FOR UPDATE`;
      const batch = await tx.batch.findUnique({ where: { id }, include: { jobs: { select: { id: true } } } });
      if (!batch) return { error: 'Batch not found', code: 404 };
      if (!canEditBatch(req.user, batch)) {
        return { error: `Only batches that have not shipped can be edited. This batch is ${batchStatusInfo(batch.status)?.label || batch.status}.`, code: 400 };
      }

      let added = [];
      let parts = [];
      if (Array.isArray(jobs)) {
        const current = batch.jobs.map((job) => job.id);
        const wanted = [...new Set(jobs)];
        added = wanted.filter((jobId) => !current.includes(jobId));
        const removed = current.filter((jobId) => !wanted.includes(jobId));

        parts = await splitForBatch(tx, split, req.user);
        if (added.length > 0) {
          const { count } = await tx.job.updateMany({
            where: { id: { in: added }, batchId: null, status: BATCHABLE },
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

        // Jobs taken out go back to waiting at the UK warehouse
        if (removed.length > 0) {
          await tx.job.updateMany({ where: { id: { in: removed }, batchId: id }, data: { status: BATCHABLE, batchId: null } });
          await tx.jobTimeline.createMany({
            data: removed.map((jobId) => ({
              jobId,
              status: BATCHABLE,
              notes: `Job removed from batch ${batch.batchId}`,
              updatedBy: req.user.id,
            })),
          });
        }
      }

      const batchJobs = await tx.job.findMany({ where: { batchId: id }, select: { weight: true, value: true } });
      const fields = {
        ...(!isBlank(name) && { name: name.trim() }),
        ...(!isBlank(route) && { route: route.trim(), destination: destinationFromRoute(route.trim()) }),
        ...(!isBlank(vessel) && { carrier: vessel.trim() }),
        ...(!isBlank(containerNumber) && { trackingNumber: containerNumber.trim() }),
        ...(!isBlank(sealNumber) && { sealNumber: sealNumber.trim() }),
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
      return { batch: updated, added, parts };
    }, { timeout: 20000 });

    if (result.error) return sendError(res, result.code, result.error);

    runLater('batch customer messages', () => notifyBatched(result.added));
    return sendSuccess(res, 200, 'Batch updated successfully', {
      batch: mapBatchForClient(result.batch),
      parts: (result.parts || []).map((part) => ({ id: part.id, trackingId: part.trackingId, description: part.description })),
    });
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
    const target = toBatchStatus(status);

    const result = await prisma.$transaction(async (tx) => {
      // Lock the batch so it cannot be edited or moved by someone else at the same time
      await tx.$queryRaw`SELECT id FROM batches WHERE id = ${id} FOR UPDATE`;
      const existing = await tx.batch.findUnique({ where: { id } });
      if (!existing) return { error: 'Batch not found', code: 404 };
      if (!nextBatchStatuses(req.user, existing).includes(target)) {
        const from = batchStatusInfo(existing.status)?.label || existing.status;
        return { error: `A batch that is ${from} cannot be set to ${batchStatusInfo(target).label} by you`, code: 400 };
      }

      const batch = await tx.batch.update({
        where: { id },
        data: {
          status: target,
          ...(target === 'shipped' && { shippedAt: new Date() }),
          // Keep the notes written while the batch was being prepared
          ...(notes && { notes: [existing.notes, notes].filter(Boolean).join('\n') }),
        },
      });

      // Shipping and arriving move the batch's jobs along with it
      const jobStatus = batchStatusInfo(target).jobStatus;
      const from = { shipped: 'batched', arrived_in_ghana: 'shipped' }[jobStatus];
      let jobIds = [];
      if (jobStatus) {
        jobIds = (await tx.job.findMany({ where: { batchId: id, status: from }, select: { id: true } })).map((job) => job.id);
        await tx.job.updateMany({ where: { id: { in: jobIds } }, data: { status: jobStatus } });
        await tx.jobTimeline.createMany({
          data: jobIds.map((jobId) => ({
            jobId,
            status: jobStatus,
            notes: `Batch ${batch.batchId} ${target === 'shipped' ? 'shipped' : 'arrived in Ghana'}`,
            updatedBy: req.user.id,
          })),
        });
      }
      return { batch, jobIds, jobStatus };
    }, { timeout: 20000 });

    if (result.error) return sendError(res, result.code, result.error);

    // Customers and staff are told after the answer is sent: a big batch does not keep anyone waiting
    if (result.jobIds.length > 0) {
      const { notifyJobStatusChange } = require('../services/notificationService');
      runLater('batch status messages', async () => {
        const movedJobs = await prisma.job.findMany({
          where: { id: { in: result.jobIds } },
          include: { customer: { select: { id: true, name: true, email: true, phone: true } } },
        });
        await notifyCustomersOfStatus(movedJobs, result.jobStatus);
        for (const job of movedJobs) {
          try {
            await notifyJobStatusChange(job, result.jobStatus, req.user.id);
          } catch (error) {
            console.error(`⚠️ Failed to send notification for job ${job.trackingId}:`, error);
          }
        }
      });
    }

    return sendSuccess(res, 200, 'Batch status updated successfully', { batch: result.batch, jobsMoved: result.jobIds.length });
  } catch (error) {
    console.error('Error updating batch status:', error);
    return sendError(res, 500, 'Failed to update batch status', error.message);
  }
};
