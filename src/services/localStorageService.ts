/**
 * Local Storage Service for Knappily Clone
 * Handles persistent storage of articles, pagination state, and cleanup
 */

import type { ArticleCard, ArticleDetail } from './knappilyService';

interface StoredData {
  articles: ArticleCard[];
  articleDetails: Record<string, ArticleDetail>;
  pagination: {
    currentPage: number;
    totalPages: number;
    hasMore: boolean;
    totalCount: number;
  };
  timestamp: number;
}

class LocalStorageService {
  private readonly STORAGE_KEY = 'knappily_clone_data';
  private readonly ACTIVE_TABS_KEY = 'knappily_active_tabs';
  private readonly MAX_STORAGE_SIZE = 4 * 1024 * 1024; // 4MB limit
  private readonly DATA_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Get stored article data from localStorage
   */
  getStoredData(): StoredData | null {
    try {
      if (!this.isLocalStorageAvailable()) return null;
      
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;

      const data: StoredData = JSON.parse(stored);
      
      // Check if data is expired
      if (Date.now() - data.timestamp > this.DATA_EXPIRY) {
        this.clearData();
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }

  /**
   * Store article data to localStorage
   */
  storeData(data: Omit<StoredData, 'timestamp'>): boolean {
    try {
      if (!this.isLocalStorageAvailable()) return false;

      const dataWithTimestamp: StoredData = {
        ...data,
        timestamp: Date.now()
      };

      const serialized = JSON.stringify(dataWithTimestamp);
      
      // Check size limit
      if (serialized.length > this.MAX_STORAGE_SIZE) {
        console.warn('Data too large for localStorage, truncating articles...');
        // Keep only the most recent articles if data is too large
        const truncatedData = {
          ...dataWithTimestamp,
          articles: dataWithTimestamp.articles.slice(0, 50) // Keep only 50 most recent
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(truncatedData));
      } else {
        localStorage.setItem(this.STORAGE_KEY, serialized);
      }

      return true;
    } catch (error) {
      console.error('Error storing to localStorage:', error);
      return false;
    }
  }

  /**
   * Append new articles to existing stored data
   */
  appendArticles(newArticles: ArticleCard[], newDetails: Record<string, ArticleDetail>, pagination: StoredData['pagination']): boolean {
    const existingData = this.getStoredData();
    
    if (!existingData) {
      // No existing data, store as new
      return this.storeData({
        articles: newArticles,
        articleDetails: newDetails,
        pagination
      });
    }

    // Merge with existing data
    const mergedArticles = [...existingData.articles];
    const mergedDetails = { ...existingData.articleDetails, ...newDetails };
    
    // Add only new articles (avoid duplicates)
    newArticles.forEach(article => {
      if (!mergedArticles.find(existing => existing.id === article.id)) {
        mergedArticles.push(article);
      }
    });

    return this.storeData({
      articles: mergedArticles,
      articleDetails: mergedDetails,
      pagination
    });
  }

  /**
   * Refresh data with new articles (replace existing)
   */
  refreshData(articles: ArticleCard[], details: Record<string, ArticleDetail>, pagination: StoredData['pagination']): boolean {
    return this.storeData({
      articles,
      articleDetails: details,
      pagination
    });
  }

  /**
   * Clear all stored data
   */
  clearData(): void {
    try {
      if (this.isLocalStorageAvailable()) {
        localStorage.removeItem(this.STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }

  /**
   * Check if localStorage is available
   */
  private isLocalStorageAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get articles for a specific page
   */
  getArticlesForPage(page: number, articlesPerPage: number = 10): ArticleCard[] {
    const data = this.getStoredData();
    if (!data) return [];

    const startIndex = (page - 1) * articlesPerPage;
    const endIndex = startIndex + articlesPerPage;
    return data.articles.slice(startIndex, endIndex);
  }

  /**
   * Track active tabs for cleanup
   */
  registerTab(): void {
    try {
      const tabId = `tab_${Date.now()}_${Math.random()}`;
      const activeTabsKey = this.ACTIVE_TABS_KEY;
      const activeTabs = JSON.parse(localStorage.getItem(activeTabsKey) || '[]');
      activeTabs.push(tabId);
      localStorage.setItem(activeTabsKey, JSON.stringify(activeTabs));
      
      // Store tab ID for cleanup on unload
      window.addEventListener('beforeunload', () => {
        const currentTabs = JSON.parse(localStorage.getItem(activeTabsKey) || '[]');
        const updatedTabs = currentTabs.filter((id: string) => id !== tabId);
        
        if (updatedTabs.length === 0) {
          // Last tab closing, clear all data
          localStorage.removeItem(activeTabsKey);
          this.clearData();
        } else {
          localStorage.setItem(activeTabsKey, JSON.stringify(updatedTabs));
        }
      });
    } catch (error) {
      console.error('Error registering tab:', error);
    }
  }
}

export const localStorageService = new LocalStorageService();
export default localStorageService;
export type { StoredData };