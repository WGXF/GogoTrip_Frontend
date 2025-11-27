
import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, Bot, Sparkles, Map, PlusCircle, CheckCircle2, RotateCcw, AlertTriangle, ArrowDown } from 'lucide-react';
import { MOCK_MESSAGES, MOCK_USER } from '../constants';
import { Message, TripSuggestion } from '../types';

const PLACEHOLDERS = [
  "Describe your dream trip to Kyoto...",
  "Plan a weekend getaway to Napa Valley...",
  "Find the best sushi restaurants in Tokyo...",
  "Suggest a 7-day itinerary for Italy...",
  "Looking for family-friendly activities in London...",
  "Show me flights to New York under $500..."
];

const ChatView: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [savedSuggestions, setSavedSuggestions] = useState<string[]>([]);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [currentCoordinates, setCurrentCoordinates] = useState<{latitude: number, longitude: number} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [currentPlaceholder, setCurrentPlaceholder] = useState(PLACEHOLDERS[0]);
  const [isPlaceholderVisible, setIsPlaceholderVisible] = useState(true);

  // Pull-to-reset state
  const [pullOffset, setPullOffset] = useState(0);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("已获取位置:", position.coords);
          setCurrentCoordinates({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.warn("无法获取位置 (可能是用户拒绝或不支持):", error);
          // 这里可以设置默认坐标，或者保持为 null
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    // Add a small timeout to ensure DOM is painted and layout is calculated before scrolling
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to calculate correct scrollHeight
      textareaRef.current.style.height = '56px';
      const scrollHeight = textareaRef.current.scrollHeight;
      // Cap at 200px or grow
      textareaRef.current.style.height = Math.min(scrollHeight, 200) + 'px';
    }
  }, [inputValue]);

  // Rotate Placeholders
  useEffect(() => {
    const interval = setInterval(() => {
      setIsPlaceholderVisible(false);
      setTimeout(() => {
        setCurrentPlaceholder(prev => {
          const currentIndex = PLACEHOLDERS.indexOf(prev);
          const nextIndex = (currentIndex + 1) % PLACEHOLDERS.length;
          return PLACEHOLDERS[nextIndex];
        });
        setIsPlaceholderVisible(true);
      }, 300); // Wait for fade out
    }, 4000);
    return () => clearInterval(interval);
  }, []);

const formatPlacesData = (placesArray: any[]) => {
    return placesArray.map((place, index) => { 
        
        let imageUrl = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=400';

        if (place.photo_reference && place.photo_reference !== 'N/A') {
            // [修正] 这里必须用 place.photo_reference
            const refEncoded = encodeURIComponent(place.photo_reference);
            
            const backendBaseUrl = 'http://127.0.0.1:5000'; 
            imageUrl = `${backendBaseUrl}/proxy_image?ref=${refEncoded}`;
        }

        // --- 显式返回对象 ---
        return {
            id: `s-place-${index}-${Date.now()}`,
            title: place.name || '未知名称',
            
            description: `${place.address || '地址不可用'} | 评分: ${place.rating || 'N/A'}。 ${place.review_list?.[0]?.text || '暂无评论。'}`,
            
            duration: 'N/A', 
            
            priceEstimate: place.price_level === 'PRICE_LEVEL_VERY_EXPENSIVE' ? '$$$$' : 
                            place.price_level === 'PRICE_LEVEL_EXPENSIVE' ? '$$$' : 
                            place.price_level === 'PRICE_LEVEL_MODERATE' ? '$$' : 
                            place.price_level === 'PRICE_LEVEL_UNSPECIFIED' || place.price_level === 'N/A' ? 'N/A' : '$',
                            
            tags: [place.business_status], 
            
            imageUrl: imageUrl, // <--- 引用上面计算好的 imageUrl 变量
        }; // <--- 显式返回对象结束
    });
};


