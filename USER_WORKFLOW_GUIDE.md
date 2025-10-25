# 👥 User Workflow & Role Guide

## 📋 User Types in BestDeal Shipping

Your app has **8 distinct user roles**, each designed for specific tasks in the shipping workflow:

---

## 🎯 Who Creates the First Job?

**Answer:** Either **Admin** or **Customer Service** creates jobs.

### Job Creation Permissions:
- ✅ **Superadmin** - Can create jobs
- ✅ **Admin** - Can create jobs
- ✅ **Customer Service** - Can create jobs (primary job creator)
- ❌ **Finance** - Cannot create jobs (view only)
- ❌ **Warehouse** - Cannot create jobs (process only)
- ❌ **Driver** - Cannot create jobs (collect only)
- ❌ **Delivery Agent** - Cannot create jobs (deliver only)
- ❌ **User** - Cannot create jobs (view only)

---

## 🔄 Complete Shipping Workflow

### **Step 1: Job Creation** 📝
**Who:** Customer Service Representative  
**Role:** `customer-service`

**What They Do:**
1. Receive customer request (phone, email, walk-in)
2. Create or select existing customer
3. Enter shipment details:
   - Pickup address
   - Delivery address
   - Parcel details (weight, dimensions, value)
   - Special instructions
   - Priority level
4. Upload documents (optional)
5. Create the job
6. Provide tracking ID to customer

**Tools Used:**
- Jobs page → "Create New Job" button
- Customer management
- Document upload

---

### **Step 2: Driver Assignment** 🚗
**Who:** Admin or Warehouse Manager  
**Role:** `admin` or `warehouse`

**What They Do:**
1. View pending collection jobs
2. Assign drivers based on:
   - Location/route
   - Availability
   - Capacity
3. Job status → "Assigned"

**Tools Used:**
- Jobs page → Assign driver action
- Driver management

---

### **Step 3: Collection** 📦
**Who:** Driver  
**Role:** `driver`

**What They Do:**
1. View assigned collections
2. Navigate to pickup address
3. Collect parcel
4. Update status → "Collected"
5. Transport to warehouse
6. Update status → "At Warehouse" or "Returning to Warehouse"

**Tools Used:**
- Driver Dashboard
- Jobs page (assigned jobs only)
- Status updates

---

### **Step 4: Warehouse Processing** 🏭
**Who:** Warehouse Manager  
**Role:** `warehouse`

**What They Do:**
1. Receive parcels from drivers
2. Inspect and verify parcels
3. Update status → "At Warehouse" or "arrived_at_hub"
4. Organize by destination
5. Create batches when enough parcels accumulated
6. Assign batch to carrier
7. Update batch status → "Shipped"
8. All jobs in batch → "batched" → "shipped"

**Tools Used:**
- Warehouse Dashboard
- Batch Management
- Job status updates

---

### **Step 5: Delivery Assignment** 🚚
**Who:** Admin or Warehouse Manager  
**Role:** `admin` or `warehouse`

**What They Do:**
1. When batch arrives at destination
2. Assign delivery agents to jobs
3. Update status → "Out for Delivery"

**Tools Used:**
- Jobs page
- Delivery assignment

---

### **Step 6: Final Delivery** 📮
**Who:** Delivery Agent  
**Role:** `delivery-agent`

**What They Do:**
1. View assigned deliveries
2. Call customer to confirm
3. Navigate to delivery address
4. Deliver parcel
5. Collect signature/proof
6. Upload proof of delivery
7. Update status → "Delivered"

**Tools Used:**
- Delivery Dashboard
- Jobs page (assigned deliveries only)
- Proof of delivery upload

---

### **Step 7: Invoicing** 💰
**Who:** Finance Manager  
**Role:** `finance`

**What They Do:**
1. View delivered jobs
2. Create invoices for customers
3. Send invoices
4. Track payments
5. Mark invoices as paid
6. Generate financial reports

**Tools Used:**
- Finance Dashboard
- Invoice Management
- Reports

---

## 👥 Essential Users You Need

### **Minimum Team (for basic operations):**

1. **1 × Superadmin/Admin**
   - System setup and management
   - User invitation
   - Overall oversight

