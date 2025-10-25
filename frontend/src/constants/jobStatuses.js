// Job Status Constants for ShipEASE System

export const JOB_STATUSES = {
  PENDING_COLLECTION: 'Pending Collection',
  ASSIGNED: 'Assigned',
  EN_ROUTE_TO_CUSTOMER: 'En Route to Customer',
  COLLECTED: 'Collected',
  RETURNING_TO_WAREHOUSE: 'Returning to Warehouse',
  AT_WAREHOUSE: 'At Warehouse',
  ARRIVED_AT_WAREHOUSE: 'arrived_at_warehouse',
  AT_UK_WAREHOUSE: 'At UK Warehouse',
  AT_GHANA_WAREHOUSE: 'At Ghana Warehouse',
  BATCHED: 'Batched',
  SHIPPED: 'Shipped',
  IN_TRANSIT: 'In Transit',
  ARRIVED_AT_DESTINATION: 'arrived_at_destination',
  ARRIVED: 'Arrived at Destination',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered'
};

// Status groups for filtering and organization
export const STATUS_GROUPS = {
  COLLECTION: {
    label: 'Collection Stage',
    statuses: [
      JOB_STATUSES.PENDING_COLLECTION,
      JOB_STATUSES.ASSIGNED,
      JOB_STATUSES.EN_ROUTE_TO_CUSTOMER,
      JOB_STATUSES.COLLECTED
    ]
  },
  WAREHOUSE: {
    label: 'Warehouse Stage',
    statuses: [
      JOB_STATUSES.RETURNING_TO_WAREHOUSE,
      JOB_STATUSES.AT_WAREHOUSE,
      JOB_STATUSES.AT_UK_WAREHOUSE,
      JOB_STATUSES.AT_GHANA_WAREHOUSE
    ]
  },
  SHIPPING: {
    label: 'Batching & Shipping Stage',
    statuses: [
      JOB_STATUSES.BATCHED,
      JOB_STATUSES.SHIPPED,
      JOB_STATUSES.IN_TRANSIT
    ]
  },
  DELIVERY: {
    label: 'Delivery Stage',
    statuses: [
      JOB_STATUSES.ARRIVED,
      JOB_STATUSES.OUT_FOR_DELIVERY,
      JOB_STATUSES.DELIVERED
    ]
  }
};

// Status colors for consistent UI
export const STATUS_COLORS = {
  [JOB_STATUSES.PENDING_COLLECTION]: 'default',
  [JOB_STATUSES.ASSIGNED]: 'blue',
  [JOB_STATUSES.EN_ROUTE_TO_CUSTOMER]: 'processing',
  [JOB_STATUSES.COLLECTED]: 'success',
  [JOB_STATUSES.RETURNING_TO_WAREHOUSE]: 'processing',
  [JOB_STATUSES.AT_WAREHOUSE]: 'cyan',
  [JOB_STATUSES.ARRIVED_AT_WAREHOUSE]: 'cyan',
  [JOB_STATUSES.AT_UK_WAREHOUSE]: 'blue',
  [JOB_STATUSES.AT_GHANA_WAREHOUSE]: 'green',
  [JOB_STATUSES.BATCHED]: 'purple',
  [JOB_STATUSES.SHIPPED]: 'geekblue',
  [JOB_STATUSES.IN_TRANSIT]: 'blue',
  [JOB_STATUSES.ARRIVED_AT_DESTINATION]: 'lime',
  [JOB_STATUSES.ARRIVED]: 'lime',
  [JOB_STATUSES.OUT_FOR_DELIVERY]: 'orange',
  [JOB_STATUSES.DELIVERED]: 'success'
};

// Helper function to get status color
export const getStatusColor = (status) => {
  return STATUS_COLORS[status] || 'default';
};

