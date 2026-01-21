import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRightLeft,
  Copy,
  Mic,
  Volume2,
  Sparkles,
  Check,
  RotateCcw,
  StopCircle,
  Upload,
  Wifi,
  WifiOff,
  Crown,
  FileAudio,
  Loader2,
  Play,
  Pause,
  X,
  Zap,
  MessageCircle,
  Users,
  Cpu,     
  Globe,   
  Lock     
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../../config';

/* =========================
   Types
========================= */
interface ConversationMessage {
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

interface LanguageInfo {
  code: string;
  name: string;
  flag: string;
}

interface SessionInfo {
  langA: string;
  langB: string;
  langAName: string;
  langBName: string;
  langAFlag: string;
  langBFlag: string;
}

interface UserInfo {
  isPremium: boolean;
  id: number;
}

type TranslationEngine = 'google' | 'ai';

interface ModelInfo {
  id: string;
  name: string;
  premiumOnly: boolean;
}

/* =========================
   Constants
========================= */
const LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'my', name: 'Malay', flag: '🇲🇾' },
  { code: 'th', name: 'Thai', flag: '🇹🇭' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'id', name: 'Indonesian', flag: '🇮🇩' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' }
];

const AI_MODELS: ModelInfo[] = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', premiumOnly: false },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', premiumOnly: true },
];

/* =========================
   Helper Components
========================= */
const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: string;
}> = ({ active, onClick, icon, label, badge }) => (
  <button
    onClick={onClick}
    className={`
      relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300
      ${active 
        ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-lg shadow-sky-500/25' 
        : 'bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'}
    `}
  >
    {icon}
    {label}
    {badge && (
      <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-amber-400 text-amber-900 text-[10px] font-bold rounded-full flex items-center gap-0.5">
        <Crown className="w-2.5 h-2.5" />
        {badge}
      </span>
    )}
  </button>
);

// 🟢 Engine Selector: 支持锁定逻辑和升级引导
const EngineSelector: React.FC<{
  engine: TranslationEngine;
  setEngine: (e: TranslationEngine) => void;
  disabled?: boolean;
  isPremium: boolean;
  onUpgrade: () => void;
}> = ({ engine, setEngine, disabled, isPremium, onUpgrade }) => (
  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
    <button
      onClick={() => !disabled && setEngine('google')}
      disabled={disabled}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all
        ${engine === 'google' 
          ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' 
          : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <Globe className="w-3.5 h-3.5" />
      Google Cloud
    </button>
    
    <button
      onClick={() => {
        if (disabled) return;
        // If not premium, prevent switching and guide upgrade
        if (!isPremium) {
          onUpgrade();
          return;
        }
        setEngine('ai');
      }}
      disabled={disabled}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all relative
        ${engine === 'ai' 
          ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' 
          : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <Sparkles className="w-3.5 h-3.5" />
      AI Enhanced
      {/* Lock icon: visible but locked */}
      {!isPremium && (
        <Lock className="w-3 h-3 text-amber-500 ml-1" />
      )}
    </button>
  </div>
);

// 🟢 Model Selector: Use React Portal to solve occlusion issues
const ModelSelector: React.FC<{
  selectedModel: string;
  onSelect: (id: string) => void;
  isPremium: boolean;
  disabled?: boolean;
  onUpgrade: () => void;
}> = ({ selectedModel, onSelect, isPremium, disabled, onUpgrade }) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  // Calculate dropdown menu position
  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 8, // Vertical offset
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 200), // Minimum width
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && buttonRef.current.contains(event.target as Node)) {
        return;
      }
      // Since using Portal, we need to handle closing on capture phase or body
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const currentModel = AI_MODELS.find(m => m.id === selectedModel) || AI_MODELS[0];

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl
          hover:border-indigo-400 transition-colors text-xs font-medium min-w-[160px] justify-between
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-indigo-500" />
          <span className="text-slate-700 dark:text-slate-200 truncate max-w-[120px]">
            {currentModel.name}
          </span>
        </div>
      </button>

      {/* Portal to Body, ensure it's on top */}
      {isOpen && createPortal(
        <div 
          className="fixed z-[9999] bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
          style={{
            top: coords.top,
            left: coords.left,
            width: coords.width
          }}
          onMouseDown={(e) => e.stopPropagation()} // Prevent triggering outside click close
        >
          {AI_MODELS.map((model) => {
            const isLocked = model.premiumOnly && !isPremium;
            return (
              <button
                key={model.id}
                onClick={() => {
                  if (isLocked) {
                    onUpgrade();
                    setIsOpen(false);
                  } else {
                    onSelect(model.id);
                    setIsOpen(false);
                  }
                }}
                className={`
                  w-full flex items-center justify-between p-3 text-left border-b last:border-0 border-slate-50 dark:border-slate-700/50
                  ${selectedModel === model.id ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' : 'text-slate-600 dark:text-slate-300'}
                  hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors
                `}
              >
                <div className="flex flex-col">
                  <span className="text-xs font-medium">{model.name}</span>
                  {model.premiumOnly && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-500">PRO Model</span>
                  )}
                </div>
                {isLocked ? (
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                ) : (
                  selectedModel === model.id && <Check className="w-3.5 h-3.5" />
                )}
              </button>
            );
          })}
          
          {/* Non-premium bottom guidance bar */}
          {!isPremium && (
             <button 
               onClick={() => { onUpgrade(); setIsOpen(false); }}
               className="w-full p-2 bg-amber-50 dark:bg-amber-900/20 text-center hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
             >
               <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 flex items-center justify-center gap-1">
                 <Crown className="w-3 h-3" />
                 Upgrade to Unlock All
               </p>
             </button>
          )}
        </div>,
        document.body
      )}
    </>
  );
};

