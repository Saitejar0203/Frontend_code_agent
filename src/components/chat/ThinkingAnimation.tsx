import React from 'react';

interface ThinkingAnimationProps {
  className?: string;
}

export const ThinkingAnimation: React.FC<ThinkingAnimationProps> = ({ className = '' }) => {
  return (
    <div className={`flex items-center space-x-2 p-4 ${className}`}>
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{
          animationDelay: '0ms',
          animationDuration: '1.4s'
        }}></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{
          animationDelay: '200ms',
          animationDuration: '1.4s'
        }}></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{
          animationDelay: '400ms',
          animationDuration: '1.4s'
        }}></div>
      </div>
      <span className="text-sm text-gray-500 animate-pulse" style={{
        animationDuration: '2s'
      }}>
        Thinking...
      </span>
    </div>
  );
};

export default ThinkingAnimation;