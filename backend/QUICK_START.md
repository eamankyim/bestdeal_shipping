# ShipEASE Backend - Quick Start Guide

Get your ShipEASE backend up and running in 5 minutes! 🚀

---

## ⚡ Quick Setup (5 Steps)

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Set Up PostgreSQL Database

**Option A: Use existing PostgreSQL installation**
```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE shipease_db;

# Exit
\q
```

**Option B: Install PostgreSQL**
- **Windows:** Download from [postgresql.org](https://www.postgresql.org/download/windows/)
- **Mac:** `brew install postgresql` then `brew services start postgresql`
- **Linux:** `sudo apt-get install postgresql`

### 3. Configure Environment

```bash
# The .env file is already created with default values
# Update the DATABASE_URL with your PostgreSQL credentials:
```

Edit `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/shipease_db?schema=public"
```

Replace `your_password` with your PostgreSQL password.

### 4. Set Up Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Push schema to database
npm run prisma:push

# Seed initial data (creates admin user & sample data)
npm run prisma:seed
```

### 5. Start Server

```bash
npm run dev
```

✅ **Server running at:** `http://localhost:5000`

---

## 🧪 Test the API

### 1. Check Health
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "success": true,
  "message": "ShipEASE API is running",
  ...
}
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@shipease.com",
    "password": "admin123"
  }'
```

Copy the `token` from the response.

### 3. Get Current User
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🔐 Default Login Credentials

After seeding, you can login with these accounts:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@shipease.com | admin123 |
| **Warehouse** | warehouse@shipease.com | warehouse123 |
| **Driver** | driver@shipease.com | driver123 |
| **Delivery** | delivery@shipease.com | delivery123 |

---

## 📊 View Database

Open Prisma Studio to view and edit database:

```bash
npm run prisma:studio
```

Opens at `http://localhost:5555`

---

## 🛠️ Useful Commands

```bash
# Development
npm run dev                # Start server with auto-reload

# Database
npm run prisma:studio      # Open database GUI
npm run prisma:migrate     # Create new migration
npm run db:reset           # Reset database (⚠️  deletes all data)

# Production
npm start                  # Start production server
```

---

## 🔄 Connect Frontend

In your React frontend (already built), update the API URL:

1. Create `.env` in frontend root:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

2. The frontend is already configured to make API calls to the backend!

---

## ❌ Troubleshooting

### "Can't reach database server"

**Solution:**
1. Make sure PostgreSQL is running
2. Check DATABASE_URL in `.env`
3. Test connection: `psql -U postgres -d shipease_db`

### "Port 5000 already in use"

**Solution:**
Change PORT in `.env`:
```env
PORT=5001
```

### "Prisma Client Error"

**Solution:**
```bash
npm run prisma:generate
```

---

## 📚 Next Steps

1. ✅ **Read full documentation:** `README.md`
2. ✅ **Explore API endpoints:** `BACKEND_API_PLAN.md`
3. ✅ **Check database schema:** `DATABASE_SCHEMA.md`
4. ✅ **Connect frontend:** Update `.env` in React app
5. ✅ **Start building!**

---

## 🎯 API Examples

### Create a Customer
```bash
curl -X POST http://localhost:5000/api/customers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+441234567890",
    "customerType": "Individual",
    "address": "123 Main St, London"
  }'
```

### Create a Job
```bash
curl -X POST http://localhost:5000/api/jobs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "newCustomer": {
      "name": "Jane Smith",
      "email": "jane@example.com",
      "phone": "+441234567891",
      "customerType": "Individual",
      "address": "456 High St, Manchester"
    },
    "pickupAddress": "456 High St, Manchester",
    "deliveryAddress": "789 Park Rd, London",
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
    "priority": "Express"
  }'
```

### Get All Jobs
```bash
curl "http://localhost:5000/api/jobs?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Track Shipment (Public - No Auth Required)
```bash
curl http://localhost:5000/api/tracking/SHIP-20241010-A3B9F
```

---

**You're all set! Happy shipping! 🚚📦**

Need help? Check `README.md` for detailed documentation.







