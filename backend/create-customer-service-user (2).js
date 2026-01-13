const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('./src/utils/passwordUtils');

const prisma = new PrismaClient();

async function createCustomerServiceUser() {
  try {
    console.log('🔐 Creating Customer Service user...\n');

    const email = 'cs@shipease.com';
    const password = '111111@1A';
    const name = 'Customer Service';
    const role = 'customer-service';

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('⚠️  User already exists with email:', email);
      console.log('   ID:', existingUser.id);
      console.log('   Name:', existingUser.name);
      console.log('   Role:', existingUser.role);
      console.log('\n✅ User already exists, skipping creation.');
      return;
    }

    // Hash password
    console.log('🔒 Hashing password...');
    const passwordHash = await hashPassword(password);

    // Create user
    console.log('👤 Creating user...');
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role,
        active: true,
        emailVerified: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    console.log('\n✅ Customer Service user created successfully!');
    console.log('═══════════════════════════════════════════════');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Name:', user.name);
    console.log('   Role:', user.role);
    console.log('   Active:', user.active);
    console.log('   Email Verified:', user.emailVerified);
    console.log('   Created:', user.createdAt);
    console.log('═══════════════════════════════════════════════\n');
  } catch (error) {
    console.error('❌ Error creating user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createCustomerServiceUser()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });


