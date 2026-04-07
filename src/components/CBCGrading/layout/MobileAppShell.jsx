import React from 'react';
import { usePermissions } from '../../../hooks/usePermissions';
import { PAGE_TITLES } from '../utils/constants';
import { usePWAInstall } from '../../../hooks/usePWAInstall';
import { 
  Home, 
  TrendingUp, 
  FileText, 
  Settings, 
  LogOut, 
  Download,
  Search,
  Bell,
  Menu
} from 'lucide-react';
import { cn } from '../../../utils/cn';

const MobileAppShell = ({ children, user, onLogout, onNavigate, currentPage, brandingSettings }) => {
  const { role } = usePermissions();
  const { isInstallable, installApp } = usePWAInstall();

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home, show: true },
    { id: 'assess-mobile-dashboard', label: 'Assess', icon: TrendingUp, show: role !== 'ACCOUNTANT' },
    { id: 'assess-summative-report', label: 'Reports', icon: FileText, show: role !== 'ACCOUNTANT' },
    { id: 'settings-school', label: 'Settings', icon: Settings, show: role !== 'TEACHER' && role !== 'ACCOUNTANT' && role !== 'PARENT' },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden relative font-sans">
      {/* Premium Mobile Top App Bar */}
      <div className="h-[60px] bg-white border-b border-gray-100 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--brand-purple)] flex items-center justify-center p-1.5 shadow-lg shadow-purple-200">
            {brandingSettings?.logoUrl ? (
              <img src={brandingSettings.logoUrl} alt="Logo" className="w-full h-full object-contain brightness-0 invert" />
            ) : (
              <img src="/logo.svg" alt="Logo" className="w-full h-full object-contain brightness-0 invert" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-black text-sm text-gray-900 leading-none tracking-tight">
              {brandingSettings?.schoolName || 'Zawadi SMS'}
            </span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
              {role?.replace('_', ' ')} Portal
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isInstallable && (
            <button
              onClick={installApp}
              className="p-2 text-gray-400 hover:text-[var(--brand-purple)] transition-colors"
            >
              <Download size={20} />
            </button>
          )}
          <button
            onClick={onLogout}
            className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center transition-all hover:bg-rose-100 active:scale-90 border border-rose-100"
          >
            <LogOut size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto custom-scrollbar relative z-10 w-full mb-20">
        <div className="p-4 pt-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              {PAGE_TITLES[currentPage] || (currentPage?.includes('settings') ? 'Settings' : 'Dashboard')}
            </h2>
            <div className="p-2 bg-gray-100 rounded-full text-gray-400">
              <Search size={18} />
            </div>
          </div>
          {children}
        </div>
      </div>

      {/* Premium Bottom Navigation - Floating Glassmorphism Style */}
      <div className="fixed bottom-6 left-4 right-4 h-16 bg-white/90 backdrop-blur-xl border border-white/20 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.1)] rounded-2xl z-[100] flex items-center justify-around px-2 lg:hidden">
        {navItems.filter(item => item.show).map((item) => {
          const isActive = currentPage === item.id || (item.id === 'assess-mobile-dashboard' && currentPage?.includes('assess') && !currentPage?.includes('report'));
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="relative flex flex-col items-center justify-center w-full h-full transition-all duration-300"
            >
              {isActive && (
                <div className="absolute top-[-4px] w-8 h-1 bg-[var(--brand-purple)] rounded-full shadow-[0_0_10px_rgba(var(--brand-purple-rgb),0.5)]" />
              )}
              
              <div className={cn(
                "p-2 rounded-xl transition-all duration-300 transform active:scale-90",
                isActive ? "text-[var(--brand-purple)]" : "text-gray-400"
              )}>
                <item.icon 
                  size={24} 
                  strokeWidth={isActive ? 2.5 : 2}
                  className={cn(isActive && "drop-shadow-[0_0_8px_rgba(var(--brand-purple-rgb),0.3)]")}
                />
              </div>
              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest mt-[-2px] transition-all duration-300",
                isActive ? "text-[var(--brand-purple)]" : "text-gray-400"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileAppShell;
