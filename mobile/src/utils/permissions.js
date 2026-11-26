export const normalizeRole = (role) => {
  const key = String(role || '').trim().toLowerCase().replace(/[ _]+/g, '-');
  return key === 'warehouse-staff' ? 'warehouse' : key;
};
export const hasAdminAccess = (user) => ['admin', 'superadmin', 'customer-service'].includes(normalizeRole(user?.role));
export const isRole = (user, role) => normalizeRole(user?.role) === normalizeRole(role);

// The API enforces the same rules; see backend/src/utils/jobAccess.js
export const isGhanaWarehouse = (user) => isRole(user, 'warehouse') && user?.warehouseLocation === 'Ghana Warehouse';

/** All staff can edit the jobs they can see. */
export const canEditJobs = (user) =>
  hasAdminAccess(user) || ['finance', 'warehouse', 'driver', 'delivery-agent'].includes(normalizeRole(user?.role));

/** Admin, customer service and UK-side warehouse staff create jobs. */
export const canCreateJobs = (user) => hasAdminAccess(user) || (isRole(user, 'warehouse') && !isGhanaWarehouse(user));

/** Drivers and delivery agents cannot change the price of a job. */
export const canEditJobValue = (user) => hasAdminAccess(user) || ['finance', 'warehouse'].includes(normalizeRole(user?.role));

/** Dispatch happens in Ghana, so UK warehouse staff are left out. */
export const canAssignRider = (user) =>
  hasAdminAccess(user) || (isRole(user, 'warehouse') && user?.warehouseLocation !== 'UK Warehouse');

/** The Ghana warehouse can view invoices and add notes, but not change them. */
export const canManageInvoices = (user) => hasAdminAccess(user) || isRole(user, 'finance');
