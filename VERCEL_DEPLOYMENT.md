# Vercel Deployment Guide for ShipEASE

This guide will help you deploy both the frontend and backend of ShipEASE to Vercel.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. Vercel CLI installed: `npm i -g vercel`
3. Git repository (GitHub, GitLab, or Bitbucket)
4. Neon PostgreSQL database (already configured)

## Deployment Steps

### Step 1: Deploy Backend

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy backend:**
   ```bash
   vercel
   ```
   - Follow the prompts
   - Project name: `shipease-backend` (or your preferred name)
   - Directory: `./backend` (if deploying from root) or `.` (if in backend folder)
   - Override settings: No (use defaults)

4. **Set Environment Variables in Vercel Dashboard:**
   Go to your project settings → Environment Variables and add:

   ```
   DATABASE_URL=postgresql://neondb_owner:npg_juKk7e9CLpin@ep-nameless-morning-adl2fpws-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
   NODE_ENV=production
   VERCEL=1
   JWT_SECRET=your-production-jwt-secret-key-2024
   JWT_REFRESH_SECRET=your-production-refresh-secret-2024
   JWT_EXPIRES_IN=24h
   JWT_REFRESH_EXPIRES_IN=7d
   CORS_ORIGINS=https://your-frontend-domain.vercel.app,https://www.your-frontend-domain.vercel.app
   PRODUCTION_URL=https://your-backend-domain.vercel.app
   MAX_FILE_SIZE=5242880
   UPLOAD_DIR=./uploads
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   DEFAULT_PAGE_SIZE=20
   MAX_PAGE_SIZE=100
   ```

5. **Redeploy after adding environment variables:**
   ```bash
   vercel --prod
   ```

6. **Note your backend URL:**
   After deployment, Vercel will provide a URL like: `https://shipease-backend.vercel.app`
   Save this URL for the frontend configuration.

### Step 2: Deploy Frontend

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Deploy frontend:**
   ```bash
   vercel
   ```
   - Follow the prompts
   - Project name: `shipease-frontend` (or your preferred name)
   - Directory: `./frontend` (if deploying from root) or `.` (if in frontend folder)
   - Override settings: No (use defaults)

3. **Set Environment Variables in Vercel Dashboard:**
   Go to your project settings → Environment Variables and add:

   ```
   REACT_APP_NAME=ShipEASE App
   REACT_APP_API_URL=https://your-backend-domain.vercel.app
   REACT_APP_API_BASE_PATH=/api
   REACT_APP_SUPPORT_EMAIL=support@shipease.com
   REACT_APP_SUPPORT_PHONE=+44 20 1234 5678
   REACT_APP_USER_STORAGE_KEY=shipease_user
   REACT_APP_TOKEN_STORAGE_KEY=shipease_token
   REACT_APP_ENABLE_TRACKING=true
   REACT_APP_ENABLE_NOTIFICATIONS=false
   ```

   **Important:** Replace `https://your-backend-domain.vercel.app` with your actual backend URL from Step 1.

4. **Redeploy after adding environment variables:**
   ```bash
   vercel --prod
   ```

5. **Update Backend CORS:**
   Go back to your backend project on Vercel and update the `CORS_ORIGINS` environment variable to include your frontend URL:
   ```
   CORS_ORIGINS=https://your-frontend-domain.vercel.app,https://www.your-frontend-domain.vercel.app
   ```
   Then redeploy the backend.

## Alternative: Deploy via GitHub Integration

### Option 1: Connect GitHub Repository

1. **Push your code to GitHub** (if not already done)

2. **Import Project in Vercel:**
   - Go to https://vercel.com/dashboard
   - Click "Add New Project"
   - Import your GitHub repository
   - Configure each project (backend and frontend) separately

3. **For Backend:**
   - Root Directory: `backend`
   - Framework Preset: Other
   - Build Command: `npm run vercel-build`
   - Output Directory: (leave empty)
   - Install Command: `npm install`

4. **For Frontend:**
   - Root Directory: `frontend`
   - Framework Preset: Create React App
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`

5. **Add Environment Variables** (same as above for each project)

6. **Deploy**

## Post-Deployment

### 1. Test Your Backend

Visit your backend URL:
- Health Check: `https://your-backend.vercel.app/health`
- API Docs: `https://your-backend.vercel.app/api/docs`

### 2. Test Your Frontend

Visit your frontend URL and try logging in with:
- Email: `admin@shipease.com`
- Password: `111111@1A`

### 3. Update CORS Settings

Make sure your backend `CORS_ORIGINS` includes your frontend domain.

## Troubleshooting

### Backend Issues

1. **Prisma Client not found:**
   - The `vercel-build` script should handle this
   - Check build logs in Vercel dashboard

2. **Database connection errors:**
   - Verify `DATABASE_URL` is set correctly
   - Check that your Neon database allows connections from Vercel IPs

3. **Function timeout:**
   - Vercel has a 10-second timeout for Hobby plan
   - Consider upgrading to Pro for longer timeouts
   - Optimize your database queries

### Frontend Issues

1. **API calls failing:**
   - Check `REACT_APP_API_URL` is set correctly
   - Verify CORS is configured on backend
   - Check browser console for errors

2. **Build fails:**
   - Check build logs in Vercel dashboard
   - Ensure all dependencies are in `package.json`
   - Verify Node.js version compatibility

## Environment Variables Summary

### Backend Required Variables:
- `DATABASE_URL` - Your Neon PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_REFRESH_SECRET` - Secret key for refresh tokens
- `CORS_ORIGINS` - Comma-separated list of allowed frontend URLs
- `NODE_ENV=production`
- `VERCEL=1`

### Frontend Required Variables:
- `REACT_APP_API_URL` - Your backend Vercel URL
- `REACT_APP_NAME` - App name (ShipEASE App)

## Custom Domains

After deployment, you can add custom domains in Vercel:

1. Go to your project settings
2. Navigate to "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## Continuous Deployment

Once connected to GitHub, Vercel will automatically deploy:
- Every push to `main` branch → Production
- Every push to other branches → Preview deployment

## Support

For issues:
1. Check Vercel deployment logs
2. Check application logs in Vercel dashboard
3. Verify all environment variables are set
4. Test API endpoints directly

