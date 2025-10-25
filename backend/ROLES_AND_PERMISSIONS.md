# Roles & Permissions Guide

## 🎭 Overview

BestDeal Shipping system has **8 predefined roles** with specific permissions. Each role is designed for different user types in the shipping workflow.

---

## 📋 Roles Summary

| Role | Display Name | Color | System Role | Description |
|------|-------------|-------|-------------|-------------|
| `superadmin` | Super Administrator | 🔴 Red | ✅ Yes | Full system access with all privileges |
| `admin` | Administrator | 🔵 Blue | ✅ Yes | Full system access and management |
| `finance` | Finance Manager | 🟡 Yellow | ✅ Yes | Manage invoices, payments, and financial reports |
| `customer-service` | Customer Service | 🔷 Cyan | ✅ Yes | Manage customers and track shipments |
| `warehouse` | Warehouse Manager | 🟢 Green | ✅ Yes | Manage warehouse operations and batching |
| `driver` | Driver | 🟠 Orange | ✅ Yes | Collection and delivery operations |
| `delivery-agent` | Delivery Agent | 🟣 Purple | ✅ Yes | Final delivery operations |
| `user` | User | ⚪ Gray | ✅ Yes | Basic user access |

---

## 🔐 Detailed Role Permissions

### 1. **Superadmin** 👑
**Role ID:** `superadmin`  
**Color:** `#f5222d` (Red)

**Permissions:**
- `*` - All permissions (wildcard)
- `system-settings` - Modify system settings
- `user-management` - Full user management
- `role-management` - Manage roles and permissions
- `all-data-access` - Access all data regardless of ownership

**Access Level:** ⭐⭐⭐⭐⭐ (Unlimited)

**Capabilities:**
- Bypasses ALL role restrictions
- Full CRUD on all resources
- System configuration access
- Can create other admins
- View audit logs

---

### 2. **Admin** 🛡️
**Role ID:** `admin`  
**Color:** `#1890ff` (Blue)

**Permissions:**
```
✅ Users
  - users-view
  - users-create
  - users-update
  - users-delete

✅ Jobs/Shipments
  - jobs-view
  - jobs-create
  - jobs-update
  - jobs-delete
  - jobs-assign

✅ Customers
  - customers-view
  - customers-create
  - customers-update
  - customers-delete

✅ Batches
  - batches-view
  - batches-create
  - batches-update
  - batches-delete

✅ Invoices
  - invoices-view
  - invoices-create
  - invoices-update
  - invoices-send

✅ Team Management
  - invitations-send
  - invitations-view

✅ Reporting
  - reports-view

✅ Dashboard
  - dashboard
```

**Access Level:** ⭐⭐⭐⭐ (High)

---

### 3. **Finance Manager** 💰
**Role ID:** `finance`  
**Color:** `#faad14` (Yellow)

**Permissions:**
```
✅ Invoices (Full Access)
  - invoices-view
  - invoices-create
  - invoices-update
  - invoices-send
  - invoices-mark-paid

✅ Financial Reporting
  - reports-financial

✅ Limited Access
  - customers-view (read-only)
  - jobs-view (read-only)

✅ Dashboard
  - dashboard
```

**Access Level:** ⭐⭐⭐ (Medium-High)

**Use Cases:**
- Create and send invoices
- Track payments
- Generate financial reports
- View customer billing history

---

### 4. **Customer Service** 🎧
**Role ID:** `customer-service`  
**Color:** `#13c2c2` (Cyan)

**Permissions:**
```
✅ Customers (Full Access)
  - customers-view
  - customers-create
  - customers-update

✅ Jobs/Tracking
  - jobs-view
  - jobs-create
  - jobs-update
  - tracking-view

✅ Dashboard
  - dashboard
```

**Access Level:** ⭐⭐⭐ (Medium)

**Use Cases:**
- Handle customer inquiries
- Create new shipments
- Update customer information
- Track shipments
- Resolve customer issues

---

### 5. **Warehouse Manager** 📦
**Role ID:** `warehouse`  
**Color:** `#52c41a` (Green)

**Permissions:**
```
✅ Warehouse Operations
  - warehouse-dashboard

✅ Batch Management (Full Access)
  - batches-view
  - batches-create
  - batches-update

✅ Jobs
  - jobs-view
  - jobs-update
  - jobs-assign (assign to drivers)

✅ Dashboard
  - dashboard
```

**Access Level:** ⭐⭐⭐ (Medium)

**Use Cases:**
- Create shipping batches
- Organize parcels by destination
- Assign jobs to drivers
- Track warehouse inventory
- Update shipment status

---

### 6. **Driver** 🚗
**Role ID:** `driver`  
**Color:** `#fa8c16` (Orange)

**Permissions:**
```
✅ Driver Operations
  - driver-dashboard

✅ Assigned Jobs
  - jobs-assigned-view (only assigned to them)
  - jobs-update-status
  - jobs-add-notes

✅ Documents
  - upload-documents (photos, signatures)

✅ Dashboard
  - dashboard
```

**Access Level:** ⭐⭐ (Low-Medium)

**Use Cases:**
- View assigned collections/deliveries
- Update job status (picked up, in transit)
- Add delivery notes
- Upload proof photos
- Navigate to pickup locations

**Restrictions:**
- Can only see jobs assigned to them
- Cannot assign jobs to others
- Cannot delete jobs

---

### 7. **Delivery Agent** 📮
**Role ID:** `delivery-agent`  
**Color:** `#722ed1` (Purple)

**Permissions:**
```
✅ Delivery Operations
  - delivery-dashboard

✅ Assigned Deliveries
  - deliveries-assigned-view (only assigned to them)
  - delivery-confirm
  - delivery-update-status

✅ Proof of Delivery
  - upload-pod (proof of delivery photos/signatures)

✅ Dashboard
  - dashboard
```

**Access Level:** ⭐⭐ (Low-Medium)

**Use Cases:**
- View assigned deliveries
- Confirm deliveries
- Upload proof of delivery
- Update delivery status
- Capture customer signatures

**Restrictions:**
- Can only see deliveries assigned to them
- Cannot create new jobs
- Cannot access warehouse functions

---

### 8. **User** 👤
**Role ID:** `user`  
**Color:** `#8c8c8c` (Gray)

**Permissions:**
```
✅ Basic Access
  - dashboard
  - jobs-view (limited)
  - customers-view (limited)
```

**Access Level:** ⭐ (Basic)

**Use Cases:**
- View dashboard
- Basic read-only access
- Future: self-service customer portal

---

## 🔄 Permission Hierarchy

```
Superadmin (*)
    ↓
Admin (all defined permissions)
    ↓
Finance / Customer Service / Warehouse (department-specific)
    ↓
Driver / Delivery Agent (operational)
    ↓
User (read-only)
```

---

## 📊 Permission Categories

### Core Permissions

| Category | Permissions | Who Has Access |
|----------|------------|----------------|
| **Dashboard** | `dashboard` | All roles |
| **Users** | `users-view`, `users-create`, `users-update`, `users-delete` | Superadmin, Admin |
| **Jobs** | `jobs-view`, `jobs-create`, `jobs-update`, `jobs-delete`, `jobs-assign` | Superadmin, Admin, Customer Service, Warehouse |
| **Customers** | `customers-view`, `customers-create`, `customers-update`, `customers-delete` | Superadmin, Admin, Customer Service, Finance |
| **Batches** | `batches-view`, `batches-create`, `batches-update`, `batches-delete` | Superadmin, Admin, Warehouse |
| **Invoices** | `invoices-view`, `invoices-create`, `invoices-update`, `invoices-send`, `invoices-mark-paid` | Superadmin, Admin, Finance |
| **Invitations** | `invitations-send`, `invitations-view` | Superadmin, Admin |
| **Reports** | `reports-view`, `reports-financial` | Superadmin, Admin, Finance |

---

## 🎯 Testing Credentials

Use these test accounts to try different role permissions:

