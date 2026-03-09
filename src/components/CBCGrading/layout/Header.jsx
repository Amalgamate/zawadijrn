import React, { useState, useRef, useEffect } from 'react';
import { Bell, LogOut, Zap, ChevronDown, ClipboardList, BarChart3, MessageSquare, Calendar, Gift, User as UserIcon } from 'lucide-react';
import { usePermissions } from '../../../hooks/usePermissions';
import api from '../../../services/api';
import { getReminderDelay, shouldScheduleReminder } from './notificationReminder';
import { clockInTeacher, clockOutTeacher, getCurrentUserClockInStatus, syncCurrentUserClockInStatus } from '../../../utils/teacherClockIn';
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { cn } from "../../../utils/cn";

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

  const brandColor = brandingSettings?.brandColor || '#520050';

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm px-4 lg:px-8 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-4 group cursor-pointer" onClick={() => onNavigate?.('dashboard')}>
        <div className="relative">
          {brandingSettings?.logoUrl && (
            <img
              src={brandingSettings.logoUrl}
              alt="Logo"
              className="w-12 h-12 object-contain transition-transform duration-500 group-hover:scale-110 drop-shadow-sm"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
        </div>
        <div className="hidden sm:block">
          <h1 className="text-base lg:text-lg font-black text-gray-900 leading-none tracking-tight uppercase">
            {title || brandingSettings?.schoolName || 'ELIMCROWN'}
          </h1>
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1">
            {title ? (brandingSettings?.schoolName || 'Elimcrown') : 'School Management System'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        {/* Quick Actions Popover */}
        <Popover open={showQuickActions} onOpenChange={setShowQuickActions}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="hidden md:flex items-center gap-2 h-10 px-4 border-gray-200 hover:border-brand-purple/30 hover:bg-brand-purple/5 transition-all text-gray-700 font-bold"
            >
              <Zap size={16} className="text-yellow-500 fill-yellow-500 animate-pulse" />
              <span>Quick Actions</span>
              <ChevronDown size={14} className={cn("transition-transform duration-300 opacity-50", showQuickActions && "rotate-180")} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="end">
            <div className="px-3 py-2 border-b border-gray-50 mb-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Available Actions</p>
            </div>
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="ghost"
                onClick={() => {
                  action.action();
                  setShowQuickActions(false);
                }}
                className="w-full justify-start gap-3 h-11 text-sm font-bold text-gray-700 hover:text-brand-purple hover:bg-brand-purple/5 group"
              >
                <action.icon size={18} className="text-gray-400 group-hover:text-brand-purple group-hover:scale-110 transition-all" />
                <span>{action.label}</span>
              </Button>
            ))}
          </PopoverContent>
        </Popover>

        {/* Notifications Popover */}
        <Popover open={showNotifications} onOpenChange={(open) => {
          setShowNotifications(open);
          if (open) markAllNotificationsAsRead();
        }}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-10 w-10 text-gray-600 hover:text-brand-purple hover:bg-brand-purple/5 transition-all"
            >
              <Bell size={20} className={cn(unreadCount > 0 && "animate-wiggle")} />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 flex items-center justify-center font-black text-[10px] border-2 border-white"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-0 overflow-hidden" align="end">
            <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Notifications</h3>
              <Badge variant="purple" className="font-black">UPDATES</Badge>
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {notificationItems.length > 0 ? (
                <div className="p-2 space-y-1">
                  {birthdayNotificationItems.length > 0 && (
                    <div className="space-y-1">
                      <div className="px-3 py-2 text-[10px] font-black text-pink-500 uppercase tracking-widest flex items-center gap-2">
                        <Gift size={14} /> Birthdays
                      </div>
                      {birthdayNotificationItems.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => handleNotificationClick('birthday')}
                          className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-all flex items-start gap-3 group"
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center font-black text-xs shrink-0 shadow-sm border-2 transition-transform group-hover:scale-105",
                            b.isToday ? "bg-gradient-to-tr from-pink-500 to-rose-500 text-white border-pink-200" : "bg-gray-100 text-gray-600 border-gray-200"
                          )}>
                            {b.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 line-clamp-1">
                              {b.isToday ? '🎂 ' : ''}{b.name}
                            </p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">
                              Turns {b.turningAge} • {b.grade.replace('_', ' ')}
                            </p>
                            <Badge variant={b.isToday ? "destructive" : "secondary"} className="mt-1.5 h-4 text-[8px] font-black px-1.5">
                              {b.isToday ? "TODAY" : `IN ${b.daysUntil} DAYS`}
                            </Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {noticeNotificationItems.length > 0 && (
                    <div className="space-y-1 pt-2 border-t border-gray-50 mt-2">
                      <div className="px-3 py-2 text-[10px] font-black text-brand-purple uppercase tracking-widest flex items-center gap-2">
                        <Bell size={14} /> New Notices
                      </div>
                      {noticeNotificationItems.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => handleNotificationClick('comm-notices', { activeTab: 'notices', noticeId: n.id })}
                          className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-all group"
                        >
                          <p className="text-sm font-bold text-gray-900 group-hover:text-brand-purple transition-colors line-clamp-1">{n.title}</p>
                          <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{n.content}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline" className="text-[8px] h-4 font-bold uppercase">{n.priority || 'NORMAL'}</Badge>
                            <Badge variant="outline" className="text-[8px] h-4 font-bold uppercase">{n.category || 'GENERAL'}</Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-gray-400">
                  <Bell size={32} className="mx-auto mb-3 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest">No notifications</p>
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              onClick={() => setShowNotifications(false)}
              className="w-full h-12 border-t border-gray-50 rounded-none text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-brand-purple hover:bg-brand-purple/5"
            >
              Close
            </Button>
          </PopoverContent>
        </Popover>

        {/* Clock In/Out */}
        {String(user?.role || '').toUpperCase() === 'TEACHER' && (
          <Button
            onClick={clockInState.clockedIn ? handleClockOut : handleClockIn}
            variant={clockInState.clockedIn ? "secondary" : "outline"}
            className={cn(
              "hidden sm:flex h-10 px-4 font-black text-[10px] uppercase tracking-widest transition-all",
              clockInState.clockedIn ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" : "border-brand-purple/20 text-brand-purple hover:bg-brand-purple/5"
            )}
          >
            {clockInState.clockedIn ? 'Clock Out' : 'Clock In'}
          </Button>
        )}

        <div className="flex items-center gap-3 pl-4 border-l border-gray-100 ml-2">
          <div className="hidden lg:block text-right pr-1">
            <p className="text-sm font-black text-gray-900 leading-none">{user?.name || 'User'}</p>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1">
              {user?.role || 'Guest'}
            </p>
          </div>
          <div className="relative group">
            <div className="w-10 h-10 bg-brand-purple rounded-full flex items-center justify-center text-white font-black text-sm border-2 border-white shadow-md transition-transform group-hover:scale-105">
              {(user?.name || 'U').substring(0, 2).toUpperCase()}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onLogout}
            className="h-10 w-10 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
            title="Logout"
          >
            <LogOut size={18} />
          </Button>
        </div>
      </div>

      {/* Unread Reminder Toast (Styled) */}
      {showUnreadReminder && unreadCount > 0 && (
        <div className="fixed top-24 right-8 z-[140] w-80 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl p-5 animate-in slide-in-from-right-10 duration-500">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-full bg-brand-purple/10 text-brand-purple shadow-inner">
              <Bell size={20} className="animate-wiggle" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-gray-900 uppercase tracking-tight">Gentle Reminder</p>
              <p className="text-xs text-gray-500 mt-1 font-medium leading-relaxed">
                You have <span className="text-brand-purple font-black">{unreadCount}</span> unread notification{unreadCount === 1 ? '' : 's'}. Review them when convenient.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowUnreadReminder(false)} className="h-8 text-[9px] font-black uppercase flex-1 border-gray-200">
                  Later
                </Button>
                <Button variant="outline" size="sm" onClick={snoozeReminder} className="h-8 text-[9px] font-black uppercase flex-1 border-gray-200">
                  Snooze
                </Button>
                <Button size="sm" onClick={() => { setShowUnreadReminder(false); setShowNotifications(true); markAllNotificationsAsRead(); }} className="h-8 text-[9px] font-black uppercase w-full bg-brand-purple hover:bg-brand-purple/90 shadow-lg">
                  Review Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
});

Header.displayName = 'Header';

export default Header;
