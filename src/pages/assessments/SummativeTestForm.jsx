import React, { useState, useEffect } from 'react';
import SummativeTestFormMobile from './SummativeTestFormMobile';
import SummativeTestFormDesktop from './SummativeTestFormDesktop';

/**
 * SummativeTestForm - Responsive wrapper
 * Routes to mobile or desktop version based on screen size
 */
const SummativeTestForm = ({ onBack, onSuccess }) => {
  const [isMobile, setIsMobile] = useState(() => {
    // Use documentElement.clientWidth for more accurate viewport detection
    const width = typeof window !== 'undefined' ? window.innerWidth || document.documentElement.clientWidth : 1024;
    console.log('🔍 Initial viewport width:', width, 'isMobile:', width < 768);
    return width < 768;
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth || document.documentElement.clientWidth;
      const mobile = width < 768;
      setIsMobile(mobile);
      console.log('📱 Viewport resized:', width, '→', mobile ? 'MOBILE' : 'DESKTOP');
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile ? (
    <SummativeTestFormMobile onBack={onBack} onSuccess={onSuccess} />
  ) : (
    <SummativeTestFormDesktop onBack={onBack} onSuccess={onSuccess} />
  );
};

export default SummativeTestForm;
