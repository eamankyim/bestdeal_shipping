import { useState, useEffect } from 'react';

/**
 * Hook to detect if the current viewport is mobile (< 768px)
 * @returns {boolean} true if mobile, false otherwise
 */
export const useMobile = () => {
  const [isMobile, setIsMobile] = useState(() => {
    // Check if window is available (SSR safety)
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    // Check if window is available (SSR safety)
    if (typeof window === 'undefined') {
      return;
    }

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Initial check (in case of hydration mismatch)
    handleResize();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return isMobile;
};

/**
 * Helper function to check if screen is mobile (for use outside React components)
 * @returns {boolean} true if mobile, false otherwise
 */
export const isMobileScreen = () => {
  if (typeof window !== 'undefined') {
    return window.innerWidth < 768;
  }
  return false;
};

/**
 * Get breakpoint name based on window width
 * @returns {string} Breakpoint name: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
 */
export const getBreakpoint = () => {
  if (typeof window === 'undefined') {
    return 'md'; // Default for SSR
  }

  const width = window.innerWidth;
  
  if (width < 576) return 'xs';
  if (width < 768) return 'sm';
  if (width < 992) return 'md';
  if (width < 1200) return 'lg';
  if (width < 1600) return 'xl';
  return 'xxl';
};

/**
 * Hook to get current breakpoint
 * @returns {string} Breakpoint name: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
 */
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState(() => getBreakpoint());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleResize = () => {
      setBreakpoint(getBreakpoint());
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return breakpoint;
};

/**
 * Check if screen size matches a specific breakpoint or larger
 * @param {string} breakpoint - Breakpoint to check: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
 * @returns {boolean} true if screen is at least the specified breakpoint
 */
export const isBreakpointOrLarger = (breakpoint) => {
  const breakpoints = {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1600,
  };

  if (typeof window === 'undefined') {
    return false;
  }

  const currentWidth = window.innerWidth;
  const minWidth = breakpoints[breakpoint] || 0;

  return currentWidth >= minWidth;
};

/**
 * Check if screen size matches a specific breakpoint or smaller
 * @param {string} breakpoint - Breakpoint to check: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
 * @returns {boolean} true if screen is at most the specified breakpoint
 */
export const isBreakpointOrSmaller = (breakpoint) => {
  const breakpoints = {
    xs: 576,
    sm: 768,
    md: 992,
    lg: 1200,
    xl: 1600,
    xxl: Infinity,
  };

  if (typeof window === 'undefined') {
    return false;
  }

  const currentWidth = window.innerWidth;
  const maxWidth = breakpoints[breakpoint] || Infinity;

  return currentWidth <= maxWidth;
};


