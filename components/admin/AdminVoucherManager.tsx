import React, { useState, useEffect } from 'react';
import { 
  Plus, Tag, Percent, Key, Calendar, Users, Trash2, 
  Edit2, Eye, X, Loader2, Search, Filter, AlertCircle,
  Gift, Clock, CheckCircle
} from 'lucide-react';
import { API_BASE_URL } from '../../config';

interface Voucher {
  id: number;
  code: string;
  name: string;
  description: string;
  voucherType: 'discount' | 'activation';
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minAmount: number;
  maxDiscount: number | null;
  activationDays: number | null;
  activationPlanId: number | null;
  maxUses: number;
  currentUses: number;
  maxUsesPerUser: number;
  applicablePlans: number[];
  validFrom: string | null;
  validUntil: string | null;
  status: string;
  isValid: boolean;
  remainingUses: number;
  createdAt: string;
}

interface Plan {
  id: number;
  name: string;
  slug: string;
  price: number;
}

interface VoucherUsage {
  id: number;
  userId: number;
  userName: string | null;
  userEmail: string | null;
  usageType: string;
  discountAmount: number;
  createdAt: string;
}

const initialFormData = {
  code: '',
  name: '',
  description: '',
  voucherType: 'discount' as 'discount' | 'activation',
  discountType: 'percentage' as 'percentage' | 'fixed',
  discountValue: 10,
  minAmount: 0,
  maxDiscount: null as number | null,
  activationDays: 30,
  activationPlanId: null as number | null,
  maxUses: 100,
  maxUsesPerUser: 1,
  applicablePlans: [] as number[],
  validFrom: '',
  validUntil: '',
  status: 'active'
};

