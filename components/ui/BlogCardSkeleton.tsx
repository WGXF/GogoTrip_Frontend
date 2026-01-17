import React from 'react';
import Skeleton from './Skeleton';

interface BlogCardSkeletonProps {
  className?: string;
}

const BlogCardSkeleton: React.FC<BlogCardSkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`bg-white dark:bg-slate-800/60 rounded-3xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700/50 ${className}`}>
      {/* Cover Image Skeleton */}
      <Skeleton 
        variant="rectangular" 
        className="w-full h-48"
      />
      
      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Category Badge */}
        <Skeleton variant="rounded" className="w-20 h-6" />
        
        {/* Title */}
        <div className="space-y-2">
          <Skeleton variant="text" className="w-full h-6" />
          <Skeleton variant="text" className="w-3/4 h-6" />
        </div>
        
        {/* Excerpt */}
        <div className="space-y-2">
          <Skeleton variant="text" className="w-full h-4" />
          <Skeleton variant="text" className="w-5/6 h-4" />
        </div>
        
        {/* Author Row */}
        <div className="flex items-center gap-3 pt-2">
          <Skeleton variant="circular" className="w-10 h-10" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="w-24 h-4" />
            <Skeleton variant="text" className="w-32 h-3" />
          </div>
        </div>
        
        {/* Stats Row */}
        <div className="flex items-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-700/50">
          <Skeleton variant="rounded" className="w-16 h-5" />
          <Skeleton variant="rounded" className="w-16 h-5" />
          <Skeleton variant="rounded" className="w-16 h-5" />
        </div>
      </div>
    </div>
  );
};

export default BlogCardSkeleton;
