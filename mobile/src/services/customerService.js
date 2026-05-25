import api from '../config/api';
import { API_ENDPOINTS } from '../config/constants';
import logger from '../utils/logger';

export const customerService = {
  getCustomers: async (filters = {}) => {
    try {
      logger.debug('Fetching customers', { filters });
      const params = new URLSearchParams();
      Object.keys(filters).forEach((key) => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          params.append(key, filters[key]);
        }
      });

      const query = params.toString();
      const endpoint = query
        ? `${API_ENDPOINTS.CUSTOMERS.LIST}?${query}`
        : API_ENDPOINTS.CUSTOMERS.LIST;

      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch customers', error, {
        service: 'customerService',
        method: 'getCustomers',
        filters,
      });
      throw error;
    }
  },
};

