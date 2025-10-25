const { sendError } = require('../utils/responseUtils');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);

  // Prisma errors
  if (err.code) {
    switch (err.code) {
      case 'P2002':
        return sendError(res, 400, 'A record with this value already exists.', [
          `Duplicate field: ${err.meta?.target?.join(', ')}`,
        ]);
      case 'P2025':
        return sendError(res, 404, 'Record not found.', [err.message]);
      case 'P2003':
        return sendError(res, 400, 'Invalid reference or foreign key constraint.', [
          err.message,
        ]);
      default:
        return sendError(res, 500, 'Database error occurred.', [err.message]);
    }
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return sendError(res, 400, 'Validation failed.', errors);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 401, 'Invalid token.', [err.message]);
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 401, 'Token expired.', [err.message]);
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  return sendError(res, statusCode, message, err.errors || null);
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res) => {
  return sendError(res, 404, `Route ${req.originalUrl} not found.`);
};

/**
 * Async handler wrapper - Catches async errors
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
};







