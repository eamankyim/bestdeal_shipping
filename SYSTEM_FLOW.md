# ShipEASE System Flow - Job-Centric Architecture

## Overview

ShipEASE uses a **Job-Centric architecture** where a **Job** represents a single shipment from creation to delivery. Jobs flow through different statuses as they move through the system.

**Key Principle:** `Job = Parcel = Shipment` (One entity, multiple status updates)

---

## Complete Job Lifecycle (12-Status Flow)

```
1. Pending Collection
   ↓
2. Assigned
   ↓
3. En Route to Customer
   ↓
4. Collected
   ↓
5. Returning to Warehouse
   ↓
6. At Warehouse
   ↓
7. Batched
   ↓
8. Shipped
   ↓
9. In Transit
   ↓
10. Arrived at Destination
   ↓
11. Out for Delivery
   ↓
12. Delivered
```

---

## Detailed Workflow

### **1. Job Creation** 📝
**Where:** Jobs Page  
**Who:** Admin / Customer Service  
**What Happens:**
- Customer details entered (existing or new customer)
- Package details recorded
- Pickup and delivery addresses set
- Job ID generated (e.g., `SE001234`)
- Tracking ID generated (e.g., `TRK001234`)
- Initial status: **"Pending Collection"**

**Data Created:**
```javascript
{
  jobId: 'SE001234',
  trackingId: 'TRK001234',
  customerId: 123,
  customer: 'John Smith',
  pickupAddress: '123 Main St, London',
  deliveryAddress: '456 Oak Ave, Accra, Ghana',
  packageType: 'Box',
  weight: 2.5,
  value: 1500,
  priority: 'High',
  status: 'Pending Collection',
  createdAt: '2025-01-20',
  assignedDriver: null,
  batchId: null
}
```

---

### **2. Driver Assignment** 👤
**Where:** Jobs Page / Dashboard  
**Who:** Admin / Dispatch Manager  
**What Happens:**
- Job assigned to a driver
- Driver receives notification
- Status: **"Assigned to Driver"**

---

### **3. Driver Collection Process** 🚗
**Where:** Driver Dashboard  
**Who:** Driver  

**Step 3a: Start Journey**
- Driver sees jobs with status "Assigned"
- Clicks "Start Journey" button
- Status updated to: **"En Route to Customer"**
- Customer can see "Driver is on the way"

**Step 3b: Pickup**
- Driver arrives at pickup location
- Clicks "Confirm Pickup" button
- Opens collection modal:
  - Takes photos
  - Gets customer signature
  - Notes package condition
- Confirms collection
- Status updated to: **"Collected"**

**Step 3c: Return to Warehouse**
- Driver brings package to warehouse
- Clicks "Confirm Drop-off" button
- Status updated to: **"Returning to Warehouse"**
- Job appears in Warehouse "Awaiting Confirmation" table

**Driver Dashboard Shows:**
- Jobs assigned to driver
- Different action buttons based on status:
  - Assigned → "Start Journey" button
  - En Route to Customer → "Confirm Pickup" button
  - Collected → "Confirm Drop-off" button
- Contact customer info
- Scheduled times

---

### **4. Warehouse Receipt** 📦
**Where:** Warehouse Dashboard  
**Who:** Warehouse Staff  
**What Happens:**
- Driver brings collected jobs to warehouse
- Driver has already marked as "Returning to Warehouse"
- Warehouse staff scans Job ID / Tracking ID
- System fetches job details automatically
- Staff inspects package condition
- Verifies actual weight vs declared weight
- Records storage location
- Confirms receipt
- Status updated to: **"At Warehouse"**

**Warehouse Dashboard Shows:**
- **Table 1:** Jobs returning to warehouse - awaiting confirmation (status: "Returning to Warehouse")
  - These are jobs driver already confirmed bringing
  - Button: "Confirm Job Receipt"
- **Table 2:** Jobs at warehouse ready for batching (status: "At Warehouse")
  - These jobs are confirmed and ready to be added to batches

**Confirmation Modal:**
- Scan Job ID (auto-fetches job details)
- Assess package condition (Excellent/Good/Fair/Damaged)
- Verify actual weight
- Add storage location (optional)
- Warehouse notes

---

