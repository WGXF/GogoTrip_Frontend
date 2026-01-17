import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Store,
  Search,
  RefreshCw,
  ChevronDown,
  X,
  User,
  Mail,
  Building2,
  Clock,
  CheckCircle2,
  Loader2,
  Eye,
  StickyNote,
  Calendar,
  Tag,
  Inbox,
  ArrowUpRight,
  Shield,
  Lock,
  AlertCircle,
} from 'lucide-react';

// 🔐 Import role utilities
import { isSuperAdmin } from '../../role-utils';

// ================================================
// Types
// ================================================

interface CurrentUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Inquiry {
  id: number;
  inquiryType: 'contact' | 'merchant';
  name: string;
  email: string;
  businessName: string | null;
  subject: string | null;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high';
  assignedAdminId: number | null;
  assignedAdminName: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

interface InquiryStats {
  total: number;
  pending: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
}

interface Admin {
  id: number;
  name: string;
  email: string;
}

// ================================================
// API Functions
// ================================================

import { API_BASE_URL } from '../../config';

async function fetchCurrentUser(): Promise<CurrentUser | null> {
  try {
    // 🔧 使用你现有的 /check_login_status API
    const response = await fetch(`${API_BASE_URL}/check_login_status`, {
      credentials: 'include',
    });
    if (!response.ok) return null;
    const result = await response.json();
    
    if (!result.logged_in) return null;
    
    const user = result.user;
    return {
      id: user.id,
      name: user.full_name || user.name || user.email || 'Admin',
      email: user.email || '',
      role: result.role || user.role || 'admin',
    };
  } catch {
    return null;
  }
}

async function fetchInquiries(params: {
  type?: string;
  status?: string;
  page?: number;
  limit?: number;
  assignedTo?: number;
}): Promise<{ data: Inquiry[]; pagination: any }> {
  const searchParams = new URLSearchParams();
  if (params.type && params.type !== 'all') searchParams.set('type', params.type);
  if (params.status && params.status !== 'all') searchParams.set('status', params.status);
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.assignedTo) searchParams.set('assigned_to', params.assignedTo.toString());

  const response = await fetch(`${API_BASE_URL}/api/admin/inquiries?${searchParams}`, {
    credentials: 'include',
  });
  
  if (!response.ok) throw new Error('Failed to fetch inquiries');
  return response.json();
}

async function fetchInquiryDetail(id: number): Promise<Inquiry> {
  const response = await fetch(`${API_BASE_URL}/api/admin/inquiries/${id}`, {
    credentials: 'include',
  });
  
  if (!response.ok) throw new Error('Failed to fetch inquiry');
  const result = await response.json();
  return result.data;
}

async function updateInquiry(id: number, data: Partial<Inquiry>): Promise<Inquiry> {
  const response = await fetch(`${API_BASE_URL}/api/admin/inquiries/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to update inquiry');
  }
  const result = await response.json();
  return result.data;
}

async function fetchInquiryStats(): Promise<InquiryStats> {
  const response = await fetch(`${API_BASE_URL}/api/admin/inquiries/stats`, {
    credentials: 'include',
  });
  
  if (!response.ok) throw new Error('Failed to fetch stats');
  const result = await response.json();
  return result.data;
}

async function fetchAdmins(): Promise<Admin[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/users/admins`, {
      credentials: 'include',
    });
    if (!response.ok) return [];
    const result = await response.json();
    return result.data || [];
  } catch {
    return [];
  }
}

// ================================================
// Helper Components
// ================================================

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    pending: { bg: 'bg-amber-50', text: 'text-amber-700', icon: <Clock className="w-3 h-3" /> },
    in_progress: { bg: 'bg-blue-50', text: 'text-blue-700', icon: <Loader2 className="w-3 h-3" /> },
    resolved: { bg: 'bg-green-50', text: 'text-green-700', icon: <CheckCircle2 className="w-3 h-3" /> },
    closed: { bg: 'bg-slate-100', text: 'text-slate-600', icon: <X className="w-3 h-3" /> },
  };

  const { bg, text, icon } = config[status] || config.pending;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      {icon}
      {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
    </span>
  );
};

