import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageCircle, Clock, CheckCircle, AlertTriangle, Search,
  RefreshCw, Send, User, Timer, X, Inbox, CheckCheck, XCircle,
  Wifi, WifiOff, HelpCircle, CreditCard, Settings, MessageSquare
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
  userName: string;
  userAvatar?: string;
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

interface TicketDetail {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  assignedAdminId?: number;
  assignedAdminName?: string;
  acceptedAt?: string;
  expiresAt?: string;
  resolvedAt?: string;
  timeRemaining: number;
  isExpired: boolean;
  createdAt: string;
  messageCount: number;
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

interface TicketStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  expired: number;
  myTickets: number;
}

// ================================
// API
// ================================
const ticketApi = {
  getTickets: async (filters: Record<string, string> = {}): Promise<{ tickets: Ticket[]; stats: TicketStats }> => {
    const params = new URLSearchParams(filters);
    const res = await fetch(`${API_BASE_URL}/api/tickets/admin?${params}`, { credentials: 'include' });
    const data = await res.json();
    return data.success ? { tickets: data.tickets, stats: data.stats } : { tickets: [], stats: {} as TicketStats };
  },

  getTicketDetail: async (id: number): Promise<{ ticket: TicketDetail; messages: TicketMessage[] } | null> => {
    const res = await fetch(`${API_BASE_URL}/api/tickets/admin/${id}`, { credentials: 'include' });
    const data = await res.json();
    return data.success ? { ticket: data.ticket, messages: data.messages } : null;
  },

  acceptTicket: async (id: number) => {
    const res = await fetch(`${API_BASE_URL}/api/tickets/admin/${id}/accept`, {
      method: 'POST',
      credentials: 'include'
    });
    return res.json();
  },

  resolveTicket: async (id: number) => {
    const res = await fetch(`${API_BASE_URL}/api/tickets/admin/${id}/resolve`, {
      method: 'POST',
      credentials: 'include'
    });
    return res.json();
  }
};

// ================================
// Helper Components
// ================================
const StatusBadge: React.FC<{ status: string; size?: 'sm' | 'md' }> = ({ status, size = 'md' }) => {
  const config: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    pending: { color: 'yellow', icon: <Clock className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />, label: 'Pending' },
    accepted: { color: 'blue', icon: <CheckCircle className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />, label: 'Accepted' },
    in_progress: { color: 'indigo', icon: <MessageCircle className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />, label: 'In Progress' },
    resolved: { color: 'green', icon: <CheckCheck className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />, label: 'Resolved' },
    expired: { color: 'red', icon: <AlertTriangle className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />, label: 'Expired' },
    closed: { color: 'slate', icon: <XCircle className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />, label: 'Closed' }
  };

  const { color, icon, label } = config[status] || config.pending;
  const colorClasses: Record<string, string> = {
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    red: 'bg-red-100 text-red-700 border-red-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${colorClasses[color]}`}>
      {icon}{label}
    </span>
  );
};

const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
  const colors: Record<string, string> = {
    urgent: 'bg-red-500 text-white',
    high: 'bg-orange-500 text-white',
    normal: 'bg-slate-200 text-slate-700',
    low: 'bg-slate-100 text-slate-500'
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[priority] || colors.normal}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
};

const CategoryIcon: React.FC<{ category: string; className?: string }> = ({ category, className = 'w-5 h-5' }) => {
  const icons: Record<string, React.ReactNode> = {
    general: <HelpCircle className={className} />,
    billing: <CreditCard className={className} />,
    technical: <Settings className={className} />,
    feedback: <MessageSquare className={className} />
  };
  return <>{icons[category] || icons.general}</>;
};

