# 🔔 Notification System Guide

## Overview

BestDeal Shipping has a comprehensive in-app notification system that alerts users about important events throughout the shipping workflow.

---

## ✅ What's Implemented

### **Backend:**
- ✅ Notification service
- ✅ Notification controller
- ✅ Notification routes
- ✅ Automatic notifications on job creation
- ✅ Automatic notifications on status changes
- ✅ Automatic notifications on driver assignment
- ✅ Automatic notifications on batch creation
- ✅ Role-based notification targeting

### **Frontend:**
- ✅ Notification bell component
- ✅ Real-time unread count
- ✅ Notification dropdown
- ✅ Mark as read functionality
- ✅ Clear all functionality
- ✅ Auto-refresh every 30 seconds
- ✅ Click to navigate to related entity

---

## 🔔 Notification Types

### 1. **Job Status** (`job_status`)
**Triggered when:** Job status changes  
**Who gets notified:**
- Assigned driver (if not the updater)
- Assigned delivery agent (if not the updater)
- All admins, superadmins, warehouse staff (for important statuses)

**Example:**
```
📦 Job Status Updated
Job SE001234 status changed to: Delivered
```

---

### 2. **Assignment** (`assignment`)
**Triggered when:** User is assigned to a job  
**Who gets notified:**
- The assigned driver or delivery agent

**Examples:**
```
👤 New Job Assigned
You have been assigned to collect job SE001234

👤 New Collection Assignment
You have been assigned to collect job SE001234
```

---

### 3. **Invoice** (`invoice`)
**Triggered when:** Invoice is created  
**Who gets notified:**
- All finance staff
- All admins/superadmins

**Example:**
```
💰 New Invoice Created
Invoice INV-001234 created for John Doe
```

---

### 4. **System** (`system`)
**Triggered when:** Batch is created  
**Who gets notified:**
- All admins, superadmins, warehouse staff

**Example:**
```
⚙️ New Batch Created
Batch BATCH-001 created with 25 jobs
```

---

## 🚀 How It Works

### **Workflow:**

```
1. Event occurs (job created, status updated, etc.)
   ↓
2. Backend triggers notification service
   ↓
3. Service determines who should be notified
   ↓
4. Creates notification records in database
   ↓
5. Frontend polls for new notifications (every 30s)
   ↓
6. Updates unread count badge
   ↓
7. User clicks bell to view notifications
   ↓
8. User clicks notification to view related item
   ↓
9. Notification marked as read
```

---

## 📊 Notification Events

### **Job Created:**
**Who gets notified:**
- ✅ Assigned driver (if assigned during creation)
- ✅ All admins/superadmins
- ✅ All warehouse staff
- ❌ Not the creator

---

### **Job Status Changed:**
**Who gets notified:**
- ✅ Assigned driver (if different from updater)
- ✅ Assigned delivery agent (if different from updater)
- ✅ Admins/warehouse (for statuses: Delivered, Cancelled, At Warehouse)
- ❌ Not the person who updated it

---

### **Driver Assigned:**
**Who gets notified:**
- ✅ The assigned driver
- ❌ Not the person who assigned

---

### **Batch Created:**
**Who gets notified:**
- ✅ All admins/superadmins
- ✅ All warehouse staff
- ❌ Not the creator

---

## 🎯 User Interface

### **Notification Bell:**
- Located in top-right header
- Shows unread count badge
- Clicking opens dropdown
- Auto-updates every 30 seconds

### **Notification Dropdown:**
- Displays last 10 notifications
- Sorted by newest first
- Unread notifications highlighted (blue background)
- Shows notification icon, title, message, time
- Quick actions: Mark all read, Clear all

### **Notification Item:**
- **Icon:** Emoji based on type (📦, 👤, 💰, ⚙️)
- **Title:** Brief description
- **Message:** Detailed information
- **Time:** Timestamp
- **Badge:** Blue dot for unread

**Click notification:**
- Marks as read
- Navigates to related page (Jobs, Batches, Invoices)

---

## 🔗 API Endpoints

### **Get Notifications:**
```
GET /api/notifications
Query params:
  - limit: 50 (default)
  - skip: 0 (pagination)
  - isRead: true/false (filter)

Response:
{
  "success": true,
  "data": {
    "notifications": [...],
    "total": 25,
    "unreadCount": 5
  }
}
```

### **Get Unread Count:**
```
GET /api/notifications/unread-count

Response:
{
  "success": true,
  "data": {
    "unreadCount": 5
  }
}
```

### **Mark as Read:**
```
PATCH /api/notifications/:id/read

Response:
{
  "success": true,
  "message": "Notification marked as read"
}
```

### **Mark All as Read:**
```
PATCH /api/notifications/mark-all-read

Response:
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

### **Delete Notification:**
```
DELETE /api/notifications/:id

Response:
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

### **Clear All:**
```
DELETE /api/notifications/clear-all

Response:
{
  "success": true,
  "data": {
    "count": 25
  }
}
```

---

## 💾 Database Schema

### **Notification Table:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `userId` | UUID | Recipient user ID |
| `type` | String | job_status, assignment, invoice, system |
| `title` | String | Notification title |
| `message` | Text | Notification message |
| `isRead` | Boolean | Read status (default: false) |
| `relatedEntityType` | String | job, invoice, batch |
| `relatedEntityId` | UUID | Related entity ID |
| `createdAt` | DateTime | Creation timestamp |
| `readAt` | DateTime | When marked as read |

---

## 🎨 Notification Examples

### **Example 1: Job Created**
```json
{
  "id": "uuid",
  "userId": "driver-uuid",
  "type": "assignment",
  "title": "New Job Assigned",
  "message": "You have been assigned to collect job SE001234",
  "isRead": false,
  "relatedEntityType": "job",
  "relatedEntityId": "job-uuid",
  "createdAt": "2025-10-21T10:30:00Z"
}
```

### **Example 2: Status Changed**
```json
{
  "id": "uuid",
  "userId": "admin-uuid",
  "type": "job_status",
  "title": "Job Delivered",
  "message": "Job SE001234 has been marked as Delivered",
  "isRead": false,
  "relatedEntityType": "job",
  "relatedEntityId": "job-uuid",
  "createdAt": "2025-10-21T15:45:00Z"
}
```

---

## 🧪 Testing Notifications

### **Test 1: Job Creation Notification**

1. **Login as Customer Service:**
   ```
   Email: cs@bestdeal.com
   Password: customer123
   ```

2. **Create a new job** (assign to a driver)

3. **Login as that driver:**
   ```
   Email: driver@bestdeal.com
   Password: driver123
   ```

4. **Check notification bell** → Should show "1" badge

5. **Click bell** → Should see:
   ```
   👤 New Job Assigned
   You have been assigned to collect job SE001234
   ```

---

### **Test 2: Status Change Notification**

1. **Login as Driver** and update job status to "Collected"

2. **Login as Admin/Warehouse**

3. **Check notification bell** → Should show notification:
   ```
   📦 Job Status Updated
   Job SE001234 status changed to: Collected
   ```

---

### **Test 3: Batch Creation Notification**

1. **Login as Warehouse** and create a batch

2. **Login as Admin**

3. **Check notification bell** → Should see:
   ```
   ⚙️ New Batch Created
   Batch BATCH-001 created with 10 jobs
   ```

---

## 🔄 Real-Time Updates

### **Current Implementation:**
- Polls for unread count every 30 seconds
- Refreshes notification list when dropdown is open
- Updates badge in real-time

### **Future Enhancement (WebSocket):**
For true real-time, you could implement:
- Socket.IO or WebSocket connection
- Push notifications instantly
- No polling needed
- Battery efficient on mobile

---

## 🎯 Notification Targeting Logic

### **Job Created:**
```javascript
Notify:
  - If assigned driver → notify driver
  - All admins/superadmins → notify
  - All warehouse staff → notify
  
Don't notify:
  - The creator
```

