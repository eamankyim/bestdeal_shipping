// Single place for "who may do what with a job", shared by routes and controllers.
// Which status a job may move to is decided in ./statuses.js.

const ALL_JOBS_ROLES = ['superadmin', 'admin', 'customer-service', 'finance', 'warehouse'];
const STAFF_ROLES = [...ALL_JOBS_ROLES, 'driver', 'delivery-agent'];
const FULL_ACCESS_ROLES = ['superadmin', 'admin', 'customer-service'];

const normalizeRole = (role) => {
  const key = String(role || '').trim().toLowerCase().replace(/[ _]+/g, '-');
  return key === 'warehouse-staff' ? 'warehouse' : key;
};

const isStaff = (user) => STAFF_ROLES.includes(normalizeRole(user?.role));

const isGhanaWarehouse = (user) =>
  normalizeRole(user?.role) === 'warehouse' && user?.warehouseLocation === 'Ghana Warehouse';

/** Can this user see this job? Drivers and dispatch riders only see the jobs assigned to them. */
const canAccessJob = (user, job) => {
  const role = normalizeRole(user?.role);
  if (ALL_JOBS_ROLES.includes(role)) return true;
  if (role === 'driver') return job.assignedDriverId === user.id;
  if (role === 'delivery-agent') return job.assignedDeliveryAgentId === user.id;
  return job.createdBy === user?.id;
};

/** The same rule as canAccessJob, as a database filter for job lists. */
const jobScopeFor = (user) => {
  const role = normalizeRole(user?.role);
  if (ALL_JOBS_ROLES.includes(role)) return {};
  if (role === 'driver') return { assignedDriverId: user.id };
  if (role === 'delivery-agent') return { assignedDeliveryAgentId: user.id };
  return { createdBy: user?.id };
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
  normalizeRole,
  isStaff,
  isGhanaWarehouse,
  canAccessJob,
  jobScopeFor,
  canEditJob,
  canCreateJob,
  canEditJobValue,
  canViewInvoices,
};
