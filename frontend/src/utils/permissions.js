/**
 * Role-Based UI Permissions
 * Defines what each role can see and do in the frontend
 */

/**
 * Check if user has permission for a specific action
 * @param {Object} user - Current user object with role
 * @param {string} permission - Permission to check
 * @returns {boolean} True if user has permission
 */
export const hasPermission = (user, permission) => {
  if (!user || !user.role) return false;

  const normalizedRole = user.role === 'warehouse_staff' ? 'warehouse' : user.role;

  // Superadmin has all permissions
  if (['superadmin', 'customer-service'].includes(normalizedRole)) return true;

  const rolePermissions = {
    admin: [
      // User Management
      'users:view', 'users:create', 'users:update', 'users:delete',
      'invitations:send', 'invitations:view', 'invitations:cancel',
      
      // Customer Management
      'customers:view', 'customers:create', 'customers:update', 'customers:delete',
      
      // Job Management
      'jobs:view_all', 'jobs:create', 'jobs:update', 'jobs:delete', 'jobs:assign',
      
      // Batch Management
      'batches:view', 'batches:create', 'batches:update', 'batches:delete',
      
      // Invoice Management
      'invoices:view', 'invoices:create', 'invoices:update', 'invoices:delete',
      
      // Reports
      'reports:view_all', 'reports:financial',
      
      // Financial
      'financial:view',
      
      // Settings
      'settings:access', 'settings:modify',
    ],
    
    driver: [
      'jobs:view_own',
      'jobs:update',
      'jobs:update_status',
      'customers:view',
      'timeline:create',
      'documents:upload',
      'reports:view_own',
    ],
    
    warehouse: [
      'jobs:view_all',
      'jobs:update',
      'jobs:update_status',
      'batches:view', 'batches:create', 'batches:update',
      'customers:view',
      'timeline:create',
      'documents:upload',
      'reports:view_warehouse',
    ],
    
    'delivery-agent': [
      'jobs:view_own',
      'jobs:update',
      'jobs:update_status',
      'customers:view',
      'timeline:create',
      'documents:upload',
      'reports:view_own',
    ],
    
    'customer-service': [
      'customers:view', 'customers:create', 'customers:update',
      'jobs:view_all', 'jobs:create',
      'timeline:create',
      'reports:view_customer',
      'invoices:view', 'invoices:create', 'invoices:update', 'invoices:delete',
      'reports:view_all', 'reports:financial',
      'financial:view',
    ],
    
    finance: [
      'invoices:view', 'invoices:create', 'invoices:update', 'invoices:delete',
      'jobs:view_all',
      'jobs:update',
      'customers:view',
      'reports:view_all', 'reports:financial',
      'financial:view',
    ],
  };

  const permissions = rolePermissions[normalizedRole] || [];
  return permissions.includes(permission);
};

const normalizeRole = (role) => {
  const key = String(role || '').trim().toLowerCase().replace(/[ _]+/g, '-');
  return key === 'warehouse-staff' ? 'warehouse' : key;
};

const FULL_ACCESS_ROLES = ['superadmin', 'admin', 'customer-service'];
const ALL_JOBS_ROLES = [...FULL_ACCESS_ROLES, 'finance', 'warehouse'];
const STAFF_ROLES = [...ALL_JOBS_ROLES, 'driver', 'delivery-agent'];

export const hasFullAccess = (user) => FULL_ACCESS_ROLES.includes(normalizeRole(user?.role));

export const isGhanaWarehouse = (user) =>
  normalizeRole(user?.role) === 'warehouse' && user?.warehouseLocation === 'Ghana Warehouse';

/** All staff can edit the jobs they can see. */
export const canEditJobs = (user) => STAFF_ROLES.includes(normalizeRole(user?.role));

/** Admin, customer service and UK-side warehouse staff create jobs. */
export const canCreateJobs = (user) =>
  hasFullAccess(user) || (normalizeRole(user?.role) === 'warehouse' && !isGhanaWarehouse(user));

/** Drivers and delivery agents cannot change the price of a job. */
export const canEditJobValue = (user) => ALL_JOBS_ROLES.includes(normalizeRole(user?.role));

/** The Ghana warehouse can view invoices and add notes, but not change them. */
export const canManageInvoices = (user) => hasFullAccess(user) || normalizeRole(user?.role) === 'finance';
