import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

const UserNotificationContext = createContext();

export const UserNotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const audioRef = useRef(null);

  // Sound Options (using base64 encoded short modern pings)
  const SOUNDS = {
    MODERN_PING: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3', // Example external URL or local path
    SOFT_CHIME: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3',
  };

  const playBeep = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.warn('Audio play failed:', e));
    }
  }, []);

  const showBrowserNotification = useCallback((title, message) => {
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
      new Notification(title, { body: message, icon: '/logo-new.png' });
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const resp = await api.userNotifications.getAll();
      if (resp.success) {
        setNotifications(resp.data);
        // Only count notifications that haven't been read yet
        setUnreadCount(resp.data.filter(n => !n.isRead).length);
      }
    } catch (err) {
      console.error('Failed to fetch user notifications:', err);
    }
  }, [isAuthenticated]);

  // Defined BEFORE the useEffect that calls it so the reference is stable
  const registerPushSubscription = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (existing) return; // Already subscribed

      // Fetch VAPID public key from server
      const resp = await api.userNotifications.getVapidPublicKey?.();
      if (!resp?.data?.publicKey) {
        console.warn('VAPID public key not available — push subscriptions skipped');
        return;
      }

      const urlBase64ToUint8Array = (base64String) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = atob(base64);
        return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
      };

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(resp.data.publicKey),
      });

      // Send subscription to server
      await api.userNotifications.savePushSubscription?.(subscription);
      console.log('✅ Push subscription registered successfully');
    } catch (err) {
      console.warn('Push subscription failed:', err);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Initialize Socket
    const serverUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:5000' 
      : window.location.origin;

    const newSocket = io(serverUrl, {
      withCredentials: true,
      auth: { token: localStorage.getItem('token') }
    });

    newSocket.on('connect', () => {
      console.log('🔌 Connected to notification socket');
    });

    newSocket.on('notification:new', (notification) => {
      console.log('🔔 New notification received:', notification);
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Play sound
      playBeep();
      
      // Browser notification
      showBrowserNotification(notification.title, notification.message);
    });

    setSocket(newSocket);

    // Initial fetch
    fetchNotifications();

    // Request browser notification permission and set up push subscription
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          registerPushSubscription();
        }
      });
    } else if ("Notification" in window && Notification.permission === 'granted') {
      registerPushSubscription();
    }

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, user?.id, playBeep, showBrowserNotification, fetchNotifications, registerPushSubscription]);

  const markAsRead = useCallback(async (id) => {
    try {
      await api.userNotifications.markAsRead(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.userNotifications.markAllAsRead();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  }, []);

  return (
    <UserNotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      markAsRead, 
      markAllAsRead,
      fetchNotifications 
    }}>
      {children}
      <audio ref={audioRef} src={SOUNDS.MODERN_PING} preload="auto" />
    </UserNotificationContext.Provider>
  );
};

export const useUserNotifications = () => {
  const context = useContext(UserNotificationContext);
  if (!context) throw new Error('useUserNotifications must be used within UserNotificationProvider');
  return context;
};
