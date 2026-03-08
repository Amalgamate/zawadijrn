import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { Menu, X } from 'lucide-react';
import { usePermissions } from '../../../hooks/usePermissions';
import { PAGE_TITLES } from '../utils/constants';

const MobileAppShell = ({ children, user, onLogout, onNavigate, currentPage, brandingSettings, setBrandingSettings }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { role } = usePermissions();

  const handleNavigate = (page, params = {}) => {
    onNavigate(page, params);
    setMobileMenuOpen(false); // Close menu on navigation
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden relative">
      {/* Mobile Top App Bar */}
      <div className="h-16 bg-[#520050] text-white flex items-center justify-between px-4 z-40 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Menu size={24} />
          </button>
          <span className="font-bold text-lg truncate">
            {brandingSettings?.schoolName || 'Zawadi Junior'}
          </span>
        </div>
        <div className="flex items-center">
          <div className="w-8 h-8 bg-brand-teal rounded-full flex items-center justify-center font-bold text-sm shadow-sm">
            {(user?.name || 'A').substring(0, 2).toUpperCase()}
          </div>
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

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          ></div>

          {/* Sidebar Drawer */}
          <div className="relative w-[80%] max-w-sm h-full bg-[#5D0057] shadow-2xl flex flex-col pt-0 animate-in slide-in-from-left duration-300">
            <div className="absolute top-4 right-4 z-[60]">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Wrapper to reuse Desktop Sidebar styles */}
            <div className="flex-1 h-full w-full overflow-hidden flex flex-col bg-[#5D0057]">
              <Sidebar
                sidebarOpen={true}
                setSidebarOpen={() => { }} // Always open in mobile view when drawer is active
                currentPage={currentPage}
                onNavigate={handleNavigate}
                expandedSections={{}} // Let sidebar manage its own state
                toggleSection={() => { }}
                brandingSettings={brandingSettings}
              />

              {/* Mobile Logout Button (pinned to bottom of drawer) */}
              <div className="p-4 border-t border-white/10 bg-[#520050] mt-auto">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full py-3 bg-red-500/20 hover:bg-red-500/30 text-red-100 border border-red-500/30 rounded-lg font-bold flex flex-col items-center justify-center gap-1 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar for quick access */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)] z-40 flex items-center justify-around px-2 pb-safe">
        <button
          onClick={() => onNavigate('dashboard')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${currentPage === 'dashboard' ? 'text-brand-purple' : 'text-gray-500 hover:text-gray-900'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
          <span className="text-[10px] font-bold">Home</span>
        </button>

        {role !== 'ACCOUNTANT' && (
          <button
            onClick={() => onNavigate('learners-list')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${currentPage?.includes('learners') ? 'text-brand-purple' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            <span className="text-[10px] font-bold">Students</span>
          </button>
        )}

        {role === 'TEACHER' ? (
          <button
            onClick={() => onNavigate('assess-summative-assessment')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${currentPage?.includes('assess') ? 'text-brand-purple' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
            <span className="text-[10px] font-bold">Assess</span>
          </button>
        ) : (
          <button
            onClick={() => onNavigate('teachers-list')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${currentPage?.includes('teacher') ? 'text-brand-purple' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
            <span className="text-[10px] font-bold">Tutors</span>
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
