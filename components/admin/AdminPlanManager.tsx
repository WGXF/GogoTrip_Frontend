import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Loader2,
  Search,
  Crown,
  Star,
  StarOff,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowDown,
  Calendar,
  DollarSign,
  Users,
  Clock,
  X,
  AlertCircle,
  Infinity,
  Package,
  Eye,
  EyeOff,
  RefreshCw,
  Trash2,
  Save,
  MoreVertical
} from 'lucide-react';
import { API_BASE_URL } from '../../config';

// ============================================================================
// Types
// ============================================================================
interface Plan {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  durationDays: number | null;
  durationType: string;
  status: 'active' | 'inactive';
  isFeatured: boolean;
  sortOrder: number;
  createdAt: string;
  isLifetime: boolean;
  subscriptionCount?: number;
}

interface PlanFormData {
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  durationDays: number | null;
  durationType: string;
  status: string;
  isFeatured: boolean;
  sortOrder: number;
}

const initialFormData: PlanFormData = {
  name: '',
  slug: '',
  description: '',
  price: 0,
  currency: 'MYR',
  durationDays: 30,
  durationType: 'days',
  status: 'active',
  isFeatured: false,
  sortOrder: 0
};

// ============================================================================
// Helper Functions
// ============================================================================
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

const formatDuration = (days: number | null, type: string): string => {
  if (days === null) return 'Lifetime';
  if (type === 'months' || days === 30) return days === 30 ? '1 Month' : `${Math.round(days / 30)} Months`;
  if (type === 'years' || days === 365) return days === 365 ? '1 Year' : `${Math.round(days / 365)} Years`;
  return `${days} Days`;
};

const formatPrice = (price: number, currency: string = 'MYR'): string => {
  return `${currency} ${price.toFixed(2)}`;
};

// ============================================================================
// Duration Presets
// ============================================================================
const durationPresets = [
  { label: '7 Days', days: 7, type: 'days' },
  { label: '14 Days', days: 14, type: 'days' },
  { label: '1 Month', days: 30, type: 'months' },
  { label: '3 Months', days: 90, type: 'months' },
  { label: '6 Months', days: 180, type: 'months' },
  { label: '1 Year', days: 365, type: 'years' },
  { label: 'Lifetime', days: null, type: 'lifetime' }
];

