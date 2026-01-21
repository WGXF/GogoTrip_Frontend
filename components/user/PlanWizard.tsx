import React, { useState } from 'react';
import { 
  X, Car, MapPin, Footprints, 
  Wallet, Coffee, Heart, Users,
  Utensils, Sparkles, ArrowRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface TripPreferences {
  destination: string;
  days: string;
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
  { id: 'relaxed', icon: Coffee },
  { id: 'energetic', icon: Sparkles },
  { id: 'romantic', icon: Heart },
  { id: 'family', icon: Users },
];

const COMPANIONS = [
  { id: 'solo' },
  { id: 'couple' },
  { id: 'family' },
  { id: 'friends' },
];

const TRANSPORTS = [
  { id: 'car', icon: Car },
  { id: 'public', icon: MapPin },
  { id: 'walk', icon: Footprints },
];

const BUDGETS = [
  { id: 'low' },
  { id: 'medium' },
  { id: 'high' },
  { id: 'luxury' },
];

const DIETARY = [
  'halal', 'vegetarian', 'vegan', 'noBeef', 'noPork', 'glutenFree'
];

const DAYS = [
  { id: '1day' },
  { id: '2days' },
  { id: '3days' },
  { id: '5days' },
  { id: '7days' },
  { id: 'custom' },
];

export const PlanWizard: React.FC<PlanWizardProps> = ({ isOpen, onClose, onComplete }) => {
  const { t } = useTranslation('chat');
  const [step, setStep] = useState(1);
  const [customDays, setCustomDays] = useState('');
  const [prefs, setPrefs] = useState<TripPreferences>({
    destination: '',
    days: '',
    mood: '',
    companions: '',
    budget: 'medium',
    transport: '',
    dietary: []
  });

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
    else {
      // If custom days, replace with the actual number
      const finalPrefs = prefs.days === 'custom'
        ? { ...prefs, days: `${customDays}days` }
        : prefs;
      onComplete(finalPrefs);
    }
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
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('tripWizard.title')}</h2>
            <p className="text-xs text-slate-500">{t('tripWizard.stepIndicator', { current: step, total: 4 })}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">

          {/* Step 1: Destination & Duration */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> {t('tripWizard.destination')}
                </label>
                <input
                  type="text"
                  value={prefs.destination}
                  onChange={(e) => setPrefs({...prefs, destination: e.target.value})}
                  placeholder={t('tripWizard.destinationPlaceholder')}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('tripWizard.duration')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {DAYS.map(d => (
                    <button
                      key={d.id}
                      onClick={() => {
                        setPrefs({...prefs, days: d.id});
                        if (d.id !== 'custom') setCustomDays('');
                      }}
                      className={`p-3 rounded-xl border transition-all text-sm font-medium ${
                        prefs.days === d.id
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 ring-1 ring-sky-500'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {t(`tripWizard.durationOptions.${d.id}`)}
                    </button>
                  ))}
                </div>
                {prefs.days === 'custom' && (
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={customDays}
                    onChange={(e) => setCustomDays(e.target.value)}
                    placeholder={t('tripWizard.customDaysPlaceholder') || 'Enter number of days (max 7)'}
                    className="w-full px-4 py-3 rounded-xl border border-sky-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                  />
                )}
              </div>
            </div>
          )}

          {/* Step 2: Vibe & Company */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('tripWizard.mood')}</label>
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
                      <span className="text-sm font-medium">{t(`tripWizard.moodOptions.${m.id}`)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('tripWizard.companions')}</label>
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
                      {t(`tripWizard.companionOptions.${c.id}`)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Budget & Transport */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Wallet className="w-4 h-4" /> {t('tripWizard.budget')}
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
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{t(`tripWizard.budgetOptions.${b.id}`)}</span>
                      {/* Note: budget descriptions are currently hardcoded in English in some logic, but here we can just show label for now or add desc keys */}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('tripWizard.transport')}</label>
                <div className="flex gap-2">
                  {TRANSPORTS.map(transport => (
                    <button
                      key={transport.id}
                      onClick={() => setPrefs({...prefs, transport: transport.id})}
                      className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                        prefs.transport === transport.id
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <transport.icon className="w-5 h-5" />
                      <span className="text-xs font-medium">{t(`tripWizard.transportOptions.${transport.id}`)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Food & Restrictions */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Utensils className="w-4 h-4" /> {t('tripWizard.dietary')}
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
                      {t(`tripWizard.dietaryOptions.${d}`)}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400">
                <p>{t('tripWizard.readyPrompt')}</p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button
            onClick={handleNext}
            disabled={
              (step === 1 && (!prefs.destination || !prefs.days || (prefs.days === 'custom' && !customDays))) ||
              (step === 2 && (!prefs.mood || !prefs.companions))
            }
            className="w-full py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {step === 4 ? (
              <>
                <Sparkles className="w-5 h-5" /> {t('tripWizard.generatePlan')}
              </>
            ) : (
              <>
                {t('tripWizard.nextStep')} <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
