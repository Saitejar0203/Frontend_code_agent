// Legacy interface for backward compatibility
export interface NewsArticle {
  id: string;
  title: string;
  introduction: string;
  image: string;
  category: string;
  publishDate: string;
  sections: {
    what: {
      title: string;
      content: string;
      image: string;
    };
    why: {
      title: string;
      content: string;
      image: string;
    };
    when: {
      title: string;
      content: string;
      image: string;
    };
    where: {
      title: string;
      content: string;
      image: string;
    };
    who: {
      title: string;
      content: string;
      image: string;
    };
    how: {
      title: string;
      content: string;
      image: string;
    };
    citations: {
      title: string;
      content: string;
      image: string;
    };
  };
}

// Updated section keys without conclusion
export type SectionKey = 'what' | 'why' | 'when' | 'where' | 'who' | 'how' | 'citations';

// Empty array - data now comes from API
export const newsArticles: NewsArticle[] = [];

// Temporary storage for dynamically loaded articles
let dynamicArticles: NewsArticle[] = [];

// Function to set articles from API
export const setNewsArticles = (articles: NewsArticle[]) => {
  dynamicArticles = articles;
};

// Function to get current articles
export const getNewsArticles = (): NewsArticle[] => {
  return dynamicArticles.length > 0 ? dynamicArticles : newsArticles;
};

export const getArticleById = (id: string): NewsArticle | undefined => {
  return getNewsArticles().find(article => article.id === id);
};

export const getSectionKeys = () => ['what', 'why', 'when', 'where', 'who', 'how', 'citations'] as const;