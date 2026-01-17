import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Megaphone,
  ArrowLeft,
  Calendar,
  Loader2,
  AlertCircle,
  Gift,
  Sparkles,
  AlertTriangle,
  Users,
  Crown,
  Eye,
  Clock,
  ExternalLink,
  ChevronRight,
  Share2,
  Bell
} from 'lucide-react';
import { API_BASE_URL } from '../../config';

/* =========================
   Types & Interfaces
========================= */
interface Announcement {
  id: number;
  title: string;
  subtitle?: string;
  content: string;
  contentType?: 'html' | 'markdown' | 'text';
  category?: string;
  targetAudience?: string;
  priority?: number;
  views?: number;
  coverImage?: string;
  bannerImage?: string;
  ctaText?: string;
  ctaLink?: string;
  ctaStyle?: string;
  createdAt: string;
  endAt?: string;
}

/* =========================
   Helper Components
========================= */
const CategoryBadge: React.FC<{ category?: string }> = ({ category = 'announcement' }) => {
  const config: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    announcement: { icon: <Megaphone className="w-3 h-3" />, color: 'blue', label: 'Announcement' },
    promotion: { icon: <Gift className="w-3 h-3" />, color: 'purple', label: 'Promotion' },
    update: { icon: <Sparkles className="w-3 h-3" />, color: 'green', label: 'Update' },
    alert: { icon: <AlertTriangle className="w-3 h-3" />, color: 'red', label: 'Alert' }
  };
  
  const { icon, color, label } = config[category] || config.announcement;
  
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  };
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${colorClasses[color]}`}>
      {icon}
      {label}
    </span>
  );
};

const AudienceBadge: React.FC<{ audience?: string }> = ({ audience = 'all' }) => {
  const config: Record<string, { icon: React.ReactNode; label: string }> = {
    all: { icon: <Users className="w-3 h-3" />, label: 'All Users' },
    premium: { icon: <Crown className="w-3 h-3" />, label: 'Premium' },
    free: { icon: <Users className="w-3 h-3" />, label: 'Free Users' },
    new_users: { icon: <Sparkles className="w-3 h-3" />, label: 'New Users' }
  };
  
  const { icon, label } = config[audience] || config.all;
  
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800">
      {icon}
      {label}
    </span>
  );
};

const SimpleMarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const renderLine = (line: string, index: number) => {
    // Headers
    if (line.startsWith('### ')) return <h3 key={index} className="text-lg font-semibold text-slate-800 dark:text-white mt-6 mb-2">{line.slice(4)}</h3>;
    if (line.startsWith('## ')) return <h2 key={index} className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-3">{line.slice(3)}</h2>;
    if (line.startsWith('# ')) return <h1 key={index} className="text-2xl font-bold text-slate-900 dark:text-white mt-8 mb-4">{line.slice(2)}</h1>;
    
    // Lists
    if (line.startsWith('- ') || line.startsWith('* ')) return <li key={index} className="ml-4 text-slate-700 dark:text-slate-300 mb-1 list-disc">{line.slice(2)}</li>;
    
    // Empty line
    if (line.trim() === '') return <div key={index} className="h-4" />;
    
    // Basic formatting
    let processedLine = line
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');
    
    return <p key={index} className="text-slate-700 dark:text-slate-300 mb-3 leading-relaxed" dangerouslySetInnerHTML={{ __html: processedLine }} />;
  };
  
  return <div className="prose-custom">{content.split('\n').map((line, index) => renderLine(line, index))}</div>;
};

/* =========================
   Announcement List Page
   URL: /announcements
========================= */
export const AnnouncementListPage: React.FC = () => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/announcements`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch announcements');
      const data = await res.json();
      setAnnouncements(data.announcements || []);
    } catch (err) {
      setError('Unable to load announcements');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="md:hidden">
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </button>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <Megaphone className="w-6 h-6 md:w-8 md:h-8 text-sky-600" />
          Announcements
        </h1>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center py-12 text-red-500 gap-2">
           <AlertCircle className="w-8 h-8" />
           <p>{error}</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Bell className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500">No announcements available at the moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map(item => (
            <div 
              key={item.id} 
              onClick={() => navigate(`/announcements/${item.id}`)} 
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:shadow-lg hover:border-sky-300 dark:hover:border-sky-700 hover:-translate-y-0.5 transition-all cursor-pointer group"
            >
              <div className="flex gap-4">
                {/* Thumbnail */}
                {item.coverImage ? (
                  <img src={item.coverImage} alt="" className="w-24 h-24 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-sky-100 to-sky-50 dark:from-sky-900/30 dark:to-slate-800 flex items-center justify-center shrink-0">
                    <Megaphone className="w-8 h-8 text-sky-500" />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <CategoryBadge category={item.category} />
                  </div>
                  
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors truncate">
                    {item.title}
                  </h3>
                  
                  {item.subtitle && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-1">
                      {item.subtitle}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                       <Calendar className="w-3 h-3" />
                       {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    {item.views !== undefined && (
                       <span className="flex items-center gap-1">
                         <Eye className="w-3 h-3" />
                         {item.views} views
                       </span>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-sky-500 group-hover:translate-x-1 transition-all self-center" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* =========================
   Announcement Detail Page
   URL: /announcements/:id
========================= */
const AnnouncementPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnnouncement();
  }, [id]);

  const fetchAnnouncement = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/announcements/${id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      setAnnouncement(data.announcement);
    } catch {
      setError('Announcement not found or has expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!announcement) return;
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: announcement.title, url: shareUrl });
      } catch {}
    } else {
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  };

  const handleCtaClick = () => {
    if (announcement?.ctaLink) {
      if (announcement.ctaLink.startsWith('http')) {
        window.open(announcement.ctaLink, '_blank');
      } else {
        navigate(announcement.ctaLink);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  if (error || !announcement) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
          <Bell className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-slate-500">{error || 'Announcement not found'}</p>
        <button 
          onClick={() => navigate('/announcements')}
          className="text-sky-600 font-medium hover:underline"
        >
          Back to list
        </button>
      </div>
    );
  }

  const getCtaStyles = () => {
    switch (announcement.ctaStyle) {
      case 'secondary': return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200';
      case 'danger': return 'bg-red-500 text-white hover:bg-red-600';
      default: return 'bg-gradient-to-r from-sky-500 to-sky-600 text-white hover:from-sky-600 hover:to-sky-700';
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      {/* Navigation */}
      <button
        onClick={() => navigate('/announcements')}
        className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to announcements
      </button>

      {/* Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {(announcement.bannerImage || announcement.coverImage) && (
          <div className="h-48 md:h-64 overflow-hidden">
            <img 
              src={announcement.bannerImage || announcement.coverImage} 
              alt={announcement.title} 
              className="w-full h-full object-cover" 
            />
          </div>
        )}
        
        <div className="p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <CategoryBadge category={announcement.category} />
            <AudienceBadge audience={announcement.targetAudience} />
            {announcement.priority === 2 && (
              <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium rounded">
                🔥 Urgent
              </span>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">
            {announcement.title}
          </h1>
          
          {announcement.subtitle && (
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-4">
              {announcement.subtitle}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {new Date(announcement.createdAt).toLocaleDateString()}
            </span>
            {announcement.views !== undefined && (
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                {announcement.views.toLocaleString()} views
              </span>
            )}
            {announcement.endAt && (
              <span className="flex items-center gap-1.5 text-orange-500">
                <Clock className="w-4 h-4" />
                Expires: {new Date(announcement.endAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8">
        {announcement.contentType === 'html' ? (
          <div className="prose prose-slate dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: announcement.content }} />
        ) : announcement.contentType === 'markdown' ? (
          <SimpleMarkdownRenderer content={announcement.content} />
        ) : (
          <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">
            {announcement.content}
          </div>
        )}
      </div>

      {/* CTA Section */}
      {(announcement.ctaText || announcement.ctaLink) && (
        <div className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800/50 dark:to-slate-900/50 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Ready to take action?</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {announcement.category === 'promotion' ? "Don't miss this opportunity!" : "Click the button to proceed"}
              </p>
            </div>
            <button 
              onClick={handleCtaClick} 
              className={`px-8 py-4 rounded-2xl font-semibold transition-all flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 ${getCtaStyles()}`}
            >
              {announcement.ctaText || 'Learn More'}
              {announcement.ctaLink?.startsWith('http') ? <ExternalLink className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Share Button */}
      <div className="flex items-center justify-center pb-8">
        <button 
          onClick={handleShare} 
          className="flex items-center gap-2 px-6 py-3 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
        >
          <Share2 className="w-4 h-4" /> Share this announcement
        </button>
      </div>
    </div>
  );
};

export default AnnouncementPage;