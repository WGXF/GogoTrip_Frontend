import React, { useState, useRef, useEffect } from 'react';
import AdminSidebar from './components/admin/AdminSidebar';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminUsers from './components/admin/AdminUsers';
import AdminAIConfig from './components/admin/AdminAIConfig';
import AdminSponsors from './components/admin/AdminSponsors';
import AdminTrips from './components/admin/AdminTrips';
import AdminAccount from './components/admin/AdminAccount';
import AdminInfoWebsite from './components/admin/AdminInfoWebsite';
import { AdminViewState } from './types';
import { LogOut, ChevronDown, Monitor } from 'lucide-react';

interface AdminAppProps {
  onSwitchToUser: () => void;
  onLogout: () => void;
}

const AdminApp: React.FC<AdminAppProps> = ({ onSwitchToUser, onLogout }) => {
  const [currentView, setCurrentView] = useState<AdminViewState>(AdminViewState.DASHBOARD);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const adminMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target as Node)) {
        setIsAdminMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const renderContent = () => {
    switch (currentView) {
      case AdminViewState.DASHBOARD: return <AdminDashboard />;
      case AdminViewState.USERS: return <AdminUsers />;
      case AdminViewState.AI_CONFIG: return <AdminAIConfig />;
      case AdminViewState.SPONSORS: return <AdminSponsors />;
      case AdminViewState.TRIPS: return <AdminTrips />;
      case AdminViewState.ACCOUNT: return <AdminAccount />;
      case AdminViewState.INFO_WEBSITE: return <AdminInfoWebsite />;
      case AdminViewState.SETTINGS: return <div className="p-8 text-center text-slate-500">System Settings Panel</div>;
      default: return <div className="p-8 text-slate-500">View under construction: {currentView}</div>;
    }
  };

  const handleSignOut = () => {
    // 强制关闭菜单
    setIsAdminMenuOpen(false);
    if (window.confirm("Sign out of Admin Portal?")) {
      onLogout();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 select-none overflow-hidden">
      <AdminSidebar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onSwitchToUser={onSwitchToUser} // 确保侧边栏有 "Back to App" 按钮
      />
      
      <main className="flex-1 flex flex-col min-w-0 h-screen relative">
        {/* Admin Top Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 flex-shrink-0 z-20">
           <h2 className="text-xl font-bold text-slate-800 tracking-tight truncate">
             {currentView === AdminViewState.DASHBOARD ? 'System Overview' : 
              currentView === AdminViewState.USERS ? 'User Management' :
              currentView === AdminViewState.SPONSORS ? 'Sponsors & Ads' :
              currentView === AdminViewState.TRIPS ? 'Trips Database' :
              currentView === AdminViewState.ACCOUNT ? 'Revenue & Account' :
              currentView === AdminViewState.INFO_WEBSITE ? 'Manage Info Website' :
              currentView === AdminViewState.AI_CONFIG ? 'AI Model Configuration' : 'Admin Portal'}
           </h2>
           
           <div className="flex items-center gap-4">
                {/* Admin Profile Dropdown */}
                <div className="relative" ref={adminMenuRef}>
                  <button 
                    onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
                    className={`flex items-center gap-3 cursor-pointer p-1.5 rounded-xl transition-all ${isAdminMenuOpen ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
                  >
                     <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-md">AD</div>
                     <div className="hidden md:block text-left">
                       <p className="text-sm font-bold text-slate-900 leading-none">Admin User</p>
                       <p className="text-xs text-slate-500 font-medium leading-none mt-1">Super Admin</p>
                     </div>
                     <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isAdminMenuOpen ? 'rotate-180' : ''} hidden md:block`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isAdminMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-scale-in origin-top-right z-50">
                       <div className="p-3 border-b border-slate-100">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Signed in as</p>
                          <p className="text-sm font-bold text-slate-900 truncate">admin@gogotrip.com</p>
                       </div>
                       <div className="p-1.5 space-y-0.5">
                          <button 
                            onClick={() => { setCurrentView(AdminViewState.SETTINGS); setIsAdminMenuOpen(false); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors text-left"
                          >
                             <Monitor className="w-4 h-4 text-slate-400" />
                             System
                          </button>
                          
                          {/* 增加一个直接切换回用户界面的选项（备用） */}
                          <button 
                            onClick={() => { onSwitchToUser(); setIsAdminMenuOpen(false); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-left"
                          >
                             <Monitor className="w-4 h-4" />
                             Switch to App
                          </button>
                       </div>
                       <div className="p-1.5 border-t border-slate-100 bg-slate-50">
                          <button 
                             onClick={(e) => {
                                 e.stopPropagation(); // 防止冒泡
                                 handleSignOut();
                             }} 
                             className="w-full flex items-center gap-2 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left cursor-pointer"
                          >
                             <LogOut className="w-4 h-4" />
                             Sign Out
                          </button>
                       </div>
                    </div>
                  )}
                </div>
           </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50/50 p-6 md:p-8 custom-scrollbar">
           {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default AdminApp;