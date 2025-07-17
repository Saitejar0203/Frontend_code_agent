import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { MarkdownRenderer } from '@/components/markdown';
import { ArticleDetail } from '../../data/newsData';
import MobileArticleDetailSkeleton from './MobileArticleDetailSkeleton';

interface MobileArticleDetailViewProps {
  articleDetail: ArticleDetail | null;
  currentSection: any;
  currentSectionIndex: number;
  sectionKeys: string[];
  section: string;
  articleId: string;
  onSectionChange: (sectionIndex: number) => void;
}

const MobileArticleDetailView: React.FC<MobileArticleDetailViewProps> = ({
  articleDetail,
  currentSection,
  currentSectionIndex,
  sectionKeys,
  section,
  articleId,
  onSectionChange
}) => {
  const navigate = useNavigate();

  // Show skeleton while loading
  if (!articleDetail) {
    return <MobileArticleDetailSkeleton />;
  }

  // Self-contained gesture handling logic for reliable swiping
  const touchStartRef = useRef<{ x: number, y: number } | null>(null);
  const gestureDirectionRef = useRef<'horizontal' | 'vertical' | null>(null);
  const sectionTitlesRef = useRef<HTMLDivElement>(null);
  const contentScrollerRef = useRef<HTMLDivElement>(null);
  const MIN_SWIPE_DISTANCE = 50;

  // Auto-scroll section titles to keep current section visible
  useEffect(() => {
    if (sectionTitlesRef.current) {
      const container = sectionTitlesRef.current;
      const buttons = container.querySelectorAll('button');
      const currentButton = buttons[currentSectionIndex] as HTMLElement;
      
      if (currentButton) {
        const containerWidth = container.offsetWidth;
        const buttonLeft = currentButton.offsetLeft;
        const buttonWidth = currentButton.offsetWidth;
        const currentScroll = container.scrollLeft;
        
        // Calculate the ideal scroll position to center the current button
        const idealScroll = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);
        
        // Smooth scroll to the calculated position
        container.scrollTo({
          left: Math.max(0, idealScroll),
          behavior: 'smooth'
        });
      }
    }
  }, [currentSectionIndex]);

  // Scroll content to top when section changes
  useEffect(() => {
    if (contentScrollerRef.current) {
      contentScrollerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, [currentSectionIndex]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    gestureDirectionRef.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || gestureDirectionRef.current === 'vertical') return;
    if (gestureDirectionRef.current === null) {
      const dx = e.touches[0].clientX - touchStartRef.current.x;
      const dy = e.touches[0].clientY - touchStartRef.current.y;
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        if (Math.abs(dx) > Math.abs(dy)) {
          gestureDirectionRef.current = 'horizontal';
        } else {
          gestureDirectionRef.current = 'vertical';
        }
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (gestureDirectionRef.current !== 'horizontal' || !touchStartRef.current) return;
    const lastTouch = e.changedTouches[0];
    const dx = lastTouch.clientX - touchStartRef.current.x;
    if (Math.abs(dx) > MIN_SWIPE_DISTANCE) {
      if (dx < 0) { // Swipe Left
        if (currentSectionIndex < sectionKeys.length - 1) {
          const newIndex = currentSectionIndex + 1;
          onSectionChange(newIndex, sectionKeys[newIndex]);
        }
      } else { // Swipe Right
        if (currentSectionIndex > 0) {
          const newIndex = currentSectionIndex - 1;
          onSectionChange(newIndex, sectionKeys[newIndex]);
        }
      }
    }
    touchStartRef.current = null;
    gestureDirectionRef.current = null;
  };

  return (
    <div className="bg-white h-screen flex flex-col overscroll-y-contain">
      <div className="flex-shrink-0 touch-pan-x">
        {/* --- MOBILE HEADER --- */}
        <div className="bg-white/95 backdrop-blur-xl border-b border-gray-200/30">
          <div className="flex items-center pl-2 pr-4 py-3 h-[52px]">
            <button onClick={() => navigate('/qoffee')} className="p-2 rounded-full"><ArrowLeft className="w-6 h-6 text-gray-700" /></button>
            <h1 className="text-sm font-semibold text-gray-800 truncate ml-3 flex-1">{articleDetail.title}</h1>
            <div className="px-2 py-1 rounded-full bg-gray-100"><span className="text-xs font-medium text-gray-600">{currentSectionIndex + 1}/{sectionKeys.length}</span></div>
          </div>
        </div>
      </div>

      {/* Main content area for mobile */}
      <div 
        className="flex-1 flex flex-col min-h-0"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex flex-col flex-1 min-h-0">
            {/* --- IMAGE CONTAINER --- */}
            <div className="flex-shrink-0 touch-pan-x">
              <div className="relative h-[30vh] min-h-[240px]">
                <div className="h-full relative overflow-hidden">
                  <img src={currentSection.image} alt={currentSection.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/60 to-transparent">
                    <div ref={sectionTitlesRef} className="flex overflow-x-auto scrollbar-hide gap-2" style={{ touchAction: 'pan-x' }}>
                      {sectionKeys.map((key, index) => (
                        <button key={key} onClick={() => onSectionChange(index, key)} className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-all duration-300 ${index === currentSectionIndex ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/20 border border-white/30 text-white/80 hover:bg-white/30 hover:text-white backdrop-blur-md'}`}>
                          {key.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* --- CONTENT SCROLLER --- */}
            <div ref={contentScrollerRef} className="flex-1 overflow-y-auto overscroll-y-contain">
              <div className="p-4 pb-24 md:pb-8">
                <div className="max-w-4xl mx-auto">
                  <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4 leading-tight">
                    {currentSection.title}
                  </h2>
                  {section === 'citations' ? (
                    <div className="citations-content text-gray-700 text-base leading-relaxed">
                      {articleDetail.citations && articleDetail.citations.length > 0 ? (
                         <div className="citations-container">
                           <div className="space-y-3">
                             {articleDetail.citations
                               .sort((a, b) => a.order - b.order)
                               .map((citation, index) => {
                                 const domain = citation.url ? new URL(citation.url).hostname.replace('www.', '') : 'Unknown Source';
                                 return (
                                   <div key={index} className="citation-item p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors duration-200">
                                     <div className="flex items-start space-x-3">
                                       <div className="citation-number flex-shrink-0 w-7 h-7 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center text-xs font-medium">
                                         {index + 1}
                                       </div>
                                       <div className="flex-1 min-w-0">
                                         <div className="citation-title font-medium text-gray-900 mb-2 leading-snug text-sm">
                                           {citation.title}
                                         </div>
                                         <div className="citation-source flex items-center justify-between flex-wrap gap-2">
                                           <span className="text-xs text-gray-500">{domain}</span>
                                           <a href={citation.url} target="_blank" rel="noopener noreferrer" 
                                              className="inline-flex items-center text-gray-700 hover:text-gray-900 text-xs font-medium transition-colors duration-200">
                                             <span>View Source</span>
                                             <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                           <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                             <p className="text-xs text-gray-600 text-center">
                               All sources are verified and lead to external websites.
                             </p>
                           </div>
                         </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm">No sources available for this article.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-700 text-lg leading-relaxed font-light">
                      <MarkdownRenderer content={currentSection.content} theme="article" enableGfm={true} />
                    </div>
                  )}
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MobileArticleDetailView;