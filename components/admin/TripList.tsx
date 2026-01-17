import React, { useState, useEffect } from 'react';
import { 
  Plane, Calendar, User, Search, Eye, Trash2, 
  AlertTriangle, CheckCircle, XCircle, X, AlertCircle 
} from 'lucide-react';

interface Trip {
  id: number;
  user_email: string;
  title: string;
  start_date: string;
  end_date: string;
  status: 'Planning' | 'Completed' | 'Cancelled';
  total_expenses: number;
}

interface Notification {
  type: 'success' | 'error';
  message: string;
}

export const TripList: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // --- 新增：UI 交互状态 ---
  const [notification, setNotification] = useState<Notification | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  useEffect(() => {
    const fetchTrips = async () => {
        try {
            const res = await fetch('/api/admin/trips');
            if (res.ok) setTrips(await res.json());
        } catch(e) { 
            console.error(e);
            // 实际项目中可以在这里 showNotification('error', ...)
        } 
        finally { setIsLoading(false); }
    };
    fetchTrips();
  }, []);

  // --- 辅助函数：显示通知 ---
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // 1. 点击删除按钮，只触发弹窗
  const handleDeleteClick = (id: number) => {
    setDeleteTargetId(id);
  };

  // 2. 确认删除逻辑
  const confirmDelete = async () => {
    if (!deleteTargetId) return;

    try {
        // 模拟 API 调用
        // await fetch(`/api/admin/trips/${deleteTargetId}`, { method: 'DELETE' });
        
        // 乐观更新 UI
        setTrips(trips.filter(t => t.id !== deleteTargetId));
        showNotification('success', 'Trip deleted successfully');
    } catch (e) {
        showNotification('error', 'Failed to delete trip');
    } finally {
        setDeleteTargetId(null);
    }
  };

  const filtered = trips.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()));

  if (isLoading) return <div className="p-10 text-center text-slate-500">Loading trips...</div>;

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
            {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          </div>
          <p className="text-sm font-medium">{notification.message}</p>
          <button onClick={() => setNotification(null)} className="ml-2 text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="p-5 border-b border-slate-200 flex justify-between items-center">
         <div>
           <h2 className="text-lg font-bold text-slate-800">Trips</h2>
           <p className="text-sm text-slate-500">Overview of user travel plans.</p>
        </div>
        <div className="relative">
             <input 
                type="text" placeholder="Search trips..." 
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
             />
             <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
              <th className="p-4">Trip Details</th>
              <th className="p-4">User</th>
              <th className="p-4">Dates</th>
              <th className="p-4">Status</th>
              <th className="p-4">Est. Budget</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100">
            {filtered.map((trip) => (
                <tr key={trip.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                      <div className="font-bold text-slate-800">{trip.title}</div>
                      <div className="text-xs text-slate-400">ID: #{trip.id}</div>
                  </td>
                  <td className="p-4 text-slate-600 flex items-center gap-2">
                      <User size={14} className="text-slate-400"/> {trip.user_email}
                  </td>
                  <td className="p-4 text-slate-500 text-xs">
                      <div className="flex items-center gap-1"><Calendar size={12}/> {trip.start_date}</div>
                      <div className="pl-4">to {trip.end_date}</div>
                  </td>
                  <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          trip.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                          trip.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                          {trip.status}
                      </span>
                  </td>
                  <td className="p-4 font-mono text-slate-600">${trip.total_expenses}</td>
                  <td className="p-4 text-right">
                      <button className="text-slate-400 hover:text-blue-600 p-1 mr-1 transition-colors"><Eye size={16}/></button>
                      <button 
                        /* 绑定点击事件 */
                        onClick={() => handleDeleteClick(trip.id)}
                        className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                      >
                        <Trash2 size={16}/>
                      </button>
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- 新增：Delete Confirmation Modal --- */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 p-6 border border-slate-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Trip?</h3>
              <p className="text-sm text-slate-500 mb-6">
                Are you sure you want to delete this trip? This will remove all associated itinerary items and expenses.
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