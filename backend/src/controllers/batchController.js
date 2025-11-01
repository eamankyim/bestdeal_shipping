const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/responseUtils');
const { notifyBatchCreated } = require('../services/notificationService');

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
        status: 'arrived_at_warehouse' // Only batch jobs that are at the hub
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
    const totalWeight = jobDetails.reduce((sum, job) => sum + (parseFloat(job.weight) || 0), 0);
    const totalValue = jobDetails.reduce((sum, job) => sum + (parseFloat(job.value) || 0), 0);

    // Create batch and update jobs in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the batch
      const batch = await tx.batch.create({
        data: {
          batchId,
          route: route, // Store full route
          destination: route.split('→')[1]?.trim() || route,
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

    return sendSuccess(res, 201, 'Batch created successfully', {
      batch: result,
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
            status: true
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

    return sendSuccess(res, 200, 'Batches retrieved successfully', {
      batches,
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

    return sendSuccess(res, 200, 'Batch retrieved successfully', { batch });

  } catch (error) {
    console.error('Error fetching batch:', error);
    return sendError(res, 500, 'Failed to fetch batch', error.message);
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

    const batch = await prisma.batch.update({
      where: { id },
      data: {
        status,
        ...(status === 'Shipped' && { shippedAt: new Date() }),
        ...(notes && { notes })
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
                name: true
              }
            }
          }
        });

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




