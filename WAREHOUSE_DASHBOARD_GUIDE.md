# 📦 Warehouse Dashboard Guide

## Overview

The Warehouse Dashboard is a specialized interface designed for warehouse managers to efficiently manage warehouse operations, track inventory, and create shipping batches.

---

## 🚀 Quick Access

**Login Credentials (Test Account):**
```
Email: warehouse@bestdeal.com
Password: warehouse123
```

**API Endpoint:**
```
GET /api/dashboard/warehouse
```

---

## 📊 Dashboard Sections

### 1. **Statistics Cards**

Four key metrics displayed at the top:

| Metric | Description |
|--------|-------------|
| **Jobs Ready for Batching** | Jobs that have arrived at the hub and are ready to be batched |
| **Jobs at Warehouse** | Jobs currently at the warehouse facility |
| **Total Batches** | Total number of batches created |
| **Unassigned Jobs** | Jobs pending collection without an assigned driver |

---

### 2. **Job Status Overview**

Visual progress bars showing:
- **Pending Collection** - Jobs waiting to be picked up
- **Collected** - Jobs collected by drivers
- **At Warehouse** - Jobs currently at warehouse
- **Batched** - Jobs grouped into shipping batches

---

### 3. **Batch Status Overview**

Track batch progress:
- **In Preparation** - Batches being prepared
- **Shipped** - Batches that have been shipped
- **In Transit** - Batches currently in transit
- **Arrived** - Batches that have reached destination

---

### 4. **Jobs Ready for Batching** 

**Key Features:**
- View all jobs with status "arrived_at_hub"
- See customer information
- Track weight and value totals
- Quick access to batch creation

**Columns Displayed:**
- Tracking ID
- Customer Name
- Weight (kg)
- Value ($)
- Current Status

**Summary Information:**
- Total number of jobs ready
- Combined weight of all jobs
- Combined value of all jobs

---

### 5. **Recent Batches**

**Shows:**
- Last 5 batches created
- Batch ID and destination
- Number of jobs in each batch
- Current status
- Creator information

**Batch Statuses:**
- 🟠 **In Preparation** - Being assembled
- 🔵 **Shipped** - Dispatched
- 🔷 **In Transit** - On the way
- 🟢 **Arrived** - Reached destination

---

### 6. **Recent Activity Timeline**

Real-time feed of warehouse activities:
- Job status updates
- Batch creation/updates
- User actions
- Timestamps for all events

**Color Coding:**
- 🟢 Green - Completed actions (batched, delivered)
- 🔵 Blue - In-progress actions (shipped, in transit)
- ⚪ Gray - Other status updates

---

### 7. **Jobs at Warehouse**

View jobs currently at your warehouse:
- Jobs with status "At Warehouse" or "Collected"
- Customer details
- Assigned driver information
- Quick view actions

---

## 🔄 Data Refresh

**Automatic Refresh:**
- Dashboard auto-refreshes every 60 seconds
- Ensures you always have the latest information

**Manual Refresh:**
- Simply reload the page for instant update

---

## 🎯 Key Actions

### Create a Batch
1. View jobs ready for batching section
2. Click **"Manage Batches"** button
3. Select jobs to batch
4. Enter batch details (destination, carrier, etc.)
5. Confirm batch creation

### View Job Details
1. Click **"View"** button next to any job
2. See complete job information
3. Update status if needed

### View All Jobs
1. Click **"View All Jobs"** button in header
2. Access complete job list with filtering

---

## 📈 Best Practices

### Daily Workflow:

1. **Morning:**
   - Check "Unassigned Jobs" metric
   - Review "Jobs at Warehouse" section
   - Plan batching operations

2. **Throughout Day:**
   - Monitor "Jobs Ready for Batching"
   - Create batches when enough jobs accumulated
   - Track "Recent Activity" for updates

3. **End of Day:**
   - Review "Batch Status Overview"
   - Ensure all batches are processed
   - Check for any stuck jobs

---

## 🔢 Understanding the Numbers

### Jobs Ready for Batching
- **Count:** Number of individual jobs
- **Total Weight:** Combined weight (helps with carrier selection)
- **Total Value:** Combined value (important for insurance)

### Job Status Metrics
- **Pending Collection:** Need driver assignment
- **Collected:** In transit to warehouse
- **At Warehouse:** Ready for processing
- **Batched:** Organized for shipping

---

## 🎨 Color Coding

### Status Colors:
- 🔵 **Blue** - Normal operations
- 🟢 **Green** - Completed/Success
- 🟠 **Orange** - In progress/Warning
- 🔴 **Red** - Urgent/Error
- 🟣 **Purple** - Batched

---

## 🚨 What to Watch For

### Alerts & Warnings:

1. **High Unassigned Jobs Count**
   - Indicates driver shortage
   - Action: Contact dispatch/admin

2. **Jobs Stuck at Warehouse**
   - Jobs not moving to "arrived_at_hub"
   - Action: Check with operations team

3. **Batches in Preparation Too Long**
   - Batches not being shipped
   - Action: Review batch details and carrier status

---

## 📱 Mobile Responsiveness

The warehouse dashboard is fully responsive:
- ✅ Desktop (full features)
- ✅ Tablet (optimized layout)
- ✅ Mobile (stacked views)

---

## 🔐 Permissions

As a warehouse user, you have access to:
- ✅ View all jobs
- ✅ Create and manage batches
- ✅ Update job status
- ✅ Assign drivers to jobs
- ✅ View warehouse statistics
- ✅ Access warehouse dashboard

You cannot:
- ❌ Delete jobs
- ❌ Manage users
- ❌ Access financial/invoice data
- ❌ Modify system settings

---

## 🐛 Troubleshooting

### Dashboard Not Loading?
1. Check internet connection
2. Verify you're logged in
3. Refresh the page
4. Check browser console for errors

### Data Showing Zero?
1. Ensure database has data
2. Run seed script if testing: `npm run seed`
3. Create some test jobs
4. Verify API endpoint is accessible

### Can't Create Batch?
1. Ensure jobs have "arrived_at_hub" status
2. Check you have necessary permissions
3. Verify at least one job is selected

---

## 📞 Support

For issues or questions:
1. Contact system administrator
2. Check API documentation: `http://localhost:4001/api/docs`
3. Review backend logs for errors

---

## 🔄 Integration with Other Features

### Connected Features:
- **Jobs Module** - View and update job details
- **Batches Module** - Full batch management
- **Driver Assignment** - Assign drivers to collections
- **Tracking** - Real-time shipment tracking

---

## 📚 Related Documentation

- **Backend API:** `/backend/src/controllers/dashboardController.js`
- **Frontend Component:** `/frontend/src/pages/WarehouseDashboard.jsx`
- **Roles & Permissions:** `/backend/ROLES_AND_PERMISSIONS.md`
- **API Docs:** `http://localhost:4001/api/docs`

---

**🎉 Your warehouse dashboard is now ready to use!**

Login with the warehouse test account and start managing your warehouse operations efficiently.

