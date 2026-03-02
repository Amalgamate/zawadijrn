import { useState, useEffect } from 'react';

/**
 * Custom Hook: useMobile
 * Detects if the current device/screen is mobile
 * Returns true if screen width < 768px (md breakpoint)
 */
export const useMobile = () => {
    const [isMobile, setIsMobile] = useState(() => {
        // SSR-safe: check if window exists before accessing
        if (typeof window === 'undefined') {
            return false;
        }
        return window.innerWidth < 768;
    });

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
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
            return {
                isMobile: false,
                isTablet: false,
                isDesktop: true,
                screenWidth: 1024
            };
        }

        const width = window.innerWidth;
        return {
            isMobile: width < 640,
            isTablet: width >= 640 && width < 1024,
            isDesktop: width >= 1024,
            screenWidth: width
        };
    });

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            setDeviceInfo({
                isMobile: width < 640,
                isTablet: width >= 640 && width < 1024,
                isDesktop: width >= 1024,
                screenWidth: width
            });
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
