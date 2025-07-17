import React, { useEffect } from 'react';

interface MobileScrollManagerProps {
  isMobile: boolean;
  isGenerating: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const MobileScrollManager: React.FC<MobileScrollManagerProps> = ({
  isMobile,
  isGenerating,
  messagesEndRef
}) => {
  useEffect(() => {
    if (!isMobile) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Store initial touch position for mobile scroll handling
      const touch = e.touches[0];
      if (touch) {
        // Mobile-specific touch handling can be added here
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Handle mobile scroll behavior during touch move
      if (isGenerating) {
        // Prevent certain scroll behaviors during generation if needed
      }
    };

    const handleTouchEnd = () => {
      // Handle touch end events for mobile
    };

    if (isMobile) {
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
      document.addEventListener('touchmove', handleTouchMove, { passive: true });
      document.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, isGenerating]);

  // Mobile-specific scroll to bottom behavior
  useEffect(() => {
    if (isMobile && messagesEndRef.current) {
      const scrollToBottom = () => {
        const messagesContainer = messagesEndRef.current?.closest('.overflow-y-auto');
        if (messagesContainer) {
          // Mobile-optimized scrolling
          messagesContainer.scrollTo({
            top: messagesContainer.scrollHeight,
            behavior: 'smooth'
          });
        }
      };

      // Delay scroll for mobile to ensure proper rendering
      const timer = setTimeout(scrollToBottom, 100);
      return () => clearTimeout(timer);
    }
  }, [isMobile, isGenerating]);

  return null; // This component doesn't render anything
};

export default MobileScrollManager;