const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const newUserMsg: Message = {
        id: Date.now().toString(),
        sender: 'user',
        text: inputValue,
        timestamp: new Date(),
    };

    setMessages(prev => [...prev, newUserMsg]);
    const userMessageToSend = inputValue;
    setInputValue('');

    // --- 完整的 try/catch/finally 结构 ---
    try { // <--- 你的 try 块开始在这里
        const API_URL = 'http://127.0.0.1:5000/chat_message'; // 确保是本地地址

        const conversationHistory = messages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [msg.text]
        }));

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: userMessageToSend,
                history: conversationHistory, // 发送历史记录上下文
                coordinates: currentCoordinates
                // ... 历史记录和坐标保持不变 ...
            }),
        });

        if (!response.ok) { // 检查 HTTP 状态码是否成功
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP 错误: ${response.status}`);
        }

        const data = await response.json();

        let aiResponseText = data.reply || "AI 没有回复内容";
        let formattedSuggestions = undefined as any;

        // [核心逻辑：检查 POPUP_DATA:: 魔法字符串]
        if (aiResponseText.startsWith('POPUP_DATA::')) {
            const jsonString = aiResponseText.substring('POPUP_DATA::'.length);
            try {
                const placesData = JSON.parse(jsonString);
                formattedSuggestions = formatPlacesData(placesData);
                aiResponseText = `为您找到了 ${formattedSuggestions.length} 个地点建议，请点击下方卡片查看详情：`;
            } catch (parseError) {
                console.error('解析地点 JSON 失败:', parseError);
                aiResponseText = "抱歉，我找到了地点，但在显示它们时出错了。";
            }
        }
        // [核心逻辑结束]

        // 4. 更新状态 (成功或带着错误提示)
        const newAiMsg: Message = {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            text: aiResponseText,
            timestamp: new Date(),
            suggestions: formattedSuggestions,
        };
        setMessages(prev => [...prev, newAiMsg]);
    
    // --- [修复] 补齐 catch 块 ---
    } catch (error) { 
        console.error('发送消息时发生错误:', error);
        const errorMsg: Message = {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            text: `抱歉，连接服务器失败。详情请看控制台。错误: ${error.message || error}`,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMsg]);
    }
    // --- [可选] finally 块，可以在请求完成后清理状态或启用按钮 ---
    finally {
        // 可以在这里添加代码，例如重新启用发送按钮，但现在不需要
    }
}; // <--- handleSendMessage 结束

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleSaveSuggestion = (id: string) => {
    setSavedSuggestions(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handleResetChat = () => {
    setMessages([]);
    setSavedSuggestions([]);
    setShowResetConfirm(false);
  };

  // Physics-based pull interaction
  const handleWheel = (e: React.WheelEvent) => {
    const scrollTop = e.currentTarget.scrollTop;
    
    // Only engage if at top
    if (scrollTop === 0) {
      // Pulling down (negative deltaY)
      if (e.deltaY < 0) {
        // Resistance curve: harder to pull as offset increases
        const resistance = 0.25; 
        const newOffset = Math.min(pullOffset - e.deltaY * resistance, 150); // Cap at 150px
        setPullOffset(newOffset);
        
        if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
        isDraggingRef.current = true;

        // Set a timeout to detect "release" of the scroll gesture
        resetTimeoutRef.current = setTimeout(() => {
          isDraggingRef.current = false;
          // If released past threshold, trigger confirm
          if (newOffset > 100) {
            setShowResetConfirm(true);
          }
          setPullOffset(0); // Snap back
        }, 60); // Fast release detection
      } 
      // Scrolling back up / releasing tension
      else if (pullOffset > 0 && e.deltaY > 0) {
        setPullOffset(Math.max(0, pullOffset - e.deltaY));
      }
    }
  };

  const SuggestionCard: React.FC<{ suggestion: TripSuggestion }> = ({ suggestion }) => {
    const isSaved = savedSuggestions.includes(suggestion.id);
    
    return (
      <div className="w-full md:w-auto md:min-w-[280px] md:max-w-[320px] bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 rounded-2xl isolate transform-gpu [mask-image:radial-gradient(white,black)] flex-shrink-0 snap-start transition-all duration-300 ease-out cursor-pointer group hover:scale-105">
        {/* Image Container with enforced rounding and masking */}
        <div className="h-36 overflow-hidden relative rounded-t-2xl">
          <img 
            src={suggestion.imageUrl} 
            alt={suggestion.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-3 left-4">
             <h4 className="text-white font-bold text-lg leading-tight tracking-tight">{suggestion.title}</h4>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">{suggestion.description}</p>
          
          <div className="flex flex-wrap gap-2">
            {suggestion.tags.map(tag => (
              <span key={tag} className="text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 px-2.5 py-1 rounded-lg uppercase tracking-wider border border-transparent hover:border-slate-300 transition-colors group-hover:bg-white group-hover:shadow-sm">
                {tag}
              </span>
            ))}
          </div>
          
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700/50">
             <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Est. Cost</p>
               <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{suggestion.priceEstimate}</p>
             </div>
             <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSaveSuggestion(suggestion.id);
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 border border-transparent hover:-translate-y-1 hover:shadow-xl hover:scale-105 ${
                  isSaved 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/50' 
                    : 'bg-sky-600 hover:bg-sky-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white shadow-lg shadow-sky-600/20 dark:shadow-indigo-600/20 hover:border-sky-300'
                }`}
             >
               {isSaved ? (
                 <>
                   <CheckCircle2 className="w-3.5 h-3.5" />
                   Added
                 </>
               ) : (
                 <>
                   <PlusCircle className="w-3.5 h-3.5" />
                   Add to Trip
                 </>
               )}
             </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] w-full mx-auto relative px-0 md:px-6">
      
      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
           <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border border-white/20 dark:border-slate-700 text-center animate-scale-in">
              <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Reset Chat History?</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium leading-relaxed text-sm">
                This will clear all messages and suggestions from the current session. This action cannot be undone.
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleResetChat}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset Chat
                </button>
              </div>
           </div>
        </div>
      )}

      {/* Pull Indicator Layer */}
      <div 
        className="absolute top-0 left-0 right-0 h-20 flex items-center justify-center z-10 pointer-events-none transition-opacity duration-300"
        style={{ 
          opacity: Math.min(pullOffset / 80, 1),
          transform: `translateY(${Math.min(pullOffset / 2, 20)}px)`
        }}
      >
        <div className="bg-slate-900/80 dark:bg-white/90 backdrop-blur-md text-white dark:text-slate-900 px-4 py-2 rounded-full flex items-center gap-3 shadow-xl scale-90 transition-transform" style={{ transform: `scale(${0.8 + Math.min(pullOffset/200, 0.2)})`}}>
           <RotateCcw 
             className="w-4 h-4" 
             style={{ transform: `rotate(-${pullOffset * 2}deg)` }} 
           />
           <span className="text-xs font-bold uppercase tracking-wider">Release to Reset</span>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 scroll-smooth custom-scrollbar relative"
        onWheel={handleWheel}
      >
        <div 
            className="transition-transform duration-75 ease-out will-change-transform flex flex-col space-y-8"
            style={{ transform: `translateY(${pullOffset}px)` }}
        >
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 animate-fade-in-up select-none opacity-50 hover:opacity-100 transition-opacity">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-inner">
                <Map className="w-8 h-8 text-sky-500 dark:text-indigo-400" />
            </div>
            <div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Start planning your next adventure.</p>
                <div className="flex items-center justify-center gap-2 mt-2 text-sky-500/60 dark:text-indigo-400/60">
                    <ArrowDown className="w-4 h-4 animate-bounce" />
                    <p className="text-xs font-bold uppercase tracking-wide">Pull down to reset chat</p>
                </div>
            </div>
            </div>

            {messages.map((msg, idx) => {
            const isUser = msg.sender === 'user';
            return (
                <div key={msg.id} className={`flex w-full flex-col animate-fade-in-up ${isUser ? 'items-end' : 'items-start'}`} style={{ animationDelay: '100ms' }}>
                <div className={`flex gap-4 max-w-[90%] md:max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    <div className="flex-shrink-0 mt-2">
                    {isUser ? (
                        <img src={MOCK_USER.avatarUrl} alt="User" className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-800 shadow-sm" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 dark:from-indigo-500 dark:to-violet-600 flex items-center justify-center shadow-md">
                        <Bot className="w-5 h-5 text-white" />
                        </div>
                    )}
                    </div>

                    {/* Bubble */}
                    <div className={`
                    flex flex-col gap-1 p-5 rounded-[1.5rem] shadow-sm relative overflow-hidden group border border-transparent transition-all duration-300 hover:shadow-md
                    ${isUser 
                        ? 'bg-sky-600 dark:bg-indigo-600 text-white rounded-tr-sm hover:border-sky-400 hover:-translate-y-0.5' 
                        : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-100 dark:border-slate-800 rounded-tl-sm hover:border-slate-300 dark:hover:border-slate-600 hover:-translate-y-0.5'
                    }
                    `}>
                    {/* Subtle shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium relative z-10">{msg.text}</p>
                    <span className={`text-[10px] font-bold ${isUser ? 'text-sky-100 dark:text-indigo-200' : 'text-slate-400 dark:text-slate-500'} self-end relative z-10 mt-1`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    </div>
                </div>

                {/* Suggestions Grid */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-6 ml-0 md:ml-14 w-full md:w-auto md:max-w-[95%]">
                        {/* On mobile: flex-col (vertical stack), no scroll. On Desktop: flex-row, horizontal scroll enabled if needed */}
                        <div className="flex flex-col md:flex-row gap-4 md:gap-5 md:overflow-x-auto pb-0 md:pb-8 md:-mb-4 md:pl-1 md:[&::-webkit-scrollbar]:hidden">
                            {msg.suggestions.map(suggestion => (
                                <SuggestionCard key={suggestion.id} suggestion={suggestion} />
                            ))}
                        </div>
                    </div>
                )}
                </div>
            );
            })}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-4 md:px-6 pb-6 md:pb-10 pt-4 bg-transparent z-20">
        <div className="relative w-full max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-200 dark:border-slate-800 hover:border-sky-400 dark:hover:border-indigo-400 transition-all focus-within:shadow-sky-500/10 dark:focus-within:shadow-indigo-500/20 focus-within:border-sky-500 dark:focus-within:border-indigo-500 hover:-translate-y-1 hover:shadow-2xl duration-300 ease-out flex items-end">
          
          <div className="absolute left-4 bottom-[8px] flex gap-1 z-10">
            <button className="p-2.5 text-slate-400 hover:text-sky-600 dark:hover:text-indigo-400 transition-all duration-300 rounded-xl hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:-translate-y-1 hover:scale-110 active:scale-95">
              <Paperclip className="w-5 h-5" />
            </button>
            <button className="p-2.5 text-slate-400 hover:text-sky-600 dark:hover:text-indigo-400 transition-all duration-300 rounded-xl hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:-translate-y-1 hover:scale-110 active:scale-95">
              <Mic className="w-5 h-5" />
            </button>
          </div>
          
          {/* Animated Placeholder Overlay */}
          {!inputValue && (
            <div 
              className={`absolute left-28 right-20 top-[18px] flex items-center pointer-events-none text-slate-400 font-medium text-base transition-all duration-500 truncate ${isPlaceholderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
            >
              {currentPlaceholder}
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-slate-900 dark:text-slate-100 font-medium rounded-[2rem] pt-[18px] pb-[14px] pl-28 pr-16 focus:outline-none resize-none h-auto overflow-hidden leading-normal relative z-0"
            style={{ minHeight: '56px' }}
          />
          
          {/* Send Button Container - Handles positioning separately from animation */}
          <div className="absolute right-5 bottom-[8px]">
            <button 
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="p-2.5 bg-sky-600 hover:bg-sky-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl transition-all duration-300 ease-out hover:scale-110 active:scale-95 border border-transparent hover:-translate-y-1"
            >
                <Send className="w-5 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
