# BestDeal production server

BestDeal runs on its own server, **213.136.94.207** (Contabo, Ubuntu 24.04, hostname `bestdeal`).
It serves https://bestdealghanaapp.com: the website, the API at `/api` that the website and
the mobile app use, and the database. Nothing else runs on this server.

```
internet ──► web (Caddy: HTTPS, website files, /api/* ──► backend) ──► db (Postgres 18)
             ports 80/443                                  port 4000 (internal only)  internal only
```

The firewall lets in only SSH (keys only, no passwords) and ports 80/443.

## Where things are on the server

| Path | What it is |
| --- | --- |
| `/opt/bestdeal/.env` | All settings and secrets (database password, login secrets, SMTP). Only on the server, never in this repo, which is public. |
| `/opt/bestdeal/bin/deploy` | Deploy script (copy of `deploy/server/deploy.sh`) |
| `/opt/bestdeal/bin/backup` | Backup script (copy of `deploy/server/backup.sh`) |
| `/opt/bestdeal/bin/create-admin` | Creates a superadmin (copy of `deploy/server/create-admin.sh`) |
| `/opt/bestdeal/releases/` | The last 5 releases; `/opt/bestdeal/current` points at the one running |
| `/opt/bestdeal/backups/` | Database backups |
| `/etc/cron.d/bestdeal` | Nightly backup at 02:30 server time (Europe/Berlin) |

After changing `deploy/server/*.sh`, copy them to the server again; deploys don't update them:

```sh
ssh root@213.136.94.207 'cat > /opt/bestdeal/bin/deploy' < deploy/server/deploy.sh
ssh root@213.136.94.207 'cat > /opt/bestdeal/bin/backup' < deploy/server/backup.sh
```

## Admin accounts

Create a superadmin by running this yourself, so the password is only typed on your keyboard:

```sh
ssh -t root@213.136.94.207 /opt/bestdeal/bin/create-admin
```

On an empty database it also adds the standard roles. Invite everyone else from inside the app.
The app's public `POST /api/auth/create-superadmin` route stays switched off unless the server
is started with `ALLOW_SUPERADMIN_SETUP=1`; there is no need to switch it on.

## Deploying

Every push to the `production` branch deploys automatically (`.github/workflows/deploy-production.yml`).
GitHub sends `backend/`, `frontend/` and `deploy/` to the server, and `/opt/bestdeal/bin/deploy`:

1. builds the new API and website images,
2. backs up the database,
3. updates the database tables with `prisma db push`, which refuses any change that would delete data,
4. swaps the containers and waits until they are healthy.

If any step fails, the release that was running keeps running, and the GitHub run shows the error.

The `BESTDEAL_DEPLOY_KEY` secret on GitHub is an SSH key that can do nothing on the server except
run the deploy script (`restrict,command=` in `/root/.ssh/authorized_keys`).

On the server:

```sh
/opt/bestdeal/bin/deploy status      # what is running
/opt/bestdeal/bin/deploy rollback    # go back to the previous release (database tables stay as they are)
cd /opt/bestdeal/current && docker compose -p bestdeal --env-file /opt/bestdeal/.env -f deploy/compose.yml logs -f backend
```

Changing a setting in `/opt/bestdeal/.env` needs a restart of the containers:

```sh
cd /opt/bestdeal/current && RELEASE_TAG=$(basename "$(readlink -f /opt/bestdeal/current)") \
  docker compose -p bestdeal --env-file /opt/bestdeal/.env -f deploy/compose.yml up -d
```

## Backups and restoring

`/opt/bestdeal/bin/backup` saves a full copy of the database (including photos and documents, which
are stored in it) to `/opt/bestdeal/backups/`. Nightly copies are kept for 30 days, copies taken
before a deploy for 14 days. They are on the same server, so also download one now and then:

```sh
scp root@213.136.94.207:/opt/bestdeal/backups/<file>.dump .
```

To restore one (this replaces everything in the database):

```sh
docker stop bestdeal-backend-1
docker exec -i bestdeal-db pg_restore -U bestdeal -d bestdeal --clean --if-exists --no-owner --no-acl < /opt/bestdeal/backups/<file>.dump
docker start bestdeal-backend-1
```

## HTTPS

Caddy gets the certificates from Let's Encrypt by itself, as soon as `bestdealghanaapp.com` and
`www.bestdealghanaapp.com` point at 213.136.94.207 (A records at NameSilo). `www` redirects to the
main address. `TEST_DOMAIN` in `.env` can serve the same site on a second address for testing.
