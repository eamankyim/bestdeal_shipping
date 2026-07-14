import api from '../config/api';
import { API_ENDPOINTS } from '../config/constants';
import logger from '../utils/logger';

export const notificationService = {
  getNotifications: async (params = {}) => {
    try {
      logger.debug('Fetching notifications', { params });
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.LIST, { params });
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch notifications', error, {
        service: 'notificationService',
        method: 'getNotifications',
      });
      throw error;
    }
  },

  getUnreadCount: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch unread notification count', error, {
        service: 'notificationService',
        method: 'getUnreadCount',
      });
      throw error;
    }
  },

  markAsRead: async (id) => {
    try {
      const response = await api.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
      return response.data;
    } catch (error) {
      logger.error('Failed to mark notification as read', error, {
        service: 'notificationService',
        method: 'markAsRead',
        notificationId: id,
      });
      throw error;
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await api.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
      return response.data;
    } catch (error) {
      logger.error('Failed to mark all notifications as read', error, {
        service: 'notificationService',
        method: 'markAllAsRead',
      });
      throw error;
    }
  },

  clearAll: async () => {
    try {
      const response = await api.delete(API_ENDPOINTS.NOTIFICATIONS.CLEAR_ALL);
      return response.data;
    } catch (error) {
      logger.error('Failed to clear notifications', error, {
        service: 'notificationService',
        method: 'clearAll',
      });
      throw error;
    }
  },
};
