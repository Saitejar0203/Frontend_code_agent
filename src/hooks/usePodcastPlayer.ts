import { useState, useEffect } from 'react';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { knappilyService } from '../services/knappilyService';

export const usePodcastPlayer = (articleId: string, hasPodcast?: boolean) => {
  const { 
    playState,
    currentArticleId, 
    togglePlay,
    currentTime,
    duration,
    playbackRate,
    togglePlaybackRate
  } = useAudioPlayer();
  
  const [podcastAvailable, setPodcastAvailable] = useState<boolean>(hasPodcast ?? false);
  const [title, setTitle] = useState('');

  // Check for podcast availability on mount only if hasPodcast is not provided
  useEffect(() => {
    // If hasPodcast is provided, use it directly and skip API call
    if (hasPodcast !== undefined) {
      setPodcastAvailable(hasPodcast);
      return;
    }

    // Fallback to API call for backward compatibility
    let isMounted = true;
    const checkPodcastAvailability = async () => {
      try {
        const podcastInfo = await knappilyService.getPodcastInfo(articleId);
        if (isMounted) {
            setPodcastAvailable(podcastInfo.podcast_available);
            setTitle(podcastInfo.title);
        }
      } catch (error) {
        if (isMounted) {
            setPodcastAvailable(false);
        }
      }
    };

    checkPodcastAvailability();
    return () => { isMounted = false; };
  }, [articleId, hasPodcast]);

  const isCurrentArticle = currentArticleId === articleId;

  const formatTime = (seconds: number): string => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDisplayText = (): string => {
    if (!isCurrentArticle) return 'Play to listen';
    
    switch (playState) {
        case 'loading':
            return 'Loading...';
        case 'error':
            return 'Error';
        case 'playing':
        case 'paused':
            return `${formatTime(currentTime)} / ${formatTime(duration)}`;
        default:
            return 'Play to listen';
    }
  };

  return {
    playState: isCurrentArticle ? playState : 'idle',
    handlePlayPause: () => togglePlay(articleId),
    getDisplayText,
    podcastAvailable,
    title,
    playbackRate,
    togglePlaybackRate,
  };
};

export default usePodcastPlayer;