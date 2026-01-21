// components/user/SupportTicket.tsx
// 🎫 User support ticket system - Real-time version

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  MessageCircle, Plus, Send, Clock, CheckCircle, AlertTriangle,
  ArrowLeft, X, Loader2, HelpCircle, CreditCard,
  Settings, MessageSquare, ChevronRight, Timer, Wifi, WifiOff
} from 'lucide-react';
import { API_BASE_URL } from '../../config';
import { useSocket } from '../../hooks/useSocket';

// ================================
// Types
// ================================
interface Ticket {
  id: number;
  subject: string;
  category: string;
  priority: string;
  status: string;
  assignedAdminName?: string;
  timeRemaining: number;
  isExpired: boolean;
  createdAt: string;
  lastMessage?: {
    text: string;
    senderType: string;
    time: string;
  };
}

interface TicketMessage {
  id: number;
  senderId: number;
  senderType: 'user' | 'admin' | 'system';
  senderName: string;
  senderAvatar?: string;
  content: string;
  messageType: string;
  createdAt: string;
}

interface TicketDetail extends Ticket {
  userId: number;
  userName: string;
  userEmail: string;
  assignedAdminId?: number;
  acceptedAt?: string;
  expiresAt?: string;
  resolvedAt?: string;
  messageCount: number;
}

// ================================
// API
// ================================
const ticketApi = {
  getTickets: async (): Promise<Ticket[]> => {
    const res = await fetch(`${API_BASE_URL}/api/tickets/user`, { credentials: 'include' });
    const data = await res.json();
    return data.success ? data.tickets : [];
  },

  getTicketDetail: async (id: number): Promise<{ ticket: TicketDetail; messages: TicketMessage[] } | null> => {
    const res = await fetch(`${API_BASE_URL}/api/tickets/user/${id}`, { credentials: 'include' });
    const data = await res.json();
    return data.success ? { ticket: data.ticket, messages: data.messages } : null;
  },

  createTicket: async (subject: string, category: string, priority: string, message: string) => {
    const res = await fetch(`${API_BASE_URL}/api/tickets/user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ subject, category, priority, message })
    });
    return res.json();
  },

  closeTicket: async (ticketId: number) => {
    const res = await fetch(`${API_BASE_URL}/api/tickets/user/${ticketId}/close`, {
      method: 'POST',
      credentials: 'include'
    });
    return res.json();
  }
};

// ================================
// Helper Components
// ================================
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    pending: { color: 'yellow', icon: <Clock className="w-3 h-3" />, label: 'Waiting' },
    accepted: { color: 'blue', icon: <CheckCircle className="w-3 h-3" />, label: 'Accepted' },
    in_progress: { color: 'indigo', icon: <MessageCircle className="w-3 h-3" />, label: 'In Progress' },
    resolved: { color: 'green', icon: <CheckCircle className="w-3 h-3" />, label: 'Resolved' },
    expired: { color: 'red', icon: <AlertTriangle className="w-3 h-3" />, label: 'Expired' },
    closed: { color: 'slate', icon: <X className="w-3 h-3" />, label: 'Closed' }
  };

  const { color, icon, label } = config[status] || config.pending;
  const colorClasses: Record<string, string> = {
    yellow: 'bg-yellow-100 text-yellow-700',
    blue: 'bg-blue-100 text-blue-700',
    indigo: 'bg-indigo-100 text-indigo-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    slate: 'bg-slate-100 text-slate-700'
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colorClasses[color]}`}>
      {icon}
      {label}
    </span>
  );
};

const CategoryIcon: React.FC<{ category: string }> = ({ category }) => {
  const icons: Record<string, React.ReactNode> = {
    general: <HelpCircle className="w-5 h-5" />,
    billing: <CreditCard className="w-5 h-5" />,
    technical: <Settings className="w-5 h-5" />,
    feedback: <MessageSquare className="w-5 h-5" />
  };
  return <>{icons[category] || icons.general}</>;
};

const formatTimeRemaining = (seconds: number): string => {
  if (seconds <= 0) return 'Expired';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
};

