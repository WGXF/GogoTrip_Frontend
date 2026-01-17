import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Crown,
  Check,
  Loader2,
  Calendar,
  CreditCard,
  AlertCircle,
  Sparkles,
  CheckCircle,
  FileText,
  Clock,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Tag,
  X,
  Receipt,
  Gift,
  History,
  Wallet,
  ArrowRight,
  TrendingUp, 
  RefreshCw,
  Lock       
} from 'lucide-react';
import { API_BASE_URL } from '../../config';
import { User } from '../../types';

// ============================================================================
// Types
// ============================================================================
interface BillingViewProps {
  user: User;
  onUpdateUser: (updatedUser: Partial<User>) => void;
}

interface SubscriptionInfo {
  isPremium: boolean;
  subscriptionEndDate: string | null;
  currentSubscription: any;
  pendingOrder: any;
  currentPlanId?: number;
  currentPlanLevel?: number;
}

interface Plan {
  id: number;
  name: string;
  slug: string;
  price: number;
  description: string;
  durationDays: number | null;
  isFeatured: boolean;
  level: number;

  canPurchase?: boolean;
  actionType?: 'purchase' | 'renew' | 'upgrade' | 'blocked';
  actionMessage?: string;
}

interface Transaction {
  id: number;
  orderReference: string;
  planType: string;
  planName: string;
  amount: number;
  originalAmount: number;
  discountAmount: number;
  status: 'pending' | 'paid' | 'cancelled' | 'expired' | 'refunded' | 'failed' | 'active';
  paymentUrl: string | null;
  createdAt: string;
  paymentDate: string | null;
  startDate: string | null;
  endDate: string | null;
  canContinuePayment: boolean;
  remainingPaymentTime: number | null;
  voucherCode: string | null;
  paymentMethod: string;
}

interface VoucherPreview {
  originalPrice: number;
  discount: number;
  finalPrice: number;
}

interface AppliedVoucher {
  code: string;
  name: string;
  type: 'discount' | 'activation';
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  activationDays: number | null;
}

type TabType = 'plans' | 'transactions' | 'voucher';

