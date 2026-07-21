import { useEffect, useState } from 'react';

export type ResponsiveQuality = {
  dpr: number;
  beanCount: number;
  steamCount: number;
  isTouch: boolean;
  isMobile: boolean;
  isTablet: boolean;
};

function getQuality(): ResponsiveQuality {
  if (typeof window === 'undefined') {
    return { dpr: 1, beanCount: 5, steamCount: 3, isTouch: false, isMobile: false, isTablet: false };
  }

  const isMobile = window.innerWidth < 720;
  const isTablet = window.innerWidth >= 720 && window.innerWidth < 1040;
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 1.85);

  return {
    dpr,
    beanCount: isMobile ? 5 : isTablet ? 9 : 14,
    steamCount: isMobile ? 3 : 6,
    isTouch,
    isMobile,
    isTablet,
  };
}

export function useResponsiveQuality() {
  const [quality, setQuality] = useState(getQuality);

  useEffect(() => {
    let frame = 0;
    const onResize = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => setQuality(getQuality()));
    };

    window.addEventListener('resize', onResize);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return quality;
}
