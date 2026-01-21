import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  RefreshCw, 
  Calendar as CalendarIcon, 
  Check, 
  Clock, 
  X, 
  Trash2, 
  AlertCircle 
} from 'lucide-react';
import { API_BASE_URL } from '../../config';
import { User } from '../../types';
import GoogleLinkDialog from '../ui/GoogleLinkDialog';
import { useGoogleLink } from '../../hooks/useGoogleLink';

/* =========================
   Types & Constants
========================= */
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

// 🐞 Bug 4 Fix: Configurable time range (was hardcoded 8-18)
const START_HOUR = 0;
const END_HOUR = 24;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/* =========================
   Props Interface
========================= */
interface CalendarViewProps {
  user: User | null;
}

/* =========================
   Main Component
========================= */
const CalendarView: React.FC<CalendarViewProps> = ({ user }) => {
  // State: View & Date
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'month' | 'week' | 'day'>('week');
  
  // State: Data & Sync
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  // 🆕 Google Link Hook
  const {
    requireGoogleLink,
    showLinkDialog,
    pendingFeature,
    handleGoToSettings,
    handleCancelLink,
  } = useGoogleLink({
    user,
    onShowWarning: (msg) => showToast(msg, 'error'),
  });
  
  // State: UI & Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // State: Selection & Forms
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [newEvent, setNewEvent] = useState({ 
    title: '', 
    dateStr: '', 
    startTime: '09:00', 
    endTime: '10:00', 
    type: 'activity' 
  });

  // Helper: Toast
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* =========================
     API Logic
  ========================= */
  const fetchLocalEvents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/calendar/events`, { credentials: 'include' });
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
      showToast("Failed to load events", "error");
    }
  };

  useEffect(() => {
    fetchLocalEvents();
  }, []);

  const handleSync = async () => {
    // 🆕 Check Google link FIRST before syncing
    if (!requireGoogleLink('Calendar sync')) {
      return; // Dialog will be shown by the hook
    }
    
    setIsSyncing(true);
    setSyncSuccess(false);
    try {
      const response = await fetch(`${API_BASE_URL}/api/calendar/sync`, { method: 'POST', credentials: 'include' });
      if (response.status === 401) {
        // User has Google linked but session expired - redirect to re-auth
        window.location.href = `${API_BASE_URL}/authorize`;
        return;
      }
      if (response.ok) {
        setSyncSuccess(true);
        showToast("Calendar synced successfully!");
        await fetchLocalEvents();
        setTimeout(() => setSyncSuccess(false), 3000);
      } else {
        showToast("Sync failed", "error");
      }
    } catch (error) {
      console.error("Sync error:", error);
      showToast("Sync error occurred", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const saveNewEvent = async () => {
    if (!newEvent.title || !newEvent.dateStr) return;

    const startDateTime = new Date(`${newEvent.dateStr}T${newEvent.startTime}:00`);
    const endDateTime = new Date(`${newEvent.dateStr}T${newEvent.endTime}:00`);

    try {
      const response = await fetch(`${API_BASE_URL}/api/calendar/add_manual`, {
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
        // 🐞 Bug 2 Fix: Use await for consistent state update
        await fetchLocalEvents();
        setNewEvent({ title: '', dateStr: '', startTime: '09:00', endTime: '10:00', type: 'activity' });
        showToast("Event added successfully!");
      } else {
        showToast("Failed to add event. Check network or auth.", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("An error occurred while adding event.", "error");
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    if (!window.confirm("Are you sure you want to delete this event?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/calendar/delete/${selectedEvent.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setIsDetailModalOpen(false);
        setSelectedEvent(null);
        // 🐞 Bug 2 Fix: Use await for consistent state update
        await fetchLocalEvents();
        showToast("Event deleted successfully!");
      } else {
        showToast("Failed to delete event.", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("An error occurred while deleting.", "error");
    }
  };

  /* =========================
     Interaction Handlers
  ========================= */
  const handleGridClick = (date: Date, hour?: number) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

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

  const handleEventClick = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setIsDetailModalOpen(true);
  };

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

  /* =========================
     Date Helpers
  ========================= */
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

  // 🐞 Bug 1 Fix: Calculate dynamic row count for month view
  const getMonthRowCount = (date: Date) => {
    const totalCells = getMonthDays(date).length;
    return Math.ceil(totalCells / 7); // Returns 5 or 6
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

  // 🐞 Bug 2 Fix: Calculate event position using fullStart (minutes-based)
  const calculateEventPosition = (ev: CalendarEvent) => {
    if (ev.fullStart) {
      const startDate = new Date(ev.fullStart);
      const minutesFromMidnight = startDate.getHours() * 60 + startDate.getMinutes();
      const minutesFromStart = minutesFromMidnight - START_HOUR * 60;
      return (minutesFromStart / 60) * 80 + 2;
    }
    // Fallback to string parsing
    const startHour = parseInt(ev.startTime.split(':')[0]);
    const startMinute = parseInt(ev.startTime.split(':')[1]) || 0;
    return ((startHour - START_HOUR) + startMinute / 60) * 80 + 2;
  };

  // 🐞 Bug 2 Fix: Calculate event height based on duration
  const calculateEventHeight = (ev: CalendarEvent) => {
    if (ev.fullStart && ev.fullEnd) {
      const start = new Date(ev.fullStart);
      const end = new Date(ev.fullEnd);
      const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
      return Math.max((durationMinutes / 60) * 80 - 4, 20); // Min height 20px
    }
    return 76; // Default height
  };

  // 🐞 Bug 5 Fix: Check if event overlaps with hour slot (range-based)
  const isEventInHourSlot = (ev: CalendarEvent, hour: number) => {
    if (ev.fullStart && ev.fullEnd) {
      const start = new Date(ev.fullStart);
      const end = new Date(ev.fullEnd);
      const slotStart = hour;
      const slotEnd = hour + 1;
      const eventStartHour = start.getHours() + start.getMinutes() / 60;
      const eventEndHour = end.getHours() + end.getMinutes() / 60;
      // Event overlaps slot if: eventStart < slotEnd AND eventEnd > slotStart
      return eventStartHour < slotEnd && eventEndHour > slotStart;
    }
    // Fallback: check if event starts in this hour
    const startHour = parseInt(ev.startTime.split(':')[0]);
    return startHour === hour;
  };

  /* =========================
     UI Render
  ========================= */
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full p-6 overflow-hidden animate-fade-in-up relative">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[60] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl animate-fade-in-up transition-all ${
          toast.type === 'error' 
            ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' 
            : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <Check className="w-5 h-5" />}
          <span className="font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Add Event Modal */}
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

      {/* Detail Modal */}
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

      {/* Header & Toolbar */}
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
           
           <button onClick={() => handleGridClick(new Date())} className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-lg shadow-lg">
             <Plus className="w-4 h-4" /> Add
           </button>
        </div>
      </div>

      {/* Main Grid Area */}
      <div className="flex-1 bg-white dark:bg-slate-800/20 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-sm dark:shadow-none relative">
        
        {/* --- Month View --- */}
        {/* 🐞 Bug 1 Fix: Dynamic row count instead of fixed 5 rows */}
        {viewType === 'month' && (
            <div className="flex-1 grid grid-cols-7 grid-rows-[auto_1fr] overflow-y-auto custom-scrollbar">
                {DAYS.map(day => (
                    <div key={day} className="p-4 text-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                        <span className="text-xs font-semibold text-slate-500 uppercase">{day}</span>
                    </div>
                ))}
                <div 
                  className="grid grid-cols-7 col-span-7"
                  style={{ gridTemplateRows: `repeat(${getMonthRowCount(currentDate)}, 1fr)` }}
                >
                    {getMonthDays(currentDate).map((day, i) => {
                        const dayEvents = day ? events.filter(e =>
  e.date.getDate() === day.getDate() &&
  e.date.getMonth() === day.getMonth() &&
  e.date.getFullYear() === day.getFullYear()
) : [];
                        return (
                            <div 
                                key={i} 
                                onClick={() => day && handleGridClick(day)}
                                className={`border-r border-b border-slate-100 dark:border-slate-800/50 p-2 h-full min-h-[100px] hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer ${!day ? 'bg-slate-50/50 dark:bg-slate-900/50' : ''}`}
                            >
                                {day && (
                                    <>
                                        <span className={`text-sm font-medium ${day.getDate() === new Date().getDate() && day.getMonth() === new Date().getMonth() ? 'bg-sky-600 text-white w-7 h-7 flex items-center justify-center rounded-full' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {day.getDate()}
                                        </span>
                                        <div className="mt-2 space-y-1 max-h-[60px] overflow-y-auto custom-scrollbar">
                                            {dayEvents.map(ev => (
                                                <div 
                                                    key={ev.id} 
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

        {/* --- Week View --- */}
        {/* 🐞 Bug 3 Fix: Sticky header with separate scrollable body */}
        {viewType === 'week' && (
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* Sticky Header */}
                <div className="grid grid-cols-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex-shrink-0 sticky top-0 z-20">
                    <div className="p-4 border-r border-slate-200 dark:border-slate-800 w-20"></div> 
                    {getWeekDays(currentDate).map((day, i) => (
                        <div key={i} className={`p-4 text-center border-r border-slate-200 dark:border-slate-800 last:border-r-0 ${day.getDate() === new Date().getDate() && day.getMonth() === new Date().getMonth() ? 'bg-sky-50 dark:bg-indigo-900/20' : ''}`}>
                            <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">{DAYS[i]}</span>
                            <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${day.getDate() === new Date().getDate() && day.getMonth() === new Date().getMonth() ? 'bg-sky-600 dark:bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                                {day.getDate()}
                            </div>
                        </div>
                    ))}
                </div>
                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-8 relative" style={{ minHeight: `${HOURS.length * 80}px` }}>
                        {/* Time Column */}
                        <div className="border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 w-20 flex-shrink-0">
                            {HOURS.map(hour => (
                                <div key={hour} className="h-20 border-b border-slate-100 dark:border-slate-800/50 text-xs text-slate-400 dark:text-slate-500 p-2 text-right relative">
                                <span className="-top-3 relative block">{String(hour).padStart(2, '0')}:00</span>
                                </div>
                            ))}
                        </div>
                        {/* Day Columns */}
                        {getWeekDays(currentDate).map((day, colIdx) => {
                            const dayEvents = events.filter(e =>
  e.date.getDate() === day.getDate() &&
  e.date.getMonth() === day.getMonth() &&
  e.date.getFullYear() === day.getFullYear()
);
                            return (
                                <div key={colIdx} className="border-r border-slate-100 dark:border-slate-800/50 last:border-r-0 relative">
                                    {HOURS.map(hour => (
                                        <div 
                                            key={hour} 
                                            onClick={() => handleGridClick(day, hour)}
                                            className="h-20 border-b border-slate-100 dark:border-slate-800/50 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/20"
                                        ></div>
                                    ))}
                                    {/* 🐞 Bug 2 Fix: Use calculated position and height */}
                                    {dayEvents.map(ev => {
                                        const top = calculateEventPosition(ev);
                                        const height = calculateEventHeight(ev);
                                        // Only show events within visible hour range
                                        if (top < 0 || top > HOURS.length * 80) return null;
                                        return (
                                            <div 
                                                key={ev.id} 
                                                onClick={(e) => handleEventClick(e, ev)}
                                                className={`absolute left-1 right-1 p-2 rounded border-l-4 text-white text-xs cursor-pointer hover:brightness-110 transition-all shadow-md z-10 ${ev.color}`} 
                                                style={{ top: `${top}px`, height: `${height}px`, minHeight: '20px' }}
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
            </div>
        )}

        {/* --- Day View --- */}
        {/* 🐞 Bug 5 Fix: Use range-based event filtering */}
        {viewType === 'day' && (
             <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                 <div className="max-w-3xl mx-auto space-y-4">
                     {HOURS.map(hour => {
                         // Filter events for current day that overlap with this hour slot
                         const dayEvents = events.filter(e =>
                           e.date.getDate() === currentDate.getDate() &&
                           e.date.getMonth() === currentDate.getMonth() &&
                           e.date.getFullYear() === currentDate.getFullYear() &&
                           isEventInHourSlot(e, hour)
                         );
                         return (
                             <div key={hour} className="flex gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                                 <div className="w-16 text-right text-sm text-slate-400 pt-2">{String(hour).padStart(2, '0')}:00</div>
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
                                            className="border-b border-dashed border-slate-200 dark:border-slate-800/50 h-full w-full cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/20"
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

      {/* 🆕 Google Link Dialog */}
      <GoogleLinkDialog
        isOpen={showLinkDialog}
        onClose={handleCancelLink}
        onGoToSettings={handleGoToSettings}
        featureName={pendingFeature}
      />
    </div>
  );
};

export default CalendarView;