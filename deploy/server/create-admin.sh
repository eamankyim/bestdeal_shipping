#!/usr/bin/env bash
# Creates a superadmin account, installed on the server as /opt/bestdeal/bin/create-admin.
# Run it yourself so the password is only ever typed on your keyboard:
#   ssh -t root@213.136.94.207 /opt/bestdeal/bin/create-admin
# It also adds the standard roles if the database has none yet, and removes the locked
# "setup-lock" placeholder that keeps the app's public setup endpoint closed on an empty database.
set -Eeuo pipefail

[ -t 0 ] || { echo "Run this with ssh -t so it can ask for the password." >&2; exit 1; }

read -r -p "Email for the new admin: " ADMIN_EMAIL
read -r -p "Full name: " ADMIN_NAME
read -r -s -p "Password (at least 10 characters, not shown): " ADMIN_PASSWORD; echo
read -r -s -p "Password again: " again; echo
[ "$ADMIN_PASSWORD" = "$again" ] || { echo "The passwords don't match. Nothing changed." >&2; exit 1; }
[ "${#ADMIN_PASSWORD}" -ge 10 ] || { echo "The password must be at least 10 characters. Nothing changed." >&2; exit 1; }
[[ "$ADMIN_EMAIL" =~ ^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$ ]] || { echo "That email doesn't look right. Nothing changed." >&2; exit 1; }
[ -n "${ADMIN_NAME// /}" ] || { echo "The name is empty. Nothing changed." >&2; exit 1; }
export ADMIN_EMAIL ADMIN_NAME ADMIN_PASSWORD

docker exec -i -e ADMIN_EMAIL -e ADMIN_NAME -e ADMIN_PASSWORD bestdeal-backend-1 node - <<'JS'
const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('./src/utils/passwordUtils');
const { rolesExist, seedRoles } = require('./src/utils/seedUtils');

const prisma = new PrismaClient();
(async () => {
  const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
  const name = process.env.ADMIN_NAME.trim();
  if (await prisma.user.findUnique({ where: { email } })) {
    console.error(`An account with ${email} already exists. Nothing changed.`);
    process.exit(2);
  }
  if (!(await rolesExist())) {
    const roles = await seedRoles();
    console.log(`Added the ${roles.count} standard roles.`);
  }
  await prisma.user.create({
    data: { email, name, role: 'superadmin', active: true, emailVerified: true, passwordHash: await hashPassword(process.env.ADMIN_PASSWORD) },
  });
  const removed = await prisma.user.deleteMany({ where: { email: 'setup-lock@bestdeal.invalid' } });
  if (removed.count) console.log('Removed the setup placeholder.');
  console.log(`Done: ${email} can now sign in as superadmin.`);
})()
  .catch((error) => { console.error(`Failed: ${error.message}`); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
JS
