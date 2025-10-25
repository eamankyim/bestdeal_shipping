# Backend API Plan - ShipEASE

## 📋 Overview

This document outlines all the API endpoints needed for the ShipEASE shipping management system. The backend will support a job-centric workflow with 12 status transitions, role-based access control, and comprehensive tracking.

---

## 🏗️ Technology Stack Recommendations

### Backend Framework Options:
1. **Node.js + Express** (Recommended for JavaScript consistency)
2. **Python + FastAPI/Django** (Good for data-heavy operations)
3. **PHP + Laravel** (If team is PHP-focused)

### Database:
- **PostgreSQL** (Recommended - robust, ACID compliant, good for complex queries)
- Alternative: **MySQL/MariaDB**

### Authentication:
- **JWT (JSON Web Tokens)** for stateless auth
- **BCrypt** for password hashing

### File Storage (for documents/images):
- **AWS S3** or **Cloudinary** or local storage

---

## 📚 API Endpoint Categories

### 1. Authentication & Authorization
### 2. User Management
### 3. Customer Management
### 4. Job Management (Core)
### 5. Driver Operations
### 6. Warehouse Operations
### 7. Batch Management
### 8. Invoice Management
### 9. Delivery Agent Operations
### 10. Tracking & Reports
### 11. Dashboard & Analytics

---

## 🔐 1. Authentication & Authorization APIs

### **POST** `/api/auth/register`
- **Purpose:** Register new user
- **Body:** `{ email, password, name, role }`
- **Response:** `{ user, token }`
- **Access:** Public (with admin approval) or Admin only

### **POST** `/api/auth/login`
- **Purpose:** User login
- **Body:** `{ email, password }`
- **Response:** `{ user: { id, name, email, role, permissions }, token }`
- **Access:** Public

### **POST** `/api/auth/logout`
- **Purpose:** Logout (invalidate token)
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `{ message: "Logged out successfully" }`
- **Access:** Authenticated

### **POST** `/api/auth/refresh-token`
- **Purpose:** Refresh JWT token
- **Body:** `{ refreshToken }`
- **Response:** `{ token, refreshToken }`
- **Access:** Authenticated

### **GET** `/api/auth/me`
- **Purpose:** Get current user info
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `{ user: { id, name, email, role, permissions } }`
- **Access:** Authenticated

### **POST** `/api/auth/forgot-password`
- **Purpose:** Send password reset email
- **Body:** `{ email }`
- **Response:** `{ message: "Reset link sent" }`
- **Access:** Public

### **POST** `/api/auth/reset-password`
- **Purpose:** Reset password with token
- **Body:** `{ token, newPassword }`
- **Response:** `{ message: "Password reset successful" }`
- **Access:** Public

---

## 👥 2. User Management APIs

### **GET** `/api/users`
- **Purpose:** Get all users (paginated)
- **Query:** `?page=1&limit=20&role=driver&search=john`
- **Response:** `{ users: [], total, page, limit }`
- **Access:** Admin

### **GET** `/api/users/:id`
- **Purpose:** Get single user
- **Response:** `{ user: {...} }`
- **Access:** Admin, Self

### **POST** `/api/users/invite`
- **Purpose:** Invite user to organization
- **Body:** `{ email, role, name }`
- **Response:** `{ invite: {...}, inviteLink }`
- **Access:** Admin

### **POST** `/api/users/accept-invite/:token`
- **Purpose:** Accept invitation and create account
- **Body:** `{ password, name }`
- **Response:** `{ user, token }`
- **Access:** Public (with valid token)

### **GET** `/api/users/invites/pending`
- **Purpose:** Get all pending invites
- **Response:** `{ invites: [] }`
- **Access:** Admin

### **PUT** `/api/users/:id`
- **Purpose:** Update user
- **Body:** `{ name, email, role, active }`
- **Response:** `{ user: {...} }`
- **Access:** Admin, Self (limited fields)

### **DELETE** `/api/users/:id`
- **Purpose:** Delete/deactivate user
- **Response:** `{ message: "User deleted" }`
- **Access:** Admin

### **GET** `/api/roles`
- **Purpose:** Get all roles and permissions
- **Response:** `{ roles: [{ name, displayName, permissions, userCount }] }`
- **Access:** Admin

---

## 👤 3. Customer Management APIs

### **GET** `/api/customers`
- **Purpose:** Get all customers (paginated, searchable)
- **Query:** `?page=1&limit=20&search=john&type=Individual`
- **Response:** `{ customers: [], total, page, limit }`
- **Access:** Authenticated

