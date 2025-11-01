/**
 * Centralized utility for broadcasting job updates across the application
 * This ensures all pages refresh when jobs are created, updated, or status changes
 */

const CHANNEL_NAME = 'job_updates';

/**
 * Broadcast a job update event to all open tabs
 * @param {string} eventType - Type of event (JOB_CREATED, JOB_STATUS_UPDATED, etc.)
 * @param {object} data - Additional data to include in the broadcast
 */
export const broadcastJobUpdate = (eventType, data = {}) => {
  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({
      type: eventType,
      timestamp: new Date().toISOString(),
      ...data,
    });
    channel.close();
    console.log(`📡 Broadcasted ${eventType}`, data);
  } catch (error) {
    console.error('Failed to broadcast job update:', error);
  }
};

/**
 * Listen for job update events
 * @param {function} callback - Callback function to execute when update is received
 * @returns {function} Cleanup function to remove the listener
 */
export const listenForJobUpdates = (callback) => {
  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    
    channel.onmessage = (event) => {
      console.log('📡 Received job update broadcast:', event.data);
      callback(event.data);
    };

    channel.onerror = (error) => {
      console.error('BroadcastChannel error:', error);
    };

    // Return cleanup function
    return () => {
      channel.close();
    };
  } catch (error) {
    console.error('Failed to set up job update listener:', error);
    // Return no-op cleanup function if channel creation failed
    return () => {};
  }
};

/**
 * Check if an event type should trigger a refresh
 * @param {string} eventType - Type of event
 * @returns {boolean} Whether this event should trigger a refresh
 */
export const shouldRefreshOnEvent = (eventType) => {
  const refreshEvents = [
    'JOB_CREATED',
    'JOB_UPDATED',
    'JOB_STATUS_UPDATED',
    'JOB_DELETED',
    'BATCH_CREATED',
    'BATCH_UPDATED',
    'BATCH_SHIPPED',
    'BATCH_STATUS_UPDATED',
    'CUSTOMER_CREATED',
    'CUSTOMER_UPDATED',
    'INVOICE_CREATED',
    'INVOICE_UPDATED',
    'INVOICE_STATUS_UPDATED',
  ];
  return refreshEvents.includes(eventType);
};

/**
 * Event types for job-related updates
 */
export const JOB_EVENTS = {
  CREATED: 'JOB_CREATED',
  UPDATED: 'JOB_UPDATED',
  STATUS_UPDATED: 'JOB_STATUS_UPDATED',
  DELETED: 'JOB_DELETED',
};

/**
 * Event types for batch-related updates
 */
export const BATCH_EVENTS = {
  CREATED: 'BATCH_CREATED',
  UPDATED: 'BATCH_UPDATED',
  SHIPPED: 'BATCH_SHIPPED',
  STATUS_UPDATED: 'BATCH_STATUS_UPDATED',
};

/**
 * Event types for other entity updates
 */
export const OTHER_EVENTS = {
  CUSTOMER_CREATED: 'CUSTOMER_CREATED',
  CUSTOMER_UPDATED: 'CUSTOMER_UPDATED',
  INVOICE_CREATED: 'INVOICE_CREATED',
  INVOICE_UPDATED: 'INVOICE_UPDATED',
  INVOICE_STATUS_UPDATED: 'INVOICE_STATUS_UPDATED',
};

