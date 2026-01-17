import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Share2, Flag, Clock, Trash2, Edit, AlertTriangle, X } from 'lucide-react';
import { Blog, BlogComment, User } from '../../types';
import { API_BASE_URL } from '../../config';
import { useToast } from '../../contexts/ToastContext';
import BlogDetailSkeleton from '../ui/BlogDetailSkeleton';
import CreateBlogModal from './CreateBlogModal';

interface BlogDetailViewProps {
  blogId: number;
  user: User | null;
  onBack: () => void;
}

const BlogDetailView: React.FC<BlogDetailViewProps> = ({ blogId, user, onBack }) => {
  const navigate = useNavigate();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('inappropriate');
  const [reportDescription, setReportDescription] = useState('');
  const toast = useToast();

  useEffect(() => {
    fetchBlogDetails();
  }, [blogId]);

  const fetchBlogDetails = async () => {
    try {
      const blogRes = await fetch(`${API_BASE_URL}/api/blogs/${blogId}`, { credentials: 'include' });
      
      if (blogRes.ok) {
        const data = await blogRes.json();
        if (data.success && data.blog) {
          setBlog(data.blog);
        }
      }

      const commentsRes = await fetch(`${API_BASE_URL}/api/blogs/${blogId}/comments`, { credentials: 'include' });
      if (commentsRes.ok) {
        const data = await commentsRes.json();
        if (data.success && data.comments) {
          setComments(data.comments);
        }
      }
    } catch (error) {
      console.error('Error fetching blog details:', error);
      toast.error('Failed to load story details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleReportSubmit = async () => {
    if (!blog) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/blogs/${blogId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: reportReason, description: reportDescription })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Report submitted successfully');
        setShowReportModal(false);
        setReportDescription('');
        setReportReason('inappropriate');
      } else {
        toast.error(data.error || 'Failed to submit report');
      }
    } catch (error) {
      toast.error('Failed to submit report');
    }
  };

  const handleShare = async () => {
    if (!blog) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: blog.title,
          text: blog.excerpt,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleDelete = async () => {
    if (!blog || !window.confirm('Are you sure you want to delete this story?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/blogs/${blogId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        toast.success('Story deleted successfully');
        onBack(); // Go back to list
      } else {
        toast.error('Failed to delete story');
      }
    } catch (error) {
      console.error('Error deleting blog:', error);
      toast.error('Failed to delete story');
    }
  };

  const handleLike = async () => {
    if (!blog) return;
    const wasLiked = blog.isLiked;
    try {
      // Optimistic update
      setBlog(prev => prev ? { ...prev, isLiked: !prev.isLiked, likesCount: prev.isLiked ? prev.likesCount - 1 : prev.likesCount + 1 } : null);
      await fetch(`${API_BASE_URL}/api/blogs/${blogId}/like`, { method: 'POST', credentials: 'include' });
      toast.success(wasLiked ? 'Removed from favorites' : 'Added to favorites');
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert optimistic update
      setBlog(prev => prev ? { ...prev, isLiked: wasLiked, likesCount: wasLiked ? prev.likesCount + 1 : prev.likesCount - 1 } : null);
      toast.error('Failed to update. Please try again.');
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/blogs/${blogId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: newComment })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.comment) {
          setComments(prev => [data.comment, ...prev]);
          setNewComment('');
          setBlog(prev => prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : null);
          toast.success('Comment posted!');
        }
      } else {
        toast.error('Failed to post comment');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFollow = async () => {
    if (!blog) return;
    const wasFollowing = isFollowing;
    try {
      setIsFollowing(prev => !prev);
      await fetch(`${API_BASE_URL}/api/blogs/authors/${blog.authorId}/subscribe`, {
        method: 'POST',
        credentials: 'include'
      });
      toast.success(wasFollowing ? `Unfollowed ${blog.authorName}` : `Now following ${blog.authorName}`);
    } catch (error) {
      console.error('Error toggling follow:', error);
      setIsFollowing(prev => !prev);
      toast.error('Failed to update subscription');
    }
  };

  if (isLoading) return <BlogDetailSkeleton />;
  if (!blog) return <div className="p-8 text-center text-slate-500">Story not found</div>;

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-fade-in-up">
      {/* Navigation */}
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
        <ArrowLeft className="w-5 h-5" />
        <span className="font-bold">Back to Feed</span>
      </button>

      {/* Article Header */}
      <div className="mb-8">
        <div className="flex gap-2 mb-4">
           <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold uppercase tracking-wide">
             {blog.category}
           </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
          {blog.title}
        </h1>
        
        <div className="flex items-center justify-between py-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
               {blog.authorAvatar && <img src={blog.authorAvatar} alt={blog.authorName} className="w-full h-full object-cover" />}
             </div>
             <div>
               <div className="flex items-center gap-2">
                 <h3 className="font-bold text-slate-900 dark:text-white">{blog.authorName}</h3>
                 <button 
                      onClick={handleFollow}
                      className={`text-xs font-bold hover:underline ${isFollowing ? 'text-slate-500' : 'text-indigo-600 dark:text-indigo-400'}`}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
               </div>
               <div className="flex items-center gap-2 text-slate-500 text-sm">
                 <span>{new Date(blog.publishedAt || '').toLocaleDateString()}</span>
                 <span>•</span>
                 <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 5 min read</span>
               </div>
             </div>
          </div>
          
          <div className="flex items-center gap-2">
            {user && blog.authorId === user.id && (
              <>
                <button 
                  onClick={handleEdit}
                  className="p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-full transition-colors"
                  title="Edit Story"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleDelete}
                  className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"
                  title="Delete Story"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </>
            )}
            <button  
              onClick={handleShare}
              className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowReportModal(true)}
              className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <Flag className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Cover Image */}
      {blog.coverImage && (
        <div className="rounded-3xl overflow-hidden mb-10 shadow-lg">
          <img src={blog.coverImage} alt={blog.title} className="w-full h-auto object-cover" />
        </div>
      )}

      {/* Content */}
      <div 
        className="prose prose-lg dark:prose-invert max-w-none mb-12 text-slate-600 dark:text-slate-300"
        dangerouslySetInnerHTML={{ __html: blog.content }}
      />

      {/* Engagement Bar */}
      <div className="flex items-center justify-between py-6 border-t border-b border-slate-100 dark:border-slate-800 mb-12">
        <div className="flex gap-6">
           <button 
             onClick={handleLike}
             className={`flex items-center gap-2 font-bold transition-colors ${
               blog.isLiked ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'
             }`}
           >
             <Heart className={`w-6 h-6 ${blog.isLiked ? 'fill-current' : ''}`} />
             {blog.likesCount}
           </button>
           <div className="flex items-center gap-2 text-slate-500 font-bold">
             <MessageCircle className="w-6 h-6" />
             {blog.commentsCount}
           </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="space-y-8">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Comments ({comments.length})</h3>
        
        {/* Comment Input */}
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0">
             {user?.avatarUrl && <img src={user.avatarUrl} alt="Me" className="w-full h-full object-cover" />}
          </div>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts..."
              className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl p-4 border-none focus:ring-2 focus:ring-indigo-500 min-h-[100px] resize-none"
            />
            <div className="flex justify-end mt-2">
              <button 
                onClick={handlePostComment}
                disabled={!newComment.trim() || isSubmitting}
                className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-colors disabled:opacity-50"
              >
                Post Comment
              </button>
            </div>
          </div>
        </div>

        {/* Comment List */}
        <div className="space-y-6">
           {comments.map(comment => (
             <div key={comment.id} className="flex gap-4">
               <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0">
                 {comment.userAvatar && <img src={comment.userAvatar} alt={comment.userName} className="w-full h-full object-cover" />}
               </div>
               <div className="flex-1">
                 <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl rounded-tl-none">
                   <div className="flex items-center justify-between mb-2">
                     <h4 className="font-bold text-slate-900 dark:text-white">{comment.userName}</h4>
                     <span className="text-xs text-slate-400">{new Date(comment.createdAt || '').toLocaleDateString()}</span>
                   </div>
                   <p className="text-slate-600 dark:text-slate-300">{comment.content}</p>
                 </div>
                 <div className="flex gap-4 mt-2 pl-4">
                   <button className="text-xs font-bold text-slate-500 hover:text-indigo-600">Reply</button>
                   <button className="text-xs font-bold text-slate-500 hover:text-indigo-600">Like</button>
                 </div>
               </div>
             </div>
           ))}
        </div>
      </div>

      {showEditModal && blog && (
        <CreateBlogModal 
          initialData={blog}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            fetchBlogDetails();
          }}
        />
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl p-6 animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Report Story
              </h3>
              <button onClick={() => setShowReportModal(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reason</label>
                <select 
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="spam">Spam</option>
                  <option value="inappropriate">Inappropriate Content</option>
                  <option value="harassment">Harassment</option>
                  <option value="misinformation">Misinformation</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description (Optional)</label>
                <textarea 
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white min-h-[100px] focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Please provide more details..."
                />
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleReportSubmit}
                  className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20"
                >
                  Submit Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogDetailView;
