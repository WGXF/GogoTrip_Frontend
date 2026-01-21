import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Bell, Menu, Search, Sun, Moon, LogOut, Settings, 
  User as UserIcon, CreditCard, X, Check, Trash2,
  ChevronRight, ExternalLink, Info, Gift, AlertTriangle,
  Megaphone, Sparkles
} from 'lucide-react';
import { User, Notification } from '../../types';
import { API_BASE_URL } from '../../config';

interface TopBarProps {
  onToggleSidebar: () => void;
  title: string;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  user: User;
  onLogout?: () => void;
  // Compatible with old interface, although we primarily use internal navigate
  onNavigate?: (path: string) => void; 
}

const API_BASE = `${API_BASE_URL}/api/notifications`;

const notificationApi = {
  getNotifications: async (): Promise<{ notifications: Notification[]; unreadCount: number }> => {
    try {
      const res = await fetch(`${API_BASE}/user`, { credentials: 'include' });
      const data = await res.json();
      return data.success ? { notifications: data.notifications, unreadCount: data.unreadCount } : { notifications: [], unreadCount: 0 };
    } catch {
      return { notifications: [], unreadCount: 0 };
    }
  },
  
  markAsRead: async (id: number): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/user/${id}/read`, { 
        method: 'POST', 
        credentials: 'include' 
      });
      return (await res.json()).success;
    } catch {
      return false;
    }
  },
  
  markAllAsRead: async (): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/user/read-all`, { 
        method: 'POST', 
        credentials: 'include' 
      });
      return (await res.json()).success;
    } catch {
      return false;
    }
  },
  
  deleteNotification: async (id: number): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/user/${id}`, { 
        method: 'DELETE', 
        credentials: 'include' 
      });
      return (await res.json()).success;
    } catch {
      return false;
    }
  }
};

const TopBar: React.FC<TopBarProps> = ({ 
  onToggleSidebar, 
  title, 
  isDarkMode, 
  onToggleTheme, 
  user, 
  onLogout 
}) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['nav', 'common']);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    const data = await notificationApi.getNotifications();
    setNotifications(data.notifications);
    setUnreadCount(data.unreadCount);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id: number) => {
    const success = await notificationApi.markAsRead(id);
    if (success) {
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, unread: false } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleMarkAllRead = async () => {
    const success = await notificationApi.markAllAsRead();
    if (success) {
      setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
      setUnreadCount(0);
    }
  };

  const handleDeleteNotification = async (id: number) => {
    const notif = notifications.find(n => n.id === id);
    const success = await notificationApi.deleteNotification(id);
    if (success) {
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (notif?.unread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    if (notif.unread) {
      await handleMarkRead(notif.id as number);
    }
    
    if (notif.hasTab && notif.tabId) {
      setIsNotificationsOpen(false);
      navigate(`/announcements/${notif.tabId}`);
    }
  };

  const handleSettings = (type: string) => {
    if (type === "Account" || type === "Preferences") {
      navigate('/settings');
    } else if (type === "Billing") {
      navigate('/billing');
    }
    setIsProfileOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <Sparkles className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'alert': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'promotion': return <Gift className="w-4 h-4 text-purple-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getNotificationBg = (type: string, unread: boolean) => {
    const base = unread ? 'bg-opacity-50' : '';
    switch (type) {
      case 'success': return `${base} ${unread ? 'bg-green-50 dark:bg-green-900/10' : ''}`;
      case 'warning': return `${base} ${unread ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}`;
      case 'alert': return `${base} ${unread ? 'bg-red-50 dark:bg-red-900/10' : ''} border-l-4 border-l-red-500`;
      default: return `${base} ${unread ? 'bg-sky-50 dark:bg-indigo-900/10' : ''}`;
    }
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-20 px-3 md:px-4 pt-4 pb-2 transition-all duration-300 pointer-events-none">
      {/* Floating Capsule Container */}
      <div className="mx-auto bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-xl border border-transparent hover:border-slate-300 dark:hover:border-slate-600 rounded-[2rem] shadow-sm shadow-slate-200/50 dark:shadow-black/20 pointer-events-auto h-20 px-4 md:px-8 flex items-center justify-between transition-all duration-300 ease-out hover:shadow-xl hover:-translate-y-0.5 hover:scale-[1.005]">
        
        {/* Left: Title & Mobile Toggle */}
        <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1 mr-2">
          <button 
            onClick={onToggleSidebar}
            className="p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 rounded-full md:hidden transition-colors active:scale-95"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex flex-col">
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300">
              {title}
            </h1>
            <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
              {new Date().toLocaleDateString(i18n.language === 'zh' ? 'zh-CN' : i18n.language === 'ms' ? 'ms-MY' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          
          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-3 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-sky-600 dark:hover:text-indigo-400 rounded-full transition-all duration-200 relative active:scale-95 group"
            >
              <Bell size={20} className="transition-transform group-hover:rotate-12" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-slate-100 dark:ring-slate-900 animate-pulse" />
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-4 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-in zoom-in-95 origin-top-right">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-sm">
                  <h3 className="font-bold text-slate-900 dark:text-white">{t('nav:topBar.notifications')}</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllRead}
                      className="text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-indigo-400 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-sky-50 dark:hover:bg-indigo-900/20 transition-colors"
                    >
                      <Check className="w-3 h-3" /> {t('nav:topBar.markAllRead')}
                    </button>
                  )}
                </div>
                
                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                  {loading ? (
                    <div className="p-8 text-center text-slate-400">{t('common:loading')}</div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                        <Bell className="w-6 h-6" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 font-medium">{t('nav:topBar.noNotifications')}</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {notifications.map((notif) => (
                        <div 
                          key={notif.id} 
                          className={`p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer group ${getNotificationBg(notif.type, notif.unread)}`}
                          onClick={() => handleNotificationClick(notif)}
                        >
                          <div className="flex gap-3">
                            <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700`}>
                              {getNotificationIcon(notif.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${notif.unread ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-600 dark:text-slate-300'}`}>
                                {notif.title}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                                {notif.message}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-2 font-medium">
                                {new Date(notif.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteNotification(notif.id as number); }}
                              className="self-start p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center">
                  <button 
                    onClick={() => { setIsNotificationsOpen(false); navigate('/announcements'); }}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex items-center justify-center gap-1 w-full py-1"
                  >
                    {t('nav:topBar.viewAllAnnouncements')} <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={onToggleTheme}
            className="p-3 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-amber-500 dark:hover:text-yellow-400 rounded-full transition-all duration-200 active:scale-95"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* User Profile Dropdown */}
          <div className="relative ml-2" ref={profileRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 pl-1 pr-2 py-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-full border border-slate-200 dark:border-slate-700 transition-all duration-200 active:scale-95"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-md ring-2 ring-white dark:ring-slate-800 overflow-hidden">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bold text-sm">{user.name.charAt(0)}</span>
                )}
              </div>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200 max-w-[80px] truncate hidden md:block">
                {user.name}
              </span>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-4 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-in zoom-in-95 origin-top-right">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                  <p className="font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                  {user.isPremium && (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-amber-200 to-yellow-400 rounded-lg shadow-sm">
                      <span className="text-[10px] font-black text-yellow-900 uppercase tracking-wider flex items-center gap-1">
                        <Gift className="w-3 h-3" /> {t('nav:sidebar.premium')}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="p-2 space-y-1">
                  <button 
                    onClick={() => handleSettings('Account')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <UserIcon size={16} />
                    {t('nav:userMenu.account')}
                  </button>
                  <button 
                    onClick={() => handleSettings('Billing')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <CreditCard size={16} />
                    {t('nav:userMenu.billing')}
                  </button>
                </div>
                
                <div className="p-2 border-t border-slate-100 dark:border-slate-800">
                  <button 
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut size={16} />
                    {t('nav:userMenu.signOut')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;