import React, { useState, useEffect } from 'react';
import {
  Bell, Plus, Send, Eye, Trash2, Edit2, Search,
  Megaphone, Users, Crown, Gift, AlertTriangle,
  Calendar, Link, Image, FileText, CheckCircle,
  X, ChevronRight, BarChart3, Clock, Target, Mail
} from 'lucide-react';

// ================================
// Types
// ================================
interface NotificationTab {
  id: number;
  title: string;
  subtitle?: string;
  content: string;
  contentType: 'markdown' | 'html' | 'plain';
  coverImage?: string;
  bannerImage?: string;
  ctaText?: string;
  ctaLink?: string;
  ctaStyle: 'primary' | 'secondary' | 'danger';
  targetAudience: 'all' | 'premium' | 'free' | 'new_users';
  category: 'announcement' | 'promotion' | 'update' | 'alert';
  priority: number;
  status: 'draft' | 'active' | 'scheduled' | 'archived';
  startAt?: string;
  endAt?: string;
  views: number;
  ctaClicks: number;
  createdAt?: string;
  isActive: boolean;
}

interface NotificationRecord {
  id: number;
  title?: string;
  text: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  tabId?: number;
  isBroadcast: boolean;
  createdAt?: string;
}

interface Stats {
  totalTabs: number;
  activeTabs: number;
  totalNotifications: number;
  recentNotifications: number;
  topTabs: { id: number; title: string; views: number }[];
}

import { API_BASE_URL } from '../../config';

// ================================
// API Functions
// ================================
const API_BASE = `${API_BASE_URL}/api/notifications`;

