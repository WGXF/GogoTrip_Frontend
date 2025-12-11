
import React, { useState } from 'react';
import { User, PaymentMethod, Transaction } from '../../types';
import { 
  CreditCard, 
  Smartphone, 
  Landmark, 
  Plus, 
  Trash2,
  Download,
  X,
  Wallet,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Settings,
  ArrowRightLeft,
  RefreshCw
} from 'lucide-react';

interface BillingViewProps {
  user: User;
  onUpdateUser: (updatedUser: Partial<User>) => void;
}

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

const BillingView: React.FC<BillingViewProps> = ({ user, onUpdateUser }) => {
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [newPaymentType, setNewPaymentType] = useState<'card' | 'ewallet' | 'banking'>('card');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  // Authentication Simulation State
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [authStep, setAuthStep] = useState<'connecting' | 'approve' | 'success'>('connecting');
  const [pendingMethod, setPendingMethod] = useState<PaymentMethod | null>(null);

  // Validation Errors State
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Delete Confirmation State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // New Payment Form Data
  const [newPaymentData, setNewPaymentData] = useState({
    identifier: '', // Card Num, Phone, or Account Num
    expiry: '',
    cvv: '',
    bankName: 'Maybank2u',
    nickname: ''
  });

  // --- INPUT FORMATTING ---
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (val.length > 4) val = val.slice(0, 4); // Limit to 4 digits (MMYY)
    
    if (val.length > 2) {
        val = `${val.slice(0, 2)}/${val.slice(2)}`;
    }
    
    setNewPaymentData(prev => ({ ...prev, expiry: val }));
    
    // Clear error if format looks okay length-wise
    if (val.length === 5) {
        setErrors(prev => {
            const newErrs = { ...prev };
            delete newErrs.expiry;
            return newErrs;
        });
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove all non-digits
    let val = e.target.value.replace(/\D/g, '');
    
    // Limit to 16 digits
    if (val.length > 16) val = val.slice(0, 16);
    
    // Add space every 4 digits
    // This regex looks for every 4 digits that are followed by another digit
    const formatted = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    
    setNewPaymentData(prev => ({ ...prev, identifier: formatted }));
    
    // Clear error if we have 16 digits
    if (val.length === 16) {
        setErrors(prev => {
            const newErrs = { ...prev };
            delete newErrs.identifier;
            return newErrs;
        });
    }
  };

  // --- VALIDATION LOGIC ---
  const validateExpiry = (expiry: string): string | null => {
    // Check format MM/YY
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      return "Format must be MM/YY";
    }
    
    const [monthStr, yearStr] = expiry.split('/');
    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);

    // Check month range
    if (month < 1 || month > 12) {
      return "Invalid month (01-12)";
    }

    // Check if expired
    const now = new Date();
    const currentYear = now.getFullYear() % 100; // Last 2 digits
    const currentMonth = now.getMonth() + 1;

    if (year < currentYear) {
      return "Card has expired";
    }
    if (year === currentYear && month < currentMonth) {
      return "Card has expired";
    }

    return null;
  };

  const validateInputs = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    // Common Identifier Validation
    if (!newPaymentData.identifier) {
        newErrors.identifier = "This field is required";
        isValid = false;
    }

    if (newPaymentType === 'card') {
        // Card Number
        const cleanNum = newPaymentData.identifier.replace(/\D/g, '');
        if (cleanNum.length !== 16) {
            newErrors.identifier = "Card number must be 16 digits";
            isValid = false;
        }

        // Expiry
        if (!newPaymentData.expiry) {
            newErrors.expiry = "Required";
            isValid = false;
        } else {
            const expiryError = validateExpiry(newPaymentData.expiry);
            if (expiryError) {
                newErrors.expiry = expiryError;
                isValid = false;
            }
        }

        // CVV
        if (!newPaymentData.cvv) {
            newErrors.cvv = "Required";
            isValid = false;
        } else if (newPaymentData.cvv.length < 3) {
            newErrors.cvv = "Invalid CVV";
            isValid = false;
        }
    }

    setErrors(newErrors);
    return isValid;
  };

  // --- FORM HANDLERS ---
  const handleNewTypeChange = (type: 'card' | 'ewallet' | 'banking') => {
      setNewPaymentType(type);
      setErrors({}); // Clear errors on switch
      setNewPaymentData(prev => ({
          ...prev,
          identifier: '',
          expiry: '',
          cvv: '',
          nickname: ''
      }));
  };

  const initiateAddPayment = () => {
    if (!validateInputs()) return;

    // 2. Prepare Object
    let displayIdentifier = newPaymentData.identifier;
    let finalProvider = '';

    if (newPaymentType === 'card') {
      const cleanNum = newPaymentData.identifier.replace(/\D/g, '');
      const lastFour = cleanNum.slice(-4);
      displayIdentifier = `•••• ${lastFour}`;
      finalProvider = 'Visa';
    } else if (newPaymentType === 'ewallet') {
        finalProvider = "Touch 'n Go";
    } else {
        finalProvider = newPaymentData.bankName;
    }

    // Determine Nickname logic
    let finalNickname = newPaymentData.nickname;
    if (!finalNickname) {
        if (newPaymentType === 'card') finalNickname = 'My Card';
        else if (newPaymentType === 'banking') finalNickname = 'My Travel Account';
        else finalNickname = finalProvider;
    }

    const newMethod: PaymentMethod = {
      id: Date.now().toString(),
      type: newPaymentType,
      provider: finalProvider,
      identifier: displayIdentifier,
      expiry: newPaymentType === 'card' ? newPaymentData.expiry : undefined,
      isDefault: false,
      nickname: finalNickname
    };

    // 3. Check if Simulation Needed (Banking & eWallet)
    if (newPaymentType === 'ewallet' || newPaymentType === 'banking') {
        setPendingMethod(newMethod);
        setIsAddingPayment(false);
        setIsAuthorizing(true);
        setAuthStep('connecting');
        setTimeout(() => setAuthStep('approve'), 2000);
        return;
    }

    // Direct save for card
    savePaymentMethod(newMethod);
  };

  const savePaymentMethod = (method: PaymentMethod) => {
    const updatedMethods = [...(user.paymentMethods || []), method];
    onUpdateUser({ paymentMethods: updatedMethods });
    
    // Reset & Close
    setIsAddingPayment(false);
    setIsAuthorizing(false);
    setPendingMethod(null);
    setNewPaymentData({ identifier: '', expiry: '', cvv: '', bankName: 'Maybank2u', nickname: '' });
    setErrors({});
  };

  const handleSetDefault = (id: string) => {
    const updatedMethods = user.paymentMethods?.map(pm => ({
      ...pm,
      isDefault: pm.id === id
    }));
    onUpdateUser({ paymentMethods: updatedMethods });
    setSelectedMethod(null);
  };

  const initiateDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (!deleteConfirmId) return;
    
    const currentMethods = user.paymentMethods || [];
    const updatedMethods = currentMethods.filter(pm => pm.id !== deleteConfirmId);
    onUpdateUser({ paymentMethods: updatedMethods });
    
    // If we deleted the method currently shown in modal, close modal
    if (selectedMethod?.id === deleteConfirmId) {
        setSelectedMethod(null);
    }
    
    setDeleteConfirmId(null);
  };

  const generateInvoicePDF = (tx: Transaction) => {
    const invoiceContent = `
      <html>
      <head>
        <title>Invoice #${tx.id}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #0284c7; }
          .invoice-title { font-size: 32px; font-weight: bold; color: #333; text-align: right; }
          .info-section { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .bill-to h3, .pay-to h3 { font-size: 14px; color: #888; text-transform: uppercase; margin-bottom: 10px; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .table th { text-align: left; padding: 15px; background: #f9fafb; border-bottom: 1px solid #eee; font-size: 12px; uppercase; color: #666; }
          .table td { padding: 15px; border-bottom: 1px solid #eee; }
          .total-section { text-align: right; }
          .total-row { display: flex; justify-content: flex-end; gap: 40px; font-size: 14px; margin-bottom: 10px; }
          .grand-total { font-size: 24px; font-weight: bold; color: #0284c7; }
          .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">GogoTrip</div>
          <div>
            <div class="invoice-title">INVOICE</div>
            <p style="text-align: right; color: #666;">#${tx.id.toUpperCase()}</p>
            <p style="text-align: right; color: #666;">Date: ${tx.date.toLocaleDateString()}</p>
          </div>
        </div>

        <div class="info-section">
          <div class="bill-to">
            <h3>Bill To:</h3>
            <p><strong>${user.name}</strong></p>
            <p>${user.email}</p>
          </div>
          <div class="pay-to">
            <h3>Pay To:</h3>
            <p><strong>GogoTrip Inc.</strong></p>
            <p>123 Travel Tower, KL Eco City</p>
            <p>Kuala Lumpur, 59200, MY</p>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Status</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${tx.description}</td>
              <td>${tx.status.toUpperCase()}</td>
              <td style="text-align: right;">${tx.currency} ${tx.amount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div class="total-section">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>${tx.currency} ${tx.amount.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>Tax (0%):</span>
            <span>${tx.currency} 0.00</span>
          </div>
          <div class="total-row" style="margin-top: 15px;">
            <span class="grand-total">Total: ${tx.currency} ${tx.amount.toFixed(2)}</span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for choosing GogoTrip! If you have any questions, please contact support@gogotrip.com</p>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(invoiceContent);
      printWindow.document.close();
    }
  };

  const isPremium = user.subscription?.plan === 'premium';

  return (
    <div className="p-6 md:p-8 w-full max-w-5xl mx-auto animate-fade-in-up">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Wallet className="w-6 h-6 text-slate-600 dark:text-slate-300" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Billing & Subscription</h2>
      </div>

      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-sm border border-transparent hover:border-sky-300 dark:hover:border-indigo-500 transition-all duration-500 ease-out">
        
          <div className="space-y-10 animate-fade-in">
             {/* Current Plan */}
             <div className={`
               rounded-[2rem] p-8 shadow-xl relative overflow-hidden text-white
               ${isPremium 
                 ? 'bg-gradient-to-br from-slate-900 to-slate-800' 
                 : 'bg-gradient-to-br from-sky-500 to-blue-600'}
             `}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                   <div>
                      <div className="flex items-center gap-3 mb-2">
                         <h3 className="text-3xl font-black tracking-tight">
                           {isPremium ? 'GogoTrip Premium' : 'GogoTrip Basic'}
                         </h3>
                         <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider">Active</span>
                      </div>
                      {isPremium ? (
                        <p className="text-slate-300 font-medium max-w-md">Your subscription renews automatically on {user.subscription?.endDate.toLocaleDateString()}.</p>
                      ) : (
                        <p className="text-sky-100 font-medium max-w-md">Upgrade to Premium for unlimited AI planning and advanced features.</p>
                      )}
                   </div>
                   <div className="flex gap-3">
                      {isPremium ? (
                        <button className="px-5 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-sm font-bold transition-colors">
                           Cancel Plan
                        </button>
                      ) : (
                        <button className="px-5 py-3 bg-white text-sky-600 rounded-xl text-sm font-bold hover:bg-sky-50 transition-colors shadow-lg">
                           Upgrade Now
                        </button>
                      )}
                   </div>
                </div>
             </div>

             {/* Payment Methods */}
             <div>
                <div className="flex items-center justify-between mb-6">
                   <h3 className="text-xl font-bold text-slate-900 dark:text-white">Payment Methods</h3>
                   <button 
                     type="button"
                     onClick={() => {
                         setNewPaymentType('card');
                         setErrors({});
                         setIsAddingPayment(true);
                     }}
                     className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                   >
                      <Plus className="w-4 h-4" /> Add Method
                   </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {user.paymentMethods?.map((method) => (
                      <div 
                        key={method.id} 
                        className="group relative p-5 border border-slate-200 dark:border-slate-700/50 rounded-2xl bg-white/50 dark:bg-slate-800/30 flex items-center justify-between hover:border-sky-300 dark:hover:border-indigo-500 transition-all hover:shadow-lg"
                      >
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center">
                               {method.type === 'card' && <CreditCard className="w-6 h-6 text-slate-600 dark:text-slate-300" />}
                               {method.type === 'ewallet' && <Smartphone className="w-6 h-6 text-blue-500" />}
                               {method.type === 'banking' && <Landmark className="w-6 h-6 text-emerald-500" />}
                            </div>
                            <div>
                               <p className="font-bold text-slate-900 dark:text-white">{method.nickname || method.provider}</p>
                               <div className="flex items-center gap-2 text-xs text-slate-500">
                                  <span>{method.identifier}</span>
                                  {method.type === 'card' && method.expiry && <span>• Exp {method.expiry}</span>}
                                  {method.isDefault && <span className="bg-sky-100 text-sky-700 dark:bg-indigo-900/30 dark:text-indigo-300 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Default</span>}
                               </div>
                            </div>
                         </div>
                         
                         <div className="flex gap-2 relative z-20">
                            {/* Manage Button (Settings) */}
                            <button
                                type="button"
                                onClick={() => setSelectedMethod(method)}
                                className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-700 rounded-xl transition-all"
                                title="Manage"
                            >
                                <Settings className="w-4 h-4" />
                            </button>
                         </div>
                      </div>
                   ))}
                </div>

                {/* --- Transaction Auth Modal (Simulation) --- */}
                {isAuthorizing && pendingMethod && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl animate-scale-in">
                            {/* Header */}
                            <div className="bg-slate-100 dark:bg-slate-800 p-6 text-center border-b border-slate-200 dark:border-slate-700">
                                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Transaction Authorization</h3>
                                <p className="text-xs text-slate-500 mt-1">Secure Payment Gateway</p>
                            </div>
                            
                            <div className="p-8 text-center">
                                {authStep === 'connecting' && (
                                    <div className="space-y-4">
                                        <Loader2 className="w-12 h-12 text-sky-600 animate-spin mx-auto" />
                                        <p className="text-slate-600 dark:text-slate-300 font-medium">Connecting to {pendingMethod.provider}...</p>
                                    </div>
                                )}
                                
                                {authStep === 'approve' && (
                                    <div className="space-y-6">
                                        <div className="w-16 h-16 bg-sky-100 dark:bg-indigo-900/30 text-sky-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto">
                                            <ShieldCheck className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <p className="text-slate-900 dark:text-white font-bold text-lg mb-2">Requesting Authorization</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                Please approve the linking request sent to your {pendingMethod.provider} account ending in {pendingMethod.identifier.slice(-4)}.
                                            </p>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                setAuthStep('success');
                                                setTimeout(() => savePaymentMethod(pendingMethod), 1500);
                                            }}
                                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95"
                                        >
                                            Approve Transaction
                                        </button>
                                    </div>
                                )}

                                {authStep === 'success' && (
                                    <div className="space-y-4">
                                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                                            <CheckCircle2 className="w-8 h-8" />
                                        </div>
                                        <p className="text-emerald-600 font-bold text-lg">Successfully Linked!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {deleteConfirmId && (
                   <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border border-white/20 dark:border-slate-700 text-center animate-scale-in">
                         <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
                           <Trash2 className="w-8 h-8" />
                         </div>
                         <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Remove Method?</h3>
                         <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium leading-relaxed">
                           Are you sure you want to remove this payment method? This action cannot be undone.
                         </p>
                         
                         <div className="flex gap-3">
                           <button 
                             type="button"
                             onClick={() => setDeleteConfirmId(null)}
                             className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                           >
                             Cancel
                           </button>
                           <button 
                             type="button"
                             onClick={confirmDelete}
                             className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                           >
                             Yes, Remove
                           </button>
                         </div>
                      </div>
                   </div>
                )}

                {/* Method Details Modal */}
                {selectedMethod && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] p-6 shadow-2xl border border-white/20 dark:border-slate-700 animate-scale-in">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="font-bold text-lg dark:text-white">Manage Method</h3>
                          <button type="button" onClick={() => setSelectedMethod(null)}><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl mb-6">
                           <p className="font-bold text-slate-900 dark:text-white mb-1">{selectedMethod.provider}</p>
                           <p className="text-sm text-slate-500">{selectedMethod.identifier}</p>
                           {selectedMethod.nickname && <p className="text-xs text-slate-400 mt-2">"{selectedMethod.nickname}"</p>}
                        </div>
                        <div className="space-y-3">
                           {!selectedMethod.isDefault && (
                             <button 
                               type="button"
                               onClick={() => handleSetDefault(selectedMethod.id)}
                               className="w-full py-3 bg-sky-50 dark:bg-indigo-900/20 text-sky-600 dark:text-indigo-400 font-bold rounded-xl text-sm hover:bg-sky-100 dark:hover:bg-indigo-900/40 transition-colors"
                             >
                               Set as Default
                             </button>
                           )}
                           <button 
                             type="button"
                             onClick={() => initiateDelete(selectedMethod.id)}
                             className="w-full py-3 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 text-red-500 font-bold rounded-xl text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2"
                           >
                             <Trash2 className="w-4 h-4" />
                             Delete Method
                           </button>
                        </div>
                    </div>
                  </div>
                )}

                {/* Add Payment Modal */}
                {isAddingPayment && (
                   <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fade-in">
                     <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2rem] p-8 shadow-2xl border border-white/20 dark:border-slate-700 animate-scale-in max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                          <h4 className="text-xl font-bold text-slate-900 dark:text-white">Add Payment Method</h4>
                          <button type="button" onClick={() => setIsAddingPayment(false)}><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        
                        <div className="flex gap-2 mb-6 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                           {(['card', 'ewallet', 'banking'] as const).map(type => (
                              <button
                                key={type}
                                type="button"
                                onClick={() => handleNewTypeChange(type)}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                                  newPaymentType === type 
                                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                              >
                                 {type === 'card' ? 'Card' : type === 'ewallet' ? 'eWallet' : 'Banking'}
                              </button>
                           ))}
                        </div>
                        
                        <div className="space-y-4 mb-8">
                           {/* Nickname Field - Only for Card */}
                           {newPaymentType === 'card' && (
                               <div>
                                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Nickname (Optional)</label>
                                  <input 
                                    type="text" 
                                    placeholder="e.g. My Travel Card"
                                    value={newPaymentData.nickname}
                                    onChange={e => setNewPaymentData({...newPaymentData, nickname: e.target.value})}
                                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-sky-500 transition-colors" 
                                  />
                               </div>
                           )}

                           {newPaymentType === 'card' && (
                              <>
                                <div>
                                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Card Number</label>
                                  <input 
                                    type="text" 
                                    placeholder="0000 0000 0000 0000" 
                                    value={newPaymentData.identifier}
                                    maxLength={19}
                                    onChange={handleCardNumberChange}
                                    className={`w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border ${errors.identifier ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-slate-200 dark:border-slate-700'} outline-none focus:border-sky-500 transition-colors`} 
                                  />
                                  {errors.identifier && <p className="text-red-500 text-xs mt-1 font-medium">{errors.identifier}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Expiry</label>
                                    <input 
                                      type="text" 
                                      placeholder="MM/YY" 
                                      maxLength={5}
                                      value={newPaymentData.expiry}
                                      onChange={handleExpiryChange}
                                      className={`w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border ${errors.expiry ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-slate-200 dark:border-slate-700'} outline-none focus:border-sky-500 transition-colors`} 
                                    />
                                    {errors.expiry && <p className="text-red-500 text-xs mt-1 font-medium">{errors.expiry}</p>}
                                  </div>
                                  <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">CVV</label>
                                    <input 
                                      type="text" 
                                      placeholder="123" 
                                      maxLength={4}
                                      value={newPaymentData.cvv}
                                      onChange={e => setNewPaymentData({...newPaymentData, cvv: e.target.value.replace(/\D/g, '')})}
                                      className={`w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border ${errors.cvv ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-slate-200 dark:border-slate-700'} outline-none focus:border-sky-500 transition-colors`}
                                    />
                                    {errors.cvv && <p className="text-red-500 text-xs mt-1 font-medium">{errors.cvv}</p>}
                                  </div>
                                </div>
                              </>
                           )}

                           {newPaymentType === 'ewallet' && (
                              <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">TNG eWallet Phone Number</label>
                                <input 
                                  type="text" 
                                  placeholder="+60 12-345 6789" 
                                  value={newPaymentData.identifier}
                                  onChange={e => setNewPaymentData({...newPaymentData, identifier: e.target.value})}
                                  className={`w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border ${errors.identifier ? 'border-red-500 bg-red-50' : 'border-slate-200 dark:border-slate-700'} outline-none focus:border-sky-500 transition-colors`} 
                                />
                                {errors.identifier && <p className="text-red-500 text-xs mt-1 font-medium">{errors.identifier}</p>}
                                <p className="text-xs text-amber-600 mt-2 bg-amber-50 p-2 rounded-lg flex gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    You will need to authorize this link via the TNG app.
                                </p>
                              </div>
                           )}

                           {newPaymentType === 'banking' && (
                              <>
                                <div>
                                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Select Bank</label>
                                  <select 
                                    value={newPaymentData.bankName}
                                    onChange={e => setNewPaymentData({...newPaymentData, bankName: e.target.value})}
                                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-sky-500 transition-colors"
                                  >
                                     <option>Maybank2u</option>
                                     <option>CIMB Clicks</option>
                                     <option>Public Bank</option>
                                     <option>RHB Now</option>
                                     <option>Hong Leong Connect</option>
                                     <option>AmOnline</option>
                                     <option>Bank Islam</option>
                                     <option>UOB</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Account Number</label>
                                  <input 
                                    type="text" 
                                    placeholder="Account No." 
                                    value={newPaymentData.identifier}
                                    onChange={e => setNewPaymentData({...newPaymentData, identifier: e.target.value})}
                                    className={`w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border ${errors.identifier ? 'border-red-500 bg-red-50' : 'border-slate-200 dark:border-slate-700'} outline-none focus:border-sky-500 transition-colors`} 
                                  />
                                  {errors.identifier && <p className="text-red-500 text-xs mt-1 font-medium">{errors.identifier}</p>}
                                </div>
                              </>
                           )}
                        </div>

                        <button onClick={initiateAddPayment} className="w-full py-3 bg-sky-600 text-white font-bold rounded-xl shadow-lg hover:bg-sky-500 transition-colors">
                           Save & Link
                        </button>
                     </div>
                   </div>
                )}
             </div>

             {/* Transaction History */}
             <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Transaction History</h3>
                  <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    View More
                  </button>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                   <table className="w-full text-left">
                      <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 uppercase">
                         <tr>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Description</th>
                            <th className="px-6 py-4">Amount</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Invoice</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                         {user.transactions?.map((tx) => (
                            <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                               <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">{tx.date.toLocaleDateString()}</td>
                               <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{tx.description}</td>
                               <td className="px-6 py-4 text-sm font-bold text-slate-700 dark:text-slate-300">{tx.currency} {tx.amount.toFixed(2)}</td>
                               <td className="px-6 py-4">
                                  <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                                     {tx.status}
                                  </span>
                               </td>
                               <td className="px-6 py-4 text-right">
                                  <button 
                                    onClick={() => generateInvoicePDF(tx)}
                                    className="text-sky-600 dark:text-indigo-400 hover:underline text-xs font-bold inline-flex items-center gap-1"
                                  >
                                     <Download className="w-3 h-3" /> PDF
                                  </button>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
      </div>
    </div>
  );
};

export default BillingView;
