/**
 * Job status display helpers — labels + badge tones.
 * Handles both Title Case and snake_case values from the API.
 */

const SMALL_WORDS = new Set(['a', 'an', 'and', 'at', 'for', 'from', 'in', 'of', 'on', 'or', 'the', 'to']);

/** Canonical snake_case key → human-readable Title Case label */
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

/** Solid brand-aligned colors per status (ShipEase orange + readable accents) */
export const JOB_STATUS_COLORS = {
  pending: '#faad14',
  pending_collection: '#faad14',
  assigned: '#ff9800',
  en_route_to_customer: '#1890ff',
  collected: '#13c2c2',
  collection_failed: '#ff4d4f',
  returning_to_warehouse: '#eb2f96',
  at_warehouse: '#52c41a',
  arrived_at_hub: '#52c41a',
  arrived_at_warehouse: '#52c41a',
  at_uk_warehouse: '#1890ff',
  at_ghana_warehouse: '#389e0d',
  batched: '#ff9800',
  shipped: '#ff9800',
  in_transit: '#1890ff',
  arrived_at_destination: '#389e0d',
  arrived: '#389e0d',
  ready_for_delivery: '#13c2c2',
  out_for_delivery: '#d48806',
  delivered: '#52c41a',
  failed_delivery: '#ff4d4f',
  cancelled: '#ff4d4f',
  closed: '#8c8c8c',
  draft: '#8c8c8c',
};

/** Soft chip tones (bg + text) for list cards */
const JOB_STATUS_TONES = {
  pending: { bg: '#fff4df', text: '#d99000' },
  pending_collection: { bg: '#fff4df', text: '#d99000' },
  assigned: { bg: '#fff4df', text: '#e67e00' },
  en_route_to_customer: { bg: '#e8f1ff', text: '#1f7ae0' },
  collected: { bg: '#e6fffb', text: '#08979c' },
  collection_failed: { bg: '#fff1f0', text: '#cf1322' },
  returning_to_warehouse: { bg: '#fff0f6', text: '#c41d7f' },
  at_warehouse: { bg: '#f6ffed', text: '#389e0d' },
  arrived_at_hub: { bg: '#f6ffed', text: '#389e0d' },
  arrived_at_warehouse: { bg: '#f6ffed', text: '#389e0d' },
  at_uk_warehouse: { bg: '#e8f1ff', text: '#1f7ae0' },
  at_ghana_warehouse: { bg: '#f6ffed', text: '#237804' },
  batched: { bg: '#fff7e6', text: '#d46b08' },
  shipped: { bg: '#fff7e6', text: '#d46b08' },
  in_transit: { bg: '#e8f1ff', text: '#1f7ae0' },
  arrived_at_destination: { bg: '#f6ffed', text: '#237804' },
  arrived: { bg: '#f6ffed', text: '#237804' },
  ready_for_delivery: { bg: '#e6fffb', text: '#08979c' },
  out_for_delivery: { bg: '#fff7e6', text: '#d48806' },
  delivered: { bg: '#e8f8ed', text: '#23a455' },
  failed_delivery: { bg: '#fff1f0', text: '#cf1322' },
  cancelled: { bg: '#fff1f0', text: '#cf1322' },
  closed: { bg: '#f5f5f5', text: '#8c8c8c' },
  draft: { bg: '#f5f5f5', text: '#8c8c8c' },
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

/** Human-readable label: out_for_delivery → "Out for Delivery" */
export function formatJobStatusLabel(status) {
  if (!status) return '';
  const key = normalizeJobStatusKey(status);
  if (JOB_STATUS_LABELS[key]) return JOB_STATUS_LABELS[key];
  return titleCaseWords(String(status).replace(/_/g, ' ').trim());
}

export function getJobStatusColor(status) {
  const key = normalizeJobStatusKey(status);
  return JOB_STATUS_COLORS[key] || '#8c8c8c';
}

/** Soft badge tone for Chip backgrounds */
export function getJobStatusTone(status) {
  const key = normalizeJobStatusKey(status);
  if (JOB_STATUS_TONES[key]) return JOB_STATUS_TONES[key];
  const solid = getJobStatusColor(status);
  return { bg: `${solid}22`, text: solid };
}

/**
 * Legacy map: Title Case + snake_case keys → solid color.
 * Prefer getJobStatusColor / getJobStatusTone; kept so older call sites stay safe.
 */
export const statusColors = Object.keys(JOB_STATUS_COLORS).reduce((acc, key) => {
  acc[key] = JOB_STATUS_COLORS[key];
  const label = JOB_STATUS_LABELS[key];
  if (label) acc[label] = JOB_STATUS_COLORS[key];
  return acc;
}, {});
