
import React, { useState } from 'react';
import { Bot, Mail, Lock, User, ArrowRight } from 'lucide-react';

interface LoginViewProps {
  onLogin: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 1500);
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    window.location.href = '/authorize';
  };

  return (
    <div className="min-h-screen w-full flex bg-white dark:bg-slate-950 transition-colors duration-300 font-sans">
      {/* Left Panel - Hero Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 to-slate-900/60 z-10" />
        <img 
          src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=1600" 
          alt="Travel" 
          className="absolute inset-0 w-full h-full object-cover animate-scale-in transition-transform duration-[20s] hover:scale-110" 
        />
        
        <div className="relative z-20 flex flex-col justify-between h-full p-16 text-white">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl">
                <Bot className="w-7 h-7 text-white" />
             </div>
             <span className="text-2xl font-bold tracking-tight">GogoTrip</span>
          </div>
          
          <div className="space-y-6 max-w-lg">
            <h1 className="text-5xl font-bold leading-tight tracking-tight">
              {isSignUp ? "Start your journey today." : "Welcome back, explorer."}
            </h1>
            <p className="text-lg text-blue-50/80 leading-relaxed font-medium">
              Plan your next adventure with AI-powered itineraries, smart scheduling, and seamless travel management.
            </p>
          </div>

          <div className="flex items-center gap-6 text-sm font-medium text-white/60">
            <span>© 2024 GogoTrip Inc.</span>
            <div className="flex items-center gap-6">
               <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
               <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-md space-y-8 animate-fade-in-up">
           <div className="text-center lg:text-left">
             <div className="lg:hidden flex justify-center mb-6">
               <div className="w-14 h-14 rounded-2xl bg-sky-600 flex items-center justify-center shadow-lg shadow-sky-600/30">
                 <Bot className="w-8 h-8 text-white" />
               </div>
             </div>
             <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
               {isSignUp ? "Create an account" : "Sign in to your account"}
             </h2>
             <p className="mt-3 text-slate-500 dark:text-slate-400 font-medium">
               {isSignUp ? "Enter your details below to get started" : "Enter your email below to access your account"}
             </p>
           </div>

           <div className="space-y-5">
             <button 
                onClick={handleGoogleLogin}
                type="button"
                className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-4 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md active:scale-[0.98] group"
             >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
               Continue using Google
             </button>

             <div className="relative">
               <div className="absolute inset-0 flex items-center">
                 <span className="w-full border-t border-slate-200 dark:border-slate-800" />
               </div>
               <div className="relative flex justify-center text-xs uppercase">
                 <span className="bg-slate-50 dark:bg-slate-950 px-4 text-slate-400 font-bold tracking-wider">
                   Or continue with email
                 </span>
               </div>
             </div>

             <form onSubmit={handleSubmit} className="space-y-4">
               {isSignUp && (
                 <div className="space-y-1.5">
                   <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                   <div className="relative group">
                     <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                     <input 
                       type="text" 
                       value={name}
                       onChange={(e) => setName(e.target.value)}
                       className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 dark:focus:border-indigo-500 transition-all shadow-sm"
                       placeholder="Alex Chen"
                       required
                     />
                   </div>
                 </div>
               )}

               <div className="space-y-1.5">
                 <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Email</label>
                 <div className="relative group">
                   <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                   <input 
                     type="email" 
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 dark:focus:border-indigo-500 transition-all shadow-sm"
                     placeholder="name@example.com"
                     required
                   />
                 </div>
               </div>

               <div className="space-y-1.5">
                 <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Password</label>
                 <div className="relative group">
                   <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                   <input 
                     type="password" 
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 dark:focus:border-indigo-500 transition-all shadow-sm"
                     placeholder="••••••••"
                     required
                   />
                 </div>
               </div>

               <button 
                 type="submit"
                 disabled={isLoading}
                 className="w-full bg-sky-600 hover:bg-sky-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-xl py-4 text-sm font-bold shadow-lg shadow-sky-600/20 dark:shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-8 hover:-translate-y-0.5 hover:shadow-xl"
               >
                 {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 ) : (
                    <>
                      {isSignUp ? "Create Account" : "Sign In"}
                      <ArrowRight className="w-4 h-4" />
                    </>
                 )}
               </button>
             </form>
           </div>
           
           <p className="text-center text-sm text-slate-500 dark:text-slate-400 font-medium">
             {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
             <button 
               onClick={() => setIsSignUp(!isSignUp)}
               className="text-sky-600 dark:text-indigo-400 font-bold hover:underline transition-all"
             >
               {isSignUp ? "Sign In" : "Sign Up"}
             </button>
           </p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
