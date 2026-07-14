// Job Status Constants for ShipEASE App System

const SMALL_WORDS = new Set(['a', 'an', 'and', 'at', 'for', 'from', 'in', 'of', 'on', 'or', 'the', 'to']);

/** Canonical snake_case → readable Title Case (handles API Title Case + snake_case) */
export const JOB_STATUS_LABELS = {
  pending: 'Pending',
  pending_collection: 'Pending Collection',
  assigned: 'Assigned',
  en_route_to_customer: 'En Route to Customer',
  collected: 'Collected',
  collection_failed: 'Collection Failed',
  returning_to_warehouse: 'Returning to Warehouse',
  at_warehouse: 'At Warehouse',
  arrived_at_hub: 'Arrived at Hub',
  arrived_at_warehouse: 'Arrived at Warehouse',
  at_uk_warehouse: 'At UK Warehouse',
  at_ghana_warehouse: 'At Ghana Warehouse',
  batched: 'Batched',
  shipped: 'Shipped',
  in_transit: 'In Transit',
  arrived_at_destination: 'Arrived at Destination',
  arrived: 'Arrived at Destination',
  ready_for_delivery: 'Ready for Delivery',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  failed_delivery: 'Failed Delivery',
  cancelled: 'Cancelled',
  closed: 'Closed',
  draft: 'Draft',
};

export function normalizeJobStatusKey(status) {
  if (!status) return '';
  return String(status)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}

function titleCaseWords(text) {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && SMALL_WORDS.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

/** out_for_delivery / "out for delivery" → "Out for Delivery" */
export function formatJobStatusLabel(status) {
  if (!status) return '';
  const key = normalizeJobStatusKey(status);
  if (JOB_STATUS_LABELS[key]) return JOB_STATUS_LABELS[key];
  return titleCaseWords(String(status).replace(/_/g, ' ').trim());
}

export const JOB_STATUSES = {
  PENDING_COLLECTION: 'Pending Collection',
  ASSIGNED: 'Assigned',
  EN_ROUTE_TO_CUSTOMER: 'En Route to Customer',
  COLLECTED: 'Collected',
  COLLECTION_FAILED: 'Collection Failed',
  RETURNING_TO_WAREHOUSE: 'Returning to Warehouse',
  AT_WAREHOUSE: 'At Warehouse',
  ARRIVED_AT_WAREHOUSE: 'arrived_at_warehouse',
  AT_UK_WAREHOUSE: 'At UK Warehouse',
  AT_GHANA_WAREHOUSE: 'At Ghana Warehouse',
  BATCHED: 'Batched',
  SHIPPED: 'Shipped',
  ARRIVED_AT_DESTINATION: 'arrived_at_destination',
  ARRIVED: 'Arrived at Destination',
  READY_FOR_DELIVERY: 'Ready for Delivery',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  DRAFT: 'Draft'
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
      JOB_STATUSES.SHIPPED
    ]
  },
  DELIVERY: {
    label: 'Delivery Stage',
    statuses: [
      JOB_STATUSES.ARRIVED,
      JOB_STATUSES.READY_FOR_DELIVERY,
      JOB_STATUSES.DELIVERED
    ]
  }
};

