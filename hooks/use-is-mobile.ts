"use client";

import { useState, useEffect } from "react";

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      // Check multiple indicators for mobile devices
      const userAgent = navigator.userAgent.toLowerCase();
      const isTouchDevice =
        "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 768;

      // Check for mobile user agents
      const mobileRegex =
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
      const isMobileUserAgent = mobileRegex.test(userAgent);

      // Consider it mobile if it's a touch device AND (small screen OR mobile user agent)
      const mobile = isTouchDevice && (isSmallScreen || isMobileUserAgent);

      setIsMobile(mobile);
    };

    // Check on mount
    checkIsMobile();

    // Check on resize
    const handleResize = () => {
      checkIsMobile();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return isMobile;
}
