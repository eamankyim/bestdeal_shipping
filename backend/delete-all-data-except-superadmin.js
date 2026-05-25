/**
 * Delete all application data and all users except the superadmin.
 *
 * Defaults to a dry run. To execute the destructive cleanup, pass --confirm or set
 * CONFIRM_DELETE_ALL_DATA=true.
 *
 * Usage:
 *   npm run cleanup:keep-superadmin
 *   npm run cleanup:keep-superadmin -- --confirm
 *   npm run cleanup:keep-superadmin -- --superadmin-email=admin@example.com --confirm
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DATA_MODELS = [
  { label: 'Invoice items', model: 'invoiceItem' },
  { label: 'Job documents', model: 'jobDocument' },
  { label: 'Job timeline entries', model: 'jobTimeline' },
  { label: 'Notifications', model: 'notification' },
  { label: 'Refresh tokens', model: 'refreshToken' },
  { label: 'Invitations', model: 'invitation' },
  { label: 'Invoices', model: 'invoice' },
  { label: 'Jobs', model: 'job' },
  { label: 'Batches', model: 'batch' },
  { label: 'Customers', model: 'customer' },
  { label: 'Audit logs', model: 'auditLog' },
  { label: 'Pricing rules', model: 'pricing' },
];

const SYSTEM_MODELS = [
  { label: 'Settings', model: 'setting' },
  { label: 'Roles', model: 'role' },
];

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function getArgValue(name) {
  const prefix = `${name}=`;
  const inlineValue = process.argv.find((arg) => arg.startsWith(prefix));

  if (inlineValue) {
    return inlineValue.slice(prefix.length).trim();
  }

  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1]?.trim() : undefined;
}

function envIsTrue(name) {
  return String(process.env[name] || '').toLowerCase() === 'true';
}

function formatCount(value) {
  return String(value).padStart(6, ' ');
}

async function countRows(models) {
  const entries = await Promise.all(
    models.map(async ({ label, model }) => [label, await prisma[model].count()])
  );

  return Object.fromEntries(entries);
}

async function getSuperadminToKeep(superadminEmail) {
  const where = {
    role: 'superadmin',
    ...(superadminEmail
      ? {
          email: {
            equals: superadminEmail,
            mode: 'insensitive',
          },
        }
      : {}),
  };

  const superadmins = await prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  if (superadmins.length === 0) {
    throw new Error(
      superadminEmail
        ? `No superadmin found with email "${superadminEmail}". Aborting without deleting anything.`
        : 'No superadmin user found. Aborting without deleting anything.'
    );
  }

  if (superadmins.length > 1 && !superadminEmail) {
    const emails = superadmins.map((user) => user.email).join(', ');
    throw new Error(
      `Found multiple superadmins (${emails}). Re-run with --superadmin-email=<email> so only one account is preserved.`
    );
  }

  return superadmins[0];
}

async function printPlan({ superadmin, deleteSystemData }) {
  const userCount = await prisma.user.count();
  const usersToDelete = await prisma.user.count({
    where: {
      id: {
        not: superadmin.id,
      },
    },
  });
  const dataCounts = await countRows(DATA_MODELS);
  const systemCounts = deleteSystemData ? await countRows(SYSTEM_MODELS) : {};

  console.log('Cleanup plan');
  console.log('============');
  console.log(`Superadmin to keep: ${superadmin.name} <${superadmin.email}> (${superadmin.id})`);
  console.log(`Users total:        ${userCount}`);
  console.log(`Users to delete:    ${usersToDelete}`);
  console.log('');
  console.log('Application data to delete:');
  DATA_MODELS.forEach(({ label }) => {
    console.log(`  ${formatCount(dataCounts[label])}  ${label}`);
  });

  if (deleteSystemData) {
    console.log('');
    console.log('System metadata to delete (--include-system-data enabled):');
    SYSTEM_MODELS.forEach(({ label }) => {
      console.log(`  ${formatCount(systemCounts[label])}  ${label}`);
    });
  } else {
    console.log('');
    console.log('Preserving system metadata: Roles and Settings');
    console.log('Use --include-system-data or DELETE_SYSTEM_DATA=true to delete those too.');
  }
}

async function deleteManyWithReport(tx, { label, model }) {
  const result = await tx[model].deleteMany();
  console.log(`Deleted ${formatCount(result.count)}  ${label}`);
  return result.count;
}

async function executeCleanup({ superadmin, deleteSystemData }) {
  console.log('');
  console.log('Executing destructive cleanup...');
  console.log('================================');

  await prisma.$transaction(
    async (tx) => {
      for (const model of DATA_MODELS) {
        await deleteManyWithReport(tx, model);
      }

      const deletedUsers = await tx.user.deleteMany({
        where: {
          id: {
            not: superadmin.id,
          },
        },
      });
      console.log(`Deleted ${formatCount(deletedUsers.count)}  Users except superadmin`);

      if (deleteSystemData) {
        for (const model of SYSTEM_MODELS) {
          await deleteManyWithReport(tx, model);
        }
      }
    },
    {
      maxWait: 10000,
      timeout: 60000,
    }
  );
}

async function verifyResult(superadminId, deleteSystemData) {
  const remainingUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
  const remainingDataCounts = await countRows(DATA_MODELS);
  const remainingSystemCounts = deleteSystemData ? await countRows(SYSTEM_MODELS) : {};

  const unexpectedUsers = remainingUsers.filter((user) => user.id !== superadminId);
  const remainingDataTotal = Object.values(remainingDataCounts).reduce((sum, count) => sum + count, 0);
  const remainingSystemTotal = Object.values(remainingSystemCounts).reduce((sum, count) => sum + count, 0);

  if (remainingUsers.length !== 1 || unexpectedUsers.length > 0 || remainingUsers[0]?.role !== 'superadmin') {
    throw new Error('Verification failed: expected exactly one remaining superadmin user.');
  }

  if (remainingDataTotal !== 0) {
    throw new Error('Verification failed: some application data still remains.');
  }

  if (deleteSystemData && remainingSystemTotal !== 0) {
    throw new Error('Verification failed: some system metadata still remains.');
  }

  console.log('');
  console.log('Verification complete');
  console.log('=====================');
  console.log(`Remaining user: ${remainingUsers[0].name} <${remainingUsers[0].email}> (${remainingUsers[0].role})`);
  console.log('Application data rows remaining: 0');
}

async function main() {
  const confirmed = hasFlag('--confirm') || envIsTrue('CONFIRM_DELETE_ALL_DATA');
  const deleteSystemData = hasFlag('--include-system-data') || envIsTrue('DELETE_SYSTEM_DATA');
  const superadminEmail = getArgValue('--superadmin-email') || process.env.SUPERADMIN_EMAIL;
  const superadmin = await getSuperadminToKeep(superadminEmail);

  console.log('');
  console.log('WARNING: This script deletes app data and all non-superadmin users.');
  console.log('It never creates or modifies a superadmin account.');
  console.log('');

  await printPlan({ superadmin, deleteSystemData });

  if (!confirmed || hasFlag('--dry-run')) {
    console.log('');
    console.log('Dry run only. No rows were deleted.');
    console.log('To delete data, re-run with --confirm or CONFIRM_DELETE_ALL_DATA=true.');
    return;
  }

  await executeCleanup({ superadmin, deleteSystemData });
  await verifyResult(superadmin.id, deleteSystemData);

  console.log('');
  console.log('Cleanup completed successfully.');
}

main()
  .catch((error) => {
    console.error('');
    console.error('Cleanup aborted:', error.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
