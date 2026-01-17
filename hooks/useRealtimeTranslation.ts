// hooks/useRealtimeTranslation.ts
/**
 * React hook for managing real-time translation WebSocket connection.
 * Provides a clean interface for connecting, sending audio, and receiving translations.
 * 
 * Usage:
 * ```tsx
 * const {
 *   isConnected,
 *   isSessionActive,
 *   messages,
 *   error,
 *   connect,
 *   disconnect,
 *   startSession,
 *   sendAudio,
 *   sendText,
 *   changeLanguages
 * } = useRealtimeTranslation({ isPremium: true });
 * ```
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config';

// Types
export interface TranslationMessage {
  id: string;
  type: 'original' | 'translated';
  text: string;
  timestamp: Date;
  audioUrl?: string;
}

export interface TranslationError {
  code: string;
  message: string;
}

export interface UseRealtimeTranslationOptions {
  isPremium: boolean;
  onTranscription?: (text: string) => void;
  onTranslation?: (original: string, translated: string) => void;
  onAudioResponse?: (audioBase64: string) => void;
  onError?: (error: TranslationError) => void;
}

export interface UseRealtimeTranslationReturn {
  // State
  isConnected: boolean;
  isSessionActive: boolean;
  messages: TranslationMessage[];
  error: TranslationError | null;
  
  // Actions
  connect: () => void;
  disconnect: () => void;
  startSession: (sourceLang: string, targetLang: string) => void;
  stopSession: () => void;
  sendAudio: (audioBase64: string, isFinal?: boolean) => void;
  sendText: (text: string) => void;
  changeLanguages: (sourceLang: string, targetLang: string) => void;
  clearMessages: () => void;
  clearError: () => void;
}

export function useRealtimeTranslation(
  options: UseRealtimeTranslationOptions
): UseRealtimeTranslationReturn {
  const { isPremium, onTranscription, onTranslation, onAudioResponse, onError } = options;

  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [messages, setMessages] = useState<TranslationMessage[]>([]);
  const [error, setError] = useState<TranslationError | null>(null);

  // Refs
  const socketRef = useRef<Socket | null>(null);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!isPremium) {
      const err = { code: 'PREMIUM_REQUIRED', message: 'Premium subscription required' };
      setError(err);
      onError?.(err);
      return;
    }

    if (socketRef.current?.connected) return;

    setError(null);

    const socket = io(`${API_BASE_URL}/translate`, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    // Connection events
    socket.on('connect', () => {
      console.log('[RealtimeTranslation] Socket connected');
    });

    socket.on('connected', (data) => {
      console.log('[RealtimeTranslation] Authenticated:', data);
      setIsConnected(true);
      setError(null);
    });

    socket.on('disconnect', (reason) => {
      console.log('[RealtimeTranslation] Disconnected:', reason);
      setIsConnected(false);
      setIsSessionActive(false);
    });

    socket.on('connect_error', (err) => {
      console.error('[RealtimeTranslation] Connection error:', err);
      const error = { code: 'CONNECTION_ERROR', message: err.message };
      setError(error);
      onError?.(error);
    });

    // App events
    socket.on('error', (data) => {
      console.error('[RealtimeTranslation] Error:', data);
      setError(data);
      onError?.(data);

      if (data.code === 'PREMIUM_REQUIRED' || data.code === 'AUTH_REQUIRED') {
        socket.disconnect();
        setIsConnected(false);
      }
    });

    socket.on('session_started', (data) => {
      console.log('[RealtimeTranslation] Session started:', data);
      setIsSessionActive(true);
    });

    socket.on('session_ended', () => {
      console.log('[RealtimeTranslation] Session ended');
      setIsSessionActive(false);
    });

    socket.on('transcription', (data) => {
      const msg: TranslationMessage = {
        id: `${Date.now()}-o`,
        type: 'original',
        text: data.text,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, msg]);
      onTranscription?.(data.text);
    });

    socket.on('translation', (data) => {
      const msg: TranslationMessage = {
        id: `${Date.now()}-t`,
        type: 'translated',
        text: data.translated,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, msg]);
      onTranslation?.(data.original, data.translated);
    });

    socket.on('audio_response', (data) => {
      onAudioResponse?.(data.audio);
    });

    socket.on('languages_changed', (data) => {
      console.log('[RealtimeTranslation] Languages changed:', data);
    });

    socketRef.current = socket;
  }, [isPremium, onTranscription, onTranslation, onAudioResponse, onError]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('stop_session');
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    setIsSessionActive(false);
  }, []);

  // Start translation session
  const startSession = useCallback((sourceLang: string, targetLang: string) => {
    if (!socketRef.current?.connected) {
      setError({ code: 'NOT_CONNECTED', message: 'Not connected to server' });
      return;
    }

    socketRef.current.emit('start_session', {
      source_lang: sourceLang,
      target_lang: targetLang
    });
  }, []);

  // Stop session
  const stopSession = useCallback(() => {
    socketRef.current?.emit('stop_session');
    setIsSessionActive(false);
  }, []);

  // Send audio chunk
  const sendAudio = useCallback((audioBase64: string, isFinal = true) => {
    if (!socketRef.current?.connected || !isSessionActive) {
      console.warn('[RealtimeTranslation] Cannot send audio: not connected or no session');
      return;
    }

    socketRef.current.emit('audio_chunk', {
      audio: audioBase64,
      is_final: isFinal
    });
  }, [isSessionActive]);

  // Send text input
  const sendText = useCallback((text: string) => {
    if (!socketRef.current?.connected || !isSessionActive) {
      console.warn('[RealtimeTranslation] Cannot send text: not connected or no session');
      return;
    }

    socketRef.current.emit('text_input', { text });
  }, [isSessionActive]);

  // Change languages mid-session
  const changeLanguages = useCallback((sourceLang: string, targetLang: string) => {
    if (!socketRef.current?.connected) return;

    socketRef.current.emit('change_languages', {
      source_lang: sourceLang,
      target_lang: targetLang
    });
  }, []);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return {
    isConnected,
    isSessionActive,
    messages,
    error,
    connect,
    disconnect,
    startSession,
    stopSession,
    sendAudio,
    sendText,
    changeLanguages,
    clearMessages,
    clearError
  };
}

export default useRealtimeTranslation;