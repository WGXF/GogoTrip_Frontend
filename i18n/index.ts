/**
 * GogoTrip i18n Configuration
 * 
 * Supports: English (en), Chinese Simplified (zh), Bahasa Melayu (ms)
 * 
 * Language Resolution Priority:
 * 1. User profile setting (if logged in)
 * 2. LocalStorage
 * 3. Browser language
 * 4. English (fallback)
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation resources
import enCommon from '../locales/en/common.json';
import enSettings from '../locales/en/settings.json';
import enChat from '../locales/en/chat.json';
import enNav from '../locales/en/nav.json';
import enAuth from '../locales/en/auth.json';
import enDashboard from '../locales/en/dashboard.json';

import zhCommon from '../locales/zh/common.json';
import zhSettings from '../locales/zh/settings.json';
import zhChat from '../locales/zh/chat.json';
import zhNav from '../locales/zh/nav.json';
import zhAuth from '../locales/zh/auth.json';
import zhDashboard from '../locales/zh/dashboard.json';

import msCommon from '../locales/ms/common.json';
import msSettings from '../locales/ms/settings.json';
import msChat from '../locales/ms/chat.json';
import msNav from '../locales/ms/nav.json';
import msAuth from '../locales/ms/auth.json';
import msDashboard from '../locales/ms/dashboard.json';

// Supported languages
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾' },
] as const;

export type SupportedLanguage = 'en' | 'zh' | 'ms';

// Language code to full name mapping (for AI prompts)
export const LANGUAGE_FULL_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  zh: 'Chinese (Simplified)',
  ms: 'Bahasa Melayu',
};

// Resources bundled at build time (no lazy loading for faster initial render)
const resources = {
  en: {
    common: enCommon,
    settings: enSettings,
    chat: enChat,
    nav: enNav,
    auth: enAuth,
    dashboard: enDashboard,
  },
  zh: {
    common: zhCommon,
    settings: zhSettings,
    chat: zhChat,
    nav: zhNav,
    auth: zhAuth,
    dashboard: zhDashboard,
  },
  ms: {
    common: msCommon,
    settings: msSettings,
    chat: msChat,
    nav: msNav,
    auth: msAuth,
    dashboard: msDashboard,
  },
};

// LocalStorage key for language preference
export const LANGUAGE_STORAGE_KEY = 'gogotrip_language';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'zh', 'ms'],
    
    // Default namespace
    defaultNS: 'common',
    ns: ['common', 'settings', 'chat', 'nav', 'auth', 'dashboard'],
    
    // Language detection options
    detection: {
      // Priority order for language detection
      order: ['localStorage', 'navigator'],
      // Cache user language preference in localStorage
      caches: ['localStorage'],
      // LocalStorage key
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
    },
    
    // React-specific options
    react: {
      useSuspense: false, // Disable suspense for simpler error handling
    },
    
    // Interpolation settings
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    // Debug mode (development only)
    debug: import.meta.env.DEV && false, // Set to true for debugging
  });

/**
 * Change language and persist to localStorage
 * @param lang - Language code (en, zh, ms)
 */
export const changeLanguage = async (lang: SupportedLanguage): Promise<void> => {
  await i18n.changeLanguage(lang);
  localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
};

/**
 * Get current language
 */
export const getCurrentLanguage = (): SupportedLanguage => {
  const lang = i18n.language;
  // Ensure it's a supported language
  if (['en', 'zh', 'ms'].includes(lang)) {
    return lang as SupportedLanguage;
  }
  // Handle language codes like 'en-US' -> 'en'
  const baseLang = lang.split('-')[0];
  if (['en', 'zh', 'ms'].includes(baseLang)) {
    return baseLang as SupportedLanguage;
  }
  return 'en';
};

/**
 * Initialize language from user profile (call after login)
 * @param userLanguage - Language preference from user profile
 */
export const initLanguageFromProfile = (userLanguage: string | null | undefined): void => {
  if (userLanguage && ['en', 'zh', 'ms'].includes(userLanguage)) {
    changeLanguage(userLanguage as SupportedLanguage);
  }
};

export default i18n;
