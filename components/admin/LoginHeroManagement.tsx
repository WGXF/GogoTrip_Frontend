import React, { useState, useEffect, useRef } from 'react';
import { 
  Image, Plus, Trash2, Edit, Check, X, Save, Eye, EyeOff, 
  Upload, Link as LinkIcon, Database, MapPin, Settings,
  ChevronDown, AlertCircle, Loader2
} from 'lucide-react';
import { API_BASE_URL } from '../../config';

interface HeroConfig {
  id: number;
  displayMode: 'single' | 'carousel' | 'fade';
  transitionInterval: number;
  autoPlay: boolean;
  imageSource: 'url' | 'database' | 'places';
  imagesConfig: any[];
  title: string | null;
  subtitle: string | null;
  description: string | null;
  enableGradient: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface HeroImage {
  id: number;
  title: string;
  description: string;
  imageType: 'url' | 'proxy';
  imageUrl: string;
  rawImageUrl: string;
  source: 'external' | 'places' | 'uploaded';
  sourcePlaceId?: number;
  altText: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  place?: {
    id: number;
    name: string;
    address: string;
  };
}

interface Place {
  id: number;
  name: string;
  address: string;
  photoUrl: string;
  rating: number;
}

interface PreviewState {
  url: string;
  title: string;
  x: number;
  y: number;
}

export const LoginHeroManagement: React.FC = () => {
  const [configs, setConfigs] = useState<HeroConfig[]>([]);
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'configs' | 'images'>('configs');
  const [editingConfig, setEditingConfig] = useState<Partial<HeroConfig> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // 🔥 New: Preview and custom dropdown menu state
  const [hoverPreview, setHoverPreview] = useState<PreviewState | null>(null);
  const [openDropdownIdx, setOpenDropdownIdx] = useState<number | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownIdx(null);
    if (openDropdownIdx !== null) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openDropdownIdx]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [configsRes, imagesRes, placesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/login-hero/configs`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/admin/login-hero/images`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/admin/login-hero/available-places`, { credentials: 'include' })
      ]);

      const configsData = await configsRes.json();
      const imagesData = await imagesRes.json();
      const placesData = await placesRes.json();

      if (configsData.status === 'success') {
        setConfigs(configsData.configs);
      }
      if (imagesData.status === 'success') {
        setHeroImages(imagesData.images);
      }
      if (placesData.status === 'success') {
        setPlaces(placesData.places);
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConfig = () => {
    setIsCreating(true);
    setEditingConfig({
      displayMode: 'single',
      transitionInterval: 5,
      autoPlay: true,
      imageSource: 'url',
      imagesConfig: [{ url: '', alt: '' }],
      title: null,
      subtitle: null,
      description: null,
      enableGradient: true,
      isActive: false
    });
  };

  const handleSaveConfig = async () => {
    if (!editingConfig) return;

    try {
      setLoading(true);
      setError(null);

      const url = isCreating
        ? `${API_BASE_URL}/api/admin/login-hero/configs`
        : `${API_BASE_URL}/api/admin/login-hero/configs/${editingConfig.id}`;

      const method = isCreating ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editingConfig)
      });

      const data = await res.json();

      if (data.status === 'success') {
        setSuccess(isCreating ? 'Configuration created!' : 'Configuration updated!');
        setEditingConfig(null);
        setIsCreating(false);
        loadData();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateConfig = async (configId: number) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/admin/login-hero/configs/${configId}/activate`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await res.json();
      if (data.status === 'success') {
        setSuccess('Configuration activated!');
        loadData();
      }
    } catch (err) {
      setError('Failed to activate configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfig = async (configId: number) => {
    if (!confirm('Are you sure you want to delete this configuration?')) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/admin/login-hero/configs/${configId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await res.json();
      if (data.status === 'success') {
        setSuccess('Configuration deleted!');
        loadData();
      }
    } catch (err) {
      setError('Failed to delete configuration');
    } finally {
      setLoading(false);
    }
  };

  const addImageToConfig = () => {
    if (!editingConfig) return;

    const newImage = editingConfig.imageSource === 'url'
      ? { url: '', alt: '' }
      : editingConfig.imageSource === 'database'
      ? { image_id: null }
      : { place_id: null };

    setEditingConfig({
      ...editingConfig,
      imagesConfig: [...(editingConfig.imagesConfig || []), newImage]
    });
  };

  const removeImageFromConfig = (index: number) => {
    if (!editingConfig) return;
    const newImages = [...(editingConfig.imagesConfig || [])];
    newImages.splice(index, 1);
    setEditingConfig({ ...editingConfig, imagesConfig: newImages });
  };

  const updateImageInConfig = (index: number, updates: any) => {
    if (!editingConfig) return;
    const newImages = [...(editingConfig.imagesConfig || [])];
    newImages[index] = { ...newImages[index], ...updates };
    setEditingConfig({ ...editingConfig, imagesConfig: newImages });
  };

  const handleUploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload PNG, JPG, GIF, or WebP images.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size too large. Maximum 5MB allowed.');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name.replace(/\.[^/.]+$/, ''));
      formData.append('altText', file.name);

      const res = await fetch(`${API_BASE_URL}/api/admin/login-hero/images/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await res.json();
      if (data.status === 'success') {
        setSuccess('Image uploaded successfully!');
        loadData();
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleAddImageFromPlace = async (placeId: number, placeName: string) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE_URL}/api/admin/login-hero/images/from-place`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          placeId: placeId,
          title: placeName,
          altText: placeName
        })
      });

      const data = await res.json();
      if (data.status === 'success') {
        setSuccess('Image added from place!');
        loadData();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to add image from place');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImageFromLibrary = async (imageId: number) => {
    if (!confirm('Delete this image from library?')) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/admin/login-hero/images/${imageId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await res.json();
      if (data.status === 'success') {
        setSuccess('Image deleted from library!');
        loadData();
      }
    } catch (err) {
      setError('Failed to delete image');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleImageActive = async (imageId: number, currentStatus: boolean) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/admin/login-hero/images/${imageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          isActive: !currentStatus
        })
      });

      const data = await res.json();
      if (data.status === 'success') {
        setSuccess(`Image ${!currentStatus ? 'activated' : 'deactivated'}!`);
        loadData();
      }
    } catch (err) {
      setError('Failed to update image status');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 处理悬停显示预览
  const handleImageHover = (e: React.MouseEvent, url: string, title: string) => {
    // 构建完整 URL
    const fullUrl = url.startsWith('/') ? `${API_BASE_URL}${url}` : url;
    
    // 计算位置，避免溢出屏幕
    const PREVIEW_WIDTH = 260;
    const PREVIEW_HEIGHT = 180;
    const OFFSET = 15;
    
    let x = e.clientX + OFFSET;
    let y = e.clientY + OFFSET;

    // 如果靠右边缘，显示在左侧
    if (x + PREVIEW_WIDTH > window.innerWidth) {
      x = e.clientX - PREVIEW_WIDTH - OFFSET;
    }

    // 如果靠底部边缘，显示在上方
    if (y + PREVIEW_HEIGHT > window.innerHeight) {
      y = e.clientY - PREVIEW_HEIGHT - OFFSET;
    }

    setHoverPreview({
      url: fullUrl,
      title,
      x,
      y
    });
  };

  if (loading && configs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Login Background Management</h2>
          <p className="text-slate-500 mt-1">Configure the hero section of the login page</p>
        </div>
          {activeTab === 'configs' && (
            <button
              onClick={handleCreateConfig}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              New Configuration
            </button>
          )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <AlertCircle size={20} />
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-700">
          <Check size={20} />
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('configs')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'configs'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <Settings className="w-4 h-4 inline mr-2" />
          Configurations
        </button>
        <button
          onClick={() => setActiveTab('images')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'images'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <Image className="w-4 h-4 inline mr-2" />
          Image Library
        </button>
      </div>

      {/* Content */}
      {activeTab === 'configs' ? (
        <div className="space-y-4">
          {/* Editing Form */}
          {editingConfig && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4">
                {isCreating ? 'Create New Configuration' : 'Edit Configuration'}
              </h3>

              <div className="space-y-4">
                {/* Display Mode */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Display Mode
                  </label>
                  <select
                    value={editingConfig.displayMode}
                    onChange={(e) =>
                      setEditingConfig({
                        ...editingConfig,
                        displayMode: e.target.value as any
                      })
                    }
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="single">Single Image</option>
                    <option value="carousel">Carousel</option>
                    <option value="fade">Fade Transition</option>
                  </select>
                </div>

                {/* Image Source */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Image Source
                  </label>
                  <select
                    value={editingConfig.imageSource}
                    onChange={(e) =>
                      setEditingConfig({
                        ...editingConfig,
                        imageSource: e.target.value as any,
                        imagesConfig: []
                      })
                    }
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="url">External URL - Direct image links</option>
                    <option value="database">Image Library - Uploaded or saved images</option>
                    <option value="places">Places - Images from Places database</option>
                  </select>
                  <p className="mt-2 text-xs text-slate-500">
                    {editingConfig.imageSource === 'url' && '📌 Enter direct image URLs (e.g., from Unsplash, Pexels)'}
                    {editingConfig.imageSource === 'database' && '📌 Select from your uploaded images or images added from Places in the Image Library'}
                    {editingConfig.imageSource === 'places' && '📌 Directly select images from Places database (loaded via proxy API)'}
                  </p>
                </div>

                {/* Transition Settings */}
                {editingConfig.displayMode !== 'single' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Transition Interval (seconds)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={editingConfig.transitionInterval}
                        onChange={(e) =>
                          setEditingConfig({
                            ...editingConfig,
                            transitionInterval: parseInt(e.target.value)
                          })
                        }
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Auto Play
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingConfig.autoPlay}
                          onChange={(e) =>
                            setEditingConfig({
                              ...editingConfig,
                              autoPlay: e.target.checked
                            })
                          }
                          className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-slate-700">Enable</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Images Configuration */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Images
                    </label>
                    <button
                      onClick={addImageToConfig}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Plus size={16} />
                      Add Image
                    </button>
                  </div>

                  <div className="space-y-3">
                    {editingConfig.imagesConfig?.map((img, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg relative"
                      >
                        {editingConfig.imageSource === 'url' && (
                          <>
                            <input
                              type="text"
                              placeholder="Image URL"
                              value={img.url || ''}
                              onChange={(e) =>
                                updateImageInConfig(index, { url: e.target.value })
                              }
                              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Alt text"
                              value={img.alt || ''}
                              onChange={(e) =>
                                updateImageInConfig(index, { alt: e.target.value })
                              }
                              className="w-32 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                            />
                          </>
                        )}

                        {/* 🔥 Database 模式：自定义 Dropdown (支持 Hover) */}
                        {editingConfig.imageSource === 'database' && (
                          <div className="flex-1 relative">
                             <div 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdownIdx(openDropdownIdx === index ? null : index);
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm cursor-pointer flex items-center justify-between hover:border-blue-400 transition-colors"
                             >
                                <span className={!img.image_id ? 'text-slate-400' : 'text-slate-800 truncate'}>
                                  {img.image_id 
                                    ? heroImages.find(h => h.id === img.image_id)?.title || 'Unknown Image' 
                                    : 'Select an image from library'}
                                </span>
                                <ChevronDown size={16} className="text-slate-500" />
                             </div>

                             {openDropdownIdx === index && (
                               <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl py-1">
                                 <div 
                                    onClick={() => {
                                      updateImageInConfig(index, { image_id: null });
                                      setOpenDropdownIdx(null);
                                    }}
                                    className="px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 cursor-pointer"
                                 >
                                    Select an image from library
                                 </div>
                                 {heroImages.filter(img => img.isActive).map((heroImg) => (
                                    <div
                                      key={heroImg.id}
                                      onClick={() => {
                                        updateImageInConfig(index, { image_id: heroImg.id });
                                        setOpenDropdownIdx(null);
                                      }}
                                      onMouseEnter={(e) => handleImageHover(e, heroImg.imageUrl, heroImg.title)}
                                      onMouseLeave={() => setHoverPreview(null)}
                                      className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between ${
                                        img.image_id === heroImg.id ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                                      }`}
                                    >
                                      <span className="truncate">{heroImg.title}</span>
                                      <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-2">
                                        {heroImg.source?.toUpperCase()}
                                      </span>
                                    </div>
                                 ))}
                               </div>
                             )}
                          </div>
                        )}

                        {/* 🔥 Places 模式：自定义 Dropdown (支持 Hover) */}
                        {editingConfig.imageSource === 'places' && (
                          <div className="flex-1 relative">
                             {/* 模拟 Select 框 */}
                             <div 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdownIdx(openDropdownIdx === index ? null : index);
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm cursor-pointer flex items-center justify-between hover:border-blue-400 transition-colors"
                             >
                                <span className={!img.place_id ? 'text-slate-400' : 'text-slate-800 truncate'}>
                                  {img.place_id 
                                    ? places.find(p => p.id === img.place_id)?.name || 'Unknown Place'
                                    : 'Select a place'}
                                </span>
                                <ChevronDown size={16} className="text-slate-500" />
                             </div>

                             {/* 下拉菜单内容 */}
                             {openDropdownIdx === index && (
                               <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl py-1">
                                 <div 
                                    onClick={() => {
                                      updateImageInConfig(index, { place_id: null });
                                      setOpenDropdownIdx(null);
                                    }}
                                    className="px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 cursor-pointer"
                                 >
                                    Select a place
                                 </div>
                                 {places.map((place) => (
                                    <div
                                      key={place.id}
                                      onClick={() => {
                                        updateImageInConfig(index, { place_id: place.id });
                                        setOpenDropdownIdx(null);
                                      }}
                                      // 🔥 在这里触发 Place 的预览
                                      onMouseEnter={(e) => 
                                        handleImageHover(e, `${API_BASE_URL}/proxy_image?ref=${place.photoUrl}`, place.name)
                                      }
                                      onMouseLeave={() => setHoverPreview(null)}
                                      className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between ${
                                        img.place_id === place.id ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                                      }`}
                                    >
                                      <span className="truncate">{place.name}</span>
                                    </div>
                                 ))}
                               </div>
                             )}
                          </div>
                        )}

                        <button
                          onClick={() => removeImageFromConfig(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Text Content */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Title (Optional - overrides default)
                    </label>
                    <input
                      type="text"
                      value={editingConfig.title || ''}
                      onChange={(e) =>
                        setEditingConfig({ ...editingConfig, title: e.target.value })
                      }
                      placeholder="Plan your next great adventure..."
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={editingConfig.description || ''}
                      onChange={(e) =>
                        setEditingConfig({
                          ...editingConfig,
                          description: e.target.value
                        })
                      }
                      placeholder="Join thousands of travelers..."
                      rows={3}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Other Settings */}
                <div className="flex items-center gap-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingConfig.enableGradient}
                      onChange={(e) =>
                        setEditingConfig({
                          ...editingConfig,
                          enableGradient: e.target.checked
                        })
                      }
                      className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-slate-700">Enable Gradient Overlay</span>
                  </label>

                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingConfig.isActive}
                      onChange={(e) =>
                        setEditingConfig({
                          ...editingConfig,
                          isActive: e.target.checked
                        })
                      }
                      className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-slate-700">Set as Active</span>
                  </label>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={handleSaveConfig}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Save size={18} />
                    {loading ? 'Saving...' : 'Save Configuration'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingConfig(null);
                      setIsCreating(false);
                    }}
                    className="px-6 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Configurations List */}
          <div className="grid gap-4">
            {configs.map((config) => (
              <div
                key={config.id}
                className={`bg-white rounded-xl border p-6 shadow-sm ${
                  config.isActive ? 'border-green-500 ring-2 ring-green-100' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-slate-800">
                        {config.displayMode.charAt(0).toUpperCase() +
                          config.displayMode.slice(1)}{' '}
                        Mode
                      </h3>
                      {config.isActive && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                          ACTIVE
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-sm text-slate-600">
                      <p>
                        <strong>Source:</strong> {config.imageSource.toUpperCase()}
                      </p>
                      <p>
                        <strong>Images:</strong> {config.imagesConfig.length}
                      </p>
                      {config.displayMode !== 'single' && (
                        <p>
                          <strong>Interval:</strong> {config.transitionInterval}s
                        </p>
                      )}
                      <p>
                        <strong>Updated:</strong> {config.updatedAt}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {!config.isActive && (
                      <button
                        onClick={() => handleActivateConfig(config.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Activate"
                      >
                        <Eye size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditingConfig(config);
                        setIsCreating(false);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteConfig(config.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                      disabled={config.isActive}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Image Library Tab */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Hero Image Library</h3>
              <p className="text-sm text-slate-600 mt-1">
                Upload images or add from Places to reuse in configurations
              </p>
            </div>
            <div className="flex gap-2">
              {/* 隐藏的文件输入 */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                onChange={handleUploadImage}
                className="hidden"
              />
              {/* 上传按钮 */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={20} />
                    Upload Image
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Image Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {heroImages.length === 0 ? (
              <div className="col-span-full p-8 text-center text-slate-500">
                <Image size={48} className="mx-auto mb-4 text-slate-300" />
                <p>No images in library yet</p>
                <p className="text-sm mt-2">Add images to reuse them in configurations</p>
              </div>
            ) : (
              heroImages.map((img) => (
                <div
                  key={img.id}
                  className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Image Preview */}
                  <div className="relative h-48 bg-slate-100">
                    <img
                      src={
                        img.imageUrl.startsWith('/')
                          ? `${API_BASE_URL}${img.imageUrl}`
                          : img.imageUrl
                      }
                      alt={img.altText}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://via.placeholder.com/400x300?text=Image+Not+Available';
                      }}
                    />
                    {!img.isActive && (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                        INACTIVE
                      </div>
                    )}
                    {/* 🔥 显示来源标签 */}
                    <div className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded flex items-center gap-1">
                      {img.source === 'places' && <MapPin size={12} />}
                      {img.source === 'external' && <LinkIcon size={12} />}
                      {img.source === 'uploaded' && <Upload size={12} />}
                      {img.source?.toUpperCase() || 'UNKNOWN'}
                    </div>
                  </div>

                  {/* Image Info */}
                  <div className="p-4">
                    <h4 className="font-bold text-slate-800 mb-1">{img.title}</h4>
                    <p className="text-xs text-slate-500 mb-2 line-clamp-2">
                      {img.description || img.altText}
                    </p>
                    {/* 🔥 显示 Place 信息 */}
                    {img.place && (
                      <p className="text-xs text-blue-600 mb-2">
                        <MapPin size={10} className="inline mr-1" />
                        {img.place.name}
                      </p>
                    )}

                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleDeleteImageFromLibrary(img.id)}
                        className="flex-1 py-2 px-3 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Trash2 size={14} className="inline mr-1" />
                        Delete
                      </button>
                      <button
                        onClick={() => handleToggleImageActive(img.id, img.isActive)}
                        className={`flex-1 py-2 px-3 text-sm rounded-lg transition-colors ${
                          img.isActive
                            ? 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        {img.isActive ? (
                          <>
                            <EyeOff size={14} className="inline mr-1" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Eye size={14} className="inline mr-1" />
                            Activate
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Add from Places */}
          {places.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-bold text-slate-800 mb-4">
                Quick Add from Places
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Add place images to your library with one click
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {places.slice(0, 12).map((place) => (
                  <button
                    key={place.id}
                    onClick={() => {
                      if (confirm(`Add "${place.name}" to image library?`)) {
                        handleAddImageFromPlace(place.id, place.name);
                      }
                    }}
                    onMouseEnter={(e) => 
                      handleImageHover(e, `${API_BASE_URL}/proxy_image?ref=${place.photoUrl}`, place.name)
                    }
                    onMouseLeave={() => setHoverPreview(null)}
                    disabled={uploading || loading}
                    className="relative group rounded-lg overflow-hidden border-2 border-slate-200 hover:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="aspect-square bg-slate-100">
                      <img
                        src={`${API_BASE_URL}/proxy_image?ref=${place.photoUrl}`}
                        alt={place.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Plus size={32} className="text-white" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <p className="text-white text-xs font-medium truncate">
                        {place.name}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 🔥 全局预览窗口 */}
      {hoverPreview && (
        <div 
          className="fixed z-[9999] bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden pointer-events-none transition-all duration-150"
          style={{
            top: hoverPreview.y,
            left: hoverPreview.x,
            width: '260px'
          }}
        >
          <div className="aspect-video w-full bg-slate-100 relative">
            <img 
              src={hoverPreview.url} 
              alt="Preview" 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/260x146?text=Preview+Error';
              }}
            />
          </div>
          <div className="p-2 bg-white">
            <p className="text-xs font-bold text-slate-800 truncate">{hoverPreview.title}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginHeroManagement;