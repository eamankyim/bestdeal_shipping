/**
 * API Utility
 * Centralizes API calls and configuration
 */

import config from '../config/env';

/**
 * Get authentication token from localStorage
 */
const getAuthToken = () => {
  return localStorage.getItem(config.storage.tokenKey);
};

/**
 * Default headers for API requests
 */
const getHeaders = (includeAuth = true) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

/**
 * Handle API response
 */
const handleResponse = async (response) => {
  let data;
  
  console.log('🔄 Processing response...');
  
  try {
    data = await response.json();
    console.log('📦 Response data parsed:', data);
  } catch (e) {
    console.error('❌ Failed to parse JSON response:', e);
    // If response is not JSON
    const error = new Error(`Server error: ${response.statusText}`);
    error.status = response.status;
    throw error;
  }

  if (!response.ok) {
    console.log('⚠️ Response not OK. Status:', response.status);
    console.log('📄 Error data from backend:', data);
    
    // If there are validation errors, show them
    if (data.errors && Array.isArray(data.errors)) {
      console.log('🔍 Validation errors:', data.errors);
      const errorDetails = data.errors.map(err => `${err.field}: ${err.message}`).join(', ');
      const errorMessage = `${data.message}: ${errorDetails}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      console.log('🚨 Throwing validation error:', errorMessage);
      throw error;
    }
    
    // Create detailed error
    const errorMessage = data.message || data.error || `Request failed with status ${response.status}`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    
    console.log('🚨 Throwing error:', errorMessage);
    
    // Add specific error info based on status code
    if (response.status === 401) {
      error.message = data.message || 'Invalid email or password';
    } else if (response.status === 403) {
      error.message = data.message || 'Access denied';
    } else if (response.status === 404) {
      error.message = data.message || 'Resource not found';
    } else if (response.status === 400) {
      error.message = data.message || 'Bad request. Please check your input.';
    } else if (response.status === 500) {
      error.message = 'Server error. Please try again later.';
    }
    
    throw error;
  }

  console.log('✅ Response OK, returning data');
  return data;
};

/**
 * Make API request
 * @param {string} endpoint - API endpoint (e.g., '/auth/login')
 * @param {object} options - Fetch options
 * @returns {Promise} - API response
 */
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${config.api.fullUrl}${endpoint}`;
  
  const defaultOptions = {
    headers: getHeaders(options.auth !== false),
  };

  const fetchOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  // Log API request
  console.log(`🌐 API Request: ${fetchOptions.method || 'GET'} ${url}`);
  console.log('📋 Request headers:', fetchOptions.headers);
  if (fetchOptions.body) {
    console.log('📦 Request Body:', JSON.parse(fetchOptions.body));
  }

  try {
    console.log('⏳ Sending fetch request...');
    const response = await fetch(url, fetchOptions);
    
    console.log('📡 Response received! Status:', response.status);
    console.log('📊 Response headers:', {
      contentType: response.headers.get('content-type'),
      status: response.status,
      ok: response.ok
    });
    
    const data = await handleResponse(response);
    
    console.log(`✅ API Response (${response.status}):`, data);
    return data;
  } catch (error) {
    console.error('═══════════════════════════════════════════════');
    console.error(`❌ API Request Failed: ${fetchOptions.method || 'GET'} ${url}`);
    console.error('   Error Type:', error.name);
    console.error('   Status:', error.status);
    console.error('   Message:', error.message);
    console.error('   Full Error:', error);
    console.error('═══════════════════════════════════════════════');
    
    // Re-throw with enhanced message
    if (!error.message) {
      error.message = 'Network error. Please check your connection.';
    }
    
    throw error;
  }
};

/**
 * API methods for common HTTP verbs
 */
export const api = {
  /**
   * GET request
   */
  get: (endpoint, options = {}) => {
    return apiRequest(endpoint, {
      method: 'GET',
      ...options,
    });
  },

  /**
   * POST request
   */
  post: (endpoint, data, options = {}) => {
    return apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    });
  },

  /**
   * PUT request
   */
  put: (endpoint, data, options = {}) => {
    return apiRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    });
  },

  /**
   * PATCH request
   */
  patch: (endpoint, data, options = {}) => {
    return apiRequest(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...options,
    });
  },

  /**
   * DELETE request
   */
  delete: (endpoint, options = {}) => {
    return apiRequest(endpoint, {
      method: 'DELETE',
      ...options,
    });
  },
};

/**
 * Specific API endpoints
 */
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }, { auth: false }),
  register: (userData) => api.post('/auth/register', userData, { auth: false }),
  logout: (data) => api.post('/auth/logout', data || {}),
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }, { auth: false }),
  getCurrentUser: () => api.get('/auth/me'),
  sendInvite: (inviteData) => api.post('/auth/send-invite', inviteData),
  getInviteByToken: (token) => api.get(`/auth/invite/${token}`, { auth: false }),
  acceptInvite: (token, userData) => api.post(`/auth/accept-invite/${token}`, userData, { auth: false }),
  getInvitations: () => api.get('/auth/invitations'),
  getUsers: (params) => api.get('/auth/users', { params }),
  getRoles: () => api.get('/auth/roles'),
  changePassword: (currentPassword, newPassword) => api.patch('/auth/change-password', { currentPassword, newPassword }),
  updateProfile: (data) => api.patch('/auth/update-profile', data),
  updateUser: (userId, data) => api.patch(`/auth/users/${userId}`, data),
};

export const inviteAPI = {
  getAll: () => api.get('/invitations'),
  sendInvite: (data) => api.post('/invitations', data),
  resend: (id) => api.post(`/invitations/${id}/resend`),
  cancel: (id) => api.delete(`/invitations/${id}`),
};

export const customerAPI = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
};

export const jobAPI = {
  getAll: (params) => api.get('/jobs', { params }),
  getById: (id) => api.get(`/jobs/${id}`),
  create: (data) => api.post('/jobs', data),
  update: (id, data) => api.put(`/jobs/${id}`, data),
  updateStatus: (id, data) => api.patch(`/jobs/${id}/status`, data),
  delete: (id) => api.delete(`/jobs/${id}`),
  assignDriver: (id, driverId) => api.post(`/jobs/${id}/assign-driver`, { driverId }),
  assignDeliveryAgent: (id, deliveryAgentId) => api.post(`/jobs/${id}/assign-delivery-agent`, { deliveryAgentId }),
  recordPayment: (id, paymentData) => api.post(`/jobs/${id}/payment`, paymentData),
  revertStatus: (id, data) => api.post(`/jobs/${id}/revert-status`, data),
};

export const batchAPI = {
  getAll: (params) => api.get('/batches', { params }),
  getById: (id) => api.get(`/batches/${id}`),
  create: (data) => api.post('/batches', data),
  updateStatus: (id, data) => api.patch(`/batches/${id}/status`, data),
};

export const invoiceAPI = {
  getAll: (params) => api.get('/invoices', { params }),
  getById: (id) => api.get(`/invoices/${id}`),
  update: (id, data) => api.put(`/invoices/${id}`, data),
  send: (id) => api.post(`/invoices/${id}/send`),
  markAsPaid: (id, data) => api.post(`/invoices/${id}/pay`, data),
  cancel: (id) => api.post(`/invoices/${id}/cancel`),
};

export const trackingAPI = {
  track: (trackingId) => api.get(`/tracking/${trackingId}`, { auth: false }),
};

export const dashboardAPI = {
  getWarehouse: () => api.get('/dashboard/warehouse'),
  getGhanaWarehouse: () => api.get('/dashboard/warehouse/ghana'),
  getDriver: () => api.get('/dashboard/driver'),
  getDelivery: () => api.get('/dashboard/delivery'),
  getFinance: () => api.get('/dashboard/finance'),
};

export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/mark-all-read'),
  delete: (id) => api.delete(`/notifications/${id}`),
  clearAll: () => api.delete('/notifications/clear-all'),
};

export default api;

