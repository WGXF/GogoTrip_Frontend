import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  User as UserIcon, 
  Mail, 
  Camera, 
  Save, 
  CheckCircle2, 
  Shield, 
  Bell, 
  Lock, 
  Loader2,
  AlertCircle,
  X,
  Info,
  Check,
  RefreshCw,
  Clock,
  ArrowRight,
  KeyRound,
  Link2,
  ExternalLink,
  Unlink
} from 'lucide-react';
import { User, SupportedLanguage } from '../../types';
import { API_BASE_URL } from '../../config';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useTranslation } from 'react-i18next';
import { changeLanguage, getCurrentLanguage, SUPPORTED_LANGUAGES } from '../../i18n';
import { Globe } from 'lucide-react';

/* =========================
   Types & Interfaces
========================= */
interface SettingsViewProps {
  user: User;
  onUpdateUser: (updatedUser: Partial<User>) => void;
}

interface PasswordCriteria {
  hasLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

// 🔥 Email change flow states
type EmailChangeStep = 'idle' | 'request' | 'verify_current' | 'verify_new' | 'success';

// 🔥 Password change flow states (2FA)
type PasswordChangeStep = 'idle' | 'verify_current' | 'verify_code' | 'set_new' | 'success';


/* =========================
   Main Component
========================= */
const SettingsView: React.FC<SettingsViewProps> = ({ user, onUpdateUser }) => {
  // i18n Hook
  const { t } = useTranslation(['settings', 'common']);
  
  // reCAPTCHA Hook
  

  // --- Form State ---
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email || '',
    avatarUrl: user.avatarUrl
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Password State ---
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: ''
  });
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [passwordCriteria, setPasswordCriteria] = useState<PasswordCriteria>({
    hasLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    hasSpecial: false,
  });

  // 🔥 Two-Factor Password Change State
  const [passwordChangeStep, setPasswordChangeStep] = useState<PasswordChangeStep>('idle');
  const [passwordVerificationToken, setPasswordVerificationToken] = useState<string | null>(null);
  const [passwordVerificationCode, setPasswordVerificationCode] = useState('');
  const [passwordResendCooldown, setPasswordResendCooldown] = useState(0);
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');

  // 🔥 Email Change State
  const [emailChangeStep, setEmailChangeStep] = useState<EmailChangeStep>('idle');
  const [newEmail, setNewEmail] = useState('');
  const [emailVerificationToken, setEmailVerificationToken] = useState<string | null>(null);
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [emailResendCooldown, setEmailResendCooldown] = useState(0);
  const [emailChangeLoading, setEmailChangeLoading] = useState(false);
  const [emailChangeError, setEmailChangeError] = useState<string | null>(null);

  // --- Preferences State ---
  // 🆕 Initialize from user data (default to true if not set)
  const [emailNotifs, setEmailNotifs] = useState(user.emailNotifications ?? true);
  const [dataPrivacy, setDataPrivacy] = useState(true);
  
  // 🆕 Language Preference State
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(
    (user.preferredLanguage as SupportedLanguage) || getCurrentLanguage()
  );
  const [isLanguageChanging, setIsLanguageChanging] = useState(false);
  
  useEffect(() => {
    setEmailNotifs(user.emailNotifications ?? true);
  }, [user.emailNotifications]);
  
  // 🆕 Sync language from user profile
  useEffect(() => {
    if (user.preferredLanguage) {
      setSelectedLanguage(user.preferredLanguage);
    }
  }, [user.preferredLanguage]);
  
  // --- UI State ---
  const [isSaving, setIsSaving] = useState(false); 
  const [isSaved, setIsSaved] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // 🆕 Google Linking State
  const [isGoogleLinking, setIsGoogleLinking] = useState(false);
  const [isGoogleUnlinking, setIsGoogleUnlinking] = useState(false);

  // Helper: Toast
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 🆕 Handle Language Change
  const handleLanguageChange = async (lang: SupportedLanguage) => {
    if (lang === selectedLanguage) return;
    
    setIsLanguageChanging(true);
    try {
      // 1. Change UI language immediately
      await changeLanguage(lang);
      setSelectedLanguage(lang);
      
      // 2. Sync to backend (if user is logged in)
      const uploadData = new FormData();
      uploadData.append('preferredLanguage', lang);
      
      const res = await fetch(`${API_BASE_URL}/auth/update-profile`, {
        method: 'PUT',
        credentials: 'include',
        body: uploadData
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          onUpdateUser({ ...data.user });
        }
        showToast(t('settings:language.changeSuccess', { fallback: 'Language updated!' }), 'success');
      }
    } catch (error) {
      console.error('Failed to update language:', error);
      // UI already changed, just log the error
    } finally {
      setIsLanguageChanging(false);
    }
  };

  // 🆕 Handle OAuth callback success/error from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const error = params.get('error');
    
    if (success === 'google_linked') {
      showToast('Google account linked successfully!', 'success');
      // Clean URL
      window.history.replaceState({}, '', '/settings');
      // Refresh to get updated user data
      window.location.reload();
    }
    if (error === 'google_already_linked') {
      showToast('This Google account is already linked to another user.', 'error');
      window.history.replaceState({}, '', '/settings');
    }
    if (error === 'linking_failed') {
      showToast('Failed to link Google account. Please try again.', 'error');
      window.history.replaceState({}, '', '/settings');
    }
    if (error === 'already_linked') {
      showToast('Your account already has Google linked.', 'info');
      window.history.replaceState({}, '', '/settings');
    }
    if (error === 'session_expired') {
      showToast('Session expired. Please try again.', 'error');
      window.history.replaceState({}, '', '/settings');
    }
  }, []);

  // 🆕 Scroll to Google linking section if hash is present
  useEffect(() => {
    if (window.location.hash === '#google-linking') {
      setTimeout(() => {
        const element = document.getElementById('google-linking-section');
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, []);

  // --- Handlers: Password ---
  const validatePassword = useCallback((pwd: string) => {
    const criteria = {
      hasLength: pwd.length >= 8,
      hasUpper: /[A-Z]/.test(pwd),
      hasLower: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    };
    setPasswordCriteria(criteria);
    setIsPasswordValid(Object.values(criteria).every(Boolean));
  }, []);

  // 🔥 Two-Factor Password Change Flow
  const handlePasswordChangeStart = async () => {
    if (!passwordData.currentPassword) {
      setPasswordStatus('error');
      setPasswordMsg('Please enter your current password.');
      return;
    }

    setPasswordStatus('loading');
    setPasswordMsg('');

    try {
     

      const res = await fetch(`${API_BASE_URL}/auth/password-change/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          current_password: passwordData.currentPassword,
        })
      });

      const data = await res.json();

      if (res.ok && data.status === 'success') {
        setPasswordVerificationToken(data.token);
        setPasswordChangeStep('verify_code');
        setPasswordResendCooldown(60);
        setPasswordStatus('idle');
        showToast('Verification code sent to your email', 'success');
      } else {
        setPasswordStatus('error');
        setPasswordMsg(data.message || 'Failed to verify password.');
      }
    } catch (e) {
      setPasswordStatus('error');
      setPasswordMsg('Network error.');
    }
  };

  const handlePasswordChangeConfirm = async () => {
    if (!passwordVerificationCode || passwordVerificationCode.length !== 6) {
      setPasswordStatus('error');
      setPasswordMsg('Please enter the 6-digit code.');
      return;
    }

    if (!isPasswordValid) {
      setPasswordStatus('error');
      setPasswordMsg('New password is too weak.');
      return;
    }

    if (passwordData.newPassword !== newPasswordConfirm) {
      setPasswordStatus('error');
      setPasswordMsg('Passwords do not match.');
      return;
    }

    setPasswordStatus('loading');

    try {
      const res = await fetch(`${API_BASE_URL}/auth/password-change/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          token: passwordVerificationToken,
          code: passwordVerificationCode,
          new_password: passwordData.newPassword
        })
      });

      const data = await res.json();

      if (res.ok && data.status === 'success') {
        setPasswordChangeStep('success');
        setPasswordStatus('success');
        setPasswordMsg('Password changed successfully!');
        showToast('Password updated successfully', 'success');
        
        // Reset form after success
        setTimeout(() => {
          setPasswordChangeStep('idle');
          setPasswordData({ currentPassword: '', newPassword: '' });
          setPasswordVerificationCode('');
          setNewPasswordConfirm('');
          setPasswordVerificationToken(null);
          setPasswordStatus('idle');
          setPasswordMsg('');
          setIsPasswordValid(false);
        }, 2000);
      } else {
        setPasswordStatus('error');
        setPasswordMsg(data.message || 'Failed to change password.');
      }
    } catch (e) {
      setPasswordStatus('error');
      setPasswordMsg('Network error.');
    }
  };

  const handlePasswordResendCode = async () => {
    if (passwordResendCooldown > 0) return;

    try {
      const res = await fetch(`${API_BASE_URL}/auth/password-change/resend-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          token: passwordVerificationToken,
        })
      });

      const data = await res.json();

      if (res.ok && data.status === 'success') {
        setPasswordVerificationToken(data.token);
        setPasswordResendCooldown(60);
        showToast('Code resent successfully', 'success');
      } else {
        showToast(data.message || 'Failed to resend', 'error');
      }
    } catch (e) {
      showToast('Network error', 'error');
    }
  };

  // 🔥 Email Change Flow
  const handleEmailChangeStart = async () => {
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setEmailChangeError('Please enter a valid email address.');
      return;
    }

    if (newEmail === user.email) {
      setEmailChangeError('New email must be different from current email.');
      return;
    }

    setEmailChangeLoading(true);
    setEmailChangeError(null);

    try {
      

      const res = await fetch(`${API_BASE_URL}/auth/email-change/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          new_email: newEmail,
          
        })
      });

      const data = await res.json();

      if (res.ok && data.status === 'success') {
        setEmailVerificationToken(data.token);
        setEmailChangeStep('verify_current');
        setEmailResendCooldown(60);
        showToast('Verification code sent to your current email', 'success');
      } else {
        setEmailChangeError(data.message || 'Failed to start email change.');
      }
    } catch (e) {
      setEmailChangeError('Network error.');
    } finally {
      setEmailChangeLoading(false);
    }
  };

  const handleEmailVerifyCurrentEmail = async () => {
    if (!emailVerificationCode || emailVerificationCode.length !== 6) {
      setEmailChangeError('Please enter the 6-digit code.');
      return;
    }

    setEmailChangeLoading(true);
    setEmailChangeError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/email-change/verify-current`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          token: emailVerificationToken,
          code: emailVerificationCode,
          new_email: newEmail
        })
      });

      const data = await res.json();

      if (res.ok && data.status === 'success') {
        setEmailChangeStep('verify_new');
        setEmailVerificationCode('');
        setEmailVerificationToken(data.token);
        showToast('Verification code sent to your new email', 'success');
        
        if (data.user) {
          onUpdateUser({ ...data.user });
        }
      } else {
        setEmailChangeError(data.message || 'Invalid verification code.');
      }
    } catch (e) {
      setEmailChangeError('Network error.');
    } finally {
      setEmailChangeLoading(false);
    }
  };

  const handleEmailVerifyNewEmail = async () => {
    if (!emailVerificationCode || emailVerificationCode.length !== 6) {
      setEmailChangeError('Please enter the 6-digit code.');
      return;
    }

    setEmailChangeLoading(true);
    setEmailChangeError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/email-change/verify-new`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          token: emailVerificationToken,
          code: emailVerificationCode
        })
      });

      const data = await res.json();

      if (res.ok && data.status === 'success') {
        setEmailChangeStep('success');
        showToast('Email updated successfully!', 'success');
        
        if (data.user) {
          onUpdateUser({ ...data.user });
          setFormData(prev => ({ ...prev, email: data.user.email }));
        }
        
        setTimeout(() => {
          setEmailChangeStep('idle');
          setNewEmail('');
          setEmailVerificationCode('');
          setEmailVerificationToken(null);
        }, 2000);
      } else {
        setEmailChangeError(data.message || 'Invalid verification code.');
      }
    } catch (e) {
      setEmailChangeError('Network error.');
    } finally {
      setEmailChangeLoading(false);
    }
  };

  const handleEmailResendCode = async () => {
    if (emailResendCooldown > 0) return;

    try {
      

      const res = await fetch(`${API_BASE_URL}/auth/email-change/resend-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          token: emailVerificationToken,
          step: emailChangeStep,
          
        })
      });

      const data = await res.json();

      if (res.ok && data.status === 'success') {
        setEmailVerificationToken(data.token);
        setEmailResendCooldown(60);
        showToast('Code resent successfully', 'success');
      } else {
        showToast(data.message || 'Failed to resend', 'error');
      }
    } catch (e) {
      showToast('Network error', 'error');
    }
  };

  // Cooldown timers
  React.useEffect(() => {
    if (passwordResendCooldown > 0) {
      const timer = setTimeout(() => setPasswordResendCooldown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [passwordResendCooldown]);

  React.useEffect(() => {
    if (emailResendCooldown > 0) {
      const timer = setTimeout(() => setEmailResendCooldown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [emailResendCooldown]);

  // --- Handlers: Profile ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const MAX_SIZE = 1 * 1024 * 1024; // 1MB
      if (file.size > MAX_SIZE) {
        showToast("File is too large! Please upload an image smaller than 1MB.", "error");
        e.target.value = ''; 
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatarUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const uploadData = new FormData();
      uploadData.append('name', formData.name);
      // 🆕 Include email notifications preference
      uploadData.append('emailNotifications', String(emailNotifs));
      if (selectedFile) {
        uploadData.append('avatar', selectedFile);
      }

      const res = await fetch(`${API_BASE_URL}/auth/update-profile`, {
        method: 'PUT',
        credentials: 'include', 
        body: uploadData
      });

      const data = await res.json();

      if (res.ok) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
        if (data.user) {
          onUpdateUser({ ...data.user });
        }
        setSelectedFile(null);
        showToast("Profile updated successfully!", "success");
      } else {
        showToast(data.message || 'Update failed', 'error');
      }
    } catch (error) {
      console.error("Upload error:", error);
      showToast('Network error occurred. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  /* =========================
     FIX: Render Helpers
     Converted from Components to Functions to avoid Remounting issues
  ========================= */
  
  const renderPasswordStrengthChecker = () => (
    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 bg-white dark:bg-slate-700/50 p-3 rounded-lg border border-slate-200 dark:border-slate-600 mt-2">
      <div className={`flex items-center gap-1.5 ${passwordCriteria.hasLength ? 'text-emerald-500 font-bold' : ''}`}>
        {passwordCriteria.hasLength ? <Check className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-500" />}
        Min 8 chars
      </div>
      <div className={`flex items-center gap-1.5 ${passwordCriteria.hasUpper ? 'text-emerald-500 font-bold' : ''}`}>
        {passwordCriteria.hasUpper ? <Check className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-500" />}
        Uppercase
      </div>
      <div className={`flex items-center gap-1.5 ${passwordCriteria.hasLower ? 'text-emerald-500 font-bold' : ''}`}>
        {passwordCriteria.hasLower ? <Check className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-500" />}
        Lowercase
      </div>
      <div className={`flex items-center gap-1.5 ${passwordCriteria.hasNumber ? 'text-emerald-500 font-bold' : ''}`}>
        {passwordCriteria.hasNumber ? <Check className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-500" />}
        Number
      </div>
      <div className={`col-span-2 flex items-center gap-1.5 ${passwordCriteria.hasSpecial ? 'text-emerald-500 font-bold' : ''}`}>
        {passwordCriteria.hasSpecial ? <Check className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-500" />}
        Special char (!@#$%^&*)
      </div>
    </div>
  );

  /*const renderEmailChangeSection = () => {
    if (emailChangeStep === 'idle') {
      return (
        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-800 dark:text-amber-200 mb-2">
                Want to change your email?
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">
                For security, we'll verify both your current and new email addresses.
              </p>
              <div className="flex gap-2">
                <input 
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter new email address"
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-amber-500/20 outline-none"
                />
                <button
                  onClick={handleEmailChangeStart}
                  disabled={emailChangeLoading}
                  className="px-4 py-2 bg-amber-600 text-white text-sm font-bold rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                >
                  {emailChangeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Change'}
                </button>
              </div>
              {emailChangeError && (
                <p className="text-xs text-red-500 mt-2">{emailChangeError}</p>
              )}
            </div>
          </div>
        </div> 
      );
    }

    if (emailChangeStep === 'verify_current') {
      return (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-blue-800 dark:text-blue-200 mb-2">
                Verify Your Current Email
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">
                We sent a 6-digit code to <strong>{user.email}</strong>
              </p>
              <div className="flex gap-2 mb-3">
                <input 
                  type="text"
                  value={emailVerificationCode}
                  onChange={(e) => setEmailVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="flex-1 px-3 py-2 text-sm font-mono tracking-widest text-center rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
                <button
                  onClick={handleEmailVerifyCurrentEmail}
                  disabled={emailChangeLoading || emailVerificationCode.length !== 6}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {emailChangeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <button
                  onClick={handleEmailResendCode}
                  disabled={emailResendCooldown > 0}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:text-slate-400"
                >
                  {emailResendCooldown > 0 ? (
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Resend in {emailResendCooldown}s</span>
                  ) : (
                    <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Resend Code</span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setEmailChangeStep('idle');
                    setEmailVerificationCode('');
                    setEmailChangeError(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
              </div>
              {emailChangeError && (
                <p className="text-xs text-red-500 mt-2">{emailChangeError}</p>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (emailChangeStep === 'verify_new') {
      return (
        <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200 mb-2">
                Verify Your New Email
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-3">
                We sent a 6-digit code to <strong>{newEmail}</strong>
              </p>
              <div className="flex gap-2 mb-3">
                <input 
                  type="text"
                  value={emailVerificationCode}
                  onChange={(e) => setEmailVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="flex-1 px-3 py-2 text-sm font-mono tracking-widest text-center rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
                <button
                  onClick={handleEmailVerifyNewEmail}
                  disabled={emailChangeLoading || emailVerificationCode.length !== 6}
                  className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {emailChangeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <button
                  onClick={handleEmailResendCode}
                  disabled={emailResendCooldown > 0}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium disabled:text-slate-400"
                >
                  {emailResendCooldown > 0 ? (
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Resend in {emailResendCooldown}s</span>
                  ) : (
                    <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Resend Code</span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setEmailChangeStep('idle');
                    setEmailVerificationCode('');
                    setNewEmail('');
                    setEmailChangeError(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
              </div>
              {emailChangeError && (
                <p className="text-xs text-red-500 mt-2">{emailChangeError}</p>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (emailChangeStep === 'success') {
      return (
        <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
              Email updated successfully!
            </p>
          </div>
        </div>
      );
    }

    return null;
  };
*/
  const renderTwoFactorPasswordSection = () => {
    // Step 1: Enter current password
    if (passwordChangeStep === 'idle' || passwordChangeStep === 'verify_current') {
      return (
        <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/50">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound className="w-5 h-5 text-sky-500" />
            <h4 className="font-bold text-slate-700 dark:text-white">Change Password (Secure)</h4>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            For your security, we'll send a verification code to your email.
          </p>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="password" 
                  placeholder="••••••••"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                {passwordStatus === 'error' && <p className="text-xs font-bold text-red-500">{passwordMsg}</p>}
              </div>
              <button 
                onClick={handlePasswordChangeStart}
                disabled={passwordStatus === 'loading' || !passwordData.currentPassword}
                className="px-5 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold hover:bg-sky-700 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {passwordStatus === 'loading' ? <Loader2 className="w-3 h-3 animate-spin" /> : (
                  <>Continue <ArrowRight className="w-3 h-3" /></>
                )}
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Step 2: Enter verification code and new password
    if (passwordChangeStep === 'verify_code') {
      return (
        <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/50">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-blue-500" />
            <h4 className="font-bold text-slate-700 dark:text-white">Verify & Set New Password</h4>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Enter the 6-digit code sent to <strong>{user.email}</strong>
          </p>
          
          <div className="space-y-4">
            {/* Verification Code */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verification Code</label>
              <div className="relative">
                <input 
                  type="text"
                  placeholder="000000"
                  value={passwordVerificationCode}
                  onChange={(e) => setPasswordVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-sm font-mono tracking-[0.3em] text-center font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handlePasswordResendCode}
                  disabled={passwordResendCooldown > 0}
                  className="text-xs text-sky-600 hover:text-sky-700 font-medium disabled:text-slate-400"
                >
                  {passwordResendCooldown > 0 ? (
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Resend in {passwordResendCooldown}s</span>
                  ) : (
                    <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Resend Code</span>
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="password" 
                  placeholder="Min 8 characters"
                  value={passwordData.newPassword}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPasswordData({...passwordData, newPassword: val});
                    validatePassword(val);
                  }}
                  className={`w-full bg-white dark:bg-slate-800 border rounded-xl py-3 pl-10 pr-4 text-sm font-medium outline-none transition-all ${
                    passwordData.newPassword.length > 0 && !isPasswordValid
                      ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                      : 'border-slate-200 dark:border-slate-700 focus:ring-sky-500/20 focus:border-sky-500'
                  }`}
                />
              </div>
              {passwordData.newPassword.length > 0 && renderPasswordStrengthChecker()}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="password" 
                  placeholder="Confirm password"
                  value={newPasswordConfirm}
                  onChange={(e) => setNewPasswordConfirm(e.target.value)}
                  className={`w-full bg-white dark:bg-slate-800 border rounded-xl py-3 pl-10 pr-4 text-sm font-medium outline-none transition-all ${
                    newPasswordConfirm.length > 0 && newPasswordConfirm !== passwordData.newPassword
                      ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                      : 'border-slate-200 dark:border-slate-700 focus:ring-sky-500/20 focus:border-sky-500'
                  }`}
                />
              </div>
              {newPasswordConfirm.length > 0 && newPasswordConfirm !== passwordData.newPassword && (
                <p className="text-xs text-red-500 font-bold">Passwords do not match</p>
              )}
            </div>
            
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  setPasswordChangeStep('idle');
                  setPasswordVerificationCode('');
                  setPasswordData({ currentPassword: '', newPassword: '' });
                  setNewPasswordConfirm('');
                  setPasswordStatus('idle');
                  setPasswordMsg('');
                }}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                ← Back
              </button>
              <div className="flex items-center gap-3">
                {passwordStatus === 'error' && <p className="text-xs font-bold text-red-500">{passwordMsg}</p>}
                <button 
                  onClick={handlePasswordChangeConfirm}
                  disabled={
                    passwordStatus === 'loading' || 
                    passwordVerificationCode.length !== 6 || 
                    !isPasswordValid || 
                    passwordData.newPassword !== newPasswordConfirm
                  }
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {passwordStatus === 'loading' ? <Loader2 className="w-3 h-3 animate-spin" /> : (
                    <>
                      <Check className="w-3 h-3" /> Change Password
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Success state
    if (passwordChangeStep === 'success') {
      return (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            <div>
              <h4 className="font-bold text-emerald-800 dark:text-emerald-200">Password Changed!</h4>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">Your password has been updated successfully.</p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // --- Render ---
  return (
    <div className="p-6 md:p-8 w-full max-w-4xl mx-auto animate-fade-in-up relative">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl animate-fade-in-up transition-all ${
          toast.type === 'error' 
            ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' 
            : toast.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
            : 'bg-white text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <Info className="w-5 h-5" />}
          <span className="font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <UserIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">General Settings</h2>
      </div>

      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-sm border border-transparent hover:border-sky-300 dark:hover:border-indigo-500 transition-all duration-500 ease-out">
        
        {/* Profile Picture Section */}
        <div className="flex flex-col md:flex-row items-center gap-8 mb-10 pb-10 border-b border-slate-200 dark:border-slate-800">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl ring-2 ring-slate-100 dark:ring-slate-700">
              <img src={formData.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
          <div className="text-center md:text-left">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Profile Photo</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-4">Click the image to upload a new photo. JPG, GIF or PNG.</p>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Change Photo
            </button>
          </div>
        </div>

        {/* Personal Information Form */}
        <div className="space-y-6 max-w-2xl">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Personal Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-12 pr-4 font-medium outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                  />
                </div>
            </div>
            
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="email" 
                    value={formData.email}
                    disabled
                    className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-12 pr-4 font-medium outline-none text-slate-500 cursor-not-allowed"
                  />
                </div>
            </div>
          </div>

          {/* 🔥 FIX: Call as Function, not Component */}
          {/* {renderEmailChangeSection()} */}

          {/* Security Section */}
          <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                Security
            </h3>
            
            {user.authProvider === 'google' || !user.email ? (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 flex items-center gap-3 text-slate-500 border border-slate-200 dark:border-slate-700">
                    <Shield className="w-5 h-5" />
                    <span className="text-sm">You are logged in via Google. Password change is not applicable.</span>
                </div>
            ) : (
                // 🔥 FIX: Call as Function, not Component
                renderTwoFactorPasswordSection()
            )}
          </div>

          {/* 🆕 Google Account Linking Section */}
          <div id="google-linking-section" className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Link2 className="w-5 h-5 text-sky-500" />
              Google Account
            </h3>
            
            {/* Check if Google is already linked */}
            {(user.authProvider === 'google' || user.hasGoogleLinked) ? (
              // Google is linked - show linked state
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-5 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm border border-emerald-200 dark:border-emerald-700">
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-emerald-800 dark:text-emerald-200">Google Account Linked</p>
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                      {user.authProvider === 'google' 
                        ? 'You signed up with Google. Calendar features are available.' 
                        : 'Your Google account is connected. Calendar sync and trip export are enabled.'}
                    </p>
                  </div>
                </div>
                
                {/* Show unlink option only for email users who linked Google */}
                {user.authProvider === 'email' && user.hasGoogleLinked && (
                  <div className="mt-4 pt-4 border-t border-emerald-200 dark:border-emerald-700/50">
                    <button
                      onClick={async () => {
                        if (!window.confirm('Are you sure you want to unlink your Google account? Calendar sync and trip export will no longer work.')) {
                          return;
                        }
                        setIsGoogleUnlinking(true);
                        try {
                          const res = await fetch(`${API_BASE_URL}/auth/unlink-google`, {
                            method: 'POST',
                            credentials: 'include'
                          });
                          const data = await res.json();
                          if (res.ok && data.status === 'success') {
                            showToast('Google account unlinked successfully', 'success');
                            if (data.user) {
                              onUpdateUser(data.user);
                            }
                          } else {
                            showToast(data.message || 'Failed to unlink Google account', 'error');
                          }
                        } catch (e) {
                          showToast('Network error. Please try again.', 'error');
                        } finally {
                          setIsGoogleUnlinking(false);
                        }
                      }}
                      disabled={isGoogleUnlinking}
                      className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isGoogleUnlinking ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Unlink className="w-3 h-3" />
                      )}
                      {isGoogleUnlinking ? 'Unlinking...' : 'Unlink Google Account'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Google is NOT linked - show connect option
              <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-700">
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 dark:text-white mb-1">Link Google Account</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                      Connect your Google account to enable Calendar sync and export your trips to Google Calendar.
                    </p>
                    <button
                      onClick={() => {
                        setIsGoogleLinking(true);
                        window.location.href = `${API_BASE_URL}/auth/link-google`;
                      }}
                      disabled={isGoogleLinking}
                      className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGoogleLinking ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <img src="https://www.google.com/favicon.ico" alt="" className="w-4 h-4" />
                      )}
                      {isGoogleLinking ? 'Connecting...' : 'Connect Google Account'}
                      {!isGoogleLinking && <ExternalLink className="w-3 h-3 text-slate-400" />}
                    </button>
                  </div>
                </div>
                
                {/* Info note */}
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/50 flex items-start gap-2">
                  <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                    We only access your Google Calendar to sync events. Your data stays secure with Google OAuth.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Preferences Section */}
          <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Preferences</h3>
            <div className="space-y-4">
                {/* Email Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                        <Bell className="w-5 h-5 text-sky-500" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">Email Notifications</p>
                        <p className="text-xs text-slate-500">Receive trip updates and AI suggestions</p>
                      </div>
                  </div>
                  <button 
                    onClick={() => setEmailNotifs(!emailNotifs)}
                    className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ${emailNotifs ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-300 ${emailNotifs ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </button>
                </div>

                {/* Privacy Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                        <Shield className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">Data Privacy</p>
                        <p className="text-xs text-slate-500">Allow AI to use travel history for better suggestions</p>
                      </div>
                  </div>
                  <button 
                    onClick={() => setDataPrivacy(!dataPrivacy)}
                    className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ${dataPrivacy ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-300 ${dataPrivacy ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </button>
                </div>
            </div>
          </div>

          {/* 🆕 Language Preference Section */}
          <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-500" />
              {t('settings:language.title', 'Language')}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {t('settings:language.description', 'Choose your preferred language for the interface and AI responses')}
            </p>
            
            {/* Language Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code as SupportedLanguage)}
                  disabled={isLanguageChanging}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 text-left relative ${
                    selectedLanguage === lang.code
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-md'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600'
                  } ${isLanguageChanging ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {/* Selected indicator */}
                  {selectedLanguage === lang.code && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                    </div>
                  )}
                  
                  {/* Flag */}
                  <span className="text-2xl mb-2 block">{lang.flag}</span>
                  
                  {/* Language name */}
                  <p className="font-bold text-slate-900 dark:text-white">{lang.nativeName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{lang.name}</p>
                </button>
              ))}
            </div>
            
            {/* Loading indicator */}
            {isLanguageChanging && (
              <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('settings:language.changing', 'Changing language...')}
              </div>
            )}
          </div>

          {/* Save Action */}
          <div className="pt-6 mt-6 flex justify-end">
            <button 
              onClick={handleSave}
              disabled={isSaving} 
              className={`w-full md:w-auto px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl shadow-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-all flex items-center justify-center gap-2 ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSaved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />)}
              {isSaved ? 'Saved' : (isSaving ? 'Saving...' : 'Save Changes')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;