const SpeakerButton: React.FC<{
  speaker: 'A' | 'B';
  flag: string;
  langName: string;
  isActive: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  disabled: boolean;
  onPress: () => void;
  onRelease: () => void;
}> = ({ speaker, flag, langName, isActive, isRecording, isProcessing, disabled, onPress, onRelease }) => (
  <div className="flex flex-col items-center gap-2">
    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
      Speaker {speaker}
    </span>
    <div className="relative">
      {/* Animated rings when recording */}
      {isRecording && (
        <>
          <div className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" style={{ animationDuration: '1s' }} />
          <div className="absolute -inset-2 rounded-full bg-red-500/20 animate-ping" style={{ animationDuration: '1.5s' }} />
          <div className="absolute -inset-4 rounded-full bg-red-500/10 animate-ping" style={{ animationDuration: '2s' }} />
        </>
      )}
      <button
        onMouseDown={onPress}
        onMouseUp={onRelease}
        onMouseLeave={onRelease}
        onTouchStart={(e) => { e.preventDefault(); onPress(); }}
        onTouchEnd={(e) => { e.preventDefault(); onRelease(); }}
        disabled={disabled}
        className={`
          relative w-24 h-24 rounded-full flex flex-col items-center justify-center gap-1 transition-all duration-300
          ${isRecording 
            ? 'bg-gradient-to-br from-red-500 to-rose-600 scale-110 shadow-2xl shadow-red-500/50' 
            : isProcessing
              ? 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-xl shadow-amber-500/30'
              : isActive
                ? 'bg-gradient-to-br from-sky-500 to-indigo-500 shadow-xl shadow-sky-500/30 hover:scale-105'
                : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'}
          ${disabled && !isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center gap-1">
            <Loader2 className="w-7 h-7 text-white animate-spin" />
            <span className="text-[10px] text-white/80 font-medium">Processing</span>
          </div>
        ) : isRecording ? (
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-0.5">
              {/* Audio waveform animation */}
              {[1,2,3,4,5].map((i) => (
                <div 
                  key={i}
                  className="w-1 bg-white rounded-full animate-pulse"
                  style={{ 
                    height: `${12 + Math.random() * 16}px`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '0.5s'
                  }}
                />
              ))}
            </div>
            <span className="text-[10px] text-white/80 font-medium">Recording</span>
          </div>
        ) : (
          <>
            <span className="text-2xl">{flag}</span>
            <Mic className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
          </>
        )}
      </button>
    </div>
    <span className={`text-sm font-medium transition-colors ${
      isRecording ? 'text-red-500' : 
      isProcessing ? 'text-amber-600 dark:text-amber-400' :
      isActive ? 'text-sky-600 dark:text-indigo-400' : 
      'text-slate-600 dark:text-slate-400'
    }`}>
      {langName}
    </span>
    {isRecording && (
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
        <span className="text-xs text-red-500 font-semibold">
          Streaming live...
        </span>
      </div>
    )}
    {isProcessing && !isRecording && (
      <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
        Translating...
      </span>
    )}
  </div>
);

const ConversationBubble: React.FC<{
  message: ConversationMessage;
  onPlayAudio?: () => void;
  isPlaying?: boolean;
}> = ({ message, onPlayAudio, isPlaying }) => {
  const isA = message.speaker === 'A';
  const isTranslation = message.type === 'translated';
  
  return (
    <div className={`flex ${isA ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[80%] ${isA ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`flex items-center gap-1.5 text-xs ${isA ? 'flex-row-reverse' : ''}`}>
          <span>{message.flag}</span>
          <span className="font-medium text-slate-500 dark:text-slate-400">
            {isTranslation ? 'Translation' : `Speaker ${message.speaker}`}
          </span>
        </div>
        
        <div
          className={`
            px-4 py-3 rounded-2xl
            ${isTranslation
              ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
              : isA
                ? 'bg-sky-500 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700'
            }
            ${isA ? 'rounded-tr-sm' : 'rounded-tl-sm'}
          `}
        >
          <p className="text-sm leading-relaxed">{message.text}</p>
        </div>
        
        {isTranslation && message.audioBase64 && onPlayAudio && (
          <button
            onClick={onPlayAudio}
            className="flex items-center gap-1.5 px-2 py-1 text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-500 transition-colors"
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
            {isPlaying ? 'Playing...' : 'Play audio'}
          </button>
        )}
      </div>
    </div>
  );
};

/* =========================
   Main Component
========================= */
const TranslateView: React.FC<{ user?: UserInfo }> = ({ user }) => {
  // Mode: 'text' | 'conversation' | 'batch'
  const [mode, setMode] = useState<'text' | 'conversation' | 'batch'>('text');
  
  // Languages
  const [langA, setLangA] = useState('en');
  const [langB, setLangB] = useState('ja');

  // Engine & Model State
  const [engine, setEngine] = useState<TranslationEngine>('google');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  
  // Text mode state
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  
  // Conversation mode state
  const [isConnected, setIsConnected] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<'A' | 'B'>('A');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [partialText, setPartialText] = useState<string>(''); // Live subtitle during speech
  const [partialTranslation, setPartialTranslation] = useState<string>(''); // Early translation preview
  const [isStreaming, setIsStreaming] = useState(false); // True when actively streaming audio
  
  // Batch mode state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [batchResult, setBatchResult] = useState<{
    originalText: string;
    translatedText: string;
    audioBase64: string;
  } | null>(null);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  
  // UI state
  const [isCopied, setIsCopied] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  
  // Refs
  const socketRef = useRef<Socket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null); // Keep track of media stream for cleanup
  const chunkSeqRef = useRef<number>(0); // Sequence number for audio chunks

  const isPremium = user?.isPremium ?? false;
  
  const getLangInfo = (code: string): LanguageInfo => 
    LANGUAGES.find(l => l.code === code) || { code, name: code, flag: '🌐' };

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // 🟢 State protection: If user membership expires but AI engine is selected, force switch back to Google
  useEffect(() => {
    if (!isPremium && engine === 'ai') {
      setEngine('google');
    }
  }, [isPremium, engine]);

  // 🟢 Upgrade guidance logic
  const handleUpgradeRedirect = () => {
    if (confirm("This feature requires a Premium subscription. Unlock the full power of AI translation now!")) {
      window.location.href = '/billing';
    }
  };

  // --- Handlers ---

  const handleSwapLanguages = () => {
    setLangA(langB);
    setLangB(langA);
    if (socketRef.current && isSessionActive) {
      socketRef.current.emit('swap_languages');
    }
    if (mode === 'text') {
      setSourceText(translatedText);
      setTranslatedText(sourceText);
    }
  };

  // Text Translation
  const handleTextTranslate = async () => {
    if (!sourceText.trim()) return;

    setIsTranslating(true);
    setTranslatedText('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          text: sourceText,
          source_lang: langA,
          target_lang: langB,
          engine: engine, 
          model: engine === 'ai' ? selectedModel : undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setTranslatedText(data.translation);
      } else {
        setTranslatedText(data.error || 'Error: Could not translate.');
      }
    } catch {
      setTranslatedText('Error: Failed to connect to translation service.');
    } finally {
      setIsTranslating(false);
    }
  };

  // Conversation WebSocket connection - Using /translate-stream for real-time streaming
  const connectConversation = useCallback(() => {
    if (!isPremium) {
      handleUpgradeRedirect();
      return;
    }

    setConnectionError(null);
    
    // Connect to streaming namespace for real-time translation
    const socket = io(`${API_BASE_URL}/translate-stream`, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('[StreamingConversation] Socket connected');
    });

    socket.on('connected', (data) => {
      console.log('[StreamingConversation] Authenticated:', data);
      setIsConnected(true);
      setConnectionError(null);
    });

    socket.on('error', (data) => {
      console.error('[StreamingConversation] Error:', data);
      setConnectionError(data.message);
      setIsProcessing(false);
      setIsStreaming(false);
      setPartialText('');
      if (data.code === 'PREMIUM_REQUIRED' || data.code === 'AUTH_REQUIRED') {
        socket.disconnect();
        setIsConnected(false);
      }
    });

    // Streaming started - ready to receive audio chunks
    socket.on('streaming_started', (data) => {
      console.log('[StreamingConversation] Streaming started:', data);
      setIsStreaming(true);
      setIsSessionActive(true);
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

    // Partial transcription - live subtitles while speaking
    socket.on('partial_transcription', (data) => {
      setPartialText(data.text);
    });

    // Partial translation - early translation preview for stable partials
    socket.on('partial_translation', (data) => {
      setPartialTranslation(data.translated_text);
    });

    // Final transcription - complete utterance
    socket.on('final_transcription', (data) => {
      setPartialText(''); // Clear partial text
      setPartialTranslation(''); // Clear partial translation
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
      setMessages(prev => [...prev, msg]);
    });

    // Translation result
    socket.on('translation', (data) => {
      setPartialTranslation(''); // Clear any partial translation
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
      setMessages(prev => [...prev, msg]);
    });

    // Audio response with translated speech
    socket.on('audio_response', (data) => {
      setMessages(prev => {
        const updated = [...prev];
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i].type === 'translated' && !updated[i].audioBase64) {
            updated[i] = { ...updated[i], audioBase64: data.audio };
            break;
          }
        }
        return updated;
      });
      if (data.auto_play) {
        playAudioBase64(data.audio);
      }
    });

    // Streaming ended for current speaker
    socket.on('streaming_ended', (data) => {
      console.log('[StreamingConversation] Streaming ended:', data);
      setIsStreaming(false);
      setIsProcessing(false);
      setPartialText('');
    });

    // Speaker switched
    socket.on('speaker_switched', (data) => {
      console.log('[StreamingConversation] Speaker switched:', data);
      setCurrentSpeaker(data.speaker);
      setPartialText('');
    });

    // Languages swapped
    socket.on('languages_swapped', (data) => {
      setSessionInfo({
        langA: data.lang_a,
        langB: data.lang_b,
        langAName: data.lang_a_name,
        langBName: data.lang_b_name,
        langAFlag: data.lang_a_flag,
        langBFlag: data.lang_b_flag
      });
      setLangA(data.lang_a);
      setLangB(data.lang_b);
    });

    // Session ended
    socket.on('session_ended', (data) => {
      console.log('[StreamingConversation] Session ended:', data);
      setIsSessionActive(false);
      setIsStreaming(false);
      setSessionInfo(null);
      setPartialText('');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setIsSessionActive(false);
      setIsStreaming(false);
      setPartialText('');
    });

    socketRef.current = socket;
  }, [isPremium]);

  const disconnectConversation = () => {
    // Stop any active media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (socketRef.current) {
      socketRef.current.emit('end_session');
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    setIsSessionActive(false);
    setIsRecording(false);
    setIsProcessing(false);
    setIsStreaming(false);
    setPartialText('');
    setPartialTranslation('');
  };

  const startStreamingSession = (speaker: 'A' | 'B') => {
    if (!socketRef.current || !isConnected) return;
    chunkSeqRef.current = 0;
    socketRef.current.emit('start_streaming', {
      lang_a: langA,
      lang_b: langB,
      speaker: speaker
    });
  };

  const cleanupAudio = useCallback(() => {
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
    mediaRecorderRef.current = null;
  }, []);

  const startRecording = async (speaker: 'A' | 'B') => {
    if (!socketRef.current || !isConnected) {
      setConnectionError('Not connected to server');
      return;
    }

    // Ensure strict cleanup of previous sessions
    cleanupAudio();

    setCurrentSpeaker(speaker);
    setPartialText('');
    setConnectionError(null);
    
    try {
      // Check for permission state if possible (optional, but good for debugging)
      // const perm = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      // console.log('Mic permission:', perm.state);

      // Get microphone access with optimized settings
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

      // Send audio chunks continuously every 200ms for real-time streaming
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && socketRef.current?.connected) {
          try {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = (reader.result as string).split(',')[1];
              if (socketRef.current?.connected) {
                socketRef.current.emit('audio_chunk', {
                  audio: base64,
                  speaker: speaker,
                  seq: chunkSeqRef.current++
                });
              }
            };
            reader.readAsDataURL(event.data);
          } catch (err) {
            console.error('Failed to send audio chunk:', err);
          }
        }
      };

      mediaRecorder.onerror = (event: any) => {
        console.error('MediaRecorder error:', event.error);
        setConnectionError('Recording error occurred');
        stopRecording();
      };

      // Start streaming session on backend first
      startStreamingSession(speaker);
      
      // Wait a short moment for backend to be ready
      await new Promise(resolve => setTimeout(resolve, 100));

      // Start recording with timeslice for continuous chunks (200ms intervals)
      mediaRecorder.start(200);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

    } catch (err: any) {
      console.error('Failed to start recording:', err);
      cleanupAudio(); // Ensure cleanup on error
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setConnectionError('Microphone access denied. Please allow permission.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setConnectionError('No microphone found.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setConnectionError('Microphone is busy or not readable.');
      } else {
        setConnectionError('Microphone access denied or not available');
      }
    }
  };

  const stopRecording = useCallback(() => {
    // 1. Stop recording hardware immediately
    cleanupAudio();

    // 2. Notify backend
    if (socketRef.current?.connected) {
      socketRef.current.emit('stop_streaming', {
        speaker: currentSpeaker
      });
    }

    // 3. Update UI state
    setIsRecording(false);
    setIsProcessing(true); // Show processing while backend finalizes

    // Safety fallback: if backend doesn't respond with 'streaming_ended' within 5s, reset state
    // We use a ref to track the current processing request to avoid race conditions if needed,
    // but a simple timeout is usually sufficient for UI reset.
    setTimeout(() => {
      setIsProcessing(prev => {
        if (prev) {
          console.warn('Processing state reset by timeout');
          return false;
        }
        return prev;
      });
    }, 5000);
  }, [currentSpeaker, cleanupAudio]);

  const playAudioBase64 = (base64: string) => {
    if (audioRef.current) audioRef.current.pause();
    
    try {
      const blob = base64ToBlob(base64, 'audio/mp3');
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setPlayingMessageId(null);
      };
      
      audio.onerror = (e) => {
        console.error("Audio error:", e);
        URL.revokeObjectURL(url);
        setPlayingMessageId(null);
      };
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Audio playback failed:", error);
          // Auto-play policy might prevent playback if not triggered by user interaction
          // But here it follows a user interaction (release button), so it should be fine usually.
        });
      }
      
      audioRef.current = audio;
    } catch (err) {
      console.error("Failed to setup audio playback:", err);
    }
  };

  const playMessageAudio = (messageId: string, audioBase64: string) => {
    setPlayingMessageId(messageId);
    playAudioBase64(audioBase64);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setBatchResult(null);
    }
  };

  const handleBatchTranslate = async () => {
    if (!uploadedFile) return;

    setIsBatchProcessing(true);
    setBatchResult(null);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('source_lang', langA);
      formData.append('target_lang', langB);
      formData.append('engine', engine); // Pass engine
      if (engine === 'ai') {
        formData.append('model', selectedModel); // Pass model
      }

      const res = await fetch(`${API_BASE_URL}/api/translate/audio`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await res.json();
      
      if (res.ok && data.status === 'success') {
        setBatchResult({
          originalText: data.original_text,
          translatedText: data.translated_text,
          audioBase64: data.audio_base64
        });
      } else {
        setConnectionError(data.error || 'Translation failed');
      }
    } catch (err) {
      setConnectionError('Failed to connect to translation service');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleSpeak = async (text: string, lang: string) => {
    if (!text) return;
    try {
      const res = await fetch(`${API_BASE_URL}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text, lang })
      });
      if (!res.ok) throw new Error('TTS Failed');
      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audio.onended = () => URL.revokeObjectURL(audioUrl);
      audio.play();
      audioRef.current = audio;
    } catch (err) {
      console.error('TTS error', err);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

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

  const clearConversation = () => {
    setMessages([]);
    setCurrentSpeaker('A');
  };

  // --- Render ---
  return (
    <div className="p-4 md:p-6 w-full max-w-5xl mx-auto space-y-5">
      {/* Header Area - Updated with Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-500/25">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Translation Hub
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Text, conversation & audio translation
            </p>
          </div>
        </div>
        
        {/* Controls Area: Engine & Model Selectors (Using Portal & Lock logic) */}
        <div className="flex items-center gap-3 bg-white/50 dark:bg-slate-800/50 p-1.5 rounded-2xl backdrop-blur-sm border border-white/20 dark:border-slate-700/50 relative z-10">
          
          <EngineSelector 
            engine={engine} 
            setEngine={setEngine} 
            disabled={isTranslating || isBatchProcessing || isSessionActive}
            isPremium={isPremium}
            onUpgrade={handleUpgradeRedirect}
          />

          {/* Show model selector when engine is AI */}
          {engine === 'ai' && (
            <>
              <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
              <ModelSelector 
                selectedModel={selectedModel}
                onSelect={setSelectedModel}
                isPremium={isPremium}
                disabled={isTranslating || isBatchProcessing || isSessionActive}
                onUpgrade={handleUpgradeRedirect}
              />
            </>
          )}

          {!isPremium && (
            <a 
              href="/billing" 
              className="ml-2 flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-lg font-semibold text-xs shadow-lg shadow-orange-500/25 hover:shadow-xl transition-all hover:-translate-y-0.5"
            >
              <Crown className="w-3.5 h-3.5" />
              Upgrade
            </a>
          )}
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl backdrop-blur-sm">
        <TabButton
          active={mode === 'text'}
          onClick={() => setMode('text')}
          icon={<Sparkles className="w-4 h-4" />}
          label="Text"
        />
        <TabButton
          active={mode === 'conversation'}
          onClick={() => {
            setMode('conversation');
            if (isPremium && !isConnected) {
              connectConversation();
            }
          }}
          icon={<Users className="w-4 h-4" />}
          label="Conversation"
          badge={!isPremium ? 'PRO' : undefined}
        />
        <TabButton
          active={mode === 'batch'}
          onClick={() => setMode('batch')}
          icon={<FileAudio className="w-4 h-4" />}
          label="Audio File"
        />
      </div>

      {/* Error Display */}
      {connectionError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2">
          <X className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-red-600 dark:text-red-400 text-sm flex-1">{connectionError}</p>
          <button 
            onClick={() => setConnectionError(null)}
            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
          >
            <X className="w-4 h-4 text-red-400" />
          </button>
        </div>
      )}

      {/* Main Content Card */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl p-5 shadow-xl border border-white/20 dark:border-slate-700/30">
        
        {/* TEXT MODE */}
        {mode === 'text' && (
          <div className="space-y-5">
            {/* Language Selectors */}
            <div className="flex items-center gap-3">
              <select
                value={langA}
                onChange={(e) => setLangA(e.target.value)}
                className="flex-1 bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-medium text-sm"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.flag} {lang.name}</option>
                ))}
              </select>
              
              <button 
                onClick={handleSwapLanguages}
                className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-sky-100 dark:hover:bg-indigo-900/50 transition-all active:rotate-180 duration-300"
              >
                <ArrowRightLeft className="w-4 h-4 text-slate-500" />
              </button>
              
              <select
                value={langB}
                onChange={(e) => setLangB(e.target.value)}
                className="flex-1 bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-medium text-sm text-indigo-600 dark:text-indigo-400"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.flag} {lang.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Source Input */}
              <div className="flex flex-col bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 min-h-[200px]">
                <textarea
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  placeholder="Enter text to translate..."
                  className="flex-1 w-full bg-transparent resize-none border-none outline-none text-sm text-slate-900 dark:text-white placeholder-slate-400"
                />
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                  <button 
                    onClick={() => handleSpeak(sourceText, langA)}
                    className="p-1.5 text-slate-400 hover:text-sky-600 rounded-lg transition-all"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-slate-400">{sourceText.length}</span>
                </div>
              </div>

              {/* Target Output */}
              <div className="flex flex-col bg-gradient-to-br from-indigo-50 to-sky-50 dark:from-indigo-900/20 dark:to-sky-900/20 rounded-xl p-3 min-h-[200px]">
                {isTranslating ? (
                  <div className="flex-1 flex items-center justify-center flex-col gap-2 text-indigo-500">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-xs opacity-70">
                      Using {engine === 'google' ? 'Google Cloud' : selectedModel}...
                    </span>
                  </div>
                ) : (
                  <textarea
                    readOnly
                    value={translatedText}
                    placeholder="Translation..."
                    className="flex-1 w-full bg-transparent resize-none border-none outline-none text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400"
                  />
                )}
                <div className="flex justify-between items-center pt-2 border-t border-indigo-100 dark:border-indigo-900/50">
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleCopy(translatedText)}
                      className="p-1.5 text-slate-400 hover:text-emerald-500 rounded-lg transition-all"
                    >
                      {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => handleSpeak(translatedText, langB)}
                      className="p-1.5 text-slate-400 hover:text-sky-600 rounded-lg transition-all"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={handleTextTranslate}
              disabled={!sourceText || isTranslating}
              className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-sky-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isTranslating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isTranslating ? 'Translating...' : 'Translate'}
            </button>
          </div>
        )}

        {/* CONVERSATION MODE */}
        {mode === 'conversation' && (
          <div className="space-y-4">
            {!isPremium ? (
              /* Premium Upsell */
              <div className="text-center py-10 px-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl shadow-orange-500/30">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Unlock Conversation Mode
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm max-w-md mx-auto">
                  Have real-time bilingual conversations. Perfect for travel, meetings, and making connections.
                </p>
                <a 
                  href="/billing"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-bold text-sm shadow-lg"
                >
                  <Zap className="w-4 h-4" />
                  Upgrade to Premium
                </a>
              </div>
            ) : (
              <>
                {/* Connection & Language Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <Wifi className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <WifiOff className="w-4 h-4 text-slate-400" />
                    )}
                    <span className={`text-xs font-medium ${isConnected ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {isConnected ? (isSessionActive ? 'Session Active' : 'Connected') : 'Disconnected'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <select
                      value={langA}
                      onChange={(e) => setLangA(e.target.value)}
                      disabled={isSessionActive}
                      className="bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium"
                    >
                      {LANGUAGES.map(lang => (
                        <option key={lang.code} value={lang.code}>{lang.flag} {lang.name}</option>
                      ))}
                    </select>
                    
                    <button 
                      onClick={handleSwapLanguages}
                      className="p-1 bg-slate-100 dark:bg-slate-700 rounded-lg"
                      disabled={isProcessing}
                    >
                      <ArrowRightLeft className="w-3 h-3 text-slate-500" />
                    </button>
                    
                    <select
                      value={langB}
                      onChange={(e) => setLangB(e.target.value)}
                      disabled={isSessionActive}
                      className="bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-indigo-600"
                    >
                      {LANGUAGES.map(lang => (
                        <option key={lang.code} value={lang.code}>{lang.flag} {lang.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex gap-2">
                    {messages.length > 0 && (
                      <button
                        onClick={clearConversation}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                        title="Clear conversation"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={isConnected ? disconnectConversation : connectConversation}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        isConnected 
                          ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                          : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                      }`}
                    >
                      {isConnected ? 'End' : 'Start'}
                    </button>
                  </div>
                </div>

                {/* Live Subtitle - Shows partial transcription and translation while speaking */}
                {(isRecording || partialText || partialTranslation) && (
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-purple-500/10 dark:from-sky-500/20 dark:via-indigo-500/20 dark:to-purple-500/20 border border-sky-200 dark:border-sky-800">
                    <div className="absolute inset-0 bg-gradient-to-r from-sky-400/20 to-indigo-400/20 animate-pulse" />
                    <div className="relative p-4 space-y-3">
                      {/* Original speech section */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                            </span>
                            <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                              LIVE • Speaker {currentSpeaker}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400">
                            {currentSpeaker === 'A' 
                              ? sessionInfo?.langAName || getLangInfo(langA).name
                              : sessionInfo?.langBName || getLangInfo(langB).name}
                          </span>
                        </div>
                        <p className="text-lg font-medium text-slate-800 dark:text-white min-h-[28px]">
                          {partialText || (
                            <span className="text-slate-400 italic flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Listening...
                            </span>
                          )}
                        </p>
                      </div>
                      
                      {/* Live translation preview (when available) */}
                      {partialTranslation && (
                        <div className="border-t border-indigo-200 dark:border-indigo-800 pt-2">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Sparkles className="w-3 h-3 text-indigo-500" />
                            <span className="text-xs font-medium text-indigo-500">
                              Translation Preview
                            </span>
                            <span className="text-xs text-slate-400">
                              {currentSpeaker === 'A' 
                                ? sessionInfo?.langBName || getLangInfo(langB).name
                                : sessionInfo?.langAName || getLangInfo(langA).name}
                            </span>
                          </div>
                          <p className="text-base text-indigo-600 dark:text-indigo-400 italic">
                            {partialTranslation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Conversation Messages */}
                <div className="h-[280px] overflow-y-auto p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                  {messages.length === 0 && !isRecording ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                      <Users className="w-10 h-10 mb-2 opacity-50" />
                      <p className="text-sm text-center">
                        {isConnected 
                          ? 'Press and hold a speaker button to start talking' 
                          : 'Click Start to begin conversation'}
                      </p>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg) => (
                        <ConversationBubble
                          key={msg.id}
                          message={msg}
                          onPlayAudio={msg.audioBase64 ? () => playMessageAudio(msg.id, msg.audioBase64!) : undefined}
                          isPlaying={playingMessageId === msg.id}
                        />
                      ))}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Speaker Buttons */}
                <div className="flex justify-center gap-8 py-4">
                  <SpeakerButton
                    speaker="A"
                    flag={sessionInfo?.langAFlag || getLangInfo(langA).flag}
                    langName={sessionInfo?.langAName || getLangInfo(langA).name}
                    isActive={currentSpeaker === 'A'}
                    isRecording={isRecording && currentSpeaker === 'A'}
                    isProcessing={isProcessing && currentSpeaker === 'A'}
                    disabled={!isConnected || isProcessing}
                    onPress={() => startRecording('A')}
                    onRelease={stopRecording}
                  />
                  
                  <SpeakerButton
                    speaker="B"
                    flag={sessionInfo?.langBFlag || getLangInfo(langB).flag}
                    langName={sessionInfo?.langBName || getLangInfo(langB).name}
                    isActive={currentSpeaker === 'B'}
                    isRecording={isRecording && currentSpeaker === 'B'}
                    isProcessing={isProcessing && currentSpeaker === 'B'}
                    disabled={!isConnected || isProcessing}
                    onPress={() => startRecording('B')}
                    onRelease={stopRecording}
                  />
                </div>

                <p className="text-center text-xs text-slate-400">
                  Press and hold to speak • Release to translate
                </p>
              </>
            )}
          </div>
        )}

        {/* BATCH MODE */}
        {mode === 'batch' && (
          <div className="space-y-4">
            {/* Language Selectors */}
            <div className="flex items-center gap-3">
              <select
                value={langA}
                onChange={(e) => setLangA(e.target.value)}
                className="flex-1 bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-medium text-sm"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.flag} {lang.name}</option>
                ))}
              </select>
              
              <button 
                onClick={handleSwapLanguages}
                className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-sky-100 transition-all"
              >
                <ArrowRightLeft className="w-4 h-4 text-slate-500" />
              </button>
              
              <select
                value={langB}
                onChange={(e) => setLangB(e.target.value)}
                className="flex-1 bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-medium text-sm text-indigo-600"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.flag} {lang.name}</option>
                ))}
              </select>
            </div>

            {/* Upload Area */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
                ${uploadedFile 
                  ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20' 
                  : 'border-slate-300 hover:border-sky-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {uploadedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <FileAudio className="w-8 h-8 text-emerald-600" />
                  <p className="font-medium text-sm text-slate-900 dark:text-white">{uploadedFile.name}</p>
                  <p className="text-xs text-slate-500">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-slate-400" />
                  <p className="font-medium text-sm text-slate-900 dark:text-white">Upload audio file</p>
                  <p className="text-xs text-slate-500">WAV, MP3, FLAC, WebM</p>
                </div>
              )}
            </div>

            {/* Translate Button */}
            <button
              onClick={handleBatchTranslate}
              disabled={!uploadedFile || isBatchProcessing}
              className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isBatchProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isBatchProcessing ? 'Processing...' : 'Translate Audio'}
            </button>

            {/* Results */}
            {batchResult && (
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div>
                  <h4 className="text-xs font-medium text-slate-500 mb-1">Original</h4>
                  <p className="text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 p-3 rounded-lg">
                    {batchResult.originalText}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-xs font-medium text-indigo-500 mb-1">
                    Translation 
                    <span className="ml-2 opacity-50 font-normal">
                      (via {engine === 'google' ? 'Google Cloud' : selectedModel})
                    </span>
                  </h4>
                  <p className="text-sm text-slate-900 dark:text-white bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg">
                    {batchResult.translatedText}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => playAudioBase64(batchResult.audioBase64)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-600 rounded-lg text-xs font-medium"
                  >
                    <Play className="w-3 h-3" />
                    Play
                  </button>
                  
                  <button
                    onClick={() => handleCopy(batchResult.translatedText)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium"
                  >
                    {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TranslateView;