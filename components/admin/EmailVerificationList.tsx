import React, { useState, useEffect } from 'react';
import { 
  Mail, Trash2, Search, RefreshCw, CheckCircle, 
  XCircle, AlertTriangle, X 
} from 'lucide-react';

interface EmailVerification {
  id: number;
  email: string;
  code: string;
  is_verified: boolean;
  created_at: string;
  expires_at: string;
}

interface Notification {
  type: 'success' | 'error';
  message: string;
}

export const EmailVerificationList: React.FC = () => {
  const [data, setData] = useState<EmailVerification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- New: UI interaction state ---
  const [notification, setNotification] = useState<Notification | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Helper function: Show notification
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000); // Auto-dismiss after 3 seconds
  };

  const fetchData = async () => {
    try {
      const response = await fetch('/api/admin/email_verifications');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showNotification('error', 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Click delete button, only open dialog
  const initiateDelete = (id: number) => {
    setDeleteTargetId(id);
  };

  // 2. Confirm delete (replaced original confirm logic)
  const confirmDelete = async () => {
    if (!deleteTargetId) return;

    try {
        const response = await fetch(`/api/admin/email_verifications/${deleteTargetId}`, { method: 'DELETE' });
        
        if (response.ok) {
            setData(data.filter(item => item.id !== deleteTargetId));
            showNotification('success', 'Record deleted successfully');
        } else {
            showNotification('error', 'Failed to delete record');
        }
    } catch (e) { 
        console.error(e); 
        showNotification('error', 'An error occurred');
    } finally {
        setDeleteTargetId(null); // Close dialog
    }
  };

  // Filter & Pagination
  const filteredData = data.filter(item => 
    item.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.code.includes(searchTerm)
  );
  
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (isLoading) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 flex justify-center items-center h-full min-h-[400px]">
            <div className="text-slate-500 animate-pulse">Loading verification data...</div>
        </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full relative">
      
      {/* --- 全局 Toast 通知 --- */}
      {notification && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border animate-in slide-in-from-top-4 duration-300 ${
          notification.type === 'success' 
            ? 'bg-white border-green-100 text-green-800' 
            : 'bg-white border-red-100 text-red-800'
        }`}>
          <div className={`p-1 rounded-full ${notification.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            {notification.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
          </div>
          <p className="text-sm font-medium">{notification.message}</p>
          <button onClick={() => setNotification(null)} className="ml-2 text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h2 className="text-lg font-bold text-slate-800">Email Verifications</h2>
           <p className="text-sm text-slate-500">View and manage OTP codes.</p>
        </div>
        <div className="flex gap-2">
           <div className="relative">
             <input 
                type="text" placeholder="Search email..." 
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
             />
             <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          <button onClick={fetchData} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"><RefreshCw size={16} /></button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <th className="p-4">ID</th>
              <th className="p-4">Email Address</th>
              <th className="p-4">Code</th>
              <th className="p-4">Status</th>
              <th className="p-4">Created / Expires</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100">
            {paginatedData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-slate-500">#{item.id}</td>
                  <td className="p-4 font-medium text-slate-800 flex items-center gap-2">
                    <Mail size={14} className="text-slate-400" /> {item.email}
                  </td>
                  <td className="p-4 font-mono text-slate-600 bg-slate-50 w-fit px-2 rounded border border-slate-100">{item.code}</td>
                  <td className="p-4">
                    {item.is_verified ? 
                        <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium"><CheckCircle size={12}/> Verified</span> : 
                        <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-1 rounded-full text-xs font-medium"><XCircle size={12}/> Pending</span>
                    }
                  </td>
                  <td className="p-4 text-xs text-slate-500">
                    <div>C: {new Date(item.created_at).toLocaleString()}</div>
                    <div className="text-red-400">E: {new Date(item.expires_at).toLocaleString()}</div>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                        /* 修改：不再直接 handleDelete，而是 initiateDelete */
                        onClick={() => initiateDelete(item.id)} 
                        className="text-slate-400 hover:text-red-600 transition-colors"
                        title="Delete"
                    >
                        <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-200 flex justify-end gap-2">
         <button disabled={currentPage===1} onClick={()=>setCurrentPage(c=>c-1)} className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-slate-50 transition-colors">Prev</button>
         <span className="px-3 py-1 text-sm text-slate-500">Page {currentPage} of {totalPages}</span>
         <button disabled={currentPage===totalPages} onClick={()=>setCurrentPage(c=>c+1)} className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-slate-50 transition-colors">Next</button>
      </div>

      {/* --- 新增：Delete Confirmation Modal (替代原生 confirm) --- */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 p-6 border border-slate-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Verification?</h3>
              <p className="text-sm text-slate-500 mb-6">
                Are you sure you want to delete this verification record? This action cannot be undone.
              </p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setDeleteTargetId(null)}
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-500/20"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};