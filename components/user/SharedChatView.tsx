import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Bot, Map, Loader2, AlertCircle, ArrowLeft, Calendar, MapPin,
  Star, ChevronLeft, ChevronRight, Info, CheckCircle2, PlusCircle,
  Clock, Utensils, Camera, Coffee, Hotel, ShoppingBag, Bus,
  X, Sparkles, Wallet, Navigation, Sun, Cloud
} from 'lucide-react';
import { API_BASE_URL } from '../../config';
import { TripSuggestion } from '../../types';

/* =========================
   Types
========================= */
interface SharedMessage {
  id: number;
  role: 'user' | 'ai';
  content: string;
  createdAt: string;
  suggestions?: TripSuggestion[];
  dailyPlans?: DailyPlanData[];
  foodRecommendations?: FoodPlace[];
}

interface SharedConversation {
  id: number;
  title: string;
  createdAt: string;
  messageCount: number;
  messages: SharedMessage[];
}

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
  days: DayPlan[];
  practical_info?: {
    best_transport?: string;
    weather_advisory?: string;
    booking_recommendations?: string[];
  };
}

interface FoodPlace {
  name: string;
  address?: string;
  rating?: number;
  cuisine?: string;
  price_level?: string;
}

/* =========================
   Helpers
========================= */
const getLocationImageUrl = (imageUrl?: string, placeId?: number | null, placeName?: string): string => {
  if (placeId) {
    return `${API_BASE_URL}/proxy_image?place_id=${placeId}`;
  }
  if (placeName) {
    return `${API_BASE_URL}/proxy_image?name=${encodeURIComponent(placeName)}`;
  }
  return `${API_BASE_URL}/proxy_image/default`;
};

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
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${colors[slot] || colors.morning}`}>
      {slot}
    </span>
  );
};

/* =========================
   Sub-Components
========================= */

// Read-only Detail Modal for Daily Plan
const SharedDailyPlanDetailModal: React.FC<{ plan: DailyPlanData; onClose: () => void }> = ({ plan, onClose }) => {
  const [selectedDay, setSelectedDay] = useState(0);
  const currentDay = plan.days[selectedDay];

  const handlePrevDay = () => setSelectedDay(prev => Math.max(0, prev - 1));
  const handleNextDay = () => setSelectedDay(prev => Math.min(plan.days.length - 1, prev + 1));

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-slate-900 flex flex-col overflow-hidden animate-in fade-in duration-200">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1">{plan.title}</h1>
              <p className="text-xs text-slate-500 flex items-center gap-2">
                <span>{plan.duration}</span>
                <span>•</span>
                <span>{plan.total_budget_estimate}</span>
              </p>
            </div>
          </div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
            Read Only
          </div>
        </div>
      </div>

      {/* Day Selector */}
      <div className="shrink-0 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-4 py-3">
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
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
          
          {/* Top Locations */}
          {currentDay.top_locations && currentDay.top_locations.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Highlights
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentDay.top_locations.map((loc, idx) => (
                  <div 
                    key={idx}
                    className="relative h-48 rounded-2xl overflow-hidden group shadow-lg"
                  >
                    <img 
                      src={getLocationImageUrl(loc.image_url, loc.place_id, loc.name)}
                      alt={loc.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.src = `${API_BASE_URL}/proxy_image/default`; }}
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
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Activities</p>
                  <p className="font-bold text-slate-900 dark:text-white">{currentDay.day_summary.total_activities} Items</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Est. Budget</p>
                  <p className="font-bold text-slate-900 dark:text-white">{currentDay.day_summary.total_budget}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <Bus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Transport</p>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{currentDay.day_summary.transport_notes}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Itinerary List */}
          <section>
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Itinerary
            </h2>
            
            <div className="space-y-4">
              {currentDay.activities.map((activity, actIdx) => (
                <div key={actIdx} className="relative pl-8 group">
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
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <TimeSlotBadge slot={activity.time_slot} />
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {activity.start_time} - {activity.end_time}
                        </span>
                      </div>
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
                <Info className="w-4 h-4" /> Practical Info
              </h2>
              <div className="space-y-2 text-sm text-amber-700 dark:text-amber-300">
                {plan.practical_info.best_transport && (
                  <p><strong>Transport:</strong> {plan.practical_info.best_transport}</p>
                )}
                {plan.practical_info.weather_advisory && (
                  <p><strong>Weather:</strong> {plan.practical_info.weather_advisory}</p>
                )}
                {plan.practical_info.booking_recommendations && plan.practical_info.booking_recommendations.length > 0 && (
                  <div>
                    <strong>Booking Tips:</strong>
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
    </div>
  );
};

// Simplified suggestion card for shared view (read-only)
const SharedSuggestionCard: React.FC<{ suggestion: TripSuggestion }> = ({ suggestion }) => {
  return (
    <div className="w-full md:w-auto md:min-w-[280px] md:max-w-[320px] bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 rounded-2xl flex-shrink-0 snap-start">
      <div className="h-36 overflow-hidden relative rounded-t-2xl">
        <img 
          src={suggestion.imageUrl || `${API_BASE_URL}/proxy_image/default`} 
          alt={suggestion.title} 
          className="w-full h-full object-cover"
          onError={(e) => { e.currentTarget.src = `${API_BASE_URL}/proxy_image/default`; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-3 left-4">
          <h4 className="text-white font-bold text-lg leading-tight">{suggestion.title}</h4>
        </div>
      </div>
      <div className="p-5 space-y-4">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
          {suggestion.description}
        </p>
        <div className="flex flex-wrap gap-2">
          {suggestion.tags?.slice(0, 3).map(tag => (
            <span key={tag} className="text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 px-2.5 py-1 rounded-lg uppercase tracking-wider">
              {tag}
            </span>
          ))}
        </div>
        {suggestion.priceEstimate && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-700/50">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Est. Cost</p>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{suggestion.priceEstimate}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Simplified daily plan card for shared view (read-only)
const SharedDailyPlanCard: React.FC<{ plan: DailyPlanData; onViewDetails: (plan: DailyPlanData) => void }> = ({ plan, onViewDetails }) => {
  const totalActivities = plan.days?.reduce((sum, day) => sum + (day.activities?.length || 0), 0) || 0;
  
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

  return (
    <div className="w-full md:w-auto md:min-w-[320px] md:max-w-[380px] bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 rounded-2xl flex-shrink-0 snap-start transition-all hover:shadow-lg">
      <div className="h-40 overflow-hidden relative rounded-t-2xl bg-gradient-to-br from-sky-400 to-blue-600">
        <img 
          src={getCoverImage()}
          alt={plan.title}
          className="w-full h-full object-cover"
          onError={(e) => { e.currentTarget.src = `${API_BASE_URL}/proxy_image/default`; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute top-3 left-3 px-3 py-1 bg-sky-500/90 backdrop-blur-sm rounded-full text-white text-xs font-bold flex items-center gap-1.5">
          <Calendar className="w-3 h-3" />
          {plan.duration}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h4 className="text-white font-bold text-lg leading-tight drop-shadow-md">{plan.title}</h4>
        </div>
      </div>
      <div className="p-5 space-y-4">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
          {plan.description}
        </p>
        <div className="flex flex-wrap gap-2">
          {plan.tags?.slice(0, 4).map(tag => (
            <span key={tag} className="text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 px-2.5 py-1 rounded-lg uppercase tracking-wider">
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {plan.days?.length || 0} days
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {totalActivities} activities
          </span>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700/50">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Est. Budget</p>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{plan.total_budget_estimate}</p>
          </div>
          <button 
            onClick={() => onViewDetails(plan)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white transition-all"
          >
            <Info className="w-3.5 h-3.5" />
            View Itinerary
          </button>
        </div>
      </div>
    </div>
  );
};

// Food recommendation card for shared view
const SharedFoodCard: React.FC<{ place: FoodPlace }> = ({ place }) => {
  return (
    <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4">
      <h4 className="font-bold text-slate-900 dark:text-white">{place.name}</h4>
      {place.address && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{place.address}</p>
      )}
      <div className="flex items-center gap-3 mt-2">
        {place.rating && (
          <span className="flex items-center gap-1 text-sm">
            <Star className="w-4 h-4 text-amber-400 fill-current" />
            {place.rating}
          </span>
        )}
        {place.cuisine && (
          <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{place.cuisine}</span>
        )}
        {place.price_level && (
          <span className="text-xs text-emerald-600">{place.price_level}</span>
        )}
      </div>
    </div>
  );
};

/* =========================
   Helper Functions
========================= */

const formatPlacesData = (placesArray: any[]): TripSuggestion[] => {
  return placesArray.map((place, index) => {
    const getImageUrl = () => {
      if (place.id || place.place_id) {
        return `${API_BASE_URL}/proxy_image?place_id=${place.id || place.place_id}`;
      }
      if (place.name) {
        return `${API_BASE_URL}/proxy_image?name=${encodeURIComponent(place.name)}`;
      }
      return `${API_BASE_URL}/proxy_image/default`;
    };

    return {
      id: place.id || `shared-place-${index}`,
      title: place.title || place.name || 'Unknown',
      description: place.description || place.address || '',
      duration: place.duration || 'Place',
      priceEstimate: place.priceEstimate || (place.price_level ? '$'.repeat(place.price_level.length) : 'N/A'),
      tags: place.tags || (place.business_status === 'OPERATIONAL' ? ['Open', 'Place'] : ['Place']),
      imageUrl: getImageUrl(),
      itinerary: place.itinerary || null,
      reviews: place.review_list || [],
      fullAddress: place.address,
      rating: place.rating
    };
  });
};

const parseMessageContent = (message: SharedMessage): { 
  text: string; 
  suggestions?: TripSuggestion[];
  dailyPlans?: DailyPlanData[];
  foodRecommendations?: FoodPlace[];
} => {
  let text = message.content;
  let suggestions: TripSuggestion[] | undefined;
  let dailyPlans: DailyPlanData[] | undefined;
  let foodRecommendations: FoodPlace[] | undefined;

  // Handle DAILY_PLAN:: format
  if (text.startsWith('DAILY_PLAN::')) {
    try {
      const planData = JSON.parse(text.substring('DAILY_PLAN::'.length));
      dailyPlans = [planData];
      text = `Generated a ${planData.duration} trip plan:`;
    } catch (e) {
      console.error('Failed to parse daily plan:', e);
    }
  }
  // Handle FOOD_DATA:: format
  else if (text.startsWith('FOOD_DATA::')) {
    try {
      const foodData = JSON.parse(text.substring('FOOD_DATA::'.length));
      if (foodData.recommendations) {
        foodRecommendations = foodData.recommendations;
        text = `Found ${foodData.recommendations.length} food recommendations:`;
      }
    } catch (e) {
      console.error('Failed to parse food data:', e);
    }
  }
  // Handle POPUP_DATA:: format
  else if (text.startsWith('POPUP_DATA::')) {
    try {
      const placesData = JSON.parse(text.substring('POPUP_DATA::'.length));
      suggestions = formatPlacesData(placesData);
      text = `Found ${suggestions.length} recommendations:`;
    } catch (e) {
      console.error('Failed to parse places data:', e);
    }
  }

  return { text, suggestions, dailyPlans, foodRecommendations };
};

/* =========================
   Main Component
========================= */

const SharedChatView: React.FC = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const navigate = useNavigate();
  
  const [conversation, setConversation] = useState<SharedConversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<DailyPlanData | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSharedConversation = async () => {
      if (!shareToken) {
        setError('Invalid share link');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/shared/${shareToken}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('This conversation is no longer available or has been unshared.');
          } else {
            setError('Failed to load conversation');
          }
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        setConversation(data.conversation);
      } catch (err) {
        console.error('Failed to fetch shared conversation:', err);
        setError('Failed to load conversation. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSharedConversation();
  }, [shareToken]);

  useEffect(() => {
    if (conversation) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-sky-500 animate-spin mx-auto" />
          <p className="text-slate-500 dark:text-slate-400">Loading shared conversation...</p>
        </div>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Conversation Not Found
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              {error || 'This shared conversation could not be found.'}
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate">
              {conversation.title}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Shared conversation - {conversation.messageCount} messages
            </p>
          </div>
          
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full">
            <Map className="w-3.5 h-3.5 text-sky-500" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">GogoTrip</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
        <div className="flex flex-col space-y-8">
          {conversation.messages.map((msg) => {
            const isUser = msg.role === 'user';
            const { text, suggestions, dailyPlans, foodRecommendations } = parseMessageContent(msg);
            
            return (
              <div key={msg.id} className={`flex w-full flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div className={`flex gap-4 max-w-[90%] md:max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className="flex-shrink-0 mt-2">
                    {isUser ? (
                      <div className="w-10 h-10 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center">
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">U</span>
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-md">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                  <div className={`flex flex-col gap-1 p-5 rounded-[1.5rem] shadow-sm ${
                    isUser 
                      ? 'bg-sky-600 dark:bg-indigo-600 text-white rounded-tr-sm' 
                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-tl-sm'
                  }`}>
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium">{text}</p>
                    <span className={`text-[10px] font-bold ${isUser ? 'text-sky-100' : 'text-slate-400'} self-end mt-1`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                
                {/* Suggestions */}
                {suggestions && suggestions.length > 0 && (
                  <div className="mt-8 ml-0 md:ml-14 w-full md:w-auto md:max-w-[95%]">
                    <div className="flex flex-row gap-4 overflow-x-auto pb-4 pl-1 [&::-webkit-scrollbar]:hidden scroll-smooth snap-x">
                      {suggestions.map((suggestion, idx) => (
                        <SharedSuggestionCard key={suggestion.id || idx} suggestion={suggestion} />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Daily Plans */}
                {dailyPlans && dailyPlans.length > 0 && (
                  <div className="mt-8 ml-0 md:ml-14 w-full md:w-auto md:max-w-[95%]">
                    <div className="flex flex-row gap-4 overflow-x-auto pb-4 pl-1 [&::-webkit-scrollbar]:hidden scroll-smooth snap-x">
                      {dailyPlans.map((plan, idx) => (
                        <SharedDailyPlanCard 
                          key={`${plan.title}-${idx}`} 
                          plan={plan} 
                          onViewDetails={setSelectedPlan}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Food Recommendations */}
                {foodRecommendations && foodRecommendations.length > 0 && (
                  <div className="mt-8 ml-0 md:ml-14 w-full md:w-auto md:max-w-[95%]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {foodRecommendations.slice(0, 6).map((place, idx) => (
                        <SharedFoodCard key={`${place.name}-${idx}`} place={place} />
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

      {/* Footer */}
      <div className="border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            This is a shared conversation. Want to plan your own trip?
          </p>
          <button
            onClick={() => navigate('/chat')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl transition-colors"
          >
            <Map className="w-4 h-4" />
            Start Planning
          </button>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedPlan && (
        <SharedDailyPlanDetailModal 
          plan={selectedPlan} 
          onClose={() => setSelectedPlan(null)} 
        />
      )}
    </div>
  );
};

export default SharedChatView;