### **GET** `/api/customers/:id`
- **Purpose:** Get single customer details
- **Response:** `{ customer: {...}, jobHistory: [] }`
- **Access:** Authenticated

### **POST** `/api/customers`
- **Purpose:** Create new customer
- **Body:** `{ name, email, phone, address, customerType: "Individual/Company", notes }`
- **Response:** `{ customer: {...} }`
- **Access:** Authenticated

### **PUT** `/api/customers/:id`
- **Purpose:** Update customer
- **Body:** `{ name, email, phone, address, customerType, notes }`
- **Response:** `{ customer: {...} }`
- **Access:** Authenticated

### **DELETE** `/api/customers/:id`
- **Purpose:** Delete customer (if no active jobs)
- **Response:** `{ message: "Customer deleted" }`
- **Access:** Admin

### **GET** `/api/customers/:id/jobs`
- **Purpose:** Get all jobs for a customer
- **Query:** `?status=Delivered&page=1`
- **Response:** `{ jobs: [], total }`
- **Access:** Authenticated

---

## 📦 4. Job Management APIs (Core)

### **GET** `/api/jobs`
- **Purpose:** Get all jobs (paginated, filterable)
- **Query:** `?page=1&limit=20&status=Pending Collection&customerId=123&startDate=2024-01-01&endDate=2024-12-31`
- **Response:** `{ jobs: [], total, page, limit }`
- **Access:** Authenticated

### **GET** `/api/jobs/:id`
- **Purpose:** Get single job details
- **Response:** `{ job: {...}, customer: {...}, timeline: [], documents: [] }`
- **Access:** Authenticated

### **POST** `/api/jobs`
- **Purpose:** Create new job
- **Body:** 
```json
{
  "customerId": "123" or null,
  "newCustomer": { name, email, phone, address, customerType } or null,
  "pickupAddress": "...",
  "deliveryAddress": "...",
  "pickupDate": "2024-01-15",
  "parcelDetails": {
    "description": "Electronics",
    "weight": 5.5,
    "dimensions": { length: 30, width: 20, height: 15 },
    "value": 500,
    "quantity": 2
  },
  "specialInstructions": "Handle with care",
  "priority": "Standard/Express/Urgent"
}
```
- **Response:** `{ job: {...}, customer: {...}, trackingId: "..." }`
- **Access:** Authenticated

### **PUT** `/api/jobs/:id`
- **Purpose:** Update job details
- **Body:** `{ pickupAddress, deliveryAddress, parcelDetails, specialInstructions }`
- **Response:** `{ job: {...} }`
- **Access:** Authenticated (own jobs) or Admin

### **PATCH** `/api/jobs/:id/status`
- **Purpose:** Update job status
- **Body:** `{ status: "Collected", notes: "..." }`
- **Response:** `{ job: {...}, timeline: [] }`
- **Access:** Depends on role (Driver can update assigned jobs, Warehouse can update warehouse jobs, etc.)

### **POST** `/api/jobs/:id/assign-driver`
- **Purpose:** Assign driver to job
- **Body:** `{ driverId: "123" }`
- **Response:** `{ job: {...} }`
- **Access:** Admin, Warehouse

### **DELETE** `/api/jobs/:id`
- **Purpose:** Cancel job (only if not yet collected)
- **Response:** `{ message: "Job cancelled" }`
- **Access:** Admin

### **GET** `/api/jobs/:id/timeline`
- **Purpose:** Get job status timeline/history
- **Response:** `{ timeline: [{ status, timestamp, updatedBy, notes }] }`
- **Access:** Authenticated

### **POST** `/api/jobs/:id/documents`
- **Purpose:** Upload documents (proof of delivery, photos, etc.)
- **Body:** FormData with files
- **Response:** `{ documents: [] }`
- **Access:** Driver, Warehouse, Admin

### **GET** `/api/jobs/:id/documents`
- **Purpose:** Get all job documents
- **Response:** `{ documents: [{ id, name, url, type, uploadedBy, uploadedAt }] }`
- **Access:** Authenticated

---

## 🚗 5. Driver Operations APIs

### **GET** `/api/driver/assigned-jobs`
- **Purpose:** Get jobs assigned to current driver
- **Query:** `?status=Assigned&date=2024-01-15`
- **Response:** `{ jobs: [], stats: { total, inProgress, completed } }`
- **Access:** Driver

