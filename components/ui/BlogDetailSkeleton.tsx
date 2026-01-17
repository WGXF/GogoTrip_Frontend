import React from 'react';
import Skeleton from './Skeleton';

interface BlogDetailSkeletonProps {
  className?: string;
}

const BlogDetailSkeleton: React.FC<BlogDetailSkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`max-w-4xl mx-auto p-6 md:p-8 space-y-8 ${className}`}>
      {/* Back Button */}
      <Skeleton variant="rounded" className="w-24 h-10" />
      
      {/* Cover Image */}
      <Skeleton variant="rounded" className="w-full h-64 md:h-96" />
      
      {/* Category & Date */}
      <div className="flex items-center gap-4">
        <Skeleton variant="rounded" className="w-20 h-6" />
        <Skeleton variant="text" className="w-32 h-4" />
      </div>
      
      {/* Title */}
      <div className="space-y-3">
        <Skeleton variant="text" className="w-full h-10" />
        <Skeleton variant="text" className="w-3/4 h-10" />
      </div>
      
      {/* Author Card */}
      <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
        <Skeleton variant="circular" className="w-14 h-14" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-32 h-5" />
          <Skeleton variant="text" className="w-48 h-4" />
        </div>
        <Skeleton variant="rounded" className="w-24 h-10" />
      </div>
      
      {/* Content */}
      <div className="space-y-4">
        <Skeleton variant="text" className="w-full h-5" />
        <Skeleton variant="text" className="w-full h-5" />
        <Skeleton variant="text" className="w-11/12 h-5" />
        <Skeleton variant="text" className="w-full h-5" />
        <Skeleton variant="text" className="w-4/5 h-5" />
        
        <div className="py-4" />
        
        <Skeleton variant="text" className="w-full h-5" />
        <Skeleton variant="text" className="w-full h-5" />
        <Skeleton variant="text" className="w-3/4 h-5" />
        
        <div className="py-4" />
        
        <Skeleton variant="text" className="w-full h-5" />
        <Skeleton variant="text" className="w-5/6 h-5" />
        <Skeleton variant="text" className="w-full h-5" />
        <Skeleton variant="text" className="w-2/3 h-5" />
      </div>
      
      {/* Action Buttons */}
      <div className="flex items-center gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
        <Skeleton variant="rounded" className="w-24 h-10" />
        <Skeleton variant="rounded" className="w-24 h-10" />
        <Skeleton variant="rounded" className="w-24 h-10" />
      </div>
      
      {/* Comments Section */}
      <div className="space-y-6 pt-8">
        <Skeleton variant="text" className="w-40 h-8" />
        
        {/* Comment Input */}
        <Skeleton variant="rounded" className="w-full h-24" />
        
        {/* Comment List */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
            <Skeleton variant="circular" className="w-10 h-10 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton variant="text" className="w-24 h-4" />
                <Skeleton variant="text" className="w-20 h-3" />
              </div>
              <Skeleton variant="text" className="w-full h-4" />
              <Skeleton variant="text" className="w-4/5 h-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlogDetailSkeleton;
