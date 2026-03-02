/**
 * useNotifications Hook
 * Manage toast notifications and alerts
 */

import { useState, useCallback } from 'react';

export const useNotifications = () => {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success'); // 'success' | 'error' | 'warning' | 'info'

  /**
   * Show a toast notification
   * @param {string} message - Message to display
   * @param {string} type - Type of notification (success, error, warning, info)
   * @param {number} duration - Duration in milliseconds (default: 3000)
   */
  const showNotification = useCallback((message, type = 'success', duration = 3000) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);

    // Auto-hide after duration
    setTimeout(() => {
      setShowToast(false);
    }, duration);
  }, []);

  /**
   * Show success notification
   * @param {string} message - Success message
   */
  const showSuccess = useCallback((message) => {
    showNotification(message, 'success');
  }, [showNotification]);

  /**
   * Show error notification
   * @param {string} message - Error message
   */
  const showError = useCallback((message) => {
    showNotification(message, 'error');
  }, [showNotification]);

  /**
   * Show warning notification
   * @param {string} message - Warning message
   */
  const showWarning = useCallback((message) => {
    showNotification(message, 'warning');
  }, [showNotification]);

  /**
   * Show info notification
   * @param {string} message - Info message
   */
  const showInfo = useCallback((message) => {
    showNotification(message, 'info');
  }, [showNotification]);

  /**
   * Hide current notification
   */
  const hideNotification = useCallback(() => {
    setShowToast(false);
  }, []);

  return {
    showToast,
    toastMessage,
    toastType,
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideNotification
  };
};