### **Status Updated:**
```javascript
Notify:
  - Assigned driver (if not the updater)
  - Assigned delivery agent (if not the updater)
  - For critical statuses (Delivered, At Warehouse):
    → All admins/warehouse

Don't notify:
  - The person who updated the status
```

### **Driver Assigned:**
```javascript
Notify:
  - The assigned driver

Don't notify:
  - The person who assigned
```

### **Batch Created:**
```javascript
Notify:
  - All admins/superadmins
  - All warehouse staff

Don't notify:
  - The creator
```

---

## 📱 Frontend Features

### **Notification Bell Component:**

**Location:** Top-right header (next to user avatar)

**Features:**
- Badge shows unread count
- Click to open dropdown
- Auto-refresh every 30s
- Smooth animations

**Dropdown:**
- Last 10 notifications
- Unread highlighted in blue
- Click to mark as read + navigate
- "Mark all read" button
- "Clear all" button

---

## 🔐 Security

### **Access Control:**
- ✅ Users can only see their own notifications
- ✅ JWT authentication required
- ✅ Can only mark their own notifications as read
- ✅ Can only delete their own notifications

### **Privacy:**
- Notifications contain only relevant information
- No sensitive data exposed
- Cascade delete (delete user → delete their notifications)

---

## 📈 Monitoring Notifications

### **Check User's Notifications:**
```sql
SELECT * FROM notifications 
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC;
```

### **Count Unread:**
```sql
SELECT COUNT(*) 
FROM notifications 
WHERE user_id = 'user-uuid' 
AND is_read = false;
```

### **Popular Notification Types:**
```sql
SELECT type, COUNT(*) as count
FROM notifications
GROUP BY type
ORDER BY count DESC;
```

---

## 🎨 Customization

### **Add New Notification Types:**

1. **Update Service** (`backend/src/services/notificationService.js`):
```javascript
const notifyCustomEvent = async (userId, details) => {
  await createNotification({
    userId,
    type: 'custom_type',
    title: 'Custom Event',
    message: 'Something happened',
    relatedEntityType: 'entity',
    relatedEntityId: 'id',
  });
};
```

2. **Call from Controller:**
```javascript
await notifyCustomEvent(userId, details);
```

3. **Update Icon** in NotificationBell.jsx:
```javascript
case 'custom_type':
  return '🎉';
```

---

## 🚀 Usage Examples

### **Backend - Create Notification:**
```javascript
const { notifyJobCreated } = require('../services/notificationService');

// After creating job
await notifyJobCreated(job, creatorId);
```

### **Frontend - Fetch Notifications:**
```javascript
import { notificationAPI } from '../utils/api';

const notifications = await notificationAPI.getAll();
const unreadCount = await notificationAPI.getUnreadCount();
```

---

## 📊 Notification Flow Diagram

```
Job Created (Customer Service)
    ↓
📬 Notifications Sent To:
    ├─→ Assigned Driver (if assigned)
    ├─→ All Admins
    └─→ All Warehouse Staff
    
Each receives notification in database
    ↓
Frontend polls every 30s
    ↓
Badge updates with unread count
    ↓
User clicks bell → sees notification
    ↓
User clicks notification:
    ├─→ Marks as read
    └─→ Navigates to related page
```

---

## 🛠️ Configuration

### **Backend:**
No configuration needed - notifications are automatic

### **Frontend:**
Auto-refresh interval: 30 seconds (configurable in NotificationBell.jsx)

---

## 💡 Best Practices

### **For Users:**
- ✅ Check notifications regularly
- ✅ Click notifications to view details
- ✅ Mark all as read to keep inbox clean
- ✅ Use notifications for quick navigation

### **For Development:**
- ✅ Keep notification messages clear and concise
- ✅ Include relevant entity IDs (job, batch, invoice)
- ✅ Don't notify the person who triggered the action
- ✅ Batch notifications when possible
- ✅ Don't fail main operations if notifications fail

---

## 🔍 Viewing Notifications

### **In the App:**
1. Click bell icon (top-right)
2. View notifications in dropdown
3. Click notification to navigate
4. Mark as read or clear

