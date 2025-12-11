import React, { useState } from 'react';
import Sidebar from './components/user/Sidebar';
import TopBar from './components/user/TopBar';
import DashboardView from './components/user/DashboardView';
import ChatView from './components/user/ChatView';
import CalendarView from './components/user/CalendarView';
import TravelView from './components/user/TravelView';
import SchedulerView from './components/user/SchedulerView';
import TranslateView from './components/user/TranslateView';
import ExpensesView from './components/user/ExpensesView';
import SettingsView from './components/user/SettingsView';
import BillingView from './components/user/BillingView';
import { ViewState, User, Notification } from './types';


// Greeting variants
const GREETINGS = [
  "Hello there",
  "Welcome back",
  "Good to see you",
  "Ready for your next trip?",
  "Let's explore",
];

// [修复] 接口定义：增加 onSwitchToAdmin
interface AppProps {
  user: User;           
  onLogout: () => void; 
  onSwitchToAdmin: () => void; // 新增：接收切换到后台的函数
}

const App: React.FC<AppProps> = ({ user, onLogout, onSwitchToAdmin }) => {
  
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // 模拟通知数据
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, text: "Flight JL405 departs in 24 hours.", time: "1h ago", unread: true },
    { id: 2, text: "New suggestion from AI Planner.", time: "2h ago", unread: true },
    { id: 3, text: "Hotel check-in confirmed.", time: "1d ago", unread: false },
  ]);
  
  const [greeting] = useState(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);

  // Handlers
  const handleSignOut = () => {
    // 使用 window.confirm 确保用户确认
    if (window.confirm("Are you sure you want to sign out?")) {
      onLogout(); 
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleUpdateUser = (updatedUser: Partial<User>) => {
    console.log("Update user request:", updatedUser);
  };

  const getTitle = () => {
    switch(currentView) {
      case ViewState.DASHBOARD: return `${greeting}, ${user.name ? user.name.split(' ')[0] : 'Traveler'}`;
      case ViewState.CHAT: return 'AI Planner';
      case ViewState.TRAVEL: return 'My Trips';
      case ViewState.SCHEDULER: return 'Notes';
      case ViewState.TRANSLATE: return 'Live Translate';
      case ViewState.EXPENSES: return 'Expenses';
      case ViewState.CALENDAR: return 'Calendar';
      case ViewState.SETTINGS: return 'Account Settings';
      case ViewState.BILLING: return 'Billing & Subscription';
      default: return 'GogoTrip';
    }
  }

  const renderContent = () => {
    switch (currentView) {
      case ViewState.DASHBOARD: return <DashboardView onNavigate={setCurrentView} />;
      case ViewState.CHAT: return <ChatView user={user} />;
      case ViewState.TRAVEL: return <TravelView />;
      case ViewState.SCHEDULER: return <SchedulerView />;
      case ViewState.TRANSLATE: return <TranslateView />;
      case ViewState.EXPENSES: return <ExpensesView />;
      case ViewState.CALENDAR: return <CalendarView />;
      case ViewState.SETTINGS: return <SettingsView user={user} onUpdateUser={handleUpdateUser} />;
      case ViewState.BILLING: return <BillingView user={user} onUpdateUser={handleUpdateUser} />;
      default: return <DashboardView onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className={`${isDarkMode ? 'dark' : ''} h-full`}>
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-sky-50 to-white dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex text-slate-900 dark:text-slate-200 font-sans transition-colors duration-300 select-none">
        
        <Sidebar 
          currentView={currentView} 
          onChangeView={(view) => {
            setCurrentView(view);
            setIsSidebarOpen(false);
          }} 
          isOpen={isSidebarOpen}
          // [修复] 传递正确的权限判断
          isAdminUser={user.role === 'admin' || user.role === 'super_admin'}
          // [修复] 此时 onSwitchToAdmin 已经是有效的函数了
          onSwitchToAdmin={onSwitchToAdmin} 
        />
        
        <main className="flex-1 flex flex-col min-w-0 transition-all duration-300 relative">
          <TopBar 
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
            title={getTitle()}
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
            user={user}
            onLogout={handleSignOut} 
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