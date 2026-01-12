import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';

// API Configuration
// For React Native development:
// - Android Emulator: use 10.0.2.2 (maps to host machine's localhost)
// - iOS Simulator: can use localhost
// - Physical Device: use your computer's IP address (e.g., 192.168.1.100)
// You can override this with REACT_NATIVE_API_URL environment variable

const getApiBaseUrl = () => {
  if (!__DEV__) {
    // Production - update with your production API URL
    return 'https://your-production-api.com/api';
  }

  // Development - check for environment variable override
  const envUrl = process.env.REACT_NATIVE_API_URL;
  if (envUrl) {
    return envUrl;
  }

  // Platform-specific defaults
  if (Platform.OS === 'android') {
    // Android emulator uses 10.0.2.2 to access host machine's localhost
    return 'http://10.0.2.2:4001/api';
  } else {
    // iOS simulator: Use your computer's IP address instead of localhost
    // Find your IP: Windows: ipconfig | Mac/Linux: ifconfig
    // Default: Using 192.168.0.167 (update if different)
    // For localhost, use: 'http://localhost:4001/api'
    return 'http://192.168.0.167:4001/api';
  }
};

const API_BASE_URL = getApiBaseUrl();

// Log the API URL being used
logger.info('API Base URL configured', {
  url: API_BASE_URL,
  platform: Platform.OS,
  isDev: __DEV__,
});

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Log request in development
      logger.logRequest(config);
      
      return config;
    } catch (error) {
      logger.error('Failed to add auth token to request', error, {
        type: 'api_interceptor',
        action: 'request',
      });
      return Promise.reject(error);
    }
  },
  (error) => {
    logger.error('Request interceptor error', error, {
      type: 'api_interceptor',
      action: 'request',
    });
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Log successful response in development
    logger.logResponse(response);
    return response;
  },
  async (error) => {
    // Log API error
    logger.logApiError(error, {
      type: 'api_interceptor',
      action: 'response',
    });

    if (error.response?.status === 401) {
      // Token expired or invalid
      logger.warn('Authentication token expired or invalid', {
        type: 'auth_error',
        action: 'token_expired',
      });
      
      try {
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userData');
        // Navigate to login - handled by AuthContext
      } catch (storageError) {
        logger.error('Failed to clear auth storage', storageError, {
          type: 'storage_error',
          action: 'clear_auth',
        });
      }
    }

    return Promise.reject(error);
  }
);

export default api;




