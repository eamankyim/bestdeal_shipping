# Vercel Deployment Guide - ShipEASE

Complete guide for deploying both backend and frontend to Vercel.

## 🎯 Overview

Your ShipEASE project consists of:
- **Backend API** (Express.js + Prisma + PostgreSQL)
- **Frontend** (React + Ant Design)

Both will be deployed separately on Vercel.

## 📋 Prerequisites

- ✅ Vercel account (you're already logged in)
- ✅ GitHub/GitLab repository (optional but recommended)
- ✅ Prisma Postgres database (you already have this)

## 🚀 Backend Deployment

### Step 1: Deploy Backend

```bash
cd backend
vercel --prod
```

### Step 2: Answer Vercel Prompts

```
? Set up and deploy? YES
? Which scope? Eric Amankyim's projects
? Link to existing project? NO
? Project name? shipease-backend
? In which directory is your code located? ./
? Want to modify settings? YES
? Which settings? Build Command, Development Command, Output Directory
? Build Command? npm run build
? Development Command? npm run dev
? Output Directory? (Leave EMPTY - just press Enter)
```

### Step 3: Set Environment Variables

After deployment, go to your Vercel dashboard:

1. Go to **Project Settings** → **Environment Variables**
2. Add these variables:

```env
# Database
DATABASE_URL=postgres://d371d2bbb7537997a4b319e0670ad24f5f0105a369e4bb4f45dbb9ae8619d043:sk_ypbFkDU4YlB3XlZzQE-wa@db.prisma.io:5432/postgres?sslmode=require

POSTGRES_URL=postgres://d371d2bbb7537997a4b319e0670ad24f5f0105a369e4bb4f45dbb9ae8619d043:sk_ypbFkDU4YlB3XlZzQE-wa@db.prisma.io:5432/postgres?sslmode=require

PRISMA_DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza195cGJGa0RVNFlsQjNYbFp6UUUtd2EiLCJhcGlfa2V5IjoiMDFLNzdKQTUyQ0JCMEpIUFM3OE5KMDYzUlMiLCJ0ZW5hbnRfaWQiOiJkMzcxZDJiYmI3NTM3OTk3YTRiMzE5ZTA2NzBhZDI0ZjVmMDEwNWEzNjllNGJiNGY0NWRiYjlhZTg2MTlkMDQzIiwiaW50ZXJuYWxfc2VjcmV0IjoiOTEzODM4ZTUtOGJhOC00OGY2LTkwOGItM2VlNjY5ZGM5OGE4In0.qbaS9sZcjkO8WOCFdsUchqU3ESkiQ0IwLEV4Pk-02no

# Server
NODE_ENV=production
PORT=5000

# JWT (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_REFRESH_EXPIRES_IN=7d

# CORS (Add your frontend URL after deploying)
FRONTEND_URL=https://your-frontend.vercel.app

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Pagination
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
```

### Step 4: Redeploy Backend

```bash
vercel --prod
```

Your backend will be live at: `https://shipease-backend.vercel.app`

---

## 🎨 Frontend Deployment

### Step 1: Update Frontend Environment

Edit `frontend/.env.production`:

```env
# Replace with your actual backend URL after backend deployment
REACT_APP_API_URL=https://shipease-backend.vercel.app
REACT_APP_API_BASE_PATH=/api/v1

# Keep other settings
REACT_APP_NAME=ShipEASE
REACT_APP_LOGO_PATH=/AppLogo.png
REACT_APP_SUPPORT_EMAIL=support@shipease.com
REACT_APP_SUPPORT_PHONE=+44 20 1234 5678
REACT_APP_USER_STORAGE_KEY=shipease_user
REACT_APP_TOKEN_STORAGE_KEY=shipease_token
REACT_APP_ENABLE_TRACKING=true
REACT_APP_ENABLE_NOTIFICATIONS=true
```

### Step 2: Deploy Frontend

```bash
cd frontend
vercel --prod
```

### Step 3: Answer Vercel Prompts

```
? Set up and deploy? YES
? Which scope? Eric Amankyim's projects
? Link to existing project? NO
? Project name? shipease-frontend
? In which directory is your code located? ./
? Want to modify settings? NO (Vercel auto-detects Create React App)
```

### Step 4: Set Frontend Environment Variables

Go to Vercel Dashboard → Frontend Project → Settings → Environment Variables:

```env
REACT_APP_API_URL=https://shipease-backend.vercel.app
REACT_APP_API_BASE_PATH=/api/v1
REACT_APP_NAME=ShipEASE
REACT_APP_LOGO_PATH=/AppLogo.png
REACT_APP_SUPPORT_EMAIL=support@shipease.com
REACT_APP_SUPPORT_PHONE=+44 20 1234 5678
REACT_APP_USER_STORAGE_KEY=shipease_user
REACT_APP_TOKEN_STORAGE_KEY=shipease_token
REACT_APP_ENABLE_TRACKING=true
REACT_APP_ENABLE_NOTIFICATIONS=true
```

### Step 5: Update Backend CORS

Go back to **Backend** → **Environment Variables** and update:

```env
FRONTEND_URL=https://shipease-frontend.vercel.app
```

Then redeploy backend:

```bash
cd backend
vercel --prod
```

Your frontend will be live at: `https://shipease-frontend.vercel.app`

---

## 🔄 Automatic Deployments (Recommended)

### Connect to Git Repository

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Add Vercel deployment configuration"
   git push origin main
   ```

2. In Vercel Dashboard:
   - Go to each project
   - Click **Settings** → **Git**
   - Connect your GitHub repository
   - Enable **Automatic Deployments**

Now every push to `main` will auto-deploy! 🎉

---

## 📝 Deployment Checklist

### Backend
- [✅] `vercel.json` configured
- [✅] Build script added to `package.json`
- [✅] Environment variables set
- [✅] Database connected
- [✅] Prisma schema pushed
- [✅] CORS configured with frontend URL

### Frontend
- [✅] `vercel.json` configured
- [✅] Environment variables set
- [✅] API URL points to backend
- [✅] Build successfully completes

---

## 🔍 Testing Your Deployment

### Test Backend API

```bash
# Health check
curl https://shipease-backend.vercel.app/health

# API documentation
# Visit: https://shipease-backend.vercel.app/api-docs
```

### Test Frontend

1. Visit: `https://shipease-frontend.vercel.app`
2. Try public tracking page
3. Test login functionality
4. Check dashboard access

---

## 🐛 Troubleshooting

### Backend Issues

**Error: Database connection failed**
- Check DATABASE_URL is set correctly in Vercel
- Verify Prisma Postgres connection string
- Check if database exists and is accessible

**Error: Prisma Client not generated**
- Ensure `build` script runs `prisma generate`
- Check build logs in Vercel

**Error: CORS issues**
- Verify FRONTEND_URL matches your frontend domain
- Check backend CORS configuration

### Frontend Issues

**Error: API calls failing**
- Verify REACT_APP_API_URL is correct
- Check backend is deployed and running
- Check CORS settings in backend

**Error: Environment variables not loading**
- Variables must start with `REACT_APP_`
- Redeploy after adding variables
- Clear browser cache

**Error: Build fails**
- Check build logs in Vercel
- Test build locally: `npm run build`
- Check for missing dependencies

---

## 🔐 Security Best Practices

### ⚠️ IMPORTANT: Change These in Production

1. **JWT Secrets** - Generate strong random secrets:
   ```bash
   # Generate new secrets
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **Database Credentials** - Use production database
3. **CORS Settings** - Only allow your frontend domain
4. **Rate Limiting** - Adjust based on needs

---

## 📊 Monitoring

### Vercel Dashboard

- **Deployments**: View deployment history
- **Analytics**: Monitor traffic and performance
- **Logs**: Real-time function logs
- **Domains**: Add custom domains

### Enable Monitoring

1. Go to Vercel Dashboard
2. Enable **Analytics** (free tier available)
3. Set up **Alerts** for errors
4. Monitor **Function Logs**

---

## 🚀 Post-Deployment

### Update Local Environment

Update `frontend/.env` for local development:

```env
# Point to production backend (or keep localhost)
REACT_APP_API_URL=https://shipease-backend.vercel.app
# OR keep local
REACT_APP_API_URL=http://localhost:5000
```

### Custom Domains (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records
4. SSL is automatic!

### Database Seeding (Optional)

If you want to seed your production database:

```bash
# Connect to production database
cd backend

# Run seed script
npm run prisma:seed
```

---

## 📞 Quick Reference

### Deployment Commands

```bash
# Deploy backend
cd backend && vercel --prod

# Deploy frontend
cd frontend && vercel --prod

# View logs
vercel logs [deployment-url]

# List deployments
vercel ls

# Remove deployment
vercel rm [deployment-name]
```

### Important URLs

After deployment, update these:

- **Backend API**: `https://shipease-backend.vercel.app`
- **API Docs**: `https://shipease-backend.vercel.app/api-docs`
- **Frontend**: `https://shipease-frontend.vercel.app`
- **Database**: `db.prisma.io`

---

## ✅ Success Indicators

You'll know everything is working when:

- ✅ Backend health endpoint returns 200
- ✅ API documentation loads
- ✅ Frontend loads without errors
- ✅ Login page appears
- ✅ API calls succeed (check browser console)
- ✅ No CORS errors

---

## 🎉 Congratulations!

Your ShipEASE application is now live on Vercel!

- Backend: Processing requests at scale
- Frontend: Serving users globally
- Database: Managed and secure
- Auto-deployments: Every push goes live

**Next Steps:**
1. Add custom domain (optional)
2. Set up monitoring and alerts
3. Configure CI/CD with GitHub
4. Add more features!

---

**Last Updated:** October 10, 2025  
**Status:** ✅ Ready for Production






