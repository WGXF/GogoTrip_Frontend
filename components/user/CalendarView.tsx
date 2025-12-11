import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, RefreshCw, Calendar as CalendarIcon, Check, Clock, MapPin, X, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '../../config';

// --- 类型定义 ---
interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  type: 'flight' | 'activity' | 'meeting' | 'other';
  color: string;
  fullStart?: string; // ISO String for API
  fullEnd?: string;   // ISO String for API
}

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 8 AM to 6 PM
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const CalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'month' | 'week' | 'day'>('week');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  
  // --- 数据状态 ---
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // --- 模态框状态 ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // 选中的事件（用于查看详情/删除）
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // 新建事件的表单状态
  const [newEvent, setNewEvent] = useState({ 
    title: '', 
    dateStr: '', // YYYY-MM-DD
    startTime: '09:00', 
    endTime: '10:00', 
    type: 'activity' 
  });

  // ================= API 交互 =================

  // 1. 获取日程
  const fetchLocalEvents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/calendar/events`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        const formattedEvents: CalendarEvent[] = data.map((ev: any) => {
          const startDate = new Date(ev.startTime);
          const endDate = new Date(ev.endTime);
          
          const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

          return {
            id: ev.id,
            title: ev.title,
            date: startDate,
            startTime: formatTime(startDate),
            endTime: formatTime(endDate),
            fullStart: ev.startTime,
            fullEnd: ev.endTime,
            type: 'activity',
            color: 'bg-sky-500 border-sky-600' 
          };
        });
        setEvents(formattedEvents);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
    }
  };

  useEffect(() => {
    fetchLocalEvents();
  }, []);

  // 2. 同步 Google
  const handleSync = async () => {
    setIsSyncing(true);
    setSyncSuccess(false);
    try {
      const response = await fetch(`${API_BASE_URL}/calendar/sync`, { method: 'POST', credentials: 'include' });
      if (response.status === 401) {
        window.location.href = `${API_BASE_URL}/authorize`;
        return;
      }
      if (response.ok) {
        setSyncSuccess(true);
        await fetchLocalEvents();
        setTimeout(() => setSyncSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  // 3. 手动添加日程 (API)
  const saveNewEvent = async () => {
    if (!newEvent.title || !newEvent.dateStr) return;

    // 组合日期和时间生成 ISO 字符串
    const startDateTime = new Date(`${newEvent.dateStr}T${newEvent.startTime}:00`);
    const endDateTime = new Date(`${newEvent.dateStr}T${newEvent.endTime}:00`);

    try {
      const response = await fetch(`${API_BASE_URL}/calendar/add_manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: newEvent.title,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString()
        })
      });

      if (response.ok) {
        setIsAddModalOpen(false);
        fetchLocalEvents(); // 刷新列表
        // 重置表单
        setNewEvent({ title: '', dateStr: '', startTime: '09:00', endTime: '10:00', type: 'activity' });
      } else {
        alert("添加失败，请检查网络或授权");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 4. 删除日程 (API)
  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    if (!window.confirm("Are you sure you want to delete this event?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/calendar/delete/${selectedEvent.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setIsDetailModalOpen(false);
        setSelectedEvent(null);
        fetchLocalEvents(); // 刷新
      } else {
        alert("删除失败");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ================= 交互处理 =================

  // 处理：点击网格空白处 (打开添加窗口)
  const handleGridClick = (date: Date, hour?: number) => {
    // 格式化日期为 YYYY-MM-DD 用于 input[type="date"]
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    // 如果点击了特定时间格，则自动填入时间
    let startStr = '09:00';
    let endStr = '10:00';
    
    if (hour !== undefined) {
        startStr = `${String(hour).padStart(2, '0')}:00`;
        endStr = `${String(hour + 1).padStart(2, '0')}:00`;
    }

    setNewEvent({
        ...newEvent,
        dateStr: dateStr,
        startTime: startStr,
        endTime: endStr,
        title: ''
    });
    setIsAddModalOpen(true);
  };

  // 处理：点击现有日程 (打开详情窗口)
  const handleEventClick = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation(); // 防止触发网格的点击事件
    setSelectedEvent(event);
    setIsDetailModalOpen(true);
  };

  // 导航辅助
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (viewType === 'month') newDate.setMonth(newDate.getMonth() - 1);
    else if (viewType === 'week') newDate.setDate(newDate.getDate() - 7);
    else newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewType === 'month') newDate.setMonth(newDate.getMonth() + 1);
    else if (viewType === 'week') newDate.setDate(newDate.getDate() + 7);
    else newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  // 获取辅助函数
  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    const days = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const getWeekDays = (date: Date) => {
      const startOfWeek = new Date(date);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      const week = [];
      for (let i = 0; i < 7; i++) {
          const d = new Date(startOfWeek);
          d.setDate(startOfWeek.getDate() + i);
          week.push(d);
      }
      return week;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full p-6 overflow-hidden animate-fade-in-up">
      
      {/* 1. Add Event Modal (Create) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fade-in">
           <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border border-white/20 dark:border-slate-700 animate-scale-in">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Add New Event</h3>
                <button onClick={() => setIsAddModalOpen(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-900" /></button>
             </div>
             
             <div className="space-y-4">
               <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Title</label>
                  <input type="text" className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 outline-none font-medium dark:text-white" autoFocus placeholder="e.g. Meeting" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} />
               </div>
               <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Date</label>
                  <input type="date" className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 outline-none font-medium dark:text-white" value={newEvent.dateStr} onChange={e => setNewEvent({...newEvent, dateStr: e.target.value})} />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Start</label>
                    <input type="time" className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 outline-none font-medium dark:text-white" value={newEvent.startTime} onChange={e => setNewEvent({...newEvent, startTime: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">End</label>
                    <input type="time" className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 outline-none font-medium dark:text-white" value={newEvent.endTime} onChange={e => setNewEvent({...newEvent, endTime: e.target.value})} />
                  </div>
               </div>
               <button onClick={saveNewEvent} className="w-full py-3 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-500 shadow-lg mt-2">Save Event</button>
             </div>
           </div>
        </div>
      )}

      {/* 2. Detail Modal (View / Delete) */}
      {isDetailModalOpen && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fade-in">
           <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border border-white/20 dark:border-slate-700 animate-scale-in">
             <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white break-words w-10/12">{selectedEvent.title}</h3>
                <button onClick={() => setIsDetailModalOpen(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-900" /></button>
             </div>
             
             <div className="space-y-6 mb-8">
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                    <CalendarIcon className="w-5 h-5 text-sky-500" />
                    <span className="font-medium">{selectedEvent.date.toDateString()}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                    <Clock className="w-5 h-5 text-sky-500" />
                    <span className="font-medium">{selectedEvent.startTime} - {selectedEvent.endTime}</span>
                </div>
                {/* 可以在这里加更多字段，比如地点等 */}
             </div>

             <div className="flex gap-3">
                <button onClick={handleDeleteEvent} className="flex-1 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Delete
                </button>
                <button onClick={() => setIsDetailModalOpen(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white font-bold rounded-xl hover:bg-slate-200 transition-colors">
                    Close
                </button>
             </div>
           </div>
        </div>
      )}

      {/* Calendar Header Tools */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white w-64">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
            <button onClick={handlePrev} className="p-1 hover:bg-slate-50 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400"><ChevronLeft className="w-5 h-5" /></button>
            <button onClick={handleNext} className="p-1 hover:bg-slate-50 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400"><ChevronRight className="w-5 h-5" /></button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
           <button onClick={handleSync} className={`flex items-center gap-2 px-3 py-2 bg-white text-slate-700 dark:text-slate-900 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors border border-slate-200 shadow-sm ${syncSuccess ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : ''}`}>
             {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin text-blue-500" /> : syncSuccess ? <Check className="w-4 h-4 text-emerald-500" /> : <span className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold">G</div></span>}
             {syncSuccess ? 'Synced!' : 'Sync'}
           </button>
           
           <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
             {['month', 'week', 'day'].map((view) => (
                <button key={view} onClick={() => setViewType(view as any)} className={`px-3 py-1.5 text-sm font-medium rounded capitalize transition-all ${viewType === view ? 'bg-sky-600 dark:bg-indigo-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                    {view}
                </button>
             ))}
           </div>
           {/* Add Button (General) - now defaults to current date */}
           <button onClick={() => handleGridClick(new Date())} className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-lg shadow-lg">
             <Plus className="w-4 h-4" /> Add
           </button>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="flex-1 bg-white dark:bg-slate-800/20 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-sm dark:shadow-none relative">
        
        {/* MONTH VIEW */}
        {viewType === 'month' && (
            <div className="flex-1 grid grid-cols-7 grid-rows-[auto_1fr]">
                {DAYS.map(day => (
                    <div key={day} className="p-4 text-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                        <span className="text-xs font-semibold text-slate-500 uppercase">{day}</span>
                    </div>
                ))}
                <div className="grid grid-cols-7 grid-rows-5 col-span-7">
                    {getMonthDays(currentDate).map((day, i) => {
                        const dayEvents = day ? events.filter(e => e.date.getDate() === day.getDate() && e.date.getMonth() === day.getMonth()) : [];
                        return (
                            <div 
                                key={i} 
                                // 添加点击事件: 点击网格 -> 添加
                                onClick={() => day && handleGridClick(day)}
                                className={`border-r border-b border-slate-100 dark:border-slate-800/50 p-2 min-h-[100px] hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer ${!day ? 'bg-slate-50/50 dark:bg-slate-900/50' : ''}`}
                            >
                                {day && (
                                    <>
                                        <span className={`text-sm font-medium ${day.getDate() === new Date().getDate() && day.getMonth() === new Date().getMonth() ? 'bg-sky-600 text-white w-7 h-7 flex items-center justify-center rounded-full' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {day.getDate()}
                                        </span>
                                        <div className="mt-2 space-y-1">
                                            {dayEvents.map(ev => (
                                                <div 
                                                    key={ev.id} 
                                                    // 添加点击事件: 点击日程 -> 详情
                                                    onClick={(e) => handleEventClick(e, ev)}
                                                    className={`text-[10px] px-1.5 py-0.5 rounded truncate text-white ${ev.color.split(' ')[0]} cursor-pointer hover:brightness-110 shadow-sm`}
                                                >
                                                    {ev.title}
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {/* WEEK VIEW */}
        {viewType === 'week' && (
            <>
                <div className="grid grid-cols-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <div className="p-4 border-r border-slate-200 dark:border-slate-800 w-20"></div> 
                    {getWeekDays(currentDate).map((day, i) => (
                        <div key={i} className={`p-4 text-center border-r border-slate-200 dark:border-slate-800 last:border-r-0 ${day.getDate() === new Date().getDate() ? 'bg-sky-50 dark:bg-indigo-900/20' : ''}`}>
                            <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">{DAYS[i]}</span>
                            <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${day.getDate() === new Date().getDate() ? 'bg-sky-600 dark:bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                                {day.getDate()}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-8 relative min-h-[600px]">
                        {/* Time Column */}
                        <div className="border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 w-20 flex-shrink-0">
                            {HOURS.map(hour => (
                                <div key={hour} className="h-20 border-b border-slate-100 dark:border-slate-800/50 text-xs text-slate-400 dark:text-slate-500 p-2 text-right relative">
                                <span className="-top-3 relative block">{hour}:00</span>
                                </div>
                            ))}
                        </div>
                        {/* Days Columns */}
                        {getWeekDays(currentDate).map((day, colIdx) => {
                            const dayEvents = events.filter(e => e.date.getDate() === day.getDate() && e.date.getMonth() === day.getMonth());
                            return (
                                <div key={colIdx} className="border-r border-slate-100 dark:border-slate-800/50 last:border-r-0 relative">
                                    {HOURS.map(hour => (
                                        <div 
                                            key={hour} 
                                            // 添加点击事件: 点击具体时间格 -> 添加
                                            onClick={() => handleGridClick(day, hour)}
                                            className="h-20 border-b border-slate-100 dark:border-slate-800/50 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/20"
                                        ></div>
                                    ))}
                                    {/* Event Blocks */}
                                    {dayEvents.map(ev => {
                                        const startHour = parseInt(ev.startTime.split(':')[0]);
                                        // 简单的位置计算，可根据需要优化分钟级精度
                                        const top = (startHour - 8) * 80 + 2; 
                                        return (
                                            <div 
                                                key={ev.id} 
                                                // 添加点击事件: 点击日程 -> 详情
                                                onClick={(e) => handleEventClick(e, ev)}
                                                className={`absolute left-1 right-1 h-[76px] p-2 rounded border-l-4 text-white text-xs cursor-pointer hover:brightness-110 transition-all shadow-md z-10 ${ev.color}`} 
                                                style={{ top: `${top}px` }}
                                            >
                                                <div className="font-bold truncate">{ev.title}</div>
                                                <div className="opacity-80">{ev.startTime} - {ev.endTime}</div>
                                            </div>
                                        )
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </>
        )}

        {/* DAY VIEW */}
        {viewType === 'day' && (
             <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                 <div className="max-w-3xl mx-auto space-y-4">
                     {HOURS.map(hour => {
                         const dayEvents = events.filter(e => e.date.getDate() === currentDate.getDate() && parseInt(e.startTime.split(':')[0]) === hour);
                         return (
                             <div key={hour} className="flex gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                                 <div className="w-16 text-right text-sm text-slate-400 pt-2">{hour}:00</div>
                                 <div className="flex-1 min-h-[60px] relative">
                                     {dayEvents.length > 0 ? dayEvents.map(ev => (
                                         <div 
                                            key={ev.id} 
                                            onClick={(e) => handleEventClick(e, ev)}
                                            className={`p-3 rounded-xl mb-2 border-l-4 ${ev.color} bg-opacity-10 dark:bg-opacity-20 flex justify-between items-center bg-slate-50 dark:bg-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors`}
                                         >
                                             <div>
                                                 <h4 className="font-bold text-slate-900 dark:text-white">{ev.title}</h4>
                                                 <p className="text-xs text-slate-500">{ev.startTime} - {ev.endTime}</p>
                                             </div>
                                         </div>
                                     )) : (
                                         <div 
                                            onClick={() => handleGridClick(currentDate, hour)}
                                            className="border-b border-dashed border-slate-200 dark:border-slate-800/50 h-full w-full cursor-pointer hover:bg-slate-50"
                                         ></div>
                                     )}
                                 </div>
                             </div>
                         )
                     })}
                 </div>
             </div>
        )}
      </div>
    </div>
  );
};

export default CalendarView;