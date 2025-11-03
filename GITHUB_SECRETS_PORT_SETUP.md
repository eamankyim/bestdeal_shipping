# GitHub Secrets Configuration for Ports

## Secrets to Add in GitHub

Go to your GitHub repository:
**Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### Required Secrets for Best Deal Project

Add these secrets:

1. **`BACKEND_PORT`**
   - Value: `4001`
   - Description: Backend API port for Best Deal

2. **`FRONTEND_PORT`**
   - Value: `3000`
   - Description: Frontend server port for Best Deal

### Optional: Sabito Project Secrets (if deploying separately)

3. **`SABITO_BACKEND_PORT`**
   - Value: `5000`
   - Description: Backend API port for Sabito

4. **`SABITO_FRONTEND_PORT`**
   - Value: `3004` (or any available port)
   - Description: Frontend server port for Sabito

---

## Current Secrets (Should Already Exist)

These should already be configured:
- `DB_PASSWORD`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `CORS_ORIGINS`
- `PRODUCTION_URL`
- `FRONTEND_URL`
- `PRODUCTION_HOST`
- `PRODUCTION_USERNAME`
- `PRODUCTION_SSH_KEY`

---

## How to Add Secrets in GitHub

1. Go to your GitHub repository
2. Click **Settings** (top menu)
3. Click **Secrets and variables** → **Actions** (left sidebar)
4. Click **New repository secret**
5. Add each secret:
   - **Name**: `BACKEND_PORT`
   - **Secret**: `4001`
   - Click **Add secret**
6. Repeat for `FRONTEND_PORT` with value `3000`

---

## Workflow Updates

The `.github/workflows/deploy-production.yml` file has been updated to:

1. Read `BACKEND_PORT` and `FRONTEND_PORT` from secrets
2. Set `REACT_APP_API_URL=http://localhost:$BACKEND_PORT` in root `.env`
3. Set `PORT=$FRONTEND_PORT` in root `.env`
4. Set `PORT=$FRONTEND_PORT` in `frontend/.env`
5. Set `REACT_APP_API_URL=http://localhost:$BACKEND_PORT` in `frontend/.env`

---

## Verification

After adding secrets and deploying, verify on the server:

```bash
cd ~/bestdeal_shipping

# Check root .env
cat .env | grep PORT
cat .env | grep API_URL

# Check frontend .env
cat frontend/.env | grep PORT
cat frontend/.env | grep API_URL
```

Expected output:
```
PORT=3000
REACT_APP_API_URL=http://localhost:4001
```

---

## Port Summary

### Best Deal Project
- **Backend Port**: `4001` (set in `BACKEND_PORT` secret)
- **Frontend Port**: `3000` (set in `FRONTEND_PORT` secret)
- **Frontend API URL**: `http://localhost:4001`

### Sabito Project (if deploying)
- **Backend Port**: `5000` (would need separate workflow or different secrets)
- **Frontend Port**: `3004` or another available port

---

## Quick Setup Commands for Server

After deployment, you can verify:

```bash
# Check if ports match secrets
cd ~/bestdeal_shipping

echo "=== Root .env ==="
cat .env | grep -E "PORT|API_URL"

echo ""
echo "=== Frontend .env ==="
cat frontend/.env 2>/dev/null | grep -E "PORT|API_URL"

echo ""
echo "=== Running Ports ==="
sudo ss -tuln | grep -E ":(3000|4001)" | grep LISTEN
```

