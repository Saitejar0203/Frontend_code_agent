import React, { useState, useEffect } from 'react';
import { useMediaQuery } from 'react-responsive';
import MobileRateLimitBanner from './MobileRateLimitBanner';
import DesktopRateLimitBanner from './DesktopRateLimitBanner';

interface RateLimitBannerProps {
  className?: string;
}

const RateLimitBanner: React.FC<RateLimitBannerProps> = ({ 
  className = '' 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  
  // Use react-responsive for reliable media query detection
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isDesktop = useMediaQuery({ minWidth: 768 });

  // Auto-dismiss after 4 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <>
      {isMobile && (
        <MobileRateLimitBanner 
          onDismiss={handleDismiss}
          className={className}
        />
      )}
      {isDesktop && (
        <DesktopRateLimitBanner 
          onDismiss={handleDismiss}
          className={className}
        />
      )}
    </>
  );
};

export default RateLimitBanner;