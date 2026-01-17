import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, Bell, Settings, LogOut, User, Check, Menu, 
  UserIcon, X, Info, CheckCircle, AlertTriangle 
} from 'lucide-react';
import { ViewState, User as UserType, NavItem } from '../../types';

interface HeaderProps {
  onLogout: () => void; 
  onNavigate: (item: NavItem) => void;
  user: UserType;
}

interface Notification {
  type: 'success' | 'info' | 'warning';
  message: string;
}

export const Header: React.FC<HeaderProps> = ({ onLogout, onNavigate, user }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  
  // --- 新增：Toast Notification 状态 ---
  const [notification, setNotification] = useState<Notification | null>(null);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // --- 辅助函数：显示通知 ---
  const showNotification = (type: 'success' | 'info' | 'warning', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000); // 3秒自动关闭
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      console.log(`Searching for: ${searchValue}`);
      // 使用 Toast 反馈搜索动作
      if (searchValue.trim()) {
         showNotification('info', `Searching for "${searchValue}"...`);
      }
      const btn = document.activeElement as HTMLElement;
      btn?.blur();
    }
  };

  const handleSettings = (type: string) => {
    if (type === "Account" || type === "Preferences") {
        onNavigate('Settings');
    } else if (type === "Billing") {
        // --- 替换 alert ---
        showNotification('warning', "Billing module is coming soon!");
    } else {
        // --- 替换 alert ---
        showNotification('info', `Navigating to ${type} settings...`);
    }
    setIsProfileOpen(false);
  };
  
  const notifications = [
      { id: 1, text: "New user registered: Sarah J.", time: "2 min ago", unread: true },
      { id: 2, text: "System backup completed successfully.", time: "1 hour ago", unread: false },
      { id: 3, text: "Trip #1029 reported by user.", time: "3 hours ago", unread: true },
  ];

  // Toast Icon 辅助映射
  const getToastIcon = (type: string) => {
      switch(type) {
          case 'success': return <CheckCircle size={18} />;
          case 'warning': return <AlertTriangle size={18} />;
          default: return <Info size={18} />;
      }
  };

  const getToastStyles = (type: string) => {
      switch(type) {
          case 'success': return 'bg-white border-green-100 text-green-800';
          case 'warning': return 'bg-white border-amber-100 text-amber-800';
          default: return 'bg-white border-blue-100 text-blue-800';
      }
  };

  const getIconBg = (type: string) => {
      switch(type) {
          case 'success': return 'bg-green-100 text-green-600';
          case 'warning': return 'bg-amber-100 text-amber-600';
          default: return 'bg-blue-100 text-blue-600';
      }
  };

  return (
    <header className="flex flex-col md:flex-row items-center justify-between gap-4 py-4 px-8 bg-white border-b border-slate-200 z-20 relative">
      
      {/* --- 全局 Toast 通知 --- */}
      {notification && (
        <div className={`fixed top-24 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border animate-in slide-in-from-top-4 duration-300 ${getToastStyles(notification.type)}`}>
          <div className={`p-1 rounded-full ${getIconBg(notification.type)}`}>
            {getToastIcon(notification.type)}
          </div>
          <p className="text-sm font-medium">{notification.message}</p>
          <button onClick={() => setNotification(null)} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Breadcrumb / Title placeholder */}
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Admin Dashboard</h1>
      </div>

      <div className="flex items-center gap-4 w-full md:w-auto">
        {/* Search */}
        {/*<div className="relative flex-1 md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search anything..." 
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleSearch}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:outline-none placeholder-slate-400 transition-all"
          />
        </div> */}
        
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
            {/*<button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className={`p-2 rounded-full transition-colors relative ${isNotifOpen ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
            >
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button> */}

            {isNotifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                    <div className="p-4 border-b border-slate-50 flex justify-between items-center">
                        <h3 className="font-semibold text-slate-800 text-sm">Notifications</h3>
                        <button className="text-xs text-blue-600 hover:underline">Mark all read</button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {notifications.map(n => (
                            <div key={n.id} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${n.unread ? 'bg-blue-50/30' : ''}`}>
                                <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${n.unread ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                                <div>
                                    <p className="text-sm text-slate-700">{n.text}</p>
                                    <p className="text-xs text-slate-400 mt-1">{n.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-3 text-center border-t border-slate-50">
                        <button className="text-xs text-slate-500 hover:text-slate-800 font-medium">View All</button>
                    </div>
                </div>
            )}
        </div>

        {/* User Profile */}
        <div className="relative pl-2 border-l border-slate-200" ref={profileRef}>
            <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 hover:bg-slate-50 rounded-lg p-1.5 transition-colors group"
            >
                <div className="text-right hidden md:block">
                    <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                        {user?.name || 'Admin User'}
                    </p>
                    <p className="text-xs text-slate-400">
                        {user?.email || 'admin@gogotrip.com'}
                    </p>
                </div>
                <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden shrink-0 ring-2 ring-transparent group-hover:ring-slate-100 transition-all">
                    <img 
                    src={user?.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"} 
                    alt="User" 
                    className="w-full h-full object-cover"
                    />
                </div>
            </button>
                <div className={`
                   absolute top-full right-0 mt-3 w-64 bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden transition-all duration-300 origin-top-right z-50
                   ${isProfileOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}
                `}>
                  <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                     <p className="text-base font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                     <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate">{user.email || 'alex.chen@example.com'}</p>
                  </div>
                  <div className="p-2 space-y-0.5">
                     <button onClick={() => handleSettings("Account")} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                        <UserIcon className="w-4 h-4 text-slate-400 group-hover:text-sky-600 dark:group-hover:text-indigo-400 transition-colors" />
                        Account Settings
                     </button>
                  </div>
                  <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                     <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <LogOut className="w-4 h-4" />
                        Sign Out
                     </button>
                  </div>
                </div>
        </div>
      </div>
    </header>
  );
};