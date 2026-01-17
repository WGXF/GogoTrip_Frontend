import React, { useState, useEffect } from 'react';
import { 
  Calendar, MapPin, Clock, ChevronLeft, ChevronRight, 
  Utensils, Camera, Coffee, Hotel, ShoppingBag, Bus,
  X, Star, CheckCircle2, PlusCircle, Edit3, Wallet,
  Info, Navigation, Sun, Cloud, Sparkles, Save, Trash2,
  Wand2, Check, Square
} from 'lucide-react';
import { API_BASE_URL } from '../../config';

/**
 * Image URL resolver (Simplified)
 * 
 * ALL image logic is handled by backend proxy.py
 * Frontend just builds the URL - backend handles DB lookup, API fetch, fallback
 * Proxy endpoint NEVER returns 404 - always returns an image
 */
const getLocationImageUrl = (imageUrl?: string, placeId?: number | null, placeName?: string): string => {
  // Priority 1: Use our DB place_id
  if (placeId) {
    return `${API_BASE_URL}/proxy_image?place_id=${placeId}`;
  }
  
  // Priority 2: Search by name (fuzzy match in DB)
  if (placeName) {
    return `${API_BASE_URL}/proxy_image?name=${encodeURIComponent(placeName)}`;
  }
  
  // Priority 3: If imageUrl looks like a photo reference, proxy it
  if (imageUrl && !imageUrl.includes('unsplash.com')) {
    // Extract ref from various formats
    if (imageUrl.includes('photo_reference') || imageUrl.includes('AF1Qip') || imageUrl.includes('photos/')) {
      const ref = imageUrl.includes('photos/') ? imageUrl.split('photos/').pop() : imageUrl;
      if (ref) {
        return `${API_BASE_URL}/proxy_image?ref=${encodeURIComponent(ref)}`;
      }
    }
  }
  
  // Fallback: default image endpoint (backend always returns an image)
  return `${API_BASE_URL}/proxy_image/default`;
};

/* =========================
   Types
========================= */

interface TopLocation {
  place_id: number;
  name: string;
  image_url: string;
  highlight_reason: string;
}

interface Activity {
  time_slot: 'morning' | 'lunch' | 'afternoon' | 'evening' | 'night';
  start_time: string;
  end_time: string;
  place_id: number;
  place_name: string;
  place_address: string;
  activity_type: 'attraction' | 'food' | 'cafe' | 'hotel' | 'shopping' | 'transport';
  description: string;
  budget_estimate: string;
  tips?: string;
  dietary_info?: string;
}

interface DaySummary {
  total_activities: number;
  total_budget: string;
  transport_notes: string;
}

interface DayPlan {
  day_number: number;
  date: string;
  theme: string;
  top_locations: TopLocation[];
  activities: Activity[];
  day_summary: DaySummary;
}

interface DailyPlanData {
  type: 'daily_plan';
  title: string;
  description: string;
  duration: string;
  total_budget_estimate: string;
  tags: string[];
  cover_image: string;
  user_preferences_applied: {
    mood?: string;
    budget?: string;
    transport?: string;
    dietary?: string[];
  };
  days: DayPlan[];
  practical_info?: {
    best_transport?: string;
    weather_advisory?: string;
    booking_recommendations?: string[];
  };
}

interface DailyPlanViewProps {
  plan: DailyPlanData;
  onClose: () => void;
  onSave: (plan: DailyPlanData) => void;
  onEditActivity: (dayIndex: number, activityIndex: number, activity: Activity) => void;
}

/* =========================
   Helper Components
========================= */

const ActivityIcon: React.FC<{ type: string; className?: string }> = ({ type, className = "w-4 h-4" }) => {
  switch (type) {
    case 'food': return <Utensils className={className} />;
    case 'attraction': return <Camera className={className} />;
    case 'cafe': return <Coffee className={className} />;
    case 'hotel': return <Hotel className={className} />;
    case 'shopping': return <ShoppingBag className={className} />;
    case 'transport': return <Bus className={className} />;
    default: return <MapPin className={className} />;
  }
};

