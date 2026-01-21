// hooks/useSocket.tsx
// 🔌 Socket.IO React Hook & Provider
// Provides real-time communication functionality

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config';

// ================================
// Types
// ================================
interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;

  // Ticket-related
  joinTicket: (ticketId: number) => void;
  leaveTicket: (ticketId: number) => void;
  sendTicketMessage: (ticketId: number, content: string) => void;
  sendTypingStatus: (ticketId: number, isTyping: boolean) => void;

  // Admin messages
  sendAdminMessage: (recipientId: number | null, content: string, subject?: string, priority?: string) => void;

  // Event listeners
  onNewTicketMessage: (callback: (data: any) => void) => () => void;
  onTicketActivity: (callback: (data: any) => void) => () => void;
  onUserTyping: (callback: (data: any) => void) => () => void;
  onNewAdminMessage: (callback: (data: any) => void) => () => void;
  onNewTicket: (callback: (data: any) => void) => () => void;
  onTicketAccepted: (callback: (data: any) => void) => () => void;
  onTicketResolved: (callback: (data: any) => void) => () => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

// ================================
// Socket Provider
// ================================
interface SocketProviderProps {
  children: React.ReactNode;
  userId?: number;
  isAuthenticated: boolean;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ 
  children, 
  userId, 
  isAuthenticated 
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Initialize Socket connection
  useEffect(() => {
    if (!isAuthenticated || !userId) {
      // Disconnect when not logged in
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Create Socket connection
    const newSocket = io(API_BASE_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection events
    newSocket.on('connect', () => {
      console.log('🔌 Socket connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('🔌 Socket connection error:', error);
      setIsConnected(false);
    });

    newSocket.on('connected', (data) => {
      console.log('✅ Authenticated connection:', data);
    });

    newSocket.on('error', (data) => {
      console.error('❌ Socket error:', data.message);
    });

    // Cleanup
    return () => {
      console.log('🔌 Cleaning up socket connection');
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, userId]);

  // =====================================
  // Ticket methods
  // =====================================

  const joinTicket = useCallback((ticketId: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_ticket', { ticketId });
    }
  }, []);

  const leaveTicket = useCallback((ticketId: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave_ticket', { ticketId });
    }
  }, []);

  const sendTicketMessage = useCallback((ticketId: number, content: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('ticket_message', { ticketId, content });
    }
  }, []);

  const sendTypingStatus = useCallback((ticketId: number, isTyping: boolean) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('ticket_typing', { ticketId, isTyping });
    }
  }, []);

  // =====================================
  // Admin message methods
  // =====================================

  const sendAdminMessage = useCallback((
    recipientId: number | null, 
    content: string, 
    subject?: string, 
    priority?: string
  ) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('admin_message', {
        recipientId,
        isBroadcast: recipientId === null,
        content,
        subject,
        priority: priority || 'normal'
      });
    }
  }, []);

  // =====================================
  // Event listeners (return cleanup function)
  // =====================================

  const createEventListener = useCallback((eventName: string) => {
    return (callback: (data: any) => void) => {
      if (socketRef.current) {
        socketRef.current.on(eventName, callback);
        return () => {
          socketRef.current?.off(eventName, callback);
        };
      }
      return () => {};
    };
  }, []);

  const onNewTicketMessage = useCallback(createEventListener('new_ticket_message'), [createEventListener]);
  const onTicketActivity = useCallback(createEventListener('ticket_activity'), [createEventListener]);
  const onUserTyping = useCallback(createEventListener('user_typing'), [createEventListener]);
  const onNewAdminMessage = useCallback(createEventListener('new_admin_message'), [createEventListener]);
  const onNewTicket = useCallback(createEventListener('new_ticket'), [createEventListener]);
  const onTicketAccepted = useCallback(createEventListener('ticket_accepted'), [createEventListener]);
  const onTicketResolved = useCallback(createEventListener('ticket_resolved'), [createEventListener]);

  // =====================================
  // Context value
  // =====================================

  const value: SocketContextType = {
    socket,
    isConnected,
    joinTicket,
    leaveTicket,
    sendTicketMessage,
    sendTypingStatus,
    sendAdminMessage,
    onNewTicketMessage,
    onTicketActivity,
    onUserTyping,
    onNewAdminMessage,
    onNewTicket,
    onTicketAccepted,
    onTicketResolved,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

// ================================
// Custom Hook
// ================================
export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

// ================================
// Connection Status Component
// ================================
export const SocketStatus: React.FC = () => {
  const { isConnected } = useSocket();
  
  return (
    <div className={`flex items-center gap-2 text-xs ${isConnected ? 'text-green-600' : 'text-red-500'}`}>
      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
      {isConnected ? 'Connected' : 'Disconnected'}
    </div>
  );
};

export default useSocket;
