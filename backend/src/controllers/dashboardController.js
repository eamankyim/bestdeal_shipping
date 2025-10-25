const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/responseUtils');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @route   GET /api/dashboard/warehouse
 * @desc    Get warehouse dashboard data
 * @access  Private (Warehouse role)
 */
exports.getWarehouseDashboard = asyncHandler(async (req, res) => {
  try {
    // 1. Get Job Statistics
    const totalJobs = await prisma.job.count();
    
    const jobsByStatus = await prisma.job.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    const jobStats = {
      total: totalJobs,
      pendingCollection: jobsByStatus.find(s => s.status === 'Pending Collection')?._count.id || 0,
      collected: jobsByStatus.find(s => s.status === 'Collected')?._count.id || 0,
      atWarehouse: (jobsByStatus.find(s => s.status === 'At Warehouse')?._count.id || 0) + 
                   (jobsByStatus.find(s => s.status === 'arrived_at_warehouse')?._count.id || 0),
      arrivedAtWarehouse: jobsByStatus.find(s => s.status === 'arrived_at_warehouse')?._count.id || 0,
      batched: jobsByStatus.find(s => s.status === 'batched')?._count.id || 0,
      shipped: jobsByStatus.find(s => s.status === 'shipped')?._count.id || 0,
      inTransit: jobsByStatus.find(s => s.status === 'In Transit')?._count.id || 0,
      outForDelivery: jobsByStatus.find(s => s.status === 'Out for Delivery')?._count.id || 0,
    };

    // 2. Get Batch Statistics
    const totalBatches = await prisma.batch.count();
    
    const batchesByStatus = await prisma.batch.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    const batchStats = {
      total: totalBatches,
      inPreparation: batchesByStatus.find(s => s.status === 'In Preparation')?._count.id || 0,
      shipped: batchesByStatus.find(s => s.status === 'Shipped')?._count.id || 0,
      inTransit: batchesByStatus.find(s => s.status === 'In Transit')?._count.id || 0,
      arrived: batchesByStatus.find(s => s.status === 'Arrived')?._count.id || 0,
    };

    // 3. Get Jobs Ready for Batching (arrived at hub)
    const jobsReadyForBatching = await prisma.job.findMany({
      where: {
        status: 'arrived_at_warehouse',
      },
      include: {
        customer: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 10,
    });

    // 4. Get Recent Batches (last 5)
    const recentBatches = await prisma.batch.findMany({
      include: {
        creator: {
          select: {
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            jobs: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    // 5. Get Jobs At Warehouse (needing processing)
    const jobsAtWarehouse = await prisma.job.findMany({
      where: {
        status: {
          in: ['At Warehouse', 'Collected', 'arrived_at_warehouse'],
        },
      },
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
          },
        },
        assignedDriver: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 10,
    });

    // 6. Get Today's Activity (jobs updated today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayActivity = await prisma.job.count({
      where: {
        updatedAt: {
          gte: today,
        },
      },
    });

    // 7. Get Unassigned Jobs (no driver assigned)
    const unassignedJobs = await prisma.job.count({
      where: {
        status: 'Pending Collection',
        assignedDriverId: null,
      },
    });

    // 8. Get Weight and Value Totals for Jobs Ready for Batching
    const readyForBatchingAggregates = await prisma.job.aggregate({
      where: {
        status: 'arrived_at_warehouse',
      },
      _sum: {
        weight: true,
        value: true,
      },
      _count: {
        id: true,
      },
    });

    // 9. Get Recent Timeline Activity (last 10 updates)
    const recentActivity = await prisma.jobTimeline.findMany({
      include: {
        job: {
          select: {
            trackingId: true,
          },
        },
        updater: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 10,
    });

    // Return all warehouse dashboard data
    return sendSuccess(res, 200, 'Warehouse dashboard data retrieved successfully', {
      jobStats,
      batchStats,
      jobsReadyForBatching: {
        count: readyForBatchingAggregates._count.id,
        totalWeight: parseFloat(readyForBatchingAggregates._sum.weight || 0),
        totalValue: parseFloat(readyForBatchingAggregates._sum.value || 0),
        jobs: jobsReadyForBatching,
      },
      recentBatches,
      jobsAtWarehouse,
      todayActivity,
      unassignedJobs,
      recentActivity,
    });

  } catch (error) {
    console.error('Error fetching warehouse dashboard:', error);
    return sendError(res, 500, 'Failed to fetch warehouse dashboard data', [error.message]);
  }
});

/**
 * @route   GET /api/dashboard/driver
 * @desc    Get driver dashboard data
 * @access  Private (Driver role)
 */
exports.getDriverDashboard = asyncHandler(async (req, res) => {
  try {
    const driverId = req.user.id;

    // Get driver's assigned jobs
    const assignedJobs = await prisma.job.findMany({
      where: {
        assignedDriverId: driverId,
        status: {
          in: ['Pending Collection', 'Collected', 'In Transit'],
        },
      },
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
            address: true,
          },
        },
      },
      orderBy: {
        pickupDate: 'asc',
      },
    });

    const stats = {
      total: assignedJobs.length,
      pendingCollection: assignedJobs.filter(j => j.status === 'Pending Collection').length,
      collected: assignedJobs.filter(j => j.status === 'Collected').length,
      inTransit: assignedJobs.filter(j => j.status === 'In Transit').length,
    };

    return sendSuccess(res, 200, 'Driver dashboard data retrieved successfully', {
      stats,
      assignedJobs,
    });

  } catch (error) {
    console.error('Error fetching driver dashboard:', error);
    return sendError(res, 500, 'Failed to fetch driver dashboard data', [error.message]);
  }
});