const TimeSlotBadge: React.FC<{ slot: string }> = ({ slot }) => {
  const colors: Record<string, string> = {
    morning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    lunch: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    afternoon: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
    evening: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    night: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
  };
  
  const labels: Record<string, string> = {
    morning: '上午',
    lunch: '午餐',
    afternoon: '下午',
    evening: '傍晚',
    night: '夜晚'
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${colors[slot] || colors.morning}`}>
      {labels[slot] || slot}
    </span>
  );
};

/* =========================
   Edit Activity Modal
========================= */

interface EditActivityModalProps {
  activity: Activity;
  onSave: (updated: Activity) => void;
  onCancel: () => void;
  onDelete: () => void;
}

const EditActivityModal: React.FC<EditActivityModalProps> = ({ activity, onSave, onCancel, onDelete }) => {
  const [form, setForm] = useState<Activity>({ ...activity });

  const TIME_SLOTS = [
    { value: 'morning', label: '上午 Morning' },
    { value: 'lunch', label: '午餐 Lunch' },
    { value: 'afternoon', label: '下午 Afternoon' },
    { value: 'evening', label: '傍晚 Evening' },
    { value: 'night', label: '夜晚 Night' }
  ];

  const ACTIVITY_TYPES = [
    { value: 'attraction', label: '景点 Attraction' },
    { value: 'food', label: '美食 Food' },
    { value: 'cafe', label: '咖啡厅 Cafe' },
    { value: 'hotel', label: '住宿 Hotel' },
    { value: 'shopping', label: '购物 Shopping' },
    { value: 'transport', label: '交通 Transport' }
  ];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">编辑活动</h3>
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Time Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">开始时间</label>
              <input
                type="time"
                value={form.start_time}
                onChange={e => setForm({ ...form, start_time: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">结束时间</label>
              <input
                type="time"
                value={form.end_time}
                onChange={e => setForm({ ...form, end_time: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>
          </div>

          {/* Time Slot & Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">时段</label>
              <select
                value={form.time_slot}
                onChange={e => setForm({ ...form, time_slot: e.target.value as Activity['time_slot'] })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none"
              >
                {TIME_SLOTS.map(ts => (
                  <option key={ts.value} value={ts.value}>{ts.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">类型</label>
              <select
                value={form.activity_type}
                onChange={e => setForm({ ...form, activity_type: e.target.value as Activity['activity_type'] })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none"
              >
                {ACTIVITY_TYPES.map(at => (
                  <option key={at.value} value={at.value}>{at.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Place Name */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">地点名称</label>
            <input
              type="text"
              value={form.place_name}
              onChange={e => setForm({ ...form, place_name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none"
              placeholder="输入地点名称"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">地址</label>
            <input
              type="text"
              value={form.place_address}
              onChange={e => setForm({ ...form, place_address: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none"
              placeholder="输入地址"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">描述</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none resize-none"
              placeholder="活动描述"
            />
          </div>

          {/* Budget & Tips */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">预算</label>
              <input
                type="text"
                value={form.budget_estimate}
                onChange={e => setForm({ ...form, budget_estimate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                placeholder="RM 50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">小贴士</label>
              <input
                type="text"
                value={form.tips || ''}
                onChange={e => setForm({ ...form, tips: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                placeholder="可选"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={onDelete}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-sm font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            删除
          </button>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm font-medium transition-colors"
            >
              取消
            </button>
            <button
              onClick={() => onSave(form)}
              className="flex items-center gap-2 px-5 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-bold transition-colors"
            >
              <Save className="w-4 h-4" />
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================
   AI Edit Modal
========================= */

interface AIEditModalProps {
  selectedCount: number;
  onSubmit: (instructions: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const AIEditModal: React.FC<AIEditModalProps> = ({ selectedCount, onSubmit, onCancel, isLoading }) => {
  const [instructions, setInstructions] = useState('');

  const suggestions = [
    '把时间都提前1小时',
    '替换成更适合素食者的餐厅',
    '增加预算估算的详细说明',
    '改成更经济实惠的选项',
    '添加更多当地特色体验',
    '调整为更适合带小孩的活动'
  ];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI 批量编辑</h3>
              <p className="text-xs text-slate-500">已选择 {selectedCount} 个活动</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              告诉 AI 你想怎么修改这些活动：
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="例如：把这些活动的时间都推迟2小时，并且增加更详细的描述..."
              rows={4}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
              disabled={isLoading}
            />
          </div>

          {/* Quick suggestions */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase mb-2">快捷建议</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => setInstructions(sug)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  disabled={isLoading}
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm font-medium transition-colors"
            disabled={isLoading}
          >
            取消
          </button>
          <button
            onClick={() => onSubmit(instructions)}
            disabled={!instructions.trim() || isLoading}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                处理中...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                开始修改
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================
   Main Component
========================= */

export const DailyPlanView: React.FC<DailyPlanViewProps> = ({ plan: initialPlan, onClose, onSave, onEditActivity }) => {
  // Local state for the plan (allows editing)
  const [plan, setPlan] = useState<DailyPlanData>(initialPlan);
  const [selectedDay, setSelectedDay] = useState(0);
  const [editingActivity, setEditingActivity] = useState<{ dayIdx: number; actIdx: number; activity: Activity } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  // AI Edit selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set()); // key: "dayIdx-actIdx"
  const [aiEditModalOpen, setAiEditModalOpen] = useState(false);
  const [aiEditLoading, setAiEditLoading] = useState(false);
  
  const currentDay = plan.days[selectedDay];
  
  const handlePrevDay = () => setSelectedDay(prev => Math.max(0, prev - 1));
  const handleNextDay = () => setSelectedDay(prev => Math.min(plan.days.length - 1, prev + 1));

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Proxy endpoint should never fail, but handle network errors gracefully
    // Use the default image endpoint as ultimate fallback
    e.currentTarget.src = `${API_BASE_URL}/proxy_image/default`;
  };

  // Edit handlers
  const handleEditClick = (dayIdx: number, actIdx: number, activity: Activity) => {
    setEditingActivity({ dayIdx, actIdx, activity });
  };

  const handleEditSave = (updated: Activity) => {
    if (!editingActivity) return;
    
    const newPlan = { ...plan };
    newPlan.days = [...plan.days];
    newPlan.days[editingActivity.dayIdx] = { ...plan.days[editingActivity.dayIdx] };
    newPlan.days[editingActivity.dayIdx].activities = [...plan.days[editingActivity.dayIdx].activities];
    newPlan.days[editingActivity.dayIdx].activities[editingActivity.actIdx] = updated;
    
    // Update day summary
    newPlan.days[editingActivity.dayIdx].day_summary = {
      ...newPlan.days[editingActivity.dayIdx].day_summary,
      total_activities: newPlan.days[editingActivity.dayIdx].activities.length
    };
    
    setPlan(newPlan);
    setHasChanges(true);
    setEditingActivity(null);
    
    // Also notify parent
    onEditActivity(editingActivity.dayIdx, editingActivity.actIdx, updated);
  };

  const handleEditDelete = () => {
    if (!editingActivity) return;
    
    const newPlan = { ...plan };
    newPlan.days = [...plan.days];
    newPlan.days[editingActivity.dayIdx] = { ...plan.days[editingActivity.dayIdx] };
    newPlan.days[editingActivity.dayIdx].activities = plan.days[editingActivity.dayIdx].activities.filter(
      (_, idx) => idx !== editingActivity.actIdx
    );
    
    // Update day summary
    newPlan.days[editingActivity.dayIdx].day_summary = {
      ...newPlan.days[editingActivity.dayIdx].day_summary,
      total_activities: newPlan.days[editingActivity.dayIdx].activities.length
    };
    
    setPlan(newPlan);
    setHasChanges(true);
    setEditingActivity(null);
  };

  const handleEditCancel = () => {
    setEditingActivity(null);
  };

  // AI Edit selection handlers
  const toggleSelectionMode = () => {
    if (selectionMode) {
      // Exiting selection mode - clear selections
      setSelectedActivities(new Set());
    }
    setSelectionMode(!selectionMode);
  };

  const toggleActivitySelection = (dayIdx: number, actIdx: number) => {
    const key = `${dayIdx}-${actIdx}`;
    const newSelection = new Set(selectedActivities);
    if (newSelection.has(key)) {
      newSelection.delete(key);
    } else {
      newSelection.add(key);
    }
    setSelectedActivities(newSelection);
  };

  const isActivitySelected = (dayIdx: number, actIdx: number): boolean => {
    return selectedActivities.has(`${dayIdx}-${actIdx}`);
  };

  const getSelectedActivitiesData = (): { dayIdx: number; actIdx: number; activity: Activity }[] => {
    const result: { dayIdx: number; actIdx: number; activity: Activity }[] = [];
    selectedActivities.forEach(key => {
      const [dayStr, actStr] = key.split('-');
      const dayIdx = parseInt(dayStr);
      const actIdx = parseInt(actStr);
      if (plan.days[dayIdx] && plan.days[dayIdx].activities[actIdx]) {
        result.push({
          dayIdx,
          actIdx,
          activity: plan.days[dayIdx].activities[actIdx]
        });
      }
    });
    return result;
  };

  const handleAiEditSubmit = async (instructions: string) => {
    const selected = getSelectedActivitiesData();
    if (selected.length === 0) return;

    setAiEditLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/edit-activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          activities: selected.map(s => ({
            day_index: s.dayIdx,
            activity_index: s.actIdx,
            activity: s.activity
          })),
          instructions,
          plan_context: {
            title: plan.title,
            destination: plan.title, // Approximate from title
            preferences: plan.user_preferences_applied
          }
        })
      });

      if (!response.ok) {
        throw new Error('AI edit request failed');
      }

      const data = await response.json();
      
      if (data.success && data.updated_activities) {
        // Apply updates to plan
        const newPlan = { ...plan };
        newPlan.days = plan.days.map((day, dIdx) => ({
          ...day,
          activities: day.activities.map((act, aIdx) => {
            // Find if this activity was updated
            const updated = data.updated_activities.find(
              (u: { day_index: number; activity_index: number; activity: Activity }) => 
                u.day_index === dIdx && u.activity_index === aIdx
            );
            return updated ? updated.activity : act;
          })
        }));
        
        setPlan(newPlan);
        setHasChanges(true);
        
        // Clear selection mode
        setSelectionMode(false);
        setSelectedActivities(new Set());
      }
    } catch (error) {
      console.error('AI Edit failed:', error);
      alert('AI 编辑失败，请重试');
    } finally {
      setAiEditLoading(false);
      setAiEditModalOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-white dark:bg-slate-900 flex flex-col overflow-hidden animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">{plan.title}</h1>
              <p className="text-xs text-slate-500 flex items-center gap-2">
                <span>{plan.duration}</span>
                <span>•</span>
                <span>{plan.total_budget_estimate}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* AI Edit Toggle Button */}
            <button
              onClick={toggleSelectionMode}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                selectionMode
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400'
              }`}
            >
              <Wand2 className="w-4 h-4" />
              {selectionMode ? '取消选择' : 'AI 编辑'}
            </button>
            
            {/* Show "Edit Selected" when items are selected */}
            {selectionMode && selectedActivities.size > 0 && (
              <button
                onClick={() => setAiEditModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-500/20 hover:from-purple-600 hover:to-pink-600 transition-all animate-in slide-in-from-right-2"
              >
                <Sparkles className="w-4 h-4" />
                修改 {selectedActivities.size} 项
              </button>
            )}

            <button 
              onClick={() => onSave(plan)}
              className={`flex items-center gap-2 px-5 py-2.5 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 ${
                hasChanges 
                  ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' 
                  : 'bg-sky-500 hover:bg-sky-600 shadow-sky-500/20'
              }`}
            >
              {hasChanges ? <Save className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
              {hasChanges ? '保存更改' : '保存行程'}
            </button>
          </div>
        </div>
      </div>

      {/* Day Selector */}
      <div className="shrink-0 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrevDay}
              disabled={selectedDay === 0}
              className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex-1 flex gap-2 overflow-x-auto py-1 [&::-webkit-scrollbar]:hidden">
              {plan.days.map((day, idx) => (
                <button
                  key={day.day_number}
                  onClick={() => setSelectedDay(idx)}
                  className={`shrink-0 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                    selectedDay === idx 
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20' 
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-sky-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className="font-bold">Day {day.day_number}</span>
                    <span className="text-[10px] opacity-75">{day.theme}</span>
                  </div>
                </button>
              ))}
            </div>
            
            <button 
              onClick={handleNextDay}
              disabled={selectedDay === plan.days.length - 1}
              className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
          
          {/* Top Locations (Images) */}
          {currentDay.top_locations && currentDay.top_locations.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> 今日亮点
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentDay.top_locations.map((loc, idx) => (
                  <div 
                    key={idx}
                    className="relative h-48 rounded-2xl overflow-hidden group cursor-pointer shadow-lg"
                  >
                    <img 
                      src={getLocationImageUrl(loc.image_url, loc.place_id, loc.name)}
                      onError={handleImageError}
                      alt={loc.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-bold text-lg mb-1">{loc.name}</h3>
                      <p className="text-white/80 text-xs">{loc.highlight_reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Day Summary */}
          <section className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-100 dark:bg-sky-900/30 rounded-lg">
                  <Calendar className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">活动数量</p>
                  <p className="font-bold text-slate-900 dark:text-white">{currentDay.day_summary.total_activities} 项</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">预计花费</p>
                  <p className="font-bold text-slate-900 dark:text-white">{currentDay.day_summary.total_budget}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <Bus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">交通建议</p>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{currentDay.day_summary.transport_notes}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Itinerary List */}
          <section>
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" /> 详细行程
            </h2>
            
            <div className="space-y-4">
              {currentDay.activities.map((activity, actIdx) => (
                <div 
                  key={actIdx}
                  className="relative pl-8 group"
                >
                  {/* Timeline Line */}
                  {actIdx < currentDay.activities.length - 1 && (
                    <div className="absolute left-[11px] top-10 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
                  )}
                  
                  {/* Timeline Dot */}
                  <div className={`absolute left-0 top-2 w-6 h-6 rounded-full flex items-center justify-center shadow-md ${
                    activity.activity_type === 'food' ? 'bg-orange-500' :
                    activity.activity_type === 'attraction' ? 'bg-sky-500' :
                    activity.activity_type === 'cafe' ? 'bg-amber-500' :
                    'bg-slate-500'
                  }`}>
                    <ActivityIcon type={activity.activity_type} className="w-3 h-3 text-white" />
                  </div>
                  
                  {/* Activity Card */}
                  <div 
                    className={`bg-white dark:bg-slate-800 rounded-2xl border p-5 shadow-sm hover:shadow-lg transition-all cursor-pointer ${
                      selectionMode && isActivitySelected(selectedDay, actIdx)
                        ? 'border-purple-400 dark:border-purple-500 ring-2 ring-purple-400/30'
                        : 'border-slate-100 dark:border-slate-700'
                    }`}
                    onClick={() => selectionMode && toggleActivitySelection(selectedDay, actIdx)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {/* Selection checkbox */}
                        {selectionMode && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleActivitySelection(selectedDay, actIdx);
                            }}
                            className={`p-1 rounded-md transition-all ${
                              isActivitySelected(selectedDay, actIdx)
                                ? 'bg-purple-500 text-white'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                            }`}
                          >
                            {isActivitySelected(selectedDay, actIdx) ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        <TimeSlotBadge slot={activity.time_slot} />
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {activity.start_time} - {activity.end_time}
                        </span>
                      </div>
                      {!selectionMode && (
                        <button 
                          onClick={() => handleEditClick(selectedDay, actIdx, activity)}
                          className="p-1.5 text-slate-300 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/30 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                      {activity.place_name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-3">
                      <MapPin className="w-3 h-3" />
                      {activity.place_address}
                    </p>
                    
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                      {activity.description}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg font-bold">
                        {activity.budget_estimate}
                      </span>
                      {activity.dietary_info && (
                        <span className="px-2 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 rounded-lg font-medium">
                          {activity.dietary_info}
                        </span>
                      )}
                      {activity.tips && (
                        <span className="text-slate-400 flex items-center gap-1">
                          <Info className="w-3 h-3" /> {activity.tips}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Practical Info */}
          {plan.practical_info && (
            <section className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-5 border border-amber-100 dark:border-amber-800/30">
              <h2 className="text-sm font-bold text-amber-800 dark:text-amber-400 mb-3 flex items-center gap-2">
                <Info className="w-4 h-4" /> 实用信息
              </h2>
              <div className="space-y-2 text-sm text-amber-700 dark:text-amber-300">
                {plan.practical_info.best_transport && (
                  <p><strong>交通:</strong> {plan.practical_info.best_transport}</p>
                )}
                {plan.practical_info.weather_advisory && (
                  <p><strong>天气:</strong> {plan.practical_info.weather_advisory}</p>
                )}
                {plan.practical_info.booking_recommendations && plan.practical_info.booking_recommendations.length > 0 && (
                  <div>
                    <strong>预订建议:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {plan.practical_info.booking_recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

        </div>
      </div>

      {/* Edit Activity Modal */}
      {editingActivity && (
        <EditActivityModal
          activity={editingActivity.activity}
          onSave={handleEditSave}
          onCancel={handleEditCancel}
          onDelete={handleEditDelete}
        />
      )}

      {/* AI Edit Modal */}
      {aiEditModalOpen && (
        <AIEditModal
          selectedCount={selectedActivities.size}
          onSubmit={handleAiEditSubmit}
          onCancel={() => setAiEditModalOpen(false)}
          isLoading={aiEditLoading}
        />
      )}
    </div>
  );
};

export default DailyPlanView;
