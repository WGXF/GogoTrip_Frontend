import React from 'react';
import { Heart, MessageCircle, Eye, User } from 'lucide-react';
import { Blog } from '../../types';

interface BlogCardProps {
  blog: Blog;
  onClick: () => void;
}

const BlogCard: React.FC<BlogCardProps> = ({ blog, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="group cursor-pointer bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 dark:border-slate-700"
    >
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden">
        {blog.coverImage ? (
          <img 
            src={blog.coverImage} 
            alt={blog.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" />
        )}
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 bg-black/50 backdrop-blur-md text-white text-xs font-bold rounded-full uppercase tracking-wider">
            {blog.category}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center">
             {blog.authorAvatar ? (
               <img src={blog.authorAvatar} alt={blog.authorName} className="w-full h-full object-cover" />
             ) : (
               <User className="w-4 h-4 text-slate-500" />
             )}
          </div>
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {blog.authorName}
          </span>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <span className="text-xs text-slate-400">
            {blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString() : 'Draft'}
          </span>
        </div>

        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {blog.title}
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 mb-4">
          {blog.excerpt}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-4 text-slate-400 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              {blog.views}
            </div>
            <div className="flex items-center gap-1.5">
              <Heart className={`w-4 h-4 ${blog.isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
              {blog.likesCount}
            </div>
            <div className="flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4" />
              {blog.commentsCount}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogCard;
