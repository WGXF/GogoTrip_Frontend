import React, { useState, useRef } from 'react';
import { User } from '../../types';
import { 
  User as UserIcon, 
  Mail, 
  Camera, 
  Save, 
  CheckCircle2, 
  Shield, 
  Bell, 
  Lock, 
  Loader2,
  X,
  AlertCircle
} from 'lucide-react';
import { API_BASE_URL } from '../../config';

interface SettingsViewProps {
  user: User;
  onUpdateUser: (updatedUser: Partial<User>) => void;
}

// Toast Notification 类型定义
interface Notification {
  type: 'success' | 'error';
  message: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ user, onUpdateUser }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email || 'alex.chen@example.com',
    avatarUrl: user.avatarUrl
  });
  
  const [passwordData, setPasswordData] = useState({
      currentPassword: '',
      newPassword: ''
    });
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [passwordMsg, setPasswordMsg] = useState('');

  // Preference States
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [dataPrivacy, setDataPrivacy] = useState(true);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false); // Loading state
  const [isSaved, setIsSaved] = useState(false);
  
  // --- 新增：Toast Notification 状态 ---
  const [notification, setNotification] = useState<Notification | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 辅助函数：显示通知 ---
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000); // 3秒后自动消失
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
        setPasswordStatus('error');
        setPasswordMsg('Please fill in both fields.');
        return;
    }
    
    setPasswordStatus('loading');
    try {
        const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(passwordData)
        });
        const data = await res.json();
        
        if (res.ok && data.status === 'success') {
            setPasswordStatus('success');
            setPasswordMsg('Password changed successfully!');
            setPasswordData({ currentPassword: '', newPassword: '' });
            setTimeout(() => { setPasswordStatus('idle'); setPasswordMsg(''); }, 3000);
            showNotification('success', 'Password updated successfully');
        } else {
            setPasswordStatus('error');
            setPasswordMsg(data.message || 'Failed to update password.');
        }
    } catch (e) {
        setPasswordStatus('error');
        setPasswordMsg('Network error.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const MAX_SIZE = 1 * 1024 * 1024; 
      
      if (file.size > MAX_SIZE) {
        // --- 替换 alert ---
        showNotification('error', "File is too large! Please upload an image smaller than 1MB.");
        e.target.value = ''; 
        return;
      }
      
      setSelectedFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatarUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
        const uploadData = new FormData();
        uploadData.append('name', formData.name);
        
        if (selectedFile) {
            uploadData.append('avatar', selectedFile);
        }

        const res = await fetch(`${API_BASE_URL}/user/update-profile`, {
            method: 'PUT',
            headers: {
                // 'Authorization': `Bearer ${token}` 
            },
            credentials: 'include',
            body: uploadData
        });

        const data = await res.json();

        if (res.ok) {
            setIsSaved(true);
            showNotification('success', 'Profile updated successfully!');
            setTimeout(() => setIsSaved(false), 3000);
            
            if (data.user) {
                onUpdateUser(data.user);
            }
            setSelectedFile(null);
        } else {
            // --- 替换 alert ---
            showNotification('error', data.message || 'Update failed');
        }
    } catch (error) {
        console.error("Upload error:", error);
        // --- 替换 alert ---
        showNotification('error', 'Network error occurred');
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8 w-full max-w-4xl mx-auto animate-fade-in-up relative">
      
      {/* --- 全局 Toast 通知 --- */}
      {notification && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border animate-in slide-in-from-top-4 duration-300 ${
          notification.type === 'success' 
            ? 'bg-white border-green-100 text-green-800' 
            : 'bg-white border-red-100 text-red-800'
        }`}>
          <div className={`p-1 rounded-full ${notification.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          </div>
          <p className="text-sm font-medium">{notification.message}</p>
          <button onClick={() => setNotification(null)} className="ml-2 text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <UserIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">General Settings</h2>
      </div>

      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-sm border border-transparent hover:border-sky-300 dark:hover:border-indigo-500 transition-all duration-500 ease-out">
        
        {/* Profile Picture Section */}
        <div className="flex flex-col md:flex-row items-center gap-8 mb-10 pb-10 border-b border-slate-200 dark:border-slate-800">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl ring-2 ring-slate-100 dark:ring-slate-700">
              <img src={formData.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
          <div className="text-center md:text-left">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Profile Photo</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-4">Click the image to upload a new photo. JPG, GIF or PNG.</p>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Change Photo
            </button>
          </div>
        </div>

        {/* Personal Information Form */}
        <div className="space-y-6 max-w-2xl">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Personal Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-12 pr-4 font-medium outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                  />
                </div>
            </div>
            
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-12 pr-4 font-medium outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                  />
                </div>
            </div>
          </div>

          {/* Security Section (Change Password) */}
          <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                Security
            </h3>
            
            {user.authProvider === 'google' || !user.email ? (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 flex items-center gap-3 text-slate-500 border border-slate-200 dark:border-slate-700">
                    <Shield className="w-5 h-5" />
                    <span className="text-sm">You are logged in via Google. Password change is not applicable.</span>
                </div>
            ) : (
                <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="password" 
                                    placeholder="••••••••"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="password" 
                                    placeholder="Min 8 characters"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <div>
                            {passwordStatus === 'error' && <p className="text-xs font-bold text-red-500">{passwordMsg}</p>}
                            {passwordStatus === 'success' && <p className="text-xs font-bold text-emerald-500">{passwordMsg}</p>}
                        </div>
                        <button 
                            onClick={handleChangePassword}
                            disabled={passwordStatus === 'loading'}
                            className="px-5 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-white rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-600 transition-all shadow-sm flex items-center gap-2"
                        >
                            {passwordStatus === 'loading' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Update Password'}
                        </button>
                    </div>
                </div>
            )}
          </div>

          {/* Save Action */}
          <div className="pt-6 mt-6 flex justify-end">
            <button 
              onClick={handleSave}
              disabled={isSaving} 
              className={`px-8 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-sky-500/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSaved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />)}
              {isSaved ? 'Saved' : (isSaving ? 'Saving...' : 'Save Changes')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;