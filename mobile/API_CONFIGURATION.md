# Mobile API Configuration Guide

## Development Setup

The mobile app needs to connect to your backend server. The configuration depends on where you're running the app:

### Android Emulator
- Uses `10.0.2.2` to access your host machine's `localhost`
- Default: `http://10.0.2.2:4001/api`
- This is automatically configured in `src/config/api.js`

### iOS Simulator
- Can use `localhost` directly
- Default: `http://localhost:4001/api`
- This is automatically configured in `src/config/api.js`

### Physical Device
- Must use your computer's **actual IP address**
- Find your IP:
  - **Windows**: Run `ipconfig` and look for IPv4 Address (usually 192.168.x.x)
  - **Mac/Linux**: Run `ifconfig` or `ip addr` and look for inet address
- Example: `http://192.168.1.100:4001/api`

## Configuration Methods

### Method 1: Environment Variable (Recommended)
Create a `.env` file in the `mobile` directory:
```
REACT_NATIVE_API_URL=http://192.168.1.100:4001/api
```

Then install `react-native-dotenv`:
```bash
npm install react-native-dotenv
```

### Method 2: Direct Code Edit
Edit `mobile/src/config/api.js` and update the `getApiBaseUrl()` function:

```javascript
const getApiBaseUrl = () => {
  if (!__DEV__) {
    return 'https://your-production-api.com/api';
  }

  // For physical device, replace with your computer's IP
  if (Platform.OS === 'android') {
    return 'http://YOUR_COMPUTER_IP:4001/api'; // e.g., http://192.168.1.100:4001/api
  } else {
    return 'http://YOUR_COMPUTER_IP:4001/api'; // e.g., http://192.168.1.100:4001/api
  }
};
```

## Troubleshooting

### Connection Refused Error
- **Check backend is running**: Ensure your backend server is running on port 4001
- **Check firewall**: Make sure your firewall allows connections on port 4001
- **Check IP address**: Verify you're using the correct IP address for your computer
- **Check network**: Ensure your device/emulator is on the same network as your computer

### Network Error
- Verify the backend URL is correct
- Check if the backend CORS settings allow your mobile app origin
- Ensure both devices are on the same Wi-Fi network (for physical devices)

### Testing Connection
You can test if the backend is accessible by opening the URL in a browser:
- Android Emulator: `http://10.0.2.2:4001/api/health`
- iOS Simulator: `http://localhost:4001/api/health`
- Physical Device: `http://YOUR_IP:4001/api/health`

## Current Configuration

The app logs the configured API URL on startup. Check the console logs for:
```
[INFO] API Base URL configured {"url": "http://...", "platform": "android"}
```


