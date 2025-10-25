const prisma = require('../config/database');

/**
 * Notification Service
 * Handles creation and management of in-app notifications
 */

/**
 * Create a notification for a specific user
 */
const createNotification = async ({ userId, type, title, message, relatedEntityType, relatedEntityId }) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        relatedEntityType,
        relatedEntityId,
        isRead: false,
      },
    });

    console.log(`✅ Notification created for user ${userId}: ${title}`);
    return notification;
  } catch (error) {
    console.error('❌ Failed to create notification:', error);
    throw error;
  }
};

/**
 * Create notifications for multiple users
 */
const createBulkNotifications = async (notifications) => {
  try {
    const result = await prisma.notification.createMany({
      data: notifications.map(notif => ({
        userId: notif.userId,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        relatedEntityType: notif.relatedEntityType || null,
        relatedEntityId: notif.relatedEntityId || null,
        isRead: false,
      })),
    });

    console.log(`✅ ${result.count} notifications created`);
    return result;
  } catch (error) {
    console.error('❌ Failed to create bulk notifications:', error);
    throw error;
  }
};

/**
 * Notify when a new job is created
 */
const notifyJobCreated = async (job, creatorId) => {
  const notifications = [];

  // Notify assigned driver
  if (job.assignedDriverId && job.assignedDriverId !== creatorId) {
    notifications.push({
      userId: job.assignedDriverId,
      type: 'assignment',
      title: 'New Job Assigned',
      message: `You have been assigned to collect job ${job.trackingId}`,
      relatedEntityType: 'job',
      relatedEntityId: job.id,
    });
  }

  // Notify ALL users
  const allUsers = await prisma.user.findMany({
    where: {
      active: true,
      id: { not: creatorId }, // Don't notify the creator
    },
    select: { id: true },
  });

  allUsers.forEach(user => {
    notifications.push({
      userId: user.id,
      type: 'job_status',
      title: 'New Job Created',
      message: `New job ${job.trackingId} has been created`,
      relatedEntityType: 'job',
      relatedEntityId: job.id,
    });
  });

  if (notifications.length > 0) {
    await createBulkNotifications(notifications);
  }

  return notifications.length;
};

/**
 * Notify when job status changes
 */
const notifyJobStatusChange = async (job, newStatus, updaterId) => {
  const notifications = [];

  // Notify assigned driver
  if (job.assignedDriverId && job.assignedDriverId !== updaterId) {
    notifications.push({
      userId: job.assignedDriverId,
      type: 'job_status',
      title: 'Job Status Updated',
      message: `Job ${job.trackingId} status changed to: ${newStatus}`,
      relatedEntityType: 'job',
      relatedEntityId: job.id,
    });
  }

  // Notify assigned delivery agent
  if (job.assignedDeliveryAgentId && job.assignedDeliveryAgentId !== updaterId) {
    notifications.push({
      userId: job.assignedDeliveryAgentId,
      type: 'job_status',
      title: 'Job Status Updated',
      message: `Job ${job.trackingId} status changed to: ${newStatus}`,
      relatedEntityType: 'job',
      relatedEntityId: job.id,
    });
  }

  // Notify admins and customer service for certain status changes
  if (['Delivered', 'Cancelled', 'At Warehouse'].includes(newStatus)) {
    const adminUsers = await prisma.user.findMany({
      where: {
        role: { in: ['admin', 'superadmin', 'warehouse', 'customer-service'] },
        active: true,
        id: { not: updaterId },
      },
      select: { id: true },
    });

    adminUsers.forEach(user => {
      notifications.push({
        userId: user.id,
        type: 'job_status',
        title: `Job ${newStatus}`,
        message: `Job ${job.trackingId} has been marked as ${newStatus}`,
        relatedEntityType: 'job',
        relatedEntityId: job.id,
      });
    });
  }

  if (notifications.length > 0) {
    await createBulkNotifications(notifications);
  }

  return notifications.length;
};

/**
 * Notify when driver is assigned to job
 */
const notifyDriverAssignment = async (job, driverId, assignerId) => {
  if (driverId === assignerId) return 0;

  await createNotification({
    userId: driverId,
    type: 'assignment',
    title: 'New Collection Assignment',
    message: `You have been assigned to collect job ${job.trackingId}`,
    relatedEntityType: 'job',
    relatedEntityId: job.id,
  });

  return 1;
};

/**
 * Notify when batch is created
 */
const notifyBatchCreated = async (batch, creatorId) => {
  const notifications = [];

  // Notify all admins, warehouse staff, and customer service
  const users = await prisma.user.findMany({
    where: {
      role: { in: ['admin', 'superadmin', 'warehouse', 'customer-service'] },
      active: true,
      id: { not: creatorId },
    },
    select: { id: true },
  });

  users.forEach(user => {
    notifications.push({
      userId: user.id,
      type: 'system',
      title: 'New Batch Created',
      message: `Batch ${batch.batchId} created with ${batch.totalJobs} jobs`,
      relatedEntityType: 'batch',
      relatedEntityId: batch.id,
    });
  });

  if (notifications.length > 0) {
    await createBulkNotifications(notifications);
  }

  return notifications.length;
};

/**
 * Notify when invoice is created
 */
const notifyInvoiceCreated = async (invoice, creatorId) => {
  const notifications = [];

  // Notify all finance and admin staff
  const users = await prisma.user.findMany({
    where: {
      role: { in: ['admin', 'superadmin', 'finance'] },
      active: true,
      id: { not: creatorId },
    },
    select: { id: true },
  });

  users.forEach(user => {
    notifications.push({
      userId: user.id,
      type: 'invoice',
      title: 'New Invoice Created',
      message: `Invoice ${invoice.invoiceNumber} created for ${invoice.customer?.name}`,
      relatedEntityType: 'invoice',
      relatedEntityId: invoice.id,
    });
  });

  if (notifications.length > 0) {
    await createBulkNotifications(notifications);
  }

  return notifications.length;
};

module.exports = {
  createNotification,
  createBulkNotifications,
  notifyJobCreated,
  notifyJobStatusChange,
  notifyDriverAssignment,
  notifyBatchCreated,
  notifyInvoiceCreated,
};


