/**
 * Normalize All User Emails Script
 * 
 * This script normalizes all user emails to lowercase in the database.
 * This fixes case-sensitivity issues with login.
 * 
 * Usage: npm run normalize:emails
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function normalizeEmails() {
  try {
    console.log('🔍 Checking users in database...\n');

    // Find all users
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    console.log(`📊 Total users found: ${allUsers.length}\n`);

    if (allUsers.length === 0) {
      console.log('✅ No users to normalize.');
      return;
    }

    // Find users with non-lowercase emails
    const usersToFix = allUsers.filter(user => {
      const normalizedEmail = user.email.toLowerCase();
      return user.email !== normalizedEmail;
    });

    console.log(`📋 Users with non-lowercase emails: ${usersToFix.length}\n`);

    if (usersToFix.length === 0) {
      console.log('✅ All emails are already normalized!');
      return;
    }

    // Display users to fix
    console.log('📋 Users to normalize:');
    console.log('─'.repeat(80));
    usersToFix.forEach((user, index) => {
      const normalizedEmail = user.email.toLowerCase();
      console.log(`${index + 1}. ${user.name} (${user.email}) → ${normalizedEmail}`);
    });
    console.log('─'.repeat(80));
    console.log();

    // Normalize all emails
    console.log('🔄 Normalizing emails...\n');

    let updatedCount = 0;
    for (const user of usersToFix) {
      const normalizedEmail = user.email.toLowerCase();
      
      // Check if normalized email already exists (would cause unique constraint violation)
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser && existingUser.id !== user.id) {
        console.log(`⚠️  Skipping ${user.email}: normalized email ${normalizedEmail} already exists for user ${existingUser.name}`);
        continue;
      }

      // Update user email to lowercase
      await prisma.user.update({
        where: { id: user.id },
        data: { email: normalizedEmail },
      });

      updatedCount++;
      console.log(`✅ Updated: ${user.name} (${user.email} → ${normalizedEmail})`);
    }

    console.log(`\n✅ Successfully normalized ${updatedCount} user email(s).\n`);

    // Verify the update
    const remainingUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
      },
    });

    const stillNeedFix = remainingUsers.filter(user => {
      const normalizedEmail = user.email.toLowerCase();
      return user.email !== normalizedEmail;
    });

    if (stillNeedFix.length === 0) {
      console.log('✅ Verification: All emails are now normalized!');
    } else {
      console.log(`⚠️  Warning: ${stillNeedFix.length} user email(s) still need normalization.`);
      stillNeedFix.forEach(user => {
        console.log(`   - ${user.email}`);
      });
    }

    // Display summary
    console.log('\n📊 Summary:');
    console.log('─'.repeat(80));
    const summary = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true,
      },
    });

    summary.forEach((item) => {
      console.log(`  ${item.role}: ${item._count.id} user(s)`);
    });
    console.log('─'.repeat(80));

  } catch (error) {
    console.error('❌ Error normalizing emails:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
normalizeEmails()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

