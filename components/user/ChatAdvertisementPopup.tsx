import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../../config';

interface Advertisement {
  id: number;
  title: string;
  description: string;
  // 🆕 Localized fields
  title_zh?: string;
  description_zh?: string;
  title_ms?: string;
  description_ms?: string;
  
  imageUrl: string;
  link: string;
  status: string;
  priority: number;
}

interface ChatAdvertisementPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatAdvertisementPopup: React.FC<ChatAdvertisementPopupProps> = ({
  isOpen,
  onClose
}) => {
  const navigate = useNavigate();

  const { i18n } = useTranslation();

  const [ad, setAd] = useState<Advertisement | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [canClose, setCanClose] = useState(false);
  const [noAdsAvailable, setNoAdsAvailable] = useState(false);

  // ============================
  // Fetch ad when opened (New Logic)
  // ============================
  useEffect(() => {
    if (!isOpen) return;

    // Reset states
    setCountdown(5);
    setCanClose(false);
    setNoAdsAvailable(false);
    fetchRandomAd();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || countdown === 0) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setCanClose(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, countdown]);

  // ============================
  // API Logic (New Logic)
  // ============================
  const fetchRandomAd = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/advertisements/active`);
      if (!res.ok) throw new Error();

      const ads = await res.json();
      if (ads.length > 0) {
        const randomAd = ads[Math.floor(Math.random() * ads.length)];
        setAd(randomAd);
        setNoAdsAvailable(false);
        recordView(randomAd.id);
      } else {
        setAd(null);
        setNoAdsAvailable(true);
      }
    } catch {
      setAd(null);
      setNoAdsAvailable(true);
    }
  };

  const recordView = async (adId: number) => {
    try {
      await fetch(`${API_BASE_URL}/api/advertisements/${adId}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch {}
  };

  const recordClick = async (adId: number) => {
    try {
      await fetch(`${API_BASE_URL}/api/advertisements/${adId}/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch {}
  };

  // 🆕 Helper to get localized content with fallback
  const getLocalizedContent = (ad: Advertisement) => {
    const lang = i18n.language; // 'en', 'zh', 'ms'
    
    let title = ad.title; // Default to English (fallback)
    let description = ad.description;

    if (lang === 'zh' && ad.title_zh) {
      title = ad.title_zh;
      description = ad.description_zh || description;
    } else if (lang === 'ms' && ad.title_ms) {
      title = ad.title_ms;
      description = ad.description_ms || description;
    }

    return { title, description };
  };

  const { title: adTitle, description: adDesc } = ad ? getLocalizedContent(ad) : { title: '', description: '' };

  // ============================
  // Handlers
  // ============================
  const handleAdClick = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!ad) return;
    recordClick(ad.id);
    window.open(ad.link, '_blank', 'noopener,noreferrer');
  };

  const handleUpgrade = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onClose();
    navigate('/billing');
  };

  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (canClose) onClose();
  };

  // ============================
  // Render (Restored UI from Old Version)
  // ============================
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300"
      onClick={(e) => e.stopPropagation()}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button with Countdown UI */}
        <button
          type="button"
          onClick={handleClose}
          disabled={!canClose}
          className={`absolute top-4 right-4 z-10 p-2 rounded-full transition-all ${
            canClose
              ? 'bg-white/80 dark:bg-slate-700/80 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 cursor-pointer'
              : 'bg-slate-100 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 cursor-not-allowed'
          }`}
          title={canClose ? 'Close' : `Wait ${countdown}s`}
        >
          {canClose ? (
            <X size={20} />
          ) : (
            <span className="text-sm font-bold w-5 h-5 flex items-center justify-center">
              {countdown}
            </span>
          )}
        </button>

        {/* Content Container */}
        <div className="p-6">
          {/* Header Badges */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
              {noAdsAvailable ? 'Notice' : 'Sponsored Content'}
            </span>
            {!canClose && !noAdsAvailable && (
              <span className="text-xs text-sky-600 dark:text-indigo-400 font-semibold">
                Closing in {countdown}s
              </span>
            )}
          </div>

          {/* Conditional Content */}
          {noAdsAvailable ? (
            // Case 1: No Ads (Placeholder with Progress Bar)
            <div className="flex flex-col items-center justify-center py-8 px-4">
              <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-6">
                <AlertCircle size={48} className="text-slate-400 dark:text-slate-500" />
              </div>

              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center">
                当前没有广告
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-6">
                暂时没有可用的广告内容。
                <br />
                感谢您的耐心等待！
              </p>

              {/* Decorative Progress Bar */}
              <div className="w-full max-w-xs">
                <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-sky-500 to-blue-600 dark:from-indigo-500 dark:to-purple-600 transition-all duration-1000"
                    style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ) : ad ? (
            // Case 2: Ad Content
            <>
              {ad.imageUrl && (
                <div
                  onClick={handleAdClick}
                  className="mb-4 rounded-2xl overflow-hidden cursor-pointer group"
                >
                  <img
                    src={`${API_BASE_URL}${ad.imageUrl}`}
                    alt={adTitle}
                    className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              )}

              <div
                onClick={handleAdClick}
                className="cursor-pointer group"
              >
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-sky-600 dark:group-hover:text-indigo-400 transition-colors">
                  {adTitle}
                </h3>

                {adDesc && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    {adDesc}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleAdClick}
                  className="w-full py-3 bg-sky-600 dark:bg-indigo-600 text-white rounded-xl font-semibold hover:bg-sky-500 dark:hover:bg-indigo-500 transition-colors shadow-lg"
                >
                  Learn More
                </button>
              </div>
            </>
          ) : (
            // Case 3: Loading (Spinner)
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-700 border-t-sky-600 dark:border-t-indigo-600 rounded-full animate-spin mb-4"></div>
              <p className="text-sm text-slate-500 dark:text-slate-400">加载广告中...</p>
            </div>
          )}

          {/* Premium Footer */}
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              Premium members enjoy ad-free experience •{' '}
              <button
                onClick={handleUpgrade}
                className="text-sky-600 dark:text-indigo-400 hover:underline font-semibold bg-transparent border-none p-0 inline cursor-pointer"
              >
                Upgrade now
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};