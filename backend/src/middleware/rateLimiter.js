const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter
 */
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
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
  max: 300, // 300 requests per 15 minutes (allows ~1 request per 3 seconds on average)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many dashboard requests from this IP, please try again later.',
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  dashboardLimiter,
};







