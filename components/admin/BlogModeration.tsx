import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Check,
  X,
  Eye,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  EyeOff,
  Loader2
} from 'lucide-react';
import { Blog, BlogStats, BlogPagination } from '../../types';
import { API_BASE_URL } from '../../config';

interface BlogModerationProps {
  onNavigate?: (nav: string) => void;
}

const BlogModeration: React.FC<BlogModerationProps> = ({ onNavigate }) => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [stats, setStats] = useState<BlogStats | null>(null);
  const [pagination, setPagination] = useState<BlogPagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [blogToReject, setBlogToReject] = useState<number | null>(null);

  useEffect(() => {
    fetchBlogs();
  }, [statusFilter, currentPage]);

  const fetchBlogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '20'
      });
      
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const res = await fetch(`${API_BASE_URL}/api/blogs/admin/all?${params}`, {
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setBlogs(data.blogs || []);
          setStats(data.stats || null);
          setPagination(data.pagination || null);
        }
      }
    } catch (error) {
      console.error('Failed to fetch blogs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (blogId: number) => {
    setActionLoading(blogId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/blogs/admin/${blogId}/approve`, {
        method: 'POST',
        credentials: 'include'
      });

      if (res.ok) {
        fetchBlogs();
      }
    } catch (error) {
      console.error('Failed to approve blog:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!blogToReject) return;
    
    setActionLoading(blogToReject);
    try {
      const res = await fetch(`${API_BASE_URL}/api/blogs/admin/${blogToReject}/reject`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason || 'Content does not meet community guidelines' })
      });

      if (res.ok) {
        setShowRejectModal(false);
        setBlogToReject(null);
        setRejectReason('');
        fetchBlogs();
      }
    } catch (error) {
      console.error('Failed to reject blog:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleHide = async (blogId: number) => {
    setActionLoading(blogId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/blogs/admin/${blogId}/hide`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Hidden by admin' })
      });

      if (res.ok) {
        fetchBlogs();
      }
    } catch (error) {
      console.error('Failed to hide blog:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; icon: React.ReactNode; text: string }> = {
      draft: { color: 'bg-slate-100 text-slate-600', icon: <Clock className="w-3 h-3" />, text: 'Draft' },
      pending: { color: 'bg-yellow-100 text-yellow-700', icon: <AlertCircle className="w-3 h-3" />, text: 'Pending Review' },
      published: { color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-3 h-3" />, text: 'Published' },
      rejected: { color: 'bg-red-100 text-red-700', icon: <XCircle className="w-3 h-3" />, text: 'Rejected' },
      hidden: { color: 'bg-orange-100 text-orange-700', icon: <EyeOff className="w-3 h-3" />, text: 'Hidden' }
    };

    const badge = badges[status] || badges.draft;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.icon}
        {badge.text}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <FileText className="w-7 h-7 text-blue-600" />
            Blog Moderation
          </h1>
          <p className="text-slate-500 mt-1">Review and manage user blog posts</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
            <div className="text-sm text-slate-500">Total Blogs</div>
          </div>
          <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-100">
            <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
            <div className="text-sm text-yellow-600">Pending Review</div>
          </div>
          <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
            <div className="text-2xl font-bold text-green-700">{stats.published}</div>
            <div className="text-sm text-green-600">Published</div>
          </div>
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div className="text-2xl font-bold text-slate-700">{stats.draft}</div>
            <div className="text-sm text-slate-500">Drafts</div>
          </div>
          <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
            <div className="text-2xl font-bold text-red-700">{stats.rejected}</div>
            <div className="text-sm text-red-600">Rejected</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search blogs by title or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchBlogs()}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending Review</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="rejected">Rejected</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>
        </div>
      </div>

      {/* Blog List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No blogs found</h3>
            <p className="text-slate-500 mt-1">Adjust your filters or check back later</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {blogs.map((blog) => (
              <div
                key={blog.id}
                className="p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Cover Image */}
                  <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
                    {blog.coverImage ? (
                      <img
                        src={blog.coverImage}
                        alt={blog.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-slate-900 line-clamp-1">
                          {blog.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {blog.authorName}
                          </span>
                          <span>{blog.createdAt}</span>
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">
                            {blog.category}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                          {blog.excerpt}
                        </p>
                      </div>
                      {getStatusBadge(blog.status)}
                    </div>

                    {/* Stats & Actions */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span>{blog.views} views</span>
                        <span>{blog.likesCount} likes</span>
                        <span>{blog.commentsCount} comments</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedBlog(blog)}
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {(blog.status === 'pending' || blog.status === 'draft') && (
                          <>
                            <button
                              onClick={() => handleApprove(blog.id)}
                              disabled={actionLoading === blog.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === blog.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                              {blog.status === 'draft' ? 'Publish' : 'Approve'}
                            </button>
                            <button
                              onClick={() => {
                                setBlogToReject(blog.id);
                                setShowRejectModal(true);
                              }}
                              disabled={actionLoading === blog.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                              <X className="w-4 h-4" />
                              Reject
                            </button>
                          </>
                        )}

                        {blog.status === 'published' && (
                          <button
                            onClick={() => handleHide(blog.id)}
                            disabled={actionLoading === blog.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === blog.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                            Hide
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <div className="text-sm text-slate-500">
              Showing page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.hasPrev}
                className="p-2 rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={!pagination.hasNext}
                className="p-2 rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Blog Detail Modal */}
      {selectedBlog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Blog Details</h2>
              <button
                onClick={() => setSelectedBlog(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {selectedBlog.coverImage && (
                <img
                  src={selectedBlog.coverImage}
                  alt={selectedBlog.title}
                  className="w-full h-64 object-cover rounded-xl mb-6"
                />
              )}

              <div className="flex items-center gap-3 mb-4">
                {getStatusBadge(selectedBlog.status)}
                <span className="px-2.5 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-600">
                  {selectedBlog.category}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-slate-900 mb-4">
                {selectedBlog.title}
              </h1>

              <div className="flex items-center gap-4 mb-6 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {selectedBlog.authorName}
                </span>
                <span>{selectedBlog.createdAt}</span>
              </div>

              <div 
                className="prose prose-slate max-w-none"
                dangerouslySetInnerHTML={{ __html: selectedBlog.content }}
              />

              {selectedBlog.rejectionReason && (
                <div className="mt-6 p-4 bg-red-50 rounded-xl border border-red-100">
                  <h4 className="font-medium text-red-700 mb-1">Rejection Reason</h4>
                  <p className="text-red-600 text-sm">{selectedBlog.rejectionReason}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
              {(selectedBlog.status === 'pending' || selectedBlog.status === 'draft') && (
                <>
                  <button
                    onClick={() => {
                      handleApprove(selectedBlog.id);
                      setSelectedBlog(null);
                    }}
                    className="px-4 py-2 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors"
                  >
                    {selectedBlog.status === 'draft' ? 'Publish' : 'Approve & Publish'}
                  </button>
                  <button
                    onClick={() => {
                      setBlogToReject(selectedBlog.id);
                      setShowRejectModal(true);
                      setSelectedBlog(null);
                    }}
                    className="px-4 py-2 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
                  >
                    Reject
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedBlog(null)}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Reject Blog</h2>
            </div>

            <div className="p-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Reason for rejection (optional)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Content does not meet community guidelines..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all resize-none"
                rows={4}
              />
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setBlogToReject(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading !== null}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Reject Blog'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogModeration;
