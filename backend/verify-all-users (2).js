const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyAllUsers() {
  try {
    console.log('✉️  Verifying all users\' emails...\n');

    // Get total users
    const totalUsers = await prisma.user.count();
    console.log(`📊 Total Users: ${totalUsers}\n`);

    if (totalUsers === 0) {
      console.log('ℹ️  No users found in database.\n');
      return;
    }

    // Get users that are not verified
    const unverifiedUsers = await prisma.user.findMany({
      where: {
        emailVerified: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    console.log(`📋 Unverified Users: ${unverifiedUsers.length}\n`);

    if (unverifiedUsers.length === 0) {
      console.log('✅ All users are already verified!\n');
      return;
    }

    // Update all users to verified
    const result = await prisma.user.updateMany({
      where: {
        emailVerified: false,
      },
      data: {
        emailVerified: true,
      },
    });

    console.log(`✅ Verified ${result.count} user(s):\n`);
    unverifiedUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email})`);
    });

    console.log('\n✅ All users are now verified and can login!\n');

  } catch (error) {
    console.error('❌ Error verifying users:', error.message);
    if (error.code === 'P1001') {
      console.error('⚠️  Cannot reach database server. Make sure your database is running.');
    } else if (error.code === 'P1002') {
      console.error('⚠️  Database connection timed out. The database might be sleeping (Render free tier).');
      console.error('💡 Try starting your backend server first to wake up the database.');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAllUsers();

