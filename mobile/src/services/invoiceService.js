import api from '../config/api';
import logger from '../utils/logger';

export const invoiceService = {
  getInvoices: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach((key) => {
        const value = filters[key];
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });

      const query = params.toString();
      const endpoint = query ? `/invoices?${query}` : '/invoices';
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch invoices', error, {
        service: 'invoiceService',
        method: 'getInvoices',
        filters,
      });
      throw error;
    }
  },
};

