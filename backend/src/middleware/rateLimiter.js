const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter
 * Increased limit to handle:
 * - Multiple tabs/browsers per user
 * - Auto-refresh intervals (30-120 seconds)
 * - Multiple users behind NAT/proxy
 * - Notification polling
 * - Jobs page loading jobs + customers + users in parallel
 * In development we use a higher default so normal usage doesn't hit 429.
 */
const isDev = process.env.NODE_ENV !== 'production';
const envMax = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10);
const defaultMax = isDev ? 5000 : 1000;
const apiMax = envMax > 0 ? envMax : defaultMax;
// In development, ensure at least 2000 so parallel page loads don't hit 429
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: isDev ? Math.max(apiMax, 2000) : apiMax,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for auth endpoints (login)
 * Only counts failed attempts. Configurable via env.
 */
const AUTH_WINDOW_MS = parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 5 * 60 * 1000; // 5 minutes
const AUTH_MAX_ATTEMPTS = parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 20; // 20 failed attempts per window

const authLimiter = rateLimit({
  windowMs: AUTH_WINDOW_MS,
  max: AUTH_MAX_ATTEMPTS,
  skipSuccessfulRequests: true, // Only count failed attempts (successful logins don't count)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: `Too many login attempts from this IP. Please try again in ${Math.round(AUTH_WINDOW_MS / 60000)} minutes.`,
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







