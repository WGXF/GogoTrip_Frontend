import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle, LogOut } from 'lucide-react';

import { ToastProvider } from './contexts/ToastContext';
import Sidebar from './components/user/Sidebar';
import TopBar from './components/user/TopBar';
import { TicketListPage, TicketChatPage } from './components/user/SupportTicket';
import DashboardView from './components/user/DashboardView';
import ChatView from './components/user/ChatView';
import CalendarView from './components/user/CalendarView';
import TravelView from './components/user/TravelView';
import SchedulerView from './components/user/SchedulerView';
import TranslateView from './components/user/TranslateView';
import ExpensesView from './components/user/ExpensesView';
import SettingsView from './components/user/SettingsView';
import BillingView from './components/user/BillingView';
import ReceiptView from './components/user/ReceiptView';
import AnnouncementPage, {
  AnnouncementListPage,
} from './components/user/AnnouncementPage';
import BlogView from './components/user/BlogView';
import SharedChatView from './components/user/SharedChatView';

import { User, Notification } from './types';
import { API_BASE_URL } from './config';

// 🔥 Import standardized role utilities
import { isAdmin, UserRole } from './role-utils';

interface AppProps {
  user: User;
  onLogout: () => void;
  onSwitchToAdmin: () => void;
}

const App: React.FC<AppProps> = ({ user, onLogout, onSwitchToAdmin }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // =========================
  // Notifications
  // =========================
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/notifications/user`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) setNotifications(data.notifications || []);
        }
      } catch (e) {
        console.error('Failed to fetch notifications', e);
      }
    };

    fetchNotifications();
  }, []);

  // =========================
  // UI Handlers
  // =========================
  const toggleTheme = () => setIsDarkMode(v => !v);
  const handleSignOutClick = () => setIsLogoutModalOpen(true);

  const confirmSignOut = () => {
    setIsLogoutModalOpen(false);
    onLogout();
  };

  const handleUpdateUser = (updated: Partial<User>) => {
    console.log('Update user:', updated);
  };

  // =========================
  // Router bridge
  // Sidebar / TopBar → router
  // =========================
  const handleNavigate = (path: string) => {
    navigate(path);
    setIsSidebarOpen(false);
  };

  const normalizedUser: User | null = user
  ? {
      ...user,
      subscription:
        user.subscription ??
        (user.isPremium
          ? { status: 'active' }
          : undefined),
    }
  : null;

  // 🔥 Use standardized role check
  const isAdminUser = isAdmin(user.role);

  // =========================
  // Render
  // =========================
  return (
    <ToastProvider>
    <div className={`${isDarkMode ? 'dark' : ''} h-full`}>
      <div className="min-h-screen flex bg-gradient-to-br from-blue-100 via-sky-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-200">

        <Sidebar
          isOpen={isSidebarOpen}
          isAdminUser={isAdminUser}
          onSwitchToAdmin={onSwitchToAdmin}
          onChangeView={handleNavigate}
        />

        <main className="flex-1 flex flex-col min-w-0 relative">
          <TopBar
            onToggleSidebar={() => setIsSidebarOpen(v => !v)}
            title="GogoTrip"
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
            user={user}
            notifications={notifications}
            onLogout={handleSignOutClick}
            onNavigate={handleNavigate}
          />

          <div className="flex-1 overflow-y-auto relative pt-28">
            <div className="relative">
              <Routes>
                <Route path="/" element={<DashboardView user={normalizedUser} />} />
                <Route path="/chat" element={<ChatView user={normalizedUser} />} />
                <Route path="/chat/:conversationId" element={<ChatView user={normalizedUser} />} />
                <Route path="/shared/:shareToken" element={<SharedChatView />} />
                <Route path="/trips" element={<TravelView user={normalizedUser} />} />
                <Route path="/blogs" element={<BlogView user={normalizedUser} />} />
                <Route path="/calendar" element={<CalendarView user={normalizedUser} />} />
                <Route path="/scheduler" element={<SchedulerView user={normalizedUser} />} />
                <Route path="/translate" element={<TranslateView user={normalizedUser} />} />
                <Route path="/expenses" element={<ExpensesView user={normalizedUser} />} />
                <Route path="/support" element={<TicketListPage user={normalizedUser} />} />
                <Route path="/support/:id" element={<TicketChatPage user={normalizedUser} />} />

                <Route
                  path="/settings"
                  element={
                    <SettingsView
                      user={user}
                      onUpdateUser={handleUpdateUser}
                    />
                  }
                />
                <Route
                  path="/billing"
                  element={
                    <BillingView
                      user={user}
                      onUpdateUser={handleUpdateUser}
                      onNavigate={handleNavigate}
                    />
                  }
                />
                <Route path="/receipt" element={<ReceiptView />} />

                <Route
                  path="/announcements"
                  element={<AnnouncementListPage />}
                />
                <Route
                  path="/announcements/:id"
                  element={<AnnouncementPage />}
                />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </div>
        </main>

        {/* Mobile overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Logout Modal */}
        {isLogoutModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                  <AlertTriangle />
                </div>
                <h3 className="text-lg font-bold mb-2">Sign Out</h3>
                <p className="text-sm text-slate-500 mb-6">
                  Are you sure you want to sign out?
                </p>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setIsLogoutModalOpen(false)}
                    className="flex-1 px-4 py-2 rounded-xl bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmSignOut}
                    className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white flex items-center justify-center gap-2"
                  >
                    <LogOut size={18} />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
    </ToastProvider>
  );
};

export default App;
