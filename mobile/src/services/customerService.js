import api from '../config/api';
import { API_ENDPOINTS } from '../config/constants';
import logger from '../utils/logger';

export const customerService = {
  updateCustomer: async (id, data) => (await api.put(`/customers/${id}`, data)).data,
  deleteCustomer: async id => (await api.delete(`/customers/${id}`)).data,
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

  createCustomer: async (customerData) => {
    try {
      logger.debug('Creating customer', { customerData });
      const response = await api.post(API_ENDPOINTS.CUSTOMERS.CREATE, customerData);
      return response.data;
    } catch (error) {
      logger.error('Failed to create customer', error, {
        service: 'customerService',
        method: 'createCustomer',
        customerData,
      });
      throw error;
    }
  },
};

