/**
 * Toast Notification Utility
 * Provides consistent toast messages across the application
 */

import { message } from 'antd';

/**
 * Configure global message settings
 */
message.config({
  top: 80,
  duration: 4,
  maxCount: 3,
});

/**
 * Show success toast
 */
export const showSuccess = (content, duration = 4) => {
  message.success({
    content: `✅ ${content}`,
    duration,
  });
};

/**
 * Show error toast
 */
export const showError = (content, duration = 5) => {
  message.error({
    content: `❌ ${content}`,
    duration,
  });
};

/**
 * Show warning toast
 */
export const showWarning = (content, duration = 4) => {
  message.warning({
    content: `⚠️ ${content}`,
    duration,
  });
};

/**
 * Show info toast
 */
export const showInfo = (content, duration = 3) => {
  message.info({
    content: `ℹ️ ${content}`,
    duration,
  });
};

/**
 * Show loading toast (returns function to dismiss)
 */
export const showLoading = (content = 'Loading...', duration = 0) => {
  return message.loading({
    content: `⏳ ${content}`,
    duration,
  });
};

/**
 * Handle API errors with appropriate toast messages
 */
export const handleApiError = (error, customMessage = null) => {
  let errorMessage = customMessage || 'An error occurred';

  // Extract error message from various formats
  if (error.message) {
    errorMessage = error.message;
  } else if (error.data && error.data.message) {
    errorMessage = error.data.message;
  } else if (error.response && error.response.data && error.response.data.message) {
    errorMessage = error.response.data.message;
  }

  // Show appropriate message based on error type
  if (error.status === 401) {
    showError('Invalid credentials. Please check your email and password.');
  } else if (error.status === 403) {
    showError('Access denied. You do not have permission to perform this action.');
  } else if (error.status === 404) {
    showError('Resource not found. Please try again.');
  } else if (error.status === 422) {
    showError('Validation error. Please check your input.');
  } else if (error.status === 500) {
    showError('Server error. Please try again later.');
  } else if (errorMessage.includes('Network') || errorMessage.includes('fetch')) {
    showError('Network error. Please check your internet connection.');
  } else if (errorMessage.includes('CORS')) {
    showError('Connection error. Please contact support.');
  } else {
    showError(errorMessage);
  }

  // Log error details for debugging
  console.error('API Error:', error);
};

/**
 * Show login error with specific messages
 */
export const showLoginError = (error) => {
  if (error.message && error.message.includes('Invalid email or password')) {
    showError('Invalid email or password. Please check your credentials.');
  } else if (error.message && error.message.includes('deactivated')) {
    showError('Your account has been deactivated. Please contact support.');
  } else {
    handleApiError(error, 'Login failed. Please try again.');
  }
};

/**
 * Show form validation error
 */
export const showValidationError = (fieldErrors) => {
  if (typeof fieldErrors === 'string') {
    showError(fieldErrors);
  } else if (Array.isArray(fieldErrors)) {
    fieldErrors.forEach(err => showError(err));
  } else {
    showError('Please check your input and try again.');
  }
};

export default {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  loading: showLoading,
  handleApiError,
  showLoginError,
  showValidationError,
};






