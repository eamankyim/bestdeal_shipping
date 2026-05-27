import api from '../config/api';
import { API_ENDPOINTS } from '../config/constants';
import logger from '../utils/logger';

export const jobService = {
  getJobs: async (filters = {}) => {
    try {
      logger.debug('Fetching jobs', { filters });
      const params = new URLSearchParams();
      Object.keys(filters).forEach((key) => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });
      const response = await api.get(
        `${API_ENDPOINTS.JOBS.LIST}?${params.toString()}`
      );
      logger.debug('Jobs fetched successfully', { count: response.data?.data?.jobs?.length });
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch jobs', error, {
        service: 'jobService',
        method: 'getJobs',
        filters,
      });
      throw error;
    }
  },

  getJob: async (id) => {
    try {
      logger.debug('Fetching job', { jobId: id });
      const response = await api.get(API_ENDPOINTS.JOBS.DETAIL(id));
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch job', error, {
        service: 'jobService',
        method: 'getJob',
        jobId: id,
      });
      throw error;
    }
  },

  createJob: async (jobData) => {
    try {
      logger.info('Creating job', { trackingId: jobData.trackingId });
      const response = await api.post(API_ENDPOINTS.JOBS.CREATE, jobData);
      logger.info('Job created successfully', { 
        jobId: response.data?.data?.job?.id,
        trackingId: jobData.trackingId,
      });
      return response.data;
    } catch (error) {
      logger.error('Failed to create job', error, {
        service: 'jobService',
        method: 'createJob',
        trackingId: jobData.trackingId,
      });
      throw error;
    }
  },

  updateJob: async (id, jobData) => {
    try {
      logger.info('Updating job', { jobId: id });
      const response = await api.put(API_ENDPOINTS.JOBS.UPDATE(id), jobData);
      logger.info('Job updated successfully', { jobId: id });
      return response.data;
    } catch (error) {
      logger.error('Failed to update job', error, {
        service: 'jobService',
        method: 'updateJob',
        jobId: id,
      });
      throw error;
    }
  },

  updateJobStatus: async (id, status, notes, document) => {
    try {
      logger.info('Updating job status', { jobId: id, status });
      const formData = new FormData();
      formData.append('status', status);
      if (notes) formData.append('notes', notes);
      if (document) {
        formData.append('document', {
          uri: document.uri,
          type: document.type || 'application/pdf',
          name: document.name || 'document.pdf',
        });
      }
      
      const response = await api.patch(API_ENDPOINTS.JOBS.UPDATE_STATUS(id), formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      logger.info('Job status updated successfully', { jobId: id, status });
      return response.data;
    } catch (error) {
      logger.error('Failed to update job status', error, {
        service: 'jobService',
        method: 'updateJobStatus',
        jobId: id,
        status,
      });
      throw error;
    }
  },

  assignDriver: async (id, driverId) => {
    try {
      logger.info('Assigning driver to job', { jobId: id, driverId });
      const response = await api.post(API_ENDPOINTS.JOBS.ASSIGN_DRIVER(id), {
        driverId,
      });
      logger.info('Driver assigned successfully', { jobId: id, driverId });
      return response.data;
    } catch (error) {
      logger.error('Failed to assign driver', error, {
        service: 'jobService',
        method: 'assignDriver',
        jobId: id,
        driverId,
      });
      throw error;
    }
  },

  assignDeliveryAgent: async (id, deliveryAgentId) => {
    try {
      logger.info('Assigning delivery agent to job', { jobId: id, deliveryAgentId });
      const response = await api.post(API_ENDPOINTS.JOBS.ASSIGN_DELIVERY_AGENT(id), {
        deliveryAgentId,
      });
      logger.info('Delivery agent assigned successfully', { jobId: id, deliveryAgentId });
      return response.data;
    } catch (error) {
      logger.error('Failed to assign delivery agent', error, {
        service: 'jobService',
        method: 'assignDeliveryAgent',
        jobId: id,
        deliveryAgentId,
      });
      throw error;
    }
  },

  getJobTimeline: async (id) => {
    try {
      logger.debug('Fetching job timeline', { jobId: id });
      const response = await api.get(API_ENDPOINTS.JOBS.TIMELINE(id));
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch job timeline', error, {
        service: 'jobService',
        method: 'getJobTimeline',
        jobId: id,
      });
      throw error;
    }
  },

  recordPayment: async (id, paymentData) => {
    try {
      logger.info('Recording payment', { jobId: id, amount: paymentData.amount });
      const response = await api.post(`${API_ENDPOINTS.JOBS.DETAIL(id)}/payment`, paymentData);
      logger.info('Payment recorded successfully', { jobId: id });
      return response.data;
    } catch (error) {
      logger.error('Failed to record payment', error, {
        service: 'jobService',
        method: 'recordPayment',
        jobId: id,
      });
      throw error;
    }
  },

  revertStatus: async (id, revertData) => {
    try {
      logger.info('Reverting job status', { jobId: id });
      const response = await api.post(`${API_ENDPOINTS.JOBS.DETAIL(id)}/revert-status`, revertData);
      logger.info('Job status reverted successfully', { jobId: id });
      return response.data;
    } catch (error) {
      logger.error('Failed to revert job status', error, {
        service: 'jobService',
        method: 'revertStatus',
        jobId: id,
      });
      throw error;
    }
  },
};



