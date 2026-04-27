export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

export const MOBILE_MAX_WIDTH = BREAKPOINTS.md - 1;
export const MOBILE_MEDIA_QUERY = `(max-width: ${MOBILE_MAX_WIDTH}px)`;

export const getDeviceFlags = (width) => ({
  isMobile: width < BREAKPOINTS.sm,
  isTablet: width >= BREAKPOINTS.sm && width < BREAKPOINTS.lg,
  isDesktop: width >= BREAKPOINTS.lg,
  screenWidth: width,
});
