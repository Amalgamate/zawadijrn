/**
 * usePageNavigation Hook
 * Provides navigation within the CBCGradingSystem by writing directly
 * to the Zustand UI store — the same way CBCGradingSystem.handleNavigate does.
 */

import { useCallback } from 'react';
import { useUIStore } from '../store/useUIStore';

const usePageNavigation = () => {
  const setCurrentPage = useUIStore((state) => state.setCurrentPage);

  const navigateTo = useCallback((page, params = {}) => {
    setCurrentPage(page, params);

    // Also push a real browser history entry so the back button works
    try {
      window.history.pushState(
        { appPage: page, appParams: params },
        '',
        window.location.pathname + window.location.search + `#${page}`
      );
    } catch (e) {
      console.error('History push failed:', e);
    }
  }, [setCurrentPage]);

  return navigateTo;
};

export default usePageNavigation;
