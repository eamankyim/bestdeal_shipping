/**
 * Test script to create a warehouse user with Ghana Warehouse location
 * Run with: node create-test-warehouse-user.js
 */

require('dotenv').config();
const prisma = require('./src/config/database');
const { hashPassword } = require('./src/utils/passwordUtils');

async function createTestUser() {
  try {
    console.log('═══════════════════════════════════════════════');
    console.log('Creating test warehouse user with Ghana Warehouse location...');
    console.log('═══════════════════════════════════════════════\n');

    const testEmail = 'warehouse.ghana@test.com';
    const testPassword = 'Test123!@#';
    const testName = 'Ghana Warehouse Test User';

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: testEmail },
    });

    if (existingUser) {
      console.log('⚠️  User already exists. Updating warehouse location...');
      
      // Update existing user
      const updatedUser = await prisma.user.update({
        where: { email: testEmail },
        data: {
          warehouseLocation: 'Ghana Warehouse',
          role: 'warehouse',
          active: true,
          emailVerified: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          warehouseLocation: true,
          active: true,
          emailVerified: true,
        },
      });

      console.log('✅ User updated successfully!');
      console.log('\n📋 User Details:');
      console.log('   Email:', updatedUser.email);
      console.log('   Name:', updatedUser.name);
      console.log('   Role:', updatedUser.role);
      console.log('   Warehouse Location:', updatedUser.warehouseLocation);
      console.log('   Active:', updatedUser.active);
      console.log('   Email Verified:', updatedUser.emailVerified);
      
      console.log('\n🔑 Login Credentials:');
      console.log('   Email:', testEmail);
      console.log('   Password:', testPassword);
      console.log('\n✅ Test user is ready!');
      console.log('   - Login with the credentials above');
      console.log('   - User should be redirected to /ghana-warehouse dashboard');
      console.log('   - Access to /warehouse-dashboard should be blocked');
      console.log('═══════════════════════════════════════════════');
      
      await prisma.$disconnect();
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(testPassword);

    // Create new user
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash,
        name: testName,
        role: 'warehouse',
        warehouseLocation: 'Ghana Warehouse',
        active: true,
        emailVerified: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        warehouseLocation: true,
        active: true,
        emailVerified: true,
      },
    });

    console.log('✅ User created successfully!');
    console.log('\n📋 User Details:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Name:', user.name);
    console.log('   Role:', user.role);
    console.log('   Warehouse Location:', user.warehouseLocation);
    console.log('   Active:', user.active);
    console.log('   Email Verified:', user.emailVerified);
    
    console.log('\n🔑 Login Credentials:');
    console.log('   Email:', testEmail);
    console.log('   Password:', testPassword);
    
    console.log('\n🧪 Testing Instructions:');
    console.log('   1. Login with the credentials above');
    console.log('   2. User should be automatically redirected to /ghana-warehouse dashboard');
    console.log('   3. If accessing /warehouse-dashboard directly, should be redirected to /ghana-warehouse');
    console.log('   4. Sidebar should show "Ghana Warehouse" menu item');
    console.log('   5. Sidebar should NOT show general "Warehouse" menu item');
    
    console.log('\n✅ Test user is ready!');
    console.log('═══════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error creating test user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createTestUser()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