// Helper function to get next possible statuses
export const getNextStatuses = (currentStatus) => {
  const transitions = {
    [JOB_STATUSES.PENDING_COLLECTION]: [JOB_STATUSES.ASSIGNED],
    [JOB_STATUSES.ASSIGNED]: [JOB_STATUSES.EN_ROUTE_TO_CUSTOMER],
    [JOB_STATUSES.EN_ROUTE_TO_CUSTOMER]: [JOB_STATUSES.COLLECTED],
    [JOB_STATUSES.COLLECTED]: [JOB_STATUSES.RETURNING_TO_WAREHOUSE],
    [JOB_STATUSES.RETURNING_TO_WAREHOUSE]: [JOB_STATUSES.AT_WAREHOUSE, JOB_STATUSES.AT_UK_WAREHOUSE],
    [JOB_STATUSES.AT_WAREHOUSE]: [JOB_STATUSES.BATCHED],
    [JOB_STATUSES.AT_UK_WAREHOUSE]: [JOB_STATUSES.BATCHED],
    [JOB_STATUSES.AT_GHANA_WAREHOUSE]: [JOB_STATUSES.OUT_FOR_DELIVERY],
    [JOB_STATUSES.BATCHED]: [JOB_STATUSES.SHIPPED],
    [JOB_STATUSES.SHIPPED]: [JOB_STATUSES.IN_TRANSIT],
    [JOB_STATUSES.IN_TRANSIT]: [JOB_STATUSES.ARRIVED, JOB_STATUSES.AT_GHANA_WAREHOUSE],
    [JOB_STATUSES.ARRIVED]: [JOB_STATUSES.OUT_FOR_DELIVERY],
    [JOB_STATUSES.OUT_FOR_DELIVERY]: [JOB_STATUSES.DELIVERED],
    [JOB_STATUSES.DELIVERED]: [] // Final status
  };
  
  return transitions[currentStatus] || [];
};

// Helper to check if status transition is valid
export const canTransitionTo = (currentStatus, newStatus) => {
  const allowedTransitions = getNextStatuses(currentStatus);
  return allowedTransitions.includes(newStatus);
};

// Status descriptions for user-friendly display
export const STATUS_DESCRIPTIONS = {
  [JOB_STATUSES.PENDING_COLLECTION]: 'Job created, awaiting driver assignment',
  [JOB_STATUSES.ASSIGNED]: 'Driver assigned, ready for pickup',
  [JOB_STATUSES.EN_ROUTE_TO_CUSTOMER]: 'Driver on the way to pickup location',
  [JOB_STATUSES.COLLECTED]: 'Package collected from customer',
  [JOB_STATUSES.RETURNING_TO_WAREHOUSE]: 'Driver bringing package to warehouse',
  [JOB_STATUSES.AT_WAREHOUSE]: 'Package confirmed at warehouse',
  [JOB_STATUSES.ARRIVED_AT_WAREHOUSE]: 'Package arrived at warehouse',
  [JOB_STATUSES.AT_UK_WAREHOUSE]: 'Package at UK warehouse, ready for shipping',
  [JOB_STATUSES.AT_GHANA_WAREHOUSE]: 'Package at Ghana warehouse, ready for delivery',
  [JOB_STATUSES.BATCHED]: 'Added to shipping batch',
  [JOB_STATUSES.SHIPPED]: 'Batch departed on vessel/flight',
  [JOB_STATUSES.IN_TRANSIT]: 'Package in transit to destination',
  [JOB_STATUSES.ARRIVED_AT_DESTINATION]: 'Package arrived at destination warehouse',
  [JOB_STATUSES.ARRIVED]: 'Package arrived at destination warehouse',
  [JOB_STATUSES.OUT_FOR_DELIVERY]: 'Package with delivery agent',
  [JOB_STATUSES.DELIVERED]: 'Package delivered to customer'
};

// Batch status constants
export const BATCH_STATUSES = {
  IN_PREPARATION: 'In Preparation',
  READY_TO_SHIP: 'Ready to Ship',
  SHIPPED: 'Shipped',
  IN_TRANSIT: 'In Transit',
  ARRIVED: 'Arrived',
  DISTRIBUTED: 'Distributed'
};

export const BATCH_STATUS_COLORS = {
  [BATCH_STATUSES.IN_PREPARATION]: 'processing',
  [BATCH_STATUSES.READY_TO_SHIP]: 'warning',
  [BATCH_STATUSES.SHIPPED]: 'geekblue',
  [BATCH_STATUSES.IN_TRANSIT]: 'blue',
  [BATCH_STATUSES.ARRIVED]: 'success',
  [BATCH_STATUSES.DISTRIBUTED]: 'default'
};

export const getBatchStatusColor = (status) => {
  return BATCH_STATUS_COLORS[status] || 'default';
};


