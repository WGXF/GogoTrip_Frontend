import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../../config';
import { useToast } from '../../contexts/ToastContext';
import { RichTextEditor } from '../rich-text-editor/RichTextEditor';
import ImageUpload from './ImageUpload';
import { Blog } from '../../types';

interface CreateBlogModalProps {
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Blog;
}

const CreateBlogModal: React.FC<CreateBlogModalProps> = ({ onClose, onSuccess, initialData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    content: initialData?.content || '',
    category: initialData?.category || '',
    tags: initialData?.tags?.join(', ') || '',
    coverImage: initialData?.coverImage || ''
  });

  const categories = ['Travel', 'Food', 'Tips', 'Experience', 'Culture', 'Gear'];

  const handleSubmit = async (e: React.FormEvent, status: 'pending' | 'draft') => {
    e.preventDefault();

    // Validate content is not empty (check for actual text content, not just HTML tags)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = formData.content;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    const hasContent = plainText.trim().length > 0;

    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!hasContent) {
      toast.error('Please enter some content for your story');
      return;
    }

    setIsLoading(true);

    try {
      // Generate plain text excerpt from content
      const excerpt = plainText.slice(0, 150) + (plainText.length > 150 ? '...' : '');

      const url = initialData 
        ? `${API_BASE_URL}/api/blogs/${initialData.id}`
        : `${API_BASE_URL}/api/blogs/create`;
      
      const method = initialData ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          excerpt,
          status,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
        })
      });

      if (res.ok) {
        toast.success(initialData ? 'Story updated successfully!' : (status === 'draft' ? 'Draft saved successfully!' : 'Story submitted for review!'));
        onSuccess();
      } else {
        toast.error(initialData ? 'Failed to update story.' : 'Failed to save story. Please try again.');
      }
    } catch (error) {
      console.error(initialData ? 'Failed to update blog:' : 'Failed to create blog:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {initialData ? 'Edit Story' : 'Write a Story'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-3xl mx-auto space-y-8">
            {/* Cover Image Upload */}
            <ImageUpload
              value={formData.coverImage}
              onChange={(url) => setFormData({...formData, coverImage: url})}
            />

            {/* Title */}
            <input
              type="text"
              placeholder="Article Title..."
              className="w-full text-4xl font-bold bg-transparent border-none placeholder:text-slate-300 dark:placeholder:text-slate-700 focus:ring-0 px-0 text-slate-900 dark:text-white"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />

            {/* Category & Tags */}
            <div className="flex gap-4">
              <select
                className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                <option value="">Select Category</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input 
                type="text"
                placeholder="Tags (comma separated)..."
                className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                value={formData.tags}
                onChange={e => setFormData({...formData, tags: e.target.value})}
              />
            </div>

            {/* Rich Text Editor */}
            <RichTextEditor
              key={initialData?.id || 'new'}
              content={formData.content}
              onChange={(content) => setFormData({...formData, content})}
              placeholder="Tell your story..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-white dark:bg-slate-900">
           <button
             onClick={(e) => handleSubmit(e, 'draft')}
             disabled={isLoading}
             className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
           >
             {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save as Draft'}
           </button>
           <button
             onClick={(e) => handleSubmit(e, 'pending')}
             disabled={isLoading}
             className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
           >
             {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (initialData ? 'Save Changes' : 'Submit for Review')}
           </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CreateBlogModal;
