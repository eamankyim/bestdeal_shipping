# ✅ Swagger API Documentation - Deployment Complete

## 🎉 Your API Docs Are Live!

Your Swagger documentation is now **automatically configured** and deployed!

## 🌐 Access Your API Documentation

### Production (Vercel)
```
https://your-backend-url.vercel.app/api/docs
```

**Alternative URLs:**
```
https://your-backend-url.vercel.app/api-docs
https://your-backend-url.vercel.app/docs
```

### Local Development
```
http://localhost:5000/api/docs
```

## ✨ What's Special About This Setup

### 🔄 Dynamic Server Detection
The Swagger docs automatically detect and show the correct server URLs:

- **On Vercel**: Uses `VERCEL_URL` (provided automatically by Vercel)
- **Locally**: Uses `http://localhost:5000`
- **Custom Domain**: Set `PRODUCTION_URL` environment variable

### 📋 Available Servers in Swagger UI

When you open the docs, you'll see a dropdown with:
1. ✅ **Current Deployment** (your Vercel URL)
2. ✅ **Development Server** (localhost)
3. ✅ **Custom Domain** (if you set PRODUCTION_URL)

## 🧪 Test Your API Docs

### 1. Visit Your Docs
```bash
# Replace with your actual URL
curl https://your-backend.vercel.app/health
```

### 2. Open Swagger UI
Visit in browser:
```
https://your-backend.vercel.app/api/docs
```

### 3. Try an Endpoint
1. Click on **GET /health**
2. Click **"Try it out"**
3. Click **"Execute"**
4. See the response!

## 🔐 Testing Protected Endpoints

### Step 1: Get JWT Token
1. Expand **Authentication** section
2. Find **POST /api/auth/login**
3. Click **"Try it out"**
4. Enter credentials (once you have users)
5. Click **"Execute"**
6. Copy the `token` from response

### Step 2: Authorize
1. Click the **"Authorize"** button (🔒 lock icon at top)
2. Enter: `Bearer YOUR_TOKEN_HERE`
3. Click **"Authorize"**
4. Now you can test protected endpoints!

## 📚 What's Included

### Available Endpoints
- 🔐 **Authentication** - Login, Register, Refresh Token
- 👥 **Customers** - Customer CRUD operations
- 📦 **Jobs** - Job/Shipment management
- 🔍 **Tracking** - Public tracking (no auth required)

### Features
- ✅ Interactive testing ("Try it out" buttons)
- ✅ Request/Response examples
- ✅ Authentication support
- ✅ Schema definitions
- ✅ Error responses
- ✅ Validation requirements

## 🔧 Configuration

### Environment Variables

**Local (.env):**
```env
API_URL=http://localhost:5000
```

**Production (Vercel automatically provides):**
```env
VERCEL_URL=your-deployment.vercel.app
```

**Custom Domain (optional):**
```env
PRODUCTION_URL=https://api.yourdomain.com
```

### Add Custom Domain

If you have a custom domain:

1. Go to Vercel Dashboard
2. Add custom domain
3. Set environment variable:
   ```env
   PRODUCTION_URL=https://api.yourdomain.com
   ```
4. Redeploy

## 📖 Swagger JSON

Access raw OpenAPI specification:
```
https://your-backend.vercel.app/api/docs.json
https://your-backend.vercel.app/swagger.json
```

Use this to:
- Import into Postman
- Generate client SDKs
- Share with frontend developers

## 💡 Pro Tips

### 1. Share With Your Team
```
Send them: https://your-backend.vercel.app/api/docs
Everyone can see and test the API!
```

### 2. Import to Postman
```
File → Import → Link
Paste: https://your-backend.vercel.app/swagger.json
```

### 3. Server Switching
Use the server dropdown to switch between:
- Production (test live data)
- Development (test locally)

### 4. Persistent Auth
Once you authorize with a JWT token, it persists during your session.

### 5. Export Requests
Each endpoint has a "Copy as cURL" option.

## 🎯 Quick Links

| Resource | URL |
|----------|-----|
| API Docs | `/api/docs` |
| Alt Docs | `/api-docs` or `/docs` |
| Swagger JSON | `/api/docs.json` |
| Health Check | `/health` |
| Root API | `/` |

## ✅ Verification Checklist

- [ ] Backend deployed to Vercel
- [ ] Health endpoint works
- [ ] API docs load at `/api/docs`
- [ ] See production URL in server dropdown
- [ ] Can "Try it out" on endpoints
- [ ] Authentication endpoints visible
- [ ] Can authorize with JWT token
- [ ] Protected endpoints show lock icon

## 🔄 Updating Documentation

The Swagger docs update automatically when you:
1. Add new routes
2. Update JSDoc comments
3. Redeploy to Vercel

No manual configuration needed!

## 📱 Mobile Friendly

The Swagger UI is responsive and works on:
- ✅ Desktop browsers
- ✅ Tablets
- ✅ Mobile phones

## 🐛 Troubleshooting

### Docs Not Loading?
```bash
# Check if backend is running
curl https://your-backend.vercel.app/health

# If health works but docs don't, check Helmet config
# (Already configured correctly in src/app.js)
```

### Server Dropdown Empty?
- Check environment variables are set
- Redeploy after setting PRODUCTION_URL

### "Not allowed by CORS"?
- Add your domain to CORS_ORIGINS in Vercel env vars
- Redeploy backend

### Can't Authorize?
- Make sure you have user accounts
- Use valid JWT token from login endpoint

## 🎉 You're All Set!

Your API documentation is:
- ✅ Live and accessible
- ✅ Automatically configured
- ✅ Interactive and testable
- ✅ Shareable with your team

## 🚀 Next Steps

1. **Visit your docs**: `https://your-backend.vercel.app/api/docs`
2. **Test endpoints**: Try the health check
3. **Share with team**: Send them the docs URL
4. **Create users**: Set up authentication
5. **Test protected endpoints**: Login and authorize

---

**Documentation Status:** ✅ Live and Ready  
**Last Updated:** October 10, 2025  
**Version:** 1.0.0

Need the exact URL? Check your Vercel deployment logs or dashboard! 🚀






