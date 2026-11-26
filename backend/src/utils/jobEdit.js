// Works out what a job edit changes. The rule: an edit can change a detail but never delete one,
// so missing, null and blank values always keep what is already stored.

const { canEditJobValue } = require('./jobAccess');
const { toJobStatus } = require('./statuses');

const isBlank = (value) =>
  value === undefined || value === null || (typeof value === 'string' && value.trim() === '');

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
};

const toDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

/** Comparable form, so "5" and Decimal(5.00), or a Date and its ISO string, count as unchanged. */
const comparable = (value) => {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && typeof value.toNumber === 'function') return value.toNumber();
  if (typeof value === 'object') return JSON.stringify(value);
  return value;
};

/** Merge package lists position by position; existing packages and their filled-in fields are kept. */
const mergePackages = (existing, incoming) => {
  const before = Array.isArray(existing) ? existing : [];
  const after = Array.isArray(incoming) ? incoming.filter(Boolean) : [];
  const length = Math.max(before.length, after.length);
  return Array.from({ length }, (_, index) => {
    const merged = { ...(before[index] || {}) };
    for (const [key, value] of Object.entries(after[index] || {})) {
      if (!isBlank(value)) merged[key] = value;
    }
    return merged;
  });
};

/**
 * @returns {{ data: object, oldValues: object, newValues: object }}
 *   data      - fields to write (only those that really change)
 *   oldValues - what those fields held before, for the edit history
 *   newValues - what they hold now
 */
const buildJobUpdate = (existing, body, user) => {
  const parcel = body.parcelDetails || {};
  const proposed = {};
  const propose = (field, value, parse = (v) => v) => {
    if (isBlank(value)) return;
    const parsed = parse(value);
    if (parsed !== undefined) proposed[field] = typeof parsed === 'string' ? parsed.trim() : parsed;
  };

  for (const field of [
    'referenceNumber', 'receiverName', 'receiverAddress', 'receiverContact', 'freightType',
    'customerId', 'pickupAddress', 'deliveryAddress', 'specialInstructions', 'priority',
  ]) {
    propose(field, body[field]);
  }
  // Mobile sends the receiver's number as receiverPhone.
  if (isBlank(body.receiverContact)) propose('receiverContact', body.receiverPhone);

  propose('pickupDate', body.pickupDate, toDate);
  propose('estimatedDelivery', body.estimatedDelivery, toDate);

  propose('description', parcel.description);
  propose('weight', parcel.weight, toNumber);
  propose('quantity', parcel.quantity, toNumber);
  propose('dimensionsLength', parcel.dimensions?.length, toNumber);
  propose('dimensionsWidth', parcel.dimensions?.width, toNumber);
  propose('dimensionsHeight', parcel.dimensions?.height, toNumber);
  if (canEditJobValue(user)) propose('value', parcel.value, toNumber);

  if (Array.isArray(parcel.packages) && parcel.packages.length > 0) {
    const packages = mergePackages(existing.packages, parcel.packages);
    proposed.packages = packages;
    proposed.quantity = packages.length;
    const weight = packages.reduce((sum, pkg) => sum + (Number(pkg.weight) || 0), 0);
    if (weight > 0) proposed.weight = weight;
    if (canEditJobValue(user) && packages.some((pkg) => !isBlank(pkg.estimatedPrice))) {
      proposed.value = Math.round(packages.reduce((sum, pkg) => sum + (Number(pkg.estimatedPrice) || 0), 0) * 100) / 100;
    }
    const description = packages
      .map((pkg) => pkg.description || `${pkg.packageType || 'Package'}${pkg.weight ? ` (${pkg.weight}kg)` : ''}`)
      .filter(Boolean)
      .join('; ');
    if (description) proposed.description = description;
  }

  // Status moves go through PATCH /jobs/:id/status, which checks photos and permissions.
  // The one exception is finishing a draft from the edit form.
  if (toJobStatus(existing.status) === 'draft' && ['draft', 'pending_collection'].includes(toJobStatus(body.status))) {
    proposed.status = toJobStatus(body.status);
  }

  const data = {};
  const oldValues = {};
  const newValues = {};
  for (const [field, value] of Object.entries(proposed)) {
    const before = comparable(existing[field]);
    const after = comparable(value);
    if (before === after) continue;
    data[field] = value;
    oldValues[field] = before;
    newValues[field] = after;
  }
  return { data, oldValues, newValues };
};

module.exports = { buildJobUpdate, mergePackages, isBlank };
