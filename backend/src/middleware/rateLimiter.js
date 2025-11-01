const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter
 * Increased limit for production to handle:
 * - Multiple tabs/browsers per user
 * - Auto-refresh intervals (30-120 seconds)
 * - Multiple users behind NAT/proxy
 * - Notification polling
 */
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // Increased from 100 to 1000
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict rate limiter for auth endpoints
 * Limits based on IP address to prevent brute force attacks
 * This applies to the IP address making the requests, not to a specific email account
 * After 5 failed login attempts from the same IP in 15 minutes, all further attempts are blocked
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 failed login attempts per window per IP address
  skipSuccessfulRequests: true, // Only count failed attempts (successful logins don't count)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP address. Please try again in 15 minutes.',
  },
});

/**
 * Lenient rate limiter for dashboard endpoints
 * Dashboard endpoints are called frequently for auto-refresh (every 60-120 seconds)
 * Allow more requests per window to accommodate multiple dashboards and tabs
 */
const dashboardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increased from 300 to 500 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many dashboard requests from this IP, please try again later.',
  },
});

/**
 * Lenient rate limiter for notification endpoints
 * Notification endpoints are polled frequently (every 30 seconds)
 * Multiple tabs and users may poll simultaneously
 */
const notificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 600, // 600 requests per 15 minutes (allows frequent polling)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many notification requests from this IP, please try again later.',
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  dashboardLimiter,
  notificationLimiter,
};