// ============================================================================
// Main Component
// ============================================================================
export const AdminPlanManager: React.FC = () => {
  // State
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showInactive, setShowInactive] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState<PlanFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Toast Message
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ============================================================================
  // API Calls
  // ============================================================================
  const fetchPlans = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/admin-subscription/plans?include_inactive=${showInactive}`,
        { credentials: 'include' }
      );
      const data = await res.json();

      if (data.plans) {
        setPlans(data.plans);
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
      showToast('error', 'Failed to load plans');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [showInactive]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // ============================================================================
  // Modal Handlers
  // ============================================================================
  const handleOpenModal = (plan?: Plan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        slug: plan.slug,
        description: plan.description || '',
        price: plan.price,
        currency: plan.currency,
        durationDays: plan.durationDays,
        durationType: plan.durationType,
        status: plan.status,
        isFeatured: plan.isFeatured,
        sortOrder: plan.sortOrder
      });
    } else {
      setEditingPlan(null);
      setFormData({
        ...initialFormData,
        sortOrder: plans.length // New plans go to the end
      });
    }
    setError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPlan(null);
    setError('');
  };

  // ============================================================================
  // Form Handlers
  // ============================================================================
  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      // Auto-generate slug only for new plans
      slug: editingPlan ? prev.slug : generateSlug(name)
    }));
  };

  const handleDurationPreset = (preset: typeof durationPresets[0]) => {
    setFormData(prev => ({
      ...prev,
      durationDays: preset.days,
      durationType: preset.type
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      setError('Plan name is required');
      return;
    }
    if (!formData.slug.trim()) {
      setError('Plan slug is required');
      return;
    }
    if (formData.price < 0) {
      setError('Price must be 0 or greater');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const url = editingPlan
        ? `${API_BASE_URL}/api/admin-subscription/plans/${editingPlan.id}`
        : `${API_BASE_URL}/api/admin-subscription/plans`;

      const method = editingPlan ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showToast('success', editingPlan ? 'Plan updated successfully' : 'Plan created successfully');
        fetchPlans(false);
        handleCloseModal();
      } else {
        setError(data.error || 'Failed to save plan');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // Plan Actions
  // ============================================================================
  const togglePlanStatus = async (planId: number) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/admin-subscription/plans/${planId}/toggle-status`,
        {
          method: 'POST',
          credentials: 'include'
        }
      );

      const data = await res.json();

      if (res.ok && data.success) {
        showToast('success', data.message || 'Status updated');
        fetchPlans(false);
      } else {
        showToast('error', data.error || 'Failed to update status');
      }
    } catch (err) {
      showToast('error', 'Network error occurred');
    }
  };

  const toggleFeatured = async (plan: Plan) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/admin-subscription/plans/${plan.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ isFeatured: !plan.isFeatured })
        }
      );

      if (res.ok) {
        showToast('success', plan.isFeatured ? 'Removed from featured' : 'Marked as featured');
        fetchPlans(false);
      }
    } catch (err) {
      showToast('error', 'Failed to update');
    }
  };

  const updateSortOrder = async (planId: number, newOrder: number) => {
    try {
      await fetch(
        `${API_BASE_URL}/api/admin-subscription/plans/${planId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ sortOrder: newOrder })
        }
      );
      fetchPlans(false);
    } catch (err) {
      console.error('Failed to update sort order');
    }
  };

  // ============================================================================
  // Filter Plans
  // ============================================================================
  const filteredPlans = plans
    .filter(p => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(query) ||
        p.slug.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // ============================================================================
  // Stats
  // ============================================================================
  const stats = {
    total: plans.length,
    active: plans.filter(p => p.status === 'active').length,
    inactive: plans.filter(p => p.status === 'inactive').length,
    featured: plans.filter(p => p.isFeatured).length
  };

  // ============================================================================
  // Render
  // ============================================================================
  return (
    <div className="space-y-6">
      {/* Toast Message */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top ${
          message.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-500" />
            Subscription Plans
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your subscription plans and pricing
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors shadow-lg shadow-amber-500/20"
        >
          <Plus size={18} /> Create Plan
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
              <p className="text-xs text-slate-500">Total Plans</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              <p className="text-xs text-slate-500">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <EyeOff className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-500">{stats.inactive}</p>
              <p className="text-xs text-slate-500">Inactive</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{stats.featured}</p>
              <p className="text-xs text-slate-500">Featured</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search plans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
          />
        </div>
        <label className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded border-slate-300"
          />
          <span className="text-sm text-slate-600 dark:text-slate-400">Show Inactive</span>
        </label>
        <button
          onClick={() => fetchPlans(false)}
          disabled={isRefreshing}
          className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          <RefreshCw className={`w-5 h-5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Plans Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <Package className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <p className="text-slate-500 dark:text-slate-400">
            {searchQuery ? 'No plans found' : 'No subscription plans yet'}
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
          >
            Create First Plan
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Featured
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredPlans.map((plan, index) => (
                  <tr 
                    key={plan.id} 
                    className={`hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors ${
                      plan.status === 'inactive' ? 'opacity-60' : ''
                    }`}
                  >
                    {/* Sort Order */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => index > 0 && updateSortOrder(plan.id, plan.sortOrder - 1)}
                          disabled={index === 0}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded disabled:opacity-30"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <span className="text-sm text-slate-500 w-6 text-center">{plan.sortOrder}</span>
                        <button
                          onClick={() => index < filteredPlans.length - 1 && updateSortOrder(plan.id, plan.sortOrder + 1)}
                          disabled={index === filteredPlans.length - 1}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded disabled:opacity-30"
                        >
                          <ArrowDown size={14} />
                        </button>
                      </div>
                    </td>

                    {/* Plan Info */}
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{plan.name}</p>
                        <p className="text-xs text-slate-500 font-mono">{plan.slug}</p>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="px-4 py-4">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {formatPrice(plan.price, plan.currency)}
                      </span>
                    </td>

                    {/* Duration */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        {plan.isLifetime ? (
                          <Infinity className="w-4 h-4 text-amber-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-slate-400" />
                        )}
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {formatDuration(plan.durationDays, plan.durationType)}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => togglePlanStatus(plan.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          plan.status === 'active'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        {plan.status === 'active' ? (
                          <>
                            <Eye size={12} /> Active
                          </>
                        ) : (
                          <>
                            <EyeOff size={12} /> Inactive
                          </>
                        )}
                      </button>
                    </td>

                    {/* Featured */}
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => toggleFeatured(plan)}
                        className={`p-2 rounded-lg transition-colors ${
                          plan.isFeatured
                            ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100'
                            : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {plan.isFeatured ? <Star size={18} fill="currentColor" /> : <StarOff size={18} />}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => handleOpenModal(plan)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                      >
                        <Edit2 size={14} />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingPlan ? 'Edit Plan' : 'Create New Plan'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {/* Plan Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Plan Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., Monthly Premium"
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Slug *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g., monthly"
                  disabled={!!editingPlan}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-1">
                  URL-friendly identifier. Cannot be changed after creation.
                </p>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Price (MYR) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">RM</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-14 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Duration
                </label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {durationPresets.slice(0, 4).map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleDurationPreset(preset)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                        formData.durationDays === preset.days
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                          : 'border-slate-200 dark:border-slate-700 hover:border-amber-300'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {durationPresets.slice(4).map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleDurationPreset(preset)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                        formData.durationDays === preset.days
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                          : 'border-slate-200 dark:border-slate-700 hover:border-amber-300'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                {formData.durationDays !== null && (
                  <div className="mt-3">
                    <label className="text-xs text-slate-500 mb-1 block">Custom Days</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.durationDays || ''}
                      onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value) || null, durationType: 'days' })}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this plan..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Options Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              {/* Featured Toggle */}
              <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                />
                <div>
                  <p className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                    <Star size={16} className="text-amber-500" />
                    Mark as Featured
                  </p>
                  <p className="text-xs text-slate-500">Featured plans are highlighted to users</p>
                </div>
              </label>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex gap-3">
              <button
                onClick={handleCloseModal}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {editingPlan ? 'Update Plan' : 'Create Plan'}
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

export default AdminPlanManager;
