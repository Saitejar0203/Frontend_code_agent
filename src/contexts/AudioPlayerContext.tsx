import React, { createContext, useContext, useState, ReactNode, useRef, useEffect, useCallback } from 'react';
import { knappilyService } from '@/services/knappilyService';

export type PlayState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

interface AudioPlayerContextType {
  playState: PlayState;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  error: string | null;
  currentArticleId: string | null;
  playbackRate: number;
  play: (articleId: string) => void;
  pause: () => void;
  togglePlay: (articleId: string) => void;
  stop: () => void;
  togglePlaybackRate: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (context === undefined) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
};

export const AudioPlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentArticleId, setCurrentArticleId] = useState<string | null>(null);
  const [playState, setPlayState] = useState<PlayState>('idle');
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);

  const isPlaying = playState === 'playing';
  const isLoading = playState === 'loading';

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src'); // Use removeAttribute for cleaner state
      audioRef.current.load(); // Reset the element
    }
    setCurrentArticleId(null);
    setPlayState('idle');
    setCurrentTime(0);
    setDuration(0);
    setError(null);
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  const play = useCallback(async (articleId: string) => {
    // If it's a new article, stop the current one and load the new source
    if (articleId !== currentArticleId) {
      if (audioRef.current) {
        audioRef.current.pause(); // Stop previous
        setCurrentTime(0);
      }
      setPlayState('loading');
      setError(null);
      
      try {
        // Fetch the direct, signed URL instead of the stream proxy
        const { url } = await knappilyService.getPodcastSignedUrl(articleId);
        audioRef.current!.src = url; // Use direct URL
        setCurrentArticleId(articleId);
      } catch (e) {
        setError('Failed to get podcast URL.');
        setPlayState('error');
        return;
      }
    }
    
    // Play the audio
    try {
      await audioRef.current?.play();
    } catch (err) {
      console.error("Audio play failed:", err);
      setError('Could not play audio.');
      setPlayState('error');
    }
  }, [currentArticleId]);

  const togglePlay = useCallback((articleId: string) => {
    if (currentArticleId === articleId && isPlaying) {
      pause();
    } else {
      // If paused on the same track, just resume
      if (currentArticleId === articleId && playState === 'paused') {
          audioRef.current?.play();
      } else { // Otherwise, load and play the new track
          play(articleId);
      }
    }
  }, [currentArticleId, isPlaying, playState, pause, play]);

  const togglePlaybackRate = useCallback(() => {
    const newRate = playbackRate === 1 ? 1.3 : 1;
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  }, [playbackRate]);

  // VVVV --- THE FIX IS HERE --- VVVV
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    // More robust event handlers
    const handlePlaying = () => setPlayState('playing');
    const handlePause = () => setPlayState('paused');
    const handleEnded = () => stop();
    const handleLoadStart = () => setPlayState('loading');
    const handleWaiting = () => setPlayState('loading'); // Handles buffering
    const handleError = () => {
        setError('Failed to load podcast audio.');
        setPlayState('error');
    };
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleRateChange = () => setPlaybackRate(audio.playbackRate);

    // Use the more reliable event set
    audio.addEventListener('playing', handlePlaying); // Fired when playback is actually happening
    audio.addEventListener('waiting', handleWaiting); // Fired when playback pauses for buffering
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('error', handleError);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ratechange', handleRateChange);

    return () => {
      // Cleanup all listeners
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ratechange', handleRateChange);
      audio.pause();
    };
  }, [stop]);
  // ^^^^ --- THE FIX IS HERE --- ^^^^

  const value: AudioPlayerContextType = {
    playState,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    error,
    currentArticleId,
    playbackRate,
    play,
    pause,
    togglePlay,
    stop,
    togglePlaybackRate,
  };

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  );
};