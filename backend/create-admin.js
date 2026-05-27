require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('./src/utils/passwordUtils');

const prisma = new PrismaClient();

async function createAdmin() {
  console.log('👤 Creating admin user...\n');

  const email = 'admin@gmail.com';
  const password = '111111@1A';
  const name = 'Admin User';

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('❌ User already exists with email:', email);
      console.log('   If you want to reset the password, delete the user first.\n');
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: 'admin',
        active: true,
        emailVerified: true,
      },
    });

    console.log('✅ Admin user created successfully!\n');
    console.log('📧 Email:    ', email);
    console.log('🔑 Password: ', password);
    console.log('👤 Name:     ', name);
    console.log('🎯 Role:     ', 'admin');
    console.log('🆔 User ID:  ', admin.id);
    console.log('\n🎉 You can now login with these credentials!\n');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    throw error;
  }
}

createAdmin()
  .catch((e) => {
    console.error('Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });






