import React, { useState, useEffect } from 'react';

export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileHistoryOpen, setIsMobileHistoryOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return {
    isMobile,
    isMobileHistoryOpen,
    setIsMobileHistoryOpen
  };
};

export default useMobileDetection;