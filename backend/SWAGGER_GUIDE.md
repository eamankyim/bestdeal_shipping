# Swagger API Documentation Guide

## 🚀 Quick Access

**Swagger UI:** `http://localhost:5000/api/docs`

This provides an interactive API documentation interface where you can:
- View all endpoints
- See request/response schemas
- Test endpoints directly from the browser
- Authenticate and make authorized requests

---

## 📚 What is Swagger?

Swagger (OpenAPI) is a powerful tool for API documentation that provides:
- **Interactive UI** - Test APIs directly from the browser
- **Auto-generated docs** - Documentation from code annotations
- **Request/Response examples** - Clear examples for all endpoints
- **Authentication support** - Test protected endpoints

---

## 🔗 Available URLs

| URL | Description |
|-----|-------------|
| `http://localhost:5000/api/docs` | Interactive Swagger UI |
| `http://localhost:5000/api/docs.json` | OpenAPI JSON specification |
| `http://localhost:5000/` | API info with documentation links |

---

## 🔐 How to Use Authentication in Swagger

### Step 1: Login to Get Token

1. Go to `http://localhost:5000/api/docs`
2. Find the **Authentication** section
3. Expand `POST /api/auth/login`
4. Click **"Try it out"**
5. Enter credentials:
   ```json
   {
     "email": "admin@shipease.com",
     "password": "admin123"
   }
   ```
6. Click **"Execute"**
7. Copy the `token` from the response

### Step 2: Authorize

1. Click the **"Authorize"** button (🔓) at the top right
2. In the "bearerAuth" field, paste your token
3. Click **"Authorize"**
4. Click **"Close"**

✅ **You're now authenticated!** All subsequent requests will include your token.

### Step 3: Test Protected Endpoints

Now you can test any protected endpoint:
1. Find an endpoint (e.g., `GET /api/customers`)
2. Click **"Try it out"**
3. Fill in parameters (if any)
4. Click **"Execute"**
5. View the response

---

## 📖 Endpoint Categories

### 🔐 Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh-token` - Refresh token
- `POST /api/auth/send-invite` - Send invitation
- `POST /api/auth/accept-invite/:token` - Accept invitation

### 👥 Customers
- `GET /api/customers` - List all customers
- `GET /api/customers/:id` - Get customer details
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer
- `GET /api/customers/:id/jobs` - Get customer jobs

### 📦 Jobs
- `GET /api/jobs` - List all jobs
- `GET /api/jobs/:id` - Get job details
- `POST /api/jobs` - Create job
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job
- `PATCH /api/jobs/:id/status` - Update status
- `POST /api/jobs/:id/assign-driver` - Assign driver
- `GET /api/jobs/:id/timeline` - Get timeline

### 📍 Tracking (Public)
- `GET /api/tracking/:trackingId` - Track shipment (no auth required)

---

## 🎨 Swagger UI Features

### 1. **Try It Out**
Test any endpoint directly:
1. Click **"Try it out"**
2. Fill in parameters
3. Click **"Execute"**
4. View response

### 2. **Request Body Examples**
Pre-filled example data for easy testing:
- Click on the dropdown in request body
- Select "Example Value"
- Modify as needed

### 3. **Response Examples**
See what successful responses look like:
- Expand any endpoint
- Scroll to "Responses"
- View example responses for different status codes

### 4. **Schema Information**
View detailed data structures:
- Click "Schema" tab in request/response sections
- See required fields, data types, formats
- Understand nested objects

### 5. **Download Spec**
Download the OpenAPI specification:
- Visit `http://localhost:5000/api/docs.json`
- Import into Postman or other tools

---

## 📝 Example Workflows

### Workflow 1: Create a Job

1. **Login** (`POST /api/auth/login`)
   ```json
   {
     "email": "admin@shipease.com",
     "password": "admin123"
   }
   ```

2. **Authorize** with the token

3. **Create Customer** (`POST /api/customers`)
   ```json
   {
     "name": "John Doe",
     "email": "john@example.com",
     "customerType": "Individual"
   }
   ```
   Copy the customer `id` from response

4. **Create Job** (`POST /api/jobs`)
   ```json
   {
     "customerId": "customer-id-here",
     "pickupAddress": "123 Main St",
     "deliveryAddress": "456 High St",
     "parcelDetails": {
       "weight": 5.5,
       "value": 100
     }
   }
   ```

