import React, { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { Image, Check } from 'lucide-react';
import { imageGenerationStore, resetImageGenerationStatus } from '@/lib/stores/imageGenerationStore';

interface ImageGenerationStatusIndicatorProps {
  className?: string;
}

export const ImageGenerationStatusIndicator: React.FC<ImageGenerationStatusIndicatorProps> = ({ className = '' }) => {
  const { status, totalImages } = useStore(imageGenerationStore);

  // Auto-hide after 3 seconds when completed
  useEffect(() => {
    if (status === 'completed') {
      const timer = setTimeout(() => {
        resetImageGenerationStatus();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [status]);

  // Don't render if status is idle
  if (status === 'idle') {
    return null;
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'generating':
        return {
          icon: <Image className="w-4 h-4 text-purple-500" />,
          text: `Generating ${totalImages} image${totalImages !== 1 ? 's' : ''}...`,
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          textColor: 'text-purple-700',
          showDots: true,
          animationSpeed: '1.6s'
        };
      case 'completed':
        return {
          icon: <Check className="w-4 h-4 text-green-500" />,
          text: `${totalImages} image${totalImages !== 1 ? 's' : ''} generated`,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-700',
          showDots: false,
          animationSpeed: '0s'
        };
      default:
        return {
          icon: <Image className="w-4 h-4 text-purple-500" />,
          text: 'Processing images...',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          textColor: 'text-purple-700',
          showDots: true,
          animationSpeed: '1.6s'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`flex items-center justify-start mb-4 ${className}`}>
      <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg border transition-all duration-300 ${config.bgColor} ${config.borderColor} shadow-sm`}>
        {/* Status Icon */}
        <div className="flex-shrink-0">
          {config.icon}
        </div>
        
        {/* Animated Dots (only for generating state) */}
        {config.showDots && (
          <div className="flex items-center space-x-1">
            <div 
              className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" 
              style={{
                animationDelay: '0ms',
                animationDuration: config.animationSpeed
              }}
            ></div>
            <div 
              className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" 
              style={{
                animationDelay: '200ms',
                animationDuration: config.animationSpeed
              }}
            ></div>
            <div 
              className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" 
              style={{
                animationDelay: '400ms',
                animationDuration: config.animationSpeed
              }}
            ></div>
          </div>
        )}
        
        {/* Status Text */}
        <span className={`text-sm font-medium ${config.textColor}`}>
          {config.text}
        </span>
      </div>
    </div>
  );
};

export default ImageGenerationStatusIndicator;