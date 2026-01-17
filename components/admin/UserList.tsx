import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { 
  Pencil, Trash2, MoreHorizontal, CheckCircle, XCircle, Search, 
  AlertTriangle, X, Download, Plus, Save, CheckCircle2, AlertCircle,
  Mail, Clock, Calendar, ShieldAlert, RefreshCw, Shield, ShieldCheck,
  UserCog, Info
} from 'lucide-react';

// =============================================
// 🔥 STANDARDIZED ROLE ENUM (matches backend)
// =============================================
const UserRole = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  USER: 'user',
} as const;

type RoleType = typeof UserRole[keyof typeof UserRole];

// Role display configuration
const ROLE_CONFIG: Record<RoleType, { label: string; color: string; icon: React.ReactNode; bgColor: string }> = {
  [UserRole.SUPER_ADMIN]: {
    label: 'Super Admin',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50 border-purple-200',
    icon: <ShieldCheck className="w-3 h-3" />
  },
  [UserRole.ADMIN]: {
    label: 'Admin',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-200',
    icon: <Shield className="w-3 h-3" />
  },
  [UserRole.USER]: {
    label: 'User',
    color: 'text-slate-600',
    bgColor: 'bg-slate-50 border-slate-200',
    icon: <UserCog className="w-3 h-3" />
  },
};

// Extended User type
interface ExtendedUser extends User {
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  isVerified?: boolean;
  avatarUrl?: string;
  isPremium?: boolean;
  isLifetime?: boolean;
  subscriptionEndDate?: string;
  remainingDays?: number;
  currentPlanLevel?: number;
  currentPlanName?: string;
  hasGoogleCalendar?: boolean;
  hasPassword?: boolean;
  hasGoogleId?: boolean;
  stripeCustomerId?: string;
  relatedData?: RelatedData;
}

interface RelatedData {
  trips: number;
  calendarEvents: number;
  subscriptions: number;
  notifications: number;
  expenses: number;
  schedulerItems: number;
  hasActiveSubscription: boolean;
}

interface Notification {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface DeleteConfirmation {
  isOpen: boolean;
  user: ExtendedUser | null;
  type: 'pending' | 'active' | null;
}

// Available role option from backend
interface RoleOption {
  value: RoleType;
  label: string;
  description: string;
}

// =============================================
// 🔥 MAIN COMPONENT
// =============================================
export const UserList: React.FC = () => {
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // 🔥 NEW: Permission states from backend
  const [currentAdminRole, setCurrentAdminRole] = useState<RoleType>(UserRole.ADMIN);
  const [canManageAdmins, setCanManageAdmins] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<RoleOption[]>([
    { value: UserRole.USER, label: 'User', description: 'Regular user' }
  ]);
  
  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ExtendedUser | null>(null);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUser, setNewUser] = useState<Partial<ExtendedUser>>({
    email: '',
    role: UserRole.USER,
    status: 'active'
  });

  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation>({
    isOpen: false,
    user: null,
    type: null
  });

