# Backend Port Configuration Guide

## Current Configuration

### Best Deal Project (`bestdeal_shipping`)
- **Backend Port**: `4001`
- **Frontend Port**: `3000`
- **Frontend API URL**: `http://localhost:4001`

### Sabito Project
- **Backend Port**: Need to check
- **Frontend Port**: Need to check
- **Frontend API URL**: Need to check

---

## Commands to Check Sabito Configuration

### Step 1: Check Sabito Backend Port
```bash
cd ~/sabito

# Check backend .env file
cat backend/.env | grep PORT

# Or check backend package.json
cat backend/package.json | grep -A5 "start"

# Or check backend server.js
cat backend/server.js | grep -i port

# Or check if backend is running and what port
sudo ss -tuln | grep LISTEN | grep -v -E "4001|3001|3002|3003"
```

### Step 2: Check Sabito Frontend Configuration
```bash
cd ~/sabito

# Check frontend .env
cat frontend/.env | grep API_URL

# Or check frontend .env.example
cat frontend/.env.example | grep API_URL
```

### Step 3: Check All Running Services
```bash
# See all backend ports in use
sudo ss -tuln | grep LISTEN | grep -E ":(4000|4001|4002|4003|5000|5001|5002|5003|8000|8001|8080)"

# See all services
sudo ss -tuln | grep LISTEN | sort
```

---

## Standard Backend Ports

Common ports used:
- **4000** - Alternative backend port
- **4001** - Best Deal backend (currently used)
- **5000** - Common backend port
- **8000** - Alternative backend port
- **8080** - Common backend port

---

## Configuration Example

### Best Deal (`bestdeal_shipping`)
```env
# Frontend .env
REACT_APP_API_URL=http://localhost:4001
REACT_APP_API_BASE_PATH=/api
PORT=3000
```

### Sabito (Example - need to check actual port)
```env
# Frontend .env
REACT_APP_API_URL=http://localhost:4000  # or whatever port Sabito uses
REACT_APP_API_BASE_PATH=/api
PORT=3000
```

---

## Important Notes

1. **Each project should have its own backend port** to avoid conflicts
2. **Frontend API URL** must match the backend port
3. **Both frontends can use PORT=3000** if running separately (different directories)
4. **In production**, URLs should point to production domains, not localhost

