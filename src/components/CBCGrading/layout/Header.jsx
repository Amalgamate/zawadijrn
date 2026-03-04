import React, { useState, useRef, useEffect } from 'react';
import { Bell, LogOut, Zap, ChevronDown, ClipboardList, BarChart3, MessageSquare, Calendar, Cake } from 'lucide-react';
import { usePermissions } from '../../../hooks/usePermissions';
import api, { schoolAPI } from '../../../services/api';

const Header = React.memo(({ user, onLogout, brandingSettings, title, onNavigate }) => {
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [birthdays, setBirthdays] = useState([]);
  const [, setLoadingBirthdays] = useState(false);

  const notificationRef = useRef(null);
  const dropdownRef = useRef(null);
  const { role } = usePermissions();

  const handleNotificationClick = (type, params = {}) => {
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

  return (
    <div className="h-20 border-b border-brand-purple/20 shadow-xl px-8 py-5 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {title || brandingSettings?.schoolName || 'Elimcrown'}
          </h1>
          <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider">
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
            onClick={() => setShowNotifications(!showNotifications)}
            className="text-gray-900 hover:text-brand-purple bg-slate-200 hover:bg-slate-300 p-3 rounded-lg transition-all duration-300 border border-gray-300 hover:border-brand-purple/60 shadow-md hover:shadow-lg group relative"
          >
            <Bell size={20} className="opacity-75 group-hover:scale-110 transition-transform duration-300" />
            {birthdays.length > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-gradient-to-r from-pink-500 to-red-500 rounded-full animate-pulse border-2 border-slate-900 shadow-lg"></span>
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
                {birthdays.length > 0 ? (
                  <div className="p-3">
                    <div
                      onClick={() => handleNotificationClick('birthday')}
                      className="px-4 py-2.5 bg-slate-200 border border-pink-300 rounded-lg mb-3 flex items-center gap-2.5 cursor-pointer hover:bg-slate-300 transition-colors"
                    >
                      <Cake size={16} className="text-pink-400 shrink-0" />
                      <span className="text-[10px] font-bold uppercase text-pink-700 tracking-wider">Birthday Reminders</span>
                    </div>
                    {birthdays.map((b) => (
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

        <div className="flex items-center gap-4 pl-6 border-l border-brand-purple/20">
          <div className="text-right">
            <p className="text-sm font-bold text-gray-900">{user?.name || 'Admin User'}</p>
            <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider">
              {user?.role || 'System Admin'}
            </p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-brand-purple to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-brand-purple/50 shadow-lg group hover:scale-110 transition-transform duration-300">
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
    </div>
  );
});

Header.displayName = 'Header';

export default Header;