  const [resendingEmail, setResendingEmail] = useState<number | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchAvailableRoles();
  }, []);

  const showNotification = (type: Notification['type'], message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // 🔥 NEW: Fetch available roles based on current admin's permissions
  const fetchAvailableRoles = async () => {
    try {
      const response = await fetch('/api/admin/available-roles');
      if (response.ok) {
        const data = await response.json();
        setAvailableRoles(data.availableRoles || [{ value: UserRole.USER, label: 'User', description: 'Regular user' }]);
        setCurrentAdminRole(data.currentRole || UserRole.ADMIN);
        setCanManageAdmins(data.canManageAdmins || false);
      }
    } catch (error) {
      console.error('Failed to fetch available roles:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(Array.isArray(data) ? data : (data.users || []));
        
        // 🔥 Extract permission info from response
        if (data.currentAdminRole) {
          setCurrentAdminRole(data.currentAdminRole);
        }
        if (typeof data.canManageAdmins === 'boolean') {
          setCanManageAdmins(data.canManageAdmins);
        }
      } else {
        console.error('Failed to fetch users');
        showNotification('error', 'Failed to fetch user list');
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification('error', 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  // Get role badge component
  const getRoleBadge = (role: string) => {
    const normalizedRole = (role?.toLowerCase() || 'user') as RoleType;
    const config = ROLE_CONFIG[normalizedRole] || ROLE_CONFIG[UserRole.USER];
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bgColor} ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const getStatusBadge = (status: string, isVerified: boolean) => {
    if (status === 'pending_verification' || !isVerified) {
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        icon: <Clock className="w-3 h-3" />,
        label: 'Pending Verification'
      };
    } else if (status === 'active') {
      return {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200',
        icon: <CheckCircle className="w-3 h-3" />,
        label: 'Active'
      };
    } else if (status === 'suspended') {
      return {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        icon: <XCircle className="w-3 h-3" />,
        label: 'Suspended'
      };
    } else {
      return {
        bg: 'bg-slate-50',
        text: 'text-slate-700',
        border: 'border-slate-200',
        icon: <AlertTriangle className="w-3 h-3" />,
        label: status
      };
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleResendVerification = async (user: ExtendedUser) => {
    if (user.status !== 'pending_verification') {
      showNotification('error', 'User is already verified');
      return;
    }

    setResendingEmail(user.id);
    
    try {
      const response = await fetch(`/api/admin/users/${user.id}/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        showNotification('success', `Verification email sent to ${user.email}`);
      } else {
        const error = await response.json();
        showNotification('error', error.message || 'Failed to send verification email');
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification('error', 'Network error occurred');
    } finally {
      setResendingEmail(null);
    }
  };

  const handleDeleteClick = (user: ExtendedUser) => {
    // 🔥 Permission check: Regular admin cannot delete admin users
    const userRole = user.role?.toLowerCase();
    if (!canManageAdmins && (userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN)) {
      showNotification('error', 'Permission denied: Cannot delete admin users');
      return;
    }
    
    const type = user.status === 'pending_verification' ? 'pending' : 'active';
    setDeleteConfirmation({ isOpen: true, user, type });
  };

  const confirmDeleteUser = async () => {
    const { user } = deleteConfirmation;
    if (!user) return;

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        setUsers(users.filter(u => u.id !== user.id));
        showNotification('success', `User ${user.email} deleted successfully`);
        setDeleteConfirmation({ isOpen: false, user: null, type: null });
      } else {
        const error = await response.json();
        showNotification('error', error.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification('error', 'Network error occurred');
    }
  };

  const handleEdit = (user: ExtendedUser) => {
    // 🔥 Permission check: Regular admin cannot edit admin users
    const userRole = user.role?.toLowerCase();
    if (!canManageAdmins && (userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN)) {
      showNotification('error', 'Permission denied: Cannot edit admin users');
      return;
    }
    
    setEditingUser({...user});
    setIsEditModalOpen(true);
  };

  const saveEdit = async () => {
    if (editingUser) {
      try {
        const response = await fetch(`/api/admin/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: editingUser.email,
            role: editingUser.role,
            status: editingUser.status
          })
        });

        if (response.ok) {
          const updatedUser = await response.json();
          setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...updatedUser } : u));
          setIsEditModalOpen(false);
          setEditingUser(null);
          showNotification('success', 'User updated successfully');
        } else {
          const error = await response.json();
          showNotification('error', error.error || 'Failed to update user');
        }
      } catch (error) {
        console.error("Update error:", error);
        showNotification('error', 'Update failed due to network error');
      }
    }
  };

  const handleAddUser = () => {
    setNewUser({
      email: '',
      role: UserRole.USER,
      status: 'active'
    });
    setIsAddModalOpen(true);
  };

  const confirmAddUser = async () => {
    if (newUser.email) {
      try {
        const payload = {
          email: newUser.email,
          role: newUser.role || UserRole.USER,
          status: newUser.status || 'active'
        };

        const response = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const createdUser = await response.json();
          setUsers([createdUser, ...users]);
          setIsAddModalOpen(false);
          setNewUser({ email: '', role: UserRole.USER, status: 'active' });
          showNotification('success', 'User added successfully. Temporary password sent via email.');
        } else {
          const err = await response.json();
          showNotification('error', err.error || "Failed to add user");
        }
      } catch (error) {
        console.error("Add error:", error);
        showNotification('error', "Network error occurred");
      }
    }
  };

  const handleExport = () => {
    const usersToExport = selectedIds.length > 0 
      ? users.filter(u => selectedIds.includes(u.id))
      : users;

    const headers = [
      'User ID', 'Email', 'Full Name', 'Role', 'Status', 'Email Verified',
      'Last Login', 'Created At', 'Updated At', 'Deleted At',
      'Is Premium', 'Plan Name', 'Plan Level', 'Sub End Date', 'Is Lifetime', 'Remaining Days',
      'Stripe Customer ID', 'Has Google Calendar', 'Has Password', 'Has Google ID',
      'Total Trips', 'Total Expenses', 'Total Calendar Events', 'Scheduler Items', 'Total Notifications'
    ];

    const rows = usersToExport.map(u => {
      const safe = (val: any) => {
        if (val === null || val === undefined) return '';
        const str = String(val);
        return str.includes(',') ? `"${str}"` : str;
      };
      const bool = (val?: boolean) => val ? 'Yes' : 'No';

      return [
        safe(u.id), safe(u.email), safe(u.name), safe(u.role), safe(u.status),
        bool(u.isVerified), safe(u.lastLogin), safe(u.createdAt), safe(u.updatedAt), safe(u.deletedAt),
        bool(u.isPremium), safe(u.currentPlanName), safe(u.currentPlanLevel),
        safe(u.subscriptionEndDate), bool(u.isLifetime), safe(u.remainingDays),
        safe(u.stripeCustomerId), bool(u.hasGoogleCalendar), bool(u.hasPassword), bool(u.hasGoogleId),
        safe(u.relatedData?.trips || 0), safe(u.relatedData?.expenses || 0),
        safe(u.relatedData?.calendarEvents || 0), safe(u.relatedData?.schedulerItems || 0),
        safe(u.relatedData?.notifications || 0)
      ].join(',');
    }).join('\n');
    
    const csvContent = `${headers.join(',')}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const filenameType = selectedIds.length > 0 ? 'selected' : 'full_database';
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `gogotrip_users_${filenameType}_${dateStr}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('success', `Export completed (${usersToExport.length} records)`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedUsers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedUsers.map(u => u.id));
    }
  };

  const toggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Filtering & Pagination
  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 🔥 Check if current admin can modify a specific user
  const canModifyUser = (user: ExtendedUser): boolean => {
    if (canManageAdmins) return true;
    const userRole = user.role?.toLowerCase();
    return userRole !== UserRole.ADMIN && userRole !== UserRole.SUPER_ADMIN;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-right duration-300 ${
          notification.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
          notification.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
          notification.type === 'info' ? 'bg-blue-50 border border-blue-200 text-blue-800' :
          'bg-amber-50 border border-amber-200 text-amber-800'
        }`}>
          {notification.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
          {notification.type === 'error' && <AlertCircle className="w-5 h-5" />}
          {notification.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
          {notification.type === 'info' && <Info className="w-5 h-5" />}
          <span className="text-sm font-medium">{notification.message}</span>
          <button onClick={() => setNotification(null)}>
            <X className="w-4 h-4 opacity-60 hover:opacity-100" />
          </button>
        </div>
      )}

      {/* 🔥 Permission Info Banner */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
        canManageAdmins 
          ? 'bg-purple-50 border-purple-200' 
          : 'bg-blue-50 border-blue-200'
      }`}>
        {canManageAdmins ? (
          <ShieldCheck className="w-5 h-5 text-purple-600" />
        ) : (
          <Shield className="w-5 h-5 text-blue-600" />
        )}
        <div className="flex-1">
          <span className={`text-sm font-medium ${canManageAdmins ? 'text-purple-800' : 'text-blue-800'}`}>
            {canManageAdmins ? 'Super Admin Access' : 'Admin Access'}
          </span>
          <span className={`text-sm ml-2 ${canManageAdmins ? 'text-purple-600' : 'text-blue-600'}`}>
            {canManageAdmins 
              ? '— You can view and manage all users including other admins'
              : '— You can only view and manage regular users'}
          </span>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
          canManageAdmins 
            ? 'bg-purple-100 text-purple-700' 
            : 'bg-blue-100 text-blue-700'
        }`}>
          {currentAdminRole}
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">User Management</h2>
          <p className="text-sm text-slate-500 mt-1">
            {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} found
            {!canManageAdmins && ' (regular users only)'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
          >
            <Download size={16} />
            Export {selectedIds.length > 0 ? `(${selectedIds.length})` : 'All'}
          </button>
          <button
            onClick={handleAddUser}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={16} />
            Add User
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search by email, role, or status..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === paginatedUsers.length && paginatedUsers.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedUsers.map((user) => {
                const statusBadge = getStatusBadge(user.status, user.isVerified ?? true);
                const isModifiable = canModifyUser(user);
                
                return (
                  <tr key={user.id} className={`hover:bg-slate-50/50 transition-colors ${!isModifiable ? 'bg-slate-50/30' : ''}`}>
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(user.id)}
                        onChange={() => toggleSelect(user.id)}
                        className="rounded border-slate-300"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium text-sm">
                          {user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">{user.email}</div>
                          <div className="text-xs text-slate-400">ID: {user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                          {statusBadge.icon}
                          {statusBadge.label}
                        </span>
                        {user.status === 'pending_verification' && (
                          <button
                            onClick={() => handleResendVerification(user)}
                            disabled={resendingEmail === user.id}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
                          >
                            {resendingEmail === user.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Mail className="w-3 h-3" />
                            )}
                            Resend Email
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(user.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {isModifiable ? (
                          <>
                            <button
                              onClick={() => handleEdit(user)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit user"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(user)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete user"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400 px-2 py-1 bg-slate-100 rounded">
                            Protected
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="text-sm text-slate-500">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length}
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 text-sm border rounded-lg ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && deleteConfirmation.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`p-6 flex items-start gap-4 ${
              deleteConfirmation.type === 'active' ? 'bg-red-50' : 'bg-amber-50'
            }`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                deleteConfirmation.type === 'active' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
              }`}>
                {deleteConfirmation.type === 'active' ? <ShieldAlert size={20} /> : <AlertTriangle size={20} />}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  {deleteConfirmation.type === 'active' ? 'Delete Active User?' : 'Delete Pending User?'}
                </h3>
                <p className="text-sm text-slate-600">
                  {deleteConfirmation.type === 'active' 
                    ? 'This user has an active account with data. This action cannot be undone.' 
                    : 'This user has not completed email verification yet.'}
                </p>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-4 p-4 bg-slate-50 rounded-lg">
                <div className="text-sm text-slate-600 mb-2">You are about to delete:</div>
                <div className="font-medium text-slate-900">{deleteConfirmation.user.email}</div>
                <div className="text-xs text-slate-500 mt-1">
                  Status: {deleteConfirmation.user.status} | Role: {deleteConfirmation.user.role}
                </div>
              </div>

              {deleteConfirmation.type === 'active' && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-red-800">
                      <div className="font-medium mb-1">Warning: Active User</div>
                      <div className="text-xs text-red-700">
                        This will permanently delete all associated data including trips, expenses, 
                        and scheduler items. Consider suspending instead of deleting.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50/50 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmation({ isOpen: false, user: null, type: null })}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteUser}
                className={`px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-2 ${
                  deleteConfirmation.type === 'active' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                <Trash2 size={16} />
                {deleteConfirmation.type === 'active' ? 'Delete User' : 'Delete Pending User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">Edit User</h3>
              <button onClick={() => setIsEditModalOpen(false)}>
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {/* 🔥 Only show available roles based on permission */}
                    {availableRoles.map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  {!canManageAdmins && (
                    <p className="text-xs text-slate-400 mt-1">
                      Only super_admin can assign admin roles
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={editingUser.status}
                    onChange={(e) => setEditingUser({...editingUser, status: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="pending_verification">Pending Verification</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
              >
                <Save size={16} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">Add New User</h3>
              <button onClick={() => setIsAddModalOpen(false)}>
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. user@example.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {/* 🔥 Only show available roles based on permission */}
                    {availableRoles.map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  {!canManageAdmins && (
                    <p className="text-xs text-slate-400 mt-1">
                      Only super_admin can create admin users
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={newUser.status}
                    onChange={(e) => setNewUser({...newUser, status: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="pending_verification">Pending Verification</option>
                  </select>
                </div>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <div className="font-medium mb-1">Automatic Email</div>
                    <div className="text-xs text-blue-700">
                      A temporary password will be automatically generated and sent to the user's email.
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmAddUser}
                disabled={!newUser.email}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Plus size={16} /> Create User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
