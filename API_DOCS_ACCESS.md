# 📚 API Documentation Access Guide

## 🎯 How to Access API Docs

Your API documentation (Swagger UI) is available at **multiple URLs** for convenience:

### Local Development

```
http://localhost:5000/api/docs       ✅ Primary
http://localhost:5000/api-docs       ✅ Alternative (redirects)
http://localhost:5000/docs           ✅ Alternative (redirects)
```

### Production (After Deployment)

```
https://your-backend.vercel.app/api/docs       ✅ Primary
https://your-backend.vercel.app/api-docs       ✅ Alternative
https://your-backend.vercel.app/docs           ✅ Alternative
```

---

## 🚀 Quick Test

### 1. Check if Backend is Running

Visit root URL:
```
http://localhost:5000/
```

You should see:
```json
{
  "success": true,
  "message": "Welcome to ShipEASE API",
  "version": "1.0.0",
  "documentation": "/api/docs",
  "endpoints": {
    "docs": "/api/docs",
    "apiDocs": "/api-docs (redirects to /api/docs)",
    "docs2": "/docs (redirects to /api/docs)",
    "swaggerJson": "/api/docs.json",
    "health": "/health"
  },
  "links": {
    "documentation": "http://localhost:5000/api/docs",
    "health": "http://localhost:5000/health"
  }
}
```

### 2. Access API Documentation

Click on the `documentation` link or visit:
```
http://localhost:5000/api/docs
```

---

## 🔍 What You Should See

When you visit `/api/docs`, you should see:

- **Swagger UI Interface** - Interactive API documentation
- **Available Endpoints** - All API routes organized by category
- **Try it Out** - Test endpoints directly from the browser
- **Schemas** - Data models and structures
- **Authentication** - JWT bearer token input

### Categories:
- 🔐 Authentication - Login, Register, Refresh Token
- 👥 Customers - Customer management
- 📦 Jobs - Job/Shipment management
- 🔍 Tracking - Public tracking

---

## 🛠️ Local Development

### Start Backend

```bash
cd backend
npm run dev
```

You should see:
```
🚀 =========================================
✅ Server running on port 5000
📍 Environment: development
🌐 API URL: http://localhost:5000
💚 Health Check: http://localhost:5000/health
📚 API Docs: http://localhost:5000/api/docs
📖 Also available at:
   - http://localhost:5000/api-docs
   - http://localhost:5000/docs
=========================================
```

### Access Docs

Open browser and go to: `http://localhost:5000/api/docs`

---

## 🌐 Production (Vercel)

### After Deployment

Your API docs will be at:
```
https://shipease-backend.vercel.app/api/docs
```

### Test Production Docs

1. Visit your backend URL (get it from Vercel dashboard)
2. Add `/api/docs` to the end
3. Swagger UI should load

Example:
```
https://shipease-backend-xyz123.vercel.app/api/docs
```

---

## 🐛 Troubleshooting

### Issue: "Cannot GET /api/docs"

**Solution 1:** Try alternative URLs
- `/api-docs`
- `/docs`

**Solution 2:** Check if server is running
```bash
curl http://localhost:5000/health
```

**Solution 3:** Restart server
```bash
# Stop server (Ctrl+C)
# Start again
npm run dev
```

### Issue: Blank Page or CSS Not Loading

**Problem:** Helmet (security middleware) blocking Swagger UI assets

**Solution:** Already fixed! The app.js now has proper Helmet configuration:
```javascript
helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
})
```

### Issue: 404 Not Found

**Check:**
1. Backend server is running
2. You're using the correct URL
3. Port is correct (default: 5000)

### Issue: Swagger UI loads but no endpoints shown

**Solution:** Check that route files have JSDoc comments

Example from routes:
```javascript
/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: Get all customers
 *     tags: [Customers]
 *     ...
 */
```

---

## 📖 Alternative Access: Swagger JSON

You can also access the raw Swagger specification:

```
http://localhost:5000/api/docs.json
http://localhost:5000/swagger.json
```

This is useful for:
- Importing into Postman
- Generating client SDKs
- Documentation tools

---

## 🔐 Using Authentication in Swagger

1. Click the **"Authorize"** button (lock icon)
2. Enter your JWT token: `Bearer YOUR_TOKEN_HERE`
3. Click **"Authorize"**
4. Now you can test protected endpoints

### Get JWT Token:

**Method 1:** Use the `/api/auth/login` endpoint in Swagger
1. Expand "Authentication" section
2. Try `/api/auth/login`
3. Enter credentials
4. Copy the token from response
5. Click "Authorize" and paste token

**Method 2:** Use curl
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

---

## 💡 Pro Tips

### 1. Persistent Authorization
Your JWT token will persist in Swagger UI during your session (won't need to re-enter)

### 2. Export/Import Requests
You can export requests from Swagger to:
- Postman
- Insomnia
- cURL commands

### 3. Schema Models
Click on "Schemas" at the bottom to see all data models

### 4. Server Selection
Use the server dropdown to switch between:
- Local development
- Production (Vercel)
- Custom domain

---

## 📋 Quick Reference

| URL | Purpose | Status |
|-----|---------|--------|
| `/` | Root/Welcome | Public |
| `/health` | Health check | Public |
| `/api/docs` | Swagger UI | Public |
| `/api-docs` | Redirects to /api/docs | Public |
| `/docs` | Redirects to /api/docs | Public |
| `/api/docs.json` | Swagger JSON | Public |
| `/swagger.json` | Swagger JSON | Public |
| `/api/auth/*` | Authentication | Public |
| `/api/customers/*` | Customers | Protected |
| `/api/jobs/*` | Jobs | Protected |
| `/api/tracking/:id` | Public tracking | Public |

---

## ✅ Checklist

- [ ] Backend server is running
- [ ] Visit `http://localhost:5000/` to verify
- [ ] Click documentation link or visit `/api/docs`
- [ ] Swagger UI loads successfully
- [ ] See all API endpoints
- [ ] Try the `/health` endpoint
- [ ] Test login endpoint
- [ ] Authorize with JWT token
- [ ] Test protected endpoints

---

## 🚀 Next Steps

1. **Explore the API** - Try out different endpoints
2. **Test Authentication** - Login and use JWT token
3. **Create Data** - Add customers, jobs, etc.
4. **Check Documentation** - Review request/response schemas
5. **Deploy** - API docs work the same on production!

---

## 📞 Still Having Issues?

1. **Check server logs** - Look for errors in terminal
2. **Verify port** - Make sure nothing else is using port 5000
3. **Clear browser cache** - Sometimes helps with CSS issues
4. **Try different browser** - Rule out browser-specific issues
5. **Check Vercel logs** - If on production: `vercel logs`

---

**Your API documentation is now accessible at multiple URLs! 📚✨**

**Recommended URL:** `http://localhost:5000/api/docs`