const formatTimeRemaining = (seconds: number): string => {
  if (seconds <= 0) return 'Expired';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

// ================================
// Main Component
// ================================
const TicketManager: React.FC = () => {
  // 🔴 Socket Hook
  const {
    isConnected,
    joinTicket,
    leaveTicket,
    sendTicketMessage,
    sendTypingStatus,
    onNewTicketMessage,
    onUserTyping,
    onNewTicket,
    onTicketActivity
  } = useSocket();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [userTyping, setUserTyping] = useState<string | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Initial load
  useEffect(() => {
    loadTickets();
  }, [statusFilter, assignedFilter]);

  // 🔴 Listen for new tickets
  useEffect(() => {
    const unsub = onNewTicket((data) => {
      // Add new ticket to top of list
      setTickets(prev => [{
        id: data.ticketId,
        subject: data.subject,
        userName: data.userName,
        userAvatar: data.userAvatar,
        category: data.category,
        priority: data.priority,
        status: 'pending',
        timeRemaining: 86400,
        isExpired: false,
        createdAt: data.createdAt
      }, ...prev]);
      
      // Update statistics
      setStats(prev => prev ? { ...prev, pending: prev.pending + 1, total: prev.total + 1 } : prev);
    });

    return () => unsub();
  }, [onNewTicket]);

  // 🔴 Listen for ticket activity (user messages, etc.)
  useEffect(() => {
    const unsub = onTicketActivity((data) => {
      // Update last message in ticket list
      setTickets(prev => prev.map(t => 
        t.id === data.ticketId 
          ? { ...t, lastMessage: { text: data.preview, senderType: 'user', time: 'now' } }
          : t
      ));
    });

    return () => unsub();
  }, [onTicketActivity]);

  // 🔴 Join selected ticket room
  useEffect(() => {
    if (selectedTicket && isConnected) {
      joinTicket(selectedTicket.id);
      
      return () => {
        leaveTicket(selectedTicket.id);
      };
    }
  }, [selectedTicket?.id, isConnected, joinTicket, leaveTicket]);

  // 🔴 Listen for new messages in selected ticket
  useEffect(() => {
    const unsub = onNewTicketMessage((data) => {
      if (selectedTicket && data.ticketId === selectedTicket.id) {
        setMessages(prev => {
          if (prev.some(m => m.id === data.id)) return prev;
          return [...prev, data];
        });
        setUserTyping(null);
      }
    });

    return () => unsub();
  }, [selectedTicket?.id, onNewTicketMessage]);

  // 🔴 Listen for user typing status
  useEffect(() => {
    const unsub = onUserTyping((data) => {
      if (selectedTicket && data.ticketId === selectedTicket.id && !data.isAdmin) {
        if (data.isTyping) {
          setUserTyping(data.userName);
        } else {
          setUserTyping(null);
        }
      }
    });

    return () => unsub();
  }, [selectedTicket?.id, onUserTyping]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, userTyping]);

  const loadTickets = async () => {
    const filters: Record<string, string> = {};
    if (statusFilter !== 'all') filters.status = statusFilter;
    if (assignedFilter !== 'all') filters.assigned = assignedFilter;

    const data = await ticketApi.getTickets(filters);
    setTickets(data.tickets);
    setStats(data.stats);
    setLoading(false);
  };

  const openTicket = async (ticketId: number) => {
    const data = await ticketApi.getTicketDetail(ticketId);
    if (data) {
      setSelectedTicket(data.ticket);
      setMessages(data.messages);
    }
  };

  const handleAccept = async () => {
    if (!selectedTicket) return;
    const result = await ticketApi.acceptTicket(selectedTicket.id);
    if (result.success) {
      setSelectedTicket(result.ticket);
      loadTickets();
      // Reload messages
      const data = await ticketApi.getTicketDetail(selectedTicket.id);
      if (data) setMessages(data.messages);
    }
  };

  // 🔴 Send message (via Socket)
  const handleSendMessage = useCallback(() => {
    if (!selectedTicket || !newMessage.trim() || !isConnected) return;

    setSending(true);
    sendTicketMessage(selectedTicket.id, newMessage.trim());
    setNewMessage('');
    setSending(false);
    inputRef.current?.focus();
    
    sendTypingStatus(selectedTicket.id, false);
  }, [selectedTicket, newMessage, isConnected, sendTicketMessage, sendTypingStatus]);

  // 🔴 Typing status
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (selectedTicket && isConnected) {
      sendTypingStatus(selectedTicket.id, true);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingStatus(selectedTicket.id, false);
      }, 2000);
    }
  };

  const handleResolve = async () => {
    if (!selectedTicket) return;
    if (!confirm('Mark this ticket as resolved?')) return;

    const result = await ticketApi.resolveTicket(selectedTicket.id);
    if (result.success) {
      loadTickets();
      setSelectedTicket(null);
    }
  };

  const filteredTickets = tickets.filter(t =>
    t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-180px)] bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Ticket List Panel */}
      <div className={`${selectedTicket ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-96 border-r border-slate-200`}>
        {/* Header */}
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-800">Support Tickets</h2>
              {/* 🔴 Connection status */}
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {isConnected ? 'Live' : 'Offline'}
              </div>
            </div>
            <button onClick={loadTickets} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <RefreshCw className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
            <select
              value={assignedFilter}
              onChange={(e) => setAssignedFilter(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <option value="all">All Tickets</option>
              <option value="me">My Tickets</option>
              <option value="unassigned">Unassigned</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex gap-4 text-xs">
            <span className="text-yellow-600">{stats.pending} pending</span>
            <span className="text-blue-600">{stats.inProgress} active</span>
            <span className="text-green-600">{stats.resolved} resolved</span>
          </div>
        )}

        {/* Ticket List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Inbox className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No tickets found</p>
            </div>
          ) : (
            filteredTickets.map(ticket => (
              <div
                key={ticket.id}
                onClick={() => openTicket(ticket.id)}
                className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors ${
                  selectedTicket?.id === ticket.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
                    {ticket.userAvatar ? (
                      <img src={ticket.userAvatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-5 h-5 text-slate-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={ticket.status} size="sm" />
                      <PriorityBadge priority={ticket.priority} />
                    </div>
                    <h3 className="font-medium text-slate-800 text-sm truncate">{ticket.subject}</h3>
                    <p className="text-xs text-slate-500 truncate">{ticket.userName}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                      <span>{ticket.createdAt}</span>
                      {ticket.status === 'pending' && !ticket.isExpired && (
                        <span className="flex items-center gap-1 text-orange-500">
                          <Timer className="w-3 h-3" />
                          {formatTimeRemaining(ticket.timeRemaining)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Panel */}
      <div className={`${selectedTicket ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
        {selectedTicket ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="md:hidden p-2 hover:bg-slate-100 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-800">{selectedTicket.subject}</h3>
                      <span className="text-xs text-slate-400">#{selectedTicket.id}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={selectedTicket.status} size="sm" />
                      <span className="text-sm text-slate-500">{selectedTicket.userName}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedTicket.status === 'pending' && !selectedTicket.isExpired && (
                    <button
                      onClick={handleAccept}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Accept Ticket
                    </button>
                  )}
                  {['accepted', 'in_progress'].includes(selectedTicket.status) && (
                    <button
                      onClick={handleResolve}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>

              {/* Timer Warning */}
              {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' && !selectedTicket.isExpired && (
                <div className="mt-3 p-2 bg-orange-50 rounded-lg flex items-center gap-2 text-xs text-orange-600">
                  <Timer className="w-4 h-4" />
                  <span>Time remaining: {formatTimeRemaining(selectedTicket.timeRemaining)}</span>
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.senderType === 'system' ? (
                    <div className="text-center text-xs text-slate-400 py-2 w-full">{msg.content}</div>
                  ) : (
                    <div className={`flex items-end gap-2 max-w-[70%] ${msg.senderType === 'admin' ? 'flex-row-reverse' : ''}`}>
                      <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0">
                        {msg.senderAvatar ? (
                          <img src={msg.senderAvatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-4 h-4 text-slate-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className={`px-4 py-3 rounded-2xl ${
                          msg.senderType === 'admin'
                            ? 'bg-blue-600 text-white rounded-br-md'
                            : 'bg-white border border-slate-200 rounded-bl-md'
                        }`}>
                          <p className="text-sm">{msg.content}</p>
                        </div>
                        <div className={`text-xs text-slate-400 mt-1 ${msg.senderType === 'admin' ? 'text-right' : ''}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* 🔴 User typing status */}
              {userTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-md">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <span className="flex gap-1">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                      <span>{userTyping} is typing...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {['accepted', 'in_progress'].includes(selectedTicket.status) ? (
              <div className="p-4 border-t border-slate-100">
                <div className="flex gap-3">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={handleInputChange}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder={isConnected ? "Type your reply..." : "Connecting..."}
                    disabled={!isConnected}
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={sending || !newMessage.trim() || !isConnected}
                    className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : selectedTicket.status === 'pending' ? (
              <div className="p-4 bg-yellow-50 text-center text-sm text-yellow-700">
                Accept this ticket to start chatting
              </div>
            ) : (
              <div className="p-4 bg-slate-100 text-center text-sm text-slate-500">
                This ticket is {selectedTicket.status}
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Select a ticket to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketManager;