2. **1 × Customer Service**
   - **Creates all jobs** ← First job creator
   - Customer management
   - Job booking
   - Customer support

3. **1 × Warehouse Manager**
   - Receives parcels
   - Creates batches
   - Assigns drivers/agents

4. **1 × Driver**
   - Collects parcels
   - Transports to warehouse

5. **1 × Delivery Agent**
   - Final delivery
   - Proof of delivery

6. **1 × Finance**
   - Invoicing
   - Payment tracking

---

## 🚀 Recommended Team Setup

### **Small Operation (5-10 shipments/day):**

| Role | Count | Purpose |
|------|-------|---------|
| **Superadmin** | 1 | System management |
| **Customer Service** | 1-2 | Job creation, customer support |
| **Warehouse** | 1 | Parcel processing, batching |
| **Driver** | 1-2 | Collections |
| **Delivery Agent** | 1-2 | Final deliveries |
| **Finance** | 1 | Invoicing, payments |
| **Total** | 7-9 users |

### **Medium Operation (50+ shipments/day):**

| Role | Count | Purpose |
|------|-------|---------|
| **Superadmin** | 1 | System management |
| **Admin** | 1-2 | Operations management |
| **Customer Service** | 3-5 | Job creation, customer support |
| **Warehouse** | 2-3 | Shifts, parcel processing |
| **Driver** | 5-10 | Collections across areas |
| **Delivery Agent** | 5-10 | Final deliveries |
| **Finance** | 2 | Invoicing, collections |
| **Total** | 19-33 users |

---

## 📝 Initial Setup Sequence

### **Day 1: System Setup**

1. **Create Superadmin** (via API/Swagger)
   ```
   POST /api/auth/create-superadmin
   Email: admin@bestdeal.com
   ```

2. **Login as Superadmin**
   ```
   POST /api/auth/login
   ```

3. **Invite Customer Service Rep** (first job creator)
   ```
   POST /api/auth/send-invite
   Email: support@bestdeal.com
   Role: customer-service
   ```

4. **Invite Other Team Members**
   - Warehouse Manager
   - Drivers
   - Delivery Agents
   - Finance Manager

5. **Each user accepts invitation**
   ```
   POST /api/auth/accept-invite/{token}
   ```

---

### **Day 1: First Job Creation**

6. **Customer Service logs in**
7. **Creates first customer** (if not exists)
8. **Creates first job:**
   - Pickup address
   - Delivery address
   - Parcel details
   - Priority
9. **Job created!** → Tracking ID generated

---

## 🎭 User Personas & Typical Day

### **1. Sarah - Customer Service Rep** 🎧
**Role:** `customer-service`

**Morning:**
- Check emails for new shipment requests
- Create jobs for new bookings
- Update customer information
- Answer customer inquiries

**Throughout Day:**
- Process walk-in customers
- Create jobs in real-time
- Provide tracking IDs
- Handle customer calls

---

### **2. Mike - Warehouse Manager** 🏭
**Role:** `warehouse`

**Morning:**
- Review jobs ready for batching
- Check yesterday's collections
- Plan batch destinations

**Throughout Day:**
- Receive parcels from drivers
- Verify and inspect
- Update status to "At Warehouse"
- Create batches by destination
- Assign batches to carriers

**Evening:**
- Ship prepared batches
- Update batch status
- Prepare for tomorrow

---

### **3. Tom - Driver** 🚗
**Role:** `driver`

**Morning:**
- Check assigned collections
- Plan route
- Load vehicle

**Throughout Day:**
- Navigate to pickup addresses
- Collect parcels
- Update status to "Collected"
- Transport to warehouse
- Get new assignments

---

### **4. Emma - Delivery Agent** 📮
**Role:** `delivery-agent`

**Morning:**
- Review assigned deliveries
- Call customers to confirm
- Plan delivery route

**Throughout Day:**
- Navigate to delivery addresses
- Deliver parcels
- Collect signatures
- Upload proof of delivery
- Update status to "Delivered"

---

### **5. David - Finance Manager** 💰
**Role:** `finance`

**Weekly Tasks:**
- Create invoices for delivered jobs
- Send invoices to customers
- Track payments
- Mark invoices as paid
- Follow up on overdue invoices
- Generate financial reports

