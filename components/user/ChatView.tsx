import React, { useState, useRef, useEffect } from 'react';
// 引入所有图标
import { Send, Paperclip, Mic, Bot, Map, PlusCircle, CheckCircle2, RotateCcw, AlertTriangle, ArrowDown, ChevronLeft, ChevronRight, Info, Calendar, X, Pencil, MapPin, Clock, MessageSquare } from 'lucide-react';
import { MOCK_MESSAGES, MOCK_USER } from '../../constants';
import { Message, TripSuggestion } from '../../types';
import { API_BASE_URL } from '../../config';

const PLACEHOLDERS = [
  "Describe your dream trip to Kyoto...",
  "Plan a weekend getaway to Napa Valley...",
  "Find the best sushi restaurants in Tokyo...",
  "Suggest a 7-day itinerary for Italy...",
  "Looking for family-friendly activities in London...",
  "Show me flights to New York under RM 2000..."
];

const ChatView: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [savedSuggestions, setSavedSuggestions] = useState<string[]>([]);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [currentCoordinates, setCurrentCoordinates] = useState<{latitude: number, longitude: number} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Detail Modal State
  const [selectedSuggestion, setSelectedSuggestion] = useState<TripSuggestion | null>(null);
  const [detailDayPage, setDetailDayPage] = useState(0);

  const handleEditSuggestion = (suggestion: TripSuggestion) => {
      setSelectedSuggestion(null);
      setInputValue(`I want to make changes to the "${suggestion.title}" itinerary. specifically...`);
      textareaRef.current?.focus();
  };

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
          console.log("GPS:", position.coords);
          setCurrentCoordinates({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => { console.warn("GPS Error:", error); },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '56px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 200) + 'px';
    }
  }, [inputValue]);

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
      }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // [核心逻辑] 格式化数据：区分“真实地点”和“AI方案”
  const formatPlacesData = (placesArray: any[]) => {
    return placesArray.map((place, index) => { 
        let imageUrl = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=400';
        if (place.photo_reference && place.photo_reference !== 'N/A') {
            const refEncoded = encodeURIComponent(place.photo_reference);
            const backendBaseUrl = API_BASE_URL; 
            imageUrl = `${backendBaseUrl}/proxy_image?ref=${refEncoded}`;
        }

        // 判断依据：Google Places 的真实地点 business_status 通常是 "OPERATIONAL"
        // AI 生成的方案，我们之前设定它会输出一些自定义标签（如“深度游”）
        const isRealPlace = place.business_status === 'OPERATIONAL' || place.business_status === 'CLOSED_TEMPORARILY';
        
        let itinerary = null;
        let tags = [place.business_status || 'Place'];

        if (isRealPlace) {
            // --- 模式 A: 真实地点 (无 Plan) ---
            // 不生成 itinerary，只保留 raw reviews 供弹窗展示
            tags = place.business_status === 'OPERATIONAL' ? ['营业中', '餐厅/景点'] : ['已关闭'];
        } else {
            // --- 模式 B: AI 方案 (有 Plan) ---
            // 从 review_list[0] 提取长文本作为行程
            const itineraryText = place.review_list?.[0] || '暂无详细行程描述。';
            itinerary = [
                { 
                    day: 1, title: '行程概览', 
                    items: [{ time: '全天', activity: '详细规划', description: itineraryText }] 
                }
            ];
            tags = [place.business_status || 'PLAN'];
        }

        return {
            id: `s-place-${index}-${Date.now()}`,
            title: place.name || '未知名称',
            description: `${place.address || ''} | 评分: ${place.rating || 'N/A'}`,
            duration: isRealPlace ? 'Place' : 'Trip Plan', 
            priceEstimate: place.price_level === 'PRICE_LEVEL_VERY_EXPENSIVE' ? '$$$$' : 
                            place.price_level === 'PRICE_LEVEL_EXPENSIVE' ? '$$$' : 
                            place.price_level === 'PRICE_LEVEL_MODERATE' ? '$$' : 
                            place.price_level === 'PRICE_LEVEL_UNSPECIFIED' || place.price_level === 'N/A' ? 'N/A' : '$',
            tags: tags, 
            imageUrl: imageUrl,
            
            // 关键：根据类型决定是否有 itinerary
            itinerary: itinerary,
            // 额外字段：用于地点详情展示
            reviews: place.review_list || [],
            fullAddress: place.address,
            rating: place.rating
        }; 
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

    try {
        const API_URL = `${API_BASE_URL}/chat_message`; 
        const conversationHistory = messages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [msg.text]
        }));

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: userMessageToSend,
                history: conversationHistory,
                coordinates: currentCoordinates
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP 错误: ${response.status}`);
        }

        const data = await response.json();
        let aiResponseText = data.reply || "AI 没有回复内容";
        let formattedSuggestions = undefined as any;

        if (aiResponseText.startsWith('POPUP_DATA::')) {
            const jsonString = aiResponseText.substring('POPUP_DATA::'.length);
            try {
                const placesData = JSON.parse(jsonString);
                formattedSuggestions = formatPlacesData(placesData);
                aiResponseText = `为您找到了 ${formattedSuggestions.length} 个相关推荐，请点击卡片查看详情：`;
            } catch (parseError) {
                console.error('解析地点 JSON 失败:', parseError);
                aiResponseText = "抱歉，数据解析出错了。";
            }
        }

        const newAiMsg: Message = {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            text: aiResponseText,
            timestamp: new Date(),
            suggestions: formattedSuggestions,
        };
        setMessages(prev => [...prev, newAiMsg]);
    
    } catch (error: any) { 
        console.error('发送消息时发生错误:', error);
        const errorMsg: Message = {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            text: `抱歉，连接服务器失败。错误: ${error.message || error}`,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMsg]);
    }
  };

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

  const handleWheel = (e: React.WheelEvent) => {
    const scrollTop = e.currentTarget.scrollTop;
    if (scrollTop === 0) {
      if (e.deltaY < 0) {
        const resistance = 0.25; 
        const newOffset = Math.min(pullOffset - e.deltaY * resistance, 150);
        setPullOffset(newOffset);
        if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
        isDraggingRef.current = true;
        resetTimeoutRef.current = setTimeout(() => {
          isDraggingRef.current = false;
          if (newOffset > 100) setShowResetConfirm(true);
          setPullOffset(0);
        }, 60);
      } else if (pullOffset > 0 && e.deltaY > 0) {
        setPullOffset(Math.max(0, pullOffset - e.deltaY));
      }
    }
  };

  const SuggestionCard: React.FC<{ suggestion: TripSuggestion }> = ({ suggestion }) => {
    const isSaved = savedSuggestions.includes(suggestion.id);
    return (
      <div className="w-full md:w-auto md:min-w-[280px] md:max-w-[320px] bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 rounded-2xl isolate transform-gpu [mask-image:radial-gradient(white,black)] flex-shrink-0 snap-start transition-all duration-300 ease-out cursor-pointer group hover:scale-105">
        <div className="h-36 overflow-hidden relative rounded-t-2xl">
          <img src={suggestion.imageUrl} alt={suggestion.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-3 left-4">
             <h4 className="text-white font-bold text-lg leading-tight tracking-tight">{suggestion.title}</h4>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">{suggestion.description}</p>
          <div className="flex flex-wrap gap-2">
            {suggestion.tags.map(tag => (
              <span key={tag} className="text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 px-2.5 py-1 rounded-lg uppercase tracking-wider border border-transparent hover:border-slate-300 transition-colors group-hover:bg-white group-hover:shadow-sm">{tag}</span>
            ))}
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700/50">
             <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Est. Cost</p>
               <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{suggestion.priceEstimate}</p>
             </div>
             <div className="flex gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedSuggestion(suggestion); setDetailDayPage(0); }}
                  className="p-2 rounded-xl text-slate-400 hover:text-sky-600 hover:bg-slate-50 dark:hover:bg-slate-800 dark:hover:text-indigo-400 transition-all active:scale-95 border border-transparent hover:border-slate-200"
                  title="View Details"
                >
                  <Info className="w-4 h-4" />
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); toggleSaveSuggestion(suggestion.id); }}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 border border-transparent hover:-translate-y-1 hover:shadow-xl hover:scale-105 ${
                      isSaved ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/50' : 'bg-sky-600 hover:bg-sky-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white shadow-lg shadow-sky-600/20 dark:shadow-indigo-600/20 hover:border-sky-300'
                    }`}
                >
                  {isSaved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <PlusCircle className="w-3.5 h-3.5" />}
                  {isSaved ? 'Added' : 'Add'}
                </button>
             </div>
          </div>
        </div>
      </div>
    );
  };

  const SuggestionList: React.FC<{ suggestions: TripSuggestion[] }> = ({ suggestions }) => {
    const listRef = useRef<HTMLDivElement>(null);
    const [activeIdx, setActiveIdx] = useState(0);

    const handleScroll = () => {
        if (listRef.current) {
            const scrollLeft = listRef.current.scrollLeft;
            const itemWidth = listRef.current.firstElementChild?.clientWidth || 300;
            const newIndex = Math.round(scrollLeft / itemWidth);
            setActiveIdx(newIndex);
        }
    }

    const scrollLeft = () => {
      if (listRef.current) {
        const firstCard = listRef.current.firstElementChild;
        const scrollAmount = firstCard ? firstCard.clientWidth + 20 : 340;
        listRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      }
    };

    const scrollRight = () => {
      if (listRef.current) {
        const firstCard = listRef.current.firstElementChild;
        const scrollAmount = firstCard ? firstCard.clientWidth + 20 : 340;
        listRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    };

    return (
      <div className="relative group/list">
        <div className="block opacity-100 md:opacity-0 md:group-hover/list:opacity-100 transition-opacity">
           <button onClick={scrollLeft} className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3 md:-ml-5 z-20 p-2 bg-white dark:bg-slate-800 rounded-full shadow-lg text-slate-500 hover:text-sky-600 transition-all hover:scale-110 active:scale-95 border border-slate-100 dark:border-slate-700">
              <ChevronLeft className="w-5 h-5" />
           </button>
           <button onClick={scrollRight} className="absolute right-0 top-1/2 -translate-y-1/2 -mr-3 md:-mr-1 z-20 p-2 bg-white dark:bg-slate-800 rounded-full shadow-lg text-slate-500 hover:text-sky-600 transition-all hover:scale-110 active:scale-95 border border-slate-100 dark:border-slate-700">
              <ChevronRight className="w-5 h-5" />
           </button>
        </div>
        <div ref={listRef} onScroll={handleScroll} className="flex flex-row gap-4 md:gap-5 overflow-x-auto pb-4 md:pb-8 md:-mb-4 pl-1 [&::-webkit-scrollbar]:hidden scroll-smooth snap-x">
            {suggestions.map(suggestion => (
                <SuggestionCard key={suggestion.id} suggestion={suggestion} />
            ))}
        </div>
        <div className="flex justify-center gap-1.5 mt-2">
            {suggestions.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIdx ? 'w-6 bg-sky-500 dark:bg-indigo-500' : 'w-1.5 bg-slate-200 dark:bg-slate-700'}`} />
            ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] w-full mx-auto relative px-0 md:px-6">
      
      {/* 1. Trip Details Modal */}
      {selectedSuggestion && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
           <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-slate-700 relative animate-scale-in flex flex-col max-h-[85vh]">
             {/* Header */}
             <div className="relative h-48 md:h-64 shrink-0">
                 <img src={selectedSuggestion.imageUrl} alt={selectedSuggestion.title} className="w-full h-full object-cover rounded-t-[2.5rem]" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent rounded-t-[2.5rem]"></div>
                 <button onClick={() => setSelectedSuggestion(null)} className="absolute top-6 right-6 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md text-white rounded-full transition-all hover:scale-110">
                   <X className="w-5 h-5" />
                 </button>
                 <div className="absolute bottom-6 left-6 md:left-8">
                     <div className="flex gap-2 mb-2">
                        <span className="bg-emerald-500/80 backdrop-blur-md text-white px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">{selectedSuggestion.duration}</span>
                        <span className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">{selectedSuggestion.priceEstimate}</span>
                     </div>
                     <h2 className="text-3xl font-bold text-white tracking-tight">{selectedSuggestion.title}</h2>
                 </div>
             </div>

             {/* Content Area - Intelligent Switching */}
             <div className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar">
                <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-6">{selectedSuggestion.description}</p>
                
                {selectedSuggestion.itinerary ? (
                    /* --- 模式 A: 显示详细行程 (Timeline) --- */
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700">
                         <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-sky-500" />
                                Day {selectedSuggestion.itinerary[detailDayPage].day}: {selectedSuggestion.itinerary[detailDayPage].title}
                            </h3>
                            <div className="flex gap-1">
                                <button onClick={() => setDetailDayPage(Math.max(0, detailDayPage - 1))} disabled={detailDayPage === 0} className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-sm font-bold text-slate-400 py-1.5 px-2">{detailDayPage + 1} / {selectedSuggestion.itinerary.length}</span>
                                <button onClick={() => setDetailDayPage(Math.min(selectedSuggestion.itinerary.length - 1, detailDayPage + 1))} disabled={detailDayPage === (selectedSuggestion.itinerary.length - 1)} className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                         </div>
                         <div className="space-y-4 relative">
                            <div className="absolute left-[27px] top-2 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-700"></div>
                            {selectedSuggestion.itinerary[detailDayPage].items.map((item, idx) => (
                                <div key={idx} className="relative flex gap-6 animate-fade-in-up" style={{ animationDelay: `${idx * 100}ms` }}>
                                    <div className="w-14 shrink-0 pt-1 relative z-10 text-right"><div className="text-xs font-bold text-slate-400">{item.time}</div></div>
                                    <div className="absolute left-[23px] top-1.5 w-2.5 h-2.5 rounded-full bg-sky-500 border-2 border-white dark:border-slate-800 z-10 shadow-sm"></div>
                                    <div className="flex-1 pb-4">
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{item.activity}</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 whitespace-pre-wrap">{item.description}</p>
                                    </div>
                                </div>
                            ))}
                         </div>
                    </div>
                ) : (
                    /* --- 模式 B: 显示地点详情 (Address & Reviews) --- */
                    <div className="space-y-6">
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 flex items-start gap-4">
                            <div className="p-2.5 bg-white dark:bg-slate-700 rounded-xl shadow-sm text-sky-500"><MapPin className="w-5 h-5" /></div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Detailed Address</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{(selectedSuggestion as any).fullAddress || 'Address not available'}</p>
                            </div>
                        </div>

                        {/* Reviews Section */}
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-emerald-500" /> 
                                Recent Reviews
                            </h4>
                            <div className="space-y-3">
                                {(selectedSuggestion as any).reviews && (selectedSuggestion as any).reviews.length > 0 ? (
                                    (selectedSuggestion as any).reviews.slice(0, 3).map((review: string, idx: number) => (
                                        <div key={idx} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                            <p className="text-xs text-slate-600 dark:text-slate-300 italic">"{review}"</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-xs text-slate-400 italic">No reviews available.</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
             </div>

             <div className="p-6 md:p-8 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-b-[2.5rem] flex gap-4">
                 <button onClick={() => handleEditSuggestion(selectedSuggestion)} className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 flex items-center justify-center gap-2">
                   <Pencil className="w-4 h-4" /> {selectedSuggestion.itinerary ? "Edit Plan" : "Add Note"}
                 </button>
                 <button onClick={() => { toggleSaveSuggestion(selectedSuggestion.id); setSelectedSuggestion(null); }} className="flex-[2] py-3.5 bg-sky-600 hover:bg-sky-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-sky-600/20 dark:shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 hover:-translate-y-1">
                   <PlusCircle className="w-4 h-4" /> Save
                 </button>
             </div>
           </div>
        </div>
      )}

      {/* 2. Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
           <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border border-white/20 dark:border-slate-700 text-center animate-scale-in">
              <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle className="w-7 h-7" /></div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Reset Chat History?</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium leading-relaxed text-sm">This will clear all messages. Cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowResetConfirm(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95">Cancel</button>
                <button onClick={handleResetChat} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"><RotateCcw className="w-4 h-4" /> Reset</button>
              </div>
           </div>
        </div>
      )}

      {/* 3. Pull Indicator */}
      <div className="absolute top-0 left-0 right-0 h-20 flex items-center justify-center z-10 pointer-events-none transition-opacity duration-300" style={{ opacity: Math.min(pullOffset / 80, 1), transform: `translateY(${Math.min(pullOffset / 2, 20)}px)` }}>
        <div className="bg-slate-900/80 dark:bg-white/90 backdrop-blur-md text-white dark:text-slate-900 px-4 py-2 rounded-full flex items-center gap-3 shadow-xl scale-90 transition-transform" style={{ transform: `scale(${0.8 + Math.min(pullOffset/200, 0.2)})`}}>
           <RotateCcw className="w-4 h-4" style={{ transform: `rotate(-${pullOffset * 2}deg)` }} />
           <span className="text-xs font-bold uppercase tracking-wider">Release to Reset</span>
        </div>
      </div>

      {/* 4. Messages List */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 scroll-smooth custom-scrollbar relative" onWheel={handleWheel}>
        <div className="transition-transform duration-75 ease-out will-change-transform flex flex-col space-y-8" style={{ transform: `translateY(${pullOffset}px)` }}>
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 animate-fade-in-up select-none opacity-50 hover:opacity-100 transition-opacity">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-inner"><Map className="w-8 h-8 text-sky-500 dark:text-indigo-400" /></div>
                <div><p className="text-sm font-bold text-slate-500 dark:text-slate-400">Start planning your next adventure.</p><div className="flex items-center justify-center gap-2 mt-2 text-sky-500/60 dark:text-indigo-400/60"><ArrowDown className="w-4 h-4 animate-bounce" /><p className="text-xs font-bold uppercase tracking-wide">Pull down to reset chat</p></div></div>
            </div>

            {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
                <div key={msg.id} className={`flex w-full flex-col animate-fade-in-up ${isUser ? 'items-end' : 'items-start'}`}>
                    <div className={`flex gap-4 max-w-[90%] md:max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className="flex-shrink-0 mt-2">
                            {isUser ? <img src={MOCK_USER.avatarUrl} alt="User" className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-800 shadow-sm" /> : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-md"><Bot className="w-5 h-5 text-white" /></div>}
                        </div>
                        <div className={`flex flex-col gap-1 p-5 rounded-[1.5rem] shadow-sm relative overflow-hidden group border border-transparent transition-all duration-300 hover:shadow-md ${isUser ? 'bg-sky-600 dark:bg-indigo-600 text-white rounded-tr-sm' : 'bg-white dark:bg-slate-900 text-slate-800 border-slate-100 dark:border-slate-800 rounded-tl-sm'}`}>
                            <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium relative z-10">{msg.text}</p>
                            <span className={`text-[10px] font-bold ${isUser ? 'text-sky-100' : 'text-slate-400'} self-end relative z-10 mt-1`}>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                    {msg.suggestions && msg.suggestions.length > 0 && (
                        <div className="mt-8 ml-0 md:ml-14 w-full md:w-auto md:max-w-[95%]">
                            <SuggestionList suggestions={msg.suggestions} />
                        </div>
                    )}
                </div>
            );
            })}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* 5. Input Area */}
      <div className="px-4 md:px-6 pb-6 md:pb-10 pt-4 bg-transparent z-20">
        <div className="relative w-full max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 flex items-end">
          <div className="absolute left-4 bottom-[8px] flex gap-1 z-10">
            <button className="p-2.5 text-slate-400 hover:text-sky-600 transition-all rounded-xl hover:bg-white border border-transparent hover:-translate-y-1 hover:scale-110 active:scale-95"><Paperclip className="w-5 h-5" /></button>
            <button className="p-2.5 text-slate-400 hover:text-sky-600 transition-all rounded-xl hover:bg-white border border-transparent hover:-translate-y-1 hover:scale-110 active:scale-95"><Mic className="w-5 h-5" /></button>
          </div>
          {!inputValue && <div className={`absolute left-28 right-20 top-[18px] flex items-center pointer-events-none text-slate-400 font-medium text-base transition-all duration-500 truncate ${isPlaceholderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>{currentPlaceholder}</div>}
          <textarea ref={textareaRef} value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} className="w-full bg-transparent text-slate-900 dark:text-slate-100 font-medium rounded-[2rem] pt-[18px] pb-[14px] pl-28 pr-16 focus:outline-none resize-none h-auto overflow-hidden leading-normal relative z-0" style={{ minHeight: '56px' }} />
          <div className="absolute right-5 bottom-[8px]">
            <button onClick={handleSendMessage} disabled={!inputValue.trim()} className="p-2.5 bg-sky-600 hover:bg-sky-500 dark:bg-indigo-600 disabled:opacity-50 text-white rounded-2xl transition-all duration-300 ease-out hover:scale-110 active:scale-95 border border-transparent hover:-translate-y-1"><Send className="w-5 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatView;