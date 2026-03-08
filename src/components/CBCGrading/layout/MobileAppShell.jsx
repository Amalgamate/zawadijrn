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

      {/* Optional: Mobile Bottom Navigation Bar for quick access (can be implemented later) */}
    </div>
  );
};

export default MobileAppShell;
