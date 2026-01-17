import React, { useState } from 'react';
import { 
  X, Utensils, Coffee, Pizza, Salad, Beef, Fish,
  Wallet, MapPin, Clock, Sparkles, ArrowRight,
  Heart, Users, Flame, Leaf, Star
} from 'lucide-react';

export interface FoodPreferences {
  cuisine: string[];
  mood: string;
  budget: 'low' | 'medium' | 'high' | 'luxury';
  dietary: string[];
  mealType: string;
  distance: string;
}

interface FoodWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (prefs: FoodPreferences) => void;
  userLocation?: { latitude: number; longitude: number } | null;
}

const CUISINES = [
  { id: 'local', label: 'Local', icon: '🍜' },
  { id: 'chinese', label: 'Chinese', icon: '🥡' },
  { id: 'japanese', label: 'Japanese', icon: '🍣' },
  { id: 'korean', label: 'Korean', icon: '🍲' },
  { id: 'western', label: 'Western', icon: '🍔' },
  { id: 'indian', label: 'Indian', icon: '🍛' },
  { id: 'thai', label: 'Thai', icon: '🍝' },
  { id: 'malay', label: 'Malay', icon: '🍚' },
];

const MOODS = [
  { id: 'quick', label: 'Quick Bite', icon: Clock, desc: 'Fast & convenient' },
  { id: 'casual', label: 'Casual', icon: Coffee, desc: 'Relaxed dining' },
  { id: 'romantic', label: 'Date Night', icon: Heart, desc: 'Special occasion' },
  { id: 'group', label: 'Group Feast', icon: Users, desc: 'Friends & family' },
];

const MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { id: 'lunch', label: 'Lunch', icon: '☀️' },
  { id: 'dinner', label: 'Dinner', icon: '🌙' },
  { id: 'supper', label: 'Supper', icon: '🌃' },
  { id: 'cafe', label: 'Cafe/Dessert', icon: '☕' },
];

const BUDGETS = [
  { id: 'low', label: 'Budget', desc: 'Under RM 15/pax', icon: '$' },
  { id: 'medium', label: 'Moderate', desc: 'RM 15-40/pax', icon: '$$' },
  { id: 'high', label: 'Upscale', desc: 'RM 40-80/pax', icon: '$$$' },
  { id: 'luxury', label: 'Fine Dining', desc: 'RM 80+/pax', icon: '$$$$' },
];

const DIETARY = [
  { id: 'halal', label: 'Halal', icon: '☪️' },
  { id: 'vegetarian', label: 'Vegetarian', icon: '🥬' },
  { id: 'vegan', label: 'Vegan', icon: '🌱' },
  { id: 'no-pork', label: 'No Pork', icon: '🚫🐷' },
  { id: 'no-beef', label: 'No Beef', icon: '🚫🐄' },
  { id: 'gluten-free', label: 'Gluten Free', icon: '🌾' },
];

const DISTANCES = [
  { id: 'nearby', label: 'Walking (< 1km)', value: '1' },
  { id: 'short', label: 'Short drive (< 5km)', value: '5' },
  { id: 'any', label: 'Any distance', value: '15' },
];

export const FoodWizard: React.FC<FoodWizardProps> = ({ isOpen, onClose, onComplete, userLocation }) => {
  const [step, setStep] = useState(1);
  const [prefs, setPrefs] = useState<FoodPreferences>({
    cuisine: [],
    mood: '',
    budget: 'medium',
    dietary: [],
    mealType: '',
    distance: '5'
  });

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else onComplete(prefs);
  };

  const toggleCuisine = (id: string) => {
    setPrefs(prev => ({
      ...prev,
      cuisine: prev.cuisine.includes(id)
        ? prev.cuisine.filter(c => c !== id)
        : [...prev.cuisine, id]
    }));
  };

  const toggleDietary = (id: string) => {
    setPrefs(prev => ({
      ...prev,
      dietary: prev.dietary.includes(id)
        ? prev.dietary.filter(d => d !== id)
        : [...prev.dietary, id]
    }));
  };

  const canProceed = () => {
    if (step === 1) return prefs.mealType && prefs.mood;
    if (step === 2) return true; // Budget has default, dietary is optional
    return true;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg shadow-orange-500/20">
              <Utensils className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Food Finder</h2>
              <p className="text-xs text-slate-500">Step {step} of 3 • Quick recommendations</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/50 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* Step 1: Meal Type & Mood */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" /> What meal are you looking for?
                </label>
                <div className="flex flex-wrap gap-2">
                  {MEAL_TYPES.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setPrefs({...prefs, mealType: m.id})}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
                        prefs.mealType === m.id 
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 ring-1 ring-orange-500' 
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-lg">{m.icon}</span>
                      <span className="text-sm font-medium">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">What's the vibe?</label>
                <div className="grid grid-cols-2 gap-3">
                  {MOODS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setPrefs({...prefs, mood: m.id})}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                        prefs.mood === m.id 
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 ring-1 ring-orange-500' 
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <m.icon className="w-6 h-6" />
                      <span className="text-sm font-bold">{m.label}</span>
                      <span className="text-[10px] text-slate-500">{m.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Budget & Dietary */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-500" /> Budget per person
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {BUDGETS.map(b => (
                    <button
                      key={b.id}
                      onClick={() => setPrefs({...prefs, budget: b.id as any})}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        prefs.budget === b.id
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-500'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-left">
                        <span className="text-sm font-bold text-slate-900 dark:text-white block">{b.label}</span>
                        <span className="text-[10px] text-slate-500">{b.desc}</span>
                      </div>
                      <span className="text-lg font-bold text-emerald-600">{b.icon}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-green-500" /> Dietary requirements (optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {DIETARY.map(d => (
                    <button
                      key={d.id}
                      onClick={() => toggleDietary(d.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                        prefs.dietary.includes(d.id)
                          ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{d.icon}</span>
                      <span>{d.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-500" /> Distance
                </label>
                <div className="flex gap-2">
                  {DISTANCES.map(d => (
                    <button
                      key={d.id}
                      onClick={() => setPrefs({...prefs, distance: d.value})}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium border transition-all ${
                        prefs.distance === d.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Cuisine Preferences */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-orange-500" /> What are you craving? (optional)
                </label>
                <p className="text-xs text-slate-500">Select one or more, or skip for varied suggestions</p>
                <div className="grid grid-cols-4 gap-2">
                  {CUISINES.map(c => (
                    <button
                      key={c.id}
                      onClick={() => toggleCuisine(c.id)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                        prefs.cuisine.includes(c.id)
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 ring-1 ring-orange-500'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-2xl">{c.icon}</span>
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Summary */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-800/30">
                <h4 className="text-sm font-bold text-orange-800 dark:text-orange-300 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Ready to find your perfect meal!
                </h4>
                <div className="text-xs text-orange-700 dark:text-orange-400 space-y-1">
                  <p>• {MEAL_TYPES.find(m => m.id === prefs.mealType)?.label || 'Any meal'} • {MOODS.find(m => m.id === prefs.mood)?.label || 'Any mood'}</p>
                  <p>• Budget: {BUDGETS.find(b => b.id === prefs.budget)?.desc}</p>
                  {prefs.dietary.length > 0 && <p>• Dietary: {prefs.dietary.join(', ')}</p>}
                  {prefs.cuisine.length > 0 && <p>• Cuisine: {prefs.cuisine.join(', ')}</p>}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-3 text-slate-600 dark:text-slate-400 font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {step === 3 ? (
              <>
                <Sparkles className="w-5 h-5" /> Find Food
              </>
            ) : (
              <>
                Next <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
