import React, { useState } from 'react';
import { User } from '../../types';
import { Mail, Lock, User as UserIcon, ArrowRight, CheckCircle2, AlertCircle, Loader2, Bot } from 'lucide-react';

// --- 配置后端地址 ---
import { API_BASE_URL } from '../../config';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

type AuthMode = 'LOGIN' | 'SIGNUP' | 'VERIFY';

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    verificationCode: ''
  });

  // ==========================================
  // 1. Google 登录 (真实逻辑)
  // ==========================================
  const handleGoogleLogin = () => {
    setLoading(true);
    setError(null);
    // 直接跳转到后端 OAuth 路由
    window.location.href = `${API_BASE_URL}/authorize`;
  };

  // ==========================================
  // 2. 邮箱注册 - 第一步：发送验证码
  // ==========================================
  const handleEmailSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.name) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      const data = await res.json();

      if (res.ok && data.status === 'success') {
        setMode('VERIFY');
        setSuccessMsg(`Verification code sent to ${formData.email}`);
      } else {
        setError(data.message || "Failed to send verification code.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Is the backend server running?");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 3. 邮箱注册 - 第二步：验证并创建账户
  // ==========================================
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.verificationCode.length < 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 这里的后端接口通常需要: email, code, 以及创建账户所需的 name, password
      const res = await fetch(`${API_BASE_URL}/auth/signup-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
            email: formData.email,
            code: formData.verificationCode,
            password: formData.password, // 注册时设置的密码
            name: formData.name
        })
      });
      const data = await res.json();

      if (res.ok && data.status === 'success') {
        // 注册并登录成功
        onLogin(data.user);
      } else {
        setError(data.message || "Verification failed. Invalid code.");
      }
    } catch (err) {
      setError("Network error during verification.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 4. 邮箱登录 (真实逻辑)
  // ==========================================
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
        const res = await fetch(`${API_BASE_URL}/auth/login-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // 关键：允许跨域 Cookie session
            body: JSON.stringify({ 
                email: formData.email, 
                password: formData.password 
            })
        });
        const data = await res.json();

        if (res.ok && data.status === 'success') {
            onLogin(data.user);
        } else {
            setError(data.message || 'Invalid email or password.');
        }
    } catch (err) {
        setError('Network error. Is backend running?');
    } finally {
        setLoading(false);
    }
  };

  // ==========================================
  // UI 渲染 (保持不变)
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left: Image Panel */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-slate-900">
         <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent to-black/80"></div>
         <img 
           src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=2000" 
           alt="Travel" 
           className="absolute inset-0 w-full h-full object-cover opacity-90 animate-scale-in"
         />
         <div className="relative z-20 flex flex-col justify-between h-full p-16 text-white">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/30">
                  <Bot className="w-6 h-6 text-white" />
               </div>
               <span className="text-xl font-bold tracking-tight">GogoTrip</span>
            </div>
            <div className="space-y-6">
              <h1 className="text-5xl font-black leading-tight tracking-tight">
                Plan your next <br/> 
                <span className="text-sky-400">great adventure</span> <br/>
                in seconds.
              </h1>
              <p className="text-lg text-slate-300 max-w-md font-medium">
                Join thousands of travelers using AI to craft the perfect itinerary, track expenses, and explore the world.
              </p>
            </div>
            <div className="text-sm text-slate-400 font-medium">
              © 2023 GogoTrip Inc. All rights reserved.
            </div>
         </div>
      </div>

      {/* Right: Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative">
         <div className="w-full max-w-md space-y-8 animate-fade-in-up">
            
            <div className="text-center lg:text-left">
               <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                 {mode === 'LOGIN' ? 'Welcome back' : mode === 'VERIFY' ? 'Verify Email' : 'Create an account'}
               </h2>
               <p className="text-slate-500 mt-2">
                 {mode === 'LOGIN' ? 'Enter your details to access your trips.' : mode === 'VERIFY' ? 'We sent a 6-digit code to your email.' : 'Start your journey with us today.'}
               </p>
            </div>

            {/* ERROR / SUCCESS ALERTS */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm font-medium animate-scale-in">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}
            {successMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3 text-emerald-600 text-sm font-medium animate-scale-in">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                {successMsg}
              </div>
            )}

            {mode === 'VERIFY' ? (
              // VERIFICATION FORM
              <form onSubmit={handleVerifySubmit} className="space-y-6">
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Verification Code</label>
                    <input 
                      type="text" 
                      placeholder="123456" 
                      value={formData.verificationCode}
                      onChange={(e) => setFormData({...formData, verificationCode: e.target.value.replace(/\D/g, '').slice(0,6)})}
                      className="w-full text-center text-3xl tracking-widest font-bold bg-slate-50 border border-slate-200 rounded-xl py-4 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                      autoFocus
                    />
                    <p className="text-center text-xs text-slate-400 mt-4">Did not receive code? <button type="button" onClick={handleEmailSignupSubmit} className="text-sky-600 font-bold hover:underline">Resend</button></p>
                 </div>
                 <button 
                  type="submit" 
                  disabled={loading || formData.verificationCode.length !== 6}
                  className="w-full py-4 bg-sky-600 text-white font-bold rounded-xl shadow-lg shadow-sky-600/30 hover:bg-sky-500 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Account'}
                </button>
              </form>
            ) : (
              // LOGIN / SIGNUP FORM
              <div className="space-y-6">
                
                {/* Google Button */}
                <button 
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full py-3.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-3 relative group overflow-hidden"
                >
                   <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 relative z-10" />
                   <span className="relative z-10">Continue with Google</span>
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-50 px-2 text-slate-400 font-bold">Or continue with email</span>
                  </div>
                </div>

                <form onSubmit={mode === 'LOGIN' ? handleLoginSubmit : handleEmailSignupSubmit} className="space-y-4">
                   {mode === 'SIGNUP' && (
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Full Name</label>
                        <div className="relative">
                           <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                           <input 
                              type="text" 
                              required
                              value={formData.name}
                              onChange={e => setFormData({...formData, name: e.target.value})}
                              placeholder="John Doe"
                              className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                           />
                        </div>
                     </div>
                   )}

                   <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Email Address</label>
                      <div className="relative">
                         <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                         <input 
                            type="email" 
                            required
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                            placeholder="you@example.com"
                            className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                         />
                      </div>
                   </div>

                   <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Password</label>
                      <div className="relative">
                         <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                         <input 
                            type="password" 
                            required
                            value={formData.password}
                            onChange={e => setFormData({...formData, password: e.target.value})}
                            placeholder="••••••••"
                            className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                         />
                      </div>
                   </div>
                   
                   {mode === 'LOGIN' && (
                     <div className="flex justify-end">
                       <button type="button" className="text-sm font-bold text-sky-600 hover:text-sky-500">Forgot password?</button>
                     </div>
                   )}

                   <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <>
                          {mode === 'LOGIN' ? 'Sign In' : 'Create Account'}
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                </form>

                <div className="text-center">
                   <p className="text-slate-500 font-medium text-sm">
                      {mode === 'LOGIN' ? "Don't have an account? " : "Already have an account? "}
                      <button 
                        onClick={() => {
                          setMode(mode === 'LOGIN' ? 'SIGNUP' : 'LOGIN');
                          setError(null);
                          setSuccessMsg(null);
                          setFormData({ ...formData, password: '', verificationCode: '' });
                        }}
                        className="text-sky-600 font-bold hover:underline"
                      >
                        {mode === 'LOGIN' ? 'Sign Up' : 'Log In'}
                      </button>
                   </p>
                </div>

              </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default LoginView;