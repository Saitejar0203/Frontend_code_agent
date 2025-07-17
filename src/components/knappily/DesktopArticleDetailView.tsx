import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { MarkdownRenderer } from '@/components/markdown';
import { ArticleDetail } from '../../data/newsData';

interface DesktopArticleDetailViewProps {
  articleDetail: ArticleDetail;
  currentSection: any;
  currentSectionIndex: number;
  sectionKeys: string[];
  section: string;
  articleId: string;
  onSectionChange: (index: number, key: string) => void;
}

const DesktopArticleDetailView: React.FC<DesktopArticleDetailViewProps> = ({
  articleDetail,
  currentSection,
  currentSectionIndex,
  sectionKeys,
  section,
  articleId,
  onSectionChange
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar with title and back button */}
      <div className="fixed top-0 left-0 right-0 z-50">
        {/* Desktop top bar */}
        <div className="border-b border-gray-200/50 bg-white/70 backdrop-blur-sm">
          <div className="flex items-center justify-between p-3 md:p-4 max-w-7xl mx-auto min-h-[70px] md:min-h-[80px]">
            <div className="flex items-center space-x-2 md:space-x-4 flex-1 min-w-0">
              <button 
                onClick={() => navigate('/qoffee')}
                className="flex items-center space-x-1 md:space-x-2 text-gray-600 hover:text-gray-800 transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Home</span>
              </button>
              
              <div className="min-w-0 flex-1 text-center md:text-center">
                <h1 className="text-base md:text-lg font-semibold text-gray-800 truncate">{articleDetail.title}</h1>
              </div>
            </div>
            <div className="px-3 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-white/30 ml-2 md:ml-4 flex-shrink-0">
              <span className="text-sm font-medium text-gray-600">
                {currentSectionIndex + 1}/{sectionKeys.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Section content */}
      <div className="h-screen overflow-hidden pt-16 md:pt-20">
        {/* Section navigation tabs - full width bar for desktop */}
        <div className="block">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="flex justify-center gap-6 max-w-7xl mx-auto" id="section-tabs-container">
              {sectionKeys.map((key, index) => (
                <button
                  key={key}
                  data-section-index={index}
                  onClick={() => {
                    onSectionChange(index, key);
                    navigate(`/qoffee/${articleId}/${key}`);
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all duration-300 ${
                    index === currentSectionIndex
                      ? 'bg-blue-600 text-white shadow-lg border border-blue-600 scale-105 font-semibold'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:scale-105 shadow-sm'
                  }`}
                >
                  {key.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="h-full flex flex-row md:h-[calc(100vh-160px)]">
          {/* Left side container for image */}
          <div className="md:w-1/2 lg:w-2/5 flex flex-col md:mt-16">
            {/* Section image */}
            <div className="h-[calc(70vh-120px)] relative overflow-hidden">
              <img 
                src={currentSection.image} 
                alt={currentSection.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
            </div>
          </div>
          
          {/* Section content - properly scrollable on desktop */}
          <div className="flex-1 p-2 md:p-8 pb-8 md:pb-[40px] overflow-y-auto md:flex md:justify-center section-content">
            <div className="max-w-4xl mx-auto md:max-w-2xl md:pt-8 md:pb-16">
              <h2 className="text-xl md:text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-1 md:mb-8 leading-relaxed py-1">
                {currentSection.title}
              </h2>
              {section === 'citations' ? (
                <div className="citations-content text-gray-700 text-base md:text-lg leading-relaxed">
                  {articleDetail.citations && articleDetail.citations.length > 0 ? (
                     <div className="citations-container">
                       <div className="space-y-3">
                         {articleDetail.citations
                           .sort((a, b) => a.order - b.order)
                           .map((citation, index) => {
                             const domain = citation.url ? new URL(citation.url).hostname.replace('www.', '') : 'Unknown Source';
                             return (
                               <div key={index} className="citation-item p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors duration-200">
                                 <div className="flex items-start space-x-3">
                                   <div className="citation-number flex-shrink-0 w-8 h-8 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center text-sm font-medium">
                                     {index + 1}
                                   </div>
                                   <div className="flex-1 min-w-0">
                                     <div className="citation-title font-medium text-gray-900 mb-2 leading-snug">
                                       {citation.title}
                                     </div>
                                     <div className="citation-source flex items-center justify-between flex-wrap gap-3">
                                       <span className="text-sm text-gray-500">{domain}</span>
                                       <a href={citation.url} target="_blank" rel="noopener noreferrer" 
                                          className="inline-flex items-center text-gray-700 hover:text-gray-900 text-sm font-medium transition-colors duration-200">
                                         <span>View Source</span>
                                         <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                                         </svg>
                                       </a>
                                     </div>
                                   </div>
                                 </div>
                               </div>
                             );
                           })}
                       </div>
                       <div className="mt-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
                         <p className="text-sm text-gray-600 text-center">
                           All sources are verified and lead to external websites.
                         </p>
                       </div>
                     </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <div className="bg-gray-50 rounded-lg p-6">
                        <p className="text-lg">No sources available for this article.</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-700 text-base leading-relaxed md:leading-loose font-light">
                  <MarkdownRenderer 
                    content={currentSection.content}
                    theme="article"
                    enableCopy={false}
                    enableGfm={true}
                    enableHighlighting={false}
                    enableRawHtml={false}
                    enableMath={true}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation arrows for desktop */}
      <div className="block">
        {currentSectionIndex > 0 && (
          <button
            onClick={() => {
              const newIndex = currentSectionIndex - 1;
              onSectionChange(newIndex, sectionKeys[newIndex]);
              navigate(`/qoffee/${articleId}/${sectionKeys[newIndex]}`);
            }}
            className="fixed left-6 top-1/2 transform -translate-y-1/2 p-4 bg-white/70 backdrop-blur-xl border border-white/30 rounded-full shadow-xl hover:bg-white/90 hover:scale-110 transition-all duration-200"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
        )}
        {currentSectionIndex < sectionKeys.length - 1 && (
          <button
            onClick={() => {
              const newIndex = currentSectionIndex + 1;
              onSectionChange(newIndex, sectionKeys[newIndex]);
              navigate(`/qoffee/${articleId}/${sectionKeys[newIndex]}`);
            }}
            className="fixed right-6 top-1/2 transform -translate-y-1/2 p-4 bg-white/70 backdrop-blur-xl border border-white/30 rounded-full shadow-xl hover:bg-white/90 hover:scale-110 transition-all duration-200"
          >
            <ChevronRight className="w-6 h-6 text-gray-700" />
          </button>
        )}
      </div>
    </div>
  );
};

export default DesktopArticleDetailView;