const api = {
  // Tabs
  getTabs: async (status = 'all') => {
    const res = await fetch(`${API_BASE}/admin/tabs?status=${status}`, { credentials: 'include' });
    return res.json();
  },
  createTab: async (data: Partial<NotificationTab>) => {
    const res = await fetch(`${API_BASE}/admin/tabs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    return res.json();
  },
  updateTab: async (id: number, data: Partial<NotificationTab>) => {
    const res = await fetch(`${API_BASE}/admin/tabs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    return res.json();
  },
  deleteTab: async (id: number) => {
    const res = await fetch(`${API_BASE}/admin/tabs/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    return res.json();
  },
  // Notifications
  sendNotification: async (data: any) => {
    const res = await fetch(`${API_BASE}/admin/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    return res.json();
  },
  getNotifications: async () => {
    const res = await fetch(`${API_BASE}/admin/list`, { credentials: 'include' });
    return res.json();
  },
  getStats: async () => {
    const res = await fetch(`${API_BASE}/admin/stats`, { credentials: 'include' });
    return res.json();
  }
};

// ================================
// Main Component
// ================================
const NotificationManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'tabs' | 'send' | 'history'>('overview');
  const [tabs, setTabs] = useState<NotificationTab[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTabModal, setShowTabModal] = useState(false);
  const [editingTab, setEditingTab] = useState<NotificationTab | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tabsRes, notifsRes, statsRes] = await Promise.all([
        api.getTabs(),
        api.getNotifications(),
        api.getStats()
      ]);
      if (tabsRes.success) setTabs(tabsRes.tabs || []);
      if (notifsRes.success) setNotifications(notifsRes.notifications || []);
      if (statsRes.success) setStats(statsRes.stats);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  const handleDeleteTab = async (id: number) => {
    if (!confirm('确定要删除这个公告Tab吗？')) return;
    const res = await api.deleteTab(id);
    if (res.success) {
      setTabs(tabs.filter(t => t.id !== id));
    }
  };

  // Tab Navigation
  const TabNav = () => (
    <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6">
      {[
        { key: 'overview', label: 'Overview', icon: BarChart3 },
        { key: 'tabs', label: 'Content Tabs', icon: FileText },
        { key: 'send', label: 'Send Notification', icon: Send },
        { key: 'history', label: 'History', icon: Clock }
      ].map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => setActiveTab(key as any)}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
            activeTab === key
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Icon size={16} />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );

  // Overview Panel
  const OverviewPanel = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Tabs', value: stats?.totalTabs || 0, icon: FileText, color: 'blue' },
          { label: 'Active Tabs', value: stats?.activeTabs || 0, icon: CheckCircle, color: 'green' },
          { label: 'Total Sent', value: stats?.totalNotifications || 0, icon: Send, color: 'purple' },
          { label: 'This Week', value: stats?.recentNotifications || 0, icon: Calendar, color: 'orange' }
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
            <div className={`w-10 h-10 rounded-xl bg-${color}-100 dark:bg-${color}-900/30 flex items-center justify-center mb-3`}>
              <Icon className={`text-${color}-600 dark:text-${color}-400`} size={20} />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Top Tabs */}
      {stats?.topTabs && stats.topTabs.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Eye size={20} />
            Most Viewed Tabs
          </h3>
          <div className="space-y-3">
            {stats.topTabs.map((tab, idx) => (
              <div key={tab.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                    idx === 1 ? 'bg-slate-200 text-slate-600' :
                    idx === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="text-slate-800 dark:text-slate-200">{tab.title}</span>
                </div>
                <span className="text-sm text-slate-500">{tab.views} views</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => { setEditingTab(null); setShowTabModal(true); }}
          className="flex items-center gap-4 p-5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl text-white hover:from-blue-600 hover:to-blue-700 transition-all group"
        >
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Plus size={24} />
          </div>
          <div className="text-left">
            <p className="font-semibold">Create New Tab</p>
            <p className="text-sm text-blue-100">Build announcement content</p>
          </div>
          <ChevronRight className="ml-auto opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </button>
        
        <button
          onClick={() => setActiveTab('send')}
          className="flex items-center gap-4 p-5 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl text-white hover:from-purple-600 hover:to-purple-700 transition-all group"
        >
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Megaphone size={24} />
          </div>
          <div className="text-left">
            <p className="font-semibold">Send Notification</p>
            <p className="text-sm text-purple-100">Broadcast to users</p>
          </div>
          <ChevronRight className="ml-auto opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </button>
      </div>
    </div>
  );

  // Tabs List Panel
  const TabsPanel = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Content Tabs</h3>
        <button
          onClick={() => { setEditingTab(null); setShowTabModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          New Tab
        </button>
      </div>

      {tabs.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
          <FileText className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={48} />
          <p className="text-slate-500 dark:text-slate-400">No content tabs yet</p>
          <button
            onClick={() => { setEditingTab(null); setShowTabModal(true); }}
            className="mt-4 text-blue-600 hover:underline"
          >
            Create your first tab
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-4">
                {tab.coverImage ? (
                  <img src={tab.coverImage} alt="" className="w-20 h-20 rounded-xl object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                    <FileText className="text-slate-400" size={24} />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-slate-900 dark:text-white truncate">{tab.title}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      tab.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      tab.status === 'draft' ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' :
                      tab.status === 'scheduled' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {tab.status}
                    </span>
                  </div>
                  {tab.subtitle && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 truncate">{tab.subtitle}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Eye size={12} /> {tab.views}</span>
                    <span className="flex items-center gap-1"><Target size={12} /> {tab.targetAudience}</span>
                    <span>{tab.createdAt}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setEditingTab(tab); setShowTabModal(true); }}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteTab(tab.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Send Notification Panel
  const SendPanel = () => {
    const [formData, setFormData] = useState({
      sendType: 'broadcast',
      title: '',
      text: '',
      type: 'info',
      icon: '',
      tabId: '',
      targetAudience: 'all',
      targetUserIds: '',
      sendEmail: false  // 🆕 NEW: Send email checkbox
    });
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleSend = async () => {
      if (!formData.text.trim()) {
        alert('Please enter notification text');
        return;
      }
      
      setSending(true);
      setResult(null);
      
      try {
        const payload = {
          ...formData,
          tabId: formData.tabId ? parseInt(formData.tabId) : null,
          targetUserIds: formData.targetUserIds
            ? formData.targetUserIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
            : [],
          sendEmail: formData.sendEmail  // 🆕 Include sendEmail flag
        };
        
        const res = await api.sendNotification(payload);
        setResult({ success: res.success, message: res.message || res.error });
        
        if (res.success) {
          setFormData({ ...formData, title: '', text: '', sendEmail: false });
          loadData();
        }
      } catch (error) {
        setResult({ success: false, message: 'Failed to send notification' });
      }
      
      setSending(false);
    };

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Megaphone size={20} />
            Send Notification
          </h3>

          {/* Send Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Send Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'broadcast', label: 'Broadcast All', icon: Megaphone },
                { value: 'targeted', label: 'By Audience', icon: Users },
                { value: 'single', label: 'Specific Users', icon: Target }
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setFormData({ ...formData, sendType: value })}
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition-all flex flex-col items-center gap-2 ${
                    formData.sendType === value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Icon size={20} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Target Audience (for targeted) */}
          {formData.sendType === 'targeted' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Target Audience
              </label>
              <select
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Users</option>
                <option value="premium">Premium Users Only</option>
                <option value="free">Free Users Only</option>
              </select>
            </div>
          )}

          {/* User IDs (for single) */}
          {formData.sendType === 'single' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                User IDs (comma separated)
              </label>
              <input
                type="text"
                value={formData.targetUserIds}
                onChange={(e) => setFormData({ ...formData, targetUserIds: e.target.value })}
                placeholder="1, 2, 3"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Title (optional)
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="🎉 Special Announcement"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Text */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Message *
            </label>
            <textarea
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              placeholder="Enter your notification message..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Notification Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Type
            </label>
            <div className="flex gap-2">
              {[
                { value: 'info', label: 'Info', color: 'blue' },
                { value: 'success', label: 'Success', color: 'green' },
                { value: 'warning', label: 'Warning', color: 'yellow' },
                { value: 'alert', label: 'Alert', color: 'red' }
              ].map(({ value, label, color }) => (
                <button
                  key={value}
                  onClick={() => setFormData({ ...formData, type: value })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    formData.type === value
                      ? `bg-${color}-100 text-${color}-700 dark:bg-${color}-900/30 dark:text-${color}-400 ring-2 ring-${color}-500`
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Link to Tab */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Link to Content Tab (optional)
            </label>
            <select
              value={formData.tabId}
              onChange={(e) => setFormData({ ...formData, tabId: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No linked tab</option>
              {tabs.filter(t => t.status === 'active').map(tab => (
                <option key={tab.id} value={tab.id}>{tab.title}</option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">
              Users will see "View Details" when a tab is linked
            </p>
          </div>

          {/* 🆕 Send Email Checkbox */}
          <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.sendEmail}
                onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
                className="w-5 h-5 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                  📧 Also Send Email
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Send email notification to users who have opted in to email notifications.
                  Users who have disabled email notifications in Settings will not receive emails.
                </p>
              </div>
            </label>
          </div>

          {/* Result Message */}
          {result && (
            <div className={`p-4 rounded-xl mb-4 ${
              result.success
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
            }`}>
              {result.message}
            </div>
          )}

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={sending || !formData.text.trim()}
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send size={18} />
                Send Notification
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  // History Panel
  const HistoryPanel = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Notification History</h3>
      
      {notifications.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
          <Bell className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={48} />
          <p className="text-slate-500 dark:text-slate-400">No notifications sent yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(notif => (
            <div
              key={notif.id}
              className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex items-center gap-4"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                notif.type === 'success' ? 'bg-green-100 text-green-600' :
                notif.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                notif.type === 'alert' ? 'bg-red-100 text-red-600' :
                'bg-blue-100 text-blue-600'
              }`}>
                <Bell size={18} />
              </div>
              <div className="flex-1 min-w-0">
                {notif.title && (
                  <p className="font-medium text-slate-900 dark:text-white">{notif.title}</p>
                )}
                <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{notif.text}</p>
              </div>
              <div className="text-right text-xs text-slate-400">
                <p>{notif.isBroadcast ? 'Broadcast' : 'Single'}</p>
                <p>{notif.createdAt}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Tab Editor Modal
  const TabEditorModal = () => {
    const [formData, setFormData] = useState<Partial<NotificationTab>>(
      editingTab || {
        title: '',
        subtitle: '',
        content: '',
        contentType: 'markdown',
        coverImage: '',
        bannerImage: '',
        ctaText: '',
        ctaLink: '',
        ctaStyle: 'primary',
        targetAudience: 'all',
        category: 'announcement',
        priority: 0,
        status: 'draft',
        startAt: '',
        endAt: ''
      }
    );
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
      if (!formData.title || !formData.content) {
        alert('Title and content are required');
        return;
      }

      setSaving(true);
      try {
        let res;
        if (editingTab) {
          res = await api.updateTab(editingTab.id, formData);
        } else {
          res = await api.createTab(formData);
        }
        
        if (res.success) {
          setShowTabModal(false);
          loadData();
        } else {
          alert(res.error || 'Failed to save');
        }
      } catch (error) {
        alert('Failed to save tab');
      }
      setSaving(false);
    };

    if (!showTabModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {editingTab ? 'Edit Content Tab' : 'Create Content Tab'}
            </h2>
            <button
              onClick={() => setShowTabModal(false)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-5">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Announcement Title"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={formData.subtitle || ''}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Brief description"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Content * (Markdown supported)
              </label>
              <textarea
                value={formData.content || ''}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your announcement content here..."
                rows={8}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>

            {/* Images */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Cover Image URL
                </label>
                <input
                  type="text"
                  value={formData.coverImage || ''}
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Banner Image URL
                </label>
                <input
                  type="text"
                  value={formData.bannerImage || ''}
                  onChange={(e) => setFormData({ ...formData, bannerImage: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* CTA */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  CTA Button Text
                </label>
                <input
                  type="text"
                  value={formData.ctaText || ''}
                  onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                  placeholder="Learn More"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  CTA Link
                </label>
                <input
                  type="text"
                  value={formData.ctaLink || ''}
                  onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                  placeholder="/billing"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  CTA Style
                </label>
                <select
                  value={formData.ctaStyle || 'primary'}
                  onChange={(e) => setFormData({ ...formData, ctaStyle: e.target.value as any })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="primary">Primary (Blue)</option>
                  <option value="secondary">Secondary (Gray)</option>
                  <option value="danger">Danger (Red)</option>
                </select>
              </div>
            </div>

            {/* Settings */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={formData.category || 'announcement'}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="announcement">📢 Announcement</option>
                  <option value="promotion">🎁 Promotion</option>
                  <option value="update">🚀 Update</option>
                  <option value="alert">⚠️ Alert</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Target Audience
                </label>
                <select
                  value={formData.targetAudience || 'all'}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as any })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">👥 All Users</option>
                  <option value="premium">👑 Premium Only</option>
                  <option value="free">🆓 Free Users</option>
                  <option value="new_users">🌟 New Users</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Status
                </label>
                <select
                  value={formData.status || 'draft'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">📝 Draft</option>
                  <option value="active">✅ Active</option>
                  <option value="scheduled">📅 Scheduled</option>
                  <option value="archived">📦 Archived</option>
                </select>
              </div>
            </div>

            {/* Schedule */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Start Date (optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.startAt ? formData.startAt.slice(0, 16) : ''}
                  onChange={(e) => setFormData({ ...formData, startAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  End Date (optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.endAt ? formData.endAt.slice(0, 16) : ''}
                  onChange={(e) => setFormData({ ...formData, endAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <button
              onClick={() => setShowTabModal(false)}
              className="px-6 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  {editingTab ? 'Update Tab' : 'Create Tab'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Main Render
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Bell className="text-blue-500" />
          Notification Center
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Create announcements and send notifications to users
        </p>
      </div>

      <TabNav />

      {activeTab === 'overview' && <OverviewPanel />}
      {activeTab === 'tabs' && <TabsPanel />}
      {activeTab === 'send' && <SendPanel />}
      {activeTab === 'history' && <HistoryPanel />}

      <TabEditorModal />
    </div>
  );
};

export default NotificationManager;
