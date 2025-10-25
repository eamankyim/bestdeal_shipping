const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('../src/utils/passwordUtils');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // 1. Seed Roles
  console.log('📝 Creating roles...');
  
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

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }
  
  console.log('✅ Roles created\n');

  // 2. Create Sample Users (Optional - for testing)
  console.log('👥 Creating sample test users...');
  
  const sampleUsers = [
    {
      email: 'warehouse@bestdeal.com',
      password: 'warehouse123',
      name: 'Warehouse Manager',
      role: 'warehouse',
    },
    {
      email: 'driver@bestdeal.com',
      password: 'driver123',
      name: 'John Driver',
      role: 'driver',
    },
    {
      email: 'delivery@bestdeal.com',
      password: 'delivery123',
      name: 'Sarah Delivery',
      role: 'delivery-agent',
    },
    {
      email: 'finance@bestdeal.com',
      password: 'finance123',
      name: 'Finance Manager',
      role: 'finance',
    },
    {
      email: 'support@bestdeal.com',
      password: 'support123',
      name: 'Customer Support',
      role: 'customer-service',
    },
  ];

  for (const user of sampleUsers) {
    const passwordHash = await hashPassword(user.password);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        passwordHash,
        name: user.name,
        role: user.role,
        active: true,
        emailVerified: true,
      },
    });
    console.log(`   ✓ ${user.name} (${user.email})`);
  }
  
  console.log('✅ Sample users created\n');

  // 4. Create Sample Settings
  console.log('⚙️  Creating system settings...');
  
  const settings = [
    {
      key: 'company_name',
      value: 'BestDeal Shipping',
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

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  
  console.log('✅ System settings created\n');

  console.log('🎉 Seeding completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   - ${roles.length} roles created`);
  console.log(`   - ${sampleUsers.length} sample users created`);
  console.log(`   - ${settings.length} settings created\n`);
  
  console.log('🔐 Sample Test User Credentials:');
  console.log('   Warehouse:  warehouse@bestdeal.com / warehouse123');
  console.log('   Driver:     driver@bestdeal.com / driver123');
  console.log('   Delivery:   delivery@bestdeal.com / delivery123');
  console.log('   Finance:    finance@bestdeal.com / finance123');
  console.log('   Support:    support@bestdeal.com / support123\n');
  
  console.log('⚠️  IMPORTANT: Create your superadmin via API:');
  console.log('   POST http://localhost:4001/api/auth/create-superadmin');
  console.log('   Or use Swagger UI at: http://localhost:4001/api/docs\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });






