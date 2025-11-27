
import React, { useState, useRef, useEffect } from 'react';
import { Bell, Menu, Search, Sun, Moon, LogOut, Settings, User as UserIcon, CreditCard } from 'lucide-react';
import { MOCK_USER } from '../constants';

interface TopBarProps {
  onToggleSidebar: () => void;
  title: string;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onToggleSidebar, title, isDarkMode, onToggleTheme }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 px-3 md:px-4 pt-4 pb-2 transition-all duration-300 pointer-events-none">
       {/* Floating Capsule Container */}
       <div className="mx-auto bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-xl border border-transparent hover:border-slate-300 dark:hover:border-slate-600 rounded-[2rem] shadow-sm shadow-slate-200/50 dark:shadow-black/20 pointer-events-auto h-20 px-4 md:px-8 flex items-center justify-between transition-all duration-300 ease-out hover:shadow-xl hover:-translate-y-0.5 hover:scale-[1.005]">
          
          {/* Left: Title & Mobile Toggle */}
          <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1 mr-2">
            <button 
              onClick={onToggleSidebar}
              className="p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 rounded-full md:hidden transition-all active:scale-95 hover:scale-105 flex-shrink-0"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex flex-col animate-fade-in min-w-0">
               <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight truncate max-w-[120px] sm:max-w-[200px] md:max-w-none">
                 {title}
               </h1>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 md:gap-5 flex-shrink-0">
            {/* Search Bar - Desktop Only */}
            <div className="hidden lg:flex items-center bg-white dark:bg-slate-800 rounded-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 focus-within:border-sky-500/50 dark:focus-within:border-indigo-500/50 focus-within:ring-4 focus-within:ring-sky-500/10 dark:focus-within:ring-indigo-500/10 transition-all w-64 xl:w-72 shadow-sm hover:border-sky-300 dark:hover:border-indigo-500 hover:shadow-md hover:-translate-y-0.5">
              <Search className="w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search trip, flight..." 
                className="bg-transparent border-none outline-none text-sm font-medium text-slate-700 dark:text-slate-200 placeholder-slate-400 ml-3 w-full"
              />
            </div>

            <div className="flex items-center gap-1 md:gap-2">
              <button 
                onClick={onToggleTheme}
                className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-white transition-all rounded-full hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-md hover:-translate-y-0.5 active:scale-95"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <button className="relative p-2.5 text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-white transition-all rounded-full hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-md hover:-translate-y-0.5 active:scale-95">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
              </button>
              
              <div className="h-8 w-px bg-slate-300 dark:bg-slate-700 mx-2 hidden sm:block"></div>
              
              {/* User Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className={`
                    flex items-center p-1 rounded-full transition-all duration-300
                    ${isProfileOpen 
                      ? 'bg-white dark:bg-slate-800 ring-4 ring-sky-500/10 dark:ring-indigo-500/10 shadow-sm' 
                      : 'hover:bg-white dark:hover:bg-slate-800 hover:shadow-md hover:-translate-y-0.5'
                    }
                  `}
                >
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden ring-2 ring-white dark:ring-slate-800 shadow-sm transition-transform duration-300 hover:scale-105 border border-transparent hover:border-sky-300">
                    <img src={MOCK_USER.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                </button>

                {/* Dropdown Menu */}
                <div className={`
                   absolute top-full right-0 mt-3 w-64 bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden transition-all duration-300 origin-top-right z-50
                   ${isProfileOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}
                `}>
                  <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                     <p className="text-base font-bold text-slate-900 dark:text-white truncate">{MOCK_USER.name}</p>
                     <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate">alex.chen@example.com</p>
                  </div>
                  
                  <div className="p-2 space-y-0.5">
                     <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                        <UserIcon className="w-4 h-4 text-slate-400 group-hover:text-sky-600 dark:group-hover:text-indigo-400 transition-colors" />
                        Account Settings
                     </button>
                     <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                        <CreditCard className="w-4 h-4 text-slate-400 group-hover:text-sky-600 dark:group-hover:text-indigo-400 transition-colors" />
                        Billing & Subscription
                     </button>
                     <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                        <Settings className="w-4 h-4 text-slate-400 group-hover:text-sky-600 dark:group-hover:text-indigo-400 transition-colors" />
                        App Preferences
                     </button>
                  </div>

                  <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                     <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <LogOut className="w-4 h-4" />
                        Sign Out
                     </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
       </div>
    </header>
  );
};

export default TopBar;
