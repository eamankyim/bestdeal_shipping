/**
 * Mobile App Error Logger
 * Provides structured error logging with context and optional remote reporting
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  FATAL: 'FATAL',
};

const MAX_LOG_HISTORY = 100; // Keep last 100 logs
const LOG_STORAGE_KEY = '@mobile_app_logs';

class Logger {
  constructor() {
    this.logs = [];
    this.isDevelopment = __DEV__;
    this.enableRemoteLogging = false; // Set to true to enable remote logging
    this.remoteLoggingEndpoint = null; // Set your remote logging endpoint
  }

  /**
   * Format log entry with timestamp and context
   */
  formatLog(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      context: {
        ...context,
        platform: 'mobile',
        environment: this.isDevelopment ? 'development' : 'production',
      },
    };

    return logEntry;
  }

  /**
   * Store log in AsyncStorage (for debugging)
   */
  async storeLog(logEntry) {
    try {
      this.logs.push(logEntry);
      
      // Keep only last MAX_LOG_HISTORY logs in memory
      if (this.logs.length > MAX_LOG_HISTORY) {
        this.logs.shift();
      }

      // Store in AsyncStorage for persistence
      await AsyncStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(this.logs.slice(-50))); // Keep last 50 in storage
    } catch (error) {
      // Silently fail if storage fails
      console.warn('Failed to store log:', error);
    }
  }

  /**
   * Send log to remote logging service (optional)
   */
  async sendToRemote(logEntry) {
    if (!this.enableRemoteLogging || !this.remoteLoggingEndpoint) {
      return;
    }

    try {
      // Implement your remote logging service here
      // Example: Send to your backend API
      // await fetch(this.remoteLoggingEndpoint, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(logEntry),
      // });
    } catch (error) {
      // Don't log remote logging failures to avoid infinite loops
      console.warn('Failed to send log to remote:', error);
    }
  }

  /**
   * Log debug message
   */
  debug(message, context = {}) {
    if (!this.isDevelopment) return;
    
    const logEntry = this.formatLog(LOG_LEVELS.DEBUG, message, context);
    console.log(`[DEBUG] ${message}`, context);
    this.storeLog(logEntry);
  }

  /**
   * Log info message
   */
  info(message, context = {}) {
    const logEntry = this.formatLog(LOG_LEVELS.INFO, message, context);
    console.log(`[INFO] ${message}`, context);
    this.storeLog(logEntry);
    this.sendToRemote(logEntry);
  }

  /**
   * Log warning message
   */
  warn(message, context = {}) {
    const logEntry = this.formatLog(LOG_LEVELS.WARN, message, context);
    console.warn(`[WARN] ${message}`, context);
    this.storeLog(logEntry);
    this.sendToRemote(logEntry);
  }

  /**
   * Log error message
   */
  error(message, error = null, context = {}) {
    const errorContext = {
      ...context,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        } : null,
        request: error.request ? {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
        } : null,
      } : null,
    };

    const logEntry = this.formatLog(LOG_LEVELS.ERROR, message, errorContext);
    console.error(`[ERROR] ${message}`, errorContext);
    this.storeLog(logEntry);
    this.sendToRemote(logEntry);
  }

  /**
   * Log fatal error
   */
  fatal(message, error = null, context = {}) {
    const errorContext = {
      ...context,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
      } : null,
    };

    const logEntry = this.formatLog(LOG_LEVELS.FATAL, message, errorContext);
    console.error(`[FATAL] ${message}`, errorContext);
    this.storeLog(logEntry);
    this.sendToRemote(logEntry);
  }

  /**
   * Log API request
   */
  logRequest(config) {
    if (!this.isDevelopment) return;
    
    this.debug('API Request', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      headers: config.headers,
      data: config.data,
    });
  }

  /**
   * Log API response
   */
  logResponse(response) {
    if (!this.isDevelopment) return;
    
    this.debug('API Response', {
      status: response.status,
      statusText: response.statusText,
      url: response.config?.url,
      data: response.data,
    });
  }

  /**
   * Log API error
   */
  logApiError(error, context = {}) {
    let errorMessage = 'API Error: Unknown error';
    let errorDetails = {};

    if (error.response) {
      // Server responded with error status
      errorMessage = `API Error: ${error.response.status} ${error.response.statusText}`;
      errorDetails = {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: error.config?.url,
        method: error.config?.method,
      };
    } else if (error.request) {
      // Request was made but no response received
      errorMessage = 'Network Error: No response from server';
      errorDetails = {
        code: error.code,
        message: error.message,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        method: error.config?.method,
        timeout: error.config?.timeout,
        // Common network error codes
        isNetworkError: error.code === 'NETWORK_ERROR' || error.message?.includes('Network'),
        isTimeout: error.code === 'ECONNABORTED' || error.message?.includes('timeout'),
        isConnectionRefused: error.code === 'ECONNREFUSED' || error.message?.includes('Connection refused'),
      };
    } else {
      // Error setting up the request
      errorMessage = `Request Setup Error: ${error.message}`;
      errorDetails = {
        message: error.message,
        stack: error.stack,
      };
    }

    this.error(errorMessage, error, {
      ...context,
      ...errorDetails,
      type: 'api_error',
    });
  }

  /**
   * Get stored logs
   */
  async getLogs() {
    try {
      const storedLogs = await AsyncStorage.getItem(LOG_STORAGE_KEY);
      return storedLogs ? JSON.parse(storedLogs) : [];
    } catch (error) {
      console.warn('Failed to retrieve logs:', error);
      return [];
    }
  }

  /**
   * Clear stored logs
   */
  async clearLogs() {
    try {
      await AsyncStorage.removeItem(LOG_STORAGE_KEY);
      this.logs = [];
      this.info('Logs cleared');
    } catch (error) {
      console.warn('Failed to clear logs:', error);
    }
  }

  /**
   * Export logs as string (for sharing/debugging)
   */
  async exportLogs() {
    const logs = await this.getLogs();
    return JSON.stringify(logs, null, 2);
  }
}

// Create singleton instance
const logger = new Logger();

export default logger;
export { LOG_LEVELS };

