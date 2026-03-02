import { useState, useEffect } from 'react';

/**
 * useMediaQuery Hook
 * Detects media query matches with SSR safety
 * Returns boolean indicating if media query matches
 */
export const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        
        // Check if window is available (not SSR)
        if (typeof window === 'undefined') return;

        // Create media query list
        const mediaQuery = window.matchMedia(query);
        
        // Set initial value
        setMatches(mediaQuery.matches);

        // Create event listener
        const handleChange = (e) => {
            setMatches(e.matches);
        };

        // Add listener with fallback for older browsers
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        } else if (mediaQuery.addListener) {
            mediaQuery.addListener(handleChange);
            return () => mediaQuery.removeListener(handleChange);
        }
    }, [query]);

    // Return false until mounted to prevent hydration mismatch
    return mounted ? matches : false;
};

export default useMediaQuery;