// Status colors for consistent UI (Ant Design Tag colors)
export const STATUS_COLORS = {
  [JOB_STATUSES.PENDING_COLLECTION]: 'gold',
  [JOB_STATUSES.ASSIGNED]: 'orange',
  [JOB_STATUSES.EN_ROUTE_TO_CUSTOMER]: 'processing',
  [JOB_STATUSES.COLLECTED]: 'cyan',
  [JOB_STATUSES.RETURNING_TO_WAREHOUSE]: 'magenta',
  [JOB_STATUSES.AT_WAREHOUSE]: 'green',
  [JOB_STATUSES.ARRIVED_AT_WAREHOUSE]: 'cyan',
  [JOB_STATUSES.AT_UK_WAREHOUSE]: 'blue',
  [JOB_STATUSES.AT_GHANA_WAREHOUSE]: 'green',
  [JOB_STATUSES.COLLECTION_FAILED]: 'error',
  [JOB_STATUSES.BATCHED]: 'orange',
  [JOB_STATUSES.SHIPPED]: 'orange',
  [JOB_STATUSES.ARRIVED_AT_DESTINATION]: 'lime',
  [JOB_STATUSES.ARRIVED]: 'lime',
  [JOB_STATUSES.READY_FOR_DELIVERY]: 'cyan',
  [JOB_STATUSES.OUT_FOR_DELIVERY]: 'orange',
  [JOB_STATUSES.DELIVERED]: 'success',
  [JOB_STATUSES.DRAFT]: 'default',
  // snake_case API variants
  pending: 'gold',
  assigned: 'orange',
  en_route_to_customer: 'processing',
  collected: 'cyan',
  collection_failed: 'error',
  returning_to_warehouse: 'magenta',
  at_warehouse: 'green',
  arrived_at_hub: 'green',
  arrived_at_warehouse: 'cyan',
  at_uk_warehouse: 'blue',
  at_ghana_warehouse: 'green',
  batched: 'orange',
  shipped: 'orange',
  in_transit: 'processing',
  arrived_at_destination: 'lime',
  ready_for_delivery: 'cyan',
  out_for_delivery: 'orange',
  delivered: 'success',
  failed_delivery: 'error',
  cancelled: 'error',
  closed: 'default',
  draft: 'default',
};

// Helper function to get status color (normalizes Title Case / snake_case)
export const getStatusColor = (status) => {
  if (!status) return 'default';
  if (STATUS_COLORS[status]) return STATUS_COLORS[status];
  const key = normalizeJobStatusKey(status);
  return STATUS_COLORS[key] || STATUS_COLORS[JOB_STATUS_LABELS[key]] || 'default';
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
    [JOB_STATUSES.AT_GHANA_WAREHOUSE]: [JOB_STATUSES.READY_FOR_DELIVERY],
    [JOB_STATUSES.ASSIGNED]: [JOB_STATUSES.COLLECTED, JOB_STATUSES.COLLECTION_FAILED],
    [JOB_STATUSES.BATCHED]: [JOB_STATUSES.SHIPPED],
    [JOB_STATUSES.SHIPPED]: [JOB_STATUSES.ARRIVED, JOB_STATUSES.AT_GHANA_WAREHOUSE],
    [JOB_STATUSES.ARRIVED]: [JOB_STATUSES.READY_FOR_DELIVERY],
    [JOB_STATUSES.READY_FOR_DELIVERY]: [JOB_STATUSES.DELIVERED],
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
  [JOB_STATUSES.COLLECTION_FAILED]: 'Collection attempt failed',
  [JOB_STATUSES.BATCHED]: 'Added to shipping batch',
  [JOB_STATUSES.SHIPPED]: 'Batch departed on vessel/flight',
  [JOB_STATUSES.ARRIVED_AT_DESTINATION]: 'Package arrived at destination warehouse',
  [JOB_STATUSES.ARRIVED]: 'Package arrived at destination warehouse',
  [JOB_STATUSES.READY_FOR_DELIVERY]: 'Package ready for delivery',
  [JOB_STATUSES.OUT_FOR_DELIVERY]: 'Package with delivery agent',
  [JOB_STATUSES.DELIVERED]: 'Package delivered to customer',
  [JOB_STATUSES.DRAFT]: 'Job saved as draft'
};

// Batch status constants
export const BATCH_STATUSES = {
  IN_PREPARATION: 'In Preparation',
  READY_TO_SHIP: 'Ready to Ship',
  SHIPPED: 'Shipped',
  IN_TRANSIT: 'In Transit',
  ARRIVED: 'Arrived',
  READY_FOR_DELIVERY: 'Ready for Delivery',
  DISTRIBUTED: 'Delivered'
};

export const BATCH_STATUS_COLORS = {
  [BATCH_STATUSES.IN_PREPARATION]: 'processing',
  [BATCH_STATUSES.READY_TO_SHIP]: 'warning',
  [BATCH_STATUSES.SHIPPED]: 'geekblue',
  [BATCH_STATUSES.IN_TRANSIT]: 'blue',
  [BATCH_STATUSES.ARRIVED]: 'success',
  [BATCH_STATUSES.READY_FOR_DELIVERY]: 'cyan',
  [BATCH_STATUSES.DISTRIBUTED]: 'success'
};

export const getBatchStatusColor = (status) => {
  return BATCH_STATUS_COLORS[status] || 'default';
};


