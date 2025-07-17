import React from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePodcastPlayer } from '../../hooks/usePodcastPlayer';

interface PodcastPlayButtonProps {
  articleId: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

const PodcastPlayButton: React.FC<PodcastPlayButtonProps> = ({
  articleId,
  size = 'md',
  className,
  showText = true
}) => {
  const { playState, handlePlayPause, getDisplayText, podcastAvailable } = usePodcastPlayer(articleId);

  // Don't render if podcast is not available
  if (!podcastAvailable) {
    return null;
  }

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-14 h-14',
    xl: showText ? 'w-auto h-12 px-4' : 'w-16 h-16'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-6 h-6'
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handlePlayPause();
  };

  const renderIcon = () => {
    switch (playState) {
      case 'loading':
        return <Loader2 className={cn(iconSizes[size], 'animate-spin')} />;
      case 'playing':
        return <Pause className={iconSizes[size]} />;
      default:
        return <Play className={cn(iconSizes[size], 'ml-0.5')} />;
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={playState === 'loading'}
      className={cn(
        // Base styles
        'podcast-play-button',
        'relative flex items-center justify-center gap-2',
        showText ? 'rounded-xl' : 'rounded-full',
        'transition-all duration-300 ease-out',
        'focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent',
        
        // Enhanced glassmorphic styling with darker background
        'bg-black/40 backdrop-blur-xl border border-white/30',
        'shadow-xl hover:shadow-2xl',
        
        // Hover effects
        'hover:bg-black/50 hover:border-white/40 hover:scale-105',
        'active:scale-95 active:bg-black/45',
        
        // Disabled state
        'disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-black/40',
        
        // Size
        sizeClasses[size],
        
        // Custom className
        className
      )}
      aria-label={`${playState === 'playing' ? 'Pause' : 'Play'} podcast`}
    >
      {/* Enhanced glow effect */}
      <div className="absolute inset-0 rounded-inherit bg-gradient-to-r from-blue-500/30 to-purple-500/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      {/* Icon */}
      <div className="relative z-10 text-white drop-shadow-lg flex-shrink-0">
        {renderIcon()}
      </div>
      
      {/* Text */}
      {showText && (
        <span className="relative z-10 text-white text-sm font-medium drop-shadow-lg whitespace-nowrap">
          {getDisplayText()}
        </span>
      )}
      
      {/* Ripple effect on click */}
      {playState === 'loading' && (
        <div className="absolute inset-0 rounded-inherit bg-white/20 animate-ping" />
      )}
    </button>
  );
};

export default PodcastPlayButton;