export const AdminVoucherManager: React.FC = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Usage Modal
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [selectedVoucherId, setSelectedVoucherId] = useState<number | null>(null);
  const [usages, setUsages] = useState<VoucherUsage[]>([]);
  const [isLoadingUsages, setIsLoadingUsages] = useState(false);

  useEffect(() => {
    fetchVouchers();
    fetchPlans();
  }, [statusFilter, typeFilter]);

  const fetchPlans = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin-subscription/plans?include_inactive=true`, {
        credentials: 'include'
      });
      const data = await res.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const fetchVouchers = async () => {
    setIsLoading(true);
    try {
      let url = `${API_BASE_URL}/api/admin-subscription/vouchers`;
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (params.toString()) url += `?${params.toString()}`;
      
      const res = await fetch(url, { credentials: 'include' });
      const data = await res.json();
      setVouchers(data.vouchers || []);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsages = async (voucherId: number) => {
    setIsLoadingUsages(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin-subscription/vouchers/${voucherId}/usages`, {
        credentials: 'include'
      });
      const data = await res.json();
      setUsages(data.usages || []);
    } catch (error) {
      console.error('Error fetching usages:', error);
    } finally {
      setIsLoadingUsages(false);
    }
  };

  const handleOpenModal = (voucher?: Voucher) => {
    if (voucher) {
      setEditingVoucher(voucher);
      setFormData({
        code: voucher.code,
        name: voucher.name || '',
        description: voucher.description || '',
        voucherType: voucher.voucherType,
        discountType: voucher.discountType || 'percentage',
        discountValue: voucher.discountValue || 10,
        minAmount: voucher.minAmount || 0,
        maxDiscount: voucher.maxDiscount,
        activationDays: voucher.activationDays || 30,
        activationPlanId: voucher.activationPlanId,
        maxUses: voucher.maxUses,
        maxUsesPerUser: voucher.maxUsesPerUser,
        applicablePlans: voucher.applicablePlans || [],
        validFrom: voucher.validFrom?.split(' ')[0] || '',
        validUntil: voucher.validUntil?.split(' ')[0] || '',
        status: voucher.status
      });
    } else {
      setEditingVoucher(null);
      setFormData(initialFormData);
    }
    setError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingVoucher(null);
    setError('');
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.code.trim()) {
      setError('Voucher code is required');
      return;
    }
    
    if (formData.voucherType === 'discount' && (!formData.discountValue || formData.discountValue <= 0)) {
      setError('Discount value must be greater than 0');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const url = editingVoucher 
        ? `${API_BASE_URL}/api/admin-subscription/vouchers/${editingVoucher.id}`
        : `${API_BASE_URL}/api/admin-subscription/vouchers`;
      
      const method = editingVoucher ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          code: formData.code.toUpperCase().trim(),
          name: formData.name,
          description: formData.description,
          voucherType: formData.voucherType,
          discountType: formData.discountType,
          discountValue: formData.discountValue,
          minAmount: formData.minAmount,
          maxDiscount: formData.maxDiscount,
          activationDays: formData.voucherType === 'activation' ? formData.activationDays : null,
          activationPlanId: formData.voucherType === 'activation' ? formData.activationPlanId : null,
          maxUses: formData.maxUses,
          maxUsesPerUser: formData.maxUsesPerUser,
          applicablePlans: formData.applicablePlans,
          validFrom: formData.validFrom || null,
          validUntil: formData.validUntil || null,
          status: formData.status
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        fetchVouchers();
        handleCloseModal();
      } else {
        setError(data.error || 'Failed to save voucher');
      }
    } catch (err) {
      setError('Failed to save voucher');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (id: number) => {
    try {
      await fetch(`${API_BASE_URL}/api/admin-subscription/vouchers/${id}/toggle-status`, {
        method: 'POST',
        credentials: 'include'
      });
      fetchVouchers();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const handleViewUsages = (voucher: Voucher) => {
    setSelectedVoucherId(voucher.id);
    setShowUsageModal(true);
    fetchUsages(voucher.id);
  };

  const filteredVouchers = vouchers.filter(v => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return v.code.toLowerCase().includes(query) || 
             v.name?.toLowerCase().includes(query);
    }
    return true;
  });

  const getTypeIcon = (type: string) => {
    return type === 'discount' 
      ? <Percent className="w-5 h-5 text-green-500" />
      : <Key className="w-5 h-5 text-purple-500" />;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      inactive: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
      exhausted: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
    };
    return styles[status as keyof typeof styles] || styles.inactive;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Voucher Management</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Create and manage discount codes and activation codes
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors"
        >
          <Plus size={18} /> Create Voucher
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by code or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
        >
          <option value="all">All Types</option>
          <option value="discount">Discount</option>
          <option value="activation">Activation</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="exhausted">Exhausted</option>
        </select>
      </div>

      {/* Vouchers List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      ) : filteredVouchers.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No vouchers found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredVouchers.map((v) => (
            <div key={v.id} className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getTypeIcon(v.voucherType)}
                    <span className="font-mono font-bold text-lg text-slate-900 dark:text-white">
                      {v.code}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(v.status)}`}>
                      {v.status}
                    </span>
                    {!v.isValid && v.status === 'active' && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">
                        Expired
                      </span>
                    )}
                  </div>
                  
                  {v.name && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{v.name}</p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                    {v.voucherType === 'discount' ? (
                      <span className="flex items-center gap-1">
                        <Tag size={14} />
                        {v.discountType === 'percentage' ? `${v.discountValue}% off` : `RM${v.discountValue} off`}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {v.activationDays ? `${v.activationDays} days` : 'Lifetime'}
                      </span>
                    )}
                    
                    <span className="flex items-center gap-1">
                      <Users size={14} />
                      {v.currentUses}/{v.maxUses} used
                    </span>
                    
                    {v.validUntil && (
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        Until {v.validUntil.split(' ')[0]}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewUsages(v)}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View Usages"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => handleOpenModal(v)}
                    className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => toggleStatus(v.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      v.status === 'active'
                        ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                    }`}
                  >
                    {v.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-lg my-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingVoucher ? 'Edit Voucher' : 'Create Voucher'}
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {/* Voucher Code */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Voucher Code *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., SAVE20"
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono uppercase"
                  disabled={!!editingVoucher}
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., New Year Promotion"
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              {/* Voucher Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Voucher Type *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, voucherType: 'discount' })}
                    className={`p-3 rounded-lg border-2 flex items-center gap-2 transition-colors ${
                      formData.voucherType === 'discount'
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Percent size={18} className={formData.voucherType === 'discount' ? 'text-green-500' : 'text-slate-400'} />
                    <span className="font-medium">Discount</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, voucherType: 'activation' })}
                    className={`p-3 rounded-lg border-2 flex items-center gap-2 transition-colors ${
                      formData.voucherType === 'activation'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Key size={18} className={formData.voucherType === 'activation' ? 'text-purple-500' : 'text-slate-400'} />
                    <span className="font-medium">Activation</span>
                  </button>
                </div>
              </div>

              {/* Discount Settings */}
              {formData.voucherType === 'discount' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Discount Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, discountType: 'percentage' })}
                        className={`p-2 rounded-lg border text-center transition-colors ${
                          formData.discountType === 'percentage'
                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Percentage (%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, discountType: 'fixed' })}
                        className={`p-2 rounded-lg border text-center transition-colors ${
                          formData.discountType === 'fixed'
                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Fixed (RM)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Discount Value *
                      </label>
                      <input
                        type="number"
                        value={formData.discountValue}
                        onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Min Amount (RM)
                      </label>
                      <input
                        type="number"
                        value={formData.minAmount}
                        onChange={(e) => setFormData({ ...formData, minAmount: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                  </div>

                  {formData.discountType === 'percentage' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Max Discount (RM) - Optional
                      </label>
                      <input
                        type="number"
                        value={formData.maxDiscount || ''}
                        onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value ? parseFloat(e.target.value) : null })}
                        placeholder="No limit"
                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                  )}
                </>
              )}

              {/* Activation Settings */}
              {formData.voucherType === 'activation' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Activation Days (leave empty for lifetime)
                  </label>
                  <input
                    type="number"
                    value={formData.activationDays || ''}
                    onChange={(e) => setFormData({ ...formData, activationDays: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="e.g., 30 (or leave empty for lifetime)"
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              )}

              {/* Usage Limits */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Total Uses
                  </label>
                  <input
                    type="number"
                    value={formData.maxUses}
                    onChange={(e) => setFormData({ ...formData, maxUses: parseInt(e.target.value) || 1 })}
                    min="1"
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Per User Limit
                  </label>
                  <input
                    type="number"
                    value={formData.maxUsesPerUser}
                    onChange={(e) => setFormData({ ...formData, maxUsesPerUser: parseInt(e.target.value) || 1 })}
                    min="1"
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              {/* Validity Period */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Valid From
                  </label>
                  <input
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Valid Until
                  </label>
                  <input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Internal notes or description..."
                  rows={2}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg resize-none"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
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
                ) : editingVoucher ? (
                  'Update Voucher'
                ) : (
                  'Create Voucher'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Usage History Modal */}
      {showUsageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Usage History</h3>
              <button
                onClick={() => setShowUsageModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            {isLoadingUsages ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              </div>
            ) : usages.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No usage history yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {usages.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {u.userName || u.userEmail || `User #${u.userId}`}
                      </p>
                      <p className="text-xs text-slate-500">{u.createdAt}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded ${
                        u.usageType === 'activation' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {u.usageType}
                      </span>
                      {u.discountAmount > 0 && (
                        <p className="text-sm text-green-600 mt-1">
                          -RM {u.discountAmount.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVoucherManager;