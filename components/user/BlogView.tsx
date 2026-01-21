import React, { useState, useEffect } from 'react';
import { Search, Plus, BookOpen, LayoutDashboard } from 'lucide-react';
import { Blog, User } from '../../types';
import { API_BASE_URL } from '../../config';
import { useToast } from '../../contexts/ToastContext';
import BlogCard from './BlogCard';
import BlogDetailView from './BlogDetailView';
import CreateBlogModal from './CreateBlogModal';
import BlogCardSkeleton from '../ui/BlogCardSkeleton';
import StoryStudio from './StoryStudio';

interface BlogViewProps {
  user: User | null;
}

const BlogView: React.FC<BlogViewProps> = ({ user }) => {
  const [viewState, setViewState] = useState<'list' | 'detail' | 'studio'>('list');
  const [selectedBlogId, setSelectedBlogId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const toast = useToast();

  const categories = ['All', 'Travel', 'Food', 'Tips', 'Experience'];

  useEffect(() => {
    fetchBlogs();
  }, [activeCategory, searchQuery]);

  const fetchBlogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory !== 'All') {
        params.append('category', activeCategory);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      const url = `${API_BASE_URL}/api/blogs/feed${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setBlogs(data.blogs || []);
        } else {
          setBlogs([]);
        }
      } else {
        setBlogs([]);
      }
    } catch (error) {
      console.error('Failed to fetch blogs:', error);
      setBlogs([]);
      toast.error('Failed to load stories. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlogClick = (id: number) => {
    setSelectedBlogId(id);
    setViewState('detail');
  };

  if (viewState === 'studio') {
    return <StoryStudio user={user} onBack={() => setViewState('list')} />;
  }

  if (viewState === 'detail' && selectedBlogId) {
    return (
      <BlogDetailView 
        blogId={selectedBlogId} 
        user={user}
        onBack={() => {
          setViewState('list');
          setSelectedBlogId(null);
        }} 
      />
    );
  }

  return (
    <div className="p-6 md:p-8 w-full mx-auto space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
             <BookOpen className="w-10 h-10 text-indigo-500" />
             Travel Stories
          </h2>
          <p className="text-lg font-medium text-slate-500 dark:text-slate-400 mt-2">
            Discover and share adventures from around the world.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setViewState('studio')}
            className="px-5 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-white rounded-2xl font-bold shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all flex items-center gap-2"
          >
            <LayoutDashboard className="w-5 h-5" />
            My Studio
          </button>
          
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Write Story
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-800/50 p-2 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
         <div className="flex gap-1 overflow-x-auto w-full lg:w-auto p-1 no-scrollbar">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                  activeCategory === category 
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md' 
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {category}
              </button>
            ))}
         </div>

         <div className="relative w-full lg:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Search stories, authors, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchBlogs()}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl pl-12 pr-4 py-3 font-medium focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white"
            />
         </div>
      </div>

      {/* Blog Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <BlogCardSkeleton key={i} />
          ))}
        </div>
      ) : blogs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((blog, idx) => (
            <div key={blog.id} style={{ animationDelay: `${idx * 50}ms` }} className="animate-fade-in-up">
              <BlogCard blog={blog} onClick={() => handleBlogClick(blog.id)} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
          <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No stories found</h3>
          <p className="text-slate-500">Be the first to share your adventure in this category!</p>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateBlogModal 
          onClose={() => setShowCreateModal(false)} 
          onSuccess={() => {
            setShowCreateModal(false);
            fetchBlogs();
            toast.success('Your story has been submitted for review!');
          }} 
        />
      )}
    </div>
  );
};

export default BlogView;