/**
 * @route   GET /api/dashboard/delivery
 * @desc    Get delivery agent dashboard data
 * @access  Private (Delivery Agent role)
 */
exports.getDeliveryDashboard = asyncHandler(async (req, res) => {
  try {
    const agentId = req.user.id;

    // Get agent's assigned deliveries
    const assignedDeliveries = await prisma.job.findMany({
      where: {
        assignedDeliveryAgentId: agentId,
        status: {
          in: ['Out for Delivery', 'Delivery Attempted'],
        },
      },
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
            address: true,
          },
        },
      },
      orderBy: {
        estimatedDelivery: 'asc',
      },
    });

    const stats = {
      total: assignedDeliveries.length,
      outForDelivery: assignedDeliveries.filter(j => j.status === 'Out for Delivery').length,
      attempted: assignedDeliveries.filter(j => j.status === 'Delivery Attempted').length,
    };

    return sendSuccess(res, 200, 'Delivery dashboard data retrieved successfully', {
      stats,
      assignedDeliveries,
    });

  } catch (error) {
    console.error('Error fetching delivery dashboard:', error);
    return sendError(res, 500, 'Failed to fetch delivery dashboard data', [error.message]);
  }
});

/**
 * @route   GET /api/dashboard/finance
 * @desc    Get finance dashboard data
 * @access  Private (Finance role)
 */
exports.getFinanceDashboard = asyncHandler(async (req, res) => {
  try {
    // 1. Get Invoice Statistics
    const totalInvoices = await prisma.invoice.count();
    
    const invoicesByStatus = await prisma.invoice.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    const invoiceStats = {
      total: totalInvoices,
      pending: invoicesByStatus.find(s => s.status === 'Pending')?._count.id || 0,
      paid: invoicesByStatus.find(s => s.status === 'Paid')?._count.id || 0,
      overdue: invoicesByStatus.find(s => s.status === 'Overdue')?._count.id || 0,
      cancelled: invoicesByStatus.find(s => s.status === 'Cancelled')?._count.id || 0,
    };

    // 2. Get Revenue Statistics
    const revenueData = await prisma.invoice.aggregate({
      where: {
        status: 'Paid',
      },
      _sum: {
        total: true,
        subtotal: true,
        tax: true,
      },
    });

    const pendingRevenue = await prisma.invoice.aggregate({
      where: {
        status: 'Pending',
      },
      _sum: {
        total: true,
      },
    });

    const revenueStats = {
      totalRevenue: parseFloat(revenueData._sum.total || 0),
      totalSubtotal: parseFloat(revenueData._sum.subtotal || 0),
      totalTax: parseFloat(revenueData._sum.tax || 0),
      pendingRevenue: parseFloat(pendingRevenue._sum.total || 0),
    };

    // 3. Get Recent Invoices (last 10)
    const recentInvoices = await prisma.invoice.findMany({
      include: {
        customer: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        creator: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    // 4. Get Overdue Invoices
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        status: 'Pending',
        dueDate: {
          lt: new Date(),
        },
      },
      include: {
        customer: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
      take: 5,
    });

    // 5. Get This Month's Revenue
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthlyRevenue = await prisma.invoice.aggregate({
      where: {
        status: 'Paid',
        paidDate: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
      },
      _sum: {
        total: true,
      },
      _count: {
        id: true,
      },
    });

    // 6. Get Today's Activity
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayInvoices = await prisma.invoice.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });

    const todayPayments = await prisma.invoice.count({
      where: {
        status: 'Paid',
        paidDate: {
          gte: today,
        },
      },
    });

    // Return all finance dashboard data
    return sendSuccess(res, 200, 'Finance dashboard data retrieved successfully', {
      invoiceStats,
      revenueStats,
      recentInvoices,
      overdueInvoices,
      monthlyRevenue: {
        total: parseFloat(monthlyRevenue._sum.total || 0),
        count: monthlyRevenue._count.id,
      },
      todayActivity: {
        newInvoices: todayInvoices,
        payments: todayPayments,
      },
    });

  } catch (error) {
    console.error('Error fetching finance dashboard:', error);
    return sendError(res, 500, 'Failed to fetch finance dashboard data', [error.message]);
  }
});

module.exports = exports;

