// What each role's dashboard shows. Every list is built from the status keys in utils/statuses.js,
// so the numbers match the status names everywhere else.

const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/responseUtils');
const { asyncHandler } = require('../middleware/errorHandler');
const { JOB_KEYS, BATCH_KEYS, toJobStatus, toBatchStatus, actorOf } = require('../utils/statuses');

// What a dashboard needs to show for each job
const JOB_CARD = {
  customer: { select: { id: true, name: true, phone: true } },
  assignedDriver: { select: { id: true, name: true } },
  assignedDeliveryAgent: { select: { id: true, name: true } },
  batch: { select: { id: true, batchId: true, name: true } },
};

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

/** A list of jobs to work on: the first `take` of them, how many there are in all, and their weight. */
const queue = async (where, { orderBy = { createdAt: 'asc' }, take = 25 } = {}) => {
  const [jobs, totals] = await Promise.all([
    prisma.job.findMany({ where, include: JOB_CARD, orderBy, take }),
    prisma.job.aggregate({ where, _count: { id: true }, _sum: { weight: true } }),
  ]);
  return { count: totals._count.id, totalWeight: Number(totals._sum.weight || 0), jobs };
};

/** How many jobs are in each status; every status is listed, with 0 when there are none. */
const countJobs = async (where = {}) => {
  const rows = await prisma.job.groupBy({ by: ['status'], where, _count: { id: true } });
  const counts = Object.fromEntries(JOB_KEYS.map((key) => [key, 0]));
  for (const row of rows) {
    const key = toJobStatus(row.status);
    if (key) counts[key] += row._count.id;
  }
  return counts;
};

const countBatches = async () => {
  const rows = await prisma.batch.groupBy({ by: ['status'], _count: { id: true } });
  const counts = Object.fromEntries(BATCH_KEYS.map((key) => [key, 0]));
  for (const row of rows) {
    const key = toBatchStatus(row.status);
    if (key) counts[key] += row._count.id;
  }
  return counts;
};

/** How many jobs were moved to `status` today (by `userId`, when given), from the job history. */
const movedToday = (status, userId) =>
  prisma.jobTimeline.count({ where: { status, timestamp: { gte: startOfToday() }, ...(userId && { updatedBy: userId }) } });

