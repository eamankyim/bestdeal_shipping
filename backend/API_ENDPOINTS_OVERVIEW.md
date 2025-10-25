# ShipEASE API - Endpoints Overview

Quick reference for all implemented API endpoints.

---

## 🔐 Authentication Endpoints

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/api/auth/register` | Register new user | ❌ | Public |
| POST | `/api/auth/login` | Login user | ❌ | Public |
| POST | `/api/auth/logout` | Logout user | ✅ | Any |
| GET | `/api/auth/me` | Get current user | ✅ | Any |
| POST | `/api/auth/refresh-token` | Refresh access token | ❌ | Public |
| POST | `/api/auth/send-invite` | Send user invitation | ✅ | Admin |
| POST | `/api/auth/accept-invite/:token` | Accept invitation | ❌ | Public |

---

## 👥 Customer Endpoints

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/customers` | Get all customers (paginated) | ✅ | Any |
| GET | `/api/customers/:id` | Get customer by ID | ✅ | Any |
| POST | `/api/customers` | Create new customer | ✅ | Any |
| PUT | `/api/customers/:id` | Update customer | ✅ | Any |
| DELETE | `/api/customers/:id` | Delete customer | ✅ | Admin |
| GET | `/api/customers/:id/jobs` | Get customer jobs | ✅ | Any |

**Query Parameters (GET /api/customers):**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `search` - Search by name, email, phone
- `customerType` - Filter by type (Individual/Company)

---

## 📦 Job Endpoints

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/jobs` | Get all jobs (paginated & filterable) | ✅ | Any |
| GET | `/api/jobs/:id` | Get job by ID | ✅ | Any |
| POST | `/api/jobs` | Create new job | ✅ | Any |
| PUT | `/api/jobs/:id` | Update job details | ✅ | Any |
| DELETE | `/api/jobs/:id` | Delete/cancel job | ✅ | Admin |
| PATCH | `/api/jobs/:id/status` | Update job status | ✅ | Any* |
| POST | `/api/jobs/:id/assign-driver` | Assign driver to job | ✅ | Admin, Warehouse |
| GET | `/api/jobs/:id/timeline` | Get job timeline/history | ✅ | Any |

**Query Parameters (GET /api/jobs):**
- `page` - Page number
- `limit` - Items per page
- `status` - Filter by status
- `customerId` - Filter by customer
- `assignedDriverId` - Filter by driver
- `priority` - Filter by priority (Standard/Express/Urgent)
- `startDate` - Filter by pickup date (start)
- `endDate` - Filter by pickup date (end)

**Job Statuses (12):**
1. Pending Collection
2. Assigned
3. En Route to Customer
4. Collected
5. Returning to Warehouse
6. At Warehouse
7. Batched
8. Shipped
9. In Transit
10. Arrived at Destination
11. Out for Delivery
12. Delivered

---

## 📍 Public Tracking Endpoint

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/tracking/:trackingId` | Track shipment publicly | ❌ | Public |

**Example:** `GET /api/tracking/SHIP-20241010-A3B9F`

---

## 🏥 Health Check

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | API health check | ❌ |
| GET | `/` | API welcome message | ❌ |

---

## 📋 Request/Response Examples

### 1. Login

**Request:**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@shipease.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@shipease.com",
      "name": "Admin User",
      "role": "admin",
      "avatarUrl": null
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Create Customer

**Request:**
```bash
POST /api/customers
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+441234567890",
  "customerType": "Individual",
  "address": "123 Main St, London",
  "notes": "Preferred customer"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Customer created successfully",
  "data": {
    "customer": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+441234567890",
      "customerType": "Individual",
      "address": "123 Main St, London",
      "notes": "Preferred customer",
      "createdAt": "2024-10-10T15:30:00.000Z",
      "creator": {
        "name": "Admin User",
        "email": "admin@shipease.com"
      }
    }
  }
}
```

### 3. Create Job

**Request:**
```bash
POST /api/jobs
Authorization: Bearer <token>
Content-Type: application/json

{
  "customerId": "customer-uuid",
  "pickupAddress": "123 Main St, Manchester",
  "deliveryAddress": "456 High St, London",
  "pickupDate": "2024-10-15",
  "parcelDetails": {
    "description": "Electronics",
    "weight": 5.5,
    "dimensions": {
      "length": 30,
      "width": 20,
      "height": 15
    },
    "value": 500,
    "quantity": 1
  },
  "priority": "Express",
  "specialInstructions": "Handle with care"
}
```

