# Production Deployment - Quick Reference

A concise guide for deploying applications to Kotombo server.

## 🚀 Quick Deployment Commands

### Initial Server Setup
```bash
# 1. Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 2. Create app directory
mkdir -p ~/bestdeal_shipping && cd ~/bestdeal_shipping

# 3. Clone/Upload code
git clone -b production <repo-url> .  # OR upload via SCP

# 4. Create environment files
nano backend/.env.production
nano frontend/.env.production
nano .env  # Root file for Docker Compose

# 5. Build and start
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

### Regular Deployment
```bash
cd ~/bestdeal_shipping
git pull origin production  # If using Git
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml logs -f
```

### Quick Restart (no rebuild)
```bash
docker-compose -f docker-compose.prod.yml restart
```

## 📝 Environment File Templates

### Root `.env` (for Docker Compose)
```bash
DB_PASSWORD=your-secure-password
JWT_SECRET=generate-64-byte-hex-secret
JWT_REFRESH_SECRET=generate-64-byte-hex-secret
CORS_ORIGINS=https://your-domain.com
PRODUCTION_URL=https://api.your-domain.com
```

### `backend/.env.production`
```bash
PORT=5000
NODE_ENV=production
DATABASE_URL=postgresql://bestdeal_user:${DB_PASSWORD}@postgres:5432/bestdeal_shipping?schema=public
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
CORS_ORIGINS=${CORS_ORIGINS}
PRODUCTION_URL=${PRODUCTION_URL}
```

### `frontend/.env.production`
```bash
REACT_APP_API_URL=https://api.your-domain.com
REACT_APP_NAME=Best Deal App
REACT_APP_SUPPORT_EMAIL=support@your-domain.com
REACT_APP_SUPPORT_PHONE=+44 20 1234 5678
```

## 🔧 Docker Compose Commands

| Command | Description |
|---------|-------------|
| `docker-compose -f docker-compose.prod.yml up -d` | Start services in background |
| `docker-compose -f docker-compose.prod.yml down` | Stop and remove containers |
| `docker-compose -f docker-compose.prod.yml ps` | Show running containers |
| `docker-compose -f docker-compose.prod.yml logs -f [service]` | View logs |
| `docker-compose -f docker-compose.prod.yml restart [service]` | Restart service |
| `docker-compose -f docker-compose.prod.yml build [service]` | Rebuild service |
| `docker-compose -f docker-compose.prod.yml exec [service] [cmd]` | Execute command |

## 🗄️ Database Commands

### Initial Setup
```bash
# Enter backend container
docker exec -it bestdeal_backend /bin/bash

# Push schema
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Seed roles
npm run seed:roles
```

### Create Superadmin
```bash
# Via Swagger UI: https://your-domain.com/api/docs
# OR via script:
docker exec -it bestdeal_backend node create-admin.js
```

### Backup Database
```bash
docker exec bestdeal_postgres pg_dump -U bestdeal_user bestdeal_shipping > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Database
```bash
cat backup_file.sql | docker exec -i bestdeal_postgres psql -U bestdeal_user -d bestdeal_shipping
```

## 🔍 Troubleshooting Commands

```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# View all logs
docker-compose -f docker-compose.prod.yml logs

# View specific service logs
docker-compose -f docker-compose.prod.yml logs backend

# Access container shell
docker exec -it bestdeal_backend /bin/bash

# Check environment variables
docker exec bestdeal_backend env | grep DATABASE_URL

# Rebuild from scratch
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

## 🔐 Generate Secrets

```bash
# Generate JWT secrets (64-byte hex)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 📋 Deployment Checklist

- [ ] Docker and Docker Compose installed
- [ ] Code uploaded to server
- [ ] Environment files created (backend, frontend, root)
- [ ] Secrets generated and configured
- [ ] Docker images built successfully
- [ ] Containers started and running
- [ ] Database schema pushed
- [ ] Roles seeded
- [ ] Superadmin created
- [ ] API health check passes
- [ ] Frontend accessible
- [ ] SSL configured (if using HTTPS)
- [ ] Backups configured

## 📚 Full Documentation

See `PRODUCTION_DEPLOYMENT_GUIDE.md` for detailed documentation.

