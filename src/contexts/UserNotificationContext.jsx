import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

const UserNotificationContext = createContext();

export const UserNotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);

  // Derived — always computed from `notifications` so it never drifts out of sync.
  const unreadNotifications = notifications.filter(n => !n.isRead);
  const unreadCount = unreadNotifications.length;
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
      new Notification(title, { body: message, icon: '/logo-zawadi.png' });
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const resp = await api.userNotifications.getAll();
      if (resp.success) {
        // Server only returns isRead:false records. Merge with local state
        // so any notification already marked read locally stays read and
        // never pops back as "new" on a refetch.
        setNotifications(prev => {
          const localReadIds = new Set(
            prev.filter(n => n.isRead).map(n => n.id)
          );
          return resp.data.map(n =>
            localReadIds.has(n.id) ? { ...n, isRead: true } : n
          );
        });
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
      // Avoid duplicate: if this notification ID already exists locally, skip
      setNotifications(prev => {
        if (prev.some(n => n.id === notification.id)) return prev;
        return [{ ...notification, isRead: false }, ...prev];
      });
      // unreadCount is derived — no manual increment needed.
      
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
    // Optimistically mark as read in local state immediately so it
    // never reappears as "new" even if the API call is slow or fails.
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
    // unreadCount is derived — no manual decrement needed.
    try {
      await api.userNotifications.markAsRead(id);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      // Revert on failure
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: false } : n)
      );
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    // Optimistically mark all read in local state immediately.
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    // unreadCount is derived — no manual reset needed.
    try {
      await api.userNotifications.markAllAsRead();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      // On failure, re-fetch from server to restore accurate state
      fetchNotifications();
    }
  }, [fetchNotifications]);

  return (
    <UserNotificationContext.Provider value={{ 
      notifications,
      unreadNotifications,   // only the unread ones — use this in the bell dropdown
      unreadCount,           // derived count — always accurate
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
