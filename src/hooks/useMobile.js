import { useState, useEffect } from 'react';

/**
 * Custom hook to detect if the user is on a mobile device
 * @param {number} breakpoint - The width breakpoint to consider as mobile (default: 768px)
 * @returns {boolean} - True if the user is on a mobile device
 */
export function useMobile (breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const isSmallScreen = window.innerWidth < breakpoint;
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileUserAgent =
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
          userAgent,
        );
      const isTouchDevice =
        'ontouchstart' in window || navigator.maxTouchPoints > 0;

      const mobile = isSmallScreen || (isMobileUserAgent && isTouchDevice);
      setIsMobile(mobile);
    };
    // Initial check
    checkMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);

    // Cleanup event listener
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
}

export default useMobile;
