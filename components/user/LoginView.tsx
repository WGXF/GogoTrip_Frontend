import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User } from '../../types';
import { 
  Mail, Lock, User as UserIcon, ArrowRight, CheckCircle2, 
  AlertCircle, Loader2, Check, X, Eye, EyeOff, RefreshCw,
  Clock, Hash, Shield, Zap, PartyPopper, Sparkles
} from 'lucide-react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../../config';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

type AuthMode = 'LOGIN' | 'SIGNUP' | 'VERIFY' | 'FORGOT' | 'FORGOT_VERIFY' | 'VERIFYING' | 'VERIFIED';

// Verification configuration interface
interface VerificationConfig {
  codeType: 'numeric' | 'alphanumeric' | 'alpha';
  codeLength: 4 | 6 | 8;
  expiryMinutes: 5 | 10 | 15;
}

// Hero configuration interface
interface HeroConfig {
  displayMode: 'single' | 'carousel' | 'fade';
  transitionInterval: number;
  autoPlay: boolean;
  imageSource: string;
  enableGradient: boolean;
  images: { url: string; alt: string; isProxy?: boolean }[];
  title: string | null;
  subtitle: string | null;
  description: string | null;
}

// Password validation interface
interface PasswordCriteria {
  hasLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

// ==========================================
// Hero Section Component
// ==========================================
const HeroSection: React.FC<{ config: HeroConfig | null }> = React.memo(({ config }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const getImageUrl = (url: string, isProxy?: boolean) => {
    if (isProxy || url.startsWith('/proxy_image')) {
      return `${API_BASE_URL}${url}`;
    }
    return url;
  };

  useEffect(() => {
    if (!config || config.displayMode === 'single' || !config.autoPlay) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % config.images.length);
    }, config.transitionInterval * 1000);
    
    return () => clearInterval(interval);
  }, [config]);

  if (!config) {
    return (
      <div className="hidden lg:flex lg:w-1/2 flex-shrink-0 relative overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-slate-400 text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:flex lg:w-1/2 flex-shrink-0 relative overflow-hidden">
      {config.displayMode === 'single' ? (
        <img
          src={getImageUrl(config.images[0].url, config.images[0].isProxy)}
          alt={config.images[0].alt}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        config.images.map((img, idx) => (
          <img
            key={`hero-img-${idx}`}
            src={getImageUrl(img.url, img.isProxy)}
            alt={img.alt}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              idx === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))
      )}
      
      {config.enableGradient && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-slate-900/40 to-transparent"></div>
      )}
      
      <div className="absolute inset-0 flex flex-col items-start justify-end p-16 text-white z-10">
        {config.title && (
          <h1 className="text-5xl font-black leading-tight mb-4 max-w-xl drop-shadow-2xl">
            {config.title}
          </h1>
        )}
        {config.description && (
          <p className="text-lg text-white/90 max-w-md leading-relaxed drop-shadow-lg">
            {config.description}
          </p>
        )}
      </div>
    </div>
  );
});

HeroSection.displayName = 'HeroSection';

// ==========================================
// 🔥 Verification Success Page
// ==========================================
const VerificationSuccessPage: React.FC<{ email: string; onRedirect: () => void }> = ({ email, onRedirect }) => {
  const { t } = useTranslation('auth');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeout(onRedirect, 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onRedirect]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="max-w-md w-full">
        {/* Success animation */}
        <div className="text-center mb-8 animate-in zoom-in-95 fade-in duration-500">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full blur-3xl opacity-30 animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 w-32 h-32 rounded-full flex items-center justify-center shadow-2xl">
              <CheckCircle2 className="w-16 h-16 text-white animate-in zoom-in duration-300 delay-200" />
            </div>
            <div className="absolute -top-2 -right-2 animate-in zoom-in duration-300 delay-300">
              <Sparkles className="w-8 h-8 text-yellow-400" />
            </div>
            <div className="absolute -bottom-2 -left-2 animate-in zoom-in duration-300 delay-400">
              <PartyPopper className="w-8 h-8 text-pink-400" />
            </div>
          </div>
        </div>

        {/* Success message */}
        <div className="text-center space-y-4 animate-in fade-in-up duration-500 delay-300">
          <h1 className="text-4xl font-black text-slate-900 mb-2">
            {t('verification.verified')} 🎉
          </h1>
          <p className="text-lg text-slate-600 font-medium">
            Welcome aboard! Your account has been successfully verified.
          </p>
          
          <div className="p-4 bg-white/80 backdrop-blur-sm border border-green-200 rounded-xl">
            <p className="text-sm text-slate-700">
              <strong className="text-green-700">{email}</strong> is now verified and ready to go!
            </p>
          </div>
        </div>

        {/* Redirect countdown */}
        <div className="mt-8 text-center animate-in fade-in duration-500 delay-500">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-full shadow-lg">
            <Loader2 className="w-5 h-5 text-green-600 animate-spin" />
            <span className="text-sm font-medium text-slate-700">
              {t('verification.redirecting')} <span className="text-green-600 font-bold text-lg">{countdown}</span>s...
            </span>
          </div>
        </div>

        {/* Manual redirect button */}
        <div className="mt-6 text-center animate-in fade-in duration-500 delay-700">
          <button
            onClick={onRedirect}
            className="text-sm text-slate-600 hover:text-slate-900 font-medium underline decoration-dotted underline-offset-4"
          >
            Skip waiting and go now →
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 🔥 Verifying Page (loading state)
// ==========================================
const VerifyingPage: React.FC = () => {
  const { t } = useTranslation('auth');
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-8 animate-in zoom-in-95 fade-in duration-500">
          <div className="relative inline-block">
            <div className="w-32 h-32 rounded-full border-8 border-blue-100 border-t-blue-600 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className="w-12 h-12 text-blue-600 animate-pulse" />
            </div>
          </div>
        </div>

        <div className="space-y-4 animate-in fade-in-up duration-500 delay-200">
          <h2 className="text-3xl font-black text-slate-900">
            {t('verification.verifying')}
          </h2>
          <p className="text-lg text-slate-600">
            Please wait while we confirm your account.
          </p>
          
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500 mt-6">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 🔥 NEW: Verify Email Page (waiting for verification)
// ==========================================
const VerifyEmailPage: React.FC<{
  email: string;
  token: string;
  verificationConfig: VerificationConfig;
  onVerified: (user: User) => void;
  onResend: () => Promise<{ success: boolean; token?: string; message?: string }>;
  onBack: () => void;
}> = ({ email, token, verificationConfig, onVerified, onResend, onBack }) => {
  const { t } = useTranslation('auth');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // 🔥 Resend state
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [currentToken, setCurrentToken] = useState(token);
  
  // 🔥 Cross-tab sync state
  const [checkingStatus, setCheckingStatus] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // 🔥 Start cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // 🔥 Setup cross-tab communication and polling
  useEffect(() => {
    // Setup BroadcastChannel for cross-tab communication
    try {
      broadcastChannelRef.current = new BroadcastChannel('gogotrip_verification');
      broadcastChannelRef.current.onmessage = (event) => {
        if (event.data.type === 'VERIFICATION_COMPLETE' && event.data.email === email) {
          console.log('📡 Received verification complete from another tab');
          setSuccessMsg('✅ Email verified in another tab! Redirecting...');
          setTimeout(() => {
            if (event.data.user) {
              onVerified(event.data.user);
            }
          }, 1500);
        }
      };
    } catch (e) {
      console.log('BroadcastChannel not supported, using polling only');
    }

    // 🔥 Poll for verification status every 5 seconds
    const checkVerificationStatus = async () => {
      try {
        setCheckingStatus(true);
        const response = await fetch(`${API_BASE_URL}/auth/check-verification-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, token: currentToken })
        });
        
        const result = await response.json();
        
        if (result.verified && result.user) {
          console.log('✅ Email verified detected via polling');
          setSuccessMsg('✅ Email verified! Redirecting...');
          
          // Broadcast to other tabs
          if (broadcastChannelRef.current) {
            broadcastChannelRef.current.postMessage({
              type: 'VERIFICATION_COMPLETE',
              email,
              user: result.user
            });
          }
          
          // Stop polling
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
          }
          
          setTimeout(() => {
            onVerified(result.user);
          }, 1500);
        }
      } catch (e) {
        console.log('Status check failed:', e);
      } finally {
        setCheckingStatus(false);
      }
    };

    // Start polling
    pollIntervalRef.current = setInterval(checkVerificationStatus, 5000);

    // Cleanup
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      }
    };
  }, [email, currentToken, onVerified]);

  // 🔥 Handle manual verification
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode || verificationCode.length !== verificationConfig.codeLength) {
      setError(`Please enter a ${verificationConfig.codeLength}-digit code`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup-verify-v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          token: currentToken,
          code: verificationCode
        })
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        setSuccessMsg('✅ Email verified successfully!');
        
        // Broadcast to other tabs
        if (broadcastChannelRef.current) {
          broadcastChannelRef.current.postMessage({
            type: 'VERIFICATION_COMPLETE',
            email,
            user: result.user
          });
        }
        
        setTimeout(() => {
          onVerified(result.user);
        }, 1500);
      } else {
        setError(result.message || 'Verification failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Handle resend with feedback and cooldown
  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    
    setResendLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const result = await onResend();
      
      if (result.success) {
        if (result.token) {
          setCurrentToken(result.token);
        }
        setSuccessMsg('✅ Verification email sent! Check your inbox.');
        setResendCooldown(60); // 60 second cooldown
      } else {
        // Check if it's a cooldown error
        if (result.message?.includes('wait')) {
          const match = result.message.match(/(\d+)/);
          if (match) {
            setResendCooldown(parseInt(match[1]));
          }
        }
        setError(result.message || 'Failed to resend');
      }
    } catch (err) {
      setError('Failed to resend verification email');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">{t('verification.title')}</h2>
        <p className="text-slate-600">
          {t('verification.subtitle')}<br />
          <strong className="text-slate-900">{email}</strong>
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in-down">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-bold text-red-700">{error}</p>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3 animate-in fade-in-down">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-bold text-green-700">{successMsg}</p>
        </div>
      )}

      {/* 🔥 Cross-tab sync indicator */}
      {checkingStatus && (
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          <span>Checking verification status...</span>
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
            {t('verification.enterCode')}
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={verificationCode}
              onChange={e => {
                const value = e.target.value.toUpperCase();
                if (verificationConfig.codeType === 'numeric') {
                  if (/^\d*$/.test(value)) {
                    setVerificationCode(value);
                  }
                } else {
                  setVerificationCode(value);
                }
              }}
              maxLength={verificationConfig.codeLength}
              placeholder={t('verification.codePlaceholder', { length: verificationConfig.codeLength })}
              className="w-full bg-white border border-slate-200 rounded-xl py-4 px-4 font-mono text-2xl tracking-[0.5em] text-center font-bold focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all uppercase"
            />
          </div>
          <p className="text-xs text-slate-500 text-center mt-2">
            {t('verification.enterCodeDesc')}
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || verificationCode.length !== verificationConfig.codeLength}
          className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              {t('verification.verify')}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* 🔥 Resend button with cooldown */}
      <div className="text-center pt-4 border-t border-slate-200">
        <p className="text-sm text-slate-600 mb-3">{t('verification.didntReceive')}</p>
        <button
          type="button"
          onClick={handleResend}
          disabled={resendLoading || resendCooldown > 0}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            resendCooldown > 0
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : resendLoading
              ? 'bg-slate-100 text-slate-500'
              : 'bg-sky-50 text-sky-600 hover:bg-sky-100'
          }`}
        >
          {resendLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('forgotPassword.sending')}
            </>
          ) : resendCooldown > 0 ? (
            <>
              <Clock className="w-4 h-4" />
              {t('verification.resendIn', { seconds: resendCooldown })}
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              {t('verification.resendCode')}
            </>
          )}
        </button>
      </div>

      {/* Back to login */}
      <div className="text-center">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-slate-500 hover:text-slate-700 font-medium"
        >
          ← {t('register.backToSignUp')}
        </button>
      </div>
    </div>
  );
};

// ==========================================
// Main Login Component
// ==========================================
const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const { t } = useTranslation('auth');
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Verification config
  const [showVerificationOptions, setShowVerificationOptions] = useState(false);
  const [verificationConfig, setVerificationConfig] = useState<VerificationConfig>({
    codeType: 'numeric',
    codeLength: 6,
    expiryMinutes: 10
  });
  
  // JWT Token
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  
  // Verified email for success page
  const [verifiedEmail, setVerifiedEmail] = useState<string>('');
  
  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // reCAPTCHA Hook
  const { executeRecaptcha } = useGoogleReCaptcha();
  
  // Hero config
  const [heroConfig, setHeroConfig] = useState<HeroConfig | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    verificationCode: ''
  });

  // Password validation
  const [passwordCriteria, setPasswordCriteria] = useState<PasswordCriteria>({
    hasLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    hasSpecial: false,
  });
  
  const [isPasswordValid, setIsPasswordValid] = useState(false);

  const hasProcessedUrlToken = useRef(false);

  // Validate password strength
  const validatePassword = (pwd: string) => {
    const criteria = {
      hasLength: pwd.length >= 8,
      hasUpper: /[A-Z]/.test(pwd),
      hasLower: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    };
    setPasswordCriteria(criteria);
    setIsPasswordValid(Object.values(criteria).every(Boolean));
  };

  useEffect(() => {
    if (mode === 'SIGNUP') {
      validatePassword(formData.password);
    } else if (mode === 'FORGOT_VERIFY') {
      validatePassword(newPassword);
    }
  }, [formData.password, newPassword, mode]);

  // Fetch hero config
  useEffect(() => {
    const fetchHeroConfig = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/login-hero/active`);
        const data = await res.json();
        if (data.status === 'success' && data.config) {
          setHeroConfig(data.config);
        }
      } catch (err) {
        console.error('Failed to load hero config:', err);
        setHeroConfig({
          displayMode: 'single',
          transitionInterval: 5,
          autoPlay: true,
          imageSource: 'url',
          enableGradient: true,
          images: [{
            url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=2000',
            alt: 'Travel'
          }],
          title: 'Plan your next great adventure in seconds.',
          subtitle: null,
          description: 'Join thousands of travelers using AI to craft the perfect itinerary, track expenses, and explore the world.'
        });
      }
    };
    fetchHeroConfig();
  }, []);

  // Check for URL token (one-click verification)
  useEffect(() => {
    if (hasProcessedUrlToken.current) return;

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const errorParam = urlParams.get('error');
    
    // Handle OAuth errors
    if (errorParam) {
      if (errorParam === 'account_suspended') {
        setError('Your account has been suspended. Please contact support.');
      } else if (errorParam === 'account_deleted') {
        setError('This account has been deleted.');
      } else if (errorParam === 'oauth_failed') {
        setError('Google login failed. Please try again.');
      }
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }
    
    if (token) {
      console.log('🔍 Detected token in URL, starting One-Click verification...');
      hasProcessedUrlToken.current = true;
      setMode('VERIFYING');
      handleOneClickVerify(token);
    }
  }, []);

  // One-click verification handler
  const handleOneClickVerify = async (token: string) => {
    try {
      console.log('🚀 Starting One-Click verification...');
      
      // Step 1: Get token info
      const tokenResponse = await fetch(`${API_BASE_URL}/auth/verify-onetap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      const tokenResult = await tokenResponse.json();
      console.log('📥 Token info:', tokenResult);
      
      if (tokenResult.status !== 'success') {
        throw new Error(tokenResult.message || 'Invalid verification link');
      }

      // Step 2: Execute verification
      const verifyResponse = await fetch(`${API_BASE_URL}/auth/signup-verify-v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          token: token,
          code: tokenResult.data.code
        })
      });

      const verifyResult = await verifyResponse.json();
      console.log('✅ Verification result:', verifyResult);
      
      if (verifyResult.status === 'success') {
        setVerifiedEmail(tokenResult.data.email);
        window.history.replaceState({}, '', window.location.pathname);
        setMode('VERIFIED');
        
        // Broadcast to other tabs
        try {
          const bc = new BroadcastChannel('gogotrip_verification');
          bc.postMessage({
            type: 'VERIFICATION_COMPLETE',
            email: tokenResult.data.email,
            user: verifyResult.user
          });
          bc.close();
        } catch (e) {
          console.log('BroadcastChannel not available');
        }
        
        setTimeout(() => {
          onLogin(verifyResult.user);
        }, 3000);
        
      } else {
        throw new Error(verifyResult.message || 'Verification failed');
      }
      
    } catch (error: any) {
      console.error('❌ One-Click verification failed:', error);
      setMode('LOGIN');
      setError(error.message || 'Verification link expired or invalid. Please try again.');
    }
  };

  // Manual redirect handler
  const handleManualRedirect = useCallback(() => {
  if (verifiedEmail) {
    console.log('Redirecting...');
  }
  }, [verifiedEmail]);

  // Google login
  const handleGoogleLogin = () => {
    setLoading(true);
    setError(null);
    window.location.href = `${API_BASE_URL}/authorize`;
  };

  // Email signup
  const handleEmailSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isPasswordValid) {
      setError("Password is too weak. Please follow the requirements below.");
      return;
    }

    if (formData.password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!formData.email || !formData.password || !formData.name) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (!executeRecaptcha) {
        setError("reCAPTCHA not ready");
        setLoading(false);
        return;
      }

      const recaptchaToken = await executeRecaptcha('signup');

      const response = await fetch(`${API_BASE_URL}/auth/send-code-v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          code_type: verificationConfig.codeType,
          code_length: verificationConfig.codeLength,
          expiry_minutes: verificationConfig.expiryMinutes,
          recaptcha_token: recaptchaToken
        })
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        setVerificationToken(result.token);
        setMode('VERIFY'); // 🔥 Switch to VERIFY mode
      } else {
        setError(result.message || 'Failed to send code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Resend verification handler
  const handleResendVerification = async (): Promise<{ success: boolean; token?: string; message?: string }> => {
    try {
      if (!executeRecaptcha) {
        return { success: false, message: 'reCAPTCHA not ready' };
      }

      const recaptchaToken = await executeRecaptcha('resend');

      const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email,
          token: verificationToken,
          recaptcha_token: recaptchaToken
        })
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        return { success: true, token: result.token };
      } else {
        return { success: false, message: result.message };
      }
    } catch (err) {
      return { success: false, message: 'Network error' };
    }
  };

  // Email login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        onLogin(result.user);
      } else {
        // 🔥 Handle needs_verification case
        if (result.needs_verification) {
          setError('Please verify your email first. Check your inbox for the verification link.');
        } else {
          setError(result.message || 'Login failed');
        }
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot password
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (!executeRecaptcha) {
        setError("reCAPTCHA not ready");
        setLoading(false);
        return;
      }

      const recaptchaToken = await executeRecaptcha('forgot_password');

      const response = await fetch(`${API_BASE_URL}/auth/forgot-password/send-code-v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          code_type: verificationConfig.codeType,
          code_length: verificationConfig.codeLength,
          expiry_minutes: verificationConfig.expiryMinutes,
          recaptcha_token: recaptchaToken
        })
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        setVerificationToken(result.token);
        setMode('FORGOT_VERIFY');
        setSuccessMsg(`✅ Verification code sent to ${formData.email}!`);
      } else {
        setError(result.message || 'Failed to send code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isPasswordValid) {
      setError("Password is too weak.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password-v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: verificationToken,
          code: formData.verificationCode,
          new_password: newPassword
        })
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        setSuccessMsg('✅ Password reset successful! Please login.');
        setTimeout(() => setMode('LOGIN'), 2000);
      } else {
        setError(result.message || 'Reset failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Verification options selector
  const VerificationOptionsSelector = () => (
    <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl border border-sky-200">
      <button
        type="button"
        onClick={() => setShowVerificationOptions(!showVerificationOptions)}
        className="w-full flex items-center justify-between text-sm font-bold text-slate-700 mb-3"
      >
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-sky-600" />
          <span>Verification Options</span>
        </div>
        <span className="text-xs text-sky-600">
          {showVerificationOptions ? '▲ Hide' : '▼ Customize'}
        </span>
      </button>
      
      {showVerificationOptions && (
        <div className="space-y-4 animate-in fade-in-down">
          <div>
            <label className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-2">
              <Hash className="w-3 h-3" />
              Code Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['numeric', 'alphanumeric', 'alpha'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setVerificationConfig(prev => ({ ...prev, codeType: type }))}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    verificationConfig.codeType === type
                      ? 'bg-sky-600 text-white shadow-lg'
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {type === 'numeric' && '123456'}
                  {type === 'alphanumeric' && 'A1B2C3'}
                  {type === 'alpha' && 'ABCDEF'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-2">
              <Hash className="w-3 h-3" />
              Code Length
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([4, 6, 8] as const).map((length) => (
                <button
                  key={length}
                  type="button"
                  onClick={() => setVerificationConfig(prev => ({ ...prev, codeLength: length }))}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    verificationConfig.codeLength === length
                      ? 'bg-sky-600 text-white shadow-lg'
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {length} digits
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-2">
              <Clock className="w-3 h-3" />
              Expiry Time
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([5, 10, 15] as const).map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => setVerificationConfig(prev => ({ ...prev, expiryMinutes: minutes }))}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    verificationConfig.expiryMinutes === minutes
                      ? 'bg-sky-600 text-white shadow-lg'
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {minutes} min
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Password strength checker
  const PasswordStrengthChecker = () => (
    <div className="mt-2 space-y-2">
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
        Password Requirements:
      </div>
      {Object.entries({
        hasLength: 'At least 8 characters',
        hasUpper: 'One uppercase letter',
        hasLower: 'One lowercase letter',
        hasNumber: 'One number',
        hasSpecial: 'One special character (!@#$...)'
      }).map(([key, label]) => (
        <div key={key} className="flex items-center gap-2 text-xs">
          {passwordCriteria[key as keyof PasswordCriteria] ? (
            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
          ) : (
            <X className="w-4 h-4 text-slate-300 flex-shrink-0" />
          )}
          <span className={passwordCriteria[key as keyof PasswordCriteria] ? 'text-green-700 font-medium' : 'text-slate-500'}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );

  // ==========================================
  // Render
  // ==========================================
  
  // Verifying page
  if (mode === 'VERIFYING') {
    return <VerifyingPage />;
  }

  // Verified success page
  if (mode === 'VERIFIED') {
    return (
      <VerificationSuccessPage 
        email={verifiedEmail} 
        onRedirect={handleManualRedirect}
      />
    );
  }

  // Main layout
  return (
    <div className="min-h-screen flex overflow-hidden bg-slate-50">
      <HeroSection config={heroConfig} />

      <div className="flex-1 min-w-0 flex items-center justify-center p-6 lg:p-12 relative overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-black text-slate-900 mb-2">
              {mode === 'LOGIN' && t('login.title')}
              {mode === 'SIGNUP' && t('register.title')}
              {mode === 'VERIFY' && t('verification.title')}
              {mode === 'FORGOT' && t('forgotPassword.title')}
              {mode === 'FORGOT_VERIFY' && t('resetPassword.title')}
            </h2>
            <p className="text-slate-500 font-medium">
              {mode === 'LOGIN' && t('login.subtitle')}
              {mode === 'SIGNUP' && t('register.subtitle')}
              {mode === 'VERIFY' && t('verification.checkEmail')}
              {mode === 'FORGOT' && t('forgotPassword.subtitle')}
              {mode === 'FORGOT_VERIFY' && t('resetPassword.subtitle')}
            </p>
          </div>

          {error && mode !== 'VERIFY' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in-down">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-bold text-red-700">{error}</p>
            </div>
          )}

          {successMsg && mode !== 'VERIFY' && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3 animate-in fade-in-down">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-bold text-green-700">{successMsg}</p>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xl">
            
            {/* 🔥 VERIFY mode - dedicated component */}
            {mode === 'VERIFY' && verificationToken && (
              <VerifyEmailPage
                email={formData.email}
                token={verificationToken}
                verificationConfig={verificationConfig}
                onVerified={onLogin}
                onResend={handleResendVerification}
                onBack={() => {
                  setMode('SIGNUP');
                  setError(null);
                  setSuccessMsg(null);
                }}
              />
            )}

            {/* Forgot password verify form */}
            {mode === 'FORGOT_VERIFY' && (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">{t('verification.enterCode')}</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formData.verificationCode}
                      onChange={e => {
                        const value = e.target.value.toUpperCase();
                        if (verificationConfig.codeType === 'numeric') {
                          if (/^\d*$/.test(value)) {
                            setFormData({ ...formData, verificationCode: value });
                          }
                        } else {
                          setFormData({ ...formData, verificationCode: value });
                        }
                      }}
                      maxLength={verificationConfig.codeLength}
                      placeholder={t('verification.codePlaceholder', { length: verificationConfig.codeLength })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-12 pr-12 font-mono text-lg tracking-widest text-center font-bold focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all uppercase"
                    />
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">{t('resetPassword.newPassword')}</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full bg-white border rounded-xl py-3.5 pl-12 pr-12 font-medium focus:ring-2 outline-none transition-all ${
                        !isPasswordValid && newPassword.length > 0
                          ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                          : 'border-slate-200 focus:ring-sky-500/20 focus:border-sky-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <PasswordStrengthChecker />
                </div>

                {isPasswordValid && (
                  <div className="space-y-1 animate-in fade-in-down">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">{t('resetPassword.confirmPassword')}</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder={t('resetPassword.confirmPasswordPlaceholder')}
                        className={`w-full bg-white border rounded-xl py-3.5 pl-12 pr-12 font-medium focus:ring-2 outline-none transition-all ${
                          confirmPassword.length > 0 && confirmPassword !== newPassword
                            ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                            : 'border-slate-200 focus:ring-sky-500/20 focus:border-sky-500'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                      <p className="text-xs text-red-500 font-bold ml-1">{t('errors.passwordMismatch')}</p>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !isPasswordValid || newPassword !== confirmPassword}
                  className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      {t('resetPassword.resetPassword')}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Forgot password form */}
            {mode === 'FORGOT' && (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
                <VerificationOptionsSelector />

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">{t('login.email')}</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder={t('login.emailPlaceholder')}
                      className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      {t('forgotPassword.sendLink')}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('LOGIN');
                    setError(null);
                  }}
                  className="w-full text-sm text-sky-600 font-bold hover:underline"
                >
                  ← {t('forgotPassword.backToLogin')}
                </button>
              </form>
            )}

            {/* Login/Signup forms */}
            {(mode === 'LOGIN' || mode === 'SIGNUP') && (
              <div className="space-y-6">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full py-3.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-3 relative group overflow-hidden"
                >
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">{t('login.googleSignIn')}</span>
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-400 font-bold">{t('login.orContinueWithEmail')}</span>
                  </div>
                </div>

                {mode === 'SIGNUP' && <VerificationOptionsSelector />}

                <form onSubmit={mode === 'LOGIN' ? handleLoginSubmit : handleEmailSignupSubmit} className="space-y-4">
                  {mode === 'SIGNUP' && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">{t('register.fullName')}</label>
                      <div className="relative">
                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          placeholder={t('register.fullNamePlaceholder')}
                          className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">{t('login.email')}</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder={t('login.emailPlaceholder')}
                        className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">{t('login.password')}</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        placeholder={mode === 'SIGNUP' ? t('register.passwordPlaceholder') : t('login.passwordPlaceholder')}
                        className={`w-full bg-white border rounded-xl py-3.5 pl-12 pr-12 font-medium focus:ring-2 outline-none transition-all ${
                          mode === 'SIGNUP' && !isPasswordValid && formData.password.length > 0
                            ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                            : 'border-slate-200 focus:ring-sky-500/20 focus:border-sky-500'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {mode === 'SIGNUP' && <PasswordStrengthChecker />}
                  </div>

                  {mode === 'SIGNUP' && isPasswordValid && (
                    <div className="space-y-1 animate-in fade-in-down">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">{t('register.confirmPassword')}</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          placeholder={t('register.confirmPasswordPlaceholder')}
                          className={`w-full bg-white border rounded-xl py-3.5 pl-12 pr-12 font-medium focus:ring-2 outline-none transition-all ${
                            confirmPassword.length > 0 && confirmPassword !== formData.password
                              ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                              : 'border-slate-200 focus:ring-sky-500/20 focus:border-sky-500'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {confirmPassword.length > 0 && confirmPassword !== formData.password && (
                        <p className="text-xs text-red-500 font-bold ml-1">{t('errors.passwordMismatch')}</p>
                      )}
                    </div>
                  )}

                  {mode === 'LOGIN' && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setMode('FORGOT');
                          setError(null);
                        }}
                        className="text-sm font-bold text-sky-600 hover:text-sky-700"
                      >
                        {t('login.forgotPassword')}
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || (mode === 'SIGNUP' && (!isPasswordValid || formData.password !== confirmPassword))}
                    className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                      <>
                        {mode === 'LOGIN' ? t('login.signIn') : t('register.signUp')}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="text-center">
                  <p className="text-slate-500 text-sm">
                    {mode === 'LOGIN' ? t('login.noAccount') : t('register.hasAccount')}{' '}
                    <button
                      onClick={() => {
                        setMode(mode === 'LOGIN' ? 'SIGNUP' : 'LOGIN');
                        setError(null);
                        setSuccessMsg(null);
                        setFormData({ name: '', email: '', password: '', verificationCode: '' });
                        setConfirmPassword('');
                      }}
                      className="font-bold text-sky-600 hover:text-sky-700"
                    >
                      {mode === 'LOGIN' ? t('login.signUpLink') : t('register.signInLink')}
                    </button>
                  </p>
                </div>
              </div>
            )}






                  

          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;