### **Using Swagger:**
```
http://localhost:4001/api/docs

Find: GET /api/notifications
Execute to see all your notifications
```

### **Using Prisma Studio:**
```bash
cd backend
npx prisma studio

Navigate to: notifications table
```

---

## 🎯 Common Scenarios

### **Scenario 1: Driver Gets Assignment**
```
Customer Service creates job → assigns driver Tom
    ↓
Tom's notification bell shows: 1
    ↓
Tom clicks bell:
  "👤 New Job Assigned
   You have been assigned to collect job SE001234"
    ↓
Tom clicks notification → navigates to Jobs page
```

---

### **Scenario 2: Admin Monitors Deliveries**
```
Driver updates job to "Delivered"
    ↓
Admin's notification bell shows: 1
    ↓
Admin clicks bell:
  "📦 Job Delivered
   Job SE001234 has been marked as Delivered"
    ↓
Admin clicks notification → navigates to Jobs page
```

---

### **Scenario 3: Warehouse Gets New Jobs**
```
Customer Service creates 3 new jobs
    ↓
Warehouse Manager's bell shows: 3
    ↓
Manager clicks bell:
  "📦 New Job Created - Job SE001234
   📦 New Job Created - Job SE001235
   📦 New Job Created - Job SE001236"
```

---

## 🔄 Auto-Refresh

**Frontend automatically:**
- Fetches unread count every 30 seconds
- Updates badge in real-time
- Refreshes notification list when dropdown is open
- No manual refresh needed

---

## 📱 Mobile Support

**Fully responsive:**
- ✅ Works on all screen sizes
- ✅ Touch-friendly dropdown
- ✅ Optimized notification cards
- ✅ Smooth animations

---

## 🐛 Troubleshooting

### **Notifications Not Showing?**
1. Check if you're logged in
2. Verify backend is running
3. Check browser console for errors
4. Try refreshing the page

### **Badge Count Wrong?**
1. Wait 30 seconds for auto-refresh
2. Click bell to force refresh
3. Check if notifications were deleted

### **Can't Mark as Read?**
1. Check internet connection
2. Verify you own the notification
3. Try again in a few seconds

---

## 📚 Files Modified/Created

### **Backend:**
- `backend/src/services/notificationService.js` ← New
- `backend/src/controllers/notificationController.js` ← New
- `backend/src/routes/notificationRoutes.js` ← New
- `backend/src/controllers/jobController.js` ← Updated (added notifications)
- `backend/src/controllers/batchController.js` ← Updated (added notifications)
- `backend/src/app.js` ← Updated (added notification routes)

### **Frontend:**
- `frontend/src/components/notifications/NotificationBell.jsx` ← New
- `frontend/src/components/notifications/NotificationBell.css` ← New
- `frontend/src/components/layout/MainLayout.jsx` ← Updated (added NotificationBell)
- `frontend/src/utils/api.js` ← Updated (added notificationAPI)

---

## ✨ Features Summary

**What Users See:**
- 🔔 Bell icon in header
- 🔴 Red badge with unread count
- 📋 Dropdown with notifications
- 🔵 Blue highlight for unread
- ⏰ Timestamps
- 🎯 Click to navigate

**What Happens Automatically:**
- ✅ Notifications created when jobs created
- ✅ Notifications sent when status changes
- ✅ Notifications delivered on driver assignment
- ✅ Notifications triggered on batch creation
- ✅ Badge updates every 30 seconds
- ✅ Read status tracked
- ✅ Navigation to related items

---

## 🎉 Your Notification System is Live!

**Test it now:**

1. Login as Customer Service (`cs@bestdeal.com`)
2. Create a job and assign to driver
3. Login as Driver (`driver@bestdeal.com`)
4. Check the bell icon → You should see notification! 🔔

**The notification system is fully operational across your entire app!** 🎊

---

## 📞 Support

For issues:
- Check Swagger: `http://localhost:4001/api/docs`
- Review notification service logs
- Check database notifications table
- Verify user permissions

---

**Happy notifying! 📬**