const batchesIn = (statuses) =>
  prisma.batch.findMany({
    where: { status: { in: statuses } },
    include: { _count: { select: { jobs: true } } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

/**
 * @route   GET /api/dashboard/overview
 * @desc    The office's view of the whole business
 */
exports.getOverview = asyncHandler(async (req, res) => {
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [counts, customers, needsAttention, waitingForDriver, recentJobs, revenue, unpaid] = await Promise.all([
    countJobs(),
    prisma.customer.count(),
    queue({ status: { in: ['collection_failed', 'failed_delivery'] } }, { orderBy: { updatedAt: 'asc' } }),
    prisma.job.count({ where: { status: 'pending_collection' } }),
    prisma.job.findMany({ include: JOB_CARD, orderBy: { createdAt: 'desc' }, take: 8 }),
    prisma.invoice.aggregate({ where: { status: 'Paid', paidDate: { gte: firstOfMonth } }, _sum: { total: true } }),
    prisma.invoice.aggregate({ where: { status: 'Pending' }, _sum: { total: true }, _count: { id: true } }),
  ]);

  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const finished = counts.delivered + counts.cancelled + counts.draft;
  return sendSuccess(res, 200, 'Overview retrieved successfully', {
    counts,
    totals: { jobs: total, active: total - finished, customers },
    waitingForDriver,
    needsAttention,
    recentJobs,
    revenueThisMonth: Number(revenue._sum.total || 0),
    unpaidInvoices: { count: unpaid._count.id, total: Number(unpaid._sum.total || 0) },
  });
});

/**
 * @route   GET /api/dashboard/warehouse/uk
 * @desc    UK warehouse: jobs waiting for a driver, coming in, waiting for a batch, and batches being prepared
 */
exports.getUKWarehouseDashboard = asyncHandler(async (req, res) => {
  if (!['uk', 'office'].includes(actorOf(req.user))) {
    return sendError(res, 403, 'This dashboard is for the UK warehouse');
  }
  const [counts, batchCounts, needsDriver, comingIn, atWarehouse, batches, receivedToday] = await Promise.all([
    countJobs(),
    countBatches(),
    queue({ status: { in: ['pending_collection', 'collection_failed'] } }),
    queue({ status: { in: ['assigned', 'collected'] } }, { orderBy: { pickupDate: 'asc' } }),
    queue({ status: 'at_uk_warehouse', batchId: null }),
    batchesIn(['in_preparation', 'ready_to_ship']),
    movedToday('at_uk_warehouse'),
  ]);
  return sendSuccess(res, 200, 'UK warehouse dashboard retrieved successfully', {
    counts,
    batchCounts,
    needsDriver,
    comingIn,
    atWarehouse,
    batchesInPreparation: batches,
    receivedToday,
  });
});

/**
 * @route   GET /api/dashboard/warehouse/ghana
 * @desc    Ghana warehouse: batches on the way, parcels to check, parcels needing a rider, and out with riders
 */
exports.getGhanaWarehouseDashboard = asyncHandler(async (req, res) => {
  if (!['ghana', 'office'].includes(actorOf(req.user))) {
    return sendError(res, 403, 'This dashboard is for the Ghana warehouse');
  }
  const [counts, batchCounts, batchesOnTheWay, onTheWay, toCheck, needsRider, outForDelivery, deliveredToday] = await Promise.all([
    countJobs(),
    countBatches(),
    batchesIn(['shipped']),
    queue({ status: 'shipped' }),
    queue({ status: 'arrived_in_ghana' }),
    queue({ status: { in: ['ready_for_delivery', 'failed_delivery'] } }),
    queue({ status: 'out_for_delivery' }, { orderBy: { updatedAt: 'desc' } }),
    movedToday('delivered'),
  ]);
  return sendSuccess(res, 200, 'Ghana warehouse dashboard retrieved successfully', {
    counts,
    batchCounts,
    batchesOnTheWay,
    onTheWay,
    toCheck,
    needsRider,
    outForDelivery,
    deliveredToday,
  });
});

/**
 * @route   GET /api/dashboard/driver
 * @desc    A driver's own collections
 */
exports.getDriverDashboard = asyncHandler(async (req, res) => {
  const mine = { assignedDriverId: req.user.id };
  const [toCollect, collected, failed, collectedToday] = await Promise.all([
    queue({ ...mine, status: 'assigned' }, { orderBy: { pickupDate: 'asc' }, take: 50 }),
    queue({ ...mine, status: 'collected' }, { orderBy: { updatedAt: 'desc' } }),
    queue({ ...mine, status: 'collection_failed' }, { orderBy: { updatedAt: 'desc' } }),
    movedToday('collected', req.user.id),
  ]);
  return sendSuccess(res, 200, 'Driver dashboard retrieved successfully', { toCollect, collected, failed, collectedToday });
});

/**
 * @route   GET /api/dashboard/delivery
 * @desc    A dispatch rider's own deliveries
 */
exports.getDeliveryDashboard = asyncHandler(async (req, res) => {
  const mine = { assignedDeliveryAgentId: req.user.id };
  const [toDeliver, failed, delivered, deliveredToday] = await Promise.all([
    queue({ ...mine, status: 'out_for_delivery' }, { orderBy: { estimatedDelivery: 'asc' }, take: 50 }),
    queue({ ...mine, status: 'failed_delivery' }, { orderBy: { updatedAt: 'desc' } }),
    queue({ ...mine, status: 'delivered' }, { orderBy: { actualDelivery: 'desc' }, take: 10 }),
    movedToday('delivered', req.user.id),
  ]);
  return sendSuccess(res, 200, 'Delivery dashboard retrieved successfully', { toDeliver, failed, delivered, deliveredToday });
});

/**
 * @route   GET /api/dashboard/finance
 * @desc    Invoices and revenue. (Also used by the mobile app, so the shape stays as it was.)
 */
exports.getFinanceDashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const today = startOfToday();
  // "Overdue" is not stored: it is an unpaid invoice past its due date
  const overdueWhere = { status: 'Pending', dueDate: { lt: now } };

  const [total, byStatus, overdueCount, paid, pending, recentInvoices, overdueInvoices, monthly, newToday, paidToday] = await Promise.all([
    prisma.invoice.count(),
    prisma.invoice.groupBy({ by: ['status'], _count: { id: true } }),
    prisma.invoice.count({ where: overdueWhere }),
    prisma.invoice.aggregate({ where: { status: 'Paid' }, _sum: { total: true, subtotal: true, tax: true } }),
    prisma.invoice.aggregate({ where: { status: 'Pending' }, _sum: { total: true } }),
    prisma.invoice.findMany({
      include: {
        customer: { select: { name: true, email: true, phone: true } },
        creator: { select: { name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.invoice.findMany({
      where: overdueWhere,
      include: { customer: { select: { name: true, email: true, phone: true } } },
      orderBy: { dueDate: 'asc' },
      take: 5,
    }),
    prisma.invoice.aggregate({ where: { status: 'Paid', paidDate: { gte: firstOfMonth } }, _sum: { total: true }, _count: { id: true } }),
    prisma.invoice.count({ where: { createdAt: { gte: today } } }),
    prisma.invoice.count({ where: { status: 'Paid', paidDate: { gte: today } } }),
  ]);
  const countOf = (status) => byStatus.find((row) => row.status === status)?._count.id || 0;

  return sendSuccess(res, 200, 'Finance dashboard data retrieved successfully', {
    invoiceStats: {
      total,
      draft: countOf('Draft'),
      pending: countOf('Pending'),
      paid: countOf('Paid'),
      overdue: overdueCount,
      cancelled: countOf('Cancelled'),
    },
    revenueStats: {
      totalRevenue: Number(paid._sum.total || 0),
      totalSubtotal: Number(paid._sum.subtotal || 0),
      totalTax: Number(paid._sum.tax || 0),
      pendingRevenue: Number(pending._sum.total || 0),
    },
    recentInvoices,
    overdueInvoices,
    monthlyRevenue: { total: Number(monthly._sum.total || 0), count: monthly._count.id },
    todayActivity: { newInvoices: newToday, payments: paidToday },
  });
});
