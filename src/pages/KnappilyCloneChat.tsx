import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSectionKeys, type SectionKey } from '../data/newsData';
import { useKnappily } from '../contexts/KnappilyContext';
import { knappilyService } from '../services/knappilyService';
import type { ArticleDetail } from '../services/knappilyService';
import { localStorageService } from '../services/localStorageService';
import { useToast } from '../hooks/use-toast';
import { useKnappilyArticles } from '../hooks/useKnappilyArticles';
import { useIsMobile } from '../hooks/use-mobile';
import MobileArticleWithSuspense from '../components/knappily/MobileArticleWithSuspense';
import DesktopArticleView from '../components/knappily/DesktopArticleView';
import MobileArticleDetailView from '../components/knappily/MobileArticleDetailView';
import DesktopArticleDetailView from '../components/knappily/DesktopArticleDetailView';

const KnappilyCloneChat: React.FC = () => {
  const { articleId, section } = useParams<{ articleId?: string; section?: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // --- Data for DESKTOP view (using the original context) ---
  const { state: desktopState, loadArticles, fetchArticlesForPage, getArticleDetail } = useKnappily();
  
  // --- Data for MOBILE view using TanStack Query ---
  const {
    data: mobileData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isMobileLoading,
    refetch: refetchMobile
  } = useKnappilyArticles();
  
  // Flatten the pages from TanStack Query into a single array for mobile
  const mobileArticles = useMemo(() => 
    mobileData?.pages.flatMap(page => page.articles) ?? [], 
    [mobileData]
  );
  const { toast } = useToast();
  const [currentArticleIndex, setCurrentArticleIndex] = useState(0);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const [isSwiping, setIsSwiping] = useState(false);
  const [articleDetail, setArticleDetail] = useState<ArticleDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [currentDesktopPage, setCurrentDesktopPage] = useState(1);
  const [displayedArticles, setDisplayedArticles] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mobileScrollPosition, setMobileScrollPosition] = useState(0);
  const [isPullToRefresh, setIsPullToRefresh] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const sectionKeys = getSectionKeys();
  const isDetailView = !!articleId;
  const currentSection = articleDetail && section ? articleDetail.sections[section as SectionKey] : null;
  
  // Load article detail when articleId changes
  useEffect(() => {
    if (articleId) {
      setLoadingDetail(true);
      getArticleDetail(parseInt(articleId))
        .then(detail => {
          setArticleDetail(detail);
        })
        .catch(error => {
          console.error('Error loading article detail:', error);
          setArticleDetail(null);
        })
        .finally(() => {
          setLoadingDetail(false);
        });
    } else {
      setArticleDetail(null);
    }
  }, [articleId, getArticleDetail]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isDetailView && articleDetail) {
        if (e.key === 'ArrowLeft' && currentSectionIndex > 0) {
          const newSectionIndex = currentSectionIndex - 1;
          setCurrentSectionIndex(newSectionIndex);
          navigate(`/qoffee/${articleId}/${sectionKeys[newSectionIndex]}`);
        } else if (e.key === 'ArrowRight' && currentSectionIndex < sectionKeys.length - 1) {
          const newSectionIndex = currentSectionIndex + 1;
          setCurrentSectionIndex(newSectionIndex);
          navigate(`/qoffee/${articleId}/${sectionKeys[newSectionIndex]}`);
        }
      } else {
        // Get total articles from all pages (desktop only)
        const totalArticles = Array.from(desktopState.articles.values()).flat().length;
        if (e.key === 'ArrowLeft' && currentArticleIndex > 0) {
          setCurrentArticleIndex(currentArticleIndex - 1);
        } else if (e.key === 'ArrowRight' && currentArticleIndex < totalArticles - 1) {
          setCurrentArticleIndex(currentArticleIndex + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDetailView, articleDetail, currentSectionIndex, currentArticleIndex, articleId, navigate, sectionKeys, desktopState.articles]);

  // Initialize section index when article changes
  useEffect(() => {
    if (section) {
      const sectionIndex = sectionKeys.indexOf(section as SectionKey);
      if (sectionIndex !== -1) {
        setCurrentSectionIndex(sectionIndex);
      }
    }
  }, [section, sectionKeys]);

  // Reset scroll position to top when section changes
  useEffect(() => {
    if (isDetailView && currentSectionIndex !== null) {
      const sectionContent = document.querySelector('.section-content');
      if (sectionContent) {
        sectionContent.scrollTop = 0;
      }
    }
  }, [currentSectionIndex, isDetailView]);

  // Handle swipe hint animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSwipeHint(false);
    }, 2000); // Show for 2 seconds

    return () => clearTimeout(timer);
  }, []);

  // Scroll active section into view
  useEffect(() => {
    if (isDetailView) {
      const activeButton = document.querySelector(`[data-section-index="${currentSectionIndex}"]`);
      if (activeButton) {
        activeButton.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [currentSectionIndex, isDetailView]);

  // Initial load logic for desktop
  useEffect(() => {
    if (!isMobile && desktopState.articles.size === 0) {
      loadArticles();
    }
  }, [isMobile, desktopState.articles.size, loadArticles]);

  // Update displayed articles when desktop state changes
  useEffect(() => {
    if (!isMobile) {
      // Use the articles for the current page from the map.
      // Provide an empty array as a fallback while loading.
      const articlesForPage = desktopState.articles.get(currentDesktopPage) || [];
      setDisplayedArticles(articlesForPage);
    }
  }, [isMobile, currentDesktopPage, desktopState.articles]);

  // Prefetch next page for seamless pagination (desktop only)
  useEffect(() => {
    if (!isMobile) {
      // Prefetch the next page's data
      const nextPage = currentDesktopPage + 1;
      const totalPages = Math.ceil(desktopState.totalCount / 10);
      if (nextPage <= totalPages) {
        fetchArticlesForPage(nextPage);
      }
    }
  }, [isMobile, currentDesktopPage, desktopState.totalCount, fetchArticlesForPage]);

  // Fetch current page if not already loaded (desktop only)
  useEffect(() => {
    if (!isMobile && !desktopState.articles.has(currentDesktopPage)) {
      fetchArticlesForPage(currentDesktopPage);
    }
  }, [isMobile, currentDesktopPage, desktopState.articles, fetchArticlesForPage]);

  const formatDate = (dateString: string) => {
    // Backend already sends formatted dates like "21st December'24"
    // If it's already formatted, return as is
    if (dateString && (dateString.includes('st') || dateString.includes('nd') || dateString.includes('rd') || dateString.includes('th'))) {
      return dateString;
    }
    
    // Fallback: try to parse and format if it's a raw date
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Unknown Date";
      }
      const day = date.getDate();
      const month = date.toLocaleDateString('en-US', { month: 'long' });
      const year = date.getFullYear().toString().slice(-2);
      const suffix = day === 1 || day === 21 || day === 31 ? 'st' : 
                     day === 2 || day === 22 ? 'nd' : 
                     day === 3 || day === 23 ? 'rd' : 'th';
      return `${day}${suffix} ${month}'${year}`;
    } catch {
      return "Unknown Date";
    }
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setIsSwiping(false);
    if (isDetailView) {
      setTouchStart(e.targetTouches[0].clientX);
    } else {
      setTouchStart(e.targetTouches[0].clientX);
    }
    setTouchStartY(e.targetTouches[0].clientY);
    
    // Check if at top for pull-to-refresh
    const scrollTop = e.currentTarget.scrollTop || 0;
    if (scrollTop === 0 && !isDetailView) {
      setIsPullToRefresh(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || !touchStartY) return;
    
    const currentTouch = e.touches[0].clientX;
    const currentTouchY = e.touches[0].clientY;
    const horizontalDistance = Math.abs(currentTouch - touchStart);
    const verticalDistance = Math.abs(currentTouchY - touchStartY);
    
    // Determine if this is primarily a horizontal or vertical gesture
    const isHorizontalGesture = horizontalDistance > verticalDistance * 1.5;
    const isVerticalGesture = verticalDistance > horizontalDistance * 1.5;
    
    if (isDetailView) {
      // In detail view, only prevent default for clear horizontal swipes
      if (isHorizontalGesture && horizontalDistance > 10) {
        e.preventDefault();
      }
    } else {
      // In article view, handle both horizontal swipes and pull-to-refresh
      if (isHorizontalGesture && horizontalDistance > 10) {
        e.preventDefault();
      } else if (isVerticalGesture && currentTouchY > touchStartY) {
        // Handle pull-to-refresh
        const pullDist = Math.min(currentTouchY - touchStartY, 100);
        if (pullDist > 0 && window.scrollY === 0) {
          setIsPullToRefresh(true);
          setPullDistance(pullDist);
          if (pullDist > 10) {
            e.preventDefault();
          }
        }
      }
    }
    
    setTouchEnd(currentTouch);
  };

  const handleTouchEnd = async () => {
    if (!touchStart || !touchEnd) {
      // Handle pull-to-refresh with enhanced functionality
      if (isPullToRefresh && pullDistance > 60) {
        await handleRefresh(); // Use the enhanced refresh function
      }
      setIsPullToRefresh(false);
      setPullDistance(0);
      setIsSwiping(false);
      return;
    }
    
    const distance = touchStart - touchEnd;
    
    if (isDetailView && articleDetail) {
      // Horizontal swipe for sections
      const isLeftSwipe = distance > 50;
      const isRightSwipe = distance < -50;
      
      if (isLeftSwipe && currentSectionIndex < sectionKeys.length - 1) {
        const newSectionIndex = currentSectionIndex + 1;
        setCurrentSectionIndex(newSectionIndex);
        navigate(`/qoffee/${articleId}/${sectionKeys[newSectionIndex]}`);
        setIsSwiping(true);
      } else if (isRightSwipe && currentSectionIndex > 0) {
        const newSectionIndex = currentSectionIndex - 1;
        setCurrentSectionIndex(newSectionIndex);
        navigate(`/qoffee/${articleId}/${sectionKeys[newSectionIndex]}`);
        setIsSwiping(true);
      }
    } else {
      // Horizontal swipe logic for articles (desktop only)
      const isLeftSwipe = distance > 50;
      const isRightSwipe = distance < -50;
      const totalArticles = Array.from(desktopState.articles.values()).flat().length;
      
      if (isLeftSwipe && currentArticleIndex < totalArticles - 1) {
        setCurrentArticleIndex(currentArticleIndex + 1);
        setIsSwiping(true);
      } else if (isRightSwipe && currentArticleIndex > 0) {
        setCurrentArticleIndex(currentArticleIndex - 1);
        setIsSwiping(true);
      }
    }
    
    // Reset swiping state after a short delay to prevent click events
    setTimeout(() => setIsSwiping(false), 50);
    setTouchStartY(null);
    setIsPullToRefresh(false);
    setPullDistance(0);
  };

  const handleArticleClick = (article: any) => {
    // Prevent navigation if user was swiping
    if (isSwiping) return;
    navigate(`/qoffee/${article.id}/${sectionKeys[0]}`);
  };

  // Safe navigation function that validates the index (desktop only)
  const handleNavigateToArticle = (newIndex: number) => {
    const totalArticles = Array.from(desktopState.articles.values()).flat().length;
    if (newIndex >= 0 && newIndex < totalArticles) {
      setCurrentArticleIndex(newIndex);
    }
  };

  // Handle desktop pagination
  const handleDesktopPageChange = (page: number) => {
    const totalPages = Math.ceil(desktopState.totalCount / 10);
    if (page > 0 && page <= totalPages) {
      setCurrentDesktopPage(page);
      // Scroll to top of the page when pagination changes
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // The useEffect above will handle fetching/prefetching
    }
  };

  // Handle refresh with enhanced mobile functionality
  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      if (isMobile) {
        // Mobile: use TanStack Query refetch
        await refetchMobile();
        toast({
          variant: "success",
          title: "Articles Refreshed!",
          description: "Showing latest content.",
          duration: 3000,
        });
      } else {
        // Desktop: use existing logic
        const previousArticleCount = Array.from(desktopState.articles.values()).flat().length;
        const currentIndex = currentArticleIndex;
        
        await loadArticles(true);
        setCurrentDesktopPage(1);
        
        // Get articles for page 1 after refresh
        const articlesForPage1 = desktopState.articles.get(1) || [];
        setDisplayedArticles(articlesForPage1);
        
        // Ensure currentArticleIndex is within bounds after refresh
        const newTotalArticles = Array.from(desktopState.articles.values()).flat().length;
        if (currentIndex >= newTotalArticles && newTotalArticles > 0) {
          setCurrentArticleIndex(newTotalArticles - 1);
        }
      }
    } catch (error) {
      console.error('Refresh failed:', error);
      toast({
        variant: "destructive",
        title: "Refresh Failed",
        description: "Unable to load new articles. Please try again.",
        duration: 4000,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const allArticles = Array.from(desktopState.articles.values()).flat();
    const currentArticle = allArticles[currentArticleIndex];
    if (currentArticle && navigator.share) {
      navigator.share({
        title: currentArticle.title,
        text: currentArticle.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleSectionChange = (index: number, key: string) => {
    setCurrentSectionIndex(index);
    navigate(`/qoffee/${articleId}/${key}`);
  };

  // Calculate total pages for desktop
  const totalPages = Math.ceil(desktopState.totalCount / 10);
  
  // Pass the loading status for the entire pagination component
  const isPaginating = desktopState.pageLoading.has(currentDesktopPage);

  if (loadingDetail) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (isDetailView && articleDetail && currentSection) {
    return (
      <>
        {/* Mobile Article Detail View */}
        <div className="md:hidden">
          <MobileArticleDetailView
            articleDetail={articleDetail}
            currentSection={currentSection}
            currentSectionIndex={currentSectionIndex}
            sectionKeys={sectionKeys}
            section={section || ''}
            articleId={articleId || ''}
            onSectionChange={handleSectionChange}
          />
        </div>
        
        {/* Desktop Article Detail View */}
        <div className="hidden md:block">
          <DesktopArticleDetailView
            articleDetail={articleDetail}
            currentSection={currentSection}
            currentSectionIndex={currentSectionIndex}
            sectionKeys={sectionKeys}
            section={section || ''}
            articleId={articleId || ''}
            onSectionChange={handleSectionChange}
          />
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Static background for desktop only */}
      <div className="hidden md:block absolute inset-0 bg-gradient-to-br from-slate-50 to-blue-50"></div>
      
      {/* Main content */}
      <div className="relative min-h-screen">
        {/* Mobile view */}
        <div className="md:hidden">
          <MobileArticleWithSuspense
            articles={mobileArticles}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            isLoading={isMobileLoading}
            fetchNextPage={fetchNextPage}
            onRefresh={handleRefresh}
            onArticleClick={handleArticleClick}
            formatDate={formatDate}
          />
        </div>

        {/* Desktop view */}
        <div className="hidden md:block">
          <DesktopArticleView
            displayedArticles={displayedArticles}
            currentDesktopPage={currentDesktopPage}
            totalPages={totalPages}
            isRefreshing={isRefreshing}
            loading={isPaginating}
            error={desktopState.error}
            onRefresh={handleRefresh}
            onPageChange={handleDesktopPageChange}
            onArticleClick={handleArticleClick}
            formatDate={formatDate}
          />
        </div>
      </div>
    </div>
  );
};

export default KnappilyCloneChat;