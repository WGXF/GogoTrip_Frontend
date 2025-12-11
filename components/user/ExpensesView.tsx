
import React, { useState } from 'react';
import { MOCK_EXPENSES } from '../../constants';
import { Expense } from '../../types';
import { 
  Wallet, 
  Calculator, 
  Plus, 
  DollarSign, 
  CreditCard, 
  ShoppingBag, 
  Utensils, 
  Car, 
  Pencil,
  ArrowRightLeft,
  RefreshCw
} from 'lucide-react';

const CalculatorWidget: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [isNewNumber, setIsNewNumber] = useState(true);

  const handleNumber = (num: string) => {
    if (isNewNumber) {
      setDisplay(num);
      setIsNewNumber(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleOperator = (op: string) => {
    setEquation(display + ' ' + op + ' ');
    setIsNewNumber(true);
  };

  const calculate = (expression: string): number => {
    const parts = expression.trim().split(/\s+/);
    if (parts.length < 3) return parseFloat(parts[0]) || 0;
    
    const num1 = parseFloat(parts[0]);
    const op = parts[1];
    const num2 = parseFloat(parts[2]);

    if (isNaN(num1) || isNaN(num2)) return 0;

    switch (op) {
      case '+': return num1 + num2;
      case '-': return num1 - num2;
      case '*': return num1 * num2;
      case '/': return num2 !== 0 ? num1 / num2 : 0;
      default: return 0;
    }
  };

  const handleEqual = () => {
    try {
      const result = calculate(equation + display);
      setDisplay(String(result));
      setEquation('');
      setIsNewNumber(true);
    } catch (e) {
      setDisplay('Error');
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
    setIsNewNumber(true);
  };

  const buttons = [
    { label: 'C', onClick: handleClear, className: 'text-red-500 font-bold bg-red-50 dark:bg-red-900/20' },
    { label: '±', onClick: () => setDisplay(String(Number(display) * -1)), className: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300' },
    { label: '%', onClick: () => setDisplay(String(Number(display) / 100)), className: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300' },
    { label: '÷', onClick: () => handleOperator('/'), className: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 font-bold' },
    { label: '7', onClick: () => handleNumber('7') },
    { label: '8', onClick: () => handleNumber('8') },
    { label: '9', onClick: () => handleNumber('9') },
    { label: '×', onClick: () => handleOperator('*'), className: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 font-bold' },
    { label: '4', onClick: () => handleNumber('4') },
    { label: '5', onClick: () => handleNumber('5') },
    { label: '6', onClick: () => handleNumber('6') },
    { label: '-', onClick: () => handleOperator('-'), className: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 font-bold' },
    { label: '1', onClick: () => handleNumber('1') },
    { label: '2', onClick: () => handleNumber('2') },
    { label: '3', onClick: () => handleNumber('3') },
    { label: '+', onClick: () => handleOperator('+'), className: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 font-bold' },
    { label: '0', onClick: () => handleNumber('0'), className: 'col-span-2 w-full' },
    { label: '.', onClick: () => handleNumber('.') },
    { label: '=', onClick: handleEqual, className: 'bg-sky-500 text-white font-bold shadow-lg shadow-sky-500/30 hover:bg-sky-400' },
  ];

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-700 p-6 rounded-[2rem] shadow-xl">
      <div className="mb-6 bg-slate-100 dark:bg-black/40 rounded-2xl p-4 text-right">
        <div className="text-sm text-slate-400 h-5 mb-1">{equation}</div>
        <div className="text-3xl font-bold text-slate-900 dark:text-white truncate">{Number(display).toLocaleString()}</div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {buttons.map((btn, i) => (
          <button
            key={i}
            onClick={btn.onClick}
            className={`
              h-14 rounded-2xl text-lg font-medium transition-all active:scale-95 hover:brightness-110 flex items-center justify-center
              ${btn.className || 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-100 dark:border-slate-700'}
            `}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const CurrencyConverterWidget: React.FC = () => {
    const [amount, setAmount] = useState('1');
    const [from, setFrom] = useState('USD');
    const [to, setTo] = useState('MYR');
    const [isUpdating, setIsUpdating] = useState(false);
    
    // Extended rates for tourism currencies
    const [rates, setRates] = useState<{[key: string]: number}>({
        'USD': 1,
        'MYR': 4.65,
        'EUR': 0.92,
        'GBP': 0.79,
        'JPY': 148.5,
        'SGD': 1.35,
        'THB': 36.5,
        'KRW': 1350.0,
        'IDR': 15800.0,
        'AUD': 1.55,
        'CNY': 7.25,
        'VND': 24500.0
    });

    const convert = () => {
        const fromRate = rates[from] || 1;
        const toRate = rates[to] || 1;
        const rate = toRate / fromRate;
        return (Number(amount) * rate).toFixed(2);
    };

    const handleSwap = () => {
        const temp = from;
        setFrom(to);
        setTo(temp);
    };

    const handleLiveUpdate = async () => {
        setIsUpdating(true);
        try {
            // Using free Exchange Rate API (Open Exchange Rates derivative)
            const response = await fetch('https://open.er-api.com/v6/latest/USD');
            const data = await response.json();
            
            if (data && data.rates) {
                const newRates = { ...rates };
                Object.keys(newRates).forEach(key => {
                    if (data.rates[key]) {
                        newRates[key] = data.rates[key];
                    }
                });
                setRates(newRates);
            }
        } catch (e) {
            console.error("Failed to fetch rates:", e);
            alert("Could not fetch live rates. Using offline estimates.");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-700 p-6 rounded-[2rem] shadow-xl">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ArrowRightLeft className="w-5 h-5 text-emerald-500" />
                    Currency Converter
                </h3>
                <button 
                    onClick={handleLiveUpdate}
                    disabled={isUpdating}
                    className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500"
                    title="Live Sync"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin text-emerald-500' : ''}`} />
                </button>
             </div>
             
             <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-3 border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between mb-1">
                        <label className="text-xs font-bold text-slate-400">Amount</label>
                        <select 
                            value={from} 
                            onChange={(e) => setFrom(e.target.value)}
                            className="text-xs font-bold bg-transparent text-emerald-600 outline-none cursor-pointer"
                        >
                            {Object.keys(rates).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <input 
                        type="number" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-transparent text-xl font-bold text-slate-900 dark:text-white outline-none"
                    />
                </div>

                <div className="flex justify-center -my-2 relative z-10">
                    <button 
                        onClick={handleSwap}
                        className="bg-white dark:bg-slate-700 p-1.5 rounded-full border border-slate-200 dark:border-slate-600 shadow-sm hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                    >
                        <ArrowRightLeft className="w-4 h-4 text-slate-400 rotate-90" />
                    </button>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-3 border border-slate-200 dark:border-slate-700">
                     <div className="flex justify-between mb-1">
                        <label className="text-xs font-bold text-slate-400">Converted</label>
                        <select 
                            value={to} 
                            onChange={(e) => setTo(e.target.value)}
                            className="text-xs font-bold bg-transparent text-emerald-600 outline-none cursor-pointer"
                        >
                            {Object.keys(rates).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="text-xl font-bold text-slate-900 dark:text-white">
                        {convert()}
                    </div>
                </div>
                
                <p className="text-[10px] text-center text-slate-400 font-medium">
                   1 {from} = {(rates[to] / rates[from]).toFixed(4)} {to}
                </p>
             </div>
        </div>
    );
}

const ExpensesView: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>(MOCK_EXPENSES);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    date: new Date(),
    currency: 'MYR',
    category: 'other'
  });
  const [isAdding, setIsAdding] = useState(false);
  
  // Budget State
  const [budget, setBudget] = useState(8000); 
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(8000);

  const totalSpent = expenses.reduce((sum, item) => sum + item.amount, 0);
  const percentage = Math.min((totalSpent / budget) * 100, 100); 
  const actualPercentage = (totalSpent / budget) * 100;

  const handleAddExpense = () => {
    if (!newExpense.item || !newExpense.amount) return;
    
    const expense: Expense = {
      id: Date.now().toString(),
      item: newExpense.item,
      amount: Number(newExpense.amount),
      date: newExpense.date || new Date(),
      location: newExpense.location || 'Unknown',
      category: newExpense.category as any,
      currency: newExpense.currency || 'MYR'
    };

    setExpenses([expense, ...expenses]);
    setNewExpense({ date: new Date(), currency: 'MYR', category: 'other', item: '', amount: 0, location: '' });
    setIsAdding(false);
  };

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'food': return <Utensils className="w-4 h-4" />;
      case 'transport': return <Car className="w-4 h-4" />;
      case 'shopping': return <ShoppingBag className="w-4 h-4" />;
      case 'entertainment': return <CreditCard className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 md:p-8 w-full mx-auto animate-fade-in-up relative">
      
      {/* Budget Edit Modal */}
      {isEditingBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border border-white/20 dark:border-slate-700 animate-scale-in">
             <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 text-center">Set Trip Budget (MYR)</h3>
             <div className="relative mb-8">
               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">RM</span>
               <input 
                 type="number" 
                 value={tempBudget}
                 onChange={(e) => setTempBudget(Number(e.target.value))}
                 className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 pl-14 pr-4 font-bold text-2xl text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-center"
                 autoFocus
               />
             </div>
             <div className="flex gap-3">
               <button 
                 onClick={() => setIsEditingBudget(false)}
                 className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
               >
                 Cancel
               </button>
               <button 
                 onClick={() => {
                   setBudget(tempBudget);
                   setIsEditingBudget(false);
                 }}
                 className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-500 shadow-lg shadow-emerald-500/30 transition-all active:scale-95"
               >
                 Save Budget
               </button>
             </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: List & Form */}
        <div className="flex-1 space-y-8">
           <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  Travel Wallet
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium ml-14">Track your spending on the go.</p>
              </div>
              <button 
                onClick={() => setIsAdding(!isAdding)}
                className="px-5 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Expense
              </button>
           </div>

           {/* Add Expense Form */}
           {isAdding && (
             <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-xl border border-slate-200 dark:border-slate-700 animate-scale-in">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                 <div>
                   <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Item Name</label>
                   <input 
                    type="text" 
                    placeholder="e.g. Sushi Dinner"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-sky-500/20 outline-none"
                    value={newExpense.item || ''}
                    onChange={e => setNewExpense({...newExpense, item: e.target.value})}
                   />
                 </div>
                 <div>
                   <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Amount</label>
                   <input 
                    type="number" 
                    placeholder="0.00"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-sky-500/20 outline-none"
                    value={newExpense.amount || ''}
                    onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})}
                   />
                 </div>
                 <div>
                   <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Category</label>
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
                 <div>
                   <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Location</label>
                   <input 
                    type="text" 
                    placeholder="e.g. Kyoto Station"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-medium outline-none"
                    value={newExpense.location || ''}
                    onChange={e => setNewExpense({...newExpense, location: e.target.value})}
                   />
                 </div>
               </div>
               <div className="flex gap-3">
                 <button onClick={() => setIsAdding(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors">Cancel</button>
                 <button onClick={handleAddExpense} className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 transition-all active:scale-95">Save Expense</button>
               </div>
             </div>
           )}

           {/* Expenses List */}
           <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
              {expenses.length === 0 ? (
                <div className="text-center py-10 text-slate-400">No expenses recorded yet.</div>
              ) : (
                expenses.map((expense) => (
                  <div key={expense.id} className="group bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/60 dark:border-slate-700/50 rounded-2xl p-4 flex items-center justify-between hover:scale-[1.01] hover:shadow-lg transition-all duration-300">
                     <div className="flex items-center gap-4">
                       <div className={`
                         w-12 h-12 rounded-xl flex items-center justify-center
                         ${expense.category === 'food' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 
                           expense.category === 'transport' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                           expense.category === 'shopping' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                           'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}
                       `}>
                         {getCategoryIcon(expense.category)}
                       </div>
                       <div>
                         <h4 className="font-bold text-slate-900 dark:text-white">{expense.item}</h4>
                         <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                           <span>{expense.date.toLocaleDateString()}</span>
                           <span>•</span>
                           <span>{expense.location}</span>
                         </div>
                       </div>
                     </div>
                     <div className="text-right">
                       <p className="text-lg font-bold text-slate-900 dark:text-white">
                         RM {expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                       </p>
                       <p className="text-xs font-bold text-slate-400 uppercase">{expense.currency}</p>
                     </div>
                  </div>
                ))
              )}
           </div>
        </div>

        {/* Right Column: Stats & Calculator */}
        <div className="w-full lg:w-96 space-y-8">
           {/* Total Spent Card */}
           <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
              
              <div className="flex justify-between items-start mb-1 relative z-10">
                 <p className="text-emerald-100 font-bold uppercase tracking-wider text-xs">Total Spent</p>
                 <button 
                   onClick={() => {
                     setTempBudget(budget);
                     setIsEditingBudget(true);
                   }}
                   className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white backdrop-blur-md"
                   title="Edit Budget"
                 >
                   <Pencil className="w-3.5 h-3.5" />
                 </button>
              </div>

              <h3 className="text-4xl font-black mb-4 relative z-10">RM {totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
              
              <div className="w-full bg-black/20 rounded-full h-2 mb-2 overflow-hidden relative z-10">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${actualPercentage > 100 ? 'bg-red-400' : 'bg-white'}`} 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between text-xs font-medium text-emerald-100 relative z-10">
                <span>Budget: RM {budget.toLocaleString()}</span>
                <span className={actualPercentage > 100 ? 'text-red-200 font-bold' : ''}>
                   {actualPercentage.toFixed(0)}% Used
                </span>
              </div>
           </div>
           
           {/* Currency Converter Widget */}
           <div>
             <CurrencyConverterWidget />
           </div>

           {/* Calculator Widget */}
           <div>
             <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
               <Calculator className="w-5 h-5 text-sky-500" />
               Quick Calculator
             </h3>
             <CalculatorWidget />
           </div>
        </div>

      </div>
    </div>
  );
};

export default ExpensesView;
