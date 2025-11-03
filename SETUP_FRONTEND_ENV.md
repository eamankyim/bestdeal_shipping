# Setup Frontend .env File on Server

## Commands to Run on Server

### Step 1: Check what's in the frontend directory
```bash
cd ~/bestdeal_shipping
ls -la frontend/
```

### Step 2: Check if .env.example exists
```bash
ls -la frontend/.env*
cat frontend/.env.example 2>/dev/null
```

### Step 3: Create .env file with PORT=3000

**Option A: Copy from .env.example (if it exists)**
```bash
cd ~/bestdeal_shipping/frontend
cp .env.example .env
# Then edit PORT setting
nano .env
# Or
vi .env
```

**Option B: Create new .env file**
```bash
cd ~/bestdeal_shipping/frontend

# Create .env file with PORT=3000
cat > .env << 'EOF'
# Frontend Application Configuration
# DO NOT commit this file - add to .gitignore

# Application Info
REACT_APP_NAME=Best Deal App
REACT_APP_LOGO_PATH=/AppLogo.png

# Backend API Configuration
REACT_APP_API_URL=http://localhost:4001
REACT_APP_API_BASE_PATH=/api

# Support Contact
REACT_APP_SUPPORT_EMAIL=support@icreationsglobal.com
REACT_APP_SUPPORT_PHONE=+44 20 1234 5678

# LocalStorage Keys (for consistency)
REACT_APP_USER_STORAGE_KEY=shipease_user
REACT_APP_TOKEN_STORAGE_KEY=shipease_token

# Development Server
PORT=3000

# Feature Flags (optional - for future use)
REACT_APP_ENABLE_TRACKING=true
REACT_APP_ENABLE_NOTIFICATIONS=false
EOF

# Verify it was created
cat .env | grep PORT
```

**Option C: Quick add just PORT setting**
```bash
cd ~/bestdeal_shipping/frontend
echo "PORT=3000" >> .env
cat .env
```

### Step 4: Verify
```bash
cd ~/bestdeal_shipping
cat frontend/.env | grep PORT
```

