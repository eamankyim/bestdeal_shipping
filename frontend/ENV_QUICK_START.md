# Frontend Environment - Quick Start Guide

## ⚡ TL;DR

Your frontend environment is now fully configured with no hardcoded values!

## 🎯 What Was Done

✅ All frontend files moved to `frontend/` folder  
✅ Environment variables configured  
✅ Hardcoded values replaced with config  
✅ API utility created for backend calls  
✅ `.env` files protected in `.gitignore`

## 🚀 Quick Setup (New Developer)

```bash
# 1. Navigate to frontend folder
cd frontend

# 2. Copy environment template
cp .env.example .env

# 3. Install dependencies
npm install

# 4. Start development server
npm start
```

## 📝 Key Files

| File | Purpose |
|------|---------|
| `.env` | Your local config (NOT in git) |
| `.env.example` | Template for team |
| `src/config/env.js` | Config module |
| `src/utils/api.js` | API helper |

## 🔧 Most Important Variables

```env
# Backend API (update when backend is ready)
REACT_APP_API_URL=http://localhost:5000

# App branding
REACT_APP_NAME=ShipEASE

# Support contact
REACT_APP_SUPPORT_EMAIL=support@shipease.com
REACT_APP_SUPPORT_PHONE=+44 20 1234 5678
```

## 💻 Using Config in Code

```javascript
// Import config
import config from '../config/env';

// Use it anywhere
const apiUrl = config.api.fullUrl;
const appName = config.app.name;
const email = config.support.email;
```

## 🌐 Making API Calls

```javascript
// Import API helpers
import { authAPI, customerAPI, api } from '../utils/api';

// Login
const user = await authAPI.login(email, password);

// Get customers
const customers = await customerAPI.getAll();

// Custom endpoint
const data = await api.get('/custom-endpoint');
```

## 🔐 Security Notes

- ✅ Never commit `.env` files
- ✅ Use `.env.example` as template
- ✅ Update `.env.production` for production
- ✅ Keep secrets secure

## 🐛 Troubleshooting

**Environment not loading?**
- Restart dev server after changing `.env`
- Check variables start with `REACT_APP_`

**API calls failing?**
- Verify `REACT_APP_API_URL` in `.env`
- Check backend is running
- Check CORS settings

## 📚 Full Documentation

See `README.md` for complete documentation.

## ✨ That's It!

Your frontend is now configured and ready to connect to the backend! 🎉






