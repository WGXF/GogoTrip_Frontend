import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Send, Paperclip, Mic, Bot, Map, PlusCircle, CheckCircle2, RotateCcw, 
  AlertTriangle, ArrowDown, ChevronLeft, ChevronRight, Info, Calendar, 
  X, Pencil, MapPin, Clock, MessageSquare, Star, AlertCircle,
  History, Crown, Trash2, Loader2, Plus, MoreHorizontal, Archive,
  Menu, PanelLeftClose, PanelLeft, Sparkles, Utensils, Share2, Copy, Check, Link
} from 'lucide-react';
import { Message, TripSuggestion, User } from '../../types';
import { API_BASE_URL } from '../../config';
import { ChatAdvertisementPopup } from './ChatAdvertisementPopup';
import { getCurrentLanguage } from '../../i18n';
import { useTranslation } from 'react-i18next';
import { PlanWizard, TripPreferences } from './PlanWizard';
import { FoodWizard, FoodPreferences } from './FoodWizard';
import { FoodRecommendationList, FoodPlace } from './FoodRecommendationCard';
import { DailyPlanView } from './DailyPlanView';

/* =========================
   Types
========================= */
interface Conversation {
  id: number;
  title: string;
  updatedAt: string;
  preview?: string;
  messageCount?: number;
}

interface ConversationMessage {
  id: number;
  role: 'user' | 'ai';
  content: string;
  createdAt: string;
  suggestions?: any[];
  dailyPlans?: DailyPlanData[];
}

/* Daily Plan Types */
interface DailyPlanData {
  type: 'daily_plan';
  title: string;
  description: string;
  duration: string;
  total_budget_estimate: string;
  tags: string[];
  cover_image: string;
  user_preferences_applied?: {
    mood?: string;
    budget?: string;
    transport?: string;
    dietary?: string[];
  };
  days: any[];
  practical_info?: any;
}

/* =========================
   Constants
========================= */
// Moved inside component for i18n


/* =========================
   Sub-Components
========================= */

interface SuggestionDetailModalProps {
  suggestion: TripSuggestion;
  onClose: () => void;
  onSave: (suggestion: TripSuggestion) => void;
  onUpdate: (updatedSuggestion: TripSuggestion) => void;
  isSaved: boolean;
}

