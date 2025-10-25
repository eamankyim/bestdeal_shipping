const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/responseUtils');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @route   GET /api/notifications
 * @desc    Get user's notifications
 * @access  Private
 */
exports.getNotifications = asyncHandler(async (req, res) => {
  const { limit = 50, skip = 0, isRead } = req.query;
  const userId = req.user.id;

  const where = { userId };
  
  // Filter by read status if provided
  if (isRead !== undefined) {
    where.isRead = isRead === 'true';
  }

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: {
      createdAt: 'desc',
    },
    take: parseInt(limit),
    skip: parseInt(skip),
  });

  const total = await prisma.notification.count({ where });
  const unreadCount = await prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });

  return sendSuccess(res, 200, 'Notifications retrieved successfully', {
    notifications,
    total,
    unreadCount,
    limit: parseInt(limit),
    skip: parseInt(skip),
  });
});

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get count of unread notifications
 * @access  Private
 */
exports.getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const unreadCount = await prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });

  return sendSuccess(res, 200, 'Unread count retrieved successfully', { 
    unreadCount 
  });
});

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
exports.markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Check if notification belongs to user
  const notification = await prisma.notification.findUnique({
    where: { id },
  });

  if (!notification) {
    return sendError(res, 404, 'Notification not found');
  }

  if (notification.userId !== userId) {
    return sendError(res, 403, 'Access denied');
  }

  // Mark as read
  const updated = await prisma.notification.update({
    where: { id },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return sendSuccess(res, 200, 'Notification marked as read', { notification: updated });
});

/**
 * @route   PATCH /api/notifications/mark-all-read
 * @desc    Mark all notifications as read
 * @access  Private
 */
exports.markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const result = await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return sendSuccess(res, 200, 'All notifications marked as read', { 
    count: result.count 
  });
});

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete notification
 * @access  Private
 */
exports.deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Check if notification belongs to user
  const notification = await prisma.notification.findUnique({
    where: { id },
  });

  if (!notification) {
    return sendError(res, 404, 'Notification not found');
  }

  if (notification.userId !== userId) {
    return sendError(res, 403, 'Access denied');
  }

  await prisma.notification.delete({
    where: { id },
  });

  return sendSuccess(res, 200, 'Notification deleted successfully');
});

/**
 * @route   DELETE /api/notifications/clear-all
 * @desc    Delete all user's notifications
 * @access  Private
 */
exports.clearAll = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const result = await prisma.notification.deleteMany({
    where: { userId },
  });

  return sendSuccess(res, 200, 'All notifications cleared', { 
    count: result.count 
  });
});

module.exports = exports;


