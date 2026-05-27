const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const originalEnv = { ...process.env };
const loadedEnvFiles = [];

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const parsed = dotenv.parse(fs.readFileSync(filePath));

  Object.entries(parsed).forEach(([key, value]) => {
    // Preserve values injected by the live process/container environment.
    if (Object.prototype.hasOwnProperty.call(originalEnv, key)) {
      return;
    }

    process.env[key] = value;
  });

  loadedEnvFiles.push(path.relative(process.cwd(), filePath));
}

function loadServerEnv() {
  [
    path.resolve(__dirname, '..', '.env'),
    path.resolve(__dirname, '.env'),
    path.resolve(__dirname, '..', '.env.production'),
    path.resolve(__dirname, '.env.production'),
  ].forEach(loadEnvFile);
}

function maskValue(value) {
  if (!value) {
    return '';
  }

  if (value.length <= 2) {
    return '*'.repeat(value.length);
  }

  return `${value[0]}${'*'.repeat(Math.min(value.length - 2, 6))}${value[value.length - 1]}`;
}

function formatDatabaseTarget(databaseUrl) {
  try {
    const url = new URL(databaseUrl);
    const database = url.pathname.replace(/^\//, '') || '(default)';
    const schema = url.searchParams.get('schema');
    const port = url.port ? `:${url.port}` : '';
    const auth = url.username ? `${maskValue(decodeURIComponent(url.username))}:****@` : '';

    return [
      `${url.protocol}//${auth}${url.hostname}${port}/${database}`,
      schema ? `schema=${schema}` : null,
    ].filter(Boolean).join(' ');
  } catch (error) {
    return 'Unable to parse DATABASE_URL; value is set but hidden.';
  }
}

function printMissingDatabaseUrlHelp() {
  console.error('DATABASE_URL is not set.');
  console.error('');
  console.error('Run this against the live backend container so Docker supplies the production DATABASE_URL:');
  console.error('  docker compose -f docker-compose.prod.yml exec backend npm run check:users');
  console.error('');
  console.error('Or run it on the server host after loading the production env file:');
  console.error('  set -a; source .env.production; set +a; npm --prefix backend run check:users');
  console.error('');
  console.error('Loaded env files:', loadedEnvFiles.length ? loadedEnvFiles.join(', ') : 'none');
}

function formatDate(value) {
  return value ? value.toISOString() : 'Never';
}

function toRow(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
    emailVerified: user.emailVerified,
    createdAt: formatDate(user.createdAt),
    lastLogin: formatDate(user.lastLogin),
  };
}

loadServerEnv();

if (!process.env.DATABASE_URL) {
  printMissingDatabaseUrlHelp();
  process.exit(1);
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('Checking users in database...');
    console.log('Database target:', formatDatabaseTarget(process.env.DATABASE_URL));
    console.log('Env source:', Object.prototype.hasOwnProperty.call(originalEnv, 'DATABASE_URL') ? 'process environment' : loadedEnvFiles.join(', '));
    console.log('');

    const totalUsers = await prisma.user.count();
    console.log(`Total users: ${totalUsers}`);
    console.log('');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        emailVerified: true,
        createdAt: true,
        lastLogin: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (users.length === 0) {
      console.log('No users found.');
      return;
    }

    console.table(users.map(toRow));

    const roleSummary = users.reduce((summary, user) => {
      summary[user.role] = (summary[user.role] || 0) + 1;
      return summary;
    }, {});

    console.log('');
    console.log('Users by role:');
    Object.entries(roleSummary).forEach(([role, count]) => {
      console.log(`  ${role}: ${count}`);
    });
  } catch (error) {
    console.error('Error checking users:', error.message);

    if (error.code === 'P1001') {
      console.error('Cannot reach the database host from this environment.');
      console.error('If production uses Docker, run the command inside the live backend container.');
    } else if (error.code === 'P1002') {
      console.error('Database connection timed out.');
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();