**OR Create Job with New Customer:**
```bash
POST /api/jobs
Authorization: Bearer <token>
Content-Type: application/json

{
  "newCustomer": {
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+441234567891",
    "customerType": "Individual",
    "address": "789 Park Rd, Birmingham"
  },
  "pickupAddress": "789 Park Rd, Birmingham",
  "deliveryAddress": "321 Oak St, London",
  "pickupDate": "2024-10-16",
  "parcelDetails": {
    "description": "Documents",
    "weight": 0.5,
    "value": 50,
    "quantity": 1
  },
  "priority": "Standard"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Job created successfully",
  "data": {
    "job": {
      "id": "uuid",
      "trackingId": "SHIP-20241010-A3B9F",
      "status": "Pending Collection",
      "customer": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "pickupAddress": "123 Main St, Manchester",
      "deliveryAddress": "456 High St, London",
      "pickupDate": "2024-10-15T00:00:00.000Z",
      "weight": 5.5,
      "value": 500,
      "priority": "Express",
      "createdAt": "2024-10-10T15:30:00.000Z"
    }
  }
}
```

### 4. Update Job Status

**Request:**
```bash
PATCH /api/jobs/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "Collected",
  "notes": "Collected successfully at 10:30 AM"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Job status updated successfully",
  "data": {
    "job": {
      "id": "uuid",
      "trackingId": "SHIP-20241010-A3B9F",
      "status": "Collected",
      "customer": {
        "name": "John Doe"
      },
      "assignedDriver": {
        "name": "John Driver",
        "email": "driver@shipease.com"
      }
    }
  }
}
```

### 5. Public Tracking

**Request:**
```bash
GET /api/tracking/SHIP-20241010-A3B9F
```

**Response:**
```json
{
  "success": true,
  "message": "Tracking info retrieved successfully",
  "data": {
    "job": {
      "trackingId": "SHIP-20241010-A3B9F",
      "status": "Collected",
      "pickupAddress": "123 Main St, Manchester",
      "deliveryAddress": "456 High St, London",
      "estimatedDelivery": "2024-10-18T00:00:00.000Z",
      "actualDelivery": null,
      "customer": {
        "name": "John Doe"
      },
      "timeline": [
        {
          "status": "Pending Collection",
          "timestamp": "2024-10-10T15:30:00.000Z",
          "notes": "Job created"
        },
        {
          "status": "Assigned",
          "timestamp": "2024-10-11T09:00:00.000Z",
          "notes": "Assigned to driver John Driver"
        },
        {
          "status": "Collected",
          "timestamp": "2024-10-11T10:30:00.000Z",
          "notes": "Collected successfully at 10:30 AM"
        }
      ]
    }
  }
}
```

### 6. Get Jobs with Filters

**Request:**
```bash
GET /api/jobs?status=Pending Collection&priority=Express&page=1&limit=10
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "trackingId": "SHIP-20241010-A3B9F",
      "status": "Pending Collection",
      "priority": "Express",
      "customer": {
        "name": "John Doe",
        "customerType": "Individual"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## 🔒 Authentication

Most endpoints require authentication. Include JWT token in header:

```
Authorization: Bearer <your-jwt-token>
```

Get token from `/api/auth/login` response.

---

## ❌ Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Required role(s): admin"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Job not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## 📊 Rate Limiting

- **General API:** 100 requests per 15 minutes
- **Auth endpoints:** 5 requests per 15 minutes (login, register)

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699876543
```

---

## 🔄 Pagination

All list endpoints support pagination:

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

**Response includes:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## 🧪 Testing Endpoints

### Using cURL
```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@shipease.com","password":"admin123"}' \
  | jq -r '.data.token')

# Use token
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/auth/me
```

### Using Postman
1. Import endpoints
2. Set environment variable: `{{baseUrl}}` = `http://localhost:5000/api`
3. Set authorization: Bearer Token = `{{token}}`
4. Test all endpoints

---

**Total Implemented Endpoints: ~25**

For future endpoints (batch, invoice, warehouse, etc.), see `BACKEND_API_PLAN.md`







