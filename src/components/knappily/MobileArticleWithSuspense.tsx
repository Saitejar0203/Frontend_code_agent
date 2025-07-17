import React, { Suspense, lazy } from 'react';
import MobileArticleSkeleton from './MobileArticleSkeleton';

// Lazy load the main mobile article view for code splitting
const LazyMobileArticleView = lazy(() => import('./MobileArticleView'));

interface MobileArticleWithSuspenseProps {
  [key: string]: any; // Pass through all props to the lazy component
}

const MobileArticleWithSuspense: React.FC<MobileArticleWithSuspenseProps> = (props) => {
  return (
    <Suspense fallback={<MobileArticleSkeleton />}>
      <LazyMobileArticleView {...props} />
    </Suspense>
  );
};

export default MobileArticleWithSuspense;