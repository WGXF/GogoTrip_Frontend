import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  Plus, 
  ArrowLeft, 
  Eye, 
  Heart, 
  MessageCircle, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Filter
} from 'lucide-react';
import { Blog, User } from '../../types';
import { API_BASE_URL } from '../../config';
import { useToast } from '../../contexts/ToastContext';
import CreateBlogModal from './CreateBlogModal';

interface StoryStudioProps {
  user: User | null;
  onBack: () => void;
}

const StoryStudio: React.FC<StoryStudioProps> = ({ user, onBack }) => {
  const [myBlogs, setMyBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const toast = useToast();

  useEffect(() => {
    fetchMyBlogs();
  }, []);

  const fetchMyBlogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/blogs/my?status=all`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMyBlogs(data.blogs || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch my blogs:', error);
      toast.error('Failed to load your stories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this story? This action cannot be undone.')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/blogs/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        toast.success('Story deleted successfully');
        setMyBlogs(prev => prev.filter(b => b.id !== id));
      } else {
        toast.error('Failed to delete story');
      }
    } catch (error) {
      toast.error('Failed to delete story');
    }
  };

  const filteredBlogs = myBlogs.filter(blog => {
    const matchesSearch = blog.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || blog.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalViews = myBlogs.reduce((sum, blog) => sum + (blog.views || 0), 0);
  const totalLikes = myBlogs.reduce((sum, blog) => sum + (blog.likesCount || 0), 0);
  const totalComments = myBlogs.reduce((sum, blog) => sum + (blog.commentsCount || 0), 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-slate-500" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Story Studio</h1>
            <p className="text-slate-500">Manage your content and analytics</p>
          </div>
        </div>
        <button 
          onClick={() => { setEditingBlog(null); setShowCreateModal(true); }}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create New
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm font-medium text-slate-500">Total Stories</span>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{myBlogs.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <Eye className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-sm font-medium text-slate-500">Total Views</span>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalViews}</p>
        </div>
        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
              <Heart className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
            <span className="text-sm font-medium text-slate-500">Total Likes</span>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalLikes}</p>
        </div>
        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <MessageCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-sm font-medium text-slate-500">Comments</span>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalComments}</p>
        </div>
      </div>

      {/* Content List */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search your stories..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-left">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Story</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Stats</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">Loading stories...</td>
                </tr>
              ) : filteredBlogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">No stories found</td>
                </tr>
              ) : (
                filteredBlogs.map((blog) => (
                  <tr key={blog.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 overflow-hidden flex-shrink-0">
                          {blog.coverImage ? (
                            <img src={blog.coverImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500" />
                          )}
                        </div>
                        <div className="min-w-0 max-w-xs">
                          <p className="font-bold text-slate-900 dark:text-white truncate">{blog.title}</p>
                          <p className="text-xs text-slate-500 truncate">{blog.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(blog.status)}`}>
                        {blog.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(blog.createdAt || '').toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1" title="Views"><Eye className="w-4 h-4" /> {blog.views}</span>
                        <span className="flex items-center gap-1" title="Likes"><Heart className="w-4 h-4" /> {blog.likesCount}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => { setEditingBlog(blog); setShowCreateModal(true); }}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(blog.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <CreateBlogModal 
          initialData={editingBlog || undefined}
          onClose={() => {
            setShowCreateModal(false);
            setEditingBlog(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingBlog(null);
            fetchMyBlogs();
          }} 
        />
      )}
    </div>
  );
};

export default StoryStudio;