### Workflow 2: Track a Shipment (No Auth)

1. Go to `GET /api/tracking/:trackingId`
2. Click **"Try it out"**
3. Enter tracking ID: `SHIP-20241010-A3B9F`
4. Click **"Execute"**
5. View tracking information

---

## 🛠️ Customization

### Adding New Endpoints

To document new endpoints, add JSDoc comments in your route files:

```javascript
/**
 * @swagger
 * /api/your-endpoint:
 *   get:
 *     summary: Your endpoint description
 *     tags: [YourTag]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
```

### Modifying Swagger Config

Edit `backend/src/config/swagger.js` to:
- Add new servers
- Modify API info
- Add new tags
- Define new schemas

### Adding More Examples

Add annotations in `backend/src/docs/swagger-annotations.js`

---

## 🔧 Troubleshooting

### Swagger UI Not Loading

**Issue:** Page shows error or blank
**Solution:**
```bash
# Reinstall dependencies
cd backend
npm install swagger-ui-express swagger-jsdoc

# Restart server
npm run dev
```

### Authentication Not Working

**Issue:** 401 errors after authorization
**Solution:**
1. Make sure you clicked "Authorize" button
2. Paste token WITHOUT "Bearer " prefix
3. Token should look like: `eyJhbGciOiJIUzI1NiIsInR5cCI6...`

### Endpoints Not Showing

**Issue:** Some endpoints missing
**Solution:**
1. Check if annotations are in `swagger-annotations.js`
2. Verify the `apis` path in `swagger.js`
3. Restart the server

---

## 📊 Swagger vs Postman

| Feature | Swagger | Postman |
|---------|---------|---------|
| **Interactive Docs** | ✅ Built-in | ❌ Manual setup |
| **Auto-generated** | ✅ From code | ❌ Manual |
| **Browser-based** | ✅ Yes | ⚠️ Desktop app |
| **Team Sharing** | ✅ URL link | ⚠️ Export/Import |
| **Testing** | ✅ Basic | ✅ Advanced |
| **Collections** | ❌ No | ✅ Yes |
| **Automation** | ❌ No | ✅ Yes |

**Recommendation:** Use Swagger for documentation and quick testing, Postman for advanced testing and automation.

---

## 🌐 Production Deployment

### Update Server URLs

Before deploying, update `backend/src/config/swagger.js`:

```javascript
servers: [
  {
    url: 'https://api.yourproductionurl.com',
    description: 'Production server',
  },
  {
    url: 'http://localhost:5000',
    description: 'Development server',
  },
],
```

### Security Considerations

1. **Disable in Production (Optional):**
   ```javascript
   // In app.js
   if (process.env.NODE_ENV !== 'production') {
     app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
   }
   ```

2. **Add Authentication:**
   - Protect `/api/docs` with basic auth
   - Use environment-based access control

3. **Hide Sensitive Info:**
   - Remove example credentials
   - Don't expose internal server details

---

## 📚 Additional Resources

- **Swagger Official Docs:** https://swagger.io/docs/
- **OpenAPI Specification:** https://spec.openapis.org/oas/v3.0.0
- **Swagger Editor:** https://editor.swagger.io/ (paste your JSON spec)
- **Postman:** Import `http://localhost:5000/api/docs.json`

---

## 🎯 Quick Tips

1. **Use Example Values:** Click "Example Value" for quick testing
2. **Clear Cache:** Hard refresh (Ctrl+Shift+R) if UI looks outdated
3. **Copy cURL:** Click "Copy" button to get cURL command
4. **Download Spec:** Use `/api/docs.json` for tool imports
5. **Keyboard Shortcuts:** Use Tab to navigate fields quickly

---

## ✅ Testing Checklist

- [ ] Swagger UI loads at `/api/docs`
- [ ] All endpoints are listed
- [ ] Request/Response examples are visible
- [ ] Authentication works (login → authorize → test)
- [ ] Try testing each endpoint category:
  - [ ] Authentication endpoints
  - [ ] Customer endpoints
  - [ ] Job endpoints
  - [ ] Tracking endpoint (no auth)
- [ ] Responses match expected formats
- [ ] Error responses are documented

---

**Your API documentation is now live and interactive!** 🎉

Access it at: `http://localhost:5000/api/docs`