const BillingView: React.FC<BillingViewProps> = ({ user, onUpdateUser }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabType>('plans');

  // Plans Tab State
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  // Voucher State
  const [voucherCode, setVoucherCode] = useState('');
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false);
  const [appliedVoucher, setAppliedVoucher] = useState<AppliedVoucher | null>(null);
  const [voucherPreview, setVoucherPreview] = useState<VoucherPreview | null>(null);
  const [voucherError, setVoucherError] = useState('');

  // Transaction Tab State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState<string>('all');

  // Success/Activation Messages
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Hardcoded plan features
  const planFeatures: Record<string, string[]> = {
    monthly: [
      'Unlimited AI trip planning',
      'Advanced route optimization',
      'Priority support',
      'Budget tracking',
      'Calendar sync'
    ],
    yearly: [
      'Everything in Monthly',
      '2 months FREE',
      'Early access to new features',
      'Exclusive travel tips',
      'No price increases'
    ],
    lifetime: [
      'Everything in Yearly',
      'Lifetime updates',
      'VIP support',
      'Transferable license',
      'Exclusive community access'
    ]
  };

  useEffect(() => {
    fetchSubscriptionStatus();
    fetchPlans();
    
    const success = searchParams.get('success');
    const activated = searchParams.get('activated');
    if (success === 'true') {
      setSuccessMessage('🎉 Payment successful! Your premium membership is updated.');
      setTimeout(() => setSuccessMessage(null), 5000);
    }
    if (activated === 'true') {
      setSuccessMessage('🎉 Premium membership activated successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'transactions') {
      fetchTransactions();
    }
  }, [activeTab, transactionFilter]);

  useEffect(() => {
    if (subscriptionInfo?.pendingOrder) {
      const interval = setInterval(checkPendingOrderStatus, 10000);
      return () => clearInterval(interval);
    }
  }, [subscriptionInfo]);

  const fetchPlans = async () => {
    try {
      setIsLoadingPlans(true);
      const res = await fetch(`${API_BASE_URL}/api/payment/plans`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setPlans(data.plans || []);
      }
    } catch (e) {
      console.error('Failed to fetch plans:', e);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const fetchSubscriptionStatus = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/payment/subscription-status`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSubscriptionInfo(data);
      }
    } catch (e) {
      console.error('Failed to fetch subscription status:', e);
    }
  };

  const fetchTransactions = async () => {
    try {
      setIsLoadingTransactions(true);
      const url = transactionFilter === 'all'
        ? `${API_BASE_URL}/api/payment/transactions`
        : `${API_BASE_URL}/api/payment/transactions?status=${transactionFilter}`;
      
      const res = await fetch(url, { credentials: 'include' });
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch (e) {
      console.error('Failed to fetch transactions:', e);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const checkPendingOrderStatus = async () => {
    if (!subscriptionInfo?.pendingOrder) return;
    setIsCheckingStatus(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/payment/verify-order/${subscriptionInfo.pendingOrder.orderReference}`,
        { method: 'POST', credentials: 'include' }
      );
      const data = await res.json();
      if (data.success && data.order?.status === 'active') {
        await fetchSubscriptionStatus();
        onUpdateUser({ isPremium: true });
        setSuccessMessage('🎉 Payment confirmed! Your plan is now active.');
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (e) {
      console.error('Error checking order status:', e);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // ============================================================================
  // Voucher Handlers
  // ============================================================================
  const handleValidateVoucher = async (planIdOverride?: number) => {
    if (!voucherCode.trim()) {
      setVoucherError('Please enter a voucher code');
      return;
    }

    setIsValidatingVoucher(true);
    setVoucherError('');
    const currentPlanId = planIdOverride !== undefined ? planIdOverride : selectedPlan?.id;

    try {
      const res = await fetch(`${API_BASE_URL}/api/payment/validate-voucher`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          code: voucherCode.trim(), 
          planId: currentPlanId || null 
        })
      });

      const data = await res.json();

      if (data.valid) {
        setAppliedVoucher(data.voucher);
        setVoucherPreview(data.preview);
        setVoucherError('');
        
        if (data.voucher.type === 'activation') {
          setSelectedPlan(null);
        }
      } else {
        setVoucherError(data.error || 'Invalid voucher code');
        setVoucherPreview(null);
      }
    } catch (err) {
      setVoucherError('Failed to validate voucher');
    } finally {
      setIsValidatingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherPreview(null);
    setVoucherCode('');
    setVoucherError('');
  };

  // ============================================================================
  // Payment Handlers
  // ============================================================================
  const handleSubscribe = async (plan?: Plan) => {
    setIsLoading(true);
    if (plan) setSelectedPlan(plan);
    setError(null);

    try {
      const payload: any = {};
      
      if (plan) {
        payload.planId = plan.id;
      }
      
      if (appliedVoucher) {
        payload.voucherCode = appliedVoucher.code;
      }
      
      if (!plan && appliedVoucher?.type !== 'activation') {
        throw new Error("Please select a plan.");
      }

      const res = await fetch(`${API_BASE_URL}/api/payment/create-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      
      if (data.activated) {
        await fetchSubscriptionStatus();
        onUpdateUser({ isPremium: true });
        setSuccessMessage('🎉 Premium membership activated!');
        handleRemoveVoucher();
        return;
      }

      if (res.ok && data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else if (data.redirectTo) {
        await fetchSubscriptionStatus();
        onUpdateUser({ isPremium: true });
        setSuccessMessage('🎉 Premium membership activated with voucher!');
        handleRemoveVoucher();
      } else {
        throw new Error(data.error || 'Payment creation failed');
      }
    } catch (e: any) {
      setError(e.message || 'Payment failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinuePayment = async (orderRef: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/payment/continue-payment/${orderRef}`, {
        credentials: 'include'
      });
      const data = await res.json();

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to continue payment');
    }
  };

  const handleCancelOrder = async (orderRef: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/payment/cancel-order/${orderRef}`, {
        method: 'POST',
        credentials: 'include'
      });
      if (res.ok) {
        fetchTransactions();
        fetchSubscriptionStatus();
      }
    } catch (err) {
      console.error('Failed to cancel order:', err);
    }
  };

  const handleViewReceipt = (orderReference: string) => {
    navigate(`/receipt?order_id=${orderReference}`);
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { icon: any; color: string; label: string }> = {
      pending: { icon: Clock, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20', label: 'Pending' },
      paid: { icon: CheckCircle, color: 'text-green-600 bg-green-50 dark:bg-green-900/20', label: 'Paid' },
      active: { icon: CheckCircle, color: 'text-green-600 bg-green-50 dark:bg-green-900/20', label: 'Active' },
      cancelled: { icon: XCircle, color: 'text-red-600 bg-red-50 dark:bg-red-900/20', label: 'Cancelled' },
      expired: { icon: AlertTriangle, color: 'text-gray-600 bg-gray-50 dark:bg-gray-800', label: 'Expired' },
      refunded: { icon: XCircle, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20', label: 'Refunded' },
      failed: { icon: XCircle, color: 'text-red-600 bg-red-50 dark:bg-red-900/20', label: 'Failed' }
    };
    const config = configs[status] || configs.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon size={14} />
        {config.label}
      </span>
    );
  };

  const getPlanPeriod = (plan: Plan): string => {
    if (plan.durationDays === null || plan.slug === 'lifetime') return 'one-time';
    if (plan.durationDays === 30 || plan.slug === 'monthly') return 'month';
    if (plan.durationDays === 365 || plan.slug === 'yearly') return 'year';
    return `${plan.durationDays} days`;
  };

  return (
    <div className="p-6 md:p-8 w-full max-w-7xl mx-auto animate-fade-in-up">
      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-700 dark:text-green-400 font-medium">{successMessage}</p>
        </div>
      )}

      {/* Pending Order Alert */}
      {subscriptionInfo?.pendingOrder && (
        <div className="mb-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {isCheckingStatus ? (
                <Loader2 className="w-6 h-6 text-amber-600 animate-spin" />
              ) : (
                <AlertCircle className="w-6 h-6 text-amber-600" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100 mb-2">
                Payment in Progress
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-400 mb-4">
                Order <span className="font-mono font-bold">{subscriptionInfo.pendingOrder.orderReference}</span> is pending payment.
                {subscriptionInfo.pendingOrder.remainingTime > 0 && (
                  <span className="ml-2">
                    Expires in {Math.floor(subscriptionInfo.pendingOrder.remainingTime / 60)}:{String(subscriptionInfo.pendingOrder.remainingTime % 60).padStart(2, '0')}
                  </span>
                )}
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleContinuePayment(subscriptionInfo.pendingOrder.orderReference)}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  Continue Payment
                </button>
                <button
                  onClick={() => checkPendingOrderStatus()}
                  disabled={isCheckingStatus}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors flex items-center gap-2"
                >
                  {isCheckingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Refresh Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full mb-4">
          <Crown className="w-5 h-5 text-amber-600" />
          <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
            Premium Plans
          </span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
          Upgrade to <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">Premium</span>
        </h1>
        
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Unlock unlimited AI-powered trip planning and advanced features
        </p>
      </div>

      {/* Current Subscription Status */}
      {subscriptionInfo?.isPremium && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-6 mb-8 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-6 h-6 text-amber-600" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Active Premium Subscription
            </h3>
          </div>
          
          {subscriptionInfo.subscriptionEndDate ? (
            <p className="text-slate-600 dark:text-slate-400">
              <Calendar className="w-4 h-4 inline mr-2" />
              Valid until: {new Date(subscriptionInfo.subscriptionEndDate).toLocaleDateString('en-MY', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          ) : (
            <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-600" />
              <span className="font-bold text-amber-700">Lifetime Access</span>
            </p>
          )}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden mb-8">
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('plans')}
            className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 font-medium transition-colors ${
              activeTab === 'plans'
                ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-b-2 border-amber-500'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Wallet size={18} />
            <span className="hidden sm:inline">Plans</span>
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 font-medium transition-colors ${
              activeTab === 'transactions'
                ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-b-2 border-amber-500'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <History size={18} />
            <span className="hidden sm:inline">Transactions</span>
          </button>
          <button
            onClick={() => setActiveTab('voucher')}
            className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 font-medium transition-colors ${
              activeTab === 'voucher'
                ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-b-2 border-amber-500'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Gift size={18} />
            <span className="hidden sm:inline">Redeem Code</span>
          </button>
        </div>

        <div className="p-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-700 dark:text-red-400">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                <X size={18} />
              </button>
            </div>
          )}

          {/* ============== PLANS TAB ============== */}
          {activeTab === 'plans' && (
            <div>
              {isLoadingPlans ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-6">
                  {plans.map((plan) => {
                    const features = planFeatures[plan.slug] || planFeatures.monthly;
                    const isSelected = selectedPlan?.id === plan.id;
                    const showDiscount = isSelected && voucherPreview;
                    
                    // 🟢 智能判断按钮状态和文案
                    const actionType = plan.actionType || 'purchase';
                    const canPurchase = plan.canPurchase !== false; // 默认为 true
                    
                    let ButtonIcon = CreditCard;
                    let buttonText = "Subscribe Now";
                    let isUpgrade = false;

                    if (actionType === 'upgrade') {
                        buttonText = "Upgrade Plan";
                        ButtonIcon = TrendingUp;
                        isUpgrade = true;
                    } else if (actionType === 'renew') {
                        buttonText = "Renew Subscription";
                        ButtonIcon = RefreshCw;
                    } else if (actionType === 'blocked') {
                        buttonText = "Current Plan is Higher";
                        ButtonIcon = Lock;
                    } else if (subscriptionInfo?.isPremium && plan.slug === 'lifetime' && !subscriptionInfo.subscriptionEndDate) {
                         // 已拥有 Lifetime 的特殊处理
                         buttonText = "Current Plan";
                         ButtonIcon = Check;
                    }
                    
                    // 如果已购买且是当前Plan (后端返回renew也算能买，但这里视觉上区分一下正在用的)
                    const isCurrentActive = subscriptionInfo?.currentSubscription?.planId === plan.id;
                    if (isCurrentActive && actionType === 'renew') {
                        // 允许 Renew，但文字提示
                        buttonText = "Renew / Extend";
                    }

                    const isDisabled = isLoading || !canPurchase;

                    return (
                      <div
                        key={plan.id}
                        onClick={() => {
                           if (!isDisabled || actionType !== 'blocked') {
                                setSelectedPlan(plan);
                                if (voucherCode.trim()) {
                                    handleValidateVoucher(plan.id);
                                }
                           }
                        }}
                        className={`relative bg-white dark:bg-slate-800 rounded-2xl p-6 border-2 transition-all duration-300 ${
                            isDisabled ? 'opacity-80' : 'cursor-pointer hover:scale-[1.02]'
                        } ${
                          plan.isFeatured || plan.slug === 'yearly'
                            ? 'border-amber-500 shadow-xl shadow-amber-500/20'
                            : isSelected
                              ? 'border-amber-400'
                              : 'border-slate-200 dark:border-slate-700 hover:border-amber-300'
                        }`}
                      >
                        {/* Popular Badge */}
                        {(plan.isFeatured || plan.slug === 'yearly') && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold rounded-full shadow-lg">
                            Most Popular
                          </div>
                        )}

                        {/* Plan Header */}
                        <div className="text-center mb-6">
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            {plan.name}
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                            {plan.description}
                          </p>
                          
                          <div className="flex items-baseline justify-center gap-1">
                            {showDiscount ? (
                              <>
                                <span className="text-2xl text-slate-400 line-through">
                                  RM {voucherPreview.originalPrice}
                                </span>
                                <span className="text-3xl font-bold text-green-600">
                                  RM {voucherPreview.finalPrice.toFixed(2)}
                                </span>
                              </>
                            ) : (
                              <span className="text-3xl font-bold text-slate-900 dark:text-white">
                                RM {plan.price}
                              </span>
                            )}
                            <span className="text-slate-500 dark:text-slate-400">
                              /{getPlanPeriod(plan)}
                            </span>
                          </div>

                          {showDiscount && (
                            <p className="text-sm text-green-600 mt-1">
                              Save RM {voucherPreview.discount.toFixed(2)}!
                            </p>
                          )}
                        </div>

                        {/* Features */}
                        <ul className="space-y-3 mb-6">
                          {features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-slate-600 dark:text-slate-400">
                                {feature}
                              </span>
                            </li>
                          ))}
                        </ul>

                        {/* CTA Button */}
                        <div className="space-y-2">
                            <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!isDisabled) handleSubscribe(plan);
                            }}
                            disabled={isDisabled}
                            className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                                isDisabled 
                                ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                                : plan.isFeatured || plan.slug === 'yearly'
                                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-lg hover:shadow-amber-500/50'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600'
                            }`}
                            >
                            {isLoading && selectedPlan?.id === plan.id ? (
                                <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Processing...
                                </>
                            ) : (
                                <>
                                <ButtonIcon className="w-5 h-5" />
                                {buttonText}
                                </>
                            )}
                            </button>
                            
                            {/* 🆕 升级提示文案 */}
                            {isUpgrade && !isDisabled && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 text-center font-medium animate-pulse">
                                    ✨ Remaining days will be added to new plan!
                                </p>
                            )}
                            
                            {actionType === 'blocked' && (
                                <p className="text-xs text-slate-400 text-center">
                                    You are on a higher tier plan.
                                </p>
                            )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ============== TRANSACTIONS TAB ============== */}
          {activeTab === 'transactions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Transaction History</h3>
                <select
                  value={transactionFilter}
                  onChange={(e) => setTransactionFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {isLoadingTransactions ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                  <p className="text-slate-500 dark:text-slate-400">No transactions found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{tx.planName}</p>
                          <p className="text-sm text-slate-500 font-mono">{tx.orderReference}</p>
                          <p className="text-xs text-slate-400 mt-1">{tx.createdAt}</p>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(tx.status)}
                          <p className="mt-2 font-bold text-lg text-slate-900 dark:text-white">
                            RM {tx.amount.toFixed(2)}
                          </p>
                          {tx.discountAmount > 0 && (
                            <p className="text-xs text-green-600">
                              -RM {tx.discountAmount.toFixed(2)} discount
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {tx.canContinuePayment && tx.status === 'pending' && (
                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={() => handleContinuePayment(tx.orderReference)}
                            className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg flex items-center justify-center gap-2"
                          >
                            <ExternalLink size={18} />
                            Continue Payment
                          </button>
                          <button
                            onClick={() => handleCancelOrder(tx.orderReference)}
                            className="px-4 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      {['paid', 'active'].includes(tx.status) && tx.paymentMethod !== 'activation_code' && (
                        <button
                          onClick={() => handleViewReceipt(tx.orderReference)}
                          className="mt-4 w-full py-2.5 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          <FileText size={18} />
                          View Receipt
                        </button>
                      )}

                      {tx.voucherCode && (
                        <p className="mt-3 text-xs text-slate-500">
                          Voucher: <span className="font-mono bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">{tx.voucherCode}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============== VOUCHER / REDEEM TAB ============== */}
          {activeTab === 'voucher' && (
            <div className="max-w-md mx-auto space-y-6">
              {/* ... (保持 Voucher Tab 内容不变) ... */}
              <div className="text-center">
                <Gift className="w-12 h-12 mx-auto mb-3 text-amber-500" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Redeem Code
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Enter your activation code or discount voucher below.
                </p>
              </div>

              {/* 1. Input Field */}
              {!appliedVoucher && (
                <div className="space-y-3">
                  <div className="relative">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                      placeholder="ENTER CODE HERE"
                      className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono uppercase text-lg tracking-wider focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all shadow-sm"
                      onKeyDown={(e) => e.key === 'Enter' && handleValidateVoucher()}
                    />
                  </div>
                  <button
                    onClick={() => handleValidateVoucher()}
                    disabled={!voucherCode.trim() || isValidatingVoucher}
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
                  >
                    {isValidatingVoucher ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Validating...
                      </>
                    ) : (
                      <>
                        Check Code <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                  {voucherError && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-lg flex items-center justify-center gap-2 text-red-600 dark:text-red-400 text-sm animate-shake">
                      <AlertCircle size={16} />
                      {voucherError}
                    </div>
                  )}
                </div>
              )}

              {/* 2. ACTIVATION CODE CARD */}
              {appliedVoucher?.type === 'activation' && (
                <div className="animate-fade-in-up">
                  <div className="p-1 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl shadow-xl">
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 text-center">
                      <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                      </div>
                      
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                        Premium Activation
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 mb-6">
                        Code: <span className="font-mono font-bold text-purple-600">{appliedVoucher.code}</span>
                      </p>

                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 mb-6 border border-purple-100 dark:border-purple-800/50">
                        <p className="text-sm text-purple-800 dark:text-purple-300 mb-1">You will receive:</p>
                        <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                          {appliedVoucher.activationDays ? `${appliedVoucher.activationDays} Days` : 'Lifetime'} Premium
                        </p>
                      </div>

                      <div className="space-y-3">
                        <button
                          onClick={() => handleSubscribe()} 
                          disabled={isLoading}
                          className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.02]"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Activating...
                            </>
                          ) : (
                            <>
                              Activate Now <Sparkles className="w-5 h-5" />
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleRemoveVoucher}
                          className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
                        >
                          Use a different code
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. DISCOUNT CODE FLOW */}
              {appliedVoucher?.type === 'discount' && (
                <div className="space-y-6 animate-fade-in-up">
                  {/* Voucher Info Badge */}
                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-3">
                      <Tag className="w-5 h-5 text-green-600" />
                      <div>
                        <span className="font-mono font-bold text-green-700 dark:text-green-400">
                          {appliedVoucher.code}
                        </span>
                        <p className="text-sm text-green-600">
                          {appliedVoucher.discountType === 'percentage' 
                            ? `${appliedVoucher.discountValue}% Discount` 
                            : `RM${appliedVoucher.discountValue} Off`}
                        </p>
                      </div>
                    </div>
                    <button onClick={handleRemoveVoucher} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                      <X size={18} />
                    </button>
                  </div>

                  {/* Plan Selector */}
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                      Select a Plan
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      {plans.map((plan) => (
                        <button
                          key={plan.id}
                          onClick={() => {
                            if (plan.canPurchase !== false) {
                                setSelectedPlan(plan);
                                if (voucherCode.trim()) {
                                    handleValidateVoucher(plan.id);
                                }
                            }
                          }}
                          disabled={plan.canPurchase === false && plan.actionType === 'blocked'}
                          className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                            selectedPlan?.id === plan.id
                              ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/10'
                              : 'border-slate-200 dark:border-slate-700 hover:border-amber-200'
                          } ${plan.canPurchase === false ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{plan.name}</p>
                            <p className="text-xs text-slate-500">{plan.description}</p>
                          </div>
                          <span className="font-medium text-slate-900 dark:text-white">RM {plan.price}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Summary & Pay Button */}
                  {selectedPlan && (
                    <div className="animate-fade-in-up">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                          <span className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                          Confirm & Pay
                        </h4>
                        
                        <button 
                          onClick={() => handleValidateVoucher()} 
                          className="text-xs text-amber-600 underline"
                        >
                          Refresh Price
                        </button>
                      </div>

                      <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        {voucherPreview ? (
                          <div className="space-y-3 text-sm">
                             <div className="flex justify-between">
                              <span className="text-slate-500">Plan Price ({selectedPlan.name})</span>
                              <span className="text-slate-900 dark:text-white">RM {selectedPlan.price.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-green-600 font-medium">
                              <span>Voucher Applied</span>
                              <span>-RM {voucherPreview.discount.toFixed(2)}</span>
                            </div>
                            <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex justify-between items-end">
                              <span className="text-slate-900 dark:text-white font-bold">Total Amount</span>
                              <span className="text-2xl font-bold text-amber-600">
                                RM {voucherPreview.finalPrice.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-slate-500 text-sm">
                            <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                            Calculating discount...
                          </div>
                        )}

                        <button
                          onClick={() => handleSubscribe(selectedPlan)}
                          disabled={isLoading || !voucherPreview}
                          className="w-full mt-5 py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:scale-100"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              Proceed to Payment <ArrowRight size={18} />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* FAQ Section (保持不变) */}
    </div>
  );
};

export default BillingView;