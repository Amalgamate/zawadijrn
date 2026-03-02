import React, { useState, useEffect } from 'react';
import CoreCompetenciesFormMobile from './CoreCompetenciesFormMobile';
import CoreCompetenciesFormDesktop from './CoreCompetenciesFormDesktop';

const CoreCompetenciesForm = ({ onBack, onSuccess }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      console.log(`[CoreCompetenciesForm] Viewport: ${mobile ? 'MOBILE' : 'DESKTOP'} (${window.innerWidth}px)`);
    };

    window.addEventListener('resize', handleResize);
    console.log(`[CoreCompetenciesForm] Initialized: ${isMobile ? 'MOBILE' : 'DESKTOP'} (${window.innerWidth}px)`);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  if (isMobile) {
    return <CoreCompetenciesFormMobile onBack={onBack} onSuccess={onSuccess} />;
  }

  return <CoreCompetenciesFormDesktop onBack={onBack} onSuccess={onSuccess} />;
};

export default CoreCompetenciesForm;