### **5. Batch Creation** 📋
**Where:** Batch Management Page  
**Who:** Warehouse Staff / Operations  
**What Happens:**
- Staff clicks "Create New Batch"
- Enters batch details:
  - Batch name (e.g., "Accra Express Batch Jan 2025")
  - Route (London → Accra)
  - Vessel/Flight (MS Sea Express or BA Flight 123)
  - Departure date
  - ETA
  - Container number (optional)
- **Selects jobs** using checkboxes in embedded table
  - Only shows jobs with status "At Warehouse"
  - Real-time statistics update as you select:
    - Selected Jobs count
    - Total Weight
    - Total Value
- Adds batch notes (optional)
- Clicks "Create Batch"
- **Backend actions:**
  - Creates batch with status "In Preparation"
  - Updates all selected jobs' status to **"Batched"**
  - Assigns `batchId` to all selected jobs
  - Jobs removed from "At Warehouse" list

**Batch Management Shows:**
- Batches table with "Ship Batch" button
- Create batch modal with integrated job selection
- Batch statuses:
  - In Preparation
  - Ready to Ship
  - Shipped ← NEW!
  - In Transit
  - Arrived
  - Distributed

**Ship Batch Feature (NEW):**
- Batches in "In Preparation" or "Ready to Ship" show "Ship Batch" button
- Clicking it:
  - Updates batch status to **"Shipped"**
  - Updates all jobs in batch to **"Shipped"**
  - Records actual departure timestamp

---

### **6. Shipping** 🚢✈️
**Where:** Batch Management Page  
**Who:** Operations / Logistics Coordinator  

**Step 6a: Ship Batch**
- Operations clicks "Ship Batch" button
- Confirms shipping action
- Batch status updated to: **"Shipped"**
- All jobs in batch updated to: **"Shipped"**
- Departure timestamp recorded

**Step 6b: In Transit**
- When vessel/flight actually departs
- Batch status updated to: **"In Transit"**
- All jobs updated to: **"In Transit"**
- Real-time tracking begins
- Customers can track vessel/flight progress

**Batch Statuses:**
- "In Preparation" → Creating batch, adding jobs
- "Ready to Ship" → Batch complete, waiting for vessel
- "Shipped" → Loaded and departed
- "In Transit" → Currently on sea/air journey

---

### **7. Arrival** 📍
**Where:** Batch Management  
**Who:** Warehouse Staff (Ghana)  
**What Happens:**
- Batch arrives at destination
- Jobs unloaded from batch
- Jobs distributed to delivery agents
- Jobs status updated to: **"Arrived"**

---

### **8. Final Delivery** 🏠
**Where:** Delivery Agent Dashboard  
**Who:** Delivery Agent (Ghana)  
**What Happens:**
- Delivery agent receives jobs from arrived batch
- Travels to customer delivery address
- Delivers package
- Gets proof of delivery (photos, signature)
- Confirms delivery
- Status updated to: **"Out for Delivery"** → **"Delivered"**

---

## Status Flow Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        JOB STATUS FLOW (12 Statuses)                        │
└─────────────────────────────────────────────────────────────────────────────┘

📋 COLLECTION STAGE:
1. Pending Collection        → Job created, awaiting driver assignment
2. Assigned                  → Driver assigned, ready to start
3. En Route to Customer      → Driver traveling to pickup location
4. Collected                 → Package collected from customer

🏭 WAREHOUSE STAGE:
5. Returning to Warehouse    → Driver bringing package to warehouse
6. At Warehouse              → Warehouse confirmed receipt, ready for batching

📦 BATCHING & SHIPPING STAGE:
7. Batched                   → Added to a shipping batch
8. Shipped                   → Batch departed on vessel/flight
9. In Transit                → Package on sea/air to destination

