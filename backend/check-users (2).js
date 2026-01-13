const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Checking users in database...\n');
    console.log('📊 Database:', process.env.DATABASE_URL?.split('@')[1] || 'Unknown');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Get total count
    const totalUsers = await prisma.user.count();
    console.log(`📈 Total Users: ${totalUsers}\n`);

    if (totalUsers === 0) {
      console.log('ℹ️  No users found in database.\n');
      console.log('💡 To create an admin user:');
      console.log('   1. Use Swagger UI: http://localhost:4001/api/docs');
      console.log('   2. POST /api/auth/create-superadmin');
      console.log('   3. This will also auto-seed roles if needed\n');
      return;
    }

    // Fetch all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        emailVerified: true,
        phone: true,
        createdAt: true,
        lastLogin: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Display users in a table format
    console.log('👥 Users List:\n');
    console.log('┌─────────────────────────────────────────────────────────────────────────────────────────────┐');
    console.log('│ ' + 'Name'.padEnd(25) + 'Email'.padEnd(35) + 'Role'.padEnd(15) + 'Status'.padEnd(10) + '│');
    console.log('├─────────────────────────────────────────────────────────────────────────────────────────────┤');

    users.forEach((user, index) => {
      const name = (user.name || 'N/A').substring(0, 24).padEnd(25);
      const email = (user.email || 'N/A').substring(0, 34).padEnd(35);
      const role = (user.role || 'N/A').padEnd(15);
      const status = user.active ? '✅ Active' : '❌ Inactive';
      const statusPadded = status.padEnd(10);
      
      console.log(`│ ${name}${email}${role}${statusPadded} │`);
      
      if (index < users.length - 1) {
        console.log('├─────────────────────────────────────────────────────────────────────────────────────────────┤');
      }
    });

    console.log('└─────────────────────────────────────────────────────────────────────────────────────────────┘\n');

    // Detailed information
    console.log('📋 Detailed Information:\n');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || 'N/A'}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🎯 Role: ${user.role}`);
      console.log(`   📱 Phone: ${user.phone || 'N/A'}`);
      console.log(`   ✅ Active: ${user.active ? 'Yes' : 'No'}`);
      console.log(`   ✉️  Email Verified: ${user.emailVerified ? 'Yes' : 'No'}`);
      console.log(`   📅 Created: ${user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}`);
      console.log(`   🔐 Last Login: ${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}`);
      console.log(`   🆔 ID: ${user.id}`);
      console.log('');
    });

    // Summary by role
    const roleSummary = {};
    users.forEach(user => {
      roleSummary[user.role] = (roleSummary[user.role] || 0) + 1;
    });

    console.log('📊 Summary by Role:\n');
    Object.entries(roleSummary).forEach(([role, count]) => {
      console.log(`   ${role.padEnd(20)}: ${count} user(s)`);
    });
    console.log('');

    // Check for admin/superadmin
    const admins = users.filter(u => u.role === 'admin' || u.role === 'superadmin');
    if (admins.length === 0) {
      console.log('⚠️  No admin or superadmin users found!');
      console.log('💡 Create one via Swagger: POST /api/auth/create-superadmin\n');
    } else {
      console.log('✅ Admin users found:', admins.length);
      admins.forEach(admin => {
        console.log(`   - ${admin.name} (${admin.email}) - Role: ${admin.role}`);
      });
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error checking users:', error.message);
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

checkUsers();

