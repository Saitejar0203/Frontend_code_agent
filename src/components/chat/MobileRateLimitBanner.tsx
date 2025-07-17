import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface MobileRateLimitBannerProps {
  onDismiss: () => void;
  className?: string;
}

const MobileRateLimitBanner: React.FC<MobileRateLimitBannerProps> = ({ 
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
          rounded-lg shadow-sm mx-3 mb-3
          border border-amber-200 bg-amber-50
          relative overflow-hidden py-3 px-4
          hover:shadow-md transition-shadow duration-200
        "
      >
        {/* Subtle mobile background gradient */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-amber-50 to-orange-50 opacity-60"
        />
        
        {/* Content optimized for mobile */}
        <div className="flex items-start justify-between relative z-10 gap-3">
          <div className="flex items-start flex-1">
            {/* Subtle warning icon for mobile */}
            <AlertTriangle 
              className="h-4 w-4 mr-3 flex-shrink-0 mt-0.5 text-amber-600" 
            />
            <AlertDescription className="text-sm text-amber-700 leading-relaxed">
               <span className="font-medium">Service Notice:</span>
               {' '}You may occasionally experience server errors due to Google API rate limits. 
               If this happens, please start a new chat.
             </AlertDescription>
          </div>
          
          {/* Subtle dismiss button with mobile-friendly touch target */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="
              h-8 w-8 p-0 rounded-full flex-shrink-0
              text-amber-600 hover:text-amber-800
              hover:bg-amber-100
              transition-colors duration-200
            "
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Alert>
    </div>
  );
};

export default MobileRateLimitBanner;