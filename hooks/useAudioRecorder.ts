// hooks/useAudioRecorder.ts
/**
 * React hook for managing audio recording using MediaRecorder API.
 * Returns base64-encoded audio chunks suitable for WebSocket transmission.
 * 
 * Usage:
 * ```tsx
 * const {
 *   isRecording,
 *   isPaused,
 *   error,
 *   startRecording,
 *   stopRecording,
 *   pauseRecording,
 *   resumeRecording
 * } = useAudioRecorder({
 *   onAudioChunk: (base64) => sendToWebSocket(base64),
 *   onComplete: (blob, base64) => processComplete(blob)
 * });
 * ```
 */

import { useState, useRef, useCallback } from 'react';

export interface AudioRecorderOptions {
  /** Called with base64-encoded audio data (for streaming) */
  onAudioChunk?: (base64: string) => void;
  /** Called when recording stops with complete audio */
  onComplete?: (blob: Blob, base64: string) => void;
  /** Called when an error occurs */
  onError?: (error: Error) => void;
  /** Audio MIME type (default: 'audio/webm;codecs=opus') */
  mimeType?: string;
  /** Time slice for ondataavailable in ms (default: 1000) */
  timeSlice?: number;
}

export interface UseAudioRecorderReturn {
  isRecording: boolean;
  isPaused: boolean;
  error: Error | null;
  duration: number;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
}

// Helper: Convert Blob to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export function useAudioRecorder(options: AudioRecorderOptions = {}): UseAudioRecorderReturn {
  const {
    onAudioChunk,
    onComplete,
    onError,
    mimeType = 'audio/webm;codecs=opus',
    timeSlice = 1000
  } = options;

  // State
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [duration, setDuration] = useState(0);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Start recording
  const startRecording = useCallback(async () => {
    cleanup(); // Ensure previous session is cleaned up

    try {
      setError(null);
      chunksRef.current = [];
      setDuration(0);

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      streamRef.current = stream;

      // Check supported MIME types
      let actualMimeType = mimeType;
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          actualMimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          actualMimeType = 'audio/mp4';
        } else {
          actualMimeType = '';
        }
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: actualMimeType || undefined
      });

      // Handle data available
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);

          // Stream chunk if handler provided
          if (onAudioChunk) {
            try {
              const base64 = await blobToBase64(event.data);
              onAudioChunk(base64);
            } catch (err) {
              console.error('Failed to convert chunk to base64:', err);
            }
          }
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = async () => {
        // Create complete blob
        const blob = new Blob(chunksRef.current, { type: actualMimeType || 'audio/webm' });

        if (onComplete) {
          try {
            const base64 = await blobToBase64(blob);
            onComplete(blob, base64);
          } catch (err) {
            console.error('Failed to convert complete audio to base64:', err);
            onError?.(err as Error);
          }
        }

        // Stop all tracks
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        // Clear duration interval
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }
      };

      // Handle errors
      mediaRecorder.onerror = (event) => {
        const err = new Error('MediaRecorder error');
        setError(err);
        onError?.(err);
      };

      // Start recording
      mediaRecorder.start(timeSlice);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setIsPaused(false);

      // Track duration
      durationIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      const error = err as Error;
      console.error('Failed to start recording:', error);
      setError(error);
      onError?.(error);

      // Clean up
      cleanup();
    }
  }, [mimeType, timeSlice, onAudioChunk, onComplete, onError, cleanup]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsPaused(false);
  }, []);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);

      // Pause duration tracking
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }
  }, []);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);

      // Resume duration tracking
      durationIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
  }, []);

  return {
    isRecording,
    isPaused,
    error,
    duration,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording
  };
}

export default useAudioRecorder;