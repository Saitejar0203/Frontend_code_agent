import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface DesktopRateLimitBannerProps {
  onDismiss: () => void;
  className?: string;
}

const DesktopRateLimitBanner: React.FC<DesktopRateLimitBannerProps> = ({ 
  onDismiss,
  className = '' 
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleDismiss = () => {
    setIsAnimating(true);
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  return (
    <div 
      className={`
        transition-all duration-300 ease-in-out relative z-20
        ${isAnimating ? 'opacity-0 transform -translate-y-2' : 'opacity-100 transform translate-y-0'}
        ${className}
      `}
    >
      <Alert 
        variant="default"
        className="
          rounded-lg shadow-sm mx-4 mb-2
          border border-amber-200 bg-amber-50
          relative overflow-hidden py-2 px-4
          hover:shadow-md transition-shadow duration-200
        "
      >
        {/* Subtle desktop background gradient */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-amber-50 to-orange-50 opacity-60"
        />
        
        {/* Content optimized for desktop */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center flex-1 pr-4">
            {/* Standard warning icon for desktop */}
            <AlertTriangle 
              className="h-4 w-4 mr-2 flex-shrink-0 text-amber-600" 
            />
            <AlertDescription className="text-sm text-amber-700">
              <span className="font-medium">Service Notice:</span>
              {' '}You may occasionally experience server errors due to Google API rate limits. 
              If this happens, please start a new chat.
            </AlertDescription>
          </div>
          
          {/* Subtle dismiss button for desktop */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="
              h-6 w-6 p-0 rounded-full flex-shrink-0
              text-amber-600 hover:text-amber-800
              hover:bg-amber-100
              transition-colors duration-200
            "
            aria-label="Dismiss notification"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </Alert>
    </div>
  );
};

export default DesktopRateLimitBanner;