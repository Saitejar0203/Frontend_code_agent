import React, { useState, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, ChevronLeft } from 'lucide-react';
import { MarkdownRenderer } from '@/components/markdown';
import MobileArticleSkeleton from './MobileArticleSkeleton';
import PodcastPlayButton from '@/components/ui/PodcastPlayButton';
import { ArticleCard } from '@/services/knappilyService';


interface MobileArticleViewProps {
  articles: ArticleCard[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isLoading: boolean;
  fetchNextPage: () => void;
  onRefresh: () => void;
  onArticleClick: (article: ArticleCard) => void;
  formatDate: (date: string) => string;
}

const MobileArticleView: React.FC<MobileArticleViewProps> = ({
  articles,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  fetchNextPage,
  onRefresh,
  onArticleClick,
  formatDate
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [currentArticleIndex, setCurrentArticleIndex] = useState(0);
  const [showSwipeHintAnimation, setShowSwipeHintAnimation] = useState(false);
  const [hasShownHintOnce, setHasShownHintOnce] = useState(false);
  const [showNoMoreArticlesAnimation, setShowNoMoreArticlesAnimation] = useState(false);
  const hintTimerRef = useRef<NodeJS.Timeout | null>(null);
  const noMoreArticlesTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const SWIPE_THRESHOLD = 50;
  const HEADER_HEIGHT_PX = 52;
  const IMAGE_HEIGHT_VH = 30;
  const CONTENT_TOP_OFFSET = `calc(${HEADER_HEIGHT_PX}px + ${IMAGE_HEIGHT_VH}vh)`;

  // Set up the Virtualizer for horizontal scrolling
  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? articles.length + 1 : articles.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => window.innerWidth,
    horizontal: true,
    overscan: 1,
  });

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      if (noMoreArticlesTimerRef.current) clearTimeout(noMoreArticlesTimerRef.current);
    };
  }, []);

  // Show swipe hint on initial load
  useEffect(() => {
    if (currentArticleIndex === 0 && articles.length > 1 && !hasShownHintOnce) {
      setShowSwipeHintAnimation(true);
      setHasShownHintOnce(true);
      
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      
      const timer = setTimeout(() => {
        setShowSwipeHintAnimation(false);
        hintTimerRef.current = null;
      }, 2000);
      
      hintTimerRef.current = timer;
    }
  }, [currentArticleIndex, articles.length, hasShownHintOnce]);

  // Fetch next page when near the end
  useEffect(() => {
    if (currentArticleIndex >= articles.length - 3 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [currentArticleIndex, articles.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Sync virtualizer with current index
  useEffect(() => {
    rowVirtualizer.scrollToIndex(currentArticleIndex, { align: 'start', behavior: 'smooth' });
  }, [currentArticleIndex, rowVirtualizer]);

  // Content area touch handlers
  const handleContentTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleContentTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    e.preventDefault();
  };

  const handleContentTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Hide swipe hint on any gesture
    if (showSwipeHintAnimation && (absDeltaX > 10 || absDeltaY > 10)) {
      setShowSwipeHintAnimation(false);
      if (hintTimerRef.current) {
        clearTimeout(hintTimerRef.current);
        hintTimerRef.current = null;
      }
    }

    // Handle horizontal swipes
    if (absDeltaX > SWIPE_THRESHOLD && absDeltaX > absDeltaY) {
      if (deltaX > 0 && currentArticleIndex > 0) {
        // Swipe right - go to previous article
        setCurrentArticleIndex(currentArticleIndex - 1);
      } else if (deltaX < 0 && currentArticleIndex < articles.length - 1) {
        // Swipe left - go to next article
        setCurrentArticleIndex(currentArticleIndex + 1);
      } else if (deltaX < 0 && currentArticleIndex === articles.length - 1 && !hasNextPage) {
        // At the last article and no more articles available
        setShowNoMoreArticlesAnimation(true);
        
        if (noMoreArticlesTimerRef.current) clearTimeout(noMoreArticlesTimerRef.current);
        
        noMoreArticlesTimerRef.current = setTimeout(() => {
          setShowNoMoreArticlesAnimation(false);
        }, 2500);
      }
    }

    touchStartRef.current = null;
  };

  if (isLoading) {
    return <MobileArticleSkeleton />;
  }

  if (articles.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            No Articles Available
          </h2>
          <p className="text-gray-500">
            Please check back later for new content.
          </p>
        </div>
      </div>
    );
  }

  const currentArticle = articles[currentArticleIndex];
  if (!currentArticle) return <MobileArticleSkeleton />;

  return (
    <div className="h-screen w-screen bg-gray-200 overflow-hidden select-none">
      {/* Fixed Header */}
      <header
        style={{ height: `${HEADER_HEIGHT_PX}px`, zIndex: 20 }}
        className="fixed top-0 left-0 right-0 border-b border-gray-200/50 bg-white/95 backdrop-blur-md"
      >
        <div className="flex items-center justify-between p-2 h-full">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <Link to="/" className="flex items-center space-x-1 text-gray-600 hover:text-gray-800">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Home</span>
            </Link>
            <div className="min-w-0 flex-1 text-center">
              <h1 className="text-lg font-semibold text-gray-800 truncate">Qoffee</h1>
            </div>
          </div>
          <button
            onClick={onRefresh}
            disabled={isFetchingNextPage}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium ml-2 h-8 px-2 flex items-center space-x-1 rounded-md"
          >
            <RefreshCw className={`w-3 h-3 ${isFetchingNextPage ? 'animate-spin' : ''}`} />
            <span className="text-xs">Refresh</span>
          </button>
        </div>
      </header>

      {/* Virtualized Container - Hidden but manages the articles */}
      <div
        ref={parentRef}
        className="absolute opacity-0 pointer-events-none"
        style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}
      >
        <div
          style={{
            width: `${rowVirtualizer.getTotalSize()}px`,
            height: '100%',
            position: 'relative'
          }}
        >
          {rowVirtualizer.getVirtualItems().map(virtualItem => {
            const isLoaderRow = virtualItem.index > articles.length - 1;
            return (
              <div
                key={virtualItem.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: `${virtualItem.size}px`,
                  height: '100%',
                  transform: `translateX(${virtualItem.start}px)`,
                }}
              >
                {isLoaderRow ? (
                  <div className="h-full w-full flex items-center justify-center bg-gray-100">Loading...</div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Fixed Image Container */}
      <div
        style={{
          position: 'fixed',
          top: `${HEADER_HEIGHT_PX}px`,
          left: 0,
          right: 0,
          height: `${IMAGE_HEIGHT_VH}vh`,
          minHeight: '180px',
          zIndex: 10,
          touchAction: 'pan-x'
        }}
        onClick={() => onArticleClick(currentArticle)}
        onTouchStart={handleContentTouchStart}
        onTouchMove={handleContentTouchMove}
        onTouchEnd={handleContentTouchEnd}
      >
        <div className="h-full relative article-image-container">
          <img
            src={currentArticle.image || '/placeholder-image.jpg'}
            alt={currentArticle.title}
            className="w-full h-full object-cover transition-opacity duration-300"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-image.jpg';
            }}
            onLoad={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.opacity = '1';
            }}
            style={{ opacity: 0 }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute top-2 left-3">
            <div className="podcast-play-button px-3 py-0.5 rounded-lg">
              <span className="text-white text-xs font-medium">AI Generated</span>
            </div>
          </div>
          
          {/* Podcast Play Button */}
          <div className="podcast-button-container">
            <PodcastPlayButton 
              articleId={currentArticle.id}
              size="xl"
              hasPodcast={currentArticle.has_podcast}
            />
          </div>
          
          {/* Swipe Hint Animation */}
          {showSwipeHintAnimation && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl animate-pulse"></div>
                <div className="relative bg-black/50 backdrop-blur-lg rounded-3xl px-8 py-4 border border-white/30 shadow-2xl transform transition-all duration-500 animate-in slide-in-from-bottom-4 fade-in">
                  <div className="flex items-center space-x-4 text-white">
                    <div className="relative">
                      <ChevronLeft className="w-6 h-6 text-blue-300 animate-pulse" />
                      <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-8 h-0.5 bg-gradient-to-r from-blue-300 to-transparent animate-pulse"></div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold tracking-wide text-white/95">Swipe left</span>
                      <span className="text-xs text-white/70 font-light">for next article</span>
                    </div>
                    <div className="flex space-x-1.5 ml-2">
                      <div className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }}></div>
                      <div className="w-1.5 h-1.5 bg-purple-300 rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '1s' }}></div>
                      <div className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '1s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* No More Articles Animation */}
          {showNoMoreArticlesAnimation && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-3xl blur-xl animate-pulse"></div>
                <div className="relative bg-black/60 backdrop-blur-lg rounded-3xl px-8 py-6 border border-white/30 shadow-2xl transform transition-all duration-500 animate-in slide-in-from-bottom-4 fade-in">
                  <div className="flex flex-col items-center space-y-3 text-white">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center animate-bounce">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="absolute inset-0 w-12 h-12 bg-orange-400/30 rounded-full animate-ping"></div>
                    </div>
                    <div className="text-center">
                      <span className="text-lg font-bold tracking-wide text-white/95 block">You're all caught up!</span>
                      <span className="text-sm text-white/70 font-light">No more articles to read</span>
                    </div>
                    <div className="flex space-x-2 mt-2">
                      <div className="w-2 h-2 bg-orange-300 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1.2s' }}></div>
                      <div className="w-2 h-2 bg-red-300 rounded-full animate-bounce" style={{ animationDelay: '200ms', animationDuration: '1.2s' }}></div>
                      <div className="w-2 h-2 bg-orange-300 rounded-full animate-bounce" style={{ animationDelay: '400ms', animationDuration: '1.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Static Content Area */}
      <div
        style={{
          position: 'fixed',
          top: CONTENT_TOP_OFFSET,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 5,
          touchAction: 'pan-x'
        }}
        className="bg-white overflow-hidden"
        onTouchStart={handleContentTouchStart}
        onTouchMove={handleContentTouchMove}
        onTouchEnd={handleContentTouchEnd}
        onClick={() => onArticleClick(currentArticle)}
      >
        <div className="px-4 pt-4 pb-3">
          <h2 className="text-2xl md:text-3xl font-bold leading-tight text-gray-900 mb-2">
            {currentArticle.title}
          </h2>
          <div className="flex items-center space-x-3 text-xs md:text-sm text-gray-600">
            <span className="font-medium">{currentArticle.category}</span>
            <span>&bull;</span>
            <span>{formatDate(currentArticle.publishDate)}</span>
          </div>
        </div>
        <div className="px-4 pb-4">
          <div className="text-gray-800 leading-relaxed [&_p]:mb-3 [&_p]:text-base" style={{fontSize: '16px'}}>
            <MarkdownRenderer content={currentArticle.introduction} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileArticleView;