# Mobile-Backend Communication Setup Guide

## ✅ What You Need

### 1. **Backend Server Running**
   - Backend must be running on port **4001**
   - Check: `http://localhost:4001/health` should return success
   - Start backend: `cd backend && npm run dev`

### 2. **CORS Configuration** ✅ Already Configured
   - Backend already allows mobile apps (no origin required)
   - Located in: `backend/src/app.js` (line 69)
   - Mobile apps send requests without origin header, which is allowed

### 3. **API URL Configuration** ✅ Already Fixed
   - **Android Emulator**: `http://10.0.2.2:4001/api` (automatically configured)
   - **iOS Simulator**: `http://localhost:4001/api` (automatically configured)
   - **Physical Device**: Need to configure your computer's IP address

### 4. **Network Requirements**

#### For Emulators/Simulators:
- ✅ No additional setup needed - uses special IPs that map to host machine

#### For Physical Devices:
- ✅ Both devices must be on the **same Wi-Fi network**
- ✅ Backend server must be accessible from your network
- ✅ Firewall must allow connections on port 4001

### 5. **Firewall Configuration**

#### Windows:
```powershell
# Allow incoming connections on port 4001
New-NetFirewallRule -DisplayName "Backend API" -Direction Inbound -LocalPort 4001 -Protocol TCP -Action Allow
```

#### Mac/Linux:
```bash
# Check if firewall is blocking (usually not needed for local network)
sudo ufw allow 4001/tcp
```

## 🔧 Configuration Steps

### Step 1: Verify Backend is Running
```bash
cd backend
npm run dev
```

You should see:
```
✅ Server running on port 4001
✅ CORS configured for origins: [...]
```

### Step 2: Test Backend Accessibility

#### From Android Emulator:
```bash
# In terminal or browser on emulator
curl http://10.0.2.2:4001/health
```

#### From iOS Simulator:
```bash
# In terminal or browser on simulator
curl http://localhost:4001/health
```

#### From Physical Device:
1. Find your computer's IP address:
   - **Windows**: `ipconfig` → Look for IPv4 Address (e.g., 192.168.1.100)
   - **Mac/Linux**: `ifconfig` or `ip addr` → Look for inet address
2. Test from device browser: `http://YOUR_IP:4001/health`

### Step 3: Configure Mobile App for Physical Device

If testing on a **physical device**, update `mobile/src/config/api.js`:

```javascript
const getApiBaseUrl = () => {
  if (!__DEV__) {
    return 'https://your-production-api.com/api';
  }

  // For physical device, replace with your computer's IP
  const YOUR_COMPUTER_IP = '192.168.1.100'; // ← Change this!

  if (Platform.OS === 'android') {
    return `http://${YOUR_COMPUTER_IP}:4001/api`;
  } else {
    return `http://${YOUR_COMPUTER_IP}:4001/api`;
  }
};
```

### Step 4: Verify Mobile App Configuration

The mobile app logs the API URL on startup. Check console for:
```
[INFO] API Base URL configured {"url": "http://...", "platform": "android"}
```

## 🧪 Testing Connection

### Test 1: Health Check
The mobile app should be able to call:
- `GET http://[API_URL]/health`

### Test 2: Login
Try logging in with:
<<<<<<< HEAD
- Email: `admin@shipease.com`
=======
- Email: `admin@bestdeal.com`
>>>>>>> origin/master
- Password: `111111@1A`

### Test 3: Check Logs
Monitor both:
- **Backend logs**: Should show incoming requests
- **Mobile logs**: Should show API requests/responses

## 🐛 Troubleshooting

### Issue: "Connection Refused"
**Solutions:**
1. ✅ Verify backend is running: `netstat -ano | findstr :4001` (Windows) or `lsof -i :4001` (Mac/Linux)
2. ✅ Check backend logs for errors
3. ✅ Verify API URL in mobile app logs
4. ✅ For physical device: Ensure same Wi-Fi network

### Issue: "Network Error" or "No Response"
**Solutions:**
1. ✅ Check firewall settings (see above)
2. ✅ Verify backend CORS allows mobile requests (already configured)
3. ✅ Check network connectivity
4. ✅ Verify IP address is correct (for physical devices)

### Issue: "CORS Error"
**Solutions:**
1. ✅ Backend already configured to allow mobile apps (no origin)
2. ✅ Check backend logs for CORS rejection messages
3. ✅ Verify `CORS_ORIGINS` in `backend/.env` (not needed for mobile, but check anyway)

### Issue: "401 Unauthorized"
**Solutions:**
1. ✅ This is normal for login - means connection works!
2. ✅ Check credentials are correct
3. ✅ Verify backend authentication is working

## 📋 Quick Checklist

- [ ] Backend server running on port 4001
- [ ] Backend health check returns success
- [ ] Mobile app configured with correct API URL
- [ ] For physical device: Same Wi-Fi network
- [ ] For physical device: Firewall allows port 4001
- [ ] Mobile app logs show correct API URL
- [ ] Backend logs show incoming requests

## 🔍 Verification Commands

### Check Backend Status:
```bash
# Windows
netstat -ano | findstr :4001

# Mac/Linux
lsof -i :4001

# Or test directly
curl http://localhost:4001/health
```

### Check Mobile App Logs:
Look for these log messages:
- `[INFO] API Base URL configured`
- `[DEBUG] API Request`
- `[INFO] Attempting login`
- `[ERROR]` (if there are issues)

### Check Backend Logs:
Should show:
- `✅ Server running on port 4001`
- `✅ CORS configured for origins:`
- Incoming request logs (morgan middleware)

## 📝 Current Configuration Summary

### Backend:
- **Port**: 4001
- **CORS**: Allows mobile apps (no origin required) ✅
- **Health Check**: `/health`
- **API Base**: `/api`

### Mobile App:
- **Android Emulator**: `http://10.0.2.2:4001/api` ✅
- **iOS Simulator**: `http://localhost:4001/api` ✅
- **Physical Device**: Needs IP configuration

## 🚀 Next Steps

1. **Start backend**: `cd backend && npm run dev`
2. **Start mobile app**: `cd mobile && npm start` (or `expo start`)
3. **Test login**: Use admin credentials
4. **Monitor logs**: Check both backend and mobile logs
5. **For physical device**: Configure IP address in `mobile/src/config/api.js`

That's it! Your mobile app should now communicate with the backend. 🎉


<<<<<<< HEAD
=======

>>>>>>> origin/master
