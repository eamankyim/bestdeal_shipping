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

  // Superadmin has all permissions
  if (user.role === 'superadmin') return true;

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
      'jobs:update_status',
      'customers:view',
      'timeline:create',
      'documents:upload',
      'reports:view_own',
    ],
    
    warehouse: [
      'jobs:view_all',
      'jobs:update_status',
      'batches:view', 'batches:create', 'batches:update',
      'customers:view',
      'timeline:create',
      'documents:upload',
      'reports:view_warehouse',
    ],
    
    'delivery-agent': [
      'jobs:view_own',
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
    ],
    
    finance: [
      'invoices:view', 'invoices:create', 'invoices:update', 'invoices:delete',
      'jobs:view_all',
      'customers:view',
      'reports:view_all', 'reports:financial',
      'financial:view',
    ],
  };

  const permissions = rolePermissions[user.role] || [];
  return permissions.includes(permission);
};

/**
 * Check if user has any of the specified roles
 * @param {Object} user - Current user object with role
 * @param {...string} roles - Roles to check
 * @returns {boolean} True if user has one of the roles
 */
export const hasRole = (user, ...roles) => {
  if (!user || !user.role) return false;
  return roles.includes(user.role);
};

/**
 * Check if user can access a specific route
 * @param {Object} user - Current user object with role
 * @param {string} route - Route path
 * @returns {boolean} True if user can access route
 */
export const canAccessRoute = (user, route) => {
  if (!user || !user.role) return false;

  // Superadmin can access all routes
  if (user.role === 'superadmin') return true;

  const routePermissions = {
    '/dashboard': ['superadmin', 'admin', 'driver', 'delivery-agent', 'warehouse', 'customer-service', 'finance'],
    '/jobs': ['superadmin', 'admin', 'driver', 'delivery-agent', 'warehouse', 'customer-service'],
    '/customers': ['superadmin', 'admin', 'customer-service', 'driver', 'delivery-agent', 'warehouse'],
    '/batches': ['superadmin', 'admin', 'warehouse'],
    '/invoices': ['superadmin', 'admin', 'finance'],
    '/reports': ['superadmin', 'admin', 'driver', 'delivery-agent', 'warehouse', 'customer-service', 'finance'],
    '/settings': ['superadmin', 'admin'],
    '/tracking': ['superadmin', 'admin', 'driver', 'delivery-agent', 'warehouse', 'customer-service'],
  };

  const allowedRoles = routePermissions[route] || [];
  return allowedRoles.includes(user.role);
};

/**
 * Get dashboard route based on user role
 * @param {Object} user - Current user object with role
 * @returns {string} Dashboard path
 */
export const getDashboardRoute = (user) => {
  if (!user || !user.role) return '/login';

  const dashboardRoutes = {
    superadmin: '/dashboard',
    admin: '/dashboard',
    driver: '/driver-dashboard',
    warehouse: '/warehouse-dashboard',
    'delivery-agent': '/delivery-agent-dashboard',
    'customer-service': '/dashboard',
    finance: '/dashboard',
  };

  return dashboardRoutes[user.role] || '/dashboard';
};

/**
 * Get sidebar menu items based on user role
 * @param {Object} user - Current user object with role
 * @returns {Array} Array of menu items
 */
export const getSidebarMenuItems = (user) => {
  if (!user || !user.role) return [];

  const allMenuItems = [
    {
      key: 'dashboard',
      icon: 'DashboardOutlined',
      label: 'Dashboard',
      path: '/dashboard',
      roles: ['superadmin', 'admin', 'customer-service', 'finance'],
    },
    {
      key: 'driver-dashboard',
      icon: 'CarOutlined',
      label: 'My Jobs',
      path: '/driver-dashboard',
      roles: ['driver'],
    },
    {
      key: 'warehouse-dashboard',
      icon: 'ShopOutlined',
      label: 'Warehouse',
      path: '/warehouse-dashboard',
      roles: ['warehouse'],
    },
    {
      key: 'delivery-dashboard',
      icon: 'RocketOutlined',
      label: 'My Deliveries',
      path: '/delivery-agent-dashboard',
      roles: ['delivery-agent'],
    },
    {
      key: 'jobs',
      icon: 'FileTextOutlined',
      label: 'Jobs',
      path: '/jobs',
      roles: ['superadmin', 'admin', 'customer-service', 'warehouse'],
    },
    {
      key: 'customers',
      icon: 'UserOutlined',
      label: 'Customers',
      path: '/customers',
      roles: ['superadmin', 'admin', 'customer-service'],
    },
    {
      key: 'batches',
      icon: 'InboxOutlined',
      label: 'Batches',
      path: '/batches',
      roles: ['superadmin', 'admin', 'warehouse'],
    },
    {
      key: 'invoices',
      icon: 'DollarOutlined',
      label: 'Invoices',
      path: '/invoices',
      roles: ['superadmin', 'admin', 'finance'],
    },
    {
      key: 'reports',
      icon: 'BarChartOutlined',
      label: 'Reports',
      path: '/reports',
      roles: ['superadmin', 'admin', 'finance'],
    },
    {
      key: 'tracking',
      icon: 'EnvironmentOutlined',
      label: 'Track Shipment',
      path: '/tracking',
      roles: ['superadmin', 'admin', 'customer-service', 'warehouse'],
    },
    {
      key: 'settings',
      icon: 'SettingOutlined',
      label: 'Settings',
      path: '/settings',
      roles: ['superadmin', 'admin'],
    },
  ];

  return allMenuItems.filter(item => item.roles.includes(user.role));
};

/**
 * Check if user can perform an action on a resource
 * @param {Object} user - Current user object
 * @param {string} action - Action to perform (create, update, delete, etc.)
 * @param {string} resource - Resource type (job, customer, invoice, etc.)
 * @param {Object} resourceData - The resource object (to check ownership)
 * @returns {boolean} True if user can perform action
 */
export const canPerformAction = (user, action, resource, resourceData = null) => {
  if (!user || !user.role) return false;

  // Superadmin and admin can do everything
  if (user.role === 'superadmin' || user.role === 'admin') return true;

  // Define role-action-resource matrix
  const permissions = {
    driver: {
      job: {
        view: (data) => data?.assignedDriverId === user.id,
        update_status: (data) => data?.assignedDriverId === user.id,
      },
      customer: { view: true },
    },
    
    'delivery-agent': {
      job: {
        view: (data) => data?.assignedDeliveryAgentId === user.id,
        update_status: (data) => data?.assignedDeliveryAgentId === user.id,
      },
      customer: { view: true },
    },
    
    warehouse: {
      job: { view: true, update_status: true },
      customer: { view: true },
      batch: { view: true, create: true, update: true },
    },
    
    'customer-service': {
      customer: { view: true, create: true, update: true },
      job: { view: true, create: true },
    },
    
    finance: {
      invoice: { view: true, create: true, update: true, delete: true },
      job: { view: true },
      customer: { view: true },
    },
  };

  const rolePerms = permissions[user.role];
  if (!rolePerms || !rolePerms[resource]) return false;

  const actionPerm = rolePerms[resource][action];
  
  // If permission is a function, call it with resource data (for ownership checks)
  if (typeof actionPerm === 'function') {
    return actionPerm(resourceData);
  }
  
  // Otherwise, return the boolean value
  return actionPerm === true;
};

export default {
  hasPermission,
  hasRole,
  canAccessRoute,
  getDashboardRoute,
  getSidebarMenuItems,
  canPerformAction,
};






