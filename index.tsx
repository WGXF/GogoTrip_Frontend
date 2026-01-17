import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import AdminApp from './AdminApp';
import LoginView from './components/user/LoginView';
import { SocketProvider } from './hooks/useSocket';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { User } from './types';
import { API_BASE_URL } from './config';

// 🔥 Import standardized role utilities
import { normalizeRole, isAdmin, UserRole } from './role-utils';

// 🌐 Import i18n configuration (initializes i18next)
import './i18n';
import { initLanguageFromProfile } from './i18n';

const Root: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 1️⃣ Initialize login status check
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/check_login_status`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.logged_in && data.user) {
            // 🔥 Normalize the role before setting user
            const normalizedUser = {
              ...data.user,
              role: normalizeRole(data.user.role || data.role)
            };
            setUser(normalizedUser);
            
            // 🌐 Initialize language from user profile
            initLanguageFromProfile(normalizedUser.preferredLanguage);
            
            // 🔥 Use standardized role check
            if (isAdmin(normalizedUser.role)) {
              setIsAdminMode(true);
            }
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  // 2️⃣ Logout logic
  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout request failed', error);
    } finally {
      setUser(null);
      setIsAdminMode(false);
      window.location.href = '/';
    }
  };

  // 3️⃣ Loading
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  // 4️⃣ Not logged in → Login
  if (!user) {
    return (
      <GoogleReCaptchaProvider
        reCaptchaKey="6LewjjUsAAAAAKFHuvd4JdyTZ06TK14FTHZSZSTF"
        scriptProps={{
          async: false,
          defer: false,
          appendTo: 'head',
        }}
      >
        <LoginView
          onLogin={(u) => {
            // 🔥 Normalize role on login
            const normalizedUser = {
              ...u,
              role: normalizeRole(u.role)
            };
            setUser(normalizedUser);
            
            // 🌐 Initialize language from user profile
            initLanguageFromProfile(normalizedUser.preferredLanguage);
            
            // 🔥 Use standardized role check
            if (isAdmin(normalizedUser.role)) {
              setIsAdminMode(true);
            }
          }}
        />
      </GoogleReCaptchaProvider>
    );
  }

  // 5️⃣ Main App View
  return (
    <SocketProvider userId={user.id} isAuthenticated={!!user}>
      {isAdminMode ? (
        <AdminApp
          user={user}
          onSwitchToUser={() => setIsAdminMode(false)}
          onLogout={handleLogout}
        />
      ) : (
        <App
          user={user}
          onLogout={handleLogout}
          onSwitchToAdmin={() => setIsAdminMode(true)}
        />
      )}
    </SocketProvider>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root not found');

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  </React.StrictMode>
);
