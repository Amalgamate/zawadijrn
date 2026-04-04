import React from 'react';
import { usePermissions } from '../../../hooks/usePermissions';
import { PAGE_TITLES } from '../utils/constants';
import { usePWAInstall } from '../../../hooks/usePWAInstall';
import { Download } from 'lucide-react';

const MobileAppShell = ({ children, user, onLogout, onNavigate, currentPage, brandingSettings, setBrandingSettings }) => {
  const { role } = usePermissions();
  const { isInstallable, installApp } = usePWAInstall();

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden relative">
      {/* Mobile Top App Bar */}
      <div className="h-16 bg-[var(--brand-purple)] text-white flex items-center justify-between px-4 z-50 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
            <img src="/logo.svg" alt="Logo" className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
          </div>
          <span className="font-bold text-lg truncate">
            {brandingSettings?.schoolName || 'Zawadi Junior'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isInstallable && (
            <button
              onClick={installApp}
              className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-2 py-1 rounded-md text-[10px] font-bold transition-colors"
            >
              <Download size={14} /> Install
            </button>
          )}
          <button
            onClick={onLogout}
            title="Logout"
            className="w-8 h-8 bg-brand-teal/20 hover:bg-red-500/20 rounded-full flex items-center justify-center font-bold text-sm text-white hover:text-red-600 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[var(--brand-purple)] overflow-hidden"
          >
            {(user?.name || 'A').substring(0, 2).toUpperCase()}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto custom-scrollbar relative z-10 w-full mb-16 pb-6">
        {/* We don't render the desktop Header here because mobile space is limited, but we pass navigation down to children */}
        <div className="p-4 rounded-xl">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-800">{PAGE_TITLES[currentPage] || 'Dashboard'}</h2>
          </div>
          {children}
        </div>
      </div>

      {/* Drawer Removed: Replaced by Mobile Dashboard Grid */}

      {/* Mobile Bottom Navigation Bar for quick access */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)] z-50 flex items-center justify-around px-2 pb-safe">
        <button
          onClick={() => onNavigate('dashboard')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${currentPage === 'dashboard' ? 'text-brand-purple' : 'text-gray-500 hover:text-gray-900'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
          <span className="text-[10px] font-bold">Home</span>
        </button>

        {role !== 'ACCOUNTANT' && (
          <button
            onClick={() => onNavigate('assess-mobile-dashboard')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${currentPage?.includes('assess') && !currentPage?.includes('report') ? 'text-brand-purple' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
            <span className="text-[10px] font-bold">Assessment</span>
          </button>
        )}

        {role !== 'ACCOUNTANT' && (
          <button
            onClick={() => onNavigate('assess-summative-report')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${currentPage?.includes('report') ? 'text-brand-purple' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
            <span className="text-[10px] font-bold">Reports</span>
          </button>
        )}

        {role !== 'TEACHER' && role !== 'ACCOUNTANT' && (
          <button
            onClick={() => onNavigate('settings-school')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${currentPage?.includes('settings') ? 'text-brand-purple' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
            <span className="text-[10px] font-bold">Settings</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default MobileAppShell;
