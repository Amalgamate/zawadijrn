import React from 'react';
import SummativeTestFormMobile from './SummativeTestFormMobile';
import SummativeTestFormDesktop from './SummativeTestFormDesktop';
import { useMobile } from '../../hooks/useMobileDetection';

/**
 * SummativeTestForm - Responsive wrapper
 * Routes to mobile or desktop version based on screen size
 */
const SummativeTestForm = ({ onBack, onSuccess, initialTestType = null }) => {
  const isMobile = useMobile();

  return isMobile ? (
    <SummativeTestFormMobile onBack={onBack} onSuccess={onSuccess} initialTestType={initialTestType} />
  ) : (
    <SummativeTestFormDesktop onBack={onBack} onSuccess={onSuccess} initialTestType={initialTestType} />
  );
};

export default SummativeTestForm;