---

### **6. Admin - System Administrator** 🛡️
**Role:** `admin` or `superadmin`

**Ongoing:**
- Invite new team members
- Manage user accounts
- Monitor system performance
- Handle escalations
- View all data
- Generate reports
- Configure settings

---

## 📊 Who Can Do What?

### **Create Jobs:**
```
Superadmin ✅
Admin ✅
Customer Service ✅  ← Primary job creator
Finance ❌
Warehouse ❌
Driver ❌
Delivery Agent ❌
User ❌
```

### **Create Customers:**
```
Superadmin ✅
Admin ✅
Customer Service ✅
Finance ❌
Warehouse ❌
Driver ❌
Delivery Agent ❌
User ❌
```

### **Create Batches:**
```
Superadmin ✅
Admin ✅
Warehouse ✅
Others ❌
```

### **Create Invoices:**
```
Superadmin ✅
Admin ✅
Finance ✅
Others ❌
```

### **Update Job Status:**
```
Superadmin ✅
Admin ✅
Warehouse ✅
Driver ✅ (assigned jobs only)
Delivery Agent ✅ (assigned jobs only)
Customer Service ❌
Finance ❌
User ❌
```

---

## 🎯 Typical First Week Setup

### **Monday:**
1. Create superadmin
2. Invite customer service rep
3. Customer service creates first 5 customers
4. Customer service creates first 10 jobs

### **Tuesday:**
1. Invite warehouse manager
2. Invite 2 drivers
3. Admin assigns drivers to jobs
4. Drivers collect first parcels

### **Wednesday:**
1. Warehouse receives parcels
2. Creates first batch
3. Ships batch

### **Thursday:**
1. Invite delivery agents
2. Batch arrives at destination
3. Assign delivery agents
4. Complete first deliveries

### **Friday:**
1. Invite finance manager
2. Finance creates invoices for delivered jobs
3. Send invoices to customers

---

## 💼 Real-World Scenario

### **Scenario: Customer Wants to Ship a Package**

**Step 1: Customer Calls** ☎️
```
Customer: "I need to ship a package from New York to London"
```

**Step 2: Customer Service (Sarah) Takes Order** 📝
```
Sarah logs into system:
1. Creates/selects customer record
2. Enters pickup address: New York
3. Enters delivery address: London
4. Parcel details: 5kg, $500 value
5. Priority: Express
6. Creates job
7. Provides tracking ID: SE001234
```

**Step 3: Admin Assigns Driver** 🚗
```
Admin:
1. Views pending jobs
2. Assigns Tom (driver) to SE001234
3. Tom receives notification
```

**Step 4: Tom Collects Package** 📦
```
Tom:
1. Views assigned job SE001234
2. Drives to New York address
3. Collects package
4. Updates status: "Collected"
5. Returns to warehouse
```

**Step 5: Warehouse Processes** 🏭
```
Mike (Warehouse):
1. Receives package from Tom
2. Inspects package
3. Updates status: "At Warehouse"
4. Groups with other London-bound packages
5. Creates batch: BATCH-001
6. Ships batch to London
```

**Step 6: Delivery in London** 📮
```
Emma (Delivery Agent):
1. Batch arrives in London
2. Admin assigns SE001234 to Emma
3. Emma calls customer
4. Delivers package
5. Uploads proof of delivery
6. Updates status: "Delivered"
```

**Step 7: Finance Invoices** 💰
```
David (Finance):
1. Views delivered jobs
2. Creates invoice for SE001234
3. Sends to customer
4. Customer pays
5. Marks invoice as "Paid"
```

---

## 🎯 Answer to Your Questions:

### **Who creates the first job?**
**Customer Service Representative**

**Why?**
- They interact with customers
- They gather shipment details
- They have job creation permissions
- They are the customer-facing team

### **What users do you need minimally?**

**Essential 4 Roles:**
1. **Superadmin/Admin** (1) - System setup
2. **Customer Service** (1) - **Creates jobs** ← First job creator
3. **Warehouse** (1) - Processes and batches
4. **Driver** (1) - Collects parcels

**For Full Operations:**
5. **Delivery Agent** (1) - Final delivery
6. **Finance** (1) - Invoicing

