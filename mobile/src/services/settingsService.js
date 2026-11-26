import api from '../config/api';

export const settingsService = {
  getCustomerMessages: async () => (await api.get('/settings/customer-messages')).data,
  updateCustomerMessages: async (messages) => (await api.put('/settings/customer-messages', { messages })).data,
};
