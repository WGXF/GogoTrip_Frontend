
import React, { useState } from 'react';
import { MOCK_SCHEDULER_ITEMS } from '../constants';
import { SchedulerItem } from '../types';
import { 
  Plus, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  NotebookPen, 
  Bot, 
  Utensils, 
  Plane, 
  StickyNote,
  Filter
} from 'lucide-react';

const SchedulerView: React.FC = () => {
  const [items, setItems] = useState<SchedulerItem[]>(MOCK_SCHEDULER_ITEMS);
  const [inputValue, setInputValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'note' | 'activity' | 'ai-suggestion'>('all');

  const addItem = () => {
    if (!inputValue.trim()) return;
    const newItem: SchedulerItem = {
      id: Date.now().toString(),
      content: inputValue,
      category: 'note', // Default category
      timestamp: new Date(),
      isCompleted: false,
      priority: 'medium'
    };
    setItems(prev => [newItem, ...prev]);
    setInputValue('');
  };

  const toggleComplete = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
    ));
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const getIcon = (category: string) => {
    switch (category) {
      case 'ai-suggestion': return <Bot className="w-4 h-4" />;
      case 'activity': return <Utensils className="w-4 h-4" />;
      case 'logistics': return <Plane className="w-4 h-4" />;
      default: return <StickyNote className="w-4 h-4" />;
    }
  };

  const filteredItems = selectedCategory === 'all' 
    ? items 
    : items.filter(i => i.category === selectedCategory);

  return (
    <div className="p-6 md:p-8 w-full mx-auto flex flex-col h-[calc(100vh-6rem)] animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
           <div className="flex items-center gap-3 mb-2">
             <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
               <NotebookPen className="w-6 h-6 text-amber-600 dark:text-amber-400" />
             </div>
             <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Trip Notebook</h2>
           </div>
           <p className="text-slate-500 dark:text-slate-400 font-medium">Capture ideas, AI suggestions, and tasks for your trip.</p>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex bg-white dark:bg-slate-800 rounded-xl p-1 shadow-sm border border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
          {(['all', 'note', 'activity', 'ai-suggestion'] as const).map((cat) => (
             <button
               key={cat}
               onClick={() => setSelectedCategory(cat)}
               className={`
                 px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all
                 ${selectedCategory === cat 
                   ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' 
                   : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700'
                 }
               `}
             >
               {cat === 'ai-suggestion' ? 'AI Tips' : cat}
             </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="relative mb-8 z-20 group">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-200 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition-opacity duration-500"></div>
        <div className="relative flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg p-2 transition-all focus-within:ring-4 focus-within:ring-amber-500/10 focus-within:border-amber-500/50 hover:border-amber-400 dark:hover:border-amber-400 hover:-translate-y-1 hover:shadow-xl duration-300 ease-out">
           <div className="pl-4 pr-3 text-slate-400">
             <Plus className="w-5 h-5" />
           </div>
           <input 
             type="text" 
             value={inputValue}
             onChange={(e) => setInputValue(e.target.value)}
             onKeyDown={(e) => e.key === 'Enter' && addItem()}
             placeholder="Add a note, restaurant idea, or reminder..."
             className="flex-1 bg-transparent border-none outline-none py-3 text-slate-900 dark:text-white placeholder-slate-400 font-medium"
           />
           <button 
             onClick={addItem}
             disabled={!inputValue.trim()}
             className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:-translate-y-0.5"
           >
             Add Note
           </button>
        </div>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar -mr-4 pr-4 space-y-4 pb-10">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center space-y-4 opacity-50">
            <NotebookPen className="w-12 h-12 text-slate-300 dark:text-slate-600" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">No items found. Start typing above!</p>
          </div>
        ) : (
          filteredItems.map((item, index) => (
            <div 
               key={item.id} 
               className="group flex items-start gap-4 p-5 bg-white/70 dark:bg-slate-800/40 backdrop-blur-md border border-white/60 dark:border-slate-700/50 rounded-2xl shadow-sm transition-all duration-300 animate-scale-in hover:border-amber-400 dark:hover:border-amber-500 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-xl"
               style={{ animationDelay: `${index * 50}ms` }}
            >
              <button 
                onClick={() => toggleComplete(item.id)}
                className={`mt-0.5 flex-shrink-0 transition-all hover:scale-110 ${item.isCompleted ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600 hover:text-emerald-500'}`}
              >
                {item.isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
              </button>
              
              <div className="flex-1 min-w-0">
                <p className={`text-base font-medium leading-relaxed transition-all duration-300 ${item.isCompleted ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-900 dark:text-white'}`}>
                  {item.content}
                </p>
                <div className="flex items-center gap-3 mt-2">
                   <span className={`
                     inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-transform group-hover:scale-105
                     ${item.category === 'ai-suggestion' 
                       ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
                       : item.category === 'activity'
                       ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                       : 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-400'
                     }
                   `}>
                     {getIcon(item.category)}
                     {item.category === 'ai-suggestion' ? 'AI Suggestion' : item.category}
                   </span>
                   <span className="text-xs text-slate-400 font-medium">
                      {item.timestamp.toLocaleDateString()}
                   </span>
                </div>
              </div>

              <button 
                onClick={() => deleteItem(item.id)}
                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-red-200 hover:scale-110"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SchedulerView;
