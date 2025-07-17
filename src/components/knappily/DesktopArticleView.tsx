import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from '@/components/markdown';
import Pagination from '@/components/Pagination';
import PodcastPlayButton from '@/components/ui/PodcastPlayButton';
import { Article } from '../../data/newsData';

interface DesktopArticleViewProps {
  displayedArticles: Article[];
  currentDesktopPage: number;
  totalPages: number;
  isRefreshing: boolean;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onPageChange: (page: number) => void;
  onArticleClick: (article: Article) => void;
  formatDate: (date: string) => string;
}

const DesktopArticleView: React.FC<DesktopArticleViewProps> = ({
  displayedArticles,
  currentDesktopPage,
  totalPages,
  isRefreshing,
  loading,
  error,
  onRefresh,
  onPageChange,
  onArticleClick,
  formatDate
}) => {
  return (
    <div className="hidden md:block min-h-screen overflow-y-auto bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Desktop Header */}
      <div className="border-b border-gray-200/50 bg-white/70 backdrop-blur-sm">
        <div className="flex items-center justify-between p-3 md:p-4 max-w-7xl mx-auto min-h-[70px] md:min-h-[80px]">
          <div className="flex items-center space-x-2 md:space-x-4 flex-1 min-w-0">
            <Link 
              to="/" 
              className="flex items-center space-x-1 md:space-x-2 text-gray-600 hover:text-gray-800 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm hidden sm:inline">Home</span>
              <span className="text-xs sm:hidden">Home</span>
            </Link>
            
            <div className="min-w-0 flex-1 text-center md:text-center">
              <h1 className="text-base md:text-lg font-semibold text-gray-800 truncate">Qoffee</h1>
              <p className="text-xs md:text-sm text-gray-600 truncate hidden sm:block">AI-powered news analysis and insights</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto p-6 pb-12 pt-12">
        {/* Desktop Header with Refresh Button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Latest Articles</h2>
            <p className="text-gray-600">Page {currentDesktopPage} of {totalPages}</p>
          </div>
          <Button
            onClick={onRefresh}
            disabled={isRefreshing}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {loading || (displayedArticles.length === 0 && !error) ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading articles...</p>
              </div>
            </div>
          ) : displayedArticles.length === 0 ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-gray-600 mb-2">No articles available</p>
                <p className="text-gray-500 text-sm">Please check back later or try refreshing the page.</p>
              </div>
            </div>
          ) : (
            displayedArticles.map((article) => (
              <div 
                key={article.id}
                onClick={() => onArticleClick(article)}
                className="knappily-card-hover cursor-pointer flex flex-col h-full border border-gray-100"
              >
                <div className="h-full flex flex-col">
                  {/* Article image - made bigger */}
                  <div className="h-80 relative overflow-hidden article-image-container">
                    <img 
                      src={article.image || '/placeholder-image.jpg'} 
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    
                    {/* AI Generated badge */}
                     <div className="absolute top-2 left-3">
                       <div className="podcast-play-button px-3 py-0.5 rounded-lg">
                         <span className="text-white text-xs font-medium">
                           AI Generated
                        </span>
                      </div>
                    </div>
                    
                    {/* Podcast Play Button */}
                    <div className="podcast-button-container">
                      <PodcastPlayButton 
                      articleId={article.id}
                      size="xl"
                      hasPodcast={article.has_podcast}
                    />
                    </div>
                    
                    <h3 className="absolute bottom-4 left-4 right-4 text-white text-xl font-bold leading-tight">
                      {article.title}
                    </h3>
                  </div>
                  
                  {/* Article content */}
                  <div className="flex-1 p-6 pb-0">
                    <div className="text-gray-700 text-base leading-relaxed">
                      <MarkdownRenderer 
                        content={article.introduction}
                        theme="minimal"
                        enableCopy={false}
                        enableGfm={true}
                        enableHighlighting={false}
                        enableRawHtml={false}
                        enableMath={true}
                      />
                    </div>
                  </div>
                  
                  {/* Bottom bar with category and date */}
                  <div className="p-6 pt-4 border-t border-gray-100 bg-gray-50/50">
                    <div className="flex items-center justify-between">
                      <span className="text-orange-500 text-sm font-medium bg-orange-100 px-3 py-1 rounded-full">
                        {article.category}
                      </span>
                      <span className="text-gray-500 text-sm">
                        {formatDate(article.publishDate)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Desktop Pagination */}
        {displayedArticles.length > 0 && (
          <Pagination
            currentPage={currentDesktopPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};

export default DesktopArticleView;