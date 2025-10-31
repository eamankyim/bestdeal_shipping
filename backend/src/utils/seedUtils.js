const prisma = require('../config/database');

/**
 * Seed system roles if they don't exist
 * @returns {Promise<Object>} Result with seeded roles count
 */
async function seedRoles() {
  const roles = [
    {
      name: 'superadmin',
      displayName: 'Super Administrator',
      description: 'Full system access with all privileges',
      color: '#f5222d',
      isSystem: true,
      permissions: JSON.stringify([
        '*', // All permissions
        'system-settings',
        'user-management',
        'role-management',
        'all-data-access',
      ]),
    },
    {
      name: 'admin',
      displayName: 'Administrator',
      description: 'Full system access and management',
      color: '#1890ff',
      isSystem: true,
      permissions: JSON.stringify([
        'dashboard',
        'users-view',
        'users-create',
        'users-update',
        'users-delete',
        'jobs-view',
        'jobs-create',
        'jobs-update',
        'jobs-delete',
        'jobs-assign',
        'customers-view',
        'customers-create',
        'customers-update',
        'customers-delete',
        'batches-view',
        'batches-create',
        'batches-update',
        'batches-delete',
        'invoices-view',
        'invoices-create',
        'invoices-update',
        'invoices-send',
        'invitations-send',
        'invitations-view',
        'reports-view',
        'financial:view',
      ]),
    },
    {
      name: 'finance',
      displayName: 'Finance Manager',
      description: 'Manage invoices, payments, and financial reports',
      color: '#faad14',
      isSystem: true,
      permissions: JSON.stringify([
        'dashboard',
        'invoices-view',
        'invoices-create',
        'invoices-update',
        'invoices-send',
        'invoices-mark-paid',
        'customers-view',
        'jobs-view',
        'reports-financial',
        'financial:view',
      ]),
    },
    {
      name: 'customer-service',
      displayName: 'Customer Service',
      description: 'Manage customers and track shipments',
      color: '#13c2c2',
      isSystem: true,
      permissions: JSON.stringify([
        'dashboard',
        'customers-view',
        'customers-create',
        'customers-update',
        'jobs-view',
        'jobs-create',
        'jobs-update',
        'tracking-view',
      ]),
    },
    {
      name: 'warehouse',
      displayName: 'Warehouse Manager',
      description: 'Manage warehouse operations and batching',
      color: '#52c41a',
      isSystem: true,
      permissions: JSON.stringify([
        'dashboard',
        'warehouse-dashboard',
        'batches-view',
        'batches-create',
        'batches-update',
        'jobs-view',
        'jobs-update',
        'jobs-assign',
      ]),
    },
    {
      name: 'driver',
      displayName: 'Driver',
      description: 'Collection and delivery operations',
      color: '#fa8c16',
      isSystem: true,
      permissions: JSON.stringify([
        'dashboard',
        'driver-dashboard',
        'jobs-assigned-view',
        'jobs-update-status',
        'jobs-add-notes',
        'upload-documents',
      ]),
    },
    {
      name: 'delivery-agent',
      displayName: 'Delivery Agent',
      description: 'Final delivery operations',
      color: '#722ed1',
      isSystem: true,
      permissions: JSON.stringify([
        'dashboard',
        'delivery-dashboard',
        'deliveries-assigned-view',
        'delivery-confirm',
        'delivery-update-status',
        'upload-pod',
      ]),
    },
    {
      name: 'user',
      displayName: 'User',
      description: 'Basic user access',
      color: '#8c8c8c',
      isSystem: true,
      permissions: JSON.stringify([
        'dashboard',
        'jobs-view',
        'customers-view',
      ]),
    },
  ];

  let seededCount = 0;

  for (const role of roles) {
    const result = await prisma.role.upsert({
      where: { name: role.name },
      update: {}, // Don't update existing roles
      create: role,
    });
    if (result) seededCount++;
  }

  return {
    success: true,
    count: seededCount,
    total: roles.length,
  };
}

/**
 * Seed system settings if they don't exist
 * @returns {Promise<Object>} Result with seeded settings count
 */
async function seedSettings() {
  const settings = [
    {
      key: 'company_name',
      value: 'Best Deal App',
      description: 'Company name',
      type: 'string',
    },
    {
      key: 'company_email',
      value: 'info@bestdeal.com',
      description: 'Company contact email',
      type: 'string',
    },
    {
      key: 'company_phone',
      value: '+1 (555) 123-4567',
      description: 'Company contact phone',
      type: 'string',
    },
    {
      key: 'default_currency',
      value: 'USD',
      description: 'Default currency for pricing',
      type: 'string',
    },
    {
      key: 'tax_rate',
      value: '10',
      description: 'Default tax rate percentage',
      type: 'number',
    },
  ];

  let seededCount = 0;

  for (const setting of settings) {
    const result = await prisma.setting.upsert({
      where: { key: setting.key },
      update: {}, // Don't update existing settings
      create: setting,
    });
    if (result) seededCount++;
  }

  return {
    success: true,
    count: seededCount,
    total: settings.length,
  };
}

/**
 * Check if roles are already seeded
 * @returns {Promise<boolean>} True if roles exist
 */
async function rolesExist() {
  const roleCount = await prisma.role.count({
    where: { isSystem: true },
  });
  return roleCount > 0;
}

/**
 * Auto-seed roles and settings if they don't exist
 * @returns {Promise<Object>} Result with seeding information
 */
async function autoSeedIfNeeded() {
  const rolesAlreadyExist = await rolesExist();
  
  if (rolesAlreadyExist) {
    return {
      rolesSeeded: false,
      settingsSeeded: false,
      message: 'Roles and settings already exist',
    };
  }

  console.log('🌱 Auto-seeding roles and settings...');
  
  const rolesResult = await seedRoles();
  const settingsResult = await seedSettings();

  console.log(`✅ Seeded ${rolesResult.count} roles and ${settingsResult.count} settings`);

  return {
    rolesSeeded: true,
    settingsSeeded: true,
    rolesCount: rolesResult.count,
    settingsCount: settingsResult.count,
    message: `Successfully seeded ${rolesResult.count} roles and ${settingsResult.count} settings`,
  };
}

module.exports = {
  seedRoles,
  seedSettings,
  rolesExist,
  autoSeedIfNeeded,
};



