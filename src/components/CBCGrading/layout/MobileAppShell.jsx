import React from 'react';
import { usePermissions } from '../../../hooks/usePermissions';
import {
  Home,
  ClipboardCheck,
  Plus,
  Mail,
  User,
  Search,
  Bell,
} from 'lucide-react';
import { cn } from '../../../utils/cn';

const MobileAppShell = ({ children, user, onNavigate, currentPage, brandingSettings }) => {
  const { role } = usePermissions();

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'attendance-daily', label: 'Attend', icon: ClipboardCheck },
    { id: 'comm-messages', label: 'Inbox', icon: Mail },
    { id: 'settings-users', label: 'Profile', icon: User },
  ];

  const showDashboardChrome = currentPage === 'dashboard';

  return (
    <div className="h-[100dvh] bg-[#f0efe9] flex justify-center overflow-hidden">
      <div className="w-full max-w-[420px] bg-white flex flex-col rounded-none md:rounded-[40px] md:mt-2 md:mb-2 md:shadow-[0_24px_64px_rgba(0,0,0,0.18)] overflow-hidden relative">
        <div className="h-11 flex items-center justify-between px-6 border-b border-[#f4f4f0] bg-white">
          <span className="text-[13px] font-medium text-[#1a1a18]">9:41</span>
          <span className="text-[11px] text-[#888]">WiFi</span>
        </div>

        <div className="h-16 flex items-center justify-between px-5 border-b border-[#f4f4f0] bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-[#1a1a18] flex items-center justify-center">
              <img src={brandingSettings?.logoUrl || '/branding/logo.png'} alt="Logo" className="w-5 h-5 object-contain brightness-0 invert" />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-[#1a1a18] leading-tight">
                {brandingSettings?.schoolName || 'Zawadi Junior'}
              </div>
              <div className="text-[10px] uppercase tracking-[0.06em] text-[#aaa]">School Portal</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-[10px] border border-[#ebebeb] bg-[#fafafa] flex items-center justify-center">
              <Search size={16} className="text-[#555]" />
            </button>
            <button className="w-9 h-9 rounded-[10px] border border-[#ebebeb] bg-[#fafafa] flex items-center justify-center relative">
              <Bell size={16} className="text-[#555]" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#e44]" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#fafaf8] pb-4">{children}</div>

        {showDashboardChrome && (
          <button
            onClick={() => onNavigate(role === 'TEACHER' ? 'learners-admissions' : 'dashboard')}
            className="absolute bottom-[84px] right-5 w-12 h-12 rounded-2xl bg-[#1a1a18] text-white flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.2)] z-20"
          >
            <Plus size={20} />
          </button>
        )}

        <div className="h-[72px] border-t border-[#f0f0ec] bg-white flex items-center px-2 pb-[env(safe-area-inset-bottom)]">
          {navItems.map((item, idx) => {
            const isActive = currentPage === item.id || (item.id === 'dashboard' && currentPage === 'learners-list');
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn("flex-1 flex flex-col items-center gap-1 py-1", idx === 1 ? 'mr-2' : '', idx === 2 ? 'ml-2' : '')}
              >
                <div className={cn("w-9 h-7 rounded-[10px] flex items-center justify-center", isActive ? 'bg-[#f0f0ec]' : '')}>
                  <item.icon size={19} className={isActive ? 'text-[#1a1a18]' : 'text-[#bbb]'} />
                </div>
                <span className={cn("text-[9px] uppercase tracking-[0.04em] font-medium", isActive ? 'text-[#1a1a18]' : 'text-[#bbb]')}>
                  {item.label}
                </span>
              </button>
            );
          })}
          <button
            onClick={() => onNavigate(role === 'TEACHER' ? 'learners-admissions' : 'dashboard')}
            className="w-14 h-10 -mt-2 rounded-2xl bg-[#1a1a18] text-white flex items-center justify-center"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileAppShell;
