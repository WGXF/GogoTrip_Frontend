
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
} from 'lucide-react';

interface SettingsViewProps {
  user: User;
  onUpdateUser: (updatedUser: Partial<User>) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ user, onUpdateUser }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email || 'alex.chen@example.com',
    avatarUrl: user.avatarUrl
  });
  
  // Preference States
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [dataPrivacy, setDataPrivacy] = useState(true);

  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    onUpdateUser({
      name: formData.name,
      avatarUrl: formData.avatarUrl
    });
    // In a real app, preferences would be saved to user object too
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatarUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-6 md:p-8 w-full max-w-4xl mx-auto animate-fade-in-up">
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

          {/* Preferences Section - Now Functional */}
          <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Preferences</h3>
            <div className="space-y-4">
                {/* Email Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                        <Bell className="w-5 h-5 text-sky-500" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">Email Notifications</p>
                        <p className="text-xs text-slate-500">Receive trip updates and AI suggestions</p>
                      </div>
                  </div>
                  <button 
                    onClick={() => setEmailNotifs(!emailNotifs)}
                    className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ${emailNotifs ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-300 ${emailNotifs ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </button>
                </div>

                {/* Privacy Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                        <Shield className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">Data Privacy</p>
                        <p className="text-xs text-slate-500">Allow AI to use travel history for better suggestions</p>
                      </div>
                  </div>
                  <button 
                    onClick={() => setDataPrivacy(!dataPrivacy)}
                    className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ${dataPrivacy ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-300 ${dataPrivacy ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </button>
                </div>
            </div>
          </div>

          {/* Save Action */}
          <div className="pt-6 mt-6 flex justify-end">
            <button 
              onClick={handleSave}
              className={`
                flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95
                ${isSaved ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-sky-600 hover:bg-sky-500'}
              `}
            >
              {isSaved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
              {isSaved ? 'Saved Successfully' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
