// components/admin/AdminMessaging.tsx
// 📢 Admin 内部消息系统 - Real-time 版本

import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare, Send, Users, Megaphone, Mail, Check,
  Search, X, User, Clock, AlertCircle, Bell,
  RefreshCw, Plus, Wifi, WifiOff
} from 'lucide-react';
import { API_BASE_URL } from '../../config';
import { useSocket } from '../../hooks/useSocket';

// ================================
// Types
// ================================
interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  isCurrentUser: boolean;
}

interface AdminMessage {
  id: number;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  recipientId?: number;
  recipientName?: string;
  isBroadcast: boolean;
  subject?: string;
  content: string;
  messageType: string;
  priority: string;
  createdAt: string;
  isRead: boolean;
}

interface SystemNotification {
  id: number;
  title: string;
  content?: string;
  notificationType: string;
  relatedType?: string;
  relatedId?: number;
  isRead: boolean;
  createdAt: string;
}

// ================================
// API
// ================================
const messageApi = {
  getMessages: async (type: string = 'all'): Promise<{ messages: AdminMessage[]; unreadCount: number }> => {
    const res = await fetch(`${API_BASE_URL}/api/admin-messages?type=${type}`, { credentials: 'include' });
    const data = await res.json();
    return data.success ? { messages: data.messages, unreadCount: data.unreadCount } : { messages: [], unreadCount: 0 };
  },

  getAdmins: async (): Promise<AdminUser[]> => {
    const res = await fetch(`${API_BASE_URL}/api/admin-messages/admins`, { credentials: 'include' });
    const data = await res.json();
    return data.success ? data.admins : [];
  },

  markRead: async (messageId: number) => {
    await fetch(`${API_BASE_URL}/api/admin-messages/${messageId}/read`, {
      method: 'POST',
      credentials: 'include'
    });
  },

  getSystemNotifications: async (): Promise<{ notifications: SystemNotification[]; unreadCount: number }> => {
    const res = await fetch(`${API_BASE_URL}/api/admin-messages/system-notifications`, { credentials: 'include' });
    const data = await res.json();
    return data.success ? { notifications: data.notifications, unreadCount: data.unreadCount } : { notifications: [], unreadCount: 0 };
  }
};

