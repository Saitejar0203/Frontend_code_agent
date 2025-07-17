import React from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePodcastPlayer } from '../../hooks/usePodcastPlayer';

interface PodcastPlayButtonProps {
  articleId: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
  hasPodcast?: boolean;
}

const PodcastPlayButton: React.FC<PodcastPlayButtonProps> = ({
  articleId,
  size = 'md',
  className,
  showText = true,
  hasPodcast
}) => {
  const { playState, handlePlayPause, getDisplayText, podcastAvailable, playbackRate, togglePlaybackRate } = usePodcastPlayer(articleId, hasPodcast);

  // Don't render if podcast is not available
  if (!podcastAvailable) {
    return null;
  }

  const isPlaying = playState === 'playing';
  const isExpanded = isPlaying && showText && size === 'xl';

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

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handlePlayPause();
  };

  const handleSpeedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    togglePlaybackRate();
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

  // For non-xl sizes or when not showing text, use the original simple button
  if (size !== 'xl' || !showText) {
    return (
      <button
        onClick={handlePlayClick}
        disabled={playState === 'loading'}
        className={cn(
          'podcast-play-button',
          'relative flex items-center justify-center gap-2',
          showText ? 'rounded-xl' : 'rounded-full',
          'transition-all duration-300 ease-out',
          'focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent',
          'bg-black/40 backdrop-blur-xl border border-white/30',
          'shadow-xl hover:shadow-2xl',
          'hover:bg-black/50 hover:border-white/40 hover:scale-105',
          'active:scale-95 active:bg-black/45',
          'disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-black/40',
          sizeClasses[size],
          className
        )}
        aria-label={`${playState === 'playing' ? 'Pause' : 'Play'} podcast`}
      >
        <div className="absolute inset-0 rounded-inherit bg-gradient-to-r from-blue-500/30 to-purple-500/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="relative z-10 text-white drop-shadow-lg flex-shrink-0">
          {renderIcon()}
        </div>
        {showText && (
          <span className="relative z-10 text-white text-sm font-medium drop-shadow-lg whitespace-nowrap">
            {getDisplayText()}
          </span>
        )}
        {playState === 'loading' && (
          <div className="absolute inset-0 rounded-inherit bg-white/20 animate-ping" />
        )}
      </button>
    );
  }

  // For xl size with text, use the expandable layout within a single button
  return (
    <button
      onClick={handlePlayClick}
      disabled={playState === 'loading'}
      className={cn(
         'podcast-play-button',
         'relative flex items-center justify-center gap-2',
         'h-12 rounded-xl',
         'transition-all duration-500 ease-out',
         'focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent',
         'bg-black/40 backdrop-blur-xl border border-white/30',
         'shadow-xl hover:shadow-2xl',
         'hover:bg-black/50 hover:border-white/40 hover:scale-105',
         'active:scale-95 active:bg-black/45',
         'disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-black/40',
         // Dynamic width based on playing state
         isExpanded ? 'px-4 min-w-[240px]' : 'px-4 w-auto',
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
      
      {/* Text with progress */}
      <div className="relative z-10 text-white text-sm font-medium drop-shadow-lg flex-1">
        <span className="whitespace-nowrap">
          {getDisplayText()}
        </span>
      </div>
      
      {/* Speed control - appears when playing */}
       <div className={cn(
         'relative z-10 transition-all duration-500 ease-out',
         isExpanded ? 'opacity-100 translate-x-0 scale-100 ml-1' : 'opacity-0 translate-x-4 scale-95 w-0 overflow-hidden'
       )}>
        <div
          onClick={handleSpeedClick}
          className={cn(
            'flex items-center justify-center cursor-pointer',
            'w-10 h-8 rounded-lg',
            'transition-all duration-300 ease-out',
            'bg-white/10 hover:bg-white/20 border border-white/20',
            'hover:scale-105 active:scale-95',
            playbackRate === 1.3 ? 'bg-blue-500/30 border-blue-400/40' : ''
          )}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleSpeedClick(e as any);
            }
          }}
          aria-label={`Change speed to ${playbackRate === 1 ? '1.3x' : '1x'}`}
        >
          <span className={cn(
            'text-white text-xs font-bold',
            playbackRate === 1.3 ? 'text-blue-200' : ''
          )}>
            {playbackRate}x
          </span>
        </div>
      </div>
      
      {/* Loading ripple effect */}
      {playState === 'loading' && (
        <div className="absolute inset-0 rounded-inherit bg-white/20 animate-ping" />
      )}
    </button>
  );
};

export default PodcastPlayButton;