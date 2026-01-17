import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageCircle, Send, User, Search, Plus, X,
  Wifi, WifiOff, Check, CheckCheck, ArrowLeft, MoreVertical
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
  avatar?: string;
  role: string;
}

interface ChatRoom {
  id: number;
  roomType: 'private' | 'group';
  name: string;
  otherMember?: AdminUser;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  unreadCount: number;
}

interface ChatMessage {
  id: number;
  roomId: number;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  content: string;
  messageType: string;
  createdAt: string;
}

// ================================
// API
// ================================
const chatApi = {
  getRooms: async (): Promise<ChatRoom[]> => {
    const res = await fetch(`${API_BASE_URL}/api/admin-chat/rooms`, { credentials: 'include' });
    const data = await res.json();
    return data.success ? data.rooms : [];
  },

  getAdmins: async (): Promise<AdminUser[]> => {
    const res = await fetch(`${API_BASE_URL}/api/admin-chat/admins`, { credentials: 'include' });
    const data = await res.json();
    return data.success ? data.admins : [];
  },

  startChat: async (adminId: number): Promise<ChatRoom | null> => {
    const res = await fetch(`${API_BASE_URL}/api/admin-chat/start/${adminId}`, {
      method: 'POST',
      credentials: 'include'
    });
    const data = await res.json();
    return data.success ? data.room : null;
  },

  getMessages: async (roomId: number, beforeId?: number): Promise<{ messages: ChatMessage[]; hasMore: boolean }> => {
    const url = beforeId
      ? `${API_BASE_URL}/api/admin-chat/rooms/${roomId}/messages?before=${beforeId}`
      : `${API_BASE_URL}/api/admin-chat/rooms/${roomId}/messages`;
    const res = await fetch(url, { credentials: 'include' });
    const data = await res.json();
    return data.success ? { messages: data.messages, hasMore: data.hasMore } : { messages: [], hasMore: false };
  },

  markRead: async (roomId: number) => {
    await fetch(`${API_BASE_URL}/api/admin-chat/rooms/${roomId}/read`, {
      method: 'POST',
      credentials: 'include'
    });
  }
};

// ================================
// Main Component
// ================================
const AdminChatbox: React.FC = () => {
  const { socket, isConnected } = useSocket();
  
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typingUser, setTypingUser] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 初始加载
  useEffect(() => {
    loadRooms();
    loadAdmins();
  }, []);

  // Socket 事件监听
  useEffect(() => {
    if (!socket) return;

    // 新消息
    const handleNewMessage = (data: ChatMessage) => {
      if (selectedRoom && data.roomId === selectedRoom.id) {
        setMessages(prev => {
          if (prev.some(m => m.id === data.id)) return prev;
          return [...prev, data];
        });
        setTypingUser(null);
      }
      
      // 更新房间列表
      setRooms(prev => prev.map(r => 
        r.id === data.roomId 
          ? { 
              ...r, 
              lastMessagePreview: data.content.slice(0, 50),
              lastMessageAt: data.createdAt,
              unreadCount: selectedRoom?.id === data.roomId ? 0 : r.unreadCount + 1
            }
          : r
      ).sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()));
    };

    // 输入状态
    const handleTyping = (data: { roomId: number; userName: string; isTyping: boolean }) => {
      if (selectedRoom && data.roomId === selectedRoom.id) {
        setTypingUser(data.isTyping ? data.userName : null);
      }
    };

    const handleNotification = (data: { roomId: number; senderName: string }) => {
      // 可以显示 toast 通知
      console.log(`💬 New message from ${data.senderName}`);
    };

    socket.on('new_admin_chat_message', handleNewMessage);
    socket.on('admin_chat_user_typing', handleTyping);
    socket.on('admin_chat_notification', handleNotification);

    return () => {
      socket.off('new_admin_chat_message', handleNewMessage);
      socket.off('admin_chat_user_typing', handleTyping);
      socket.off('admin_chat_notification', handleNotification);
    };
  }, [socket, selectedRoom]);

  // 加入/离开房间
  useEffect(() => {
    if (!socket || !selectedRoom) return;

    socket.emit('join_admin_chat', { roomId: selectedRoom.id });

    return () => {
      socket.emit('leave_admin_chat', { roomId: selectedRoom.id });
    };
  }, [socket, selectedRoom?.id]);

  // 自动滚动
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUser]);

  const loadRooms = async () => {
    const data = await chatApi.getRooms();
    setRooms(data);
    setLoading(false);
  };

  const loadAdmins = async () => {
    const data = await chatApi.getAdmins();
    setAdmins(data);
  };

  const openRoom = async (room: ChatRoom) => {
    setSelectedRoom(room);
    const data = await chatApi.getMessages(room.id);
    setMessages(data.messages);
    
    // 清除未读
    setRooms(prev => prev.map(r => r.id === room.id ? { ...r, unreadCount: 0 } : r));
    
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const startNewChat = async (admin: AdminUser) => {
    const room = await chatApi.startChat(admin.id);
    if (room) {
      // 检查是否已存在
      const exists = rooms.find(r => r.id === room.id);
      if (!exists) {
        setRooms(prev => [room, ...prev]);
      }
      openRoom(room);
      setShowNewChat(false);
    }
  };

  // 发送消息
  const handleSend = useCallback(() => {
    if (!newMessage.trim() || !selectedRoom || !socket || !isConnected) return;

    socket.emit('admin_chat_message', {
      roomId: selectedRoom.id,
      content: newMessage.trim()
    });

    setNewMessage('');
    inputRef.current?.focus();
    
    // 停止输入状态
    socket.emit('admin_chat_typing', { roomId: selectedRoom.id, isTyping: false });
  }, [newMessage, selectedRoom, socket, isConnected]);

  // 输入状态
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (selectedRoom && socket && isConnected) {
      socket.emit('admin_chat_typing', { roomId: selectedRoom.id, isTyping: true });
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('admin_chat_typing', { roomId: selectedRoom.id, isTyping: false });
      }, 2000);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const filteredAdmins = admins.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden h-[600px] flex">
      {/* Sidebar - Room List */}
      <div className={`${selectedRoom ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 border-r border-slate-200`}>
        {/* Header */}
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-800">Admin Chat</h2>
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {isConnected ? 'Live' : 'Offline'}
              </div>
            </div>
            <button
              onClick={() => setShowNewChat(true)}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Room List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-slate-400">
              Loading...
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-slate-200" />
              <p className="text-slate-500 text-sm">No conversations yet</p>
              <button
                onClick={() => setShowNewChat(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                Start a Chat
              </button>
            </div>
          ) : (
            rooms.map(room => (
              <div
                key={room.id}
                onClick={() => openRoom(room)}
                className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors ${
                  selectedRoom?.id === room.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center">
                      {room.otherMember?.avatar ? (
                        <img src={room.otherMember.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    {room.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                        {room.unreadCount > 9 ? '9+' : room.unreadCount}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-medium truncate ${room.unreadCount > 0 ? 'text-slate-900' : 'text-slate-700'}`}>
                        {room.name}
                      </h3>
                      {room.lastMessageAt && (
                        <span className="text-xs text-slate-400">{formatTime(room.lastMessageAt)}</span>
                      )}
                    </div>
                    {room.lastMessagePreview && (
                      <p className={`text-sm truncate mt-0.5 ${room.unreadCount > 0 ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                        {room.lastMessagePreview}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${selectedRoom ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-100 flex items-center gap-3">
              <button
                onClick={() => setSelectedRoom(null)}
                className="md:hidden p-2 hover:bg-slate-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center">
                {selectedRoom.otherMember?.avatar ? (
                  <img src={selectedRoom.otherMember.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800">{selectedRoom.name}</h3>
                <p className="text-xs text-slate-400">{selectedRoom.otherMember?.role}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderId === selectedRoom.otherMember?.id ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`flex items-end gap-2 max-w-[75%] ${msg.senderId !== selectedRoom.otherMember?.id ? 'flex-row-reverse' : ''}`}>
                    {msg.senderId === selectedRoom.otherMember?.id && (
                      <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0">
                        {msg.senderAvatar ? (
                          <img src={msg.senderAvatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-4 h-4 text-slate-400" />
                          </div>
                        )}
                      </div>
                    )}
                    <div>
                      <div className={`px-4 py-2.5 rounded-2xl ${
                        msg.senderId === selectedRoom.otherMember?.id
                          ? 'bg-white border border-slate-200 rounded-bl-md'
                          : 'bg-blue-600 text-white rounded-br-md'
                      }`}>
                        <p className="text-sm">{msg.content}</p>
                      </div>
                      <p className={`text-xs text-slate-400 mt-1 ${msg.senderId !== selectedRoom.otherMember?.id ? 'text-right' : ''}`}>
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Typing Indicator */}
              {typingUser && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-2xl rounded-bl-md">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <span className="flex gap-1">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                      <span>{typingUser} is typing...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-100">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder={isConnected ? "Type a message..." : "Connecting..."}
                  disabled={!isConnected}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                />
                <button
                  onClick={handleSend}
                  disabled={!newMessage.trim() || !isConnected}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Select a conversation or start a new chat</p>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">New Conversation</h3>
              <button onClick={() => setShowNewChat(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search admins..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {filteredAdmins.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No admins found</p>
                </div>
              ) : (
                filteredAdmins.map(admin => (
                  <div
                    key={admin.id}
                    onClick={() => startNewChat(admin)}
                    className="p-4 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-100 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center">
                        {admin.avatar ? (
                          <img src={admin.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-800">{admin.name}</h4>
                        <p className="text-sm text-slate-500">{admin.email}</p>
                        <span className="text-xs text-slate-400">{admin.role}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminChatbox;