### **PATCH** `/api/driver/jobs/:id/start-journey`
- **Purpose:** Update status to "En Route to Customer"
- **Body:** `{ notes: "Started journey at 10:00 AM" }`
- **Response:** `{ job: {...} }`
- **Access:** Driver (own jobs)

### **POST** `/api/driver/jobs/:id/confirm-pickup`
- **Purpose:** Confirm collection (status → "Collected")
- **Body:** 
```json
{
  "signature": "base64_image_or_url",
  "photos": ["url1", "url2"],
  "notes": "Collected successfully",
  "actualWeight": 5.5,
  "actualDimensions": { length: 30, width: 20, height: 15 }
}
```
- **Response:** `{ job: {...} }`
- **Access:** Driver (own jobs)

### **PATCH** `/api/driver/jobs/:id/confirm-dropoff`
- **Purpose:** Confirm warehouse drop-off (status → "Returning to Warehouse" → "At Warehouse")
- **Body:** `{ notes: "Dropped at warehouse bay 3" }`
- **Response:** `{ job: {...} }`
- **Access:** Driver (own jobs)

### **GET** `/api/driver/stats`
- **Purpose:** Get driver statistics
- **Response:** 
```json
{
  "todayCollections": 15,
  "completedJobs": 120,
  "activeJobs": 5,
  "earnings": 1500
}
```
- **Access:** Driver (own stats)

---

## 🏭 6. Warehouse Operations APIs

### **GET** `/api/warehouse/jobs`
- **Purpose:** Get warehouse jobs (Returning to Warehouse, At Warehouse)
- **Query:** `?status=Returning to Warehouse`
- **Response:** `{ jobs: [], stats: { awaitingReceipt: 5, atWarehouse: 20 } }`
- **Access:** Warehouse

### **POST** `/api/warehouse/jobs/:id/confirm-receipt`
- **Purpose:** Confirm job received at warehouse (status → "At Warehouse")
- **Body:** 
```json
{
  "receivedBy": "John Doe",
  "condition": "Good/Damaged",
  "notes": "Received in good condition",
  "warehouseLocation": "Bay 3, Shelf A2",
  "photos": ["url1", "url2"]
}
```
- **Response:** `{ job: {...} }`
- **Access:** Warehouse

### **GET** `/api/warehouse/jobs/ready-for-batching`
- **Purpose:** Get jobs at warehouse ready for batching
- **Response:** `{ jobs: [{ id, trackingId, customer, destination, weight, value }] }`
- **Access:** Warehouse

### **GET** `/api/warehouse/stats`
- **Purpose:** Get warehouse statistics
- **Response:** 
```json
{
  "jobsAtWarehouse": 45,
  "receivedToday": 12,
  "awaitingReceipt": 5,
  "readyForBatching": 30
}
```
- **Access:** Warehouse

---

## 📦 7. Batch Management APIs

### **GET** `/api/batches`
- **Purpose:** Get all batches
- **Query:** `?status=In Preparation&page=1&destination=UK`
- **Response:** `{ batches: [], total, page, limit }`
- **Access:** Warehouse, Admin

### **GET** `/api/batches/:id`
- **Purpose:** Get batch details
- **Response:** 
```json
{
  "batch": {
    "id": "...",
    "batchId": "BATCH-001",
    "destination": "UK",
    "carrier": "DHL",
    "status": "In Preparation",
    "totalJobs": 25,
    "totalWeight": 125.5,
    "totalValue": 15000,
    "createdAt": "...",
    "shippedAt": null
  },
  "jobs": []
}
```
- **Access:** Warehouse, Admin

### **POST** `/api/batches`
- **Purpose:** Create new batch
- **Body:** 
```json
{
  "destination": "UK",
  "carrier": "DHL",
  "estimatedShipDate": "2024-01-20",
  "jobIds": ["job1", "job2", "job3"],
  "trackingNumber": "DHL123456",
  "notes": "Fragile items included"
}
```
- **Response:** `{ batch: {...} }`
- **Access:** Warehouse, Admin

### **PUT** `/api/batches/:id`
- **Purpose:** Update batch details
- **Body:** `{ destination, carrier, estimatedShipDate, notes }`
- **Response:** `{ batch: {...} }`
- **Access:** Warehouse, Admin

### **POST** `/api/batches/:id/add-jobs`
- **Purpose:** Add jobs to batch
- **Body:** `{ jobIds: ["job1", "job2"] }`
- **Response:** `{ batch: {...} }`
- **Access:** Warehouse, Admin

