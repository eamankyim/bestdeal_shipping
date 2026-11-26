import api from '../config/api';
import { API_ENDPOINTS } from '../config/constants';
import logger from '../utils/logger';

export const jobService = {
  deleteJob: async id => (await api.delete(`/jobs/${id}`)).data,
  addNote: async (id, note) => (await api.post(`/jobs/${id}/notes`, { note })).data,
  getAllJobs: async (filters = {}) => {
    const jobs = [];
    let page = 1;
    let more = true;
    while (more) {
      const response = await jobService.getJobs({ ...filters, page, limit: 100 });
      if (!response.success) throw new Error(response.message || 'Unable to load jobs');
      const data = response.data?.jobs || response.data?.data || response.data || [];
      jobs.push(...(Array.isArray(data) ? data : []));
      more = response.pagination?.hasNext === true;
      page += 1;
    }
    return { success: true, data: jobs };
  },
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
      const payload = { status, notes: typeof notes === 'string' ? notes : '' };
      if (document) {
        let fileData = document.fileData;
        if (!fileData) {
          const blob = await (await fetch(document.uri)).blob();
          fileData = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        }
        payload.proofImages = [{ fileData, fileName: document.name || 'proof.jpg', mimeType: document.type || 'image/jpeg' }];
      }
      const response = await api.patch(API_ENDPOINTS.JOBS.UPDATE_STATUS(id), payload);
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



