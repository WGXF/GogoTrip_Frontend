import React, { useState } from 'react';
import { 
  X, Car, MapPin, Footprints, 
  Wallet, Coffee, Heart, Users,
  Utensils, Sparkles, ArrowRight
} from 'lucide-react';

export interface TripPreferences {
  mood: string;
  companions: string;
  budget: 'low' | 'medium' | 'high' | 'luxury';
  transport: string;
  dietary: string[];
}

interface PlanWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (prefs: TripPreferences) => void;
}

const MOODS = [
  { id: 'relaxed', label: 'Relaxed', icon: Coffee },
  { id: 'energetic', label: 'Energetic', icon: Sparkles },
  { id: 'romantic', label: 'Romantic', icon: Heart },
  { id: 'family', label: 'Family Fun', icon: Users },
];

const COMPANIONS = [
  { id: 'solo', label: 'Solo' },
  { id: 'couple', label: 'Couple' },
  { id: 'family', label: 'Family' },
  { id: 'friends', label: 'Friends' },
];

const TRANSPORTS = [
  { id: 'car', label: 'Car', icon: Car },
  { id: 'public', label: 'Public Transport', icon: MapPin },
  { id: 'walk', label: 'Walking', icon: Footprints },
];

const BUDGETS = [
  { id: 'low', label: 'Budget', desc: 'Cheap & Cheerful' },
  { id: 'medium', label: 'Standard', desc: 'Balanced' },
  { id: 'high', label: 'Premium', desc: 'Treat Yourself' },
  { id: 'luxury', label: 'Luxury', desc: 'Spare No Expense' },
];

const DIETARY = [
  'Halal', 'Vegetarian', 'Vegan', 'No Beef', 'No Pork', 'Gluten Free'
];

export const PlanWizard: React.FC<PlanWizardProps> = ({ isOpen, onClose, onComplete }) => {
  const [step, setStep] = useState(1);
  const [prefs, setPrefs] = useState<TripPreferences>({
    mood: '',
    companions: '',
    budget: 'medium',
    transport: '',
    dietary: []
  });

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else onComplete(prefs);
  };

  const toggleDietary = (item: string) => {
    setPrefs(prev => ({
      ...prev,
      dietary: prev.dietary.includes(item) 
        ? prev.dietary.filter(d => d !== item)
        : [...prev.dietary, item]
    }));
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Trip Wizard</h2>
            <p className="text-xs text-slate-500">Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* Step 1: Vibe & Company */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">What's the vibe today?</label>
                <div className="grid grid-cols-2 gap-3">
                  {MOODS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setPrefs({...prefs, mood: m.id})}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                        prefs.mood === m.id 
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 ring-1 ring-sky-500' 
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <m.icon className="w-6 h-6" />
                      <span className="text-sm font-medium">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Who are you with?</label>
                <div className="flex flex-wrap gap-2">
                  {COMPANIONS.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setPrefs({...prefs, companions: c.id})}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                        prefs.companions === c.id
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Budget & Transport */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Wallet className="w-4 h-4" /> Budget Level
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {BUDGETS.map(b => (
                    <button
                      key={b.id}
                      onClick={() => setPrefs({...prefs, budget: b.id as any})}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        prefs.budget === b.id
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-500'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{b.label}</span>
                      <span className="text-xs text-slate-500">{b.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">How are you getting around?</label>
                <div className="flex gap-2">
                  {TRANSPORTS.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setPrefs({...prefs, transport: t.id})}
                      className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                        prefs.transport === t.id
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <t.icon className="w-5 h-5" />
                      <span className="text-xs font-medium">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Food & Restrictions */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Utensils className="w-4 h-4" /> Dietary Preferences
                </label>
                <div className="flex flex-wrap gap-2">
                  {DIETARY.map(d => (
                    <button
                      key={d}
                      onClick={() => toggleDietary(d)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                        prefs.dietary.includes(d)
                          ? 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400">
                <p>Ready to generate your custom plan? The AI will use these preferences to find the best spots for you.</p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button
            onClick={handleNext}
            disabled={step === 1 && (!prefs.mood || !prefs.companions)}
            className="w-full py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {step === 3 ? (
              <>
                <Sparkles className="w-5 h-5" /> Generate My Plan
              </>
            ) : (
              <>
                Next Step <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
