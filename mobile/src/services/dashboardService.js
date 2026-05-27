import api from '../config/api';
import logger from '../utils/logger';

export const dashboardService = {
  getFinanceDashboard: async () => {
    try {
      const response = await api.get('/dashboard/finance');
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch finance dashboard', error, {
        service: 'dashboardService',
        method: 'getFinanceDashboard',
      });
      throw error;
    }
  },
};

