import React, { useState, useRef, useEffect } from 'react';
import { Bell, LogOut, Zap, ChevronDown, ClipboardList, BarChart3, MessageSquare, Calendar, Cake } from 'lucide-react';
import { usePermissions } from '../../../hooks/usePermissions';
import api from '../../../services/api';
import { getReminderDelay, shouldScheduleReminder } from './notificationReminder';
import { clockInTeacher, clockOutTeacher, getCurrentUserClockInStatus, syncCurrentUserClockInStatus } from '../../../utils/teacherClockIn';

const Header = React.memo(({ user, onLogout, brandingSettings, title, onNavigate }) => {
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUnreadReminder, setShowUnreadReminder] = useState(false);
  const [birthdays, setBirthdays] = useState([]);
  const [latestNotices, setLatestNotices] = useState([]);
  const [, setLoadingBirthdays] = useState(false);
  const [readNotificationKeys, setReadNotificationKeys] = useState(() => new Set());
  const [reminderCycle, setReminderCycle] = useState(0);
  const [clockInState, setClockInState] = useState(() => getCurrentUserClockInStatus(user));

  const notificationRef = useRef(null);
  const dropdownRef = useRef(null);
  const sessionStartedAtRef = useRef(Date.now());
  const { role } = usePermissions();

  const readStorageKey = `header_read_notifications_${user?.id || user?.email || 'unknown'}`;
  const reminderStorageKey = `header_last_notification_reminder_${user?.id || user?.email || 'unknown'}`;
  const snoozeStorageKey = `header_notification_reminder_snooze_until_${user?.id || user?.email || 'unknown'}`;

  const birthdayNotificationItems = birthdays.map((b) => ({
    ...b,
    type: 'birthday',
    key: `birthday-${b.id}-${b.turningAge}-${b.daysUntil}-${b.isToday ? 'today' : 'upcoming'}`
  }));

  const noticeNotificationItems = latestNotices.map((n) => ({
    ...n,
    type: 'notice',
    key: `notice-${n.id}-${n.publishedAt || n.createdAt || ''}`
  }));

  const notificationItems = [...birthdayNotificationItems, ...noticeNotificationItems];

  const unreadNotifications = notificationItems.filter((item) => !readNotificationKeys.has(item.key));
  const unreadCount = unreadNotifications.length;

  const markAllNotificationsAsRead = () => {
    if (notificationItems.length === 0) return;
    setReadNotificationKeys((prev) => {
      const next = new Set(prev);
      notificationItems.forEach((item) => next.add(item.key));
      return next;
    });
    setShowUnreadReminder(false);
  };

  const snoozeReminder = () => {
    const snoozeUntil = Date.now() + (30 * 60 * 1000);
    try {
      localStorage.setItem(snoozeStorageKey, String(snoozeUntil));
    } catch { }
    setShowUnreadReminder(false);
    setReminderCycle((prev) => prev + 1);
  };

  const handleNotificationClick = (type, params = {}) => {
    markAllNotificationsAsRead();
    setShowNotifications(false);
    if (onNavigate) {
      if (type === 'birthday') {
        onNavigate('comm-notices', { activeTab: 'birthdays' });
      } else {
        onNavigate(type, params);
      }
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowQuickActions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch birthdays
  useEffect(() => {
    const fetchBirthdays = async () => {
      setLoadingBirthdays(true);
      try {
        const resp = await api.learners.getBirthdays();
        if (resp.success) {
          setBirthdays(resp.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch birthdays:', error);
      } finally {
        setLoadingBirthdays(false);
      }
    };

    fetchBirthdays();
    // Refresh every hour
    const interval = setInterval(fetchBirthdays, 3600000);
    return () => clearInterval(interval);
  }, []);

  // Fetch latest notices for bell dropdown
  useEffect(() => {
    const fetchHeaderNotices = async () => {
      try {
        const resp = await api.notices.getAll();
        const notices = (resp?.data || []).slice(0, 5).map((n) => ({
          id: n.id,
          title: n.title,
          content: n.content,
          priority: n.priority,
          category: n.category,
          publishedAt: n.publishedAt,
          createdAt: n.createdAt
        }));
        setLatestNotices(notices);
      } catch (error) {
        console.error('Failed to fetch header notices:', error);
      }
    };

    fetchHeaderNotices();
    const interval = setInterval(fetchHeaderNotices, 300000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(readStorageKey);
      if (!raw) {
        setReadNotificationKeys(new Set());
        return;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setReadNotificationKeys(new Set(parsed));
      }
    } catch {
      setReadNotificationKeys(new Set());
    }
  }, [readStorageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(readStorageKey, JSON.stringify(Array.from(readNotificationKeys)));
    } catch { }
  }, [readNotificationKeys, readStorageKey]);

  useEffect(() => {
    if (!shouldScheduleReminder({ unreadCount })) {
      setShowUnreadReminder(false);
      return;
    }

    const now = Date.now();
    const snoozeUntil = Number(localStorage.getItem(snoozeStorageKey) || 0);
    if (snoozeUntil > now) {
      const snoozeTimer = setTimeout(() => {
        setShowUnreadReminder(true);
        try {
          localStorage.removeItem(snoozeStorageKey);
          localStorage.setItem(reminderStorageKey, String(Date.now()));
        } catch { }
        setReminderCycle((prev) => prev + 1);
      }, snoozeUntil - now);

      return () => clearTimeout(snoozeTimer);
    }

    if (snoozeUntil) {
      try {
        localStorage.removeItem(snoozeStorageKey);
      } catch { }
    }

    const lastReminderAt = Number(localStorage.getItem(reminderStorageKey) || 0) || null;
    const delay = getReminderDelay({
      unreadCount,
      sessionStartedAt: sessionStartedAtRef.current,
      lastReminderAt,
      now
    });

    if (delay === null) return;

    const timer = setTimeout(() => {
      setShowUnreadReminder(true);
      try {
        localStorage.setItem(reminderStorageKey, String(Date.now()));
      } catch { }
      setReminderCycle((prev) => prev + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [unreadCount, reminderStorageKey, snoozeStorageKey, reminderCycle]);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getQuickActions = () => {
    const teacherActions = [
      { icon: ClipboardList, label: 'Create Assessment', action: () => console.log('Create Assessment') },
      { icon: Calendar, label: 'Mark Attendance', action: () => console.log('Mark Attendance') },
      { icon: BarChart3, label: 'View Reports', action: () => console.log('View Reports') },
      { icon: MessageSquare, label: 'Send Message', action: () => console.log('Send Message') },
    ];

    const adminActions = [
      { icon: ClipboardList, label: 'Add Student', action: () => console.log('Add Student') },
      { icon: Calendar, label: 'View Attendance', action: () => console.log('View Attendance') },
      { icon: BarChart3, label: 'Generate Reports', action: () => console.log('Generate Reports') },
      { icon: MessageSquare, label: 'Send Notice', action: () => console.log('Send Notice') },
    ];

    if (role === 'TEACHER') return teacherActions;
    if (role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'HEAD_TEACHER') return adminActions;

    return teacherActions;
  };

  const quickActions = getQuickActions();

  useEffect(() => {
    let active = true;

    const refreshClockIn = async () => {
      const status = await syncCurrentUserClockInStatus(user);
      if (!active) return;
      setClockInState(status);
    };

    refreshClockIn();
    window.addEventListener('teacherClockInChanged', refreshClockIn);
    window.addEventListener('storage', refreshClockIn);

    return () => {
      active = false;
      window.removeEventListener('teacherClockInChanged', refreshClockIn);
      window.removeEventListener('storage', refreshClockIn);
    };
  }, [user]);

  const handleClockIn = () => {
    clockInTeacher(user, {
      source: 'header',
      role: user?.role
    });
    setClockInState(getCurrentUserClockInStatus(user));
  };

  const handleClockOut = () => {
    clockOutTeacher(user, {
      source: 'header',
      role: user?.role
    });
    setClockInState(getCurrentUserClockInStatus(user));
  };

  return (
    <div className="h-20 border-b border-brand-purple/20 shadow-xl px-8 py-5 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {brandingSettings?.logoUrl && (
          <img
            src={brandingSettings.logoUrl}
            alt="Logo"
            className="w-12 h-12 object-contain drop-shadow-sm"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            {title || brandingSettings?.schoolName || 'Elimcrown'}
          </h1>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
            {title ? (brandingSettings?.schoolName || 'Elimcrown') : 'CBC Assessment & Grading System'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Quick Actions Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-gray-900 bg-slate-200 hover:bg-slate-300 border border-gray-300 hover:border-gray-400 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg group"
          >
            <Zap size={18} className="text-yellow-400 group-hover:scale-110 transition-transform duration-300" />
            <span>Quick Actions</span>
            <ChevronDown size={16} className={`transition-transform duration-300 opacity-60 ${showQuickActions ? 'rotate-180' : ''}`} />
          </button>

          {showQuickActions && (
            <div className="absolute right-0 mt-3 w-64 bg-slate-100 rounded-lg shadow-2xl border border-gray-300 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-300">
                <p className="text-[10px] font-bold text-brand-purple uppercase tracking-widest">Available Actions</p>
              </div>
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => {
                    action.action();
                    setShowQuickActions(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-800 hover:bg-slate-200/50 hover:border-l-3 hover:border-brand-purple transition-all duration-300 border-l-3 border-transparent group"
                >
                  <action.icon size={18} className="text-brand-purple/70 group-hover:text-brand-purple group-hover:scale-110 transition-all duration-300" />
                  <span className="font-semibold group-hover:text-white transition-colors">{action.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => {
              const next = !showNotifications;
              setShowNotifications(next);
              if (next) {
                markAllNotificationsAsRead();
              }
            }}
            className="text-gray-900 hover:text-brand-purple bg-slate-200 hover:bg-slate-300 p-3 rounded-lg transition-all duration-300 border border-gray-300 hover:border-brand-purple/60 shadow-md hover:shadow-lg group relative"
          >
            <Bell size={20} className="opacity-75 group-hover:scale-110 transition-transform duration-300" />
            {unreadCount > 0 && (
              <>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-ping"></span>
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-600 text-white rounded-full text-[10px] font-black flex items-center justify-center border border-slate-100 shadow-lg">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              </>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-96 bg-slate-100 rounded-lg shadow-2xl border border-gray-300 z-[110] overflow-hidden">
              <div className="p-4 border-b border-gray-300 bg-slate-50 flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white bg-brand-purple px-3 py-1 rounded-lg shadow-md">
                  Updates
                </span>
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {notificationItems.length > 0 ? (
                  <div className="p-3">
                    {birthdayNotificationItems.length > 0 && (
                      <>
                        <div
                          onClick={() => handleNotificationClick('birthday')}
                          className="px-4 py-2.5 bg-slate-200 border border-pink-300 rounded-lg mb-3 flex items-center gap-2.5 cursor-pointer hover:bg-slate-300 transition-colors"
                        >
                          <Cake size={16} className="text-pink-400 shrink-0" />
                          <span className="text-[10px] font-bold uppercase text-pink-700 tracking-wider">Birthday Reminders</span>
                        </div>
                        {birthdayNotificationItems.map((b) => (
                          <div
                            key={b.id}
                            onClick={() => handleNotificationClick('birthday')}
                            className="p-3.5 hover:bg-slate-200 rounded-lg transition-all duration-300 flex items-start gap-4 border-b border-gray-300 last:border-0 group cursor-pointer"
                          >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-md transition-all duration-300 group-hover:scale-110 border-2 ${b.isToday ? 'bg-gradient-to-r from-pink-600 to-red-600 text-white border-pink-400 animate-bounce' : 'bg-slate-200 text-gray-700 border-gray-300'}`}>
                              {b.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 group-hover:text-brand-purple transition-colors">
                                {b.isToday ? '🎂 Today: ' : ''}{b.name}
                              </p>
                              <p className="text-xs text-gray-600 font-semibold">
                                Turns {b.turningAge} • {b.grade.replace('_', ' ')}
                              </p>
                              <p className={`text-[10px] font-bold mt-1.5 uppercase tracking-wider ${b.isToday ? 'text-pink-700 bg-pink-200 px-2 py-1 rounded-lg inline-block' : 'text-slate-600'}`}>
                                {b.isToday ? 'HAPPENING TODAY 🎉' : `In ${b.daysUntil} days`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {noticeNotificationItems.length > 0 && (
                      <>
                        <div
                          onClick={() => handleNotificationClick('comm-notices', { activeTab: 'notices' })}
                          className="px-4 py-2.5 bg-slate-200 border border-brand-purple/30 rounded-lg mt-3 mb-3 flex items-center gap-2.5 cursor-pointer hover:bg-slate-300 transition-colors"
                        >
                          <Bell size={16} className="text-brand-purple shrink-0" />
                          <span className="text-[10px] font-bold uppercase text-brand-purple tracking-wider">New Notices</span>
                        </div>
                        {noticeNotificationItems.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => handleNotificationClick('comm-notices', { activeTab: 'notices', noticeId: n.id })}
                            className="p-3.5 hover:bg-slate-200 rounded-lg transition-all duration-300 border-b border-gray-300 last:border-0 group cursor-pointer"
                          >
                            <p className="text-sm font-bold text-gray-900 group-hover:text-brand-purple transition-colors line-clamp-1">{n.title}</p>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{n.content}</p>
                            <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">
                              {(n.priority || 'NORMAL')} • {(n.category || 'General')}
                            </p>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Bell size={24} className="text-gray-400 mx-auto mb-2 opacity-50" />
                    <p className="text-xs text-gray-600 font-semibold">No new notifications</p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 border-t border-gray-300 text-center">
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-[10px] font-bold uppercase tracking-widest text-brand-purple hover:text-brand-purple/80 transition-colors"
                >
                  Close Notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {String(user?.role || '').toUpperCase() === 'TEACHER' && (
          <button
            onClick={clockInState.clockedIn ? handleClockOut : handleClockIn}
            className={`px-4 py-2.5 rounded-lg border font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-sm ${clockInState.clockedIn
              ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
              : 'bg-white text-brand-purple border-brand-purple/40 hover:bg-brand-purple/5'
              }`}
            title={clockInState.clockedIn ? 'Clock out for today' : 'Clock in for today'}
          >
            {clockInState.clockedIn ? 'Clock Out' : 'Clock In'}
          </button>
        )}

        <div className="flex items-center gap-4 pl-6 border-l border-brand-purple/20">
          <div className="text-right">
            <p className="text-sm font-bold text-gray-900">{user?.name || 'Admin User'}</p>
            <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider">
              {user?.role || 'System Admin'}
            </p>
          </div>
          <div className="w-12 h-12 bg-brand-purple rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-brand-purple/50 shadow-lg group hover:scale-110 transition-transform duration-300">
            {(user?.name || 'AU').substring(0, 2).toUpperCase()}
          </div>
          <button
            onClick={onLogout}
            className="text-gray-900 hover:text-red-600 bg-slate-200 hover:bg-red-100 border border-gray-300 hover:border-red-400 p-3 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg group"
            title="Logout"
          >
            <LogOut size={18} className="opacity-75 group-hover:scale-110 transition-transform duration-300" />
          </button>
        </div>
      </div>

      {showUnreadReminder && unreadCount > 0 && (
        <div className="fixed top-24 right-8 z-[140] w-80 bg-white border border-gray-200 rounded-xl shadow-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 p-2 rounded-full bg-brand-purple/10 text-brand-purple">
              <Bell size={16} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">Gentle Reminder</p>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                You have {unreadCount} unread notification{unreadCount === 1 ? '' : 's'}. Please review them when convenient.
              </p>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  onClick={() => setShowUnreadReminder(false)}
                  className="px-3 py-1.5 text-xs font-bold border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Later
                </button>
                <button
                  onClick={snoozeReminder}
                  className="px-3 py-1.5 text-xs font-bold border border-brand-purple/30 text-brand-purple rounded-lg hover:bg-brand-purple/5 transition-colors"
                >
                  Snooze 30m
                </button>
                <button
                  onClick={() => {
                    setShowUnreadReminder(false);
                    setShowNotifications(true);
                    markAllNotificationsAsRead();
                  }}
                  className="px-3 py-1.5 text-xs font-bold bg-brand-purple text-white rounded-lg hover:bg-brand-purple/90 transition-colors"
                >
                  Review Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

Header.displayName = 'Header';

export default Header;
