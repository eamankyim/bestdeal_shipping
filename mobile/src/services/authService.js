import api from '../config/api';
import { API_ENDPOINTS } from '../config/constants';
import logger from '../utils/logger';

export const authService = {
  login: async (email, password) => {
    try {
      logger.info('Attempting login', { email });
      const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, {
        email,
        password,
      });
      logger.info('Login successful', { email, userId: response.data?.data?.user?.id });
      return response.data;
    } catch (error) {
      logger.error('Login failed', error, {
        service: 'authService',
        method: 'login',
        email,
      });
      throw error;
    }
  },

  register: async (userData) => {
    try {
      logger.info('Attempting registration', { email: userData.email });
      const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, userData);
      logger.info('Registration successful', { email: userData.email });
      return response.data;
    } catch (error) {
      logger.error('Registration failed', error, {
        service: 'authService',
        method: 'register',
        email: userData.email,
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      logger.info('Logging out');
      const response = await api.post(API_ENDPOINTS.AUTH.LOGOUT);
      logger.info('Logout successful');
      return response.data;
    } catch (error) {
      logger.error('Logout failed', error, {
        service: 'authService',
        method: 'logout',
      });
      throw error;
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.AUTH.ME);
      return response.data;
    } catch (error) {
      logger.error('Failed to get current user', error, {
        service: 'authService',
        method: 'getCurrentUser',
      });
      throw error;
    }
  },

  refreshToken: async (refreshToken) => {
    try {
      logger.debug('Refreshing token');
      const response = await api.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN, {
        refreshToken,
      });
      logger.debug('Token refreshed successfully');
      return response.data;
    } catch (error) {
      logger.error('Token refresh failed', error, {
        service: 'authService',
        method: 'refreshToken',
      });
      throw error;
    }
  },

  getUsers: async () => {
    try {
      const response = await api.get('/auth/users');
      return response.data;
    } catch (error) {
      logger.error('Failed to get users', error, {
        service: 'authService',
        method: 'getUsers',
      });
      throw error;
    }
  },

  getInviteByToken: async (token) => {
    try {
      logger.debug('Fetching invite by token');
      const response = await api.get(API_ENDPOINTS.AUTH.GET_INVITE_BY_TOKEN(token));
      return response.data;
    } catch (error) {
      logger.error('Failed to get invite by token', error, {
        service: 'authService',
        method: 'getInviteByToken',
      });
      throw error;
    }
  },

  acceptInvite: async (token, userData) => {
    try {
      logger.info('Accepting invite', { email: userData.email });
      const response = await api.post(API_ENDPOINTS.AUTH.ACCEPT_INVITE(token), userData);
      logger.info('Invite accepted successfully', { email: userData.email });
      return response.data;
    } catch (error) {
      logger.error('Failed to accept invite', error, {
        service: 'authService',
        method: 'acceptInvite',
        email: userData.email,
      });
      throw error;
    }
  },

  getTeamMembers: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.USERS.TEAM_MEMBERS);
      return response.data;
    } catch (error) {
      logger.error('Failed to get team members', error, {
        service: 'authService',
        method: 'getTeamMembers',
      });
      throw error;
    }
  },

  updateProfile: async (data) => {
    try {
      logger.info('Updating profile');
      const response = await api.patch('/auth/update-profile', data);
      logger.info('Profile updated successfully');
      return response.data;
    } catch (error) {
      logger.error('Failed to update profile', error, {
        service: 'authService',
        method: 'updateProfile',
      });
      throw error;
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      logger.info('Changing password');
      const response = await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      logger.info('Password changed successfully');
      return response.data;
    } catch (error) {
      logger.error('Failed to change password', error, {
        service: 'authService',
        method: 'changePassword',
      });
      throw error;
    }
  },

  updateUser: async (userId, data) => {
    try {
      logger.info('Updating user', { userId });
      const response = await api.put(`/auth/users/${userId}`, data);
      logger.info('User updated successfully', { userId });
      return response.data;
    } catch (error) {
      logger.error('Failed to update user', error, {
        service: 'authService',
        method: 'updateUser',
        userId,
      });
      throw error;
    }
  },

  sendInvite: async (email, role, warehouseLocation) => {
    try {
      logger.info('Sending invite', { email, role });
      const response = await api.post('/auth/send-invite', {
        email,
        role,
        warehouseLocation,
      });
      logger.info('Invite sent successfully', { email });
      return response.data;
    } catch (error) {
      logger.error('Failed to send invite', error, {
        service: 'authService',
        method: 'sendInvite',
        email,
      });
      throw error;
    }
  },

  getInvites: async () => {
    try {
      const response = await api.get('/auth/invitations');
      return response.data;
    } catch (error) {
      logger.error('Failed to get invites', error, {
        service: 'authService',
        method: 'getInvites',
      });
      throw error;
    }
  },

  getRoles: async () => {
    try {
      const response = await api.get('/auth/roles');
      return response.data;
    } catch (error) {
      logger.error('Failed to get roles', error, {
        service: 'authService',
        method: 'getRoles',
      });
      throw error;
    }
  },
};