// ================================
// Priority Badge
// ================================
const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
  const colors: Record<string, string> = {
    urgent: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    normal: 'bg-slate-100 text-slate-600',
    low: 'bg-slate-50 text-slate-400'
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[priority] || colors.normal}`}>
      {priority}
    </span>
  );
};

// ================================
// Main Component
// ================================
const AdminMessaging: React.FC = () => {
  // 🔴 Socket Hook
  const { isConnected, sendAdminMessage, onNewAdminMessage } = useSocket();

  const [activeTab, setActiveTab] = useState<'messages' | 'notifications'>('messages');
  const [messageFilter, setMessageFilter] = useState<'all' | 'received' | 'sent'>('all');
  
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<AdminMessage | null>(null);

  useEffect(() => {
    loadData();
  }, [messageFilter]);

  // 🔴 监听新消息
  useEffect(() => {
    const unsub = onNewAdminMessage((data) => {
      const newMsg: AdminMessage = {
        id: data.id,
        senderId: data.senderId,
        senderName: data.senderName,
        senderAvatar: data.senderAvatar,
        recipientId: data.recipientId,
        recipientName: data.recipientName,
        isBroadcast: data.isBroadcast,
        subject: data.subject,
        content: data.content,
        messageType: 'message',
        priority: data.priority,
        createdAt: data.createdAt,
        isRead: false
      };
      
      setMessages(prev => [newMsg, ...prev]);
      setUnreadMessages(prev => prev + 1);
    });

    return () => unsub();
  }, [onNewAdminMessage]);

  const loadData = async () => {
    setLoading(true);
    
    const [msgData, notifData, adminList] = await Promise.all([
      messageApi.getMessages(messageFilter),
      messageApi.getSystemNotifications(),
      messageApi.getAdmins()
    ]);
    
    setMessages(msgData.messages);
    setUnreadMessages(msgData.unreadCount);
    setNotifications(notifData.notifications);
    setUnreadNotifications(notifData.unreadCount);
    setAdmins(adminList);
    
    setLoading(false);
  };

  const handleMessageClick = async (msg: AdminMessage) => {
    setSelectedMessage(msg);
    if (!msg.isRead) {
      await messageApi.markRead(msg.id);
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isRead: true } : m));
      setUnreadMessages(prev => Math.max(0, prev - 1));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Admin Communications</h1>
            <p className="text-slate-500 mt-1">Internal messages and system notifications</p>
          </div>
          {/* 🔴 连接状态 */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs ${
            isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isConnected ? 'Live' : 'Offline'}
          </div>
        </div>
        <button
          onClick={() => setShowComposeModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Message
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('messages')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'messages'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Messages
            {unreadMessages > 0 && (
              <span className="px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">{unreadMessages}</span>
            )}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'notifications'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            System Notifications
            {unreadNotifications > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">{unreadNotifications}</span>
            )}
          </span>
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {activeTab === 'messages' ? (
          <div className="flex h-[500px]">
            {/* Message List */}
            <div className="w-full md:w-1/2 lg:w-2/5 border-r border-slate-200 flex flex-col">
              {/* Filter */}
              <div className="p-3 border-b border-slate-100 flex gap-2">
                {(['all', 'received', 'sent'] as const).map(filter => (
                  <button
                    key={filter}
                    onClick={() => setMessageFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      messageFilter === filter
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-40">
                    <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No messages</p>
                  </div>
                ) : (
                  messages.map(msg => (
                    <div
                      key={msg.id}
                      onClick={() => handleMessageClick(msg)}
                      className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors ${
                        !msg.isRead ? 'bg-blue-50/50' : ''
                      } ${selectedMessage?.id === msg.id ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {msg.senderAvatar ? (
                            <img src={msg.senderAvatar} alt="" className="w-full h-full object-cover" />
                          ) : msg.isBroadcast ? (
                            <Megaphone className="w-5 h-5 text-slate-500" />
                          ) : (
                            <User className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {msg.isBroadcast && (
                              <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">Broadcast</span>
                            )}
                            <PriorityBadge priority={msg.priority} />
                          </div>
                          <h4 className={`text-sm truncate ${!msg.isRead ? 'font-semibold' : ''}`}>
                            {msg.subject || 'No subject'}
                          </h4>
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {msg.senderName} → {msg.isBroadcast ? 'All Admins' : msg.recipientName}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(msg.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {!msg.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-2" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Message Detail */}
            <div className="hidden md:flex flex-1 flex-col">
              {selectedMessage ? (
                <>
                  <div className="p-4 border-b border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      {selectedMessage.isBroadcast && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-lg flex items-center gap-1">
                          <Megaphone className="w-3 h-3" />Broadcast
                        </span>
                      )}
                      <PriorityBadge priority={selectedMessage.priority} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800">{selectedMessage.subject || 'No subject'}</h3>
                    <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                      <span>From: {selectedMessage.senderName}</span>
                      <span>•</span>
                      <span>To: {selectedMessage.isBroadcast ? 'All Admins' : selectedMessage.recipientName}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{new Date(selectedMessage.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex-1 p-4 overflow-y-auto">
                    <p className="text-slate-700 whitespace-pre-wrap">{selectedMessage.content}</p>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <Mail className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Select a message to view</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* System Notifications */
          <div className="max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div key={notif.id} className={`p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors ${!notif.isRead ? 'bg-blue-50/50' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      notif.notificationType.includes('ticket') ? 'bg-blue-100 text-blue-600' :
                      notif.notificationType === 'new_user' ? 'bg-green-100 text-green-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      <Bell className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className={`text-sm ${!notif.isRead ? 'font-semibold' : ''}`}>{notif.title}</h4>
                      {notif.content && <p className="text-sm text-slate-500 mt-1">{notif.content}</p>}
                      <p className="text-xs text-slate-400 mt-2">{new Date(notif.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Compose Modal */}
      {showComposeModal && (
        <ComposeMessageModal
          admins={admins}
          isConnected={isConnected}
          onSend={sendAdminMessage}
          onClose={() => setShowComposeModal(false)}
          onSent={() => {
            setShowComposeModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
};

// ================================
// Compose Modal (使用 Socket 发送)
// ================================
const ComposeMessageModal: React.FC<{
  admins: AdminUser[];
  isConnected: boolean;
  onSend: (recipientId: number | null, content: string, subject?: string, priority?: string) => void;
  onClose: () => void;
  onSent: () => void;
}> = ({ admins, isConnected, onSend, onClose, onSent }) => {
  const [isBroadcast, setIsBroadcast] = useState(true);
  const [recipientId, setRecipientId] = useState<number | null>(null);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('normal');
  const [error, setError] = useState('');

  const handleSend = () => {
    if (!content.trim()) {
      setError('Please enter a message');
      return;
    }

    if (!isBroadcast && !recipientId) {
      setError('Please select a recipient');
      return;
    }

    if (!isConnected) {
      setError('Not connected to server');
      return;
    }

    // 🔴 通过 Socket 发送
    onSend(isBroadcast ? null : recipientId, content, subject, priority);
    onSent();
  };

  const otherAdmins = admins.filter(a => !a.isCurrentUser);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">New Message</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />{error}
            </div>
          )}

          {/* Send Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Send To</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setIsBroadcast(true); setRecipientId(null); }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
                  isBroadcast ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <Megaphone className="w-4 h-4" />All Admins
              </button>
              <button
                type="button"
                onClick={() => setIsBroadcast(false)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
                  !isBroadcast ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <User className="w-4 h-4" />Specific Admin
              </button>
            </div>
          </div>

          {/* Recipient Select */}
          {!isBroadcast && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Recipient</label>
              <select
                value={recipientId || ''}
                onChange={(e) => setRecipientId(Number(e.target.value) || null)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white"
              >
                <option value="">Select admin...</option>
                {otherAdmins.map(admin => (
                  <option key={admin.id} value={admin.id}>{admin.name} ({admin.email})</option>
                ))}
              </select>
            </div>
          )}

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Subject (optional)</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Message subject"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
            <div className="flex gap-2">
              {['low', 'normal', 'high', 'urgent'].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    priority === p
                      ? p === 'urgent' ? 'bg-red-100 text-red-700' :
                        p === 'high' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Message *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your message..."
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-3 bg-slate-100 rounded-xl font-medium hover:bg-slate-200 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!isConnected}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send {isBroadcast ? 'Broadcast' : 'Message'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminMessaging;