```
🏢 Warehouse Manager:
   Email: warehouse@bestdeal.com
   Password: warehouse123

🚗 Driver:
   Email: driver@bestdeal.com
   Password: driver123

📮 Delivery Agent:
   Email: delivery@bestdeal.com
   Password: delivery123

💰 Finance Manager:
   Email: finance@bestdeal.com
   Password: finance123

🎧 Customer Support:
   Email: support@bestdeal.com
   Password: support123
```

---

## 🛠️ How to Create Superadmin

The **Superadmin** role can only be created via the API (not included in seed data):

### Using Swagger UI:
1. Go to `http://localhost:4001/api/docs`
2. Find `POST /api/auth/create-superadmin`
3. Click "Try it out"
4. Enter:
```json
{
  "email": "admin@bestdeal.com",
  "password": "YourSecurePassword123!",
  "name": "System Administrator"
}
```
5. Execute

### Using cURL:
```bash
curl -X POST http://localhost:4001/api/auth/create-superadmin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@bestdeal.com",
    "password": "YourSecurePassword123!",
    "name": "System Administrator"
  }'
```

---

## 🔒 Role-Based Access Control (RBAC)

### How it Works:

1. **Authentication**: User logs in with email/password
2. **Token Generation**: JWT token includes user role
3. **Authorization**: Middleware checks role against required permissions
4. **Access Decision**: Grant or deny access

### Example Code:

```javascript
// Protect route - Admin only
router.post('/jobs', authenticate, authorize('admin'), createJob);

// Protect route - Multiple roles
router.get('/jobs', authenticate, authorize('admin', 'customer-service', 'warehouse'), getJobs);

// Superadmin bypasses all checks automatically
```

---

## 📝 Adding Custom Permissions

To add new permissions:

1. **Update Role Definition** in `prisma/seed.js`
2. **Add Permission Check** in route middleware
3. **Re-run Seed** to update database

Example:
```javascript
{
  name: 'admin',
  permissions: JSON.stringify([
    'dashboard',
    'users-view',
    'NEW-PERMISSION-HERE', // Add here
  ]),
}
```

---

## 🚦 Access Control Examples

### Example 1: Job Creation
```
✅ Superadmin - Can create
✅ Admin - Can create
✅ Customer Service - Can create
❌ Warehouse - Cannot create
❌ Driver - Cannot create
❌ Delivery Agent - Cannot create
```

### Example 2: View Invoices
```
✅ Superadmin - All invoices
✅ Admin - All invoices
✅ Finance - All invoices
❌ Others - No access
```

### Example 3: Update Job Status
```
✅ Superadmin - All jobs
✅ Admin - All jobs
✅ Warehouse - All jobs
✅ Driver - Only assigned jobs
✅ Delivery Agent - Only assigned jobs
❌ User - No update access
```

---

## 🔍 Viewing Roles in Database

### Using Prisma Studio:
```bash
npx prisma studio
```
Navigate to the `roles` table to see all roles and permissions.

### Using API:
```bash
# Get all users and their roles
GET /api/auth/users
Authorization: Bearer YOUR_TOKEN
```

---

## 📚 Related Documentation

- **Authentication Guide**: `/backend/src/docs/swagger-annotations.js`
- **Superadmin Setup**: `/backend/SUPERADMIN_SETUP.md`
- **API Documentation**: `http://localhost:4001/api/docs`

---

## 🎨 Role Colors

Roles are color-coded for easy identification in the UI:

| Role | Color Code | Color Name |
|------|-----------|------------|
| Superadmin | `#f5222d` | Red |
| Admin | `#1890ff` | Blue |
| Finance | `#faad14` | Yellow/Gold |
| Customer Service | `#13c2c2` | Cyan |
| Warehouse | `#52c41a` | Green |
| Driver | `#fa8c16` | Orange |
| Delivery Agent | `#722ed1` | Purple |
| User | `#8c8c8c` | Gray |

---

**🎉 Your roles and permissions system is now ready!**

All 8 roles with detailed permissions have been created in your database.

