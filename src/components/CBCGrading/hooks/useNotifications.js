/**
 * useNotifications Hook
 * Manage toast notifications and alerts
 */

import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

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
    // Standard toast notification using react-hot-toast
    const toastConfig = { duration };
    
    switch (type) {
      case 'success':
        toast.success(message, toastConfig);
        break;
      case 'error':
        toast.error(message, toastConfig);
        break;
      case 'warning':
        toast(message, { ...toastConfig, icon: '⚠️' });
        break;
      case 'info':
      default:
        toast(message, { ...toastConfig, icon: 'ℹ️' });
        break;
    }

    setToastMessage(message);
    setToastType(type);
    setShowToast(true);

    // Auto-hide local state after duration (kept for backward compatibility)
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

  const [unreadCount, setUnreadCount] = useState(0);

  /**
   * Mark all notifications as read
   */
  const markAllNotificationsAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return {
    showToast,
    toastMessage,
    toastType,
    unreadCount,
    setUnreadCount,
    markAllNotificationsAsRead,
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideNotification
  };
};
