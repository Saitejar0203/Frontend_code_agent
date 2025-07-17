/**
 * Knappily API Service
 * 
 * This service handles all API calls to the Knappily backend endpoints.
 * It provides methods to fetch articles, article details, and manage real-time updates.
 */

export interface ArticleSection {
  title: string;
  content: string;
  image?: string;
}

export interface CitationSource {
  title: string;
  url: string;
  order: number;
}

export interface ArticleCard {
  id: number;
  title: string;
  introduction: string;
  image: string;
  category: string;
  publishDate: string;
  has_podcast: boolean;
}

export interface ArticleDetail {
  id: number;
  title: string;
  introduction: string;
  image: string;
  category: string;
  publishDate: string;
  sections: {
    what: ArticleSection;
    why: ArticleSection;
    when: ArticleSection;
    where: ArticleSection;
    who: ArticleSection;
    how: ArticleSection;
    citations?: ArticleSection;
  };
  citations: CitationSource[];
}

export type SectionKey = 'what' | 'why' | 'when' | 'where' | 'who' | 'how' | 'citations';

class KnappilyService {
  private baseUrl: string;
  private cache: Map<string, any> = new Map();
  private cacheTimeout = 15 * 60 * 1000; // 15 minutes for better mobile performance
  private preloadQueue: Set<string> = new Set();

  constructor() {
    // Use knappily-specific environment variable or default to localhost:8001
    this.baseUrl = import.meta.env.VITE_KNAPPILY_API_BASE_URL || 'http://localhost:8001';
  }

