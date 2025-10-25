const prisma = require('../config/database');
const { sendSuccess, sendError, sendPaginatedResponse } = require('../utils/responseUtils');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @route   GET /api/customers
 * @desc    Get all customers (paginated & searchable)
 * @access  Private
 */
exports.getAllCustomers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    customerType = '',
  } = req.query;

  const skip = (page - 1) * limit;

  // Build filter
  const where = {
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ],
    }),
    ...(customerType && { customerType }),
  };

  // Get customers
  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
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
      orderBy: { createdAt: 'desc' },
    }),
    prisma.customer.count({ where }),
  ]);

  return sendPaginatedResponse(res, customers, page, limit, total);
});

/**
 * @route   GET /api/customers/:id
 * @desc    Get single customer by ID
 * @access  Private
 */
exports.getCustomerById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      creator: {
        select: {
          name: true,
          email: true,
        },
      },
      jobs: {
        select: {
          id: true,
          trackingId: true,
          status: true,
          pickupDate: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      _count: {
        select: {
          jobs: true,
          invoices: true,
        },
      },
    },
  });

  if (!customer) {
    return sendError(res, 404, 'Customer not found');
  }

  return sendSuccess(res, 200, 'Customer retrieved successfully', { customer });
});

/**
 * @route   POST /api/customers
 * @desc    Create new customer
 * @access  Private
 */
exports.createCustomer = asyncHandler(async (req, res) => {
  const { name, email, phone, address, customerType, notes } = req.body;

  const customer = await prisma.customer.create({
    data: {
      name,
      email,
      phone,
      address,
      customerType,
      notes,
      createdBy: req.user.id,
    },
    include: {
      creator: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return sendSuccess(res, 201, 'Customer created successfully', { customer });
});

/**
 * @route   PUT /api/customers/:id
 * @desc    Update customer
 * @access  Private
 */
exports.updateCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, address, customerType, notes } = req.body;

  // Check if customer exists
  const existingCustomer = await prisma.customer.findUnique({
    where: { id },
  });

  if (!existingCustomer) {
    return sendError(res, 404, 'Customer not found');
  }

  // Update customer
  const customer = await prisma.customer.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(address !== undefined && { address }),
      ...(customerType && { customerType }),
      ...(notes !== undefined && { notes }),
    },
    include: {
      creator: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return sendSuccess(res, 200, 'Customer updated successfully', { customer });
});

/**
 * @route   DELETE /api/customers/:id
 * @desc    Delete customer (only if no jobs)
 * @access  Admin
 */
exports.deleteCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if customer has jobs
  const jobCount = await prisma.job.count({
    where: { customerId: id },
  });

  if (jobCount > 0) {
    return sendError(
      res,
      400,
      'Cannot delete customer with existing jobs. Please delete or reassign jobs first.'
    );
  }

  // Delete customer
  await prisma.customer.delete({
    where: { id },
  });

  return sendSuccess(res, 200, 'Customer deleted successfully');
});

/**
 * @route   GET /api/customers/:id/jobs
 * @desc    Get all jobs for a customer
 * @access  Private
 */
exports.getCustomerJobs = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status = '', page = 1, limit = 20 } = req.query;

  const skip = (page - 1) * limit;

  // Build filter
  const where = {
    customerId: id,
    ...(status && { status }),
  };

  // Get jobs
  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.job.count({ where }),
  ]);

  return sendPaginatedResponse(res, jobs, page, limit, total);
});







