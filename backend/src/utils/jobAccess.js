// Single place for "who may do what with a job", shared by routes and controllers.

// Statuses are stored in mixed formats ("Out for Delivery", "out_for_delivery"), so queries list both.
const DELIVERY_STATUSES = [
  'Ready for Delivery', 'ready_for_delivery',
  'Out for Delivery', 'out_for_delivery',
  'Failed Delivery', 'failed_delivery',
  'Delivery Attempted',
  'Delivered', 'delivered',
];

const ALL_JOBS_ROLES = ['superadmin', 'admin', 'customer-service', 'finance', 'warehouse'];
const STAFF_ROLES = [...ALL_JOBS_ROLES, 'driver', 'delivery-agent'];
const FULL_ACCESS_ROLES = ['superadmin', 'admin', 'customer-service'];

const normalizeRole = (role) => {
  const key = String(role || '').trim().toLowerCase().replace(/[ _]+/g, '-');
  return key === 'warehouse-staff' ? 'warehouse' : key;
};

const normalizeStatus = (status) => String(status || '').trim().toLowerCase().replace(/[\s-]+/g, '_');

const isStaff = (user) => STAFF_ROLES.includes(normalizeRole(user?.role));

const isGhanaWarehouse = (user) =>
  normalizeRole(user?.role) === 'warehouse' && user?.warehouseLocation === 'Ghana Warehouse';

/** Can this user see this job? Drivers and delivery agents only see their own work. */
const canAccessJob = (user, job) => {
  const role = normalizeRole(user?.role);
  if (ALL_JOBS_ROLES.includes(role)) return true;
  if (role === 'driver') return job.assignedDriverId === user.id;
  if (role === 'delivery-agent') {
    if (job.assignedDeliveryAgentId) return job.assignedDeliveryAgentId === user.id;
    return DELIVERY_STATUSES.includes(job.status);
  }
  return job.createdBy === user?.id;
};

/**
 * Every staff role may edit a job it can see. Accounts created through public
 * self-registration (role "user") are not staff, so they cannot.
 */
const canEditJob = (user, job) => isStaff(user) && canAccessJob(user, job);

/** Warehouse staff create jobs in the UK; staff assigned to Ghana only receive and dispatch. */
const canCreateJob = (user) =>
  FULL_ACCESS_ROLES.includes(normalizeRole(user?.role)) ||
  (normalizeRole(user?.role) === 'warehouse' && !isGhanaWarehouse(user));

/** Drivers and delivery agents cannot change the price of a job. */
const canEditJobValue = (user) => ALL_JOBS_ROLES.includes(normalizeRole(user?.role));

/** Finance staff manage invoices; the Ghana warehouse can view them and add notes. */
const canViewInvoices = (user) =>
  [...FULL_ACCESS_ROLES, 'finance'].includes(normalizeRole(user?.role)) || isGhanaWarehouse(user);

module.exports = {
  DELIVERY_STATUSES,
  normalizeRole,
  normalizeStatus,
  isStaff,
  isGhanaWarehouse,
  canAccessJob,
  canEditJob,
  canCreateJob,
  canEditJobValue,
  canViewInvoices,
};
