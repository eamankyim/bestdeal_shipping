# 📦 Batch & Job Status Mapping Guide

## Overview

When you update a batch status, **all jobs in that batch are automatically updated** to corresponding job statuses.

---

## 🔄 Batch → Job Status Mapping

| Batch Status | Jobs Updated To | What It Means |
|--------------|-----------------|---------------|
| **In Preparation** | `batched` | Jobs are grouped, ready to ship |
| **Shipped** | `shipped` | Batch departed, jobs on vessel/flight |
| **In Transit** | `in_transit` | Batch traveling to destination |
| **Arrived** | `arrived_at_destination` | Batch reached destination warehouse |
| **Distributed** | `out_for_delivery` | Jobs assigned to delivery agents |

---

## 📋 How It Works:

### **Scenario: You mark batch as "Arrived"**

**Before:**
```
Batch: In Transit
Job 1: in_transit
Job 2: in_transit
Job 3: in_transit
```

**You Click:** [Mark as Arrived]

**After (Automatic):**
```
Batch: Arrived ✅
Job 1: arrived_at_destination ✅
Job 2: arrived_at_destination ✅
Job 3: arrived_at_destination ✅
```

**Backend automatically:**
- ✅ Updates batch status
- ✅ Updates ALL jobs in batch to new status
- ✅ Creates timeline entries for each job
- ✅ Records who made the change

---

## 🎯 Complete Workflow:

### **1. Jobs Added to Batch:**
```
Action: Warehouse creates batch
Batch Status: In Preparation
Job Status: batched
```

### **2. Batch Ships:**
```
Action: Click "Mark as Shipped"
Batch Status: Shipped
Job Status: shipped ← Auto-updated!
Timeline: "Batch BATCH-001 shipped"
```

### **3. Batch In Transit:**
```
Action: Click "Mark as In Transit"
Batch Status: In Transit
Job Status: in_transit ← Auto-updated!
Timeline: "Batch BATCH-001 in transit"
```

### **4. Batch Arrives:**
```
Action: Click "Mark as Arrived"
Batch Status: Arrived
Job Status: arrived_at_destination ← Auto-updated!
Timeline: "Batch BATCH-001 arrived at destination"
```

### **5. Batch Distributed:**
```
Action: Click "Mark as Distributed"
Batch Status: Distributed
Job Status: out_for_delivery ← Auto-updated!
Timeline: "Batch BATCH-001 distributed for delivery"
```

---

## 📊 What Updates Automatically:

When you update batch status, the system automatically:

1. ✅ **Updates Batch** in `batches` table
2. ✅ **Updates ALL Jobs** in that batch
3. ✅ **Creates Timeline Entries** for each job
4. ✅ **Records User** who made the update
5. ✅ **Adds Timestamp** for audit trail
6. ✅ **Sends Notifications** to relevant users

---

## 💡 Important Points:

### **Cascading Updates:**
- When you change a batch, you change ALL jobs inside it
- No need to manually update each job
- Maintains consistency across the batch

### **Timeline Tracking:**
- Every job gets a timeline entry
- Shows when status changed
- Shows who changed it (batch update)
- Shows reason (batch status change)

### **Cannot Undo:**
- Once batch is shipped, you can't edit it
- Status only moves forward
- Jobs progress together as a batch

---

## 🚫 Status Restrictions:

### **Batch Status "Shipped" or Later:**
- ❌ Cannot edit batch details
- ❌ Cannot add/remove jobs
- ❌ Cannot change destination
- ✅ Can only progress status forward

### **Why?**
- Physical batch already dispatched
- Jobs physically together on vessel/flight
- Changing would cause inconsistencies

---

## 🔍 Example with Your Current Batch:

**Your Batch:** BATCH-MGZVJTP6-R35W  
**Current Batch Status:** Distributed  
**Contains:** 1 job (SHIP-20251021-2G1A5)

**What Happened:**
```
1. Batch created → Job: batched
2. Marked as Shipped → Job: shipped
3. Marked as In Transit → Job: in_transit
4. Marked as Arrived → Job: arrived_at_destination
5. Marked as Distributed → Job: out_for_delivery
```

**Current State:**
```
Batch: Distributed (final)
Job SHIP-20251021-2G1A5: out_for_delivery
```

**Next Step:**
```
Delivery agent needs to:
1. Find job in their dashboard
2. Deliver to customer
3. Mark as "Delivered"
```

---

## 📝 Job Status Progression:

### **Before Batching (Driver Phase):**
```
assigned → collected → in_transit → arrived_at_warehouse
```

### **After Batching (Batch-Controlled):**
```
batched → shipped → in_transit → arrived_at_destination → out_for_delivery
```

### **Final Delivery (Delivery Agent):**
```
out_for_delivery → delivered
```

---

## 🎯 Who Updates What:

| Action | Who | Affects |
|--------|-----|---------|
| Create batch | Warehouse | Batch + Jobs (batched) |
| Mark as Shipped | Warehouse | Batch + Jobs (shipped) |
| Mark as In Transit | Warehouse/Admin | Batch + Jobs (in_transit) |
| Mark as Arrived | Destination Warehouse | Batch + Jobs (arrived_at_destination) |
| Mark as Distributed | Destination Warehouse | Batch + Jobs (out_for_delivery) |
| Mark as Delivered | Delivery Agent | Individual Job only |

---

## 🔔 Notifications:

When batch status updates:
- ✅ Job status updates trigger notifications
- ✅ Assigned delivery agents get notified
- ✅ Admins get notified for major milestones
- ✅ Each job update creates timeline entry

---

## 💻 Backend Code:

### **Status Update Logic:**
```javascript
switch (batchStatus) {
  case 'Shipped':
    jobStatus = 'shipped'
    break;
  case 'In Transit':
    jobStatus = 'in_transit'
    break;
  case 'Arrived':
    jobStatus = 'arrived_at_destination'
    break;
  case 'Distributed':
    jobStatus = 'out_for_delivery'
    break;
}

// Update all jobs in batch
await prisma.job.updateMany({
  where: { batchId: batchId },
  data: { status: jobStatus }
});
```

---

## ✅ Summary:

**How Batch Status Affects Job Statuses:**

1. **Automatic Synchronization** - Jobs automatically follow batch status
2. **Bulk Updates** - One batch update = all jobs updated
3. **Timeline Tracking** - Each job gets timeline entry
4. **Consistency** - All jobs in batch have same status
5. **Notifications** - Relevant users notified of changes

**Your current batch (Distributed)** means all jobs are now **"out_for_delivery"** and ready for delivery agents to deliver!

---

## 🚀 Next Steps for Your Batch:

**Current State:**
- Batch: Distributed
- Jobs: out_for_delivery

**What to Do:**
1. Login as Delivery Agent
2. View the job in their dashboard
3. Deliver to customer
4. Mark as "Delivered"
5. Job status: delivered (final!)

---

**The batch and job statuses are now fully synchronized and working together!** 🎉


