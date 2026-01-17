// hooks/useStreamingTranslation.ts
/**
 * React hook for managing streaming translation via WebSocket.
 * Provides real-time transcription with partial results (边说边出字幕).
 * 
 * Usage:
 * ```tsx
 * const {
 *   isConnected,
 *   isStreaming,
 *   partialText,
 *   messages,
 *   currentSpeaker,
 *   startStreaming,
 *   stopStreaming,
 *   sendAudioChunk
 * } = useStreamingTranslation({
 *   isPremium: true,
 *   onPartialTranscription: (text) => showLiveSubtitle(text),
 *   onAudioResponse: (audio) => playAudio(audio)
 * });
 * ```
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config';

// ============================================
// Types
// ============================================

export interface StreamingMessage {
  id: string;
  speaker: 'A' | 'B';
  type: 'transcription' | 'translation';
  text: string;
  language: string;
  languageName: string;
  flag: string;
  timestamp: Date;
  isFinal: boolean;
  confidence?: number;
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

export interface StreamingError {
  code: string;
  message: string;
  speaker?: string;
}

export interface StreamingStats {
  chunksProcessed: number;
  transcriptions: number;
  translations: number;
  durationSeconds: number;
}

export interface UseStreamingTranslationOptions {
  isPremium: boolean;
  onPartialTranscription?: (speaker: string, text: string, isStable: boolean) => void;
  onFinalTranscription?: (speaker: string, text: string) => void;
  onTranslation?: (speaker: string, original: string, translated: string) => void;
  onAudioResponse?: (audioBase64: string, forSpeaker: string) => void;
  onStreamingEnded?: (speaker: string, nextSpeaker: string) => void;
  onError?: (error: StreamingError) => void;
}

export interface UseStreamingTranslationReturn {
  // State
  isConnected: boolean;
  isStreaming: boolean;
  partialText: string;
  messages: StreamingMessage[];
  currentSpeaker: 'A' | 'B';
  sessionInfo: SessionInfo | null;
  error: StreamingError | null;
  stats: StreamingStats | null;
  
  // Actions
  connect: () => void;
  disconnect: () => void;
  startStreaming: (langA: string, langB: string, speaker: 'A' | 'B') => void;
  stopStreaming: () => void;
  sendAudioChunk: (audioBase64: string) => void;
  switchSpeaker: (speaker: 'A' | 'B') => void;
  swapLanguages: () => void;
  clearMessages: () => void;
  clearError: () => void;
}


// ============================================
// Hook Implementation
// ============================================

export function useStreamingTranslation(
  options: UseStreamingTranslationOptions
): UseStreamingTranslationReturn {
  const {
    isPremium,
    onPartialTranscription,
    onFinalTranscription,
    onTranslation,
    onAudioResponse,
    onStreamingEnded,
    onError
  } = options;

  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [partialText, setPartialText] = useState('');
  const [messages, setMessages] = useState<StreamingMessage[]>([]);
  const [currentSpeaker, setCurrentSpeaker] = useState<'A' | 'B'>('A');
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [error, setError] = useState<StreamingError | null>(null);
  const [stats, setStats] = useState<StreamingStats | null>(null);

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const chunkSeqRef = useRef(0);

  // ============================================
  // Connect to WebSocket
  // ============================================
  const connect = useCallback(() => {
    if (!isPremium) {
      const err = { code: 'PREMIUM_REQUIRED', message: 'Premium subscription required' };
      setError(err);
      onError?.(err);
      return;
    }

    if (socketRef.current?.connected) return;

    setError(null);

    // Connect to streaming namespace
    const socket = io(`${API_BASE_URL}/translate-stream`, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    // Connection events
    socket.on('connect', () => {
      console.log('[StreamingTranslation] Socket connected');
    });

    socket.on('connected', (data) => {
      console.log('[StreamingTranslation] Authenticated:', data);
      setIsConnected(true);
      setError(null);
    });

    socket.on('disconnect', (reason) => {
      console.log('[StreamingTranslation] Disconnected:', reason);
      setIsConnected(false);
      setIsStreaming(false);
      setPartialText('');
    });

    socket.on('connect_error', (err) => {
      console.error('[StreamingTranslation] Connection error:', err);
      const error = { code: 'CONNECTION_ERROR', message: err.message };
      setError(error);
      onError?.(error);
    });

    // Error handling
    socket.on('error', (data) => {
      console.error('[StreamingTranslation] Error:', data);
      setError(data);
      onError?.(data);

      if (data.code === 'PREMIUM_REQUIRED' || data.code === 'AUTH_REQUIRED') {
        socket.disconnect();
        setIsConnected(false);
      }
    });

    // Streaming events
    socket.on('streaming_started', (data) => {
      console.log('[StreamingTranslation] Streaming started:', data);
      setIsStreaming(true);
      setCurrentSpeaker(data.speaker);
      setPartialText('');
      chunkSeqRef.current = 0;
      
      if (data.session_info) {
        setSessionInfo({
          langA: data.session_info.lang_a,
          langB: data.session_info.lang_b,
          langAName: data.session_info.lang_a_name,
          langBName: data.session_info.lang_b_name,
          langAFlag: data.session_info.lang_a_flag,
          langBFlag: data.session_info.lang_b_flag
        });
      }
    });

    socket.on('partial_transcription', (data) => {
      // Real-time subtitle update
      setPartialText(data.text);
      onPartialTranscription?.(data.speaker, data.text, data.is_stable);
    });

    socket.on('final_transcription', (data) => {
      // Clear partial and add to messages
      setPartialText('');
      
      const msg: StreamingMessage = {
        id: `${Date.now()}-trans-${data.speaker}`,
        speaker: data.speaker,
        type: 'transcription',
        text: data.text,
        language: data.language,
        languageName: data.language_name,
        flag: data.flag,
        timestamp: new Date(),
        isFinal: true,
        confidence: data.confidence
      };
      
      setMessages(prev => [...prev, msg]);
      onFinalTranscription?.(data.speaker, data.text);
    });

    socket.on('translation', (data) => {
      const msg: StreamingMessage = {
        id: `${Date.now()}-tl-${data.speaker}`,
        speaker: data.speaker,
        type: 'translation',
        text: data.translated_text,
        language: data.target_lang,
        languageName: data.target_lang_name,
        flag: data.target_flag,
        timestamp: new Date(),
        isFinal: true
      };
      
      setMessages(prev => [...prev, msg]);
      onTranslation?.(data.speaker, data.original_text, data.translated_text);
    });

    socket.on('audio_response', (data) => {
      // Update last translation message with audio
      setMessages(prev => {
        const updated = [...prev];
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i].type === 'translation' && !updated[i].audioBase64) {
            updated[i] = { ...updated[i], audioBase64: data.audio };
            break;
          }
        }
        return updated;
      });
      
      onAudioResponse?.(data.audio, data.for_speaker);
    });

    socket.on('streaming_ended', (data) => {
      console.log('[StreamingTranslation] Streaming ended:', data);
      setIsStreaming(false);
      setPartialText('');
      
      if (data.stats) {
        setStats({
          chunksProcessed: data.stats.chunks_processed,
          transcriptions: data.stats.transcriptions,
          translations: data.stats.translations,
          durationSeconds: 0
        });
      }
      
      onStreamingEnded?.(data.speaker, data.next_speaker);
    });

    socket.on('speaker_switched', (data) => {
      console.log('[StreamingTranslation] Speaker switched:', data);
      setCurrentSpeaker(data.speaker);
      setPartialText('');
    });

    socket.on('languages_swapped', (data) => {
      console.log('[StreamingTranslation] Languages swapped:', data);
      setSessionInfo({
        langA: data.lang_a,
        langB: data.lang_b,
        langAName: data.lang_a_name,
        langBName: data.lang_b_name,
        langAFlag: data.lang_a_flag,
        langBFlag: data.lang_b_flag
      });
    });

    socket.on('session_ended', (data) => {
      console.log('[StreamingTranslation] Session ended:', data);
      setIsStreaming(false);
      setSessionInfo(null);
      setPartialText('');
      
      if (data.stats) {
        setStats({
          chunksProcessed: data.stats.total_chunks,
          transcriptions: data.stats.total_transcriptions,
          translations: data.stats.total_translations,
          durationSeconds: data.stats.duration_seconds
        });
      }
    });

    socketRef.current = socket;
  }, [isPremium, onPartialTranscription, onFinalTranscription, onTranslation, onAudioResponse, onStreamingEnded, onError]);

  // ============================================
  // Disconnect
  // ============================================
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('end_session');
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    setIsStreaming(false);
    setSessionInfo(null);
    setPartialText('');
  }, []);

  // ============================================
  // Start Streaming
  // ============================================
  const startStreaming = useCallback((langA: string, langB: string, speaker: 'A' | 'B') => {
    if (!socketRef.current?.connected) {
      setError({ code: 'NOT_CONNECTED', message: 'Not connected to server' });
      return;
    }

    chunkSeqRef.current = 0;
    
    socketRef.current.emit('start_streaming', {
      lang_a: langA,
      lang_b: langB,
      speaker
    });
  }, []);

  // ============================================
  // Stop Streaming
  // ============================================
  const stopStreaming = useCallback(() => {
    if (!socketRef.current?.connected) return;
    
    socketRef.current.emit('stop_streaming', {
      speaker: currentSpeaker
    });
  }, [currentSpeaker]);

  // ============================================
  // Send Audio Chunk
  // ============================================
  const sendAudioChunk = useCallback((audioBase64: string) => {
    if (!socketRef.current?.connected || !isStreaming) {
      return;
    }

    socketRef.current.emit('audio_chunk', {
      audio: audioBase64,
      speaker: currentSpeaker,
      seq: chunkSeqRef.current++
    });
  }, [isStreaming, currentSpeaker]);

  // ============================================
  // Switch Speaker
  // ============================================
  const switchSpeaker = useCallback((speaker: 'A' | 'B') => {
    if (!socketRef.current?.connected) return;
    
    socketRef.current.emit('switch_speaker', { speaker });
  }, []);

  // ============================================
  // Swap Languages
  // ============================================
  const swapLanguages = useCallback(() => {
    if (!socketRef.current?.connected) return;
    
    socketRef.current.emit('swap_languages');
  }, []);

  // ============================================
  // Clear Messages
  // ============================================
  const clearMessages = useCallback(() => {
    setMessages([]);
    setPartialText('');
  }, []);

  // ============================================
  // Clear Error
  // ============================================
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ============================================
  // Cleanup on unmount
  // ============================================
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return {
    isConnected,
    isStreaming,
    partialText,
    messages,
    currentSpeaker,
    sessionInfo,
    error,
    stats,
    connect,
    disconnect,
    startStreaming,
    stopStreaming,
    sendAudioChunk,
    switchSpeaker,
    swapLanguages,
    clearMessages,
    clearError
  };
}


// ============================================
// Streaming Audio Recorder Hook
// ============================================

export interface UseStreamingRecorderOptions {
  /** Interval between audio chunks in ms (default: 250) */
  chunkInterval?: number;
  /** Called with each audio chunk */
  onAudioChunk: (base64: string) => void;
  /** Called on error */
  onError?: (error: Error) => void;
}

export interface UseStreamingRecorderReturn {
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
}

export function useStreamingRecorder(
  options: UseStreamingRecorderOptions
): UseStreamingRecorderReturn {
  const { chunkInterval = 250, onAudioChunk, onError } = options;

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      streamRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    cleanup();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        }
      });

      streamRef.current = stream;

      // Determine supported MIME type
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType || undefined
      });

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          try {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = (reader.result as string).split(',')[1];
              onAudioChunk(base64);
            };
            reader.readAsDataURL(event.data);
          } catch (err) {
            console.error('Failed to convert audio chunk:', err);
          }
        }
      };

      mediaRecorder.onerror = () => {
        onError?.(new Error('MediaRecorder error'));
      };

      // Start with timeslice for continuous chunks
      mediaRecorder.start(chunkInterval);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

    } catch (err) {
      console.error('Failed to start recording:', err);
      cleanup();
      onError?.(err as Error);
    }
  }, [chunkInterval, onAudioChunk, onError, cleanup]);

  const stopRecording = useCallback(() => {
    cleanup();
    setIsRecording(false);
  }, [cleanup]);

  return {
    isRecording,
    startRecording,
    stopRecording
  };
}


export default useStreamingTranslation;
