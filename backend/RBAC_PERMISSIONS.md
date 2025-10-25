# Role-Based Access Control (RBAC) - Permissions Matrix

## Overview
This document defines the permissions for each user role in the ShipEASE system.

---

## User Roles & Permissions

### 1. ADMIN 👑
**Full System Access**

#### User Management
- ✅ Create, read, update, delete users
- ✅ Send, view, cancel invitations
- ✅ Manage roles and permissions

#### Customer Management
- ✅ Create, read, update, delete customers

#### Job Management
- ✅ Create, read, update, delete jobs
- ✅ Assign jobs to drivers/delivery agents
- ✅ View all jobs (no restrictions)
- ✅ Update any job status

#### Batch Management
- ✅ Create, read, update, delete batches

#### Invoice Management
- ✅ Create, read, update, delete invoices

#### Reports & Analytics
- ✅ View all reports
- ✅ View financial data

#### Settings
- ✅ Modify system settings

---

### 2. DRIVER 🚗
**Collection & Transportation**

#### Job Management
- ✅ View jobs assigned to them ONLY
- ✅ Update status of assigned jobs
- ✅ Add timeline entries to assigned jobs
- ✅ Upload documents (proof of collection)
- ❌ Cannot view other drivers' jobs
- ❌ Cannot create or delete jobs
- ❌ Cannot assign jobs

#### Customer Management
- ✅ View customer details (read-only)
- ❌ Cannot create, update, or delete customers

#### Reports
- ✅ View their own performance reports
- ❌ Cannot view other drivers' data

**API Endpoints:**
```
GET /api/jobs?assignedDriverId={myId}  - View my jobs
GET /api/jobs/:id                       - View job details (if assigned to me)
PATCH /api/jobs/:id/status             - Update status (if assigned to me)
POST /api/jobs/:id/timeline            - Add timeline entry
POST /api/jobs/:id/documents           - Upload documents
GET /api/customers/:id                  - View customer (read-only)
```

---

### 3. WAREHOUSE 📦
**Hub & Batch Management**

#### Job Management
- ✅ View all jobs at warehouse
- ✅ Update job status (warehouse-related)
- ✅ Add timeline entries
- ❌ Cannot create or delete jobs

#### Batch Management
- ✅ Create, read, update batches
- ✅ Assign jobs to batches
- ❌ Cannot delete batches

#### Customer Management
- ✅ View customer details (read-only)
- ❌ Cannot create, update, or delete customers

#### Reports
- ✅ View warehouse reports
- ✅ View batch statistics

**API Endpoints:**
```
GET /api/jobs                          - View all jobs
PATCH /api/jobs/:id/status            - Update job status
POST /api/jobs/:id/assign-driver      - Assign drivers
GET /api/batches                       - View batches
POST /api/batches                      - Create batches
PUT /api/batches/:id                  - Update batches
GET /api/customers/:id                 - View customer (read-only)
```

---

### 4. DELIVERY AGENT 🏃
**Last-Mile Delivery**

#### Job Management
- ✅ View jobs assigned to them ONLY
- ✅ Update status of assigned jobs
- ✅ Add timeline entries to assigned jobs
- ✅ Upload documents (proof of delivery, signatures)
- ❌ Cannot view other agents' jobs
- ❌ Cannot create or delete jobs
- ❌ Cannot assign jobs

#### Customer Management
- ✅ View customer details (read-only)
- ❌ Cannot create, update, or delete customers

#### Reports
- ✅ View their own delivery reports
- ❌ Cannot view other agents' data

**API Endpoints:**
```
GET /api/jobs?assignedDeliveryAgentId={myId}  - View my deliveries
GET /api/jobs/:id                              - View job details (if assigned to me)
PATCH /api/jobs/:id/status                    - Update status (if assigned to me)
POST /api/jobs/:id/timeline                   - Add timeline entry
POST /api/jobs/:id/documents                  - Upload POD
GET /api/customers/:id                         - View customer (read-only)
```

---

### 5. CUSTOMER SERVICE 📞
**Customer Support**

#### Customer Management
- ✅ Create, read, update customers
- ❌ Cannot delete customers

#### Job Management
- ✅ View all jobs
- ✅ Create new jobs
- ✅ Add notes to jobs
- ❌ Cannot update job status
- ❌ Cannot delete jobs
- ❌ Cannot assign jobs

#### Reports
- ✅ View customer-related reports
- ❌ Cannot view financial data

