/**
 * Environment Configuration
 * Centralizes access to environment variables
 * All environment variables must be prefixed with REACT_APP_ to be accessible in React
 */

// Derive origin for environments where REACT_APP_API_URL isn't provided
const runtimeOrigin =
  typeof window !== 'undefined' && window.location && window.location.origin
    ? window.location.origin
    : (process.env.REACT_APP_PUBLIC_URL || 'http://localhost:3000');

const config = {
  // Application Info
  app: {
    name: process.env.REACT_APP_NAME || 'BestDeal Shipping',
    logoPath: process.env.REACT_APP_LOGO_PATH || '/AppLogo.png',
  },

  // API Configuration
  api: {
    // Prefer explicit env, otherwise use current origin
    baseUrl: process.env.REACT_APP_API_URL || runtimeOrigin,
    basePath: process.env.REACT_APP_API_BASE_PATH || '/api',
    get fullUrl() {
      return `${this.baseUrl}${this.basePath}`;
    },
  },

  // Support Contact
  support: {
    // Left empty unless set: the public pages show the contact details saved in Settings → Organisation
    email: process.env.REACT_APP_SUPPORT_EMAIL || '',
    phone: process.env.REACT_APP_SUPPORT_PHONE || '',
  },

  // Storage Keys
  storage: {
    userKey: process.env.REACT_APP_USER_STORAGE_KEY || 'shipease_user',
    tokenKey: process.env.REACT_APP_TOKEN_STORAGE_KEY || 'shipease_token',
  },

  // Feature Flags
  features: {
    tracking: process.env.REACT_APP_ENABLE_TRACKING === 'true',
    notifications: process.env.REACT_APP_ENABLE_NOTIFICATIONS === 'true',
  },
};

// Log configuration on load (development only)
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Frontend Configuration:');
  console.log('   API URL:', config.api.fullUrl);
  console.log('   App Name:', config.app.name);
  console.log('   Environment:', process.env.NODE_ENV);
}

export default config;

