import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, ExternalLink, Eye, MousePointerClick, 
  TrendingUp, Pause, Play, X, CheckCircle, AlertTriangle, AlertCircle 
} from 'lucide-react';
import { API_BASE_URL } from '../../config';

interface Advertisement {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  link: string;
  status: 'active' | 'paused' | 'expired';
  priority: number;
  views: number;
  clicks: number;
  ctr: number;
  createdAt: string;
  updatedAt: string;
}

// Toast type definition
interface Notification {
  type: 'success' | 'error';
  message: string;
}

export const AdvertisementManagement: React.FC = () => {
  // --- Core data state ---
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- Modal & Form state ---
  const [showModal, setShowModal] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link: '',
    status: 'active',
    priority: 1
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  // --- New: UI interaction state ---
  const [notification, setNotification] = useState<Notification | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  useEffect(() => {
    fetchAds();
  }, []);

  // --- Helper function: Show notification ---
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000); // Auto-dismiss after 3 seconds
  };

  const fetchAds = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/advertisements/list`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setAds(data);
      }
    } catch (error) {
      console.error('Error fetching advertisements:', error);
      showNotification('error', 'Failed to fetch advertisements');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('link', formData.link);
    formDataToSend.append('status', formData.status);
    formDataToSend.append('priority', formData.priority.toString());
    
    if (imageFile) {
      formDataToSend.append('image', imageFile);
    }

    try {
      const url = editingAd 
        ? `${API_BASE_URL}/api/advertisements/${editingAd.id}`
        : `${API_BASE_URL}/api/advertisements/create`;
      
      const response = await fetch(url, {
        method: editingAd ? 'PUT' : 'POST',
        credentials: 'include',
        body: formDataToSend
      });

      if (response.ok) {
        showNotification('success', editingAd ? 'Advertisement updated successfully!' : 'Advertisement created successfully!');
        await fetchAds();
        handleCloseModal();
      } else {
        showNotification('error', 'Failed to save advertisement.');
      }
    } catch (error) {
      console.error('Error saving advertisement:', error);
      showNotification('error', 'Network error occurred.');
    }
  };

  // --- 修改：点击删除只触发弹窗 ---
  const handleDeleteClick = (id: number) => {
    setDeleteTargetId(id);
  };

  // --- 新增：确认删除逻辑 ---
  const confirmDelete = async () => {
    if (!deleteTargetId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/advertisements/${deleteTargetId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        showNotification('success', 'Advertisement deleted successfully');
        await fetchAds();
      } else {
        showNotification('error', 'Failed to delete advertisement');
      }
    } catch (error) {
      console.error('Error deleting advertisement:', error);
      showNotification('error', 'Error occurred while deleting');
    } finally {
      setDeleteTargetId(null); // 关闭弹窗
    }
  };

  const handleEdit = (ad: Advertisement) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      description: ad.description,
      link: ad.link,
      status: ad.status,
      priority: ad.priority
    });
    setImagePreview(ad.imageUrl ? `${API_BASE_URL}${ad.imageUrl}` : '');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAd(null);
    setFormData({
      title: '',
      description: '',
      link: '',
      status: 'active',
      priority: 0
    });
    setImageFile(null);
    setImagePreview('');
  };

  const toggleStatus = async (ad: Advertisement) => {
    const newStatus = ad.status === 'active' ? 'paused' : 'active';
    
    const formDataToSend = new FormData();
    formDataToSend.append('title', ad.title);
    formDataToSend.append('description', ad.description);
    formDataToSend.append('link', ad.link);
    formDataToSend.append('status', newStatus);
    formDataToSend.append('priority', ad.priority.toString());

    try {
      const response = await fetch(`${API_BASE_URL}/api/advertisements/${ad.id}`, {
        method: 'PUT',
        credentials: 'include',
        body: formDataToSend
      });

      if (response.ok) {
        showNotification('success', `Advertisement ${newStatus === 'active' ? 'activated' : 'paused'}`);
        await fetchAds();
      } else {
        showNotification('error', 'Failed to update status');
      }
    } catch (error) {
      console.error('Error toggling advertisement status:', error);
      showNotification('error', 'Network error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* --- 全局 Toast 通知 --- */}
      {notification && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border animate-in slide-in-from-top-4 duration-300 ${
          notification.type === 'success' 
            ? 'bg-white border-green-100 text-green-800' 
            : 'bg-white border-red-100 text-red-800'
        }`}>
          <div className={`p-1 rounded-full ${notification.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          </div>
          <p className="text-sm font-medium">{notification.message}</p>
          <button onClick={() => setNotification(null)} className="ml-2 text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Advertisement Management</h2>
          <p className="text-slate-500 mt-1">Manage advertisements shown to non-premium users</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 active:scale-95"
        >
          <Plus size={20} />
          Create Advertisement
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Ads</p>
              <p className="text-2xl font-bold text-slate-800">{ads.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <Play size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Active</p>
              <p className="text-2xl font-bold text-slate-800">
                {ads.filter(ad => ad.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Eye size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Views</p>
              <p className="text-2xl font-bold text-slate-800">
                {ads.reduce((sum, ad) => sum + ad.views, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <MousePointerClick size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Clicks</p>
              <p className="text-2xl font-bold text-slate-800">
                {ads.reduce((sum, ad) => sum + ad.clicks, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Advertisements List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left p-4 text-sm font-semibold text-slate-600">Advertisement</th>
              <th className="text-left p-4 text-sm font-semibold text-slate-600">Link</th>
              <th className="text-left p-4 text-sm font-semibold text-slate-600">Status</th>
              <th className="text-left p-4 text-sm font-semibold text-slate-600">Priority</th>
              <th className="text-left p-4 text-sm font-semibold text-slate-600">Stats</th>
              <th className="text-left p-4 text-sm font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ads.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center p-8 text-slate-500">
                  No advertisements yet. Create your first one!
                </td>
              </tr>
            ) : (
              ads.map((ad) => (
                <tr key={ad.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {ad.imageUrl && (
                        <img
                          src={`${API_BASE_URL}${ad.imageUrl}`}
                          alt={ad.title}
                          className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                        />
                      )}
                      <div>
                        <p className="font-semibold text-slate-800">{ad.title}</p>
                        <p className="text-sm text-slate-500 line-clamp-1">{ad.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <a
                      href={ad.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
                    >
                      View Link
                      <ExternalLink size={14} />
                    </a>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        ad.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : ad.status === 'paused'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {ad.status.charAt(0).toUpperCase() + ad.status.slice(1)}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-slate-700 font-medium">{ad.priority}</span>
                  </td>
                  <td className="p-4">
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Eye size={14} className="text-slate-400" />
                        <span>{ad.views.toLocaleString()} views</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <MousePointerClick size={14} className="text-slate-400" />
                        <span>{ad.clicks.toLocaleString()} clicks</span>
                      </div>
                      <div className="text-slate-500 text-xs mt-1">CTR: {ad.ctr}%</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleStatus(ad)}
                        className={`p-2 rounded-lg transition-colors ${
                          ad.status === 'active'
                            ? 'hover:bg-amber-50 text-amber-600'
                            : 'hover:bg-green-50 text-green-600'
                        }`}
                        title={ad.status === 'active' ? 'Pause' : 'Activate'}
                      >
                        {ad.status === 'active' ? <Pause size={18} /> : <Play size={18} />}
                      </button>
                      <button
                        onClick={() => handleEdit(ad)}
                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(ad.id)}
                        className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- 新增：Delete Confirmation Modal --- */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Advertisement?</h3>
              <p className="text-sm text-slate-500 mb-6">
                Are you sure you want to delete this ad? This action cannot be undone and tracking data will be lost.
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

      {/* Edit/Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800">
                {editingAd ? 'Edit Advertisement' : 'Create New Advertisement'}
              </h3>
              <button 
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  placeholder="Enter advertisement title"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all resize-none"
                  rows={3}
                  placeholder="Enter advertisement description"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Target Link *
                </label>
                <div className="relative">
                  <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="url"
                    required
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Priority
                  </label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    placeholder="0"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Advertisement Image
                </label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-slate-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100
                    "
                  />
                  {imagePreview && (
                    <div className="mt-4 relative rounded-lg overflow-hidden border border-slate-200">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                >
                  {editingAd ? 'Update Advertisement' : 'Create Advertisement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};