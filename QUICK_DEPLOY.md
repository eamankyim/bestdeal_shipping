# Quick Vercel Deployment Guide

## Quick Start (5 minutes)

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy Backend
```bash
cd backend
vercel
# Follow prompts, then:
vercel --prod
```

### 4. Deploy Frontend
```bash
cd ../frontend
vercel
# Follow prompts, then:
vercel --prod
```

### 5. Set Environment Variables

**Backend (in Vercel Dashboard):**
```
DATABASE_URL=postgresql://neondb_owner:npg_juKk7e9CLpin@ep-nameless-morning-adl2fpws-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here
CORS_ORIGINS=https://your-frontend-url.vercel.app
NODE_ENV=production
VERCEL=1
```

**Frontend (in Vercel Dashboard):**
```
REACT_APP_API_URL=https://your-backend-url.vercel.app
REACT_APP_NAME=ShipEASE App
```

### 6. Redeploy Both Projects
After setting environment variables, redeploy:
```bash
# Backend
cd backend && vercel --prod

# Frontend  
cd frontend && vercel --prod
```

## Important URLs

After deployment, you'll get:
- **Backend URL:** `https://shipease-backend.vercel.app`
- **Frontend URL:** `https://shipease-frontend.vercel.app`

## Test Your Deployment

1. **Backend Health Check:**
   ```
   https://your-backend-url.vercel.app/health
   ```

2. **Backend API Docs:**
   ```
   https://your-backend-url.vercel.app/api/docs
   ```

3. **Frontend:**
   ```
   https://your-frontend-url.vercel.app
   ```

4. **Login Credentials:**
   - Email: `admin@shipease.com`
   - Password: `111111@1A`

## Troubleshooting

- **CORS errors?** Update `CORS_ORIGINS` in backend with your frontend URL
- **API not working?** Check `REACT_APP_API_URL` in frontend matches backend URL
- **Build fails?** Check Vercel deployment logs for errors

For detailed instructions, see `VERCEL_DEPLOYMENT.md`

