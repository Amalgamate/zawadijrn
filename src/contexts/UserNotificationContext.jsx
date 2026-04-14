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
        setUnreadCount(resp.data.length);
      }
    } catch (err) {
      console.error('Failed to fetch user notifications:', err);
    }
  }, [isAuthenticated]);

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

    // Request browser notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, user?.id, playBeep, showBrowserNotification, fetchNotifications]);

  const markAsRead = useCallback(async (id) => {
    try {
      await api.userNotifications.markAsRead(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, [api.userNotifications]);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.userNotifications.markAllAsRead();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  }, [api.userNotifications]);

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
