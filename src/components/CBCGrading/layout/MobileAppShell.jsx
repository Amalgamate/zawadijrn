import React, { useState } from 'react';
import { usePermissions } from '../../../hooks/usePermissions';
import { PAGE_TITLES } from '../utils/constants';
import { usePWAInstall } from '../../../hooks/usePWAInstall';
import { 
  Home, 
  Mail, 
  Bell, 
  User,
  LogOut, 
  Download,
  Search,
  Plus,
  ClipboardCheck,
  BookOpen,
  Wallet,
  Calendar,
  LayoutGrid
} from 'lucide-react';
import { cn } from '../../../utils/cn';

const MobileAppShell = ({ children, user, onLogout, onNavigate, currentPage, brandingSettings }) => {
  const { role, isStaff } = usePermissions();
  const { isInstallable, installApp } = usePWAInstall();
  const [showFabMenu, setShowFabMenu] = useState(false);

  // Dynamic Navigation Items based on User Role
  const getNavItems = () => {
    const base = [
      { id: 'dashboard', label: 'Home', icon: Home, show: true },
    ];

    if (role === 'TEACHER') {
      return [
        ...base,
        { id: 'attendance-daily', label: 'Attendance', icon: ClipboardCheck, show: true },
        { id: 'assess-summative-assessment', label: 'Grades', icon: BookOpen, show: true },
        { id: 'comm-messages', label: 'Inbox', icon: Mail, show: true },
      ];
    }

    if (role === 'PARENT') {
      return [
        ...base,
        { id: 'accounting-invoices', label: 'Fees', icon: Wallet, show: true },
        { id: 'comm-notices', label: 'Notices', icon: Bell, show: true },
        { id: 'settings-users', label: 'Account', icon: User, show: true },
      ];
    }

    // Default / Admin / Other Staff
    return [
      ...base,
      { id: 'comm-messages', label: 'Inbox', icon: Mail, show: true },
      { id: 'comm-notices', label: 'Alerts', icon: Bell, show: true },
      { id: 'settings-users', label: 'Account', icon: User, show: true },
    ];
  };

  const navItems = getNavItems();

  const fabActions = [
    { label: 'Attendance', icon: ClipboardCheck, id: 'attendance-daily', color: 'bg-emerald-500' },
    { label: 'Assess', icon: BookOpen, id: 'assess-summative-assessment', color: 'bg-[var(--brand-purple)]' },
    { label: 'Timetable', icon: Calendar, id: 'facilities-classes', color: 'bg-blue-500' },
  ];

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-50 overflow-hidden relative font-['Poppins',_sans-serif]">
      {/* Premium Mobile Top App Bar - Glassmorphism */}
      <div className="bg-white/90 backdrop-blur-2xl border-b border-slate-200/60 flex flex-col z-50 sticky top-0" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="h-[72px] flex items-center justify-between px-6">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[var(--brand-purple)] to-purple-600 flex items-center justify-center p-2.5 shadow-xl shadow-purple-100 ring-4 ring-white transition-transform active:scale-95">
            {brandingSettings?.logoUrl ? (
              <img src={brandingSettings.logoUrl} alt="Logo" className="w-full h-full object-contain brightness-0 invert" />
            ) : (
              <img src="/logo-zawadi.png" alt="Logo" className="w-full h-full object-contain brightness-0 invert" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-[13px] text-slate-900 leading-tight tracking-tight uppercase">
              {brandingSettings?.schoolName || 'ZAWADI JUNIOR'}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                {role?.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isInstallable && (
            <button
              onClick={installApp}
              className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:text-[var(--brand-purple)] transition-all active:scale-90 flex items-center justify-center border border-slate-100"
            >
              <Download size={20} />
            </button>
          )}
          <button
            onClick={onLogout}
            className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center transition-all hover:bg-rose-100 active:scale-90 border border-rose-100 shadow-sm shadow-rose-100"
          >
            <LogOut size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto custom-scrollbar relative z-10 w-full bg-slate-50/50">
        <div className="px-6 pt-8" style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}>
          <div className="mb-8 flex items-center justify-between">
            <div className="flex flex-col gap-1">
               <p className="text-[10px] font-bold text-brand-purple uppercase tracking-[0.2em]">Current View</p>
               <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {PAGE_TITLES[currentPage] || (currentPage?.includes('settings') ? 'Settings' : 'Portal')}
              </h2>
            </div>
            <button className="w-12 h-12 bg-white rounded-2xl text-slate-400 border border-slate-200/60 shadow-sm active:scale-95 transition-all flex items-center justify-center">
              <Search size={20} strokeWidth={2.5} />
            </button>
          </div>
          {children}
        </div>
      </div>

      {/* Floating Action Button (FAB) - Staff Only */}
      {isStaff && (
        <div className="fixed z-[110] flex flex-col items-end gap-3" style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom))', right: '1.25rem' }}>
          {showFabMenu && (
            <div className="flex flex-col gap-3 mb-2 animate-in slide-in-from-bottom-4 duration-300">
              {fabActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => {
                    onNavigate(action.id);
                    setShowFabMenu(false);
                  }}
                  className="flex items-center gap-3 pr-2 group"
                >
                  <span className="bg-gray-900/80 backdrop-blur-md text-white text-[10px] font-semibold uppercase tracking-widest px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                    {action.label}
                  </span>
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-gray-200 border-2 border-white transition-transform active:scale-90",
                    action.color
                  )}>
                    <action.icon size={20} strokeWidth={3} />
                  </div>
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowFabMenu(!showFabMenu)}
            className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-2xl transition-all duration-500 transform active:scale-90 border-4 border-white",
              showFabMenu ? "bg-gray-900 rotate-45 shadow-none" : "bg-[var(--brand-purple)] shadow-purple-200"
            )}
          >
            <Plus size={32} strokeWidth={3} />
          </button>
        </div>
      )}

      {/* Premium Bottom Navigation - Glassmorphism */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl border-t border-gray-100 z-[100] lg:hidden flex flex-col" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="h-[68px] flex items-center justify-around px-4">
        {navItems.filter(item => item.show).map((item) => {
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="relative flex flex-col items-center justify-center w-full h-full transition-all duration-300"
            >
              <div className={cn(
                "p-2.5 rounded-2xl transition-all duration-500 transform active:scale-75",
                isActive ? "text-[var(--brand-purple)] bg-purple-50 shadow-inner" : "text-gray-400"
              )}>
                <item.icon 
                  size={24} 
                  strokeWidth={isActive ? 3 : 2}
                  className={isActive ? "drop-shadow-[0_0_8px_rgba(82,0,80,0.2)]" : ""}
                />
              </div>
              <span className={cn(
                "text-[9px] font-semibold uppercase tracking-[0.15em] mt-1.5 transition-all duration-300",
                isActive ? "text-[var(--brand-purple)]" : "text-gray-500"
              )}>
                {item.label}
              </span>

              {isActive && (
                <div className="absolute -top-1 w-12 h-1 bg-[var(--brand-purple)] rounded-full animate-in fade-in zoom-in duration-300" />
              )}
            </button>
          );
        })}
      </div>
      </div>
    </div>
  );
};

export default MobileAppShell;
