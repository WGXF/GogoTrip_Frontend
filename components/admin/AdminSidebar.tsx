
import React from 'react';
import { AdminViewState } from '../../types';
import { 
  LayoutDashboard, 
  Users, 
  Map, 
  Bot, 
  Megaphone, 
  Wallet,
  Globe,
  ChevronLeft,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

interface AdminSidebarProps {
  currentView: AdminViewState;
  onChangeView: (view: AdminViewState) => void;
  isCollapsed: boolean;
  onToggle: () => void;
  onSwitchToUser: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ currentView, onChangeView, isCollapsed, onToggle, onSwitchToUser }) => {
  const menuItems = [
    { id: AdminViewState.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: AdminViewState.USERS, label: 'Users', icon: Users },
    { id: AdminViewState.SPONSORS, label: 'Sponsors', icon: Megaphone },
    { id: AdminViewState.TRIPS, label: 'Trips Database', icon: Map },
    { id: AdminViewState.ACCOUNT, label: 'Account', icon: Wallet },
    { id: AdminViewState.AI_CONFIG, label: 'AI Engine', icon: Bot },
    { id: AdminViewState.INFO_WEBSITE, label: 'Manage Info Website', icon: Globe },
  ];

  const handleInfoWebsite = () => {
    window.open('https://example.com/info', '_blank');
  };

  return (
    <aside 
      className={`
        bg-white text-slate-600 flex-shrink-0 h-screen flex flex-col shadow-xl z-30 transition-all duration-300 ease-in-out border-r border-slate-100
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Admin Logo & Toggle Trigger */}
      <div 
        onClick={onToggle}
        className="h-16 flex items-center px-4 border-b border-slate-100 bg-white cursor-pointer hover:bg-slate-50 transition-colors group relative"
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
         <div className={`flex items-center gap-3 w-full ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex-shrink-0 flex items-center justify-center shadow-lg shadow-violet-600/30 group-hover:scale-105 transition-transform">
               <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            
            {!isCollapsed && (
              <div className="flex-1 min-w-0 transition-opacity duration-200">
                 <h1 className="text-slate-800 font-bold tracking-tight truncate">GogoTrip</h1>
                 <span className="text-[10px] uppercase font-bold text-violet-600 tracking-wider block truncate">Admin Portal</span>
              </div>
            )}

            {!isCollapsed && (
               <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
            )}
         </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
         {menuItems.map(item => (
            <button
               key={item.id}
               onClick={() => onChangeView(item.id)}
               className={`
                 w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group relative
                 ${currentView === item.id 
                   ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' 
                   : 'hover:bg-violet-50 hover:text-violet-700 text-slate-500'
                 }
                 ${isCollapsed ? 'justify-center' : ''}
               `}
            >
               <item.icon className={`w-5 h-5 flex-shrink-0 ${currentView === item.id ? 'text-white' : 'text-slate-400 group-hover:text-violet-600'}`} />
               
               {!isCollapsed && (
                 <span className="truncate transition-opacity duration-200">{item.label}</span>
               )}

               {/* Tooltip for collapsed state */}
               {isCollapsed && (
                 <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                   {item.label}
                 </div>
               )}
            </button>
         ))}
      </nav>

      {/* Footer Navigation */}
      <div className="p-4 border-t border-slate-100 bg-white">
         <div className="space-y-1">
            <button 
                onClick={onSwitchToUser}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors text-sm font-medium group
                  ${isCollapsed ? 'justify-center' : ''}
                `}
                title="Go to User Website"
            >
                <ExternalLink className="w-4 h-4 flex-shrink-0 group-hover:text-violet-500" />
                {!isCollapsed && <span className="truncate">User Website</span>}
            </button>
            <button 
                onClick={handleInfoWebsite}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors text-sm font-medium group
                  ${isCollapsed ? 'justify-center' : ''}
                `}
                title="Go to Info Website"
            >
                <Globe className="w-4 h-4 flex-shrink-0 group-hover:text-violet-500" />
                {!isCollapsed && <span className="truncate">Info Website</span>}
            </button>
         </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
