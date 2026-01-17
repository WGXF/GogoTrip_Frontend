import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wallet, 
  Plus, 
  DollarSign, 
  ShoppingBag, 
  Utensils, 
  Car,
  ChevronDown,
  MapPin,
  Calendar,
  TrendingUp,
  TrendingDown,
  Edit3,
  Check,
  X,
  AlertCircle,
  Loader2,
  Hotel,
  Film,
  Plane,
  CheckCircle2,
  Info,
  Trash2
} from 'lucide-react';

// ==========================================
// Types
// ==========================================
interface ActiveTrip {
  id: number;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  status: string;
  budget: number;
  total_spent: number;
  expense_count: number;
}

interface TripStats {
  trip_id: number;
  trip_title: string;
  trip_destination: string;
  budget: number;
  total_spent: number;
  remaining: number;
  budget_percentage: number;
  expense_count: number;
  by_category: Record<string, number>;
  is_over_budget: boolean;
}

interface TripExpense {
  id: number;
  title: string;
  amount: number;
  category: string;
  date: string;
  trip_id: number;
}

// ==========================================
// Sub-Components
// ==========================================

interface TripSelectorProps {
  trips: ActiveTrip[];
  selectedTripId: number | null;
  onSelectTrip: (tripId: number) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const TripSelector: React.FC<TripSelectorProps> = ({ trips, selectedTripId, onSelectTrip, isOpen, onToggle }) => {
  const selectedTrip = trips.find(t => t.id === selectedTripId);
  
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 flex items-center justify-between hover:border-emerald-400 transition-all shadow-sm"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <Plane className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Trip</p>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {selectedTrip ? selectedTrip.title : 'Select a trip'}
            </h3>
            {selectedTrip && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {selectedTrip.destination} • {selectedTrip.expense_count} expenses
              </p>
            )}
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl max-h-96 overflow-y-auto custom-scrollbar">
          {trips.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                No active trips
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Create an active trip in Travel page first
              </p>
            </div>
          ) : (
            <div className="py-2">
              {trips.map((trip) => (
                <button
                  key={trip.id}
                  onClick={() => {
                    onSelectTrip(trip.id);
                    onToggle();
                  }}
                  className={`
                    w-full px-6 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors
                    ${trip.id === selectedTripId ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}
                  `}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                        {trip.title}
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                        {trip.destination}
                      </p>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-slate-400">
                          Budget: RM {trip.budget.toLocaleString()}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-400">
                          {trip.expense_count} expenses
                        </span>
                      </div>
                    </div>
                    {trip.id === selectedTripId && (
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface BudgetCardProps {
  stats: TripStats | null;
  onEditBudget: () => void;
}

const BudgetCard: React.FC<BudgetCardProps> = ({ stats, onEditBudget }) => {
  if (!stats) {
    return (
      <div className="bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-[2.5rem] p-8 text-slate-500 dark:text-slate-400 shadow-xl">
        <p className="text-center">Select a trip to view budget</p>
      </div>
    );
  }
  
  const percentage = Math.min(stats.budget_percentage, 100);
  const isOverBudget = stats.is_over_budget;
  
  return (
    <div className={`
      bg-gradient-to-br rounded-[2.5rem] p-8 text-white shadow-xl
      ${isOverBudget 
        ? 'from-red-500 to-red-600 shadow-red-500/20' 
        : 'from-emerald-500 to-teal-600 shadow-emerald-500/20'}
    `}>
      <div className="flex justify-between items-start mb-1">
        <p className={`font-bold uppercase tracking-wider text-xs ${isOverBudget ? 'text-red-100' : 'text-emerald-100'}`}>
          {isOverBudget ? 'Over Budget!' : 'Total Spent'}
        </p>
        <button
          onClick={onEditBudget}
          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
        >
          <Edit3 className="w-4 h-4" />
        </button>
      </div>
      
      <h3 className="text-4xl font-black mb-1">
        RM {stats.total_spent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </h3>
      
      <p className="text-sm mb-4 opacity-90">
        of RM {stats.budget.toLocaleString()} budget
      </p>
      
      <div className="w-full bg-black/20 rounded-full h-2 mb-2 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ease-out ${isOverBudget ? 'bg-red-200' : 'bg-white'}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      
      <div className="flex justify-between text-xs font-medium opacity-90">
        <span>{percentage.toFixed(0)}% Used</span>
        <span className="flex items-center gap-1">
          {isOverBudget ? (
            <>
              <TrendingUp className="w-3 h-3" />
              RM {Math.abs(stats.remaining).toLocaleString()} over
            </>
          ) : (
            <>
              <TrendingDown className="w-3 h-3" />
              RM {stats.remaining.toLocaleString()} left
            </>
          )}
        </span>
      </div>
      
      {/* Category Stats */}
      {Object.keys(stats.by_category).length > 0 && (
        <div className="mt-6 pt-6 border-t border-white/20">
          <p className="text-xs font-bold uppercase tracking-wider mb-3 opacity-75">
            Spending by Category
          </p>
          <div className="space-y-2">
            {Object.entries(stats.by_category)
              .sort(([, a]: [string, number], [, b]: [string, number]) => b - a)
              .slice(0, 3)
              .map(([category, amount]) => (
                <div key={category} className="flex justify-between text-sm">
                  <span className="capitalize opacity-90">{category}</span>
                  <span className="font-bold">RM {amount.toLocaleString()}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// Main Component
// ==========================================
const ExpensesView: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [activeTrips, setActiveTrips] = useState<ActiveTrip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [tripStats, setTripStats] = useState<TripStats | null>(null);
  const [expenses, setExpenses] = useState<TripExpense[]>([]);
  
  const [isLoadingTrips, setIsLoadingTrips] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);
  
  const [isTripSelectorOpen, setIsTripSelectorOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [newBudget, setNewBudget] = useState('');
  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<number | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  
  const [newExpense, setNewExpense] = useState({
    title: '',
    amount: 0,
    category: 'food' as 'food' | 'transport' | 'accommodation' | 'shopping' | 'entertainment' | 'other'
  });

  // Helper: Toast
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // --- API Functions ---
  
  const fetchActiveTrips = async () => {
    setIsLoadingTrips(true);
    setError(null);
    try {
      const response = await fetch('/api/expenses/active-trips', { credentials: 'include' });
      
      if (response.ok) {
        const data = await response.json();
        setActiveTrips(data.trips || []);
        
        if (data.trips && data.trips.length > 0 && !selectedTripId) {
          setSelectedTripId(data.trips[0].id);
        } else if (!data.hasActiveTrips) {
          setError('No active trips found. Please create an active trip in Travel page.');
        }
      } else if (response.status === 401) {
        setError('Please log in to continue');
      } else {
        setError('Failed to load trips');
      }
    } catch (err) {
      console.error('Error fetching active trips:', err);
      setError('Network error');
    } finally {
      setIsLoadingTrips(false);
    }
  };
  
  const fetchTripStats = async (tripId: number) => {
    setIsLoadingStats(true);
    try {
      const response = await fetch(`/api/expenses/trips/${tripId}/stats`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setTripStats(data);
      }
    } catch (err) {
      console.error('Error fetching trip stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };
  
  const fetchTripExpenses = async (tripId: number) => {
    setIsLoadingExpenses(true);
    try {
      const response = await fetch(`/api/expenses/trips/${tripId}`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setExpenses(data.expenses || []);
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setIsLoadingExpenses(false);
    }
  };
  
  const updateBudget = async () => {
    if (!selectedTripId || !newBudget) return;
    
    try {
      const response = await fetch(`/api/expenses/trips/${selectedTripId}/budget`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ budget: parseFloat(newBudget) })
      });
      
      if (response.ok) {
        setIsEditingBudget(false);
        setNewBudget('');
        fetchTripStats(selectedTripId);
        fetchActiveTrips();
        showToast('Budget updated successfully!', 'success');
      } else {
        const errorData = await response.json();
        showToast(`Failed to update budget: ${errorData.error}`, 'error');
      }
    } catch (err) {
      console.error('Error updating budget:', err);
      showToast('Failed to update budget', 'error');
    }
  };
  
  const handleAddExpense = async () => {
    if (!newExpense.title || !newExpense.amount) {
      showToast('Please fill in title and amount', 'info');
      return;
    }
    
    if (!selectedTripId) {
      showToast('Please select a trip first', 'info');
      return;
    }
    
    try {
      const response = await fetch('/api/expenses/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: newExpense.title,
          amount: newExpense.amount,
          category: newExpense.category,
          trip_id: selectedTripId,
          transaction_date: new Date().toISOString().split('T')[0]
        })
      });
      
      if (response.ok) {
        setNewExpense({
          title: '',
          amount: 0,
          category: 'food'
        });
        setIsAdding(false);
        fetchTripStats(selectedTripId);
        fetchTripExpenses(selectedTripId);
        fetchActiveTrips();
        showToast('Expense added successfully!', 'success');
      } else {
        const errorData = await response.json();
        showToast(`Failed to add expense: ${errorData.error}`, 'error');
      }
    } catch (err) {
      console.error('Error adding expense:', err);
      showToast('Failed to add expense', 'error');
    }
  };
  
  const executeDeleteExpense = async () => {
    if (!expenseToDelete) return;
    
    try {
      const response = await fetch(`/api/expenses/${expenseToDelete}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok && selectedTripId) {
        fetchTripStats(selectedTripId);
        fetchTripExpenses(selectedTripId);
        fetchActiveTrips();
        showToast('Expense deleted successfully', 'success');
      } else {
        showToast('Failed to delete expense', 'error');
      }
    } catch (err) {
      console.error('Error deleting expense:', err);
      showToast('Failed to delete expense', 'error');
    } finally {
      setExpenseToDelete(null);
    }
  };

  // --- Effects ---
  
  useEffect(() => {
    fetchActiveTrips();
  }, []);
  
  useEffect(() => {
    if (selectedTripId) {
      fetchTripStats(selectedTripId);
      fetchTripExpenses(selectedTripId);
    }
  }, [selectedTripId]);

  // --- UI Helpers ---
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'food': return <Utensils className="w-5 h-5" />;
      case 'transport': return <Car className="w-5 h-5" />;
      case 'shopping': return <ShoppingBag className="w-5 h-5" />;
      case 'accommodation': return <Hotel className="w-5 h-5" />;
      case 'entertainment': return <Film className="w-5 h-5" />;
      default: return <DollarSign className="w-5 h-5" />;
    }
  };
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'food': return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
      case 'transport': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      case 'shopping': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
      case 'accommodation': return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400';
      case 'entertainment': return 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400';
      default: return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
    }
  };

  // --- Render ---
  
  if (isLoadingTrips) {
    return (
      <div className="p-6 md:p-8 max-w-[1800px] mx-auto flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-slate-500">Loading trips...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 md:p-8 max-w-[1800px] mx-auto">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-6 flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100 mb-1">
              No Active Trips
            </h3>
            <p className="text-amber-700 dark:text-amber-300 mb-4">
              {error}
            </p>
            {/* 🔥 Wire Navigation Logic */}
            <button
              onClick={() => navigate('/travel')}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
            >
              Go to Travel Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-[1800px] mx-auto animate-fade-in-up relative">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl animate-fade-in-up transition-all ${
          toast.type === 'error' 
            ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' 
            : toast.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
            : 'bg-white text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <Info className="w-5 h-5" />}
          <span className="font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {expenseToDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
           <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border border-white/20 dark:border-slate-700 text-center animate-scale-in">
              <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete Expense?</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium leading-relaxed text-sm">
                This item will be removed from your spending history. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setExpenseToDelete(null)} 
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  onClick={executeDeleteExpense} 
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  Yes, Delete
                </button>
              </div>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_384px] gap-8">
        {/* Left Column: Expenses */}
        <div className="space-y-8">
          {/* Page Header */}
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                Trip Wallet
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium ml-14">
                Track expenses for each active trip.
              </p>
            </div>
            <button 
              onClick={() => setIsAdding(!isAdding)}
              disabled={!selectedTripId}
              className="px-5 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Add Expense
            </button>
          </div>
          
          {/* Trip Selector */}
          <TripSelector
            trips={activeTrips}
            selectedTripId={selectedTripId}
            onSelectTrip={setSelectedTripId}
            isOpen={isTripSelectorOpen}
            onToggle={() => setIsTripSelectorOpen(!isTripSelectorOpen)}
          />
          
          {/* Add Expense Form */}
          {isAdding && (
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-xl border border-slate-200 dark:border-slate-700 animate-scale-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                    Item Name
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Sushi Dinner"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    value={newExpense.title}
                    onChange={e => setNewExpense({...newExpense, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                    Amount
                  </label>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    value={newExpense.amount || ''}
                    onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                    Category
                  </label>
                  <select 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-medium outline-none"
                    value={newExpense.category}
                    onChange={e => setNewExpense({...newExpense, category: e.target.value as any})}
                  >
                    <option value="food">Food & Drink</option>
                    <option value="transport">Transportation</option>
                    <option value="accommodation">Accommodation</option>
                    <option value="shopping">Shopping</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/50 rounded-xl mb-4">
                <p className="text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <MapPin className="w-3 h-3" />
                  <span>
                    This expense will be added to <strong>{tripStats?.trip_title}</strong>
                  </span>
                </p>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setIsAdding(false);
                    setNewExpense({title: '', amount: 0, category: 'food'});
                  }} 
                  className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddExpense} 
                  className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 transition-all active:scale-95"
                >
                  Save Expense
                </button>
              </div>
            </div>
          )}
          
          {/* Expenses List */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Recent Transactions
              {expenses.length > 0 && (
                <span className="text-sm font-normal text-slate-400 ml-2">
                  ({expenses.length} total)
                </span>
              )}
            </h3>
            
            {isLoadingExpenses ? (
              <div className="text-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
                <p className="text-slate-400">Loading expenses...</p>
              </div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <DollarSign className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No expenses yet for this trip.</p>
              </div>
            ) : (
              expenses.map((expense) => (
                <div 
                  key={expense.id} 
                  className="group bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/60 dark:border-slate-700/50 rounded-2xl p-4 flex items-center justify-between hover:scale-[1.01] hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getCategoryColor(expense.category)}`}>
                      {getCategoryIcon(expense.category)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 dark:text-white">
                        {expense.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                        <span>{expense.date ? new Date(expense.date).toLocaleDateString() : 'No date'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        RM {expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs font-bold text-slate-400 uppercase">
                        {expense.category}
                      </p>
                    </div>
                    <button
                      onClick={() => setExpenseToDelete(expense.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Right Column: Stats */}
        <div className="w-full space-y-8">
          {/* Budget Card */}
          <BudgetCard
            stats={tripStats}
            onEditBudget={() => {
              setIsEditingBudget(true);
              setNewBudget(tripStats?.budget.toString() || '');
            }}
          />
          
          {/* Edit Budget Modal */}
          {isEditingBudget && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full animate-scale-in">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                  Update Budget
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Set the budget for <strong>{tripStats?.trip_title}</strong>
                </p>
                <input
                  type="number"
                  placeholder="Enter budget amount"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none mb-4"
                  value={newBudget}
                  onChange={e => setNewBudget(e.target.value)}
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setIsEditingBudget(false);
                      setNewBudget('');
                    }}
                    className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateBudget}
                    className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 transition-all"
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpensesView;