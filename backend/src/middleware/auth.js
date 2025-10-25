const { verifyToken } = require('../utils/tokenUtils');
const { sendError } = require('../utils/responseUtils');
const prisma = require('../config/database');

/**
 * Authentication middleware - Verify JWT token
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'No token provided. Authentication required.');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyToken(token);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
      },
    });

    if (!user) {
      return sendError(res, 401, 'User not found. Invalid token.');
    }

    if (!user.active) {
      return sendError(res, 403, 'Your account has been deactivated.');
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    return sendError(res, 401, 'Invalid or expired token.', [error.message]);
  }
};

/**
 * Authorization middleware - Check user permissions/role
 * @param {Array} allowedRoles - Array of allowed roles
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'Authentication required.');
    }

    // Superadmin has access to all routes
    if (req.user.role === 'superadmin') {
      return next();
    }

    // Check if user role is in allowed roles
    if (!allowedRoles.includes(req.user.role) && !allowedRoles.includes('all')) {
      return sendError(
        res,
        403,
        `Access denied. Required role(s): ${allowedRoles.join(', ')}`
      );
    }

    next();
  };
};

/**
 * Optional authentication - User is not required but will be attached if token is valid
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          active: true,
        },
      });

      if (user && user.active) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Ignore errors for optional auth
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
};






