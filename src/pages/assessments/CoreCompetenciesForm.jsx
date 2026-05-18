import React from 'react';
import CoreCompetenciesFormMobile from './CoreCompetenciesFormMobile';
import CoreCompetenciesFormDesktop from './CoreCompetenciesFormDesktop';
import { useMobile } from '../../hooks/useMobileDetection';

const CoreCompetenciesForm = ({ onBack, onSuccess }) => {
  const isMobile = useMobile();

  if (isMobile) {
    return <CoreCompetenciesFormMobile onBack={onBack} onSuccess={onSuccess} />;
  }

  return <CoreCompetenciesFormDesktop onBack={onBack} onSuccess={onSuccess} />;
};

export default CoreCompetenciesForm;
