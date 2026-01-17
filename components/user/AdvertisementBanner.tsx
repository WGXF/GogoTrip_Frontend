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

interface AdvertisementBannerProps {
  isPremium: boolean;
}

export const AdvertisementBanner: React.FC<AdvertisementBannerProps> = ({ isPremium }) => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  const [ads, setAds] = useState<Advertisement[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [noAdsAvailable, setNoAdsAvailable] = useState(false);

  // =============================
  // Fetch ads Logic (From New Version)
  // =============================
  useEffect(() => {
    // Premium users don't see ads
    if (isPremium) return;
    fetchActiveAds();
  }, [isPremium]);

  useEffect(() => {
    if (ads.length === 0 || isPremium) return;

    // Record view for current ad
    recordView(ads[currentAdIndex].id);

    // Auto-rotate ads every 30 seconds
    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % ads.length);
    }, 30000);

    return () => clearInterval(interval);
  }, [ads, currentAdIndex, isPremium]);

  const fetchActiveAds = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/advertisements/active`);
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setAds(data);
          setNoAdsAvailable(false);
        } else {
          setAds([]);
          setNoAdsAvailable(true);
        }
      } else {
        setAds([]);
        setNoAdsAvailable(true);
      }
    } catch (error) {
      console.error('Error fetching advertisements:', error);
      setAds([]);
      setNoAdsAvailable(true);
    }
  };

  const recordView = async (adId: number) => {
    try {
      await fetch(`${API_BASE_URL}/api/advertisements/${adId}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error recording view:', error);
    }
  };

  const recordClick = async (adId: number) => {
    try {
      await fetch(`${API_BASE_URL}/api/advertisements/${adId}/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error recording click:', error);
    }
  };

  const handleAdClick = (ad: Advertisement) => {
    recordClick(ad.id);
    window.open(ad.link, '_blank', 'noopener,noreferrer');
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('adDismissed', 'true');
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

  // =============================
  // Visibility guards
  // =============================
  if (isPremium) return null;
  if (!isVisible || sessionStorage.getItem('adDismissed') === 'true') return null;

  const currentAd = ads.length > 0 ? ads[currentAdIndex] : null;
  const { title: adTitle, description: adDesc } = currentAd ? getLocalizedContent(currentAd) : { title: '', description: '' };

  // =============================
  // UI Render (Restored from Old Version)
  // =============================
  return (
    <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] p-6 shadow-sm border border-transparent hover:border-sky-300 dark:hover:border-indigo-500 transition-all duration-500 ease-out overflow-hidden group">
      {/* Close button */}
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 z-10 p-2 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-colors shadow-sm"
        title="Dismiss ad"
      >
        <X size={16} className="text-slate-600 dark:text-slate-400" />
      </button>

      {/* Content Rendering */}
      {noAdsAvailable ? (
        // Case 1: No Ads Available (Placeholder)
        <div className="flex flex-col items-center justify-center py-8 px-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
            <AlertCircle size={32} className="text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 text-center">
            当前没有广告
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
            暂时没有可用的广告内容
          </p>
        </div>
      ) : currentAd ? (
        // Case 2: Show Ad Content
        <div
          onClick={() => handleAdClick(currentAd)}
          className="cursor-pointer"
        >
          {currentAd.imageUrl && (
            <div className="mb-4 rounded-2xl overflow-hidden">
              <img
                src={`${API_BASE_URL}${currentAd.imageUrl}`}
                alt={currentAd.title}
                className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-indigo-400 transition-colors">
                {adTitle}
              </h3>
            </div>

            {adDesc && (
              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                {adDesc}
              </p>
            )}

            {/* Footer: Sponsored Badge + Indicators */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                Sponsored
              </span>
              
              {ads.length > 1 && (
                <div className="flex gap-1">
                  {ads.map((_, index) => (
                    <div
                      key={index}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        index === currentAdIndex
                          ? 'bg-sky-600 dark:bg-indigo-400 w-4'
                          : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // Case 3: Loading State (Spinner)
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-700 border-t-sky-600 dark:border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-sm text-slate-500 dark:text-slate-400">加载广告中...</p>
        </div>
      )}

      {/* Premium upgrade hint */}
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          Upgrade to Premium to remove ads •{' '}
          <button
            onClick={() => navigate('/billing')}
            className="text-sky-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer bg-transparent border-none p-0 inline"
          >
            Learn more
          </button>
        </p>
      </div>
    </div>
  );
};