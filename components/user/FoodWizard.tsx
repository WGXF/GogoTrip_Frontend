import React, { useState } from 'react';
import { 
  X, Utensils, Coffee, Pizza, Salad, Beef, Fish,
  Wallet, MapPin, Clock, Sparkles, ArrowRight,
  Heart, Users, Flame, Leaf, Star
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  { id: 'local', icon: '🍜' },
  { id: 'chinese', icon: '🥡' },
  { id: 'japanese', icon: '🍣' },
  { id: 'korean', icon: '🍲' },
  { id: 'western', icon: '🍔' },
  { id: 'indian', icon: '🍛' },
  { id: 'thai', icon: '🍝' },
  { id: 'malay', icon: '🍚' },
];

const MOODS = [
  { id: 'quick', icon: Clock },
  { id: 'casual', icon: Coffee },
  { id: 'romantic', icon: Heart },
  { id: 'group', icon: Users },
];

const MEAL_TYPES = [
  { id: 'breakfast', icon: '🌅' },
  { id: 'lunch', icon: '☀️' },
  { id: 'dinner', icon: '🌙' },
  { id: 'supper', icon: '🌃' },
  { id: 'cafe', icon: '☕' },
];

const BUDGETS = [
  { id: 'low', icon: '$' },
  { id: 'medium', icon: '$$' },
  { id: 'high', icon: '$$$' },
  { id: 'luxury', icon: '$$$$' },
];

const DIETARY = [
  { id: 'halal', icon: '☪️' },
  { id: 'vegetarian', icon: '🥬' },
  { id: 'vegan', icon: '🌱' },
  { id: 'no-pork', icon: '🚫🐷' },
  { id: 'no-beef', icon: '🚫🐄' },
  { id: 'gluten-free', icon: '🌾' },
];

const DISTANCES = [
  { id: 'nearby', value: '1' },
  { id: 'short', value: '5' },
  { id: 'any', value: '15' },
];

export const FoodWizard: React.FC<FoodWizardProps> = ({ isOpen, onClose, onComplete, userLocation }) => {
  const { t } = useTranslation('chat');
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
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('foodWizard.title')}</h2>
              <p className="text-xs text-slate-500">{t('foodWizard.stepIndicator', { current: step, total: 3 })}</p>
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
                  <Clock className="w-4 h-4 text-orange-500" /> {t('foodWizard.mealType')}
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
                      <span className="text-sm font-medium">{t(`foodWizard.mealOptions.${m.id}`)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('foodWizard.vibe')}</label>
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
                      <span className="text-sm font-bold">{t(`foodWizard.vibeOptions.${m.id}`)}</span>
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
                  <Wallet className="w-4 h-4 text-emerald-500" /> {t('tripWizard.budget')}
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
                        <span className="text-sm font-bold text-slate-900 dark:text-white block">{t(`tripWizard.budgetOptions.${b.id}`)}</span>
                        <span className="text-[10px] text-slate-500">{t(`foodWizard.budgetDescriptions.${b.id}`)}</span>
                      </div>
                      <span className="text-lg font-bold text-emerald-600">{b.icon}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-green-500" /> {t('tripWizard.dietary')}
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
                      <span>{t(`foodWizard.dietaryOptions.${d.id.replace('-', '')}`)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-500" /> {t('recommendations.distance')}
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
                      {t(`foodWizard.distanceOptions.${d.id}`)}
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
                  <Utensils className="w-4 h-4 text-orange-500" /> {t('foodWizard.cravingPrompt')}
                </label>
                <p className="text-xs text-slate-500">{t('foodWizard.cravingDesc')}</p>
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
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{t(`foodWizard.cuisineOptions.${c.id}`)}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Summary */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-800/30">
                <h4 className="text-sm font-bold text-orange-800 dark:text-orange-300 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> {t('foodWizard.readyTitle')}
                </h4>
                <div className="text-xs text-orange-700 dark:text-orange-400 space-y-1">
                  <p>• {t(`foodWizard.mealOptions.${prefs.mealType}`)} • {t(`foodWizard.vibeOptions.${prefs.mood}`)}</p>
                  <p>• {t('tripWizard.budget')}: {t(`foodWizard.budgetDescriptions.${prefs.budget}`)}</p>
                  {prefs.dietary.length > 0 && <p>• {t('tripWizard.dietary')}: {prefs.dietary.map(d => t(`foodWizard.dietaryOptions.${d.replace('-', '')}`)).join(', ')}</p>}
                  {prefs.cuisine.length > 0 && <p>• {t('foodWizard.cuisine')}: {prefs.cuisine.map(c => t(`foodWizard.cuisineOptions.${c}`)).join(', ')}</p>}
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
                <Sparkles className="w-5 h-5" /> {t('foodWizard.findFood')}
              </>
            ) : (
              <>
                {t('foodWizard.next')} <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