🚚 DELIVERY STAGE:
10. Arrived at Destination   → Package reached Ghana warehouse
11. Out for Delivery         → With delivery agent, en route to customer
12. Delivered                → Successfully delivered to customer
```

---

## Page Responsibilities

### **Jobs Page**
- ✅ Create new jobs
- ✅ View all jobs (all statuses)
- ✅ Filter by status
- ✅ Assign to drivers
- ✅ Track job progress
- ❌ Does NOT create separate parcels/products

### **Driver Dashboard**
- ✅ View assigned jobs (status: "Assigned to Driver")
- ✅ Update status to "Collected"
- ✅ Upload collection photos
- ✅ Get customer signatures
- ❌ Does NOT see warehouse operations

### **Warehouse Dashboard**
- ✅ View collected jobs (status: "Collected")
- ✅ Confirm job receipt → changes status to "At Warehouse"
- ✅ Inspect package condition
- ✅ Verify weight
- ✅ View jobs at warehouse (status: "At Warehouse")
- ❌ Does NOT create new products/parcels
- ❌ Does NOT create batches (that's in Batch Management)

### **Batch Management Page**
- ✅ View existing batches
- ✅ Create new batches
- ✅ Select jobs for batch (only jobs with status "At Warehouse")
- ✅ Update selected jobs' status to "Batched"
- ✅ Track batch progress
- ❌ Does NOT work with "parcels" - only with Jobs

### **Delivery Agent Dashboard**
- ✅ View jobs from arrived batches
- ✅ Update status to "Out for Delivery"
- ✅ Confirm delivery → status to "Delivered"
- ✅ Upload proof of delivery
- ❌ Does NOT see UK operations

---

## Database Schema (Simplified)

### **Jobs Table**
```sql
CREATE TABLE jobs (
  id INT PRIMARY KEY,
  job_id VARCHAR(50) UNIQUE,      -- SE001234
  tracking_id VARCHAR(50) UNIQUE,  -- TRK001234
  customer_id INT,
  pickup_address TEXT,
  delivery_address TEXT,
  package_type VARCHAR(50),
  weight DECIMAL(10,2),
  value DECIMAL(10,2),
  priority VARCHAR(20),
  status VARCHAR(50),              -- Current status
  assigned_driver_id INT,
  batch_id INT NULL,               -- NULL until batched
  storage_location VARCHAR(50),
  package_condition VARCHAR(20),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### **Batches Table**
```sql
CREATE TABLE batches (
  id INT PRIMARY KEY,
  batch_id VARCHAR(50) UNIQUE,     -- BATCH001
  name VARCHAR(200),
  route VARCHAR(200),
  vessel VARCHAR(100),
  departure_date DATE,
  eta DATE,
  status VARCHAR(50),
  total_jobs INT,                  -- Count of jobs
  total_weight DECIMAL(10,2),
  total_value DECIMAL(10,2),
  container_number VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP
);
```

### **Job Status History** (Optional but recommended)
```sql
CREATE TABLE job_status_history (
  id INT PRIMARY KEY,
  job_id INT,
  status VARCHAR(50),
  updated_by INT,                  -- User who made the change
  notes TEXT,
  timestamp TIMESTAMP
);
```

---

## API Endpoints

### **Jobs**
```
GET    /api/jobs                    # List all jobs
GET    /api/jobs?status=Collected   # Filter by status
POST   /api/jobs                    # Create new job
GET    /api/jobs/:id                # Get job details
PUT    /api/jobs/:id                # Update job
PUT    /api/jobs/:id/status         # Update job status
DELETE /api/jobs/:id                # Delete job
```

### **Batches**
```
GET    /api/batches                 # List all batches
POST   /api/batches                 # Create batch (includes job IDs)
GET    /api/batches/:id             # Get batch details
PUT    /api/batches/:id             # Update batch
GET    /api/batches/:id/jobs        # Get all jobs in a batch
```

### **Warehouse**
```
POST   /api/warehouse/confirm-receipt  # Confirm job receipt
GET    /api/warehouse/collected-jobs   # Jobs awaiting confirmation
GET    /api/warehouse/jobs             # Jobs at warehouse
```

---

## Data Flow Examples

### **Example 1: Creating a Job and Batching It**

```javascript
// Step 1: Create Job (Jobs Page)
POST /api/jobs
{
  customerId: 123,
  pickupAddress: "London",
  deliveryAddress: "Accra",
  weight: 2.5,
  value: 1500,
  priority: "High"
}

Response:
{
  jobId: "SE001234",
  trackingId: "TRK001234",
  status: "Pending Collection"
}

// Step 2: Assign Driver
PUT /api/jobs/SE001234
{
  assignedDriver: 5,
  status: "Assigned to Driver"
}

// Step 3: Driver Collects
PUT /api/jobs/SE001234/status
{
  status: "Collected",
  collectionPhotos: [...],
  signature: "..."
}

// Step 4: Warehouse Confirms
PUT /api/jobs/SE001234/status
{
  status: "At Warehouse",
  packageCondition: "excellent",
  actualWeight: 2.5,
  storageLocation: "Shelf A3"
}

// Step 5: Create Batch with Multiple Jobs
POST /api/batches
{
  name: "Accra Express Batch",
  route: "London → Accra",
  vessel: "MS Sea Express",
  departureDate: "2025-01-25",
  eta: "2025-02-10",
  jobs: ["SE001234", "SE001235", "SE001236"]  // Multiple job IDs
}

Response:
{
  batchId: "BATCH001",
  totalJobs: 3,
  // Backend automatically updates these jobs:
  // - status → "Batched"
  // - batchId → "BATCH001"
}
```

---

## Benefits of This Architecture

### ✅ **Single Source of Truth**
- One record per shipment
- No duplicate data
- Clear audit trail

### ✅ **Status-Driven Workflow**
- Each page shows jobs filtered by status
- Automatic workflow progression
- Easy to track where jobs are stuck

### ✅ **Better Customer Experience**
- One tracking ID from start to finish
- Complete journey visibility
- Real-time status updates

### ✅ **Simplified Backend**
- One main table (Jobs)
- Status transitions clearly defined
- Easier to maintain and scale

### ✅ **Reporting & Analytics**
- Count jobs by status
- Track time at each stage
- Identify bottlenecks
- Performance metrics per driver/warehouse

---

## Key Differences from Old System

### **OLD System (Multiple Entities):**
```
Jobs Table ─┐
            ├──❌ Separate entities, duplicate data
Parcels Table ─┘
```

### **NEW System (Unified):**
```
Jobs Table
  ├─ Status: Pending Collection
  ├─ Status: Collected  
  ├─ Status: At Warehouse  ← Shows in Warehouse Dashboard
  ├─ Status: Batched      ← Included in Batch
  └─ Status: Delivered
```

---

## Implementation Checklist

### **Backend Requirements:**

- [ ] Jobs table with `status` field
- [ ] Jobs table with `batch_id` field (nullable)
- [ ] API endpoint to filter jobs by status
- [ ] API endpoint to update job status
- [ ] When batch is created:
  - [ ] Update all selected jobs' `status` to "Batched"
  - [ ] Assign `batch_id` to all selected jobs
- [ ] Status transition validation (can't skip statuses)

### **Frontend Updates Completed:**

- [x] Jobs Page creates jobs with customer selection
- [x] Warehouse Dashboard confirms job receipt (not creating products)
- [x] Batch Management works with jobs (not parcels)
- [x] Removed duplicate "Add Product" functionality
- [x] Updated all terminology (Product → Job)
- [x] Added scrollable modals with fixed buttons

---

## User Journeys

### **Admin Creating a Shipment:**
1. Go to Jobs Page
2. Click "New Job"
3. Radio button: Select existing customer OR create new customer
4. If existing: Select from dropdown
5. If new: Fill in customer details (auto-added to Customers table)
6. Enter job details (pickup/delivery addresses, package info)
7. Click "Create Job"
8. ✅ Customer (if new) added to Customers table
9. ✅ Job added to Jobs table with status "Pending Collection"

### **Driver Full Collection Flow:**
1. Open Driver Dashboard
2. See jobs with status "Assigned"
3. Click "Start Journey"
4. ✅ Job status → "En Route to Customer"
5. Navigate to pickup address
6. Arrive at location
7. Click "Confirm Pickup"
8. Take photos, get customer signature
9. Confirm collection
10. ✅ Job status → "Collected"
11. Travel to warehouse with package
12. Arrive at warehouse
13. Click "Confirm Drop-off"
14. ✅ Job status → "Returning to Warehouse"
15. ✅ Job appears in Warehouse "Awaiting Confirmation" table

### **Warehouse Receiving:**
1. Driver arrives at warehouse (already clicked "Confirm Drop-off")
2. Warehouse staff opens Warehouse Dashboard
3. Sees jobs in "Jobs Returning to Warehouse - Awaiting Confirmation" table
4. Clicks "Confirm Job Receipt" button
5. Scans Job ID (SE001234) in modal
6. System auto-fetches job details
7. Staff inspects package condition (Excellent/Good/Fair/Damaged)
8. Verifies actual weight
9. Records storage location (e.g., "Shelf A3")
10. Adds warehouse notes if needed
11. Clicks "Confirm Receipt"
12. ✅ Job status → "At Warehouse"
13. ✅ Job moves to "Ready for Batching" table
14. ✅ Job now available in Batch Management

### **Creating a Batch:**
1. Warehouse staff goes to Batch Management
2. Clicks "Create New Batch"
3. Modal opens with scrollable form
4. Enters batch info:
   - Name: "Accra Express Batch Jan 2025"
   - Route: London → Accra
   - Vessel: MS Sea Express (or BA Flight 123)
   - Departure date: Jan 25
   - ETA: Feb 10
   - Container number (optional)
5. **Scrolls down to job selection table**
6. Checks boxes next to jobs to include
7. Watches real-time statistics update:
   - Selected Jobs: 15
   - Total Weight: 45.2 kg
   - Total Value: £28,500
8. Adds batch notes (optional)
9. Clicks "Create Batch"
10. ✅ Batch created (ID: BATCH001, Status: "In Preparation")
11. ✅ All 15 selected jobs status → "Batched"
12. ✅ All 15 jobs assigned batchId: "BATCH001"
13. ✅ Jobs removed from available list

### **Shipping a Batch:**
1. Operations staff opens Batch Management
2. Sees batch with status "In Preparation"
3. When ready to ship, clicks "Ship Batch" button
4. Confirms shipping action
5. ✅ Batch status → "Shipped"
6. ✅ All jobs in batch → "Shipped"
7. ✅ Departure timestamp recorded
8. When vessel/flight actually in transit:
9. ✅ Batch status → "In Transit"
10. ✅ All jobs → "In Transit"

### **Customer Tracking:**
1. Customer goes to tracking page
2. Enters: TRK001234
3. Sees:
   - Current Status: "Batched"
   - Current Location: "London Warehouse"
   - Batch: BATCH001
   - Vessel: MS Sea Express
   - ETA: Feb 10, 2025
   - Timeline of all status changes

---

## Status Filtering (What Each Dashboard Shows)

| Dashboard | Shows Jobs With Status |
|-----------|------------------------|
| Jobs Page | ALL (with grouped status filters) |
| Driver Dashboard | "Assigned", "En Route to Customer", "Collected" |
| Warehouse Dashboard | "Returning to Warehouse" (table 1), "At Warehouse" (table 2) |
| Batch Management | "At Warehouse" (for job selection in batch creation) |
| Delivery Agent Dashboard | "Arrived at Destination", "Out for Delivery" |

---

## Important Notes

### **🔐 Data Integrity:**
- Jobs cannot skip statuses
- Status transitions should be validated on backend
- Each status change creates a history record
- Timestamps recorded for each transition

### **📊 Reporting:**
- Count jobs by status for dashboard statistics
- Calculate time spent at each stage
- Track driver/warehouse performance
- Monitor batch efficiency

### **🔄 Status Rollbacks:**
- If package damaged at warehouse → can roll back to "Pending Collection"
- If customer unavailable → "Out for Delivery" can go back to "Arrived"
- All rollbacks should be logged

### **📱 Customer Visibility:**
- Customers see their tracking ID
- Real-time status updates
- Batch information (when batched)
- Estimated delivery dates

---

## Future Enhancements

1. **Automated Status Updates:**
   - GPS tracking for drivers (auto-update when arrived)
   - Barcode scanning for warehouse (instant confirmation)
   - Vessel/flight API integration (auto-update transit status)

2. **Notifications:**
   - SMS/Email when status changes
   - Push notifications for drivers
   - Customer alerts at key milestones

3. **Analytics Dashboard:**
   - Average time per status
   - Bottleneck identification
   - Performance metrics
   - Predictive ETA calculations

---

**Last Updated:** October 10, 2025  
**Architecture:** Job-Centric (Unified)  
**Status:** Implemented in Frontend, Awaiting Backend Integration

