import React, { useState } from 'react';
import { 
  MapPin, Star, Clock, Utensils, ExternalLink, 
  Navigation, Phone, DollarSign, Heart, Plus,
  ChevronLeft, ChevronRight, X, Check
} from 'lucide-react';
import { API_BASE_URL } from '../../config';

/* =========================
   Image Utility (Simplified)
   
   ALL image logic is handled by proxy.py
   Frontend just builds the URL - backend handles DB lookup, API fetch, fallback
========================= */

/**
 * Get food image URL - delegates ALL logic to backend proxy
 * 
 * Priority (handled by backend):
 * 1. Database lookup by place_id or google_place_id
 * 2. Google Places API fetch
 * 3. Default placeholder (never fails)
 */
export const getFoodImageUrl = (place: {
  place_id?: number | null;
  google_place_id?: string | null;
  photo_reference?: string | null;
  name?: string;
}): string => {
  // Priority 1: Use our DB place_id
  if (place.place_id) {
    return `${API_BASE_URL}/proxy_image?place_id=${place.place_id}`;
  }
  
  // Priority 2: Use Google Place ID
  if (place.google_place_id) {
    return `${API_BASE_URL}/proxy_image?google_place_id=${encodeURIComponent(place.google_place_id)}`;
  }
  
  // Priority 3: Use photo reference directly
  if (place.photo_reference && place.photo_reference !== 'N/A') {
    return `${API_BASE_URL}/proxy_image?ref=${encodeURIComponent(place.photo_reference)}`;
  }
  
  // Priority 4: Search by name (fuzzy match in DB)
  if (place.name) {
    return `${API_BASE_URL}/proxy_image?name=${encodeURIComponent(place.name)}`;
  }
  
  // Fallback: default image endpoint (backend always returns an image)
  return `${API_BASE_URL}/proxy_image/default`;
};

/* =========================
   Types
========================= */

export interface FoodPlace {
  id: number | string;
  name: string;
  address: string;
  rating?: number;
  price_level?: number | string;
  photo_reference?: string;
  place_id?: number;
  google_place_id?: string;
  cuisine_type?: string;
  is_open_now?: boolean;
  opening_hours?: string;
  phone?: string;
  website?: string;
  distance?: string;
  dietary_tags?: string[];
  description?: string;
  review_count?: number;
}

interface FoodRecommendationCardProps {
  place: FoodPlace;
  onAddToItinerary?: (place: FoodPlace) => void;
  onViewDetails?: (place: FoodPlace) => void;
  compact?: boolean;
}

interface FoodRecommendationListProps {
  places: FoodPlace[];
  onAddToItinerary?: (place: FoodPlace) => void;
  title?: string;
  loading?: boolean;
}

/* =========================
   Single Card Component
========================= */

