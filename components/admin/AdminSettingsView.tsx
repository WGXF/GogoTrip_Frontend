import React, { useState, useEffect } from 'react';
import { Save, Image as ImageIcon, Type, RefreshCw, Eye } from 'lucide-react';

interface Setting {
  key: string;
  value: string;
  label: string;
  description: string;
  type: 'text' | 'url' | 'textarea';
  placeholder?: string;
}

export const AdminSettingsView: React.FC = () => {
  const [settings, setSettings] = useState<Setting[]>([
    {
      key: 'login_hero_image',
      value: '',
      label: 'Login Hero Image URL',
      description: 'Background image for left side of login page (recommended to use high-quality images from Unsplash or Pexels)',
      type: 'url',
      placeholder: 'https://images.unsplash.com/photo-...'
    },
    {
      key: 'login_hero_title',
      value: '',
      label: 'Login Hero Title',
      description: 'Main title for login page',
      type: 'text',
      placeholder: 'Your Journey Starts Here'
    },
    {
      key: 'login_hero_subtitle',
      value: '',
      label: 'Login Hero Subtitle',
      description: 'Subtitle for login page',
      type: 'textarea',
      placeholder: 'Plan, explore, and discover amazing destinations...'
    }
  ]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Load current settings
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings/public', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update settings state
        setSettings(prev => prev.map(setting => ({
          ...setting,
          value: data[setting.key] || setting.value
        })));
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const settingsToUpdate = settings.map(s => ({
        key: s.key,
        value: s.value,
        description: s.description,
        category: 'login'
      }));

      const response = await fetch('/api/settings/batch-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: settingsToUpdate }),
        credentials: 'include'
      });

      if (response.ok) {
        alert('✅ 设置已保存！');
      } else {
        const data = await response.json();
        alert(`❌ 保存失败: ${data.error}`);
      }
    } catch (error) {
      console.error('❌ 保存设置失败:', error);
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setSettings(prev => prev.map(s => 
      s.key === key ? { ...s, value } : s
    ));
  };

  const previewImage = settings.find(s => s.key === 'login_hero_image')?.value;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-sky-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Login Page Settings
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          自定义登录页面的外观和内容
        </p>
      </div>

      {/* Settings Form */}
      <div className="space-y-6">
        {settings.map((setting) => (
          <div key={setting.key} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-sky-100 dark:bg-sky-900/30 rounded-xl">
                {setting.type === 'url' ? (
                  <ImageIcon className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                ) : (
                  <Type className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                )}
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                  {setting.label}
                </label>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  {setting.description}
                </p>
                
                {setting.type === 'textarea' ? (
                  <textarea
                    value={setting.value}
                    onChange={(e) => handleInputChange(setting.key, e.target.value)}
                    placeholder={setting.placeholder}
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-slate-700 dark:text-white resize-none"
                  />
                ) : (
                  <input
                    type={setting.type === 'url' ? 'url' : 'text'}
                    value={setting.value}
                    onChange={(e) => handleInputChange(setting.key, e.target.value)}
                    placeholder={setting.placeholder}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                )}
                
                {/* Image Preview */}
                {setting.key === 'login_hero_image' && setting.value && (
                  <div className="mt-4">
                    <div className="relative h-48 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700">
                      <img 
                        src={setting.value} 
                        alt="Hero Preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/800x400?text=Invalid+Image+URL';
                        }}
                      />
                      <div className="absolute top-2 right-2">
                        <span className="bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
                          Preview
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex gap-4">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Changes
            </>
          )}
        </button>

        <button
          onClick={() => setShowPreview(!showPreview)}
          className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white rounded-xl font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all flex items-center gap-2"
        >
          <Eye className="w-5 h-5" />
          {showPreview ? 'Hide' : 'Show'} Preview
        </button>
      </div>

      {/* Full Preview */}
      {showPreview && (
        <div className="mt-8 bg-white dark:bg-slate-800 rounded-2xl p-8 border-2 border-sky-200 dark:border-sky-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-sky-600" />
            Preview
          </h3>
          
          <div className="relative h-96 rounded-xl overflow-hidden">
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${previewImage})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-sky-900/90 to-blue-900/80"></div>
            </div>
            
            <div className="relative z-10 flex flex-col justify-center h-full px-12 text-white">
              <h2 className="text-4xl font-bold mb-4">
                {settings.find(s => s.key === 'login_hero_title')?.value}
              </h2>
              <p className="text-xl text-sky-100">
                {settings.find(s => s.key === 'login_hero_subtitle')?.value}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2">
          💡 图片建议
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
          <li>• 推荐尺寸: 1920x1080 或更高</li>
          <li>• 推荐格式: JPG, PNG, WebP</li>
          <li>• 推荐来源: <a href="https://unsplash.com" target="_blank" className="underline hover:text-blue-600">Unsplash</a>, <a href="https://pexels.com" target="_blank" className="underline hover:text-blue-600">Pexels</a></li>
          <li>• 建议选择旅行、风景、冒险主题的图片</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminSettingsView;