/**
 * SummativeAssessment Router
 * On mobile: Full-screen experience (no sidebar/header)
 * On desktop: Normal layout with sidebar
 */

import React, { useState, useEffect } from 'react';
import SummativeAssessmentMobile from './SummativeAssessmentMobile';
import SummativeAssessment from './SummativeAssessment';

const SummativeAssessmentRouter = ({ learners, initialTestId, onBack, isMobile: deviceIsMobile, brandingSettings, embedded }) => {
  const [isMobile, setIsMobile] = useState(deviceIsMobile ?? window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      console.log(`[SummativeAssessmentRouter] Viewport: ${mobile ? 'MOBILE' : 'DESKTOP'} (${window.innerWidth}px)`);
    };

    window.addEventListener('resize', handleResize);
    console.log(`[SummativeAssessmentRouter] Initialized: ${isMobile ? 'MOBILE' : 'DESKTOP'} (${window.innerWidth}px)`);

    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  // On mobile: return full-screen component (breaks out of sidebar layout)
  if (isMobile) {
    if (embedded) {
      return (
        <div className="absolute inset-0 bg-gray-50 overflow-hidden">
          <SummativeAssessmentMobile learners={learners} initialTestId={initialTestId} onBack={onBack} brandingSettings={brandingSettings} embedded={embedded} />
        </div>
      );
    }
    return (
      <div className="fixed inset-0 z-50 bg-gray-50 overflow-hidden">
        <SummativeAssessmentMobile learners={learners} initialTestId={initialTestId} onBack={onBack} brandingSettings={brandingSettings} />
      </div>
    );
  }

  // On desktop: render within normal layout
  return <SummativeAssessment learners={learners} initialTestId={initialTestId} brandingSettings={brandingSettings} />;
};

export default SummativeAssessmentRouter;
