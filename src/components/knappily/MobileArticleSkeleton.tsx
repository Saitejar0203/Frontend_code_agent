import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

interface MobileArticleSkeletonProps {
  count?: number;
}

const MobileArticleSkeleton: React.FC<MobileArticleSkeletonProps> = ({ count = 1 }) => {
  const HEADER_HEIGHT_PX = 52;
  const IMAGE_HEIGHT_VH = 30;
  const CONTENT_TOP_OFFSET = `calc(${HEADER_HEIGHT_PX}px + ${IMAGE_HEIGHT_VH}vh)`;

  return (
    <SkeletonTheme baseColor="#f3f4f6" highlightColor="#e5e7eb">
      <div className="h-screen w-screen bg-gray-200 overflow-hidden">
        {/* Header Skeleton */}
        <header
          style={{ height: `${HEADER_HEIGHT_PX}px`, zIndex: 20 }}
          className="fixed top-0 left-0 right-0 border-b border-gray-200/50 bg-white/95 backdrop-blur-md"
        >
          <div className="flex items-center justify-between p-2 h-full">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <Skeleton width={60} height={20} />
              <div className="min-w-0 flex-1 text-center">
                <Skeleton width={120} height={24} />
              </div>
            </div>
            <Skeleton width={70} height={32} borderRadius={6} />
          </div>
        </header>

        {/* Image Skeleton */}
        <div
          style={{
            position: 'fixed',
            top: `${HEADER_HEIGHT_PX}px`,
            left: 0,
            right: 0,
            height: `${IMAGE_HEIGHT_VH}vh`,
            minHeight: '180px',
            zIndex: 10,
          }}
        >
          <div className="h-full relative">
            <Skeleton height="100%" width="100%" />
            <div className="absolute top-3 left-3">
              <Skeleton width={80} height={24} borderRadius={8} />
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div
          style={{
            position: 'fixed',
            top: CONTENT_TOP_OFFSET,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 5,
          }}
          className="bg-white overflow-hidden"
        >
          <div className="px-4 pt-4 pb-3">
            {/* Title Skeleton */}
            <div className="mb-2">
              <Skeleton height={32} className="mb-2" />
              <Skeleton height={32} width="80%" />
            </div>
            
            {/* Meta info Skeleton */}
            <div className="flex items-center space-x-3 mb-4">
              <Skeleton width={80} height={16} />
              <Skeleton width={4} height={4} circle />
              <Skeleton width={100} height={16} />
            </div>
          </div>
          
          {/* Content Skeleton */}
          <div className="px-4 pb-4">
            <div className="space-y-3">
              <Skeleton height={20} />
              <Skeleton height={20} />
              <Skeleton height={20} width="90%" />
              <Skeleton height={20} />
              <Skeleton height={20} width="85%" />
              <Skeleton height={20} />
              <Skeleton height={20} width="95%" />
            </div>
          </div>
        </div>
      </div>
    </SkeletonTheme>
  );
};

export default MobileArticleSkeleton;