const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
  const config: Record<string, { bg: string; text: string }> = {
    low: { bg: 'bg-slate-100', text: 'text-slate-600' },
    normal: { bg: 'bg-blue-50', text: 'text-blue-600' },
    high: { bg: 'bg-red-50', text: 'text-red-600' },
  };

  const { bg, text } = config[priority] || config.normal;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${bg} ${text}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
};

const TypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const isContact = type === 'contact';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
      isContact ? 'bg-purple-50 text-purple-700' : 'bg-emerald-50 text-emerald-700'
    }`}>
      {isContact ? <MessageSquare className="w-3 h-3" /> : <Store className="w-3 h-3" />}
      {isContact ? 'Contact' : 'Merchant'}
    </span>
  );
};

// ================================================
// Stats Cards
// ================================================

const StatsCards: React.FC<{ stats: InquiryStats | null; loading: boolean }> = ({ stats, loading }) => {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-20 mb-2"></div>
            <div className="h-8 bg-slate-200 rounded w-12"></div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    { label: 'Total Inquiries', value: stats.total, icon: Inbox, color: 'text-slate-600', bg: 'bg-slate-50' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Contact', value: stats.byType?.contact || 0, icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Merchant', value: stats.byType?.merchant || 0, icon: Store, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map((card, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">{card.label}</span>
            <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800">{card.value}</div>
        </div>
      ))}
    </div>
  );
};

// ================================================
// Inquiry Detail Drawer
// ================================================

interface DetailDrawerProps {
  inquiry: Inquiry | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: number, data: Partial<Inquiry>) => Promise<void>;
  admins: Admin[];
  currentUser: CurrentUser;
}

const DetailDrawer: React.FC<DetailDrawerProps> = ({ 
  inquiry, 
  isOpen, 
  onClose, 
  onUpdate, 
  admins,
  currentUser 
}) => {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    status: '',
    priority: '',
    assignedAdminId: '',
    adminNotes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔐 Permission checks
  const canAssign = isSuperAdmin(currentUser.role);
  const canEdit = canAssign || (inquiry?.assignedAdminId === currentUser.id);

  useEffect(() => {
    if (inquiry) {
      setFormData({
        status: inquiry.status,
        priority: inquiry.priority,
        assignedAdminId: inquiry.assignedAdminId?.toString() || '',
        adminNotes: inquiry.adminNotes || '',
      });
      setEditMode(false);
      setError(null);
    }
  }, [inquiry]);

  const handleSave = async () => {
    if (!inquiry) return;
    setError(null);
    setSaving(true);
    
    try {
      const updatePayload: any = {
        status: formData.status,
        priority: formData.priority,
        adminNotes: formData.adminNotes,
      };

      // 🔐 Only super_admin can change assignment
      if (canAssign) {
        updatePayload.assignedAdminId = formData.assignedAdminId 
          ? parseInt(formData.assignedAdminId) 
          : null;
      }

      await onUpdate(inquiry.id, updatePayload);
      setEditMode(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update inquiry');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !inquiry) return null;

  const isAssignedToMe = inquiry.assignedAdminId === currentUser.id;
  const isUnassigned = !inquiry.assignedAdminId;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      
      <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl z-50 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <TypeBadge type={inquiry.inquiryType} />
            <span className="text-slate-400">#{inquiry.id}</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Permission Notice */}
          {!canAssign && !isAssignedToMe && !isUnassigned && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">View Only</p>
                <p className="text-sm text-amber-700">This inquiry is assigned to another admin.</p>
              </div>
            </div>
          )}

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Contact Information</h3>
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-slate-400" />
                <span className="font-medium text-slate-800">{inquiry.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-400" />
                <a href={`mailto:${inquiry.email}`} className="text-blue-600 hover:underline">{inquiry.email}</a>
              </div>
              {inquiry.businessName && (
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700">{inquiry.businessName}</span>
                </div>
              )}
              {inquiry.subject && (
                <div className="flex items-center gap-3">
                  <Tag className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700">{inquiry.subject}</span>
                </div>
              )}
            </div>
          </div>

          {/* Message */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Message</h3>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{inquiry.message}</p>
            </div>
          </div>

          {/* Status & Assignment */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Status & Assignment</h3>
              {!editMode && canEdit && (
                <button onClick={() => setEditMode(true)} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Edit
                </button>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
            )}

            {editMode ? (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>

                {/* 🔐 Assigned Admin - Only for super_admin */}
                {canAssign ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      <span className="flex items-center gap-2">
                        Assigned Admin
                        <Shield className="w-3 h-3 text-purple-500" />
                      </span>
                    </label>
                    <select
                      value={formData.assignedAdminId}
                      onChange={(e) => setFormData({ ...formData, assignedAdminId: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="">Unassigned</option>
                      {admins.map((admin) => (
                        <option key={admin.id} value={admin.id}>
                          {admin.name} ({admin.email})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      <span className="flex items-center gap-2">
                        Assigned Admin
                        <Lock className="w-3 h-3 text-slate-400" />
                      </span>
                    </label>
                    <div className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-100 text-slate-600">
                      {inquiry.assignedAdminName || 'Unassigned'}
                      <span className="text-xs text-slate-400 ml-2">(Super Admin only)</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Admin Notes</label>
                  <textarea
                    value={formData.adminNotes}
                    onChange={(e) => setFormData({ ...formData, adminNotes: e.target.value })}
                    rows={3}
                    placeholder="Internal notes..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Save Changes
                  </button>
                  <button
                    onClick={() => { setEditMode(false); setError(null); }}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Status</span>
                  <StatusBadge status={inquiry.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Priority</span>
                  <PriorityBadge priority={inquiry.priority} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Assigned To</span>
                  <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    {inquiry.assignedAdminName || 'Unassigned'}
                    {isAssignedToMe && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">You</span>}
                  </span>
                </div>
                {inquiry.adminNotes && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-sm text-slate-500 flex items-center gap-1 mb-1">
                      <StickyNote className="w-3 h-3" /> Admin Notes
                    </span>
                    <p className="text-sm text-slate-600">{inquiry.adminNotes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Timestamps */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Timeline</h3>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> Created
                </span>
                <span className="text-slate-700">{new Date(inquiry.createdAt).toLocaleString()}</span>
              </div>
              {inquiry.resolvedAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-green-500" /> Resolved
                  </span>
                  <span className="text-green-600 font-medium">{new Date(inquiry.resolvedAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <a
            href={`mailto:${inquiry.email}?subject=Re: ${inquiry.subject || 'Your Inquiry'}`}
            className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Reply via Email
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </>
  );
};

// ================================================
// Main Component (No props required!)
// ================================================

const InquiryManager: React.FC = () => {
  // 🆕 Fetch current user automatically
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  // State
  const [activeTab, setActiveTab] = useState<'all' | 'contact' | 'merchant'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'mine' | 'unassigned'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [stats, setStats] = useState<InquiryStats | null>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  // 🔐 Permission checks (with null safety)
  const canViewAll = currentUser ? isSuperAdmin(currentUser.role) : false;
  const canAssign = currentUser ? isSuperAdmin(currentUser.role) : false;

  // 🆕 Load current user on mount
  useEffect(() => {
    const loadUser = async () => {
      setUserLoading(true);
      const user = await fetchCurrentUser();
      setCurrentUser(user);
      setUserLoading(false);
    };
    loadUser();
  }, []);

  // Load inquiries
  const loadInquiries = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      let assignedTo: number | undefined;
      if (!canViewAll && assignmentFilter === 'all') {
        assignedTo = currentUser.id;
      } else if (assignmentFilter === 'mine') {
        assignedTo = currentUser.id;
      }

      const result = await fetchInquiries({
        type: activeTab,
        status: statusFilter,
        page,
        limit: 20,
        assignedTo,
      });
      setInquiries(result.data || []);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Failed to load inquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const data = await fetchInquiryStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadAdmins = async () => {
    if (canAssign) {
      const data = await fetchAdmins();
      setAdmins(data);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadInquiries();
    }
  }, [currentUser, activeTab, statusFilter, assignmentFilter, page]);

  useEffect(() => {
    if (currentUser) {
      loadStats();
      loadAdmins();
    }
  }, [currentUser]);

  const handleViewDetail = async (inquiry: Inquiry) => {
    try {
      const detail = await fetchInquiryDetail(inquiry.id);
      setSelectedInquiry(detail);
      setDrawerOpen(true);
    } catch (error) {
      console.error('Failed to load inquiry detail:', error);
    }
  };

  const handleUpdateInquiry = async (id: number, data: Partial<Inquiry>) => {
    const updated = await updateInquiry(id, data);
    setSelectedInquiry(updated);
    loadInquiries();
    loadStats();
  };

  const handleRefresh = () => {
    loadInquiries();
    loadStats();
  };

  // Filter by search
  const filteredInquiries = inquiries.filter((inquiry) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      inquiry.name.toLowerCase().includes(query) ||
      inquiry.email.toLowerCase().includes(query) ||
      inquiry.businessName?.toLowerCase().includes(query) ||
      inquiry.subject?.toLowerCase().includes(query) ||
      inquiry.message.toLowerCase().includes(query)
    );
  });

  // 🆕 Loading state for user
  if (userLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  // 🆕 Error state if no user
  if (!currentUser) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-red-800">Authentication Required</h3>
        <p className="text-red-600 mt-1">Please log in to access the inquiry management.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            Inquiry Management
            {canAssign && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full flex items-center gap-1">
                <Shield className="w-3 h-3" /> Super Admin
              </span>
            )}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {canViewAll 
              ? 'Manage contact and merchant partnership inquiries' 
              : 'View and handle inquiries assigned to you'}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} loading={statsLoading} />

      {/* Tabs & Content */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          {[
            { id: 'all', label: 'All Inquiries', icon: Inbox },
            { id: 'contact', label: 'Contact', icon: MessageSquare },
            { id: 'merchant', label: 'Merchant', icon: Store },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setPage(1); }}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.id !== 'all' && stats && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {stats.byType?.[tab.id] || 0}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg"
            />
          </div>

          {canViewAll && (
            <div className="relative">
              <select
                value={assignmentFilter}
                onChange={(e) => { setAssignmentFilter(e.target.value as any); setPage(1); }}
                className="appearance-none px-4 py-2 pr-10 border border-slate-200 rounded-lg bg-white text-slate-600"
              >
                <option value="all">All Assignments</option>
                <option value="mine">Assigned to Me</option>
                <option value="unassigned">Unassigned</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          )}

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="appearance-none px-4 py-2 pr-10 border border-slate-200 rounded-lg bg-white text-slate-600"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : filteredInquiries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Inbox className="w-12 h-12 text-slate-300 mb-3" />
              <p className="font-medium">No inquiries found</p>
              <p className="text-sm">{!canViewAll ? 'No inquiries are assigned to you yet' : 'Try adjusting your filters'}</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Contact</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Subject / Business</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Assigned</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Created</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInquiries.map((inquiry) => {
                  const isAssignedToMe = inquiry.assignedAdminId === currentUser.id;
                  
                  return (
                    <tr
                      key={inquiry.id}
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() => handleViewDetail(inquiry)}
                    >
                      <td className="px-4 py-3"><TypeBadge type={inquiry.inquiryType} /></td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{inquiry.name}</div>
                        <div className="text-sm text-slate-500">{inquiry.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-xs truncate text-slate-600">
                          {inquiry.inquiryType === 'merchant' ? inquiry.businessName : inquiry.subject || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={inquiry.status} /></td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-600 flex items-center gap-1">
                          {inquiry.assignedAdminName || <span className="text-slate-400 italic">Unassigned</span>}
                          {isAssignedToMe && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded ml-1">You</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-500">{new Date(inquiry.createdAt).toLocaleDateString()}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleViewDetail(inquiry); }}
                          className="p-2 hover:bg-slate-100 rounded-lg"
                        >
                          <Eye className="w-4 h-4 text-slate-400" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
            <span className="text-sm text-slate-500">
              Showing {((page - 1) * 20) + 1} - {Math.min(page * 20, pagination.total)} of {pagination.total}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-slate-200 rounded-lg text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="px-3 py-1 border border-slate-200 rounded-lg text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Drawer */}
      {currentUser && (
        <DetailDrawer
          inquiry={selectedInquiry}
          isOpen={drawerOpen}
          onClose={() => { setDrawerOpen(false); setSelectedInquiry(null); }}
          onUpdate={handleUpdateInquiry}
          admins={admins}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default InquiryManager;
