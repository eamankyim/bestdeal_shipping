# 🚚 Delivery Agent Dashboard Guide

## Overview

The Delivery Agent Dashboard is designed for delivery personnel to manage their assigned deliveries efficiently.

---

## 🚀 Quick Access

**Login Credentials (Test Account):**
```
Email: delivery@bestdeal.com
Password: delivery123
```

**API Endpoint:**
```
GET /api/dashboard/delivery
```

**Route:**
```
/delivery-agent
```

---

## 📊 Dashboard Sections

### 1. **Statistics Cards**

Three key metrics displayed at the top:

| Metric | Description |
|--------|-------------|
| **Total Assigned** | All deliveries assigned to you |
| **Out for Delivery** | Deliveries currently in progress |
| **Attempted** | Deliveries that were attempted but not completed |

---

### 2. **Assigned Deliveries Table**

**Columns Displayed:**
- **Tracking ID** - Job tracking number
- **Customer** - Customer name
- **Phone** - Customer contact number
- **Delivery Address** - Full delivery address
- **Estimated Delivery** - Expected delivery date
- **Status** - Current delivery status
- **Actions** - Quick action buttons (View, Call)

**Features:**
- ✅ Pagination (10 per page)
- ✅ Click-to-call customer phone numbers
- ✅ View job details
- ✅ Sort and filter capabilities

---

### 3. **Quick Tips Section**

Helpful reminders for delivery agents:
- 📱 Call customers before delivery
- 📍 Check addresses carefully
- 📸 Take proof of delivery photos
- ✅ Update status immediately

---

## 🎯 Key Features

### View Job Details
1. Click **"View"** button next to any delivery
2. See complete job information
3. Access customer contact details
4. Check delivery notes/instructions

### Call Customer
1. Click **"Call"** button next to any delivery
2. Automatically dials customer phone number
3. Confirm availability before delivery

### Update Delivery Status
1. Navigate to Jobs page
2. Find your assigned delivery
3. Update status as needed
4. Add delivery notes

---

## 📱 Mobile Friendly

The dashboard is fully responsive:
- ✅ Works on all devices
- ✅ Touch-friendly buttons
- ✅ Easy navigation
- ✅ Quick access to customer phone numbers

---

## 🔄 Data Refresh

**Automatic Refresh:**
- Dashboard auto-refreshes every 60 seconds
- Always shows latest delivery assignments

**Manual Refresh:**
- Reload page for instant update

---

## 🎨 Status Colors

**Delivery Statuses:**
- 🔵 **Blue** - Out for Delivery
- 🟠 **Orange** - Delivery Attempted
- 🟢 **Green** - Delivered

---

## 🔐 Permissions

As a delivery agent, you have access to:
- ✅ View your assigned deliveries
- ✅ Update delivery status
- ✅ View customer contact information
- ✅ Access delivery dashboard
- ✅ Add delivery notes

You cannot:
- ❌ View other agents' deliveries
- ❌ Create new jobs
- ❌ Delete jobs
- ❌ Access financial data
- ❌ Modify system settings

---

## 📋 Daily Workflow

### Morning:
1. Login to dashboard
2. Review assigned deliveries
3. Check delivery addresses
4. Plan optimal route

### During Deliveries:
1. Call customers before arrival
2. Update status to "Out for Delivery"
3. Complete delivery
4. Upload proof of delivery
5. Update status to "Delivered"

### End of Day:
1. Review completed deliveries
2. Check for any attempted deliveries
3. Add notes for failed attempts

---

## 🐛 Troubleshooting

### No Deliveries Showing?
1. Verify you're logged in as delivery agent
2. Check if any deliveries are assigned to you
3. Contact warehouse/admin for assignments

### Can't Update Status?
1. Check internet connection
2. Verify you have permission
3. Try refreshing the page

### Dashboard Not Loading?
1. Refresh the page
2. Clear browser cache
3. Check browser console for errors

---

## 📞 Support

For issues or questions:
- Contact warehouse manager
- Contact system administrator
- Check API documentation: `http://localhost:4001/api/docs`

---

## 📚 Related Features

**Connected Modules:**
- **Jobs Module** - Full job details and updates
- **Tracking** - Real-time shipment tracking
- **Settings** - Profile and preferences

---

## 🔗 Integration

**Backend API:**
- Controller: `/backend/src/controllers/dashboardController.js`
- Endpoint: `GET /api/dashboard/delivery`

**Frontend:**
- Component: `/frontend/src/pages/DeliveryDashboard.jsx`
- Route: `/delivery-agent`

---

**🎉 Your delivery agent dashboard is ready to use!**

Login with the delivery test account and start managing your deliveries efficiently.