---

## 🏃 Quick Start for Testing

### **Option 1: Use Existing Test Accounts**

Already seeded in your database:
```
✅ Warehouse:  warehouse@bestdeal.com / warehouse123
✅ Driver:     driver@bestdeal.com / driver123
✅ Delivery:   delivery@bestdeal.com / delivery123
✅ Finance:    finance@bestdeal.com / finance123
✅ Support:    support@bestdeal.com / support123
```

**Missing:**
- ⚠️ Customer Service (can create jobs)
- ⚠️ Admin/Superadmin (full access)

---

### **Option 2: Create Missing Users**

**1. Create Superadmin:**
```
POST /api/auth/create-superadmin
{
  "email": "admin@bestdeal.com",
  "password": "111111@1A",
  "name": "System Administrator"
}
```

**2. Login as Superadmin, then invite Customer Service:**
```
POST /api/auth/send-invite
{
  "email": "cs@bestdeal.com",
  "role": "customer-service"
}
```

**3. Customer Service accepts invite and logs in**

**4. Customer Service creates first job!** ✅

---

## 📊 User Role Summary

| Role | Primary Function | Creates Jobs? | Dashboard |
|------|-----------------|---------------|-----------|
| **Superadmin** | System management | ✅ Yes | Generic |
| **Admin** | Operations management | ✅ Yes | Generic |
| **Customer Service** | **Job creation, customer support** | ✅ **Yes** ← **Primary** | Generic |
| **Finance** | Invoicing, payments | ❌ No | Finance Dashboard |
| **Warehouse** | Batching, processing | ❌ No | Warehouse Dashboard |
| **Driver** | Collection, transport | ❌ No | Driver Dashboard |
| **Delivery Agent** | Final delivery | ❌ No | Delivery Dashboard |
| **User** | Basic access | ❌ No | Generic (read-only) |

---

## 🎬 Recommended First Actions

### **If Starting Fresh:**

1. **Create Superadmin**
   ```bash
   Use Swagger: http://localhost:4001/api/docs
   Endpoint: POST /api/auth/create-superadmin
   ```

2. **Run Seed Script** (if not already done)
   ```bash
   cd backend
   node prisma/seed.js
   ```
   This creates:
   - All 8 roles with permissions
   - 5 test users (warehouse, driver, delivery, finance, support)

3. **Create Customer Service User**
   - Login as superadmin
   - Invite customer-service user
   - They will create the first job

4. **Create First Customer**
   - Login as customer-service
   - Create a customer

5. **Create First Job**
   - Click "New Job" button
   - Fill in details
   - Submit

---

## 🔑 Current Test Account Status

**Already Seeded:**
- ✅ Warehouse Manager
- ✅ Driver
- ✅ Delivery Agent
- ✅ Finance Manager
- ✅ Customer Support ← Has customer-service role!

**Wait!** Let me check the support user role...

Looking at your seed file, `support@bestdeal.com` has role `customer-service`, so:

### **You Already Have a Job Creator!** ✅

**Login as:**
```
Email: support@bestdeal.com
Password: support123
Role: customer-service
```

**This user CAN create jobs!**

---

## 🎯 To Create Your First Job Right Now:

1. **Login:**
   ```
   Email: support@bestdeal.com
   Password: support123
   ```

2. **You'll see menu:**
   - Dashboard
   - Jobs ✅
   - Customers ✅
   - Track Shipment

3. **Go to Jobs page**

4. **Click "New Job" or "Create New Job"**

5. **Fill in:**
   - Customer (create new or select existing)
   - Pickup address
   - Delivery address
   - Parcel details
   - Upload documents (optional)

6. **Submit** → First job created! 🎉

---

## 📋 Summary

**Who Creates First Job:**
- **Customer Service** (support@bestdeal.com / support123) ✅

**You already have this user!** Just login and create a job.

**The workflow is:**
```
Customer Service → Creates Job
    ↓
Admin/Warehouse → Assigns Driver
    ↓
Driver → Collects Parcel
    ↓
Warehouse → Batches & Ships
    ↓
Delivery Agent → Delivers
    ↓
Finance → Invoices
```

**Start with the support@bestdeal.com account and create your first job!** 🚀