### **DELETE** `/api/batches/:id/remove-job/:jobId`
- **Purpose:** Remove job from batch
- **Response:** `{ batch: {...} }`
- **Access:** Warehouse, Admin

### **PATCH** `/api/batches/:id/ship`
- **Purpose:** Mark batch as shipped (updates all jobs to "Shipped")
- **Body:** `{ actualShipDate: "2024-01-20", trackingNumber: "DHL123456" }`
- **Response:** `{ batch: {...}, updatedJobs: [] }`
- **Access:** Warehouse, Admin

### **PATCH** `/api/batches/:id/status`
- **Purpose:** Update batch status
- **Body:** `{ status: "In Transit", notes: "..." }`
- **Response:** `{ batch: {...} }`
- **Access:** Warehouse, Admin

---

## 💰 8. Invoice Management APIs

### **GET** `/api/invoices`
- **Purpose:** Get all invoices
- **Query:** `?status=Pending&customerId=123&startDate=2024-01-01`
- **Response:** `{ invoices: [], total, page, limit }`
- **Access:** Authenticated

### **GET** `/api/invoices/:id`
- **Purpose:** Get invoice details
- **Response:** `{ invoice: {...}, jobs: [], customer: {...} }`
- **Access:** Authenticated

### **POST** `/api/invoices`
- **Purpose:** Create invoice
- **Body:** 
```json
{
  "customerId": "123",
  "jobIds": ["job1", "job2"],
  "items": [
    { description: "Shipping - 5kg parcel", quantity: 1, price: 25 }
  ],
  "dueDate": "2024-02-15",
  "notes": "Payment due within 30 days"
}
```
- **Response:** `{ invoice: {...}, invoiceNumber: "INV-001" }`
- **Access:** Admin

### **PUT** `/api/invoices/:id`
- **Purpose:** Update invoice
- **Body:** `{ items, dueDate, notes }`
- **Response:** `{ invoice: {...} }`
- **Access:** Admin

### **PATCH** `/api/invoices/:id/status`
- **Purpose:** Update invoice status
- **Body:** `{ status: "Paid", paidDate: "2024-01-15", paymentMethod: "Bank Transfer" }`
- **Response:** `{ invoice: {...} }`
- **Access:** Admin

### **POST** `/api/invoices/:id/send`
- **Purpose:** Send invoice to customer via email
- **Response:** `{ message: "Invoice sent successfully" }`
- **Access:** Admin

### **GET** `/api/pricing`
- **Purpose:** Get pricing structure
- **Response:** `{ pricing: [{ destination, weightRange, price }] }`
- **Access:** Authenticated

### **PUT** `/api/pricing`
- **Purpose:** Update pricing structure
- **Body:** `{ pricing: [...] }`
- **Response:** `{ pricing: [...] }`
- **Access:** Admin

---

## 🚚 9. Delivery Agent Operations APIs

### **GET** `/api/delivery/assigned-jobs`
- **Purpose:** Get jobs assigned for final delivery
- **Query:** `?status=Out for Delivery`
- **Response:** `{ jobs: [], stats: { assigned: 10, delivered: 5 } }`
- **Access:** Delivery Agent

### **PATCH** `/api/delivery/jobs/:id/out-for-delivery`
- **Purpose:** Update status to "Out for Delivery"
- **Body:** `{ estimatedDeliveryTime: "14:00" }`
- **Response:** `{ job: {...} }`
- **Access:** Delivery Agent

### **POST** `/api/delivery/jobs/:id/complete`
- **Purpose:** Mark as delivered
- **Body:** 
```json
{
  "recipientName": "John Doe",
  "recipientSignature": "base64_image",
  "deliveryPhoto": "url",
  "deliveredAt": "2024-01-15T14:30:00Z",
  "notes": "Delivered to reception"
}
```
- **Response:** `{ job: {...} }`
- **Access:** Delivery Agent

### **POST** `/api/delivery/jobs/:id/failed`
- **Purpose:** Report failed delivery
- **Body:** `{ reason: "Customer not available", notes: "...", nextAttemptDate: "2024-01-16" }`
- **Response:** `{ job: {...} }`
- **Access:** Delivery Agent

---

## 📍 10. Tracking & Reports APIs

