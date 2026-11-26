// Splitting a job at the UK warehouse: some of its items go now, the rest wait for a later batch.
// The job keeps what goes now; what waits becomes a new part of the same order with its own tracking
// ID (SHIP-…-2), status, batch, delivery and invoice. Each part is billed on its own.

const { canSplitJob, jobStatusLabel } = require('../utils/statuses');
const { normalizeLines, lineTotals, splitLines, splitValue, describeLines } = require('../utils/packages');

const failure = (statusCode, message) => Object.assign(new Error(message), { statusCode });

/**
 * Splits the job inside the caller's transaction. `going[i]` is how many of item line i stay in
 * this job (and so go now). Returns { job, part }; `part` is null when everything goes now.
 */
const splitJob = async (tx, jobId, going, user) => {
  // Lock the job so it cannot be split or batched twice at the same time
  await tx.$queryRaw`SELECT id FROM jobs WHERE id = ${jobId} FOR UPDATE`;
  const job = await tx.job.findUnique({ where: { id: jobId }, include: { timeline: { orderBy: { timestamp: 'asc' } } } });
  if (!job) throw failure(404, 'Job not found');
  if (!canSplitJob(user, job)) {
    throw failure(400, `${job.trackingId} cannot be split: only the UK warehouse and the office can split a job, while it is At UK Warehouse and not in a batch. It is ${jobStatusLabel(job.status)}.`);
  }

  const lines = normalizeLines(job.packages);
  const result = splitLines(lines, going);
  if (result.error) throw failure(400, `${job.trackingId}: ${result.error}`);
  if (result.later.length === 0) return { job, part: null };

  // Every part points at the order's first job, and is numbered after the parts already made
  const root = job.splitFromId ? await tx.job.findUnique({ where: { id: job.splitFromId } }) : job;
  const highest = await tx.job.aggregate({ where: { splitFromId: root.id }, _max: { partNumber: true } });
  const partNumber = Math.max(highest._max.partNumber || 1, 1) + 1;
  const trackingId = `${root.trackingId}-${partNumber}`;

  const value = splitValue(job.value, lines, result.now, result.later);
  const now = lineTotals(result.now);
  const later = lineTotals(result.later);

  const updated = await tx.job.update({
    where: { id: job.id },
    data: {
      packages: result.now,
      quantity: now.quantity,
      weight: now.weight,
      description: now.description,
      value: value.now,
      partNumber: job.partNumber || 1,
    },
  });

  const part = await tx.job.create({
    data: {
      trackingId,
      splitFromId: root.id,
      partNumber,
      customerId: job.customerId,
      referenceNumber: job.referenceNumber,
      receiverName: job.receiverName,
      receiverAddress: job.receiverAddress,
      receiverContact: job.receiverContact,
      freightType: job.freightType,
      pickupAddress: job.pickupAddress,
      deliveryAddress: job.deliveryAddress,
      pickupDate: job.pickupDate,
      estimatedDelivery: job.estimatedDelivery,
      warehouseLocation: job.warehouseLocation,
      priority: job.priority,
      specialInstructions: job.specialInstructions,
      assignedDriverId: job.assignedDriverId,
      packages: result.later,
      quantity: later.quantity,
      weight: later.weight,
      description: later.description,
      value: value.later,
      // Payments already recorded stay on the job they were recorded against
      amountPaid: 0,
      status: job.status,
      createdBy: job.createdBy,
    },
  });

  // The new part carries the order's history up to now, so it can be tracked from the start
  await tx.jobTimeline.createMany({
    data: [
      ...job.timeline.map((entry) => ({
        jobId: part.id,
        status: entry.status,
        location: entry.location,
        notes: entry.notes,
        updatedBy: entry.updatedBy,
        timestamp: entry.timestamp,
      })),
      {
        jobId: part.id,
        status: job.status,
        notes: `Part ${partNumber} of ${root.trackingId}: ${later.description}. Waits for a later batch.`,
        updatedBy: user.id,
      },
      {
        jobId: job.id,
        status: job.status,
        notes: `Split: ${describeLines(result.later)} moved to part ${partNumber} (${trackingId}) for a later batch.`,
        updatedBy: user.id,
      },
    ],
  });

  await tx.auditLog.createMany({
    data: [
      {
        userId: user.id,
        action: 'split',
        entityType: 'job',
        entityId: job.id,
        oldValues: { packages: lines, value: job.value === null ? null : Number(job.value) },
        newValues: { packages: result.now, value: value.now, newPart: trackingId },
      },
      {
        userId: user.id,
        action: 'create',
        entityType: 'job',
        entityId: part.id,
        oldValues: { splitFrom: job.trackingId },
        newValues: { packages: result.later, value: value.later },
      },
    ],
  });

  return { job: updated, part };
};

module.exports = { splitJob };
