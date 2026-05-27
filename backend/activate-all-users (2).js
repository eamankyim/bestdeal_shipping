/**
 * Activate All Users Script
 * 
 * This script sets active: true for all users in the database.
 * Useful for fixing users who were created before active field was explicitly set.
 * 
 * Usage: npm run activate:all-users
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function activateAllUsers() {
  try {
    console.log('🔍 Checking users in database...\n');

    // Find all users
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        emailVerified: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    console.log(`📊 Total users found: ${allUsers.length}\n`);

    if (allUsers.length === 0) {
      console.log('✅ No users to activate.');
      return;
    }

    // Count inactive users
    const inactiveUsers = allUsers.filter(user => !user.active);
    console.log(`🔴 Inactive users: ${inactiveUsers.length}`);
    console.log(`✅ Active users: ${allUsers.length - inactiveUsers.length}\n`);

    if (inactiveUsers.length === 0) {
      console.log('✅ All users are already active. No changes needed.');
      return;
    }

    // Display inactive users
    console.log('📋 Inactive users:');
    console.log('─'.repeat(80));
    inactiveUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
    });
    console.log('─'.repeat(80));
    console.log();

    // Activate all inactive users
    console.log('🔄 Activating all users...\n');

    const updateResult = await prisma.user.updateMany({
      where: {
        active: false,
      },
      data: {
        active: true,
      },
    });

    console.log(`✅ Successfully activated ${updateResult.count} user(s).\n`);

    // Verify the update
    const updatedUsers = await prisma.user.findMany({
      where: {
        active: false,
      },
    });

    if (updatedUsers.length === 0) {
      console.log('✅ Verification: All users are now active!');
    } else {
      console.log(`⚠️  Warning: ${updatedUsers.length} user(s) are still inactive.`);
    }

    // Display summary
    console.log('\n📊 Summary:');
    console.log('─'.repeat(80));
    const summary = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true,
      },
      where: {
        active: true,
      },
    });

    summary.forEach((item) => {
      console.log(`  ${item.role}: ${item._count.id} user(s)`);
    });
    console.log('─'.repeat(80));

  } catch (error) {
    console.error('❌ Error activating users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
activateAllUsers()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