### **GET** `/api/tracking/:trackingId`
- **Purpose:** Public tracking (no auth required)
- **Response:** 
```json
{
  "trackingId": "SHIP123456",
  "status": "In Transit",
  "currentLocation": "London Hub",
  "estimatedDelivery": "2024-01-20",
  "timeline": [
    { status: "Collected", timestamp: "...", location: "Manchester" },
    { status: "At Warehouse", timestamp: "...", location: "Manchester Warehouse" }
  ]
}
```
- **Access:** Public

### **GET** `/api/reports/dashboard`
- **Purpose:** Get dashboard statistics
- **Query:** `?period=today|week|month&role=driver`
- **Response:** 
```json
{
  "stats": {
    "totalJobs": 1250,
    "activeJobs": 45,
    "completedJobs": 1200,
    "pendingJobs": 5
  },
  "recentJobs": [],
  "recentActivities": []
}
```
- **Access:** Authenticated (filtered by role)

### **GET** `/api/reports/revenue`
- **Purpose:** Revenue reports
- **Query:** `?startDate=2024-01-01&endDate=2024-01-31`
- **Response:** 
```json
{
  "totalRevenue": 15000,
  "paidInvoices": 12000,
  "pendingInvoices": 3000,
  "revenueByCustomer": [],
  "revenueByMonth": []
}
```
- **Access:** Admin

### **GET** `/api/reports/jobs`
- **Purpose:** Job reports/analytics
- **Query:** `?groupBy=status|customer|destination&period=month`
- **Response:** `{ jobsByStatus: {...}, jobsByDestination: {...}, trends: [] }`
- **Access:** Admin

### **GET** `/api/reports/performance`
- **Purpose:** Performance metrics
- **Response:** 
```json
{
  "averageDeliveryTime": 5.5,
  "onTimeDeliveryRate": 95,
  "driverPerformance": [],
  "customerSatisfaction": 4.5
}
```
- **Access:** Admin

---

## 🔔 11. Notifications API (Optional but Recommended)

### **GET** `/api/notifications`
- **Purpose:** Get user notifications
- **Query:** `?unread=true&page=1`
- **Response:** `{ notifications: [], unreadCount: 5 }`
- **Access:** Authenticated

### **PATCH** `/api/notifications/:id/read`
- **Purpose:** Mark notification as read
- **Response:** `{ notification: {...} }`
- **Access:** Authenticated

### **POST** `/api/notifications/send`
- **Purpose:** Send notification (system use)
- **Body:** `{ userId, type, message, relatedEntity }`
- **Response:** `{ notification: {...} }`
- **Access:** System/Admin

---

## 📊 Summary

### Total Endpoints: **~75 API endpoints**

### Breakdown by Module:
- ✅ Authentication: 7 endpoints
- ✅ User Management: 7 endpoints
- ✅ Customers: 6 endpoints
- ✅ Jobs (Core): 9 endpoints
- ✅ Driver Operations: 5 endpoints
- ✅ Warehouse Operations: 4 endpoints
- ✅ Batch Management: 8 endpoints
- ✅ Invoice Management: 7 endpoints
- ✅ Delivery Agent: 4 endpoints
- ✅ Tracking & Reports: 5 endpoints
- ✅ Notifications: 3 endpoints (optional)

---

## 🔒 Security Considerations

1. **Authentication:**
   - JWT tokens with expiration
   - Refresh token rotation
   - Secure password hashing (BCrypt)

2. **Authorization:**
   - Role-based access control (RBAC)
   - Permission checks on every endpoint
   - Resource ownership validation

3. **Data Validation:**
   - Input sanitization
   - Request validation middleware
   - SQL injection prevention (use ORM/parameterized queries)

4. **Rate Limiting:**
   - Implement rate limiting per IP/user
   - Prevent brute force attacks

5. **CORS:**
   - Configure proper CORS policies
   - Whitelist frontend domains

---

## 📝 Next Steps

1. **Choose Backend Stack** (Node.js + Express + PostgreSQL recommended)
2. **Set Up Database Schema** (tables for users, customers, jobs, batches, invoices, etc.)
3. **Implement Core Modules First:**
   - Auth & Users
   - Jobs (Core)
   - Basic Dashboard
4. **Then Add Advanced Features:**
   - Batching
   - Invoicing
   - Reports
5. **Testing & Documentation:**
   - API documentation (Swagger/Postman)
   - Unit tests
   - Integration tests

---

**Ready to proceed? Let me know:**
1. Which backend stack you prefer?
2. Should I create the database schema first?
3. Do you want me to start with Auth + Jobs (core features)?