export const FoodRecommendationCard: React.FC<FoodRecommendationCardProps> = ({
  place,
  onAddToItinerary,
  onViewDetails,
  compact = false
}) => {
  const [saved, setSaved] = useState(false);

  // Image URL - backend proxy handles all fallback logic
  const imageUrl = getFoodImageUrl(place);

  // No need for error handler - proxy always returns an image
  const handleImageError = () => {
    // Proxy endpoint never fails - always returns placeholder on error
    // This is just for edge cases (network failure, etc.)
  };

  const getPriceDisplay = (priceLevel?: number | string) => {
    if (!priceLevel) return null;
    if (typeof priceLevel === 'string') return priceLevel;
    return '$'.repeat(Math.min(priceLevel, 4));
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSaved(!saved);
  };

  if (compact) {
    return (
      <div 
        className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all cursor-pointer group"
        onClick={() => onViewDetails?.(place)}
      >
        <img
          src={imageUrl}
          onError={handleImageError}
          alt={place.name}
          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{place.name}</h4>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
            {place.rating && (
              <span className="flex items-center gap-0.5">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                {place.rating.toFixed(1)}
              </span>
            )}
            {getPriceDisplay(place.price_level) && (
              <span className="text-emerald-600 font-bold">{getPriceDisplay(place.price_level)}</span>
            )}
            {place.distance && <span>{place.distance}</span>}
          </div>
        </div>
        {onAddToItinerary && (
          <button
            onClick={(e) => { e.stopPropagation(); onAddToItinerary(place); }}
            className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-xl transition-all group">
      {/* Image */}
      <div className="relative h-40 overflow-hidden">
        <img
          src={imageUrl}
          onError={handleImageError}
          alt={place.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Status badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {place.is_open_now !== undefined && (
            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
              place.is_open_now 
                ? 'bg-emerald-500 text-white' 
                : 'bg-red-500 text-white'
            }`}>
              {place.is_open_now ? 'Open' : 'Closed'}
            </span>
          )}
          {place.cuisine_type && (
            <span className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase bg-white/90 text-slate-700">
              {place.cuisine_type}
            </span>
          )}
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          className={`absolute top-3 right-3 p-2 rounded-full transition-all ${
            saved 
              ? 'bg-rose-500 text-white' 
              : 'bg-white/90 text-slate-600 hover:bg-rose-500 hover:text-white'
          }`}
        >
          <Heart className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
        </button>

        {/* Price & Rating overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {place.rating && (
              <span className="flex items-center gap-1 px-2 py-1 bg-white/95 rounded-lg text-xs font-bold text-slate-800">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                {place.rating.toFixed(1)}
                {place.review_count && (
                  <span className="text-slate-400 font-normal">({place.review_count})</span>
                )}
              </span>
            )}
          </div>
          {getPriceDisplay(place.price_level) && (
            <span className="px-2 py-1 bg-emerald-500 text-white rounded-lg text-xs font-bold">
              {getPriceDisplay(place.price_level)}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1 line-clamp-1">
          {place.name}
        </h3>
        
        <p className="text-sm text-slate-500 dark:text-slate-400 flex items-start gap-1 mb-3 line-clamp-2">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          {place.address}
        </p>

        {/* Dietary tags */}
        {place.dietary_tags && place.dietary_tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {place.dietary_tags.map((tag, idx) => (
              <span 
                key={idx}
                className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-[10px] font-bold"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {place.description && (
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 line-clamp-2">
            {place.description}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
          {place.google_place_id && (
            <a
              href={`https://www.google.com/maps/place/?q=place_id:${place.google_place_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg transition-colors"
            >
              <Navigation className="w-4 h-4" />
              Directions
            </a>
          )}
          {onAddToItinerary && (
            <button
              onClick={() => onAddToItinerary(place)}
              className="flex-1 flex items-center justify-center gap-1 py-2 text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              Add to Plan
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* =========================
   List Component with Carousel
========================= */

export const FoodRecommendationList: React.FC<FoodRecommendationListProps> = ({
  places,
  onAddToItinerary,
  title = "Food Recommendations",
  loading = false
}) => {
  const [scrollIndex, setScrollIndex] = useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const scrollTo = (direction: 'left' | 'right') => {
    if (!containerRef.current) return;
    const cardWidth = 280 + 16; // card width + gap
    const newIndex = direction === 'left' 
      ? Math.max(0, scrollIndex - 1)
      : Math.min(places.length - 1, scrollIndex + 1);
    setScrollIndex(newIndex);
    containerRef.current.scrollTo({
      left: newIndex * cardWidth,
      behavior: 'smooth'
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Utensils className="w-5 h-5 text-orange-500" />
          {title}
        </h3>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-[280px] flex-shrink-0 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse">
              <div className="h-40 bg-slate-200 dark:bg-slate-700 rounded-t-2xl" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!places || places.length === 0) {
    return (
      <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
        <Utensils className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <p className="text-slate-500 dark:text-slate-400">No food recommendations found</p>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Try adjusting your preferences</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Utensils className="w-5 h-5 text-orange-500" />
          {title}
          <span className="text-sm font-normal text-slate-500">({places.length} found)</span>
        </h3>
        
        {places.length > 2 && (
          <div className="flex gap-1">
            <button
              onClick={() => scrollTo('left')}
              disabled={scrollIndex === 0}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scrollTo('right')}
              disabled={scrollIndex >= places.length - 2}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Cards Carousel */}
      <div 
        ref={containerRef}
        className="flex gap-4 overflow-x-auto pb-4 scroll-smooth [&::-webkit-scrollbar]:hidden"
      >
        {places.map((place, idx) => (
          <div key={place.id || idx} className="w-[280px] flex-shrink-0">
            <FoodRecommendationCard
              place={place}
              onAddToItinerary={onAddToItinerary}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default FoodRecommendationCard;
