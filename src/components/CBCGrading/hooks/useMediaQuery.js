import { useState, useEffect } from 'react';

/**
 * useMediaQuery Hook
 * Detects media query matches with SSR safety
 * Returns boolean indicating if media query matches
 */
export const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia(query).matches;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia(query);
        setMatches(mediaQuery.matches);

        const handleChange = (e) => {
            setMatches(e.matches);
        };

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        } else if (mediaQuery.addListener) {
            mediaQuery.addListener(handleChange);
            return () => mediaQuery.removeListener(handleChange);
        }
    }, [query]);

    return matches;
};

export default useMediaQuery;
