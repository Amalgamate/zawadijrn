/**
 * SummativeTests Router
 * On mobile: Full-screen card-based UI (no sidebar)
 * On desktop: Grid layout with sidebar
 */

import React, { useState, useEffect } from 'react';
import SummativeTestsMobile from './SummativeTestsMobile';
import SummativeTests from './SummativeTests';

const SummativeTestsRouter = ({ onNavigate, isMobile: deviceIsMobile }) => {
  const [isMobile, setIsMobile] = useState(deviceIsMobile ?? window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      console.log(`[SummativeTestsRouter] Viewport: ${mobile ? 'MOBILE' : 'DESKTOP'} (${window.innerWidth}px)`);
    };

    window.addEventListener('resize', handleResize);
    console.log(`[SummativeTestsRouter] Initialized: ${isMobile ? 'MOBILE' : 'DESKTOP'} (${window.innerWidth}px)`);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  // On mobile: return full-screen component (breaks out of sidebar layout)
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-50 overflow-hidden">
        <SummativeTestsMobile onNavigate={onNavigate} />
      </div>
    );
  }

  // On desktop: render within normal layout
  return <SummativeTests onNavigate={onNavigate} />;
};

export default SummativeTestsRouter;