const SuggestionDetailModal: React.FC<SuggestionDetailModalProps> = ({ suggestion, onClose, onSave, onUpdate, isSaved }) => {
  const { t } = useTranslation('chat');
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>(null);

  const handleEditStart = (index: number, item: any) => {
    setEditingItemIndex(index);
    setEditForm({ ...item });
  };

  const handleEditSave = () => {
    if (editingItemIndex !== null && suggestion.itinerary) {
      const newItinerary = [...suggestion.itinerary];
      newItinerary[editingItemIndex] = editForm;
      onUpdate({ ...suggestion, itinerary: newItinerary });
      setEditingItemIndex(null);
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Use proxy default endpoint - never fails
    e.currentTarget.src = `${API_BASE_URL}/proxy_image/default`;
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700/50 relative flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header Image */}
        <div className="relative h-48 sm:h-64 shrink-0 group">
          <img 
            src={suggestion.imageUrl} 
            onError={handleImageError}
            alt={suggestion.title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2 drop-shadow-md">{suggestion.title}</h3>
            <div className="flex flex-wrap gap-2">
              {suggestion.tags.map(tag => (
                <span key={tag} className="px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider border border-white/10">
                  {tag}
                </span>
              ))}
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/80 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1 border border-white/10">
                <span className="opacity-75">Est.</span> {suggestion.priceEstimate}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 custom-scrollbar bg-white dark:bg-slate-900">
          
          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Info className="w-3 h-3" /> About
            </h4>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm sm:text-base bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              {suggestion.description}
            </p>
          </div>

          {/* Itinerary (if exists) */}
          {suggestion.itinerary && Array.isArray(suggestion.itinerary) && suggestion.itinerary.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Calendar className="w-3 h-3" /> Itinerary
              </h4>
              <div className="space-y-4">
                {suggestion.itinerary.map((item: any, idx: number) => (
                  <div key={idx} className="relative pl-6 pb-2 border-l-2 border-slate-100 dark:border-slate-800 last:border-0 group/item">
                    <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-sky-500 ring-4 ring-white dark:ring-slate-900" />
                    
                    {editingItemIndex === idx ? (
                      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border-2 border-sky-500 shadow-md shadow-sky-200/50 dark:shadow-sky-900/50 space-y-3">
                        <div className="flex gap-2">
                           <input 
                             value={editForm.day_number}
                             onChange={e => setEditForm({...editForm, day_number: e.target.value})}
                             className="w-16 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 text-xs font-bold"
                             placeholder="Day"
                           />
                           <input 
                             value={editForm.start_time}
                             onChange={e => setEditForm({...editForm, start_time: e.target.value})}
                             className="w-20 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 text-xs font-bold"
                             placeholder="Time"
                           />
                        </div>
                        <input 
                           value={editForm.custom_title || editForm.place?.name}
                           onChange={e => setEditForm({...editForm, custom_title: e.target.value})}
                           className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm font-bold"
                           placeholder="Activity Title"
                        />
                        <textarea 
                           value={editForm.custom_notes}
                           onChange={e => setEditForm({...editForm, custom_notes: e.target.value})}
                           className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm"
                           placeholder="Notes"
                           rows={2}
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button onClick={() => setEditingItemIndex(null)} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                          <button onClick={handleEditSave} className="px-3 py-1.5 text-xs font-bold bg-sky-500 text-white rounded-lg hover:bg-sky-600">Save Changes</button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700 hover:border-sky-200 dark:hover:border-sky-900 transition-all hover:shadow-md group relative">
                        <button 
                          onClick={() => handleEditStart(idx, item)}
                          className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/30 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <div className="flex items-start justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 px-2 py-0.5 rounded uppercase tracking-wider">
                            Day {item.day_number} • {item.start_time}
                          </span>
                        </div>
                        <p className="font-bold text-slate-900 dark:text-white mb-1 text-sm">{item.custom_title || item.place?.name || 'Activity'}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{item.custom_notes || item.place?.address}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews (if exists) */}
          {suggestion.reviews && suggestion.reviews.length > 0 && (
            <div>
               <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <Star className="w-3 h-3" /> Reviews
               </h4>
               <div className="space-y-3">
                 {suggestion.reviews.slice(0, 3).map((review: any, i: number) => (
                   <div key={i} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-sm border border-slate-100 dark:border-slate-700">
                     <div className="flex items-center gap-1.5 mb-2">
                       <div className="flex text-amber-400">
                         {[...Array(5)].map((_, stars) => (
                           <Star key={stars} className={`w-3 h-3 ${stars < Math.round(review.rating) ? 'fill-current' : 'opacity-30'}`} />
                         ))}
                       </div>
                       <span className="font-bold text-xs text-slate-700 dark:text-slate-300">{review.rating}</span>
                     </div>
                     <p className="text-slate-600 dark:text-slate-400 italic text-xs leading-relaxed">"{review.text}"</p>
                   </div>
                 ))}
               </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-3">
          <button
             onClick={onClose}
             className="px-6 py-3.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            {t('modals.close')}
          </button>
          <button
            onClick={() => onSave(suggestion)}
            className={`flex-1 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98] ${
              isSaved
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-sky-500/25'
            }`}
          >
            {isSaved ? <CheckCircle2 className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
            {isSaved ? t('modals.tripSaved') : t('modals.saveTrip')}
          </button>
        </div>
      </div>
    </div>
  );
};

interface SuggestionCardProps {
  suggestion: TripSuggestion;
  isSaved: boolean;
  onViewDetails: (suggestion: TripSuggestion) => void;
  onToggleSave: (suggestion: TripSuggestion) => void;
}

const SuggestionCard: React.FC<SuggestionCardProps> = React.memo(({ suggestion, isSaved, onViewDetails, onToggleSave }) => {
  return (
    <div className="w-full md:w-auto md:min-w-[280px] md:max-w-[320px] bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 rounded-2xl isolate transform-gpu flex-shrink-0 snap-start transition-all duration-300 ease-out cursor-pointer group hover:scale-105">
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
            <span key={tag} className="text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 px-2.5 py-1 rounded-lg uppercase tracking-wider">{tag}</span>
          ))}
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700/50">
           <div>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Est. Cost</p>
             <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{suggestion.priceEstimate}</p>
           </div>
           <div className="flex gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); onViewDetails(suggestion); }}
                className="p-2 rounded-xl text-slate-400 hover:text-sky-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                title="View Details"
              >
                <Info className="w-4 h-4" />
              </button>
              <button 
                  onClick={(e) => { e.stopPropagation(); onToggleSave(suggestion); }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isSaved ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-sky-600 hover:bg-sky-500 dark:bg-indigo-600 text-white'
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
});

interface SuggestionListProps {
  suggestions: TripSuggestion[];
  savedSuggestions: string[];
  onViewDetails: (suggestion: TripSuggestion) => void;
  onToggleSave: (suggestion: TripSuggestion) => void;
}

const SuggestionList: React.FC<SuggestionListProps> = ({ suggestions, savedSuggestions, onViewDetails, onToggleSave }) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const handleScroll = () => {
      if (listRef.current) {
          const scrollLeft = listRef.current.scrollLeft;
          const itemWidth = listRef.current.firstElementChild?.clientWidth || 300;
          setActiveIdx(Math.round(scrollLeft / itemWidth));
      }
  }

  const scrollLeft = () => listRef.current?.scrollBy({ left: -340, behavior: 'smooth' });
  const scrollRight = () => listRef.current?.scrollBy({ left: 340, behavior: 'smooth' });

  return (
    <div className="relative group/list">
      <div className="hidden md:block opacity-0 group-hover/list:opacity-100 transition-opacity">
         <button onClick={scrollLeft} className="absolute left-0 top-1/2 -translate-y-1/2 -ml-5 z-20 p-2 bg-white dark:bg-slate-800 rounded-full shadow-md shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700/50">
            <ChevronLeft className="w-5 h-5" />
         </button>
         <button onClick={scrollRight} className="absolute right-0 top-1/2 -translate-y-1/2 -mr-1 z-20 p-2 bg-white dark:bg-slate-800 rounded-full shadow-md shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700/50">
            <ChevronRight className="w-5 h-5" />
         </button>
      </div>
      <div ref={listRef} onScroll={handleScroll} className="flex flex-row gap-4 overflow-x-auto pb-4 pl-1 [&::-webkit-scrollbar]:hidden scroll-smooth snap-x">
          {suggestions.map(suggestion => (
              <SuggestionCard 
                key={suggestion.id} 
                suggestion={suggestion} 
                isSaved={savedSuggestions.includes(suggestion.id)}
                onViewDetails={onViewDetails}
                onToggleSave={onToggleSave}
              />
          ))}
      </div>
      <div className="flex justify-center gap-1.5 mt-2">
          {suggestions.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === activeIdx ? 'w-6 bg-sky-500' : 'w-1.5 bg-slate-200 dark:bg-slate-700'}`} />
          ))}
      </div>
    </div>
  );
};

/* =========================
   Daily Plan Card (for chat display)
========================= */

interface DailyPlanCardProps {
  plan: DailyPlanData;
  onViewDetails: (plan: DailyPlanData) => void;
  onSave: (plan: DailyPlanData) => void;
  isSaved: boolean;
}

const DailyPlanCard: React.FC<DailyPlanCardProps> = React.memo(({ plan, onViewDetails, onSave, isSaved }) => {
  const { t } = useTranslation('chat');
  /**
   * Get cover image - ALL logic handled by backend proxy
   * Proxy never returns 404, always returns an image
   */
  const getCoverImage = (): string => {
    // Priority 1: Use first top_location with place_id
    const firstDayTopLoc = plan.days?.[0]?.top_locations?.[0];
    if (firstDayTopLoc?.place_id) {
      return `${API_BASE_URL}/proxy_image?place_id=${firstDayTopLoc.place_id}`;
    }
    
    // Priority 2: Search by destination/title name
    if (firstDayTopLoc?.name) {
      return `${API_BASE_URL}/proxy_image?name=${encodeURIComponent(firstDayTopLoc.name)}`;
    }
    
    // Fallback: default image endpoint
    return `${API_BASE_URL}/proxy_image/default`;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Proxy should never fail, but handle network errors
    e.currentTarget.src = `${API_BASE_URL}/proxy_image/default`;
  };

  const totalActivities = plan.days.reduce((sum, day) => sum + (day.activities?.length || 0), 0);

  return (
    <div className="w-full md:w-auto md:min-w-[320px] md:max-w-[380px] bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-100 dark:border-slate-700/50 rounded-3xl isolate transform-gpu flex-shrink-0 snap-start transition-all duration-300 ease-out cursor-pointer group hover:scale-[1.02] hover:shadow-xl hover:shadow-slate-300/50 dark:hover:shadow-slate-800/50 shadow-md shadow-slate-200/50 dark:shadow-slate-900/50">
      {/* Cover Image */}
      <div className="h-40 overflow-hidden relative rounded-t-2xl">
        <img 
          src={getCoverImage()} 
          onError={handleImageError}
          alt={plan.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        
        {/* Duration Badge */}
        <div className="absolute top-3 left-3 px-3 py-1 bg-sky-500/90 backdrop-blur-sm rounded-full text-white text-xs font-bold flex items-center gap-1.5">
          <Calendar className="w-3 h-3" />
          {plan.duration}
        </div>
        
        {/* Title */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h4 className="text-white font-bold text-lg leading-tight tracking-tight drop-shadow-md">{plan.title}</h4>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Description */}
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">{plan.description}</p>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {plan.tags.slice(0, 4).map(tag => (
            <span key={tag} className="text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 px-2.5 py-1 rounded-lg uppercase tracking-wider">{tag}</span>
          ))}
        </div>
        
        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {t('dailyPlan.days', { count: plan.days.length })}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {t('dailyPlan.activities', { count: totalActivities })}
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700/50">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('dailyPlan.estimatedSpend')}</p>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{plan.total_budget_estimate}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onViewDetails(plan); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 dark:bg-indigo-600 text-white transition-all"
            >
              <Info className="w-3.5 h-3.5" />
              {t('dailyPlan.viewDetails')}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onSave(plan); }}
              className={`p-2 rounded-xl transition-all ${
                isSaved 
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-sky-600'
              }`}
            >
              {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

interface DailyPlanListProps {
  plans: DailyPlanData[];
  savedPlans: string[];
  onViewDetails: (plan: DailyPlanData) => void;
  onSave: (plan: DailyPlanData) => void;
}

const DailyPlanList: React.FC<DailyPlanListProps> = ({ plans, savedPlans, onViewDetails, onSave }) => {
  const listRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => listRef.current?.scrollBy({ left: -380, behavior: 'smooth' });
  const scrollRight = () => listRef.current?.scrollBy({ left: 380, behavior: 'smooth' });

  return (
    <div className="relative group/list">
      {plans.length > 1 && (
        <div className="hidden md:block opacity-0 group-hover/list:opacity-100 transition-opacity">
          <button onClick={scrollLeft} className="absolute left-0 top-1/2 -translate-y-1/2 -ml-5 z-20 p-2 bg-white dark:bg-slate-800 rounded-full shadow-md shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700/50">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={scrollRight} className="absolute right-0 top-1/2 -translate-y-1/2 -mr-1 z-20 p-2 bg-white dark:bg-slate-800 rounded-full shadow-md shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700/50">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
      <div ref={listRef} className="flex flex-row gap-4 overflow-x-auto pb-4 pl-1 [&::-webkit-scrollbar]:hidden scroll-smooth snap-x">
        {plans.map((plan, idx) => (
          <DailyPlanCard 
            key={`${plan.title}-${idx}`}
            plan={plan}
            isSaved={savedPlans.includes(plan.title)}
            onViewDetails={onViewDetails}
            onSave={onSave}
          />
        ))}
      </div>
    </div>
  );
};

/* =========================
   Conversation Sidebar (ChatGPT-Style)
========================= */

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeConversationId: number | null;
  isLoading: boolean;
  isPremium: boolean;
  isOpen: boolean;
  onSelectConversation: (id: number) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: number) => void;
  onRenameConversation: (id: number, title: string) => void;
  onToggleSidebar: () => void;
  onUpgrade?: () => void;
}

const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations,
  activeConversationId,
  isLoading,
  isPremium,
  isOpen,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  onToggleSidebar,
  onUpgrade
}) => {
  const { t, i18n } = useTranslation(['chat', 'common']);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

  const handleStartRename = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
    setMenuOpenId(null);
  };

  const handleSaveRename = () => {
    if (editingId && editTitle.trim()) {
      onRenameConversation(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return t('today');
    if (diffDays === 1) return t('yesterday');
    if (diffDays < 7) return t('daysAgo', { count: diffDays });
    return date.toLocaleDateString();
  };

  // Group conversations by date
  const groupedConversations = conversations.reduce((acc, conv) => {
    const label = formatDate(conv.updatedAt);
    if (!acc[label]) acc[label] = [];
    acc[label].push(conv);
    return acc;
  }, {} as Record<string, Conversation[]>);

  return (
    <>
      {/* Sidebar content - fills container on desktop, absolute on mobile */}
      <div className={`
        absolute md:static inset-y-0 left-0 z-50 md:z-auto
        w-72 md:w-full md:h-full
        bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
        flex flex-col transition-transform duration-300 ease-in-out md:transition-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={onNewConversation}
            disabled={!isPremium}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 
                       border border-slate-200 dark:border-slate-700 rounded-xl
                       hover:bg-slate-50 dark:hover:bg-slate-700 transition-all
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">{t('newChat')}</span>
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-2">
          {!isPremium ? (
            <div className="p-4 text-center">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl mb-3">
                <Crown className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  {t('premium.historyLocked')}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  {t('premium.unlockHistory')}
                </p>
              </div>
              {onUpgrade && (
                <button
                  onClick={onUpgrade}
                  className="w-full px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition-all"
                >
                  {t('premium.upgradeNow')}
                </button>
              )}
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t('noHistory')}</p>
              <p className="text-xs mt-1">{t('startNewChat')}</p>
            </div>
          ) : (
            Object.entries(groupedConversations).map(([dateLabel, convs]) => (
              <div key={dateLabel} className="mb-4">
                <p className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {dateLabel}
                </p>
                {convs.map(conv => (
                  <div
                    key={conv.id}
                    className={`
                      group relative flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer
                      transition-all duration-150
                      ${activeConversationId === conv.id 
                        ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300' 
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}
                    `}
                    onClick={() => onSelectConversation(conv.id)}
                  >
                    <MessageSquare className="w-4 h-4 flex-shrink-0 opacity-60" />
                    
                    {editingId === conv.id ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={handleSaveRename}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveRename()}
                        className="flex-1 bg-white dark:bg-slate-700 px-2 py-1 rounded text-sm outline-none"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="flex-1 truncate text-sm font-medium">
                        {conv.title}
                      </span>
                    )}

                    {/* Actions Menu */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(menuOpenId === conv.id ? null : conv.id);
                        }}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      
                      {menuOpenId === conv.id && (
                        <div className="absolute right-2 top-full mt-1 py-1 bg-white dark:bg-slate-800 rounded-2xl shadow-md shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700/50 z-10 min-w-[120px]">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartRename(conv);
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            {t('common:rename')}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteConversation(conv.id);
                              setMenuOpenId(null);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {t('common:delete')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {/* Footer - Premium Badge */}
        {isPremium && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-lg">
              <Crown className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300">{t('badges.premiumActive')}</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

/* =========================
   Main Component
========================= */

interface ChatViewProps {
  user: User;
}

const ChatView: React.FC<ChatViewProps> = ({ user }) => {
  const { t, i18n } = useTranslation('chat');
  // URL params for direct conversation loading
  const { conversationId: urlConversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  
  // Conversation State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [foodWizardOpen, setFoodWizardOpen] = useState(false);
  const [foodRecommendations, setFoodRecommendations] = useState<FoodPlace[]>([]);
  const [isLoadingFood, setIsLoadingFood] = useState(false);
  
  // Share state
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Message State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [savedSuggestions, setSavedSuggestions] = useState<string[]>([]);
  const [savedDailyPlans, setSavedDailyPlans] = useState<string[]>([]);
  const [editingSuggestion, setEditingSuggestion] = useState<TripSuggestion | null>(null);

  // UI State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  // Initialize with first placeholder from translation, fallback to empty string
  const [currentPlaceholder, setCurrentPlaceholder] = useState('');
  const [isPlaceholderVisible, setIsPlaceholderVisible] = useState(true);
  const [pullOffset, setPullOffset] = useState(0);
  
  // Details State
  const [selectedSuggestion, setSelectedSuggestion] = useState<TripSuggestion | null>(null);
  const [viewingPlace, setViewingPlace] = useState<any | null>(null);
  const [currentCoordinates, setCurrentCoordinates] = useState<{latitude: number, longitude: number} | null>(null);
  const [dailyPlan, setDailyPlan] = useState<any | null>(null);

  // Loading State
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);
  const [showAdPopup, setShowAdPopup] = useState(false);
  const [pendingAiResponse, setPendingAiResponse] = useState<Message | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Derived State
  const isPremium = user?.isPremium || user?.subscription?.status === 'active' || false;

  // Toast Helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Format places data - ALL images go through backend proxy
  const formatPlacesData = (placesArray: any[]) => {
    return placesArray.map((place, index) => { 
        // Build image URL using proxy - backend handles all fallback logic
        const getImageUrl = () => {
          if (place.id || place.place_id) {
            return `${API_BASE_URL}/proxy_image?place_id=${place.id || place.place_id}`;
          }
          if (place.google_place_id) {
            return `${API_BASE_URL}/proxy_image?google_place_id=${encodeURIComponent(place.google_place_id)}`;
          }
          if (place.photo_reference && place.photo_reference !== 'N/A') {
            return `${API_BASE_URL}/proxy_image?ref=${encodeURIComponent(place.photo_reference)}`;
          }
          if (place.name) {
            return `${API_BASE_URL}/proxy_image?name=${encodeURIComponent(place.name)}`;
          }
          return `${API_BASE_URL}/proxy_image/default`;
        };

        if (place.itinerary && Array.isArray(place.itinerary)) {
            return {
                id: place.id || `ai-plan-${index}-${Date.now()}`,
                title: place.title || t('defaults.unnamedPlan'),
                description: place.description || '',
                duration: place.duration || 'Custom Trip',
                priceEstimate: place.priceEstimate || 'N/A',
                tags: place.tags || ['Plan'],
                imageUrl: getImageUrl(),
                itinerary: place.itinerary,
                reviews: [], 
                fullAddress: place.description,
                rating: 5.0 
            };
        }

        return {
            id: `g-place-${index}-${Date.now()}`,
            title: place.name || t('defaults.unknownName'),
            description: `${place.address || ''} | 评分: ${place.rating || 'N/A'}`,
            duration: 'Place',
            priceEstimate: place.price_level ? '$'.repeat(place.price_level.length) : 'N/A',
            tags: place.business_status === 'OPERATIONAL' ? [t('badges.businessOpen'), t('badges.location')] : [t('badges.location')], 
            imageUrl: getImageUrl(),
            itinerary: null,
            reviews: place.review_list || [],
            fullAddress: place.address,
            rating: place.rating
        }; 
    });
  };

  // ============ API Functions ============

  const fetchConversations = useCallback(async () => {
    if (!isPremium) return;
    
    setIsLoadingConversations(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/conversations`, {
        credentials: 'include'
      });
      
      if (response.status === 403) return;
      if (!response.ok) throw new Error('Failed to fetch');
      
      const data = await response.json();
      setConversations(data.conversations || []);
      
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [isPremium]);

  const loadConversation = async (conversationId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to load');
      
      const data = await response.json();
      const conv = data.conversation;
      
      if (conv?.messages) {
        const loadedMessages: Message[] = conv.messages.map((msg: ConversationMessage) => {
          let suggestions = undefined;
          let dailyPlans = undefined;
          let foodRecommendations = undefined;
          let displayContent = msg.content;
          
          // Handle DAILY_PLAN:: format (multi-day itineraries)
          if (msg.content.startsWith('DAILY_PLAN::')) {
            try {
              const jsonString = msg.content.substring('DAILY_PLAN::'.length);
              const planData = JSON.parse(jsonString);
              dailyPlans = [planData];
              // ✅ Don't show any text for DAILY_PLAN:: messages
              // The system message is saved as a SEPARATE message before this one
              displayContent = '';
            } catch (e) {
              console.error('Failed to parse daily plan from history:', e);
            }
          }
          // Handle FOOD_DATA:: format (food recommendations from Food Wizard)
          else if (msg.content.startsWith('FOOD_DATA::')) {
            try {
              const jsonString = msg.content.substring('FOOD_DATA::'.length);
              const foodData = JSON.parse(jsonString);
              if (foodData.recommendations) {
                foodRecommendations = foodData.recommendations;
                // ✅ Don't show text for FOOD_DATA:: messages
                // The system message is saved as a SEPARATE message before this one
                displayContent = '';
              }
            } catch (e) {
              console.error('Failed to parse food data from history:', e);
            }
          }
          // Handle POPUP_DATA:: format (place recommendations)
          else if (msg.content.startsWith('POPUP_DATA::')) {
            try {
              const jsonString = msg.content.substring('POPUP_DATA::'.length);
              suggestions = formatPlacesData(JSON.parse(jsonString));
              // ✅ Don't show text for POPUP_DATA:: messages
              // The system message is saved as a SEPARATE message before this one
              displayContent = '';
            } catch (e) {}
          }
          // Handle pre-parsed suggestions from database
          else if (msg.suggestions) {
            try {
              suggestions = formatPlacesData(msg.suggestions);
            } catch (e) {}
          }
          // Handle pre-parsed dailyPlans from database
          else if (msg.dailyPlans) {
            dailyPlans = msg.dailyPlans;
          }
          
          return {
            id: `msg-${msg.id}`,
            sender: msg.role === 'user' ? 'user' : 'ai',
            text: displayContent,
            timestamp: new Date(msg.createdAt),
            suggestions,
            dailyPlans,
            foodRecommendations
          };
        });
        
        setMessages(loadedMessages);
        setActiveConversationId(conversationId);
      }
      
    } catch (error) {
      console.error('Failed to load conversation:', error);
      showToast(t('errors.loadConversationFailed'), 'error');
    }
  };

  const handleNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
  };

  const handleDeleteConversation = async (conversationId: number) => {
    if (!confirm(t('modals.deleteConfirmation'))) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to delete');
      
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      if (activeConversationId === conversationId) {
        setActiveConversationId(null);
        setMessages([]);
      }
      
      showToast(t('messages.conversationDeleted'), 'success');
      
    } catch (error) {
      showToast(t('errors.deleteFailed'), 'error');
    }
  };

  const handleRenameConversation = async (conversationId: number, title: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title })
      });
      
      if (!response.ok) throw new Error('Failed to rename');
      
      setConversations(prev => 
        prev.map(c => c.id === conversationId ? { ...c, title } : c)
      );
      
    } catch (error) {
      showToast(t('errors.renameFailed'), 'error');
    }
  };

  const handleShareConversation = async () => {
    if (!activeConversationId || !isPremium) return;
    
    setIsSharing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/conversations/${activeConversationId}/share`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to share');
      
      const data = await response.json();
      const fullUrl = `${window.location.origin}${data.shareUrl}`;
      setShareUrl(fullUrl);
      setShareModalOpen(true);
      
    } catch (error) {
      showToast(t('errors.shareFailed'), 'error');
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyShareLink = async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      showToast(t('messages.linkCopied'), 'success');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      showToast(t('errors.copyFailed'), 'error');
    }
  };

  const handleCloseShareModal = () => {
    setShareModalOpen(false);
    setShareUrl(null);
    setCopiedLink(false);
  };

  // ============ Chat Functions ============

  const handleWizardComplete = async (prefs: TripPreferences) => {
    setWizardOpen(false);

    // Construct a structured prompt based on preferences
    // Start new conversation with this prompt
    handleNewConversation();

    // Parse days to number
    const daysMap: Record<string, number> = {
      '1day': 1,
      '2days': 2,
      '3days': 3,
      '5days': 5,
      '7days': 7,
    };

    // Handle custom days (e.g., "10days" from custom input)
    let numDays = daysMap[prefs.days];
    if (!numDays && prefs.days.endsWith('days')) {
      const parsed = parseInt(prefs.days.replace('days', ''));
      numDays = isNaN(parsed) ? 3 : parsed;
    }
    numDays = numDays || 3;

    // Get language name for better AI understanding
    const languageMap: Record<string, string> = {
      'en': 'English',
      'zh': 'Chinese',
      'ms': 'Malay'
    };
    const currentLang = i18n.language || 'en';
    const langName = languageMap[currentLang] || 'English';

    // Create a complete prompt in English for AI (more reliable parsing)
    const prompt = `Plan a ${numDays}-day trip to ${prefs.destination}.

Trip Details:
- Duration: ${numDays} day${numDays > 1 ? 's' : ''}
- Destination: ${prefs.destination}
- Travel style: ${prefs.mood}
- Budget level: ${prefs.budget}
- Traveling with: ${prefs.companions}
- Preferred transport: ${prefs.transport || 'flexible'}
${prefs.dietary.length > 0 ? `- Dietary requirements: ${prefs.dietary.join(', ')}` : ''}

IMPORTANT: Please respond in ${langName} language and create a detailed itinerary with activities, restaurants, and practical information.`;

    setInputValue(prompt);

    // focus textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Food Wizard completion handler
  const handleFoodWizardComplete = async (prefs: FoodPreferences) => {
    setFoodWizardOpen(false);
    setIsLoadingFood(true);
    setFoodRecommendations([]);
    
    // Add a message to chat indicating we're searching
    const mealLabel = t(`foodWizard.mealOptions.${prefs.mealType}`);
    const searchMsg: Message = {
      id: `food-search-${Date.now()}`,
      sender: 'ai',
      text: t('wizards.foodSearchMessage', { meal: mealLabel }),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, searchMsg]);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/food/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          preferences: prefs,
          coordinates: currentCoordinates
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.recommendations) {
        setFoodRecommendations(data.recommendations);
        
        // Update the message to show success
        const resultMsg: Message = {
          id: `food-result-${Date.now()}`,
          sender: 'ai',
          text: t('wizards.foodResultMessage', { count: data.recommendations.length }),
          timestamp: new Date(),
          foodRecommendations: data.recommendations
        };
        
        // Replace the search message with the result
        setMessages(prev => [
          ...prev.filter(m => m.id !== searchMsg.id),
          resultMsg
        ]);
      } else {
        throw new Error(data.error || 'Failed to get recommendations');
      }
    } catch (error) {
      console.error('Food recommendations error:', error);
      
      // Update message to show error
      setMessages(prev => prev.map(m => 
        m.id === searchMsg.id 
          ? { ...m, text: t('wizards.foodErrorMessage') }
          : m
      ));
    } finally {
      setIsLoadingFood(false);
    }
  };

  const handleAddFoodToItinerary = (place: FoodPlace) => {
    // For future: convert food place to itinerary item
    showToast(t('messages.placeAdded', { name: place.name }), 'success');
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoadingMessage) return;

    const newUserMsg: Message = {
        id: Date.now().toString(),
        sender: 'user',
        text: inputValue,
        timestamp: new Date(),
    };

    setMessages(prev => [...prev, newUserMsg]);
    const userMessageToSend = inputValue; 
    setInputValue('');
    setIsLoadingMessage(true);

    try {
        const conversationHistory = messages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [msg.text]
        }));

        const response = await fetch(`${API_BASE_URL}/chat_message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                message: userMessageToSend,
                conversationId: activeConversationId,
                history: conversationHistory,
                coordinates: currentCoordinates,
                language: getCurrentLanguage()  // 🆕 Pass user's preferred language for AI response
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error: ${response.status}`);
        }

        const data = await response.json();
        let aiResponseText = data.reply || "AI 没有回复内容";
        let formattedSuggestions = undefined as any;
        let formattedDailyPlans = undefined as DailyPlanData[] | undefined;

        // Handle DAILY_PLAN:: format (new structured daily plan)
        if (aiResponseText.includes('DAILY_PLAN::')) {
            try {
                const marker = 'DAILY_PLAN::';
                const markerIndex = aiResponseText.indexOf(marker);

                // ✅ Extract system message (text before DAILY_PLAN:: marker)
                // Backend sends TWO separate messages in conversation history, but when first received, it might be combined
                const systemMessage = aiResponseText.substring(0, markerIndex).trim();

                // Extract and parse the plan data
                const jsonString = aiResponseText.substring(markerIndex + marker.length);
                const planData = JSON.parse(jsonString);

                // Store as array in message for card display (don't auto-open fullscreen)
                formattedDailyPlans = [planData];

                // ✅ Use system message from backend (respects user's language setting)
                // Fallback to i18n if no system message (shouldn't happen with new architecture)
                aiResponseText = systemMessage || t('chat:systemMessages.itineraryGenerated', {
                    duration: planData.duration,
                    destination: planData.title
                });
            } catch (parseError) {
                console.error('Failed to parse daily plan:', parseError);
                aiResponseText = t('errors.itineraryParseError');
            }
        }
        // Handle POPUP_DATA:: format (place recommendations)
        else if (aiResponseText.startsWith('POPUP_DATA::')) {
            try {
                const placesData = JSON.parse(aiResponseText.substring('POPUP_DATA::'.length));
                formattedSuggestions = formatPlacesData(placesData);
                aiResponseText = `为您找到了 ${formattedSuggestions.length} 个相关推荐：`;
            } catch (parseError) {
                aiResponseText = t('errors.dataParseError');
            }
        }

        const newAiMsg: Message = {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            text: aiResponseText,
            timestamp: new Date(),
            suggestions: formattedSuggestions,
            dailyPlans: formattedDailyPlans,
        };

        // Update conversation ID if returned (new conversation created)
        if (data.conversationId && !activeConversationId) {
          setActiveConversationId(data.conversationId);
          // Refresh conversations list
          fetchConversations();
        }

        if (!isPremium) {
            setPendingAiResponse(newAiMsg);
            setShowAdPopup(true);
        } else {
            setIsLoadingMessage(false);
            setMessages(prev => [...prev, newAiMsg]);
        }
    
    } catch (error: any) {
        console.error('Send message error:', error);
        setIsLoadingMessage(false);
        setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            text: t('errors.connectionFailed', { error: error.message || error }),
            timestamp: new Date(),
        }]);
    }
  };

  const handleAdPopupClose = () => {
    setShowAdPopup(false);
    setIsLoadingMessage(false);
    if (pendingAiResponse) {
      setMessages(prev => [...prev, pendingAiResponse]);
      setPendingAiResponse(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleSaveSuggestion = useCallback(async (suggestion: TripSuggestion) => {
    const suggestionId = suggestion.id;
    const isSaved = savedSuggestions.includes(suggestionId);

    // Optimistic UI update
    setSavedSuggestions(prev =>
      isSaved ? prev.filter(sid => sid !== suggestionId) : [...prev, suggestionId]
    );

    try {
        if (isSaved) {
            // Unsave: Delete from backend
            const response = await fetch(`${API_BASE_URL}/api/trips/save`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ suggestionId, title: suggestion.title }),
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to unsave trip');
            showToast(t('messages.tripUnsaved', 'Trip removed from saved'), "success");
        } else {
            // Save: Add to backend
            const response = await fetch(`${API_BASE_URL}/api/trips/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(suggestion),
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to save trip');
            showToast(t('messages.tripSaved'), "success");
        }
    } catch (error) {
        // Revert optimistic update on error
        setSavedSuggestions(prev =>
          isSaved ? [...prev, suggestionId] : prev.filter(sid => sid !== suggestionId)
        );
        showToast(t('errors.saveFailed'), "error");
    }
  }, [savedSuggestions]);

  const handleViewDetails = (suggestion: TripSuggestion) => {
    setSelectedSuggestion(suggestion);
  };

  // Daily Plan handlers
  const handleViewDailyPlan = (plan: DailyPlanData) => {
    setDailyPlan(plan);
  };

  const handleSaveDailyPlan = useCallback(async (plan: DailyPlanData) => {
    const planId = plan.title;
    const isSaved = savedDailyPlans.includes(planId);

    // Optimistic update
    setSavedDailyPlans(prev =>
      isSaved ? prev.filter(id => id !== planId) : [...prev, planId]
    );

    try {
      if (isSaved) {
        // Unsave: Delete from backend
        const response = await fetch(`${API_BASE_URL}/api/trips/save_daily_plan`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: plan.title }),
          credentials: 'include'
        });

        if (!response.ok) throw new Error('Failed to unsave');
        showToast(t('messages.tripUnsaved', 'Plan removed from saved'), "success");
      } else {
        // Save: Add to backend
        const response = await fetch(`${API_BASE_URL}/api/trips/save_daily_plan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(plan),
          credentials: 'include'
        });

        if (!response.ok) throw new Error('Failed to save');
        showToast(t('messages.tripSaved'), "success");
      }
    } catch (error) {
      // Revert optimistic update on error
      setSavedDailyPlans(prev =>
        isSaved ? [...prev, planId] : prev.filter(id => id !== planId)
      );
      showToast(t('errors.saveFailed'), "error");
    }
  }, [savedDailyPlans]);

  // ============ Effects ============

  // Geolocation
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentCoordinates({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => console.warn("GPS Error:", error),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  }, []);

  // Load conversations on mount
  useEffect(() => {
    if (isPremium) {
      fetchConversations();
    }
  }, [isPremium, fetchConversations]);

  // Load conversation from URL param or latest
  useEffect(() => {
    if (urlConversationId) {
      // Direct conversation link - load specific conversation
      const convId = parseInt(urlConversationId, 10);
      if (!isNaN(convId) && convId !== activeConversationId) {
        loadConversation(convId);
      }
    } else if (isPremium && conversations.length > 0 && !activeConversationId) {
      // No URL param - load latest conversation
      loadConversation(conversations[0].id);
    }
  }, [isPremium, conversations, urlConversationId]);

  // Auto scroll
  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, isLoadingMessage]);

  // Textarea auto-height with max height and scroll
  useEffect(() => {
    if (textareaRef.current) {
      const maxHeight = 200;
      // Reset height to calculate new scrollHeight
      textareaRef.current.style.height = '56px';
      const scrollHeight = textareaRef.current.scrollHeight;

      if (scrollHeight <= maxHeight) {
        // Content fits, no scroll needed
        textareaRef.current.style.height = scrollHeight + 'px';
        textareaRef.current.style.overflowY = 'hidden';
      } else {
        // Content exceeds max, enable scroll
        textareaRef.current.style.height = maxHeight + 'px';
        textareaRef.current.style.overflowY = 'auto';
      }
    }
  }, [inputValue]);

  // Placeholder rotation
  useEffect(() => {
    // Get placeholders from translation
    const placeholders = t('placeholdersList', { returnObjects: true }) as string[];
    
    // Set initial placeholder if empty
    if (!currentPlaceholder && placeholders.length > 0) {
      setCurrentPlaceholder(placeholders[0]);
    }

    const interval = setInterval(() => {
      setIsPlaceholderVisible(false);
      setTimeout(() => {
        setCurrentPlaceholder(prev => {
          // Re-fetch inside interval to ensure fresh translations if language changes
          const currentPlaceholders = t('placeholdersList', { returnObjects: true }) as string[];
          const idx = currentPlaceholders.indexOf(prev);
          // If not found or last, start from 0
          const nextIdx = idx === -1 ? 0 : (idx + 1) % currentPlaceholders.length;
          return currentPlaceholders[nextIdx];
        });
        setIsPlaceholderVisible(true);
      }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, [t, currentPlaceholder]);

  return (
    <div className="flex h-screen relative rounded-3xl overflow-hidden bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="absolute md:hidden inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Column - explicit width ownership */}
      <div className={`
        contents
        md:block md:shrink-0 md:transition-all md:duration-300 md:ease-in-out
        ${sidebarOpen ? 'md:w-72' : 'md:w-0 md:overflow-hidden'}
      `}>
        <ConversationSidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          isLoading={isLoadingConversations}
          isPremium={isPremium}
          isOpen={sidebarOpen}
          onSelectConversation={loadConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onUpgrade={() => window.location.href = '/billing'}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 min-w-0 flex flex-col relative overflow-hidden m-4 rounded-[2rem] bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-800">
        
        {/* Toast */}
        {toast && (
          <div className={`absolute top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 ${
            toast.type === 'success' ? 'bg-emerald-500 text-white' :
            toast.type === 'error' ? 'bg-red-500 text-white' :
            'bg-slate-800 text-white'
          }`}>
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
            {toast.type === 'error' && <AlertTriangle className="w-4 h-4" />}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        )}

        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
          </button>
          
          {isPremium && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 rounded-full">
              <Crown className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300">PRO</span>
            </div>
          )}
          
          {activeConversationId && (
            <span className="text-sm text-slate-500 dark:text-slate-400 truncate flex-1">
              {conversations.find(c => c.id === activeConversationId)?.title || 'Chat'}
            </span>
          )}
          
          {/* Share Button */}
          {activeConversationId && isPremium && messages.length > 0 && (
            <button
              onClick={handleShareConversation}
              disabled={isSharing}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
              title="Share conversation"
            >
              {isSharing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Share</span>
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8">
          <div className="flex flex-col space-y-8">
            {/* Welcome */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
                <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-sm mb-4">
                  <Map className="w-10 h-10 text-sky-500 dark:text-indigo-400" />
                </div>
                <div className="space-y-2 max-w-md">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {t('wizards.whereToNext', "Where to next?")}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t('wizards.welcomeDesc', "I can help you plan the perfect trip based on your budget, mood, and preferences.")}
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setWizardOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-full shadow-lg shadow-sky-500/20 transition-all hover:scale-105 active:scale-95"
                  >
                    <Sparkles className="w-4 h-4" />
                    {t('wizards.planTrip', "Plan a Trip")}
                  </button>
                  <button
                    onClick={() => setFoodWizardOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-full shadow-lg shadow-orange-500/20 transition-all hover:scale-105 active:scale-95"
                  >
                    <Utensils className="w-4 h-4" />
                    {t('wizards.findFood', "Find Food")}
                  </button>
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div key={msg.id} className={`flex w-full flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div className={`flex gap-4 max-w-[90%] md:max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className="flex-shrink-0 mt-2">
                      {isUser ? (
                        <img src={user.avatarUrl} alt="User" className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-800 shadow-sm object-cover" /> 
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-md">
                          <Bot className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className={`flex flex-col gap-1 p-5 rounded-3xl shadow-sm ${
                      isUser
                        ? 'bg-sky-600 dark:bg-indigo-600 text-white rounded-tr-sm shadow-sky-200/30 dark:shadow-indigo-900/30'
                        : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700/50 rounded-tl-sm shadow-slate-200/50 dark:shadow-slate-900/50'
                    }`}>
                      <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</p>
                      <span className={`text-[10px] font-bold ${isUser ? 'text-sky-100' : 'text-slate-400'} self-end mt-1`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-8 ml-0 md:ml-14 w-full md:w-auto md:max-w-[95%]">
                      <SuggestionList 
                        suggestions={msg.suggestions} 
                        savedSuggestions={savedSuggestions}
                        onViewDetails={handleViewDetails}
                        onToggleSave={toggleSaveSuggestion}
                      />
                    </div>
                  )}
                  {msg.dailyPlans && msg.dailyPlans.length > 0 && (
                    <div className="mt-8 ml-0 md:ml-14 w-full md:w-auto md:max-w-[95%]">
                      <DailyPlanList 
                        plans={msg.dailyPlans}
                        savedPlans={savedDailyPlans}
                        onViewDetails={handleViewDailyPlan}
                        onSave={handleSaveDailyPlan}
                      />
                    </div>
                  )}
                  {msg.foodRecommendations && msg.foodRecommendations.length > 0 && (
                    <div className="mt-8 ml-0 md:ml-14 w-full md:w-auto md:max-w-[95%]">
                      <FoodRecommendationList 
                        places={msg.foodRecommendations as FoodPlace[]}
                        onAddToItinerary={handleAddFoodToItinerary}
                        title="Recommended for You"
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading */}
            {isLoadingMessage && (
              <div className="flex w-full flex-col items-start">
                <div className="flex gap-4 max-w-[90%] md:max-w-[70%]">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-md animate-pulse">
                    <Bot className="w-5 h-5 text-white animate-spin" />
                  </div>
                  <div className="flex flex-col gap-1 p-5 rounded-3xl shadow-sm bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700/50 rounded-tl-sm shadow-slate-200/50 dark:shadow-slate-900/50">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      <span className="text-sm text-slate-500 ml-2">{t('thinking')}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 md:px-6 pb-4 pt-4">
          <div className="relative w-full max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700/50 flex items-end">
            {!inputValue && (
              <div className={`absolute left-6 right-20 top-[18px] pointer-events-none text-slate-400 font-medium text-base transition-all duration-500 truncate ${isPlaceholderVisible ? 'opacity-100' : 'opacity-0'}`}>
                {currentPlaceholder}
              </div>
            )}
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent text-slate-900 dark:text-slate-100 font-medium rounded-3xl pt-[18px] pb-[14px] pl-6 pr-16 focus:outline-none resize-none leading-relaxed"
              style={{ minHeight: '56px' }}
              placeholder=""
            />
            <div className="absolute right-5 bottom-[8px]">
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoadingMessage}
                className="p-2.5 bg-sky-600 hover:bg-sky-500 dark:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl transition-all"
              >
                <Send className="w-5 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Action Buttons - Only show after user has sent messages */}
          {messages.length > 0 && (
            <div className="flex justify-center gap-3 mt-3 max-w-3xl mx-auto">
              <button
                onClick={() => setWizardOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-sky-500/20 transition-all hover:scale-105 active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                {t('wizards.planTrip', "Plan Trip")}
              </button>
              <button
                onClick={() => setFoodWizardOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all hover:scale-105 active:scale-95"
              >
                <Utensils className="w-4 h-4" />
                {t('wizards.findFood', "Find Food")}
              </button>
            </div>
          )}
        </div>

        {/* Ad Popup */}
        <ChatAdvertisementPopup isOpen={showAdPopup} onClose={handleAdPopupClose} />
        
        {/* Trip Planning Wizard */}
        <PlanWizard 
          isOpen={wizardOpen} 
          onClose={() => setWizardOpen(false)} 
          onComplete={handleWizardComplete} 
        />
        
        {/* Food Wizard */}
        <FoodWizard 
          isOpen={foodWizardOpen} 
          onClose={() => setFoodWizardOpen(false)} 
          onComplete={handleFoodWizardComplete}
          userLocation={currentCoordinates}
        />
        
        {/* Detail Modal */}
        {selectedSuggestion && (
          <SuggestionDetailModal 
            suggestion={selectedSuggestion}
            onClose={() => setSelectedSuggestion(null)}
            onSave={toggleSaveSuggestion}
            onUpdate={setSelectedSuggestion}
            isSaved={savedSuggestions.includes(selectedSuggestion.id)}
          />
        )}
        
        {/* Daily Plan View (Full Screen) */}
        {dailyPlan && (
          <DailyPlanView
            plan={dailyPlan}
            onClose={() => setDailyPlan(null)}
            onSave={async (plan) => {
              try {
                const response = await fetch(`${API_BASE_URL}/api/trips/save_daily_plan`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify(plan)
                });
                if (response.ok) {
                  // Update saved state
                  setSavedDailyPlans(prev => 
                    prev.includes(plan.title) ? prev : [...prev, plan.title]
                  );
                  showToast(t('messages.tripSaved'), 'success');
                  setDailyPlan(null);
                } else {
                  showToast(t('errors.saveFailed'), 'error');
                }
              } catch (e) {
                showToast(t('errors.saveFailed'), 'error');
              }
            }}
            onEditActivity={(dayIdx, actIdx, activity) => {
              // For now, just log - can implement inline editing later
              console.log('Edit activity:', dayIdx, actIdx, activity);
            }}
          />
        )}
        
        {/* Share Modal */}
        {shareModalOpen && shareUrl && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-sky-500" />
                  {t('modals.shareConversation')}
                </h3>
                <button
                  onClick={handleCloseShareModal}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                {t('modals.shareDescription')}
              </p>

              <div className="flex items-center gap-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <Link className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-300 outline-none truncate"
                />
                <button
                  onClick={handleCopyShareLink}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    copiedLink
                      ? 'bg-emerald-500 text-white'
                      : 'bg-sky-500 hover:bg-sky-600 text-white'
                  }`}
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4" />
                      {t('modals.copied')}
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      {t('modals.copyLink')}
                    </>
                  )}
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={handleCloseShareModal}
                  className="w-full py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  {t('modals.done')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatView;
