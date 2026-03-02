/**
 * usePageNavigation Hook
 * Provides navigation within the CBCGradingSystem
 */

import { useCallback } from 'react';

const usePageNavigation = () => {
  const navigateTo = useCallback((page, params = {}) => {
    // Dispatch custom event that CBCGradingSystem can listen to
    window.dispatchEvent(new CustomEvent('pageNavigate', { detail: { page, params } }));
  }, []);

  return navigateTo;
};

export default usePageNavigation;
