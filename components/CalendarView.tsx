
import React from 'react';
import { ChevronLeft, ChevronRight, Plus, RefreshCw, Calendar as CalendarIcon } from 'lucide-react';

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 8 AM to 6 PM
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const CalendarView: React.FC = () => {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full p-6 overflow-hidden">
      {/* Calendar Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">October 2023</h2>
          <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
            <button className="p-1 hover:bg-slate-50 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button className="p-1 hover:bg-slate-50 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
           <button className="flex items-center gap-2 px-3 py-2 bg-white text-slate-700 dark:text-slate-900 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors border border-slate-200 shadow-sm">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 12.0001C22 17.5229 17.5228 22.0001 12 22.0001C6.47715 22.0001 2 17.5229 2 12.0001C2 6.47726 6.47715 2.00011 12 2.00011C17.5228 2.00011 22 6.47726 22 12.0001Z" fill="#fff" />
              <path d="M12.0002 6.54541V17.4545" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6.54565 12H17.4547" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16.9999 12.0001C16.9999 14.7615 14.7613 17.0001 11.9999 17.0001C9.23847 17.0001 6.99989 14.7615 6.99989 12.0001C6.99989 9.23869 9.23847 7.00011 11.9999 7.00011C14.7613 7.00011 16.9999 9.23869 16.9999 12.0001Z" fill="#34A853"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M12.0001 22.0001C17.5229 22.0001 22.0001 17.5229 22.0001 12.0001C22.0001 6.47726 17.5229 2.00011 12.0001 2.00011C6.47726 2.00011 2.00011 6.47726 2.00011 12.0001C2.00011 17.5229 6.47726 22.0001 12.0001 22.0001ZM12.0001 15.6365C14.0084 15.6365 15.6365 14.0084 15.6365 12.0001C15.6365 9.99182 14.0084 8.36375 12.0001 8.36375C9.99182 8.36375 8.36375 9.99182 8.36375 12.0001C8.36375 14.0084 9.99182 15.6365 12.0001 15.6365Z" fill="#4285F4"/>
            </svg>
            Sync Google Calendar
          </button>
          
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 hidden md:block"></div>

          <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
            <button className="px-3 py-1.5 text-sm font-medium rounded text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700">Month</button>
            <button className="px-3 py-1.5 text-sm font-medium rounded bg-sky-600 dark:bg-indigo-600 text-white shadow-sm">Week</button>
            <button className="px-3 py-1.5 text-sm font-medium rounded text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700">Day</button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-sky-600/20 dark:shadow-indigo-600/20">
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 bg-white dark:bg-slate-800/20 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-sm dark:shadow-none">
        {/* Header Row */}
        <div className="grid grid-cols-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="p-4 border-r border-slate-200 dark:border-slate-800 w-20"></div> {/* Time col */}
          {DAYS.map((day, i) => (
            <div key={day} className="p-4 text-center border-r border-slate-200 dark:border-slate-800 last:border-r-0">
              <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">{day}</span>
              <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                i === 2 
                ? 'bg-sky-600 dark:bg-indigo-600 text-white' 
                : 'text-slate-700 dark:text-slate-300'
              }`}>
                {23 + i}
              </div>
            </div>
          ))}
        </div>

        {/* Scrollable Grid Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-6 relative">
             {/* Time Column */}
             <div className="border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 w-20 flex-shrink-0">
               {HOURS.map(hour => (
                 <div key={hour} className="h-20 border-b border-slate-100 dark:border-slate-800/50 text-xs text-slate-400 dark:text-slate-500 p-2 text-right relative">
                   <span className="-top-3 relative block">{hour}:00</span>
                 </div>
               ))}
             </div>

             {/* Days Columns */}
             {DAYS.map((day, dayIndex) => (
               <div key={day} className="border-r border-slate-100 dark:border-slate-800/50 last:border-r-0 relative">
                 {/* Grid Lines */}
                 {HOURS.map(hour => (
                   <div key={hour} className="h-20 border-b border-slate-100 dark:border-slate-800/50"></div>
                 ))}

                 {/* Mock Events (Travel Context) */}
                 {dayIndex === 1 && (
                   <div className="absolute top-20 left-1 right-1 h-32 bg-sky-100 dark:bg-indigo-600/20 border-l-4 border-sky-500 dark:border-indigo-500 rounded p-2 cursor-pointer hover:bg-sky-200 dark:hover:bg-indigo-600/30 transition-colors group">
                     <div className="flex items-center gap-1 mb-1">
                       <p className="text-xs font-semibold text-sky-700 dark:text-indigo-300">Flight JL405</p>
                       <RefreshCw className="w-3 h-3 text-sky-500 dark:text-indigo-400 opacity-50" />
                     </div>
                     <p className="text-[10px] text-sky-600 dark:text-indigo-400">9:00 - 10:30 AM</p>
                   </div>
                 )}
                 {dayIndex === 2 && (
                    <div className="absolute top-60 left-1 right-1 h-20 bg-emerald-100 dark:bg-emerald-600/20 border-l-4 border-emerald-500 rounded p-2 cursor-pointer hover:bg-emerald-200 dark:hover:bg-emerald-600/30 transition-colors">
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Kyoto Tour</p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400">11:00 AM</p>
                    </div>
                 )}
               </div>
             ))}
             
             {/* Current Time Indicator (Visual Mock) */}
             <div className="absolute left-20 right-0 top-[190px] h-px bg-red-500 pointer-events-none flex items-center z-10">
               <div className="w-2 h-2 rounded-full bg-red-500 -ml-1"></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
