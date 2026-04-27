import { useState, useEffect } from 'react';
import { BREAKPOINTS, getDeviceFlags, MOBILE_MEDIA_QUERY } from '../constants/breakpoints';

/**
 * Custom Hook: useMobile
 * Detects if the current device/screen is mobile
 * Returns true if screen width < 768px (md breakpoint)
 */
export const useMobile = () => {
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window === 'undefined') {
            return false;
        }
        return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
        const handleChange = (event) => {
            setIsMobile(event.matches);
        };

        setIsMobile(mediaQuery.matches);

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }

        mediaQuery.addListener(handleChange);
        return () => mediaQuery.removeListener(handleChange);
    }, []);

    return isMobile;
};

/**
 * Custom Hook: useDeviceType
 * Returns detailed device information
 * Returns: { isMobile, isTablet, isDesktop, screenWidth }
 */
export const useDeviceType = () => {
    const [deviceInfo, setDeviceInfo] = useState(() => {
        if (typeof window === 'undefined') {
            return getDeviceFlags(BREAKPOINTS.lg);
        }

        return getDeviceFlags(window.innerWidth);
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleResize = () => {
            setDeviceInfo(getDeviceFlags(window.innerWidth));
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return deviceInfo;
};

/**
 * Custom Hook: useIsMobileLayout
 * Returns true if using mobile layout (< 768px)
 * Same as useMobile but with different naming convention
 */
export const useIsMobileLayout = () => {
    return useMobile();
};
