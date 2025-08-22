# Render Deployment Configuration

## Port Binding Fix

The port binding error occurs because Render expects your app to listen on a specific port. Here's how to fix it:

### 1. Environment Variables in Render Dashboard

Set these environment variables in your Render service dashboard:

```
NODE_ENV=production
PORT=10000
```

### 2. Build Command
```
npm install && npm run build
```

### 3. Start Command
```
npm run render-start
```

### 4. Health Check Path
```
/
```

### 5. Port Configuration

Make sure your app listens on the PORT environment variable. The React app should automatically use the PORT environment variable.

## Alternative Solution: Create a server.js file

If the above doesn't work, create a `server.js` file in your root directory:

```javascript
const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'build')));

// Handle React routing, return all requests to React app
app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
```

Then update your package.json:
```json
{
  "scripts": {
    "render-start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
```

## Current Configuration

Your `render.yaml` file is already configured correctly with:
- Port: 10000
- Build command: `npm install && npm run build`
- Start command: `npm run render-start`
- Health check path: `/`
