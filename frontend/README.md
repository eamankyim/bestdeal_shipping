# ShipEASE Frontend

React-based frontend for the ShipEASE Delivery Management System.

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Environment Setup

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Update the `.env` file with your configuration:**

   ```env
   # Application Info
   REACT_APP_NAME=ShipEASE
   REACT_APP_LOGO_PATH=/AppLogo.png

   # Backend API Configuration
   REACT_APP_API_URL=http://localhost:5000
   REACT_APP_API_BASE_PATH=/api/v1

   # Support Contact
   REACT_APP_SUPPORT_EMAIL=support@shipease.com
   REACT_APP_SUPPORT_PHONE=+44 20 1234 5678

   # LocalStorage Keys
   REACT_APP_USER_STORAGE_KEY=shipease_user
   REACT_APP_TOKEN_STORAGE_KEY=shipease_token

   # Development Server
   PORT=3000

   # Feature Flags
   REACT_APP_ENABLE_TRACKING=true
   REACT_APP_ENABLE_NOTIFICATIONS=false
   ```

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start
```

The application will be available at `http://localhost:3000` (or the PORT specified in your `.env` file).

## 📦 Available Scripts

- `npm start` - Starts the development server
- `npm run build` - Creates a production build
- `npm test` - Runs the test suite
- `npm run eject` - Ejects from Create React App (⚠️ one-way operation)
- `npm run render-start` - Starts the production server (used for deployment)

## 🔒 Environment Variables

All environment variables must be prefixed with `REACT_APP_` to be accessible in the React application.

### Required Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API base URL | `http://localhost:5000` |
| `REACT_APP_API_BASE_PATH` | API path prefix | `/api/v1` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_NAME` | Application name | `ShipEASE` |
| `REACT_APP_LOGO_PATH` | Logo file path | `/AppLogo.png` |
| `REACT_APP_SUPPORT_EMAIL` | Support email address | `support@shipease.com` |
| `REACT_APP_SUPPORT_PHONE` | Support phone number | `+44 20 1234 5678` |
| `PORT` | Development server port | `3000` |

## 🌐 Production Deployment

For production deployment:

1. Create a `.env.production` file with production values
2. Build the application: `npm run build`
3. Serve the `build` folder using a static server or `npm run render-start`

### Production Environment Variables

Make sure to update these in your production environment:

- `REACT_APP_API_URL` - Point to your production API URL
- `REACT_APP_SUPPORT_EMAIL` - Use your actual support email
- `REACT_APP_SUPPORT_PHONE` - Use your actual support phone

## 📁 Project Structure

```
frontend/
├── public/           # Static files
├── src/
│   ├── components/   # React components
│   ├── pages/        # Page components
│   ├── contexts/     # React contexts
│   ├── config/       # Configuration files
│   ├── constants/    # App constants
│   └── styles/       # Global styles
├── .env.example      # Example environment file
├── .env              # Your local environment (not committed)
└── package.json      # Dependencies
```

## 🔐 Security Notes

- Never commit `.env` files to version control
- Keep `.env.example` updated with all required variables (without sensitive values)
- Use different configurations for development and production
- Rotate API keys and secrets regularly

## 🛠️ Configuration

The application uses a centralized configuration file at `src/config/env.js` that loads all environment variables. This makes it easy to access configuration throughout the app:

```javascript
import config from '../config/env';

// Use configuration
const apiUrl = config.api.fullUrl;
const appName = config.app.name;
```

## 📝 Notes

- Built with Create React App
- Uses Ant Design for UI components
- Configured for responsive design (mobile, tablet, desktop)
- Includes role-based access control (RBAC)

## 🐛 Troubleshooting

**Issue: Environment variables not updating**
- Restart the development server after changing `.env` files
- Clear browser cache
- Check that variables are prefixed with `REACT_APP_`

**Issue: API calls failing**
- Verify `REACT_APP_API_URL` points to the correct backend
- Check CORS configuration in the backend
- Ensure backend server is running

## 📞 Support

For issues and questions, contact the development team or refer to the main project documentation.






