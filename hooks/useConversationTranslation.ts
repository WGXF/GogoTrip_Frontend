// hooks/useConversationTranslation.ts
/**
 * React hook for managing turn-based conversation translation via WebSocket.
 * Supports bilingual conversations with Speaker A and Speaker B.
 * 
 * Usage:
 * ```tsx
 * const {
 *   isConnected,
 *   isSessionActive,
 *   messages,
 *   currentSpeaker,
 *   sessionInfo,
 *   error,
 *   connect,
 *   disconnect,
 *   startSession,
 *   sendAudio,
 *   sendText,
 *   swapLanguages,
 *   changeLanguages
 * } = useConversationTranslation({
 *   isPremium: true,
 *   onAudioResponse: (audio) => playAudio(audio)
 * });
 * ```
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config';

// Types
export interface ConversationMessage {
  id: string;
  speaker: 'A' | 'B';
  type: 'original' | 'translated';
  text: string;
  language: string;
  languageName: string;
  flag: string;
  timestamp: Date;
  audioBase64?: string;
}

export interface SessionInfo {
  langA: string;
  langB: string;
  langAName: string;
  langBName: string;
  langAFlag: string;
  langBFlag: string;
}

export interface TranslationError {
  code: string;
  message: string;
  speaker?: string;
}

export interface UseConversationTranslationOptions {
  isPremium: boolean;
  onTranscription?: (speaker: string, text: string, language: string) => void;
  onTranslation?: (speaker: string, original: string, translated: string) => void;
  onAudioResponse?: (audioBase64: string, forSpeaker: string) => void;
  onTurnComplete?: (completedSpeaker: string, nextSpeaker: string) => void;
  onError?: (error: TranslationError) => void;
}

export interface UseConversationTranslationReturn {
  // State
  isConnected: boolean;
  isSessionActive: boolean;
  isProcessing: boolean;
  messages: ConversationMessage[];
  currentSpeaker: 'A' | 'B';
  sessionInfo: SessionInfo | null;
  error: TranslationError | null;
  turnCount: number;
  
  // Actions
  connect: () => void;
  disconnect: () => void;
  startSession: (langA: string, langB: string) => void;
  stopSession: () => void;
  sendAudio: (audioBase64: string, speaker: 'A' | 'B') => void;
  sendText: (text: string, speaker: 'A' | 'B') => void;
  swapLanguages: () => void;
  changeLanguages: (langA: string, langB: string) => void;
  clearMessages: () => void;
  clearError: () => void;
  setCurrentSpeaker: (speaker: 'A' | 'B') => void;
}

export function useConversationTranslation(
  options: UseConversationTranslationOptions
): UseConversationTranslationReturn {
  const { 
    isPremium, 
    onTranscription, 
    onTranslation, 
    onAudioResponse, 
    onTurnComplete,
    onError 
  } = options;

  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [currentSpeaker, setCurrentSpeaker] = useState<'A' | 'B'>('A');
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [error, setError] = useState<TranslationError | null>(null);
  const [turnCount, setTurnCount] = useState(0);

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
      console.log('[ConversationTranslation] Socket connected');
    });

    socket.on('connected', (data) => {
      console.log('[ConversationTranslation] Authenticated:', data);
      setIsConnected(true);
      setError(null);
    });

    socket.on('disconnect', (reason) => {
      console.log('[ConversationTranslation] Disconnected:', reason);
      setIsConnected(false);
      setIsSessionActive(false);
      setIsProcessing(false);
    });

    socket.on('connect_error', (err) => {
      console.error('[ConversationTranslation] Connection error:', err);
      const error = { code: 'CONNECTION_ERROR', message: err.message };
      setError(error);
      onError?.(error);
    });

    // App events
    socket.on('error', (data) => {
      console.error('[ConversationTranslation] Error:', data);
      setError(data);
      setIsProcessing(false);
      onError?.(data);

      if (data.code === 'PREMIUM_REQUIRED' || data.code === 'AUTH_REQUIRED') {
        socket.disconnect();
        setIsConnected(false);
      }
    });

    socket.on('session_started', (data) => {
      console.log('[ConversationTranslation] Session started:', data);
      setIsSessionActive(true);
      setSessionInfo({
        langA: data.lang_a,
        langB: data.lang_b,
        langAName: data.lang_a_name,
        langBName: data.lang_b_name,
        langAFlag: data.lang_a_flag,
        langBFlag: data.lang_b_flag
      });
      setTurnCount(0);
    });

    socket.on('session_ended', (data) => {
      console.log('[ConversationTranslation] Session ended:', data);
      setIsSessionActive(false);
      setSessionInfo(null);
      setIsProcessing(false);
    });

    socket.on('processing', (data) => {
      console.log('[ConversationTranslation] Processing:', data);
      setIsProcessing(true);
    });

    socket.on('transcription', (data) => {
      const msg: ConversationMessage = {
        id: `${Date.now()}-orig-${data.speaker}`,
        speaker: data.speaker,
        type: 'original',
        text: data.text,
        language: data.language,
        languageName: data.language_name,
        flag: data.flag,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, msg]);
      onTranscription?.(data.speaker, data.text, data.language);
    });

    socket.on('translation', (data) => {
      const msg: ConversationMessage = {
        id: `${Date.now()}-trans-${data.speaker}`,
        speaker: data.speaker,
        type: 'translated',
        text: data.translated_text,
        language: data.target_lang,
        languageName: data.target_lang_name,
        flag: data.target_flag,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, msg]);
      onTranslation?.(data.speaker, data.original_text, data.translated_text);
    });

    socket.on('audio_response', (data) => {
      // Update the last translation message from this speaker with audio
      setMessages((prev) => {
        const updated = [...prev];
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i].type === 'translated' && !updated[i].audioBase64) {
            updated[i] = { ...updated[i], audioBase64: data.audio };
            break;
          }
        }
        return updated;
      });
      
      onAudioResponse?.(data.audio, data.for_speaker);
    });

    socket.on('turn_complete', (data) => {
      console.log('[ConversationTranslation] Turn complete:', data);
      setIsProcessing(false);
      setCurrentSpeaker(data.next_speaker);
      setTurnCount(data.turn_number);
      onTurnComplete?.(data.completed_speaker, data.next_speaker);
    });

    socket.on('languages_updated', (data) => {
      console.log('[ConversationTranslation] Languages updated:', data);
      setSessionInfo({
        langA: data.lang_a,
        langB: data.lang_b,
        langAName: data.lang_a_name,
        langBName: data.lang_b_name,
        langAFlag: data.lang_a_flag,
        langBFlag: data.lang_b_flag
      });
    });

    socketRef.current = socket;
  }, [isPremium, onTranscription, onTranslation, onAudioResponse, onTurnComplete, onError]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('stop_session');
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    setIsSessionActive(false);
    setIsProcessing(false);
    setSessionInfo(null);
  }, []);

  // Start conversation session
  const startSession = useCallback((langA: string, langB: string) => {
    if (!socketRef.current?.connected) {
      setError({ code: 'NOT_CONNECTED', message: 'Not connected to server' });
      return;
    }

    socketRef.current.emit('start_session', {
      lang_a: langA,
      lang_b: langB
    });
  }, []);

  // Stop session
  const stopSession = useCallback(() => {
    socketRef.current?.emit('stop_session');
    setIsSessionActive(false);
    setIsProcessing(false);
  }, []);

  // Send audio for a specific speaker
  const sendAudio = useCallback((audioBase64: string, speaker: 'A' | 'B') => {
    if (!socketRef.current?.connected) {
      console.warn('[ConversationTranslation] Cannot send audio: not connected');
      return;
    }

    if (!isSessionActive) {
      console.warn('[ConversationTranslation] Cannot send audio: no active session');
      return;
    }

    setIsProcessing(true);
    setCurrentSpeaker(speaker);

    socketRef.current.emit('audio_chunk', {
      audio: audioBase64,
      is_final: true,
      speaker: speaker
    });
  }, [isSessionActive]);

  // Send text input for a specific speaker
  const sendText = useCallback((text: string, speaker: 'A' | 'B') => {
    if (!socketRef.current?.connected || !isSessionActive) {
      console.warn('[ConversationTranslation] Cannot send text: not connected or no session');
      return;
    }

    setIsProcessing(true);
    setCurrentSpeaker(speaker);

    socketRef.current.emit('text_input', { 
      text,
      speaker 
    });
  }, [isSessionActive]);

  // Swap languages between speakers
  const swapLanguages = useCallback(() => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('swap_languages');
  }, []);

  // Change languages
  const changeLanguages = useCallback((langA: string, langB: string) => {
    if (!socketRef.current?.connected) return;

    socketRef.current.emit('change_languages', {
      lang_a: langA,
      lang_b: langB
    });
  }, []);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    setTurnCount(0);
    setCurrentSpeaker('A');
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
    isProcessing,
    messages,
    currentSpeaker,
    sessionInfo,
    error,
    turnCount,
    connect,
    disconnect,
    startSession,
    stopSession,
    sendAudio,
    sendText,
    swapLanguages,
    changeLanguages,
    clearMessages,
    clearError,
    setCurrentSpeaker
  };
}

export default useConversationTranslation;
