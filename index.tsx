import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AdminApp from './AdminApp';
import LoginView from './components/user/LoginView';
import { User } from './types'; 

import { API_BASE_URL } from './config';

const Root: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 1. 初始化检查登录状态
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/check_login_status`, {
          credentials: 'include', 
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.logged_in && data.user) {
            setUser(data.user);
            // 默认 admin 登录后进入后台，也可以改成 false 默认进入前台
            if (data.role === 'admin' || data.role === 'super_admin') {
                setIsAdminMode(true);
            }
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkLoginStatus();
  }, []);

  // 2. 统一登出逻辑
  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {
      console.error("Logout failed:", e);
    }
    // 清除前端状态
    setUser(null);
    setIsAdminMode(false);
    // 可选：强制刷新以确保所有状态清空
    window.location.reload(); 
  };

  // 3. 渲染逻辑
  if (isLoading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <LoginView onLogin={(u) => {
        setUser(u);
        // 登录时如果是管理员，自动进后台
        if (u.role === 'admin' || u.role === 'super_admin') {
            setIsAdminMode(true);
        }
    }} />;
  }

  // 4. Admin View
  if (isAdminMode) {
    return (
      <AdminApp 
        onSwitchToUser={() => setIsAdminMode(false)} 
        onLogout={handleLogout} 
      />
    );
  }

  // 5. User View
  return (
    <App 
        user={user} 
        onLogout={handleLogout}
        onSwitchToAdmin={() => setIsAdminMode(true)} // 必须传这个函数
    /> 
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Root not found");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);