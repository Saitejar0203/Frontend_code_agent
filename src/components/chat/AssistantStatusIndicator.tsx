import React, { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { Check, Clock, AlertTriangle, Zap } from 'lucide-react';
import { chatStore } from '@/lib/stores/chatStore';

interface AssistantStatusIndicatorProps {
  className?: string;
}

export const AssistantStatusIndicator: React.FC<AssistantStatusIndicatorProps> = ({ className = '' }) => {
  const { assistantStatus, statusMessage, statusStartTime } = useStore(chatStore);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Update elapsed time every second when status is active
  useEffect(() => {
    if (!statusStartTime || assistantStatus === 'idle' || assistantStatus === 'completed') {
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - statusStartTime.getTime()) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [statusStartTime, assistantStatus]);

  // Don't render if status is idle
  if (assistantStatus === 'idle') {
    return null;
  }

  const getStatusConfig = () => {
    switch (assistantStatus) {
      case 'thinking':
        return {
          icon: <Zap className="w-4 h-4 text-blue-500" />,
          text: statusMessage || 'Thinking...',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-700',
          showDots: true,
          animationSpeed: '1.4s'
        };
      case 'validation':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
          text: statusMessage || 'Validating code...',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-700',
          showDots: true,
          animationSpeed: '1.8s'
        };
      case 'max_tokens':
        return {
          icon: <Clock className="w-4 h-4 text-orange-500" />,
          text: statusMessage || 'Processing large response...',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-700',
          showDots: true,
          animationSpeed: '1.2s'
        };
      case 'completed':
        return {
          icon: <Check className="w-4 h-4 text-green-500" />,
          text: statusMessage || `Completed in ${elapsedTime}s`,
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-600',
          showDots: false,
          animationSpeed: '0s'
        };
      default:
        return {
          icon: <Zap className="w-4 h-4 text-blue-500" />,
          text: 'Processing...',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-700',
          showDots: true,
          animationSpeed: '1.4s'
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
        
        {/* Animated Dots (only for active states) */}
        {config.showDots && (
          <div className="flex items-center space-x-1">
            <div 
              className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" 
              style={{
                animationDelay: '0ms',
                animationDuration: config.animationSpeed
              }}
            ></div>
            <div 
              className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" 
              style={{
                animationDelay: '200ms',
                animationDuration: config.animationSpeed
              }}
            ></div>
            <div 
              className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" 
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
        
        {/* Elapsed Time (for active states) */}
        {assistantStatus !== 'completed' && assistantStatus !== 'idle' && statusStartTime && (
          <span className={`text-xs ${config.textColor} opacity-70`}>
            {elapsedTime}s
          </span>
        )}
      </div>
    </div>
  );
};

export default AssistantStatusIndicator;