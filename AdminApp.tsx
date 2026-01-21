import React, { useState } from 'react';
import { Sidebar } from './components/admin/Sidebar';
import { Header } from './components/admin/Header';
import { DashboardWidgets } from './components/admin/DashboardWidgets';
import { UserList } from './components/admin/UserList';
import { EmailVerificationList } from './components/admin/EmailVerificationList';
import { PlaceList } from './components/admin/PlaceList';
import { TripItemList } from './components/admin/TripItemList';
import { TripList } from './components/admin/TripList';
import { SettingsView } from './components/admin/SettingsView';
import { AdminInfoWebsite } from './components/admin/AdminInfoWebsite';
import { AdminSubscriptionView } from './components/admin/Adminsubscriptionview';
import { AdvertisementManagement } from './components/admin/Advertisementmanagement';
import { LoginHeroManagement } from './components/admin/LoginHeroManagement';
import NotificationManager from './components/admin/NotificationManager';
import TicketManager from './components/admin/TicketManager';
import AdminMessaging from './components/admin/AdminMessaging';
import AdminChatbox from './components/admin/AdminChatbox';
import { AdminVoucherManager } from './components/admin/AdminVoucherManager';
import { AdminPlanManager } from './components/admin/AdminPlanManager';
import InquiryManager from './components/admin/InquiryManager';
import BlogModeration from './components/admin/BlogModeration';
import BlogReportManager from './components/admin/BlogReportManager';
import { User, NavItem } from './types';
import { Menu } from 'lucide-react';

interface AdminAppProps {
  onSwitchToUser: () => void;
  onLogout: () => void;
  user: User;
}

const AdminApp: React.FC<AdminAppProps> = ({ user, onSwitchToUser, onLogout }) => {
  const [activeNav, setActiveNav] = useState<NavItem>('Home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleUpdateUser = (updatedData: Partial<User>) => {
    console.log('Admin updated profile:', updatedData);
  };

  // Render content area logic
  const renderContent = () => {
    switch (activeNav) {
      case 'Home':
        return <DashboardWidgets onNavigate={setActiveNav} />;
      
      case 'Info Blog':
        return <AdminInfoWebsite onNavigate={setActiveNav} />;
      
      case 'Blog Moderation':
        return <BlogModeration />;
      
      case 'Blog Reports':
        return <BlogReportManager />;
      
      case 'Subscription':
        return <AdminSubscriptionView />;
      
      case 'Advertisement':
        return <AdvertisementManagement />;
      
      case 'Login Hero':
        return <LoginHeroManagement />;
      
      // 🔥 New: Notification management
      case 'Notifications':
        return <NotificationManager />;

      case 'Admin Chat':
        return <AdminChatbox />;
      case 'Support Tickets':
        
        return <TicketManager />;

      case 'Admin Messages':
        return <AdminMessaging />;

      case 'Plan Managment':
        return <AdminPlanManager />;

      case 'Voucher Managment':
        return <AdminVoucherManager />;
      
      case 'Inquiries':
        return <InquiryManager />;
      
      case 'User':
        return <UserList />;
      
      case 'Email Verification':
        return <EmailVerificationList />;
      
      case 'Place':
        return <PlaceList />;
      
      case 'Trip':
        return <TripList />;
      
      case 'Trip Item':
        return <TripItemList />;
      
      case 'Settings':
        return <SettingsView user={user} onUpdateUser={handleUpdateUser} />;
      
      default:
        return (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm min-h-[400px] flex flex-col items-center justify-center animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">🚧</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">{activeNav}</h2>
            <p className="text-slate-500 max-w-sm mx-auto mb-6">
              This module is currently in development.
            </p>
            <button 
              onClick={() => setActiveNav('Home')}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans text-slate-600">
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 right-20 z-50">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-white rounded-lg shadow border border-slate-200 text-slate-700"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar */}
      <div className={`${isMobileMenuOpen ? 'flex fixed inset-0 z-40 bg-white/95 p-0' : 'hidden'} md:flex md:relative`}>
        <Sidebar 
          activeItem={activeNav} 
          onNavigate={(item) => { setActiveNav(item); setIsMobileMenuOpen(false); }} 
          onSwitchToUser={onSwitchToUser}
          onLogout={onLogout}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header user={user} onLogout={onLogout} onNavigate={setActiveNav}/>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
            {renderContent()}
          </div>
          
          <footer className="py-8 text-center text-xs text-slate-400">
            &copy; {new Date().getFullYear()} GogoTrip Admin Panel.
          </footer>
        </main>
      </div>
    </div>
  );
};

export default AdminApp;
