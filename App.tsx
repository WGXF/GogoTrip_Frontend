
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import DashboardView from './components/DashboardView';
import ChatView from './components/ChatView';
import CalendarView from './components/CalendarView';
import TravelView from './components/TravelView';
import SchedulerView from './components/SchedulerView';
import TranslateView from './components/TranslateView';
import ExpensesView from './components/ExpensesView';
import LoginView from './components/LoginView';
import { ViewState } from './types';
import { MOCK_USER } from './constants';

const GREETINGS = [
  "Hello there",
  "Welcome back",
  "Good to see you",
  "Ready for your next trip?",
  "Let's explore",
];

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Initialize greeting with a random selection on mount
  const [greeting] = useState(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        // 发送请求检查登录状态，必须带上 credentials: 'include' 以便携带 Cookie
        const response = await fetch('/check_login_status', {
            credentials: 'include' 
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.logged_in) {
            setIsLoggedIn(true); // 如果后端确认已登录，更新状态
          }
        }
      } catch (error) {
        console.error("检查登录状态失败:", error);
      }
    };
    checkLoginStatus();
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const renderContent = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        return <DashboardView />;
      case ViewState.CHAT:
        return <ChatView />;
      case ViewState.TRAVEL:
        return <TravelView />;
      case ViewState.SCHEDULER:
        return <SchedulerView />;
      case ViewState.TRANSLATE:
        return <TranslateView />;
      case ViewState.EXPENSES:
        return <ExpensesView />;
      case ViewState.CALENDAR:
        return <CalendarView />;
      case ViewState.SETTINGS:
        return (
          <div className="flex items-center justify-center h-[calc(100vh-4rem)] text-slate-500 dark:text-slate-500">
            <div className="text-center">
              <h2 className="text-xl font-medium text-slate-700 dark:text-slate-300 mb-2">Settings</h2>
              <p>User preferences panel would go here.</p>
            </div>
          </div>
        );
      default:
        return <DashboardView />;
    }
  };

  const getTitle = () => {
    switch(currentView) {
      case ViewState.DASHBOARD: return `${greeting}, ${MOCK_USER.name.split(' ')[0]}`;
      case ViewState.CHAT: return 'AI Planner';
      case ViewState.TRAVEL: return 'My Trips';
      case ViewState.SCHEDULER: return 'Notes';
      case ViewState.TRANSLATE: return 'Live Translate';
      case ViewState.EXPENSES: return 'Expenses';
      case ViewState.CALENDAR: return 'Calendar';
      case ViewState.SETTINGS: return 'Settings';
      default: return 'GogoTrip';
    }
  }

  if (!isLoggedIn) {
    return (
      <div className={`${isDarkMode ? 'dark' : ''}`}>
        <LoginView onLogin={() => setIsLoggedIn(true)} />
      </div>
    );
  }

  return (
    <div className={`${isDarkMode ? 'dark' : ''} h-full`}>
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-sky-50 to-white dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex text-slate-900 dark:text-slate-200 font-sans transition-colors duration-300">
        <Sidebar 
          currentView={currentView} 
          onChangeView={(view) => {
            setCurrentView(view);
            setIsSidebarOpen(false); // Close sidebar on mobile when navigating
          }} 
          isOpen={isSidebarOpen}
        />
        
        <main className="flex-1 flex flex-col min-w-0 transition-all duration-300 relative">
          <TopBar 
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
            title={getTitle()}
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
          />
          
          <div className="flex-1 overflow-y-auto bg-transparent relative">
            {/* Background Gradient Mesh - Light Mode */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none dark:hidden">
               <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-white/40 to-transparent opacity-60"></div>
               <div className="absolute -top-24 -right-24 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl"></div>
            </div>

            {/* Background Gradient Mesh - Dark Mode */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none hidden dark:block">
               <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-900/10 to-transparent opacity-50"></div>
               <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl"></div>
            </div>
            
            <div className="relative z-10">
              {renderContent()}
            </div>
          </div>
        </main>
        
        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default App;
