import React, { useState, useEffect } from 'react';
import {
  Users,
  Crown,
  Search,
  Plus,
  X,
  Calendar,
  TrendingUp,
  AlertCircle,
  Check,
  Loader2,
  Gift,
  Clock,
  Ban,
  AlertTriangle,
  Shield,
  ShieldCheck,
  Info
} from 'lucide-react';
import { API_BASE_URL } from '../../config';

// 🔥 Role constants (same as UserList.tsx)
const UserRole = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  USER: 'user',
} as const;

type RoleType = typeof UserRole[keyof typeof UserRole];

interface User {
  id: number;
  email: string;
  full_name: string;
  role?: string;  // 🔥 Added role field
  is_premium: boolean;
  subscription_end_date: string | null;
  created_at: string;
}

interface Subscription {
  id: number;
  order_reference: string;
  plan_type: string;
  amount: number;
  status: string;
  start_date: string;
  end_date: string | null;
  payment_method: string;
}

interface Statistics {
  total_users: number;
  premium_users: number;
  premium_percentage: number;
  today_subscriptions: number;
  monthly_revenue: number;
  expiring_soon: number;
  // 🔥 New permission info
  currentAdminRole?: string;
  viewScope?: string;
}

export const AdminSubscriptionView: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userSubscriptions, setUserSubscriptions] = useState<Subscription[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // 🔥 NEW: Permission states
  const [currentAdminRole, setCurrentAdminRole] = useState<RoleType>(UserRole.ADMIN);
  const [canManageAdmins, setCanManageAdmins] = useState(false);

  // 消息提示状态 (Toast)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

  // 删除确认状态 (Modal)
  const [cancelTargetId, setCancelTargetId] = useState<number | null>(null);

  // 添加订阅表单状态
  const [subscriptionType, setSubscriptionType] = useState<'preset' | 'custom'>('preset');
  const [planType, setPlanType] = useState<'monthly' | 'yearly' | 'lifetime'>('monthly');
  const [customDays, setCustomDays] = useState('30');
  const [amount, setAmount] = useState('0.00');
  const [notes, setNotes] = useState('');

  // 加载统计数据
  useEffect(() => {
    fetchStatistics();
    fetchUsers();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin-subscription/statistics`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setStatistics(data);
        
        // 🔥 Extract permission info
        if (data.currentAdminRole) {
          setCurrentAdminRole(data.currentAdminRole as RoleType);
          setCanManageAdmins(data.currentAdminRole === UserRole.SUPER_ADMIN);
        }
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchUsers = async (search = '') => {
    try {
      setIsLoading(true);
      const url = search
        ? `${API_BASE_URL}/api/admin-subscription/users?search=${encodeURIComponent(search)}`
        : `${API_BASE_URL}/api/admin-subscription/users`;
      
      const response = await fetch(url, { credentials: 'include' });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        
        // 🔥 Update permission info
        if (data.currentAdminRole) {
          setCurrentAdminRole(data.currentAdminRole as RoleType);
          setCanManageAdmins(data.canManageAdmins || false);
        }
      } else if (response.status === 403) {
        showMessage('error', 'Admin access required');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showMessage('error', 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserSubscriptions = async (userId: number) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin-subscription/users/${userId}/subscriptions`,
        { credentials: 'include' }
      );
      
      if (response.ok) {
        const data = await response.json();
        setUserSubscriptions(data.subscriptions);
        setSelectedUser(data.user);
      } else if (response.status === 403) {
        // 🔥 Handle permission denied
        showMessage('error', 'Permission denied: Cannot access admin users');
      }
    } catch (error) {
      console.error('Error fetching user subscriptions:', error);
    }
  };

  const handleAddSubscription = async () => {
    if (!selectedUser) return;

    try {
      setIsLoading(true);

      const payload: any = {
        user_id: selectedUser.id,
        subscription_type: subscriptionType,
        amount: parseFloat(amount) || 0
      };

      if (subscriptionType === 'preset') {
        payload.plan_type = planType;
      } else {
        payload.custom_days = parseInt(customDays);
      }

      const response = await fetch(`${API_BASE_URL}/api/admin-subscription/add-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('success', 'Subscription added successfully!');
        setShowAddModal(false);
        fetchUserSubscriptions(selectedUser.id);
        fetchStatistics();
        fetchUsers(searchQuery);
        
        // 重置表单
        setSubscriptionType('preset');
        setPlanType('monthly');
        setCustomDays('30');
        setAmount('0.00');
      } else if (response.status === 403) {
        showMessage('error', 'Permission denied: Cannot modify admin users');
      } else {
        showMessage('error', data.error || 'Failed to add subscription');
      }
    } catch (error) {
      showMessage('error', 'Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // 1. 点击取消按钮，只触发弹窗
  const handleCancelClick = (userId: number) => {
    setCancelTargetId(userId);
  };

  // 2. 确认删除逻辑
  const executeCancelSubscription = async () => {
    if (!cancelTargetId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin-subscription/cancel-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ user_id: cancelTargetId })
      });

      if (response.ok) {
        showMessage('success', 'Subscription cancelled successfully');
        if (selectedUser?.id === cancelTargetId) {
          fetchUserSubscriptions(cancelTargetId);
        }
        fetchUsers(searchQuery);
        fetchStatistics();
      } else if (response.status === 403) {
        showMessage('error', 'Permission denied: Cannot modify admin users');
      } else {
        showMessage('error', 'Failed to cancel subscription');
      }
    } catch (error) {
      showMessage('error', 'Network error occurred');
    } finally {
      setCancelTargetId(null); // 关闭弹窗
    }
  };

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // 🔥 Get role badge for user list
  const getRoleBadge = (role?: string) => {
    const normalizedRole = (role?.toLowerCase() || 'user') as RoleType;
    if (normalizedRole === UserRole.SUPER_ADMIN) {
      return (
        <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-medium rounded-full">
          Super Admin
        </span>
      );
    }
    if (normalizedRole === UserRole.ADMIN) {
      return (
        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium rounded-full">
          Admin
        </span>
      );
    }
    return null;
  };

  return (
    <div className="p-6 md:p-8 w-full max-w-7xl mx-auto relative">
      
      {/* --- 全局 Toast 通知 --- */}
      {message && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border animate-in slide-in-from-top-4 duration-300 ${
          message.type === 'success' 
            ? 'bg-white border-emerald-100 text-emerald-800 dark:bg-slate-800 dark:border-emerald-900/50 dark:text-emerald-400' 
            : message.type === 'info'
            ? 'bg-white border-blue-100 text-blue-800 dark:bg-slate-800 dark:border-blue-900/50 dark:text-blue-400'
            : 'bg-white border-red-100 text-red-800 dark:bg-slate-800 dark:border-red-900/50 dark:text-red-400'
        }`}>
          <div className={`p-1 rounded-full ${
            message.type === 'success' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 
            message.type === 'info' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' :
            'bg-red-100 text-red-600 dark:bg-red-900/30'
          }`}>
            {message.type === 'success' ? <Check className="w-4 h-4" /> : 
             message.type === 'info' ? <Info className="w-4 h-4" /> :
             <AlertCircle className="w-4 h-4" />}
          </div>
          <p className="text-sm font-medium">{message.text}</p>
          <button onClick={() => setMessage(null)} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Subscription Management
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Manage user subscriptions and premium access
        </p>
      </div>

      {/* 🔥 Permission Info Banner */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border mb-6 ${
        canManageAdmins 
          ? 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800' 
          : 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
      }`}>
        {canManageAdmins ? (
          <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        ) : (
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        )}
        <div className="flex-1">
          <span className={`text-sm font-medium ${canManageAdmins ? 'text-purple-800 dark:text-purple-300' : 'text-blue-800 dark:text-blue-300'}`}>
            {canManageAdmins ? 'Super Admin Access' : 'Admin Access'}
          </span>
          <span className={`text-sm ml-2 ${canManageAdmins ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'}`}>
            {canManageAdmins 
              ? '— You can view and manage subscriptions for all users'
              : '— You can only view and manage subscriptions for regular users'}
          </span>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
          canManageAdmins 
            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' 
            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
        }`}>
          {currentAdminRole}
        </span>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-slate-600 dark:text-slate-400">Total Users</span>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {statistics.total_users}
            </p>
            {!canManageAdmins && (
              <p className="text-xs text-slate-400 mt-1">Regular users only</p>
            )}
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-3 mb-2">
              <Crown className="w-5 h-5 text-amber-600" />
              <span className="text-sm text-amber-700 dark:text-amber-400">Premium Users</span>
            </div>
            <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">
              {statistics.premium_users}
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-500 mt-1">
              {statistics.premium_percentage}% of total
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span className="text-sm text-slate-600 dark:text-slate-400">Monthly Revenue</span>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              RM {statistics.monthly_revenue.toFixed(2)}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <span className="text-sm text-slate-600 dark:text-slate-400">Expiring Soon</span>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {statistics.expiring_soon}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Within 7 days
            </p>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by email or name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              fetchUsers(e.target.value);
            }}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Users List */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-bold text-lg text-slate-900 dark:text-white">Users</h2>
            <span className="text-sm text-slate-500">
              {users.length} {users.length === 1 ? 'user' : 'users'}
            </span>
          </div>
          
          <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
              </div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No users found
              </div>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  onClick={() => fetchUserSubscriptions(user.id)}
                  className={`p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                    selectedUser?.id === user.id ? 'bg-amber-50 dark:bg-amber-900/20' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-slate-900 dark:text-white">
                          {user.full_name || 'No name'}
                        </p>
                        {user.is_premium && (
                          <Crown className="w-4 h-4 text-amber-600" />
                        )}
                        {/* 🔥 Show role badge if admin */}
                        {getRoleBadge(user.role)}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {user.email}
                      </p>
                      {user.subscription_end_date && (
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                          Expires: {new Date(user.subscription_end_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    
                    {user.is_premium && (
                      <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-full">
                        Premium
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* User Details & Subscriptions */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {selectedUser ? (
            <>
              <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-lg text-slate-900 dark:text-white">
                        {selectedUser.full_name}
                      </h2>
                      {getRoleBadge(selectedUser.role)}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {selectedUser.email}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                    
                    {selectedUser.is_premium && (
                      <button
                        onClick={() => handleCancelClick(selectedUser.id)}
                        className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                      >
                        <Ban className="w-4 h-4" />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 dark:text-slate-400">Status:</span>
                    {selectedUser.is_premium ? (
                      <span className="flex items-center gap-1 text-amber-600">
                        <Crown className="w-4 h-4" /> Premium
                      </span>
                    ) : (
                      <span className="text-slate-500">Free</span>
                    )}
                  </div>
                  
                  {selectedUser.subscription_end_date && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600 dark:text-slate-400">Expires:</span>
                      <span className="text-slate-900 dark:text-white">
                        {new Date(selectedUser.subscription_end_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Subscriptions History */}
              <div className="p-4">
                <h3 className="font-medium text-slate-900 dark:text-white mb-3">
                  Subscription History
                </h3>
                
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {userSubscriptions.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">
                      No subscription history
                    </p>
                  ) : (
                    userSubscriptions.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white capitalize">
                              {sub.plan_type} Plan
                            </p>
                            <p className="text-xs text-slate-500">
                              {sub.order_reference}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            sub.status === 'active' 
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : sub.status === 'cancelled'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                          }`}>
                            {sub.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                          <div>
                            <span className="font-medium">Amount:</span> RM {sub.amount.toFixed(2)}
                          </div>
                          <div>
                            <span className="font-medium">Start:</span> {new Date(sub.start_date).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">End:</span> {sub.end_date ? new Date(sub.end_date).toLocaleDateString() : 'Lifetime'}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Select a user to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* --- Delete Confirmation Modal --- */}
      {cancelTargetId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 text-red-600 dark:text-red-400">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Cancel Subscription?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Are you sure you want to cancel this user's premium status? This action will immediately revert them to a free user.
              </p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setCancelTargetId(null)}
                  className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                >
                  Keep It
                </button>
                <button 
                  onClick={executeCancelSubscription}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-500/20"
                >
                  Yes, Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Subscription Modal */}
      {showAddModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Add Subscription
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* User Info */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {selectedUser.full_name}
                  </p>
                  {getRoleBadge(selectedUser.role)}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {selectedUser.email}
                </p>
              </div>

              {/* Subscription Type */}
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Subscription Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSubscriptionType('preset')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      subscriptionType === 'preset'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Gift className="w-5 h-5 mx-auto mb-1 text-amber-600" />
                    <p className="text-sm font-medium">Preset Plans</p>
                  </button>
                  
                  <button
                    onClick={() => setSubscriptionType('custom')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      subscriptionType === 'custom'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Calendar className="w-5 h-5 mx-auto mb-1 text-amber-600" />
                    <p className="text-sm font-medium">Custom Days</p>
                  </button>
                </div>
              </div>

              {/* Preset Plans */}
              {subscriptionType === 'preset' && (
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                    Select Plan
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'monthly', label: 'Monthly', days: '30 days', price: 'RM 29.90' },
                      { value: 'yearly', label: 'Yearly', days: '365 days', price: 'RM 299.00' },
                      { value: 'lifetime', label: 'Lifetime', days: 'Forever', price: 'RM 999.00' }
                    ].map((plan) => (
                      <button
                        key={plan.value}
                        onClick={() => setPlanType(plan.value as any)}
                        className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                          planType === plan.value
                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-amber-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{plan.label}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{plan.days}</p>
                          </div>
                          <p className="text-sm font-medium text-amber-600">{plan.price}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Days */}
              {subscriptionType === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                    Number of Days
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={customDays}
                    onChange={(e) => setCustomDays(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="e.g., 7, 14, 30..."
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Subscription will expire in {customDays || '0'} days
                  </p>
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Amount (RM)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="0.00"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Set to 0.00 for free/gifted subscriptions
                </p>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleAddSubscription}
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Add Subscription
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};