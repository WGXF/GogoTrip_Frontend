import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  CalendarDays,
  Sparkles,
  Settings,
  Bot,
  Plane,
  NotebookPen,
  HelpCircle,
  Info,
  ChevronRight,
  ChevronDown,
  Languages,
  Wallet,
  ShieldCheck,
  BookOpen
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  isAdminUser?: boolean;
  onSwitchToAdmin?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  isAdminUser,
  onSwitchToAdmin
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('nav');

  const [isHovered, setIsHovered] = useState(false);
  const [isLogoMenuOpen, setIsLogoMenuOpen] = useState(false);
  const [isMobileLogoMenuOpen, setIsMobileLogoMenuOpen] = useState(false);
  const logoMenuRef = useRef<HTMLDivElement>(null);

  // 定义菜单项及其对应路径 (with i18n)
  const menuItems = [
    { path: '/', labelKey: 'sidebar.dashboard', icon: LayoutDashboard },
    { path: '/chat', labelKey: 'sidebar.aiPlanner', icon: Sparkles },
    { path: '/trips', labelKey: 'sidebar.myTrips', icon: Plane },
    { path: '/blogs', labelKey: 'sidebar.travelStories', icon: BookOpen },
    { path: '/scheduler', labelKey: 'sidebar.notes', icon: NotebookPen },
    { path: '/translate', labelKey: 'sidebar.translate', icon: Languages },
    { path: '/expenses', labelKey: 'sidebar.expenses', icon: Wallet },
    { path: '/calendar', labelKey: 'sidebar.calendar', icon: CalendarDays }
  ];

  // Close logo menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (logoMenuRef.current && !logoMenuRef.current.contains(event.target as Node)) {
        setIsLogoMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleHelp = () => {
    navigate('/support');  // 导航到工单页面
  };
  
  const handleAbout = () => {
    alert("GogoTrip v2.0 Beta\n\nAI-Powered Travel Companion.");
  };

  // 检查当前路径是否激活
  const isActive = (path: string) => {
    if (path === '/' || path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Drawer (Overlay) */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl transition-transform duration-500 ease-apple
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:hidden shadow-2xl overflow-y-auto
        `}
      >
        <div className="flex flex-col h-full p-4">
           {/* Mobile Header with Interactive Menu */}
           <div className={`mb-6 transition-all duration-500 delay-100 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
             <button 
               onClick={() => setIsMobileLogoMenuOpen(!isMobileLogoMenuOpen)}
               className={`w-full flex items-center justify-between p-2 rounded-2xl transition-all duration-300 active:scale-95 active:bg-slate-100 active:scale-95 ${isMobileLogoMenuOpen ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
             >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/30">
                      <Bot className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                    GogoTrip
                  </span>
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isMobileLogoMenuOpen ? 'rotate-180' : ''}`} />
             </button>

             {/* Mobile Logo Menu Options */}
             <div className={`
                overflow-hidden transition-all duration-300 ease-in-out
                ${isMobileLogoMenuOpen ? 'max-h-48 opacity-100 mt-2' : 'max-h-0 opacity-0'}
             `}>
               <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2 space-y-1">
              <button onClick={handleHelp} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors active:scale-95">
                     <HelpCircle className="w-4 h-4" />
                     {t('sidebar.helpSupport')}
                   </button>
                   <button onClick={handleAbout} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors active:scale-95">
                      <Info className="w-4 h-4" />
                      {t('sidebar.about')}
                   </button>
               </div>
             </div>
           </div>
           
           <nav className="space-y-2">
             {menuItems.map((item, index) => (
                <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{ animationDelay: `${index * 100}ms` }}
                className={`
                  w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 origin-left
                  ${isOpen ? 'animate-fade-in-up' : 'opacity-0'}
                  ${isActive(item.path)
                    ? 'bg-sky-50 text-sky-600 dark:bg-indigo-500/20 dark:text-indigo-300 font-bold shadow-sm scale-100' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200 font-medium'
                  }
                  active:scale-105 active:bg-slate-100 dark:active:bg-slate-800
                `}
              >
                <item.icon className={`w-6 h-6 ${isActive(item.path) ? 'text-sky-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                <span className="text-base">{t(item.labelKey)}</span>
              </button>
             ))}

              {isAdminUser && onSwitchToAdmin && (
                <button
                  onClick={onSwitchToAdmin}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 origin-left mt-4 bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300 font-bold active:scale-95"
                >
                  <ShieldCheck className="w-6 h-6" />
                  <span className="text-base">{t('sidebar.adminPortal')}</span>
                </button>
              )}

           </nav>
        </div>
      </aside>

      {/* Desktop Sidebar (Floating Dock Style - No Border) */}
      <div 
        className="hidden md:flex flex-col z-50 fixed left-4 top-4 bottom-4"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsLogoMenuOpen(false);
        }}
      >
        <div 
          className={`
            h-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl shadow-xl dark:shadow-black/50 rounded-[2.5rem] flex flex-col transition-all duration-500 ease-apple border-none
            ${isHovered ? 'w-[280px]' : 'w-[88px]'}
          `}
        >
          {/* Interactive Logo Area */}
          <div className="relative pt-6 px-4 mb-2" ref={logoMenuRef}>
             <button 
               onClick={() => setIsLogoMenuOpen(!isLogoMenuOpen)}
               className={`w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all duration-300 group ${isLogoMenuOpen ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
             >
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex-shrink-0 flex items-center justify-center shadow-lg shadow-sky-500/30 transition-transform duration-500 group-hover:scale-110">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                
                <div className={`flex flex-col items-start transition-all duration-300 delay-75 origin-left ${isHovered ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 -translate-x-4 scale-95 pointer-events-none fixed'}`}>
                  <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-none group-hover:scale-105 origin-left transition-transform">
                    GogoTrip
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mt-1">
                    v2.0 Beta
                  </span>
                </div>

                {isHovered && (
                   <ChevronRight className={`ml-auto w-4 h-4 text-slate-400 transition-transform duration-300 ${isLogoMenuOpen ? 'rotate-90' : ''}`} />
                )}
             </button>

             {/* Dropdown Menu for Logo */}
             <div className={`
                absolute top-full left-4 right-4 mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 origin-top z-50
                ${isLogoMenuOpen && isHovered ? 'opacity-100 scale-100 translate-y-0 max-h-40' : 'opacity-0 scale-95 -translate-y-2 max-h-0 pointer-events-none'}
             `}>
               <div className="p-1.5 space-y-0.5">
                   <button onClick={handleHelp} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <HelpCircle className="w-4 h-4" />
                      {t('sidebar.helpSupport')}
                   </button>
                   <button onClick={handleAbout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <Info className="w-4 h-4" />
                      {t('sidebar.about')}
                   </button>
                </div>
             </div>
          </div>

          {/* Navigation - Hidden Scrollbar */}
          <nav className="flex-1 px-4 space-y-2 py-2 overflow-y-auto scrollbar-none">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`
                    relative w-full flex items-center h-14 rounded-full transition-all duration-300 group
                    ${active 
                      ? 'bg-sky-50 dark:bg-indigo-500/20' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }
                  `}
                >
                  {/* Icon Container */}
                  <div className={`absolute left-0 w-[56px] flex justify-center items-center transition-all duration-300`}>
                     <Icon 
                        className={`w-6 h-6 transition-colors duration-300 ${
                          active 
                            ? 'text-sky-600 dark:text-indigo-400' 
                            : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'
                        }`} 
                     />
                  </div>
                  
                  {/* Label - Only visible when expanded */}
                  <span className={`
                    ml-[60px] text-sm font-medium whitespace-nowrap transition-all duration-300 ease-apple origin-left
                    ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}
                    ${active ? 'text-sky-600 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400'}
                    group-hover:scale-105
                  `}>
                    {t(item.labelKey)}
                  </span>

                  {/* Active Indicator Dot */}
                  {active && (
                    <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-sky-500 dark:bg-indigo-400 shadow-[0_0_10px_rgba(14,165,233,0.6)]" />
                  )}
                </button>
              );
            })}

            {isAdminUser && onSwitchToAdmin && (
              <>
                <div className="my-2 border-t border-slate-100 dark:border-slate-800/50 mx-2"></div>
                <button
                  onClick={onSwitchToAdmin}
                  className={`
                    relative w-full flex items-center h-14 rounded-full transition-all duration-300 group
                    hover:bg-violet-50 dark:hover:bg-violet-900/20
                  `}
                  title="Back to Admin Dashboard"
                >
                  <div className={`absolute left-0 w-[56px] flex justify-center items-center transition-all duration-300`}>
                     <ShieldCheck className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                  </div>
                  
                  <span className={`
                    ml-[60px] text-sm font-bold whitespace-nowrap transition-all duration-300 ease-apple origin-left
                    text-violet-700 dark:text-violet-300
                    ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}
                  `}>
                    {t('sidebar.adminPortal')}
                  </span>
                </button>
              </>
            )}

          </nav>

          {/* Bottom Area Spacer */}
          <div className="h-4" />
        </div>
      </div>
      
      {/* Spacer for Desktop Layout to prevent content overlap */}
      <div className="hidden md:block w-[120px] flex-shrink-0" />
    </>
  );
};

export default Sidebar;