**API Endpoints:**
```
GET /api/customers                     - View all customers
POST /api/customers                    - Create customer
PUT /api/customers/:id                 - Update customer
GET /api/jobs                          - View all jobs
POST /api/jobs                         - Create job
GET /api/jobs/:id                      - View job details
POST /api/jobs/:id/timeline           - Add notes
```

---

### 6. FINANCE 💰
**Billing & Invoicing**

#### Invoice Management
- ✅ Create, read, update, delete invoices
- ✅ Generate invoices
- ✅ Track payments

#### Job Management
- ✅ View all jobs (read-only for pricing)
- ❌ Cannot create, update, or delete jobs

#### Customer Management
- ✅ View customer details (read-only for billing)
- ❌ Cannot create, update, or delete customers

#### Reports
- ✅ View all financial reports
- ✅ View revenue analytics

**API Endpoints:**
```
GET /api/invoices                      - View all invoices
POST /api/invoices                     - Create invoice
PUT /api/invoices/:id                  - Update invoice
DELETE /api/invoices/:id               - Delete invoice
GET /api/jobs                          - View jobs (read-only)
GET /api/customers                     - View customers (read-only)
GET /api/reports/financial            - Financial reports
```

---

## Permission Strings

### User Management
- `users:create` - Create new users
- `users:read` - View users
- `users:update` - Update user details
- `users:delete` - Delete users
- `invitations:send` - Send invitations
- `invitations:view` - View invitations
- `invitations:cancel` - Cancel invitations

### Customer Management
- `customers:create` - Create customers
- `customers:read` - View customers
- `customers:update` - Update customers
- `customers:delete` - Delete customers

### Job Management
- `jobs:create` - Create new jobs
- `jobs:read` - View jobs
- `jobs:read_all` - View all jobs (unrestricted)
- `jobs:read_own` - View only own/assigned jobs
- `jobs:update` - Update job details
- `jobs:update_own` - Update only own/assigned jobs
- `jobs:delete` - Delete jobs
- `jobs:assign` - Assign jobs to drivers

### Batch Management
- `batches:create` - Create batches
- `batches:read` - View batches
- `batches:update` - Update batches
- `batches:delete` - Delete batches

### Invoice Management
- `invoices:create` - Create invoices
- `invoices:read` - View invoices
- `invoices:update` - Update invoices
- `invoices:delete` - Delete invoices

### Reports & Analytics
- `reports:view_all` - View all reports
- `reports:view_own` - View personal reports
- `reports:view_warehouse` - View warehouse reports
- `reports:view_customer` - View customer reports
- `reports:view_financial` - View financial reports

### Timeline & Documents
- `timeline:create` - Add timeline entries
- `documents:upload` - Upload documents

### Settings
- `settings:modify` - Modify system settings

---

## Implementation

### Backend Middleware
```javascript
// Route-level authorization
router.post('/jobs', authorize('admin', 'customer-service'), createJob);

// Permission-based authorization
router.get('/reports', requirePermission('reports:view_financial'), getReports);
```

### Controller-level Filtering
```javascript
// Jobs are automatically filtered by role in getAllJobs()
switch (req.user.role) {
  case 'driver':
    where.assignedDriverId = req.user.id;  // Only see own jobs
    break;
  case 'admin':
    // No filter - see all jobs
    break;
}
```

### Ownership Validation
```javascript
// Drivers can only update their own jobs
if (req.user.role === 'driver' && job.assignedDriverId !== req.user.id) {
  return sendError(res, 403, 'Access denied');
}
```

---

## Frontend Route Guards

Routes are protected based on user role in `App.js`:

```javascript
{currentUser?.role === 'admin' && (
  <Route path="/admin" element={<AdminDashboard />} />
)}

{['admin', 'driver', 'delivery-agent'].includes(currentUser?.role) && (
  <Route path="/jobs" element={<JobsPage />} />
)}
```

---

## Status Codes

- **401 Unauthorized** - No authentication token provided
- **403 Forbidden** - User doesn't have required role/permission
- **404 Not Found** - Resource doesn't exist (or user doesn't have access)

---

## Testing RBAC

1. **Login as different roles**
2. **Try accessing restricted endpoints**
3. **Verify error messages**
4. **Check data filtering**

Example tests:
```bash
# Driver tries to view all jobs (should only see their own)
GET /api/jobs
Authorization: Bearer {driverToken}

# Customer service tries to delete a customer (should fail)
DELETE /api/customers/:id
Authorization: Bearer {csToken}
```

---

Last Updated: October 10, 2025