  private async fetchWithCache<T>(url: string, cacheKey: string): Promise<T> {
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      // Add timeout to prevent indefinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${this.baseUrl}${url}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error(`Request timeout for ${url}`);
        throw new Error('Request timeout - please try again');
      }
      console.error(`Error fetching ${url}:`, error);
      throw error;
    }
  }

  /**
   * Fetch paginated list of articles
   */
  async getArticles(limit: number = 20, offset: number = 0): Promise<{cards: ArticleCard[], hasMore: boolean}> {
    const cacheKey = `articles_${limit}_${offset}`;
    return this.fetchWithCache<{cards: ArticleCard[], hasMore: boolean}>(
      `/api/knappily/articles?limit=${limit}&offset=${offset}`,
      cacheKey
    );
  }

  /**
   * Fetch detailed article information
   */
  async getArticleDetail(articleId: number): Promise<ArticleDetail> {
    const cacheKey = `article_detail_${articleId}`;
    return this.fetchWithCache<ArticleDetail>(
      `/api/knappily/articles/${articleId}`,
      cacheKey
    );
  }

  /**
   * Get total count of articles
   */
  async getArticlesCount(): Promise<{ total_count: number }> {
    return this.fetchWithCache<{ total_count: number }>(
      '/api/knappily/articles/count',
      'articles_count'
    );
  }

  /**
   * Get podcast info for an article
   */
  async getPodcastInfo(articleId: string): Promise<{ has_podcast: boolean; podcast_available: boolean; title: string }> {
    const cacheKey = `podcast_info_${articleId}`;
    return this.fetchWithCache<{ has_podcast: boolean; podcast_available: boolean; title: string }>(
      `/api/knappily/articles/${articleId}/podcast/info`,
      cacheKey
    );
  }

  /**
   * Get podcast stream URL for an article
   */
  getPodcastStreamUrl(articleId: string): string {
    return `${this.baseUrl}/api/knappily/articles/${articleId}/podcast/stream`;
  }

  /**
   * Get direct signed URL for podcast audio file to bypass backend proxy
   */
  async getPodcastSignedUrl(articleId: string): Promise<{ url: string }> {
    const cacheKey = `podcast_url_${articleId}`;
    return this.fetchWithCache<{ url: string }>(
      `/api/knappily/articles/${articleId}/podcast/url`,
      cacheKey
    );
  }

  /**
   * Clear cache (useful for real-time updates)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear specific cache entry
   */
  clearCacheEntry(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Get section keys in order
   */
  getSectionKeys(): SectionKey[] {
    return ['what', 'why', 'when', 'where', 'who', 'how'];
  }

  /**
   * Convert ArticleCard to legacy NewsArticle format for compatibility
   */
  convertToLegacyFormat(articles: ArticleCard[]): any[] {
    return articles.map(article => ({
      id: article.id.toString(),
      title: article.title,
      introduction: article.introduction,
      image: article.image,
      category: article.category,
      publishDate: article.publishDate,
      // Placeholder sections - will be loaded on demand
      sections: {}
    }));
  }

  /**
   * Convert ArticleDetail to legacy format with sections
   */
  convertDetailToLegacyFormat(detail: ArticleDetail): any {
    return {
      id: detail.id.toString(),
      title: detail.title,
      introduction: detail.introduction,
      image: detail.image,
      category: detail.category,
      publishDate: detail.publishDate,
      sections: {
        what: {
          title: detail.sections.what.title,
          content: detail.sections.what.content,
          image: detail.sections.what.image || '/placeholder.svg'
        },
        why: {
          title: detail.sections.why.title,
          content: detail.sections.why.content,
          image: detail.sections.why.image || '/placeholder.svg'
        },
        when: {
          title: detail.sections.when.title,
          content: detail.sections.when.content,
          image: detail.sections.when.image || '/placeholder.svg'
        },
        where: {
          title: detail.sections.where.title,
          content: detail.sections.where.content,
          image: detail.sections.where.image || '/placeholder.svg'
        },
        who: {
          title: detail.sections.who.title,
          content: detail.sections.who.content,
          image: detail.sections.who.image || '/placeholder.svg'
        },
        how: {
          title: detail.sections.how.title,
          content: detail.sections.how.content,
          image: detail.sections.how.image || '/placeholder.svg'
        },
        citations: {
          title: 'Citations',
          content: this.formatCitations(detail.citations),
          image: '/placeholder.svg'
        }
      }
    };
  }

  /**
   * Format citations for display
   */
  private formatCitations(citations: CitationSource[]): string {
    if (!citations || citations.length === 0) {
      return '<div class="text-center py-12 text-gray-500"><div class="bg-gray-50 rounded-lg p-6"><p class="text-lg">No sources available for this article.</p></div></div>';
    }

    // Create a more structured citation format
    const formattedCitations = citations
      .sort((a, b) => a.order - b.order)
      .map((citation, index) => {
        // Extract domain from URL for better readability
        const domain = this.extractDomain(citation.url);
        // Escape HTML in title to prevent XSS
        const safeTitle = this.escapeHtml(citation.title);
        
        return `<div class="citation-item group mb-6 p-5 bg-gradient-to-r from-white to-gray-50 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-300">
          <div class="flex items-start space-x-4">
            <div class="citation-number flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">
              ${index + 1}
            </div>
            <div class="flex-1 min-w-0">
              <div class="citation-title font-semibold text-gray-900 mb-3 leading-snug text-lg group-hover:text-blue-900 transition-colors duration-200">
                ${safeTitle}
              </div>
              <div class="citation-source flex items-center justify-between flex-wrap gap-3">
                <div class="flex items-center space-x-2">
                  <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0 9c-1.657 0-3-4.03-3-9s1.343-9 3-9m0 9c1.657 0 3 4.03 3 9s-1.343 9-3 9m-9-9c4.97 0 9-4.03 9-9s-4.03-9-9-9-9 4.03-9 9 4.03 9 9 9z"></path>
                  </svg>
                  <span class="text-sm font-medium text-gray-700 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200">${domain}</span>
                </div>
                <a href="${citation.url}" target="_blank" rel="noopener noreferrer" 
                   class="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105">
                  <span>View Source</span>
                  <svg class="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>`;
      })
      .join('\n');

    return `<div class="citations-container">
      <div class="mb-8 text-center">
        <div class="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-full shadow-lg">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <h3 class="text-xl font-bold">Sources & References</h3>
        </div>
        <p class="text-gray-600 mt-4 text-base max-w-2xl mx-auto">The following trusted sources were carefully researched and used to compile this comprehensive article:</p>
      </div>
      <div class="space-y-4">
        ${formattedCitations}
      </div>
      <div class="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p class="text-sm text-blue-800 text-center">
          <svg class="inline w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          All sources are verified and lead to external websites. Click "View Source" to access the original content.
        </p>
      </div>
    </div>`;
  }

  /**
   * Preload articles for better mobile performance
   */
  async preloadArticles(articleIds: number[]): Promise<void> {
    const preloadPromises = articleIds.map(async (articleId) => {
      const cacheKey = `article_detail_${articleId}`;
      
      // Skip if already cached or in preload queue
      if (this.cache.has(cacheKey) || this.preloadQueue.has(cacheKey)) {
        return;
      }
      
      this.preloadQueue.add(cacheKey);
      
      try {
        await this.getArticleDetail(articleId);
      } catch (error) {
        // Silently fail preloading to avoid disrupting user experience
        console.debug(`Preload failed for article ${articleId}:`, error);
      } finally {
        this.preloadQueue.delete(cacheKey);
      }
    });
    
    // Execute preloads with a small delay to avoid overwhelming the server
    await Promise.allSettled(preloadPromises);
  }

  /**
   * Check if an article is cached
   */
  isArticleCached(articleId: number): boolean {
    const cacheKey = `article_detail_${articleId}`;
    const cached = this.cache.get(cacheKey);
    return cached && Date.now() - cached.timestamp < this.cacheTimeout;
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Extract domain from URL for display
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return 'Unknown Source';
    }
  }

  /**
   * Escape HTML to prevent XSS attacks
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Export singleton instance
export const knappilyService = new KnappilyService();
export default knappilyService;