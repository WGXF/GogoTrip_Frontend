import React from 'react';
import {
  LayoutDashboard, Users, MapPin, Plane, Calendar,
  CreditCard, Settings, LogOut, FileText, Image,
  Bell, Megaphone, ChevronRight, ArrowLeftRight,
  MessageCircle, Mail, Ticket, Inbox, BookOpen, Flag
} from 'lucide-react';
import { NavItem } from '../../types';
import LogoSvg from '@/icon/logo/logo.svg';

interface SidebarProps {
  activeItem: NavItem;
  onNavigate: (item: NavItem) => void;
  onSwitchToUser: () => void;
  onLogout: () => void;
}

interface MenuItem {
  id: NavItem;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeItem, 
  onNavigate, 
  onSwitchToUser,
  onLogout 
}) => {
  
  // Main menu items
  const mainMenuItems: MenuItem[] = [
    { id: 'Home', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'Info Blog', label: 'Info Blog', icon: <FileText size={20} /> },
    { id: 'Blog Moderation', label: 'Blog Moderation', icon: <BookOpen size={20} /> }, // Blog moderation
    { id: 'Blog Reports', label: 'Blog Reports', icon: <Flag size={20} /> }, // Blog reports
    { id: 'Notifications', label: 'Notifications', icon: <Bell size={20} /> },
    { id: 'Advertisement', label: 'Advertisements', icon: <Image size={20} /> },
    { id: 'Login Hero', label: 'Login Background', icon: <Image size={20} /> },
    { id: 'Subscription', label: 'Subscriptions', icon: <CreditCard size={20} /> },
    { id: 'Support Tickets', label: 'Support Tickets', icon: <MessageCircle size={20} /> },
    { id: 'Voucher Managment', label: 'Voucher Management', icon: <Ticket size={20} /> },
    { id: 'Plan Managment', label: 'Plan Management', icon: <Megaphone size={20} /> },
    { id: 'Admin Messages', label: 'Admin Messages', icon: <Mail size={20} /> },
    { id: 'Admin Chat', label: 'Admin Chat', icon: <MessageCircle size={20} /> },
    { id: 'Inquiries', label: 'Inquiries', icon: <Inbox size={20} /> },
  ];
  
  // Data management menu items
  const dataMenuItems: MenuItem[] = [
    { id: 'User', label: 'Users', icon: <Users size={20} /> },
    { id: 'Place', label: 'Places', icon: <MapPin size={20} /> },
    { id: 'Trip', label: 'Trips', icon: <Plane size={20} /> },
    { id: 'Trip Item', label: 'Trip Items', icon: <Calendar size={20} /> },
  ];
  
  // Settings menu items
  const settingsMenuItems: MenuItem[] = [
    { id: 'Settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  const renderMenuItem = (item: MenuItem) => {
    const isActive = activeItem === item.id;
    
    return (
      <button
        key={item.id}
        onClick={() => onNavigate(item.id)}
        className={`
          w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
          ${isActive 
            ? 'bg-blue-50 text-blue-600 shadow-sm' 
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }
        `}
      >
        <span className={`${isActive ? 'text-blue-500' : 'text-slate-400'} transition-colors`}>
          {item.icon}
        </span>
        <span className="flex-1 text-left">{item.label}</span>
        {item.badge && (
          <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full">
            {item.badge}
          </span>
        )}
        {isActive && (
          <ChevronRight size={16} className="text-blue-400" />
        )}
      </button>
    );
  };

  return (
    <aside className="w-64 h-screen bg-white border-r border-slate-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <img src={LogoSvg} alt="GogoTrip Logo" className="w-10 h-10 rounded-xl" />
          <div>
            <h1 className="text-lg font-bold text-slate-900">GogoTrip</h1>
            <p className="text-xs text-slate-400">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Main Menu */}
        <div>
          <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Main Menu
          </p>
          <div className="space-y-1">
            {mainMenuItems.map(renderMenuItem)}
          </div>
        </div>

        {/* Data Management */}
        <div>
          <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Data Management
          </p>
          <div className="space-y-1">
            {dataMenuItems.map(renderMenuItem)}
          </div>
        </div>

        {/* Settings */}
        <div>
          <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            System
          </p>
          <div className="space-y-1">
            {settingsMenuItems.map(renderMenuItem)}
          </div>
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-100 space-y-2">
        {/* Switch to User View */}
        <button
          onClick={onSwitchToUser}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <ArrowLeftRight size={20} className="text-slate-400" />
          Switch to User View
        </button>
        
        {/* Logout */}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
