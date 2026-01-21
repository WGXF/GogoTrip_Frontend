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
import i18n, { initLanguageFromProfile, changeLanguage, SupportedLanguage } from './i18n';

// =========================
// Hibiscus background
// =========================
const HibiscusLineArt = ({ className }: { className?: string }) => (
  // @ts-ignore
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    stroke="currentColor"
    strokeWidth="0.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Non-overlapping Petals */}
    <g opacity="0.8">
      {/* Top Petal */}
      <path d="M50 45 C55 35 65 25 50 10 C35 25 45 35 50 45Z" />
      {/* Top Right Petal */}
      <path d="M55 48 C65 45 80 35 90 50 C80 65 65 55 55 48Z" />
      {/* Bottom Right Petal */}
      <path d="M53 53 C60 63 65 85 45 90 C35 80 45 65 53 53Z" />
      {/* Bottom Left Petal */}
      <path d="M47 53 C40 65 15 85 10 65 C20 50 40 50 47 53Z" />
      {/* Top Left Petal */}
      <path d="M45 48 C35 45 10 35 15 20 C30 15 40 35 45 48Z" />
    </g>

    {/* Petal Fills */}
    <g fill="currentColor" fillOpacity="0.03">
      <path d="M50 45 C55 35 65 25 50 10 C35 25 45 35 50 45Z" stroke="none" />
      <path d="M55 48 C65 45 80 35 90 50 C80 65 65 55 55 48Z" stroke="none" />
      <path d="M53 53 C60 63 65 85 45 90 C35 80 45 65 53 53Z" stroke="none" />
      <path d="M47 53 C40 65 15 85 10 65 C20 50 40 50 47 53Z" stroke="none" />
      <path d="M45 48 C35 45 10 35 15 20 C30 15 40 35 45 48Z" stroke="none" />
    </g>

    {/* Vein Accents */}
    <g strokeWidth="0.4" opacity="0.3">
      <path d="M50 45 L50 25" />
      <path d="M55 48 L75 42" />
      <path d="M53 53 L58 75" />
      <path d="M47 53 L25 65" />
      <path d="M45 48 L25 35" />
    </g>

    {/* The Iconic Long Stamen */}
    <g>
      <path d="M50 50 Q65 35 85 15" strokeWidth="1.2" />
      <circle cx="85" cy="15" r="1.5" fill="currentColor" stroke="none" />
      {/* Minute Pollen Details */}
      <g strokeWidth="0.5" opacity="0.6">
        <path d="M78 22 L80 20" />
        <path d="M82 18 L84 16" />
        <path d="M85 12 L87 10" />
      </g>
    </g>
  </svg>
);

interface AppProps {
  user: User;
  onLogout: () => void;
  onSwitchToAdmin: () => void;
  onUpdateUser: (updated: Partial<User>) => void;
}

const App: React.FC<AppProps> = ({ user, onLogout, onSwitchToAdmin, onUpdateUser }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // =========================
  // 🆕 Language Sync on Mount / User Change
  // =========================
  useEffect(() => {
    // 1. Force read from localStorage FIRST to prevent flash
    const localLang = localStorage.getItem('gogotrip_language');
    if (localLang && ['en', 'zh', 'ms'].includes(localLang)) {
      if (localLang !== i18n.language) {
        changeLanguage(localLang as SupportedLanguage);
      }
    }

    // 2. Sync with user profile if available (backend is source of truth)
    if (user?.preferredLanguage) {
      if (user.preferredLanguage !== localLang) {
         initLanguageFromProfile(user.preferredLanguage);
      }
    }
  }, [user]);

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

  // handleUpdateUser is now passed as a prop from index.tsx

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
      <div className="min-h-screen flex bg-gradient-to-br from-blue-100 via-sky-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-200 relative overflow-hidden">

        {/* Hibiscus Background Decorations */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {/* Top Right */}
          <HibiscusLineArt className="absolute -top-20 -right-20 w-96 h-96 text-sky-400/20 dark:text-sky-600/10 rotate-12" />

          {/* Bottom Left */}
          <HibiscusLineArt className="absolute -bottom-32 -left-32 w-[500px] h-[500px] text-blue-400/15 dark:text-blue-600/10 -rotate-45" />

          {/* Top Left (smaller) */}
          <HibiscusLineArt className="absolute top-32 left-12 w-64 h-64 text-sky-300/20 dark:text-sky-700/10 rotate-90" />

          {/* Bottom Right (smaller) */}
          <HibiscusLineArt className="absolute bottom-20 right-24 w-72 h-72 text-blue-300/15 dark:text-blue-700/10 -rotate-12" />

          {/* Center (very subtle) */}
          <HibiscusLineArt className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] text-sky-200/10 dark:text-sky-800/5 rotate-45" />
        </div>

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
                <Route path="/translates" element={<TranslateView user={normalizedUser} />} />
                <Route path="/expenses" element={<ExpensesView user={normalizedUser} />} />
                <Route path="/support" element={<TicketListPage user={normalizedUser} />} />
                <Route path="/support/:id" element={<TicketChatPage user={normalizedUser} />} />

                <Route
                  path="/settings"
                  element={
                    <SettingsView
                      user={user}
                      onUpdateUser={onUpdateUser}
                    />
                  }
                />
                <Route
                  path="/billing"
                  element={
                    <BillingView
                      user={user}
                      onUpdateUser={onUpdateUser}
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
