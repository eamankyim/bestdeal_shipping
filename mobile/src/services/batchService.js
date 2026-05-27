import api from '../config/api';

export const batchService = {
  getBatches: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });
    const response = await api.get(
      `/batches?${params.toString()}`
    );
    return response.data;
  },

  getBatch: async (id) => {
    const response = await api.get(`/batches/${id}`);
    return response.data;
  },

  createBatch: async (batchData) => {
    const response = await api.post('/batches', batchData);
    return response.data;
  },

  updateBatchStatus: async (id, statusData) => {
    const response = await api.patch(`/batches/${id}/status`, statusData);
    return response.data;
  },

  getBatchJobs: async (batchId) => {
    // Jobs are included in batch response
    const batchResponse = await api.get(`/batches/${batchId}`);
    return batchResponse.data;
  },
};

