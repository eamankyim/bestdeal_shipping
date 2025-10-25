# CORS Configuration Guide

## 🌐 What is CORS?

**CORS (Cross-Origin Resource Sharing)** is a security feature that controls which domains can access your API. Your backend is configured with flexible CORS settings that work in both development and production.

---

## ✅ Current Configuration

Your backend CORS is **already configured** and includes:

### 🔧 Features:
- ✅ **Environment-based origins** - Set via `.env` file
- ✅ **Multiple origins support** - Comma-separated list
- ✅ **Credentials support** - Cookies and authentication headers
- ✅ **Vercel auto-detection** - Automatically allows `.vercel.app` domains
- ✅ **Development friendly** - Logs rejected origins in dev mode
- ✅ **Postman/cURL friendly** - Allows requests with no origin

### 📝 Allowed Methods:
- `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`

### 🔑 Allowed Headers:
- `Content-Type`
- `Authorization`

---

## 🛠️ Configuration Files

### 1. Environment Variables (`.env`)

```env
# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://localhost:4001
```

### 2. CORS Middleware (`src/app.js`)

```javascript
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (Postman, mobile apps)
    if (!origin) return callback(null, true);
    
    // Check allowed origins list
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    // Auto-allow Vercel deployments
    if (isVercelPreview(origin)) {
      return callback(null, true);
    }
    
    // Reject other origins
    callback(new Error(`CORS policy: Origin ${origin} is not allowed`));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
```

---

## 🚀 Adding New Origins

### For Development:

Add to your `backend/.env` file:
```env
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:5173,http://localhost:8080
```

### For Production:

Add your production domains:
```env
CORS_ORIGINS=http://localhost:3000,https://bestdeal.com,https://www.bestdeal.com,https://app.bestdeal.com
```

### Important Notes:
- ⚠️ **No trailing slashes** - Use `http://localhost:3000` not `http://localhost:3000/`
- ⚠️ **Include protocol** - Must start with `http://` or `https://`
- ⚠️ **Comma-separated** - No spaces after commas
- ⚠️ **Restart server** - Changes require server restart

---

## 🧪 Testing CORS

### Test 1: Check Allowed Origin (Should Succeed)

```bash
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     http://localhost:4001/api/health
```

**Expected Response:**
```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Credentials: true
```

### Test 2: Check Blocked Origin (Should Fail)

```bash
curl -H "Origin: http://evil-site.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     http://localhost:4001/api/health
```

**Expected Response:**
```
Error: CORS policy: Origin http://evil-site.com is not allowed
```

### Test 3: No Origin (Should Succeed)

```bash
curl http://localhost:4001/api/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "API is running"
}
```

---

## 🌍 Common Scenarios

### Scenario 1: Local Development
```env
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000
```

### Scenario 2: Local + Production
```env
CORS_ORIGINS=http://localhost:3000,https://yourapp.com,https://www.yourapp.com
```

### Scenario 3: Multiple Environments
```env
CORS_ORIGINS=http://localhost:3000,https://staging.yourapp.com,https://yourapp.com
```

### Scenario 4: Vercel Deployment
No need to add `.vercel.app` domains - they're auto-detected!

### Scenario 5: Custom Port (Like your React on 3000, API on 4001)
```env
CORS_ORIGINS=http://localhost:3000,http://localhost:4001
```

---

## 🔒 Security Best Practices

### ✅ DO:
- ✅ Keep the origins list specific
- ✅ Use HTTPS in production
- ✅ Test CORS before deploying
- ✅ Keep development and production origins separate
- ✅ Use environment variables (never hardcode)

### ❌ DON'T:
- ❌ Don't use `*` (allow all origins) in production
- ❌ Don't add untrusted domains
- ❌ Don't include trailing slashes
- ❌ Don't forget to restart after changes
- ❌ Don't expose sensitive endpoints without authentication

---

## 🐛 Troubleshooting

### Issue 1: "CORS policy: Origin is not allowed"

**Solution:**
1. Check if origin is in `CORS_ORIGINS` in `.env`
2. Verify no trailing slash: `http://localhost:3000` ✅ not `http://localhost:3000/` ❌
3. Ensure protocol matches: `http://` vs `https://`
4. Restart your backend server

### Issue 2: Can't access from React app

**Solution:**
1. Check your React app's URL (e.g., `http://localhost:3000`)
2. Add it to `CORS_ORIGINS` in `backend/.env`
3. Restart backend: `npm run dev`

### Issue 3: Works in Postman but not in browser

**Reason:** Postman doesn't send an `Origin` header, so CORS allows it.

**Solution:** Add your browser's origin to `CORS_ORIGINS`

### Issue 4: Production deployment fails

**Solution:**
1. Add production domain to `CORS_ORIGINS`:
   ```env
   CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   ```
2. Deploy or restart production server
3. Ensure using HTTPS in production

---

## 📊 Current Configuration Summary

| Setting | Value |
|---------|-------|
| **Allowed Origins** | From `CORS_ORIGINS` env variable |
| **Credentials** | ✅ Enabled |
| **Methods** | GET, POST, PUT, PATCH, DELETE, OPTIONS |
| **Headers** | Content-Type, Authorization |
| **Vercel Support** | ✅ Auto-detected |
| **No-Origin Requests** | ✅ Allowed (for Postman, etc.) |

---

## 🔄 Deployment Checklist

When deploying to production:

- [ ] Add production frontend URL to `CORS_ORIGINS`
- [ ] Use HTTPS for production origins
- [ ] Remove or comment out localhost origins if not needed
- [ ] Test CORS in production environment
- [ ] Verify API requests work from your frontend
- [ ] Check browser console for CORS errors

---

## 📚 Example Configurations

### Development Only:
```env
CORS_ORIGINS=http://localhost:3000
```

### Development + Staging:
```env
CORS_ORIGINS=http://localhost:3000,https://staging-app.vercel.app
```

### Full Stack (Dev + Staging + Prod):
```env
CORS_ORIGINS=http://localhost:3000,https://staging-app.com,https://app.com,https://www.app.com
```

---

## 🎯 Quick Reference

To add a new origin:
1. Open `backend/.env`
2. Add to `CORS_ORIGINS`: `,http://neworigin.com`
3. Restart backend: `npm run dev`
4. Test: Open browser console and check for CORS errors

---

## 📞 Need Help?

If CORS is still not working:
1. Check browser console for exact error message
2. Verify backend logs for rejected origins
3. Use browser DevTools Network tab to see CORS headers
4. Test with `curl` to isolate the issue

---

**Your CORS is properly configured! 🎉**

Current allowed origins:
- `http://localhost:3000` (React default)
- `http://localhost:3001` (Alternative port)
- `http://127.0.0.1:3000` (IP-based)
- `http://localhost:4001` (API port for Swagger UI)
- All `.vercel.app` domains (auto-detected)

