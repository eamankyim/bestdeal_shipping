# Backend Integration Guide

This document outlines the changes made to remove all dummy data and how to connect your application to a real backend API.

## What Was Removed

All mock/dummy data has been removed from the application, including:

### 1. Authentication Context (`src/contexts/AuthContext.jsx`)
- ✅ Removed mock users array
- ✅ Removed mock pending invites
- ✅ Updated `login()` to throw error until backend is connected
- ✅ Updated `sendInvite()` to throw error until backend is connected
- ✅ Updated `acceptInvite()` to throw error until backend is connected

### 2. Dashboard Pages
All dashboard pages now have empty data arrays with TODO comments:
- ✅ `DashboardPage.jsx` - stats, recent jobs, recent activities
- ✅ `CustomersPage.jsx` - customers list and statistics
- ✅ `JobsPage.jsx` - jobs list and statistics
- ✅ `BatchManagementPage.jsx` - batches and parcels
- ✅ `InvoiceManagementPage.jsx` - invoices and shipments
- ✅ `DriverDashboardPage.jsx` - assigned jobs and statistics
- ✅ `WarehouseDashboardPage.jsx` - pending shipments and statistics
- ✅ `DeliveryAgentDashboardPage.jsx` - deliveries and statistics
- ✅ `AdminDashboardPage.jsx` - users list
- ✅ `PublicTrackingPage.jsx` - tracking data

### 3. Deleted Files
- ✅ `ResponsiveTableDemo.jsx` - Demo component removed
- ✅ `DEMO_ACCOUNTS.md` - Demo accounts documentation removed

## How to Connect to Your Backend

### Step 1: Set Up API Configuration

Create an API configuration file:

```javascript
// src/config/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const API_ENDPOINTS = {
  // Authentication
  LOGIN: `${API_BASE_URL}/auth/login`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,
  
  // Users
  USERS: `${API_BASE_URL}/users`,
  INVITES: `${API_BASE_URL}/invites`,
  
  // Jobs
  JOBS: `${API_BASE_URL}/jobs`,
  
  // Customers
  CUSTOMERS: `${API_BASE_URL}/customers`,
  
  // Batches
  BATCHES: `${API_BASE_URL}/batches`,
  
  // Invoices
  INVOICES: `${API_BASE_URL}/invoices`,
  
  // Tracking
  TRACKING: `${API_BASE_URL}/tracking`,
  
  // Dashboard Stats
  DASHBOARD_STATS: `${API_BASE_URL}/dashboard/stats`,
};

export default API_BASE_URL;
```

### Step 2: Create API Service Helpers

Create a reusable API service:

```javascript
// src/services/api.service.js
import { API_ENDPOINTS } from '../config/api';

class ApiService {
  async request(url, options = {}) {
    const token = localStorage.getItem('shipease_token');
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'API request failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  get(url) {
    return this.request(url, { method: 'GET' });
  }

  post(url, data) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put(url, data) {
    return this.request(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  delete(url) {
    return this.request(url, { method: 'DELETE' });
  }
}

export default new ApiService();
```

### Step 3: Update AuthContext

Update the login function in `src/contexts/AuthContext.jsx`:

```javascript
const login = async (email, password) => {
  try {
    const response = await fetch(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      throw new Error('Invalid credentials');
    }
    
    const data = await response.json();
    const { user, token } = data;
    
    // Store token
    localStorage.setItem('shipease_token', token);
    localStorage.setItem('shipease_user', JSON.stringify(user));
    
    setCurrentUser(user);
    setIsAuthenticated(true);
    
    return { success: true, user };
  } catch (error) {
    throw error;
  }
};
```

### Step 4: Update Dashboard Pages

Example for `DashboardPage.jsx`:

```javascript
import { useEffect, useState } from 'react';
import apiService from '../services/api.service';
import { API_ENDPOINTS } from '../config/api';

const DashboardPage = () => {
  const [stats, setStats] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, jobsData] = await Promise.all([
        apiService.get(API_ENDPOINTS.DASHBOARD_STATS),
        apiService.get(`${API_ENDPOINTS.JOBS}?limit=5&sort=recent`),
      ]);
      
      setStats(statsData);
      setRecentJobs(jobsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      message.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // ... rest of component
};
```

### Step 5: Environment Variables

Create a `.env` file in your project root:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

For production, use:

```env
REACT_APP_API_URL=https://your-api-domain.com/api
```

## Backend API Requirements

Your backend should provide the following endpoints:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Users & Invites
- `GET /api/users` - List all users
- `POST /api/invites` - Send invite
- `POST /api/invites/:id/accept` - Accept invite

### Jobs
- `GET /api/jobs` - List all jobs
- `POST /api/jobs` - Create new job
- `GET /api/jobs/:id` - Get job details
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job

### Customers
- `GET /api/customers` - List all customers
- `POST /api/customers` - Create customer
- `GET /api/customers/:id` - Get customer details
- `PUT /api/customers/:id` - Update customer

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Tracking
- `GET /api/tracking/:trackingId` - Track shipment

## Next Steps

1. **Set up your backend API** with the required endpoints
2. **Create the API configuration file** (`src/config/api.js`)
3. **Create the API service** (`src/services/api.service.js`)
4. **Update AuthContext** with real API calls
5. **Update each page** to fetch data from API using `useEffect`
6. **Add loading states** for better UX
7. **Add error handling** for failed API calls
8. **Test authentication flow** first
9. **Gradually connect each page** to the backend

## Testing Locally

1. Start your backend server (e.g., `npm run server`)
2. Update `.env` with correct API URL
3. Start your React app (`npm start`)
4. Test each feature incrementally

## Common Issues

### CORS Errors
If you encounter CORS errors, configure your backend:

```javascript
// Express.js example
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

### Authentication Token
Store and send the JWT token with each request:
```javascript
headers: {
  'Authorization': `Bearer ${token}`
}
```

### 401 Unauthorized
If user is unauthorized, redirect to login:
```javascript
if (response.status === 401) {
  localStorage.removeItem('shipease_token');
  localStorage.removeItem('shipease_user');
  window.location.href = '/login';
}
```

## Resources

- [Fetch API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [JWT Authentication](https://jwt.io/introduction)
- [React Hooks - useEffect](https://react.dev/reference/react/useEffect)
- [Ant Design - Message](https://ant.design/components/message)

---

**Note:** All TODO comments in the code mark where you need to add backend integration. Search for `// TODO:` in your project to find these locations.

