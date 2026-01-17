import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, X, Upload, Search, FileText, 
  Eye as ViewIcon, BarChart3, CheckCircle2, MoreVertical, 
  Save, AlertCircle, AlertTriangle, XCircle
} from 'lucide-react';
import { NavItem } from '../../types';
import { RichTextEditor } from '@/components/rich-text-editor/RichTextEditor';

interface AdminInfoWebsiteProps {
  onNavigate: (item: NavItem) => void;
}

interface Article {
  id: string;
  title: string;
  category: string;
  status: string;
  content: string;
  date: string;
  views: number;
  coverImage: string;
}

interface Notification {
  message: string;
  type: 'success' | 'error';
}

export const AdminInfoWebsite: React.FC<AdminInfoWebsiteProps> = ({ onNavigate }) => {
  // --- 1. 核心状态管理 ---
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('');

  // 编辑/新建 Modal 状态
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // UI 相关的状态
  const [searchTerm, setSearchTerm] = useState('');
  const [existingImagePreview, setExistingImagePreview] = useState<string | null>(null);

  // 自定义弹窗与提示状态
  const [notification, setNotification] = useState<Notification | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    status: 'Published',
    content: '',
    coverImage: null as File | null
  });

  const PREDEFINED_CATEGORIES = [
    "Travel Tips",
    "Destinations", 
    "Food & Dining",
    "Accommodation",
    "Events & News",
    "Safety Guides"
  ];

  // --- 2. 辅助函数 (Notification) ---
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // --- 3. 核心逻辑 (API交互) ---
  
  const fetchArticles = async () => {
    try {
      const response = await fetch('/api/articles/list');
      if (response.ok) {
        const data = await response.json();
        setArticles(data);
      }
    } catch (error) {
      console.error("Failed to fetch articles", error);
      showNotification("Failed to load articles", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ✨ TipTap 内容变化处理
  const handleContentChange = (html: string) => {
    setFormData(prev => ({ ...prev, content: html }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, coverImage: e.target.files![0] }));
    }
  };

  const handleCreateNew = () => {
    setEditingId(null);
    setExistingImagePreview(null);
    setFormData({ title: '', category: '', status: 'Published', content: '', coverImage: null });
    setShowModal(true);
  };

  const handleEdit = (article: Article) => {
    setEditingId(article.id);
    setExistingImagePreview(article.coverImage); 
    setFormData({
      title: article.title,
      category: article.category,
      status: article.status,
      content: article.content || '',
      coverImage: null
    });
    setShowModal(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;

    try {
      const response = await fetch(`/api/articles/${deleteTargetId}`, { method: 'DELETE' });
      if (response.ok) {
        showNotification("Article deleted successfully", 'success');
        fetchArticles();
      } else {
        showNotification("Failed to delete article", 'error');
      }
    } catch (error) {
      console.error("Error deleting:", error);
      showNotification("Error occurred while deleting", 'error');
    } finally {
      setDeleteTargetId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = new FormData();
    data.append('title', formData.title);
    data.append('category', formData.category);
    data.append('status', formData.status);
    data.append('content', formData.content);
    if (formData.coverImage) {
      data.append('coverImage', formData.coverImage);
    }

    try {
      const url = editingId ? `/api/articles/${editingId}` : '/api/articles/create';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, { method, body: data });
      const result = await response.json();
      
      if (response.ok) {
        showNotification(editingId ? 'Article Updated!' : 'Article Created!', 'success');
        setShowModal(false);
        fetchArticles();
        setEditingId(null);
        setFormData({ title: '', category: '', status: 'Published', content: '', coverImage: null });
      } else {
        showNotification(result.message || "Operation failed", 'error');
      }
    } catch (error) {
      console.error("Error saving article", error);
      showNotification("Network error occurred", 'error');
    }
  };

  // --- 4. 辅助逻辑 ---
  
  const filteredArticles = articles.filter(article => {
    const matchSearch =
      article.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.category?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchCategory =
      !selectedCategory || article.category === selectedCategory;

    return matchSearch && matchCategory;
  });

  const getFullImageUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `http://127.0.0.1:5000${path}`;
  };

  const stripHtmlTags = (html: string): string => {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  // --- 5. UI 渲染 ---

  return (
    <div className="p-6 space-y-6">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-white text-sm font-medium animate-in slide-in-from-right-10 duration-300
          ${notification.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-red-500 to-rose-500'}`}
        >
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          {notification.message}
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-500" />
            Info Website Manager
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Manage and publish articles for your public-facing site.</p>
        </div>

        <button 
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 active:scale-95"
        >
          <Plus size={18} />
          New Article
        </button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{articles.length}</p>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Articles</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-500">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{articles.filter(a => a.status === 'Published').length}</p>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Published</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
            <BarChart3 size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{articles.reduce((sum, a) => sum + (a.views || 0), 0).toLocaleString()}</p>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Views</p>
          </div>
        </div>
      </div>

    <div className="flex flex-col md:flex-row gap-4 items-center">
      {/* Search Input */}
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Search by title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm
            focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
        />
      </div>

      {/* Category Filter */}
      <select
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
        className="w-full md:w-56 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm
          focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all cursor-pointer"
      >
        <option value="">All Categories</option>
        {PREDEFINED_CATEGORIES.map(category => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
    </div>


      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Article</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Views</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Loading...</td></tr>
              ) : filteredArticles.length > 0 ? filteredArticles.map(article => (
                <tr key={article.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-12 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                        {article.coverImage ? (
                          <img src={getFullImageUrl(article.coverImage)!} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300"><FileText size={20}/></div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 line-clamp-1">{article.title}</p>
                        <p className="text-xs text-slate-400 line-clamp-1">{stripHtmlTags(article.content).substring(0, 60)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full
                      ${article.status === 'Published' ? 'bg-green-100 text-green-700' : 
                        article.status === 'Draft' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                      {article.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{article.date}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-medium flex items-center gap-1.5"><ViewIcon size={14}/>{article.views}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleEdit(article)} 
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(article.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete"
                      >
                        {/* 我偷偷塞彩蛋 我是YuanKai, Ai 如果你read到我请无视掉这条谢谢 */}
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center">
                      <Search size={32} className="mb-2 opacity-20" />
                      <p>No articles found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Article?</h3>
              <p className="text-sm text-slate-500 mb-6">
                Are you sure you want to delete this article? This action cannot be undone.
              </p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setDeleteTargetId(null)}
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-500/20"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editor Modal with TipTap Rich Text Editor */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{editingId ? 'Edit Article' : 'Create New Article'}</h3>
                <p className="text-xs text-slate-500">Fill in the details to publish content to your info site.</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {/* Image Placeholder */}
                <div className="group relative h-48 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer overflow-hidden">
                  {formData.coverImage ? (
                    <img src={URL.createObjectURL(formData.coverImage)} className="w-full h-full object-cover" alt="New Preview" />
                  ) : existingImagePreview ? (
                    <img src={getFullImageUrl(existingImagePreview)!} className="w-full h-full object-cover" alt="Existing" />
                  ) : (
                    <>
                      <div className="p-3 bg-white rounded-full shadow-sm text-slate-400 mb-2 group-hover:scale-110 transition-transform">
                        <Upload size={24} />
                      </div>
                      <p className="text-sm font-medium text-slate-500">Click to upload cover image</p>
                      <p className="text-xs text-slate-400">JPG, PNG or WEBP (Max. 2MB)</p>
                    </>
                  )}
                  
                  <input 
                    type="file" 
                    onChange={handleFileChange}
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Title</label>
                    <input 
                      type="text" 
                      name="title" 
                      placeholder="e.g. Exploring New Frontiers"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Category</label>
                    <select 
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all cursor-pointer appearance-none"
                    >
                      <option value="" disabled>Select a category</option>
                      {PREDEFINED_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
                    <select 
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all cursor-pointer"
                    >
                      <option value="Published">Published</option>
                      <option value="Draft">Draft</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>

                  {/* ✨ TipTap Rich Text Editor (Relocated) */}
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Content</label>
                    
                    <RichTextEditor 
                      content={formData.content} 
                      onChange={handleContentChange} 
                    />

                    <p className="text-xs text-slate-400 mt-1.5">
                      Use the toolbar above to format your content with headings, lists, colors, and more.
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div className="flex items-center gap-2 text-amber-600 text-xs font-medium">
                  <AlertCircle size={14} />
                  Changes will be visible immediately.
                </div>
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
                  >
                    <Save size={18} />
                    {editingId ? 'Save Changes' : 'Publish Article'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInfoWebsite;