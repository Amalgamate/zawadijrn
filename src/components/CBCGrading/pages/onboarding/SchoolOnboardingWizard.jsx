/**
 * SchoolOnboardingWizard (Deprecated - Multi-tenant cleanup)
 * Stub component (not used in single-school implementation)
 */

import React from 'react';

const SchoolOnboardingWizard = ({ onComplete }) => {
  React.useEffect(() => {
    if (onComplete) onComplete();
  }, [onComplete]);

  return <div>School Onboarding Wizard - Deprecated</div>;
};

export default SchoolOnboardingWizard;
