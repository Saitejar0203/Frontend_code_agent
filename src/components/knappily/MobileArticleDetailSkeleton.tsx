import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const MobileArticleDetailSkeleton: React.FC = () => {
  return (
    <SkeletonTheme baseColor="#f3f4f6" highlightColor="#e5e7eb">
      <div className="h-screen bg-white overflow-hidden">
        {/* Header Skeleton */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-14">
          <div className="flex items-center justify-between px-4 h-full">
            <div className="flex items-center space-x-3">
              <Skeleton width={24} height={24} />
              <Skeleton width={100} height={20} />
            </div>
            <Skeleton width={80} height={32} borderRadius={6} />
          </div>
        </header>

        {/* Section Navigation Skeleton */}
        <div className="fixed top-14 left-0 right-0 z-40 bg-white border-b border-gray-200">
          <div className="flex space-x-2 px-4 py-3 overflow-x-auto">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} width={60} height={32} borderRadius={16} />
            ))}
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="pt-28 pb-6 px-4 h-full overflow-y-auto">
          {/* Section Title */}
          <div className="mb-6">
            <Skeleton height={32} width="70%" className="mb-2" />
          </div>

          {/* Section Image */}
          <div className="mb-6">
            <Skeleton height={200} borderRadius={8} />
          </div>

          {/* Content Paragraphs */}
          <div className="space-y-4">
            <Skeleton height={20} />
            <Skeleton height={20} />
            <Skeleton height={20} width="90%" />
            <Skeleton height={20} />
            <Skeleton height={20} width="85%" />
            <Skeleton height={20} />
            <Skeleton height={20} width="95%" />
            <Skeleton height={20} />
            <Skeleton height={20} width="80%" />
            <Skeleton height={20} />
            <Skeleton height={20} width="92%" />
            <Skeleton height={20} />
          </div>

          {/* Additional Content Blocks */}
          <div className="mt-8 space-y-6">
            <div>
              <Skeleton height={24} width="60%" className="mb-3" />
              <div className="space-y-2">
                <Skeleton height={18} />
                <Skeleton height={18} width="88%" />
                <Skeleton height={18} />
              </div>
            </div>
            
            <div>
              <Skeleton height={24} width="50%" className="mb-3" />
              <div className="space-y-2">
                <Skeleton height={18} />
                <Skeleton height={18} width="93%" />
                <Skeleton height={18} width="85%" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </SkeletonTheme>
  );
};

export default MobileArticleDetailSkeleton;