// ================================
// Ticket List Page
// ================================
export const TicketListPage: React.FC = () => {
  const navigate = useNavigate();
  const { onTicketAccepted, onTicketResolved, isConnected } = useSocket();
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  // 🔴 Real-time: 监听工单状态变化
  useEffect(() => {
    const unsubAccepted = onTicketAccepted((data) => {
      setTickets(prev => prev.map(t => 
        t.id === data.ticketId ? { ...t, status: 'accepted', assignedAdminName: data.adminName } : t
      ));
    });

    const unsubResolved = onTicketResolved((data) => {
      setTickets(prev => prev.map(t => 
        t.id === data.ticketId ? { ...t, status: 'resolved' } : t
      ));
    });

    return () => {
      unsubAccepted();
      unsubResolved();
    };
  }, [onTicketAccepted, onTicketResolved]);

  const loadTickets = async () => {
    setLoading(true);
    const data = await ticketApi.getTickets();
    setTickets(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Support Tickets</h1>
            {/* 🔴 连接状态指示器 */}
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
              isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isConnected ? 'Live' : 'Offline'}
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Get help from our support team</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Ticket
        </button>
      </div>

      {/* Ticket List */}
      {tickets.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <MessageCircle className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No tickets yet</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Create a ticket to get support from our team</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Create Your First Ticket
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map(ticket => (
            <div
              key={ticket.id}
              onClick={() => navigate(`/support/${ticket.id}`)}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  ticket.status === 'expired' ? 'bg-red-100 text-red-600' :
                  ticket.status === 'resolved' ? 'bg-green-100 text-green-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  <CategoryIcon category={ticket.category} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={ticket.status} />
                    <span className="text-xs text-slate-400">#{ticket.id}</span>
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors truncate">
                    {ticket.subject}
                  </h3>
                  {ticket.lastMessage && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-1">
                      {ticket.lastMessage.senderType === 'admin' ? '👨‍💼 ' : ''}{ticket.lastMessage.text}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                    <span>{ticket.createdAt}</span>
                    {ticket.status === 'pending' && !ticket.isExpired && (
                      <span className="flex items-center gap-1 text-orange-500">
                        <Timer className="w-3 h-3" />
                        {formatTimeRemaining(ticket.timeRemaining)}
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all self-center" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <CreateTicketModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            loadTickets();
          }}
        />
      )}
    </div>
  );
};

// ================================
// Create Ticket Modal
// ================================
const CreateTicketModal: React.FC<{
  onClose: () => void;
  onCreated: () => void;
}> = ({ onClose, onCreated }) => {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState('normal');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setError('');

    const result = await ticketApi.createTicket(subject, category, priority, message);

    if (result.success) {
      onCreated();
    } else {
      setError(result.error || 'Failed to create ticket');
    }

    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create Support Ticket</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief description of your issue"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'general', label: 'General', icon: <HelpCircle className="w-4 h-4" /> },
                { id: 'billing', label: 'Billing', icon: <CreditCard className="w-4 h-4" /> },
                { id: 'technical', label: 'Technical', icon: <Settings className="w-4 h-4" /> },
                { id: 'feedback', label: 'Feedback', icon: <MessageSquare className="w-4 h-4" /> }
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
                    category === cat.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  {cat.icon}
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description *</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Please describe your issue in detail..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-700 dark:text-amber-400">
                <p className="font-medium">24-Hour Response Window</p>
                <p className="mt-1 opacity-80">Your ticket will be active for 24 hours. If not resolved within this time, it will expire automatically.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" />Create Ticket</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ================================
// 🔴 Ticket Chat Page - Real-time
// ================================
export const TicketChatPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 🔴 Socket Hook
  const { 
    isConnected, 
    joinTicket, 
    leaveTicket, 
    sendTicketMessage, 
    sendTypingStatus,
    onNewTicketMessage, 
    onUserTyping,
    onTicketAccepted,
    onTicketResolved
  } = useSocket();

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [adminTyping, setAdminTyping] = useState<string | null>(null);
  
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // 加载工单数据
  useEffect(() => {
    if (id) loadTicket();
  }, [id]);

  // 🔴 加入 Socket 房间
  useEffect(() => {
    if (id && isConnected) {
      joinTicket(Number(id));
      
      return () => {
        leaveTicket(Number(id));
      };
    }
  }, [id, isConnected, joinTicket, leaveTicket]);

  // 🔴 监听新消息
  useEffect(() => {
    const unsubMessage = onNewTicketMessage((data) => {
      if (data.ticketId === Number(id)) {
        setMessages(prev => {
          // 避免重复
          if (prev.some(m => m.id === data.id)) return prev;
          return [...prev, data];
        });
        // 清除输入状态
        setAdminTyping(null);
      }
    });

    return () => unsubMessage();
  }, [id, onNewTicketMessage]);

  // 🔴 监听输入状态
  useEffect(() => {
    const unsubTyping = onUserTyping((data) => {
      if (data.ticketId === Number(id) && data.isAdmin) {
        if (data.isTyping) {
          setAdminTyping(data.userName);
        } else {
          setAdminTyping(null);
        }
      }
    });

    return () => unsubTyping();
  }, [id, onUserTyping]);

  // 🔴 监听工单状态变化
  useEffect(() => {
    const unsubAccepted = onTicketAccepted((data) => {
      if (data.ticketId === Number(id)) {
        setTicket(prev => prev ? { ...prev, status: 'accepted', assignedAdminName: data.adminName } : prev);
      }
    });

    const unsubResolved = onTicketResolved((data) => {
      if (data.ticketId === Number(id)) {
        setTicket(prev => prev ? { ...prev, status: 'resolved' } : prev);
      }
    });

    return () => {
      unsubAccepted();
      unsubResolved();
    };
  }, [id, onTicketAccepted, onTicketResolved]);

  // 自动滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages, adminTyping]);

  const loadTicket = async () => {
    setLoading(true);
    const data = await ticketApi.getTicketDetail(Number(id));
    if (data) {
      setTicket(data.ticket);
      setMessages(data.messages);
    }
    setLoading(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 🔴 发送消息（通过 Socket）
  const handleSend = useCallback(() => {
    if (!newMessage.trim() || !ticket || !isConnected) return;

    setSending(true);
    sendTicketMessage(ticket.id, newMessage.trim());
    setNewMessage('');
    setSending(false);
    inputRef.current?.focus();
    
    // 停止输入状态
    sendTypingStatus(ticket.id, false);
  }, [newMessage, ticket, isConnected, sendTicketMessage, sendTypingStatus]);

  // 🔴 输入状态
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (ticket && isConnected) {
      // 发送正在输入状态
      sendTypingStatus(ticket.id, true);
      
      // 清除之前的 timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // 2秒后自动停止输入状态
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingStatus(ticket.id, false);
      }, 2000);
    }
  };

  const handleClose = async () => {
    if (!ticket) return;
    if (!confirm('Are you sure you want to close this ticket?')) return;

    const result = await ticketApi.closeTicket(ticket.id);
    if (result.success) {
      loadTicket();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Ticket not found</p>
        <button onClick={() => navigate('/support')} className="mt-4 text-blue-600">Back to tickets</button>
      </div>
    );
  }

  const canSendMessage = ['accepted', 'in_progress'].includes(ticket.status);

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/support')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <StatusBadge status={ticket.status} />
              <span className="text-xs text-slate-400">#{ticket.id}</span>
              {/* 🔴 连接状态 */}
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {isConnected ? 'Live' : 'Reconnecting...'}
              </div>
            </div>
            <h1 className="font-bold text-slate-900 dark:text-white truncate">{ticket.subject}</h1>
          </div>

          {ticket.status !== 'closed' && ticket.status !== 'expired' && (
            <button onClick={handleClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
              Close Ticket
            </button>
          )}
        </div>

        {/* Status Info */}
        {ticket.status === 'pending' && (
          <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl text-sm text-yellow-700 dark:text-yellow-400">
            <p>⏳ Waiting for an admin to accept your ticket...</p>
            <p className="text-xs mt-1 opacity-80">{formatTimeRemaining(ticket.timeRemaining)}</p>
          </div>
        )}

        {ticket.assignedAdminName && (
          <div className="mt-3 text-sm text-slate-500">
            Assigned to: <span className="font-medium">{ticket.assignedAdminName}</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.senderType === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.senderType === 'system' ? (
              <div className="text-center text-xs text-slate-400 py-2 w-full">{msg.content}</div>
            ) : (
              <div className={`max-w-[80%] ${msg.senderType === 'user' ? 'order-1' : ''}`}>
                <div className={`px-4 py-3 rounded-2xl ${
                  msg.senderType === 'user'
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-white dark:bg-slate-800 rounded-bl-md'
                }`}>
                  <p className="text-sm">{msg.content}</p>
                </div>
                <div className={`flex items-center gap-2 mt-1 text-xs text-slate-400 ${msg.senderType === 'user' ? 'justify-end' : ''}`}>
                  <span>{msg.senderName}</span>
                  <span>•</span>
                  <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* 🔴 输入状态指示器 */}
        {adminTyping && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="flex gap-1">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
                <span>{adminTyping} is typing...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {canSendMessage ? (
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={isConnected ? "Type your message..." : "Connecting..."}
              disabled={!isConnected}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={sending || !newMessage.trim() || !isConnected}
              className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-slate-100 dark:bg-slate-800 text-center text-sm text-slate-500">
          {ticket.status === 'pending'
            ? 'You can send messages once an admin accepts your ticket'
            : 'This ticket is closed'
          }
        </div>
      )}
    </div>
  );
};

export default TicketListPage;
