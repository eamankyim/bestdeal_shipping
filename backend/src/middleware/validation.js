const { body, param, query, validationResult } = require('express-validator');
const { sendError } = require('../utils/responseUtils');

/**
 * Validation result checker middleware
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
    
    return sendError(res, 400, 'Validation failed', errorMessages);
  }
  
  next();
};

// ==================== Auth Validation ====================

const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
  body('role')
    .optional()
    .isIn(['superadmin', 'admin', 'driver', 'warehouse', 'delivery_agent', 'user'])
    .withMessage('Invalid role'),
  validate,
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate,
];

// ==================== Customer Validation ====================

const createCustomerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Customer name is required'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('customerType')
    .isIn(['Individual', 'Company'])
    .withMessage('Customer type must be Individual or Company'),
  body('address')
    .optional()
    .trim(),
  validate,
];

// ==================== Job Validation ====================

const createJobValidation = [
  body('customerId')
    .optional({ checkFalsy: true })
    .isUUID()
    .withMessage('Invalid customer ID'),
  body('pickupAddress')
    .trim()
    .notEmpty()
    .withMessage('Pickup address is required'),
  body('deliveryAddress')
    .trim()
    .notEmpty()
    .withMessage('Delivery address is required'),
  body('pickupDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Invalid pickup date format'),
  body('parcelDetails.description')
    .optional({ checkFalsy: true })
    .trim(),
  body('parcelDetails.weight')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0.1 })
    .withMessage('Weight must be a positive number'),
  body('parcelDetails.dimensions.length')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Length must be a non-negative number'),
  body('parcelDetails.dimensions.width')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Width must be a non-negative number'),
  body('parcelDetails.dimensions.height')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Height must be a non-negative number'),
  body('parcelDetails.value')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Value must be a non-negative number'),
  body('parcelDetails.quantity')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('priority')
    .optional({ checkFalsy: true })
    .isIn(['Standard', 'Express', 'Urgent'])
    .withMessage('Priority must be Standard, Express, or Urgent'),
  body('assignedDriverId')
    .optional({ checkFalsy: true })
    .isUUID()
    .withMessage('Invalid driver ID'),
  validate,
];

const updateJobStatusValidation = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn([
      'pending',
      'assigned',
      'collected',
      'in_transit',
      'arrived_at_hub',
      'arrived_at_warehouse',
      'at_uk_warehouse',
      'at_ghana_warehouse',
      'batched',
      'shipped',
      'out_for_delivery',
      'delivered',
      'failed_delivery',
      'cancelled',
    ])
    .withMessage('Invalid status'),
  body('notes')
    .optional()
    .trim(),
  validate,
];

// ==================== Batch Validation ====================

const createBatchValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Batch name is required'),
  body('route')
    .trim()
    .notEmpty()
    .withMessage('Route is required'),
  body('vessel')
    .optional({ checkFalsy: true })
    .trim(),
  body('containerNumber')
    .optional({ checkFalsy: true })
    .trim(),
  body('departureDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Invalid departure date format'),
  body('eta')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Invalid ETA format'),
  body('notes')
    .optional({ checkFalsy: true })
    .trim(),
  body('jobs')
    .isArray({ min: 1 })
    .withMessage('At least one job must be included in the batch'),
  body('jobs.*')
    .isUUID()
    .withMessage('Invalid job ID'),
  validate,
];

const updateBatchStatusValidation = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn([
      'In Preparation',
      'Ready to Ship',
      'Shipped',
      'In Transit',
      'Arrived',
      'Distributed',
    ])
    .withMessage('Invalid batch status'),
  body('notes')
    .optional()
    .trim(),
  validate,
];

// ==================== Pagination Validation ====================

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  validate,
];

// ==================== UUID Validation ====================

const uuidValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format'),
  validate,
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  createCustomerValidation,
  createJobValidation,
  updateJobStatusValidation,
  createBatchValidation,
  updateBatchStatusValidation,
  paginationValidation,
  uuidValidation,
};


