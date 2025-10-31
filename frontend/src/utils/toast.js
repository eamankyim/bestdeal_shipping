/**
 * Toast Notification Utility
 * Provides consistent toast messages across the application
 * Note: This uses the static message API. For components using Ant Design App context,
 * use App.useApp() hook instead: const { message } = App.useApp();
 */

import React from 'react';
import { message } from 'antd';

/**
 * Configure global message settings
 * Enhanced for mobile responsiveness - Top Center positioning
 */
const isMobile = () => window.innerWidth <= 768;

message.config({
  top: isMobile() ? 16 : 24,
  duration: 4,
  maxCount: 3,
  rtl: false,
});

// Reconfigure on window resize for responsive positioning
if (typeof window !== 'undefined') {
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      message.config({
        top: isMobile() ? 16 : 24,
      });
    }, 150);
  });
}

/**
 * Show success toast
 */
export const showSuccess = (content, duration = 4) => {
  message.success({
    content,
    duration,
  });
};

/**
 * Show error toast
 */
export const showError = (content, duration = 5) => {
  message.error({
    content,
    duration,
  });
};

/**
 * Show warning toast
 */
export const showWarning = (content, duration = 4) => {
  message.warning({
    content,
    duration,
  });
};

/**
 * Show info toast
 */
export const showInfo = (content, duration = 3) => {
  message.info({
    content,
    duration,
  });
};

/**
 * Show loading toast (returns function to dismiss)
 */
export const showLoading = (content = 'Loading...', duration = 0) => {
  return message.loading({
    content,
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

/**
 * Show Alert-style toast with message and description
 * Converts Alert components to toast notifications
 */
export const showAlertToast = (alertMessage, description, type = 'info', duration = 5) => {
  const content = description 
    ? (
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{alertMessage}</div>
          <div style={{ fontSize: '13px', opacity: 0.9 }}>{description}</div>
        </div>
      )
    : alertMessage;

  const toastConfig = {
    content,
    duration,
  };

  switch (type) {
    case 'success':
      message.success(toastConfig);
      break;
    case 'error':
      message.error(toastConfig);
      break;
    case 'warning':
      message.warning(toastConfig);
      break;
    case 'info':
    default:
      message.info(toastConfig);
      break;
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
  showAlertToast,
};






