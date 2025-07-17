/**
 * Knappily Context
 * 
 * Provides global state management for Knappily articles with real-time updates,
 * caching, and error handling.
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { knappilyService, ArticleCard, ArticleDetail } from '../services/knappilyService';
import { localStorageService } from '../services/localStorageService';

// Types
interface KnappilyState {
  articles: Map<number, ArticleCard[]>;
  articleDetails: Map<number, ArticleDetail>;
  pageLoading: Set<number>;
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  hasMore: boolean;
}

type KnappilyAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ARTICLES'; payload: ArticleCard[] }
  | { type: 'SET_ARTICLES_FOR_PAGE'; payload: { page: number; articles: ArticleCard[] } }
  | { type: 'SET_PAGE_LOADING'; payload: { page: number; isLoading: boolean } }
  | { type: 'APPEND_ARTICLES'; payload: ArticleCard[] }
  | { type: 'SET_ARTICLE_DETAIL'; payload: { id: number; detail: ArticleDetail } }
  | { type: 'SET_TOTAL_COUNT'; payload: number }
  | { type: 'SET_CURRENT_PAGE'; payload: number }
  | { type: 'SET_HAS_MORE'; payload: boolean }
  | { type: 'CLEAR_CACHE' };

interface KnappilyContextType {
  state: KnappilyState;
  loadArticles: (refresh?: boolean) => Promise<void>;
  fetchArticlesForPage: (page: number) => Promise<void>;
  loadMoreArticles: () => Promise<void>;
  getArticleDetail: (id: number) => Promise<ArticleDetail | null>;
  refreshData: () => void;
}

// Initial state
const initialState: KnappilyState = {
  articles: new Map(),
  articleDetails: new Map(),
  pageLoading: new Set(),
  loading: false,
  error: null,
  totalCount: 0,
  currentPage: 1,
  hasMore: true,
};

// Reducer
function knappilyReducer(state: KnappilyState, action: KnappilyAction): KnappilyState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_ARTICLES':
      // Convert array to page-based map for backward compatibility
      const articlesMap = new Map();
      const articlesPerPage = 10;
      for (let i = 0; i < action.payload.length; i += articlesPerPage) {
        const page = Math.floor(i / articlesPerPage) + 1;
        articlesMap.set(page, action.payload.slice(i, i + articlesPerPage));
      }
      return {
        ...state,
        articles: articlesMap,
        loading: false,
        error: null,
        currentPage: 1,
      };
    
    case 'SET_ARTICLES_FOR_PAGE':
      const newArticles = new Map(state.articles);
      newArticles.set(action.payload.page, action.payload.articles);
      return { ...state, articles: newArticles };
    
    case 'SET_PAGE_LOADING':
      const newPageLoading = new Set(state.pageLoading);
      if (action.payload.isLoading) {
        newPageLoading.add(action.payload.page);
      } else {
        newPageLoading.delete(action.payload.page);
      }
      return { ...state, pageLoading: newPageLoading };
    
    case 'APPEND_ARTICLES':
      // For backward compatibility - append to the last page or create new page
      const currentArticlesMap = new Map(state.articles);
      const lastPage = Math.max(...Array.from(currentArticlesMap.keys()), 0);
      const lastPageArticles = currentArticlesMap.get(lastPage) || [];
      const allCurrentArticles = Array.from(currentArticlesMap.values()).flat();
      const newAllArticles = [...allCurrentArticles, ...action.payload];
      
      // Rebuild map with new articles
      const updatedMap = new Map();
      const articlesPerPageAppend = 10;
      for (let i = 0; i < newAllArticles.length; i += articlesPerPageAppend) {
        const page = Math.floor(i / articlesPerPageAppend) + 1;
        updatedMap.set(page, newAllArticles.slice(i, i + articlesPerPageAppend));
      }
      
      return {
        ...state,
        articles: updatedMap,
        loading: false,
        error: null,
        currentPage: state.currentPage + 1,
      };
    
    case 'SET_ARTICLE_DETAIL':
      const newDetails = new Map(state.articleDetails);
      newDetails.set(action.payload.id, action.payload.detail);
      return {
        ...state,
        articleDetails: newDetails,
      };
    
    case 'SET_TOTAL_COUNT':
      return { ...state, totalCount: action.payload };
    
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload };
    
    case 'SET_HAS_MORE':
      return { ...state, hasMore: action.payload };
    
    case 'CLEAR_CACHE':
      return {
        ...state,
        articles: new Map(),
        articleDetails: new Map(),
        pageLoading: new Set(),
        currentPage: 0,
        hasMore: true,
      };
    
    default:
      return state;
  }
}

// Context
const KnappilyContext = createContext<KnappilyContextType | undefined>(undefined);

// Provider component
export const KnappilyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(knappilyReducer, initialState);
  const ARTICLES_PER_PAGE = 10;

  // Fetch articles for a specific page
  const fetchArticlesForPage = useCallback(async (page: number) => {
    // Prevent fetching if the page is already loaded or is currently loading
    if (state.articles.has(page) || state.pageLoading.has(page)) {
      return;
    }

    try {
      dispatch({ type: 'SET_PAGE_LOADING', payload: { page, isLoading: true } });

      const articlesPerPage = 10;
      const offset = (page - 1) * articlesPerPage;
      const response = await knappilyService.getArticles(articlesPerPage, offset);
      
      // Extract articles from the response object
      const articles = response.cards || [];

      dispatch({
        type: 'SET_ARTICLES_FOR_PAGE',
        payload: { page, articles },
      });

    } catch (error) {
      console.error(`Failed to fetch articles for page ${page}:`, error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load articles.' });
    } finally {
      dispatch({ type: 'SET_PAGE_LOADING', payload: { page, isLoading: false } });
    }
  }, [state.articles, state.pageLoading]);

  // Load articles
  const loadArticles = useCallback(async (refresh = false) => {
    if (state.loading) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // Try to load from localStorage first (unless refreshing)
      if (!refresh) {
        const storedData = localStorageService.getStoredData();
        if (storedData && storedData.articles.length > 0) {
          // Load all stored articles to preserve user's position
          dispatch({ type: 'SET_ARTICLES_FOR_PAGE', payload: { page: 1, articles: storedData.articles } });
          dispatch({ type: 'SET_TOTAL_COUNT', payload: storedData.pagination.totalCount });
          dispatch({ type: 'SET_HAS_MORE', payload: storedData.pagination.hasMore });
          dispatch({ type: 'SET_CURRENT_PAGE', payload: storedData.pagination.currentPage });
          
          // Load article details from storage
          Object.entries(storedData.articleDetails).forEach(([id, detail]) => {
            dispatch({ type: 'SET_ARTICLE_DETAIL', payload: { id: parseInt(id), detail } });
          });
          
          dispatch({ type: 'SET_LOADING', payload: false });
          return;
        }
      }
      
      if (refresh) {
        knappilyService.clearCache();
        // Clear the articles map and page loading state
        dispatch({ type: 'CLEAR_CACHE' });
      }
      
      const response = await knappilyService.getArticles(ARTICLES_PER_PAGE, 0);
      
      // Extract articles from the response object
      const articles = response.cards || [];
      dispatch({ type: 'SET_ARTICLES_FOR_PAGE', payload: { page: 1, articles } });
      
      // Use hasMore from the response
      const hasMore = response.hasMore || false;
      dispatch({ type: 'SET_HAS_MORE', payload: hasMore });
      
      // Load total count
      let totalCount = 0;
      try {
        const countResponse = await knappilyService.getArticlesCount();
        totalCount = countResponse.total_count;
        dispatch({ type: 'SET_TOTAL_COUNT', payload: totalCount });
      } catch (error) {
        console.warn('Failed to load article count:', error);
      }
      
      // Store in localStorage
      localStorageService.storeData({
        articles,
        articleDetails: {},
        pagination: {
          currentPage: 1,
          totalPages: Math.ceil(totalCount / ARTICLES_PER_PAGE),
          hasMore,
          totalCount
        }
      });
      
    } catch (error) {
      console.error('Error loading articles:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load articles. Please try again.' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.loading]);



  // Get article detail
  const getArticleDetail = useCallback(async (id: number): Promise<ArticleDetail | null> => {
    // Check if already cached in memory
    const cached = state.articleDetails.get(id);
    if (cached) {
      return cached;
    }
    
    // Check localStorage
    const storedData = localStorageService.getStoredData();
    if (storedData && storedData.articleDetails[id.toString()]) {
      const detail = storedData.articleDetails[id.toString()];
      dispatch({ type: 'SET_ARTICLE_DETAIL', payload: { id, detail } });
      return detail;
    }
    
    try {
      const detail = await knappilyService.getArticleDetail(id);
      dispatch({ type: 'SET_ARTICLE_DETAIL', payload: { id, detail } });
      
      // Update localStorage with new detail
      if (storedData) {
        const updatedDetails = { ...storedData.articleDetails, [id.toString()]: detail };
        localStorageService.storeData({
          articles: storedData.articles,
          articleDetails: updatedDetails,
          pagination: storedData.pagination
        });
      }
      
      return detail;
    } catch (error) {
      console.error(`Error loading article detail for ID ${id}:`, error);
      return null;
    }
  }, [state.articleDetails]);

  // Refresh all data
  const refreshData = useCallback(() => {
    loadArticles(true);
  }, [loadArticles]);

  // Register tab for localStorage cleanup
  useEffect(() => {
    localStorageService.registerTab();
  }, []);

  // Initial load
  useEffect(() => {
    loadArticles();
  }, []);

  const value: KnappilyContextType = {
    state,
    loadArticles,
     fetchArticlesForPage,
     getArticleDetail,
     refreshData,
  };

  return (
    <KnappilyContext.Provider value={value}>
      {children}
    </KnappilyContext.Provider>
  );
};

// Hook to use the context
export const useKnappily = (): KnappilyContextType => {
  const context = useContext(KnappilyContext);
  if (context === undefined) {
    throw new Error('useKnappily must be used within a KnappilyProvider');
  }
  return context;
};

export default KnappilyContext;