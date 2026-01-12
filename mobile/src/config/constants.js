// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    REFRESH_TOKEN: '/auth/refresh-token',
    GET_INVITE_BY_TOKEN: (token) => `/auth/invite/${token}`,
    ACCEPT_INVITE: (token) => `/auth/accept-invite/${token}`,
  },
  JOBS: {
    LIST: '/jobs',
    DETAIL: (id) => `/jobs/${id}`,
    CREATE: '/jobs',
    UPDATE: (id) => `/jobs/${id}`,
    UPDATE_STATUS: (id) => `/jobs/${id}/status`,
    ASSIGN_DRIVER: (id) => `/jobs/${id}/assign-driver`,
    ASSIGN_DELIVERY_AGENT: (id) => `/jobs/${id}/assign-delivery-agent`,
    TIMELINE: (id) => `/jobs/${id}/timeline`,
  },
  TRACKING: {
    TRACK: (trackingId) => `/tracking/${trackingId}`,
  },
  CUSTOMERS: {
    LIST: '/customers',
    DETAIL: (id) => `/customers/${id}`,
    CREATE: '/customers',
    UPDATE: (id) => `/customers/${id}`,
    JOBS: (id) => `/customers/${id}/jobs`,
  },
};

// Job Statuses
export const JOB_STATUSES = {
  PENDING_COLLECTION: 'Pending Collection',
  ASSIGNED: 'Assigned',
  EN_ROUTE_TO_CUSTOMER: 'En Route to Customer',
  COLLECTED: 'Collected',
  COLLECTION_FAILED: 'Collection Failed',
  RETURNING_TO_WAREHOUSE: 'Returning to Warehouse',
  AT_WAREHOUSE: 'At Warehouse',
  BATCHED: 'Batched',
  SHIPPED: 'Shipped',
  ARRIVED_AT_DESTINATION: 'Arrived at Destination',
  READY_FOR_DELIVERY: 'Ready for Delivery',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  DRAFT: 'Draft',
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  DRIVER: 'driver',
  WAREHOUSE_STAFF: 'warehouse_staff',
  DELIVERY_AGENT: 'delivery_agent',
  CUSTOMER: 'customer',
};

// Priority Levels
export const PRIORITY_LEVELS = {
  STANDARD: 'Standard',
  EXPRESS: 'Express',
  URGENT: 'Urgent',
  OTHER: 'Other',
};

// Freight Types
export const FREIGHT_TYPES = {
  AIR: 'Air Freight',
  SEA: 'Sea Freight',
  OTHER: 'Other',
};

// Storage Keys
export const STORAGE_KEYS = {
  USER_TOKEN: 'userToken',
  USER_DATA: 'userData',
  NOTIFICATION_SETTINGS: 'notificationSettings',
};



