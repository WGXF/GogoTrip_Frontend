
import React, { useState } from 'react';
import { Search, Filter, MoreHorizontal, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { AdminUser } from '../../types';

const MOCK_ADMIN_USERS: AdminUser[] = [
  { id: '1', name: 'Alex Chen', email: 'alex@example.com', role: 'premium', status: 'active', joinDate: '2023-01-15', lastActive: '2 min ago', totalTrips: 12 },
  { id: '2', name: 'Sarah Miller', email: 'sarah.m@test.com', role: 'user', status: 'active', joinDate: '2023-03-22', lastActive: '1 day ago', totalTrips: 3 },
  { id: '3', name: 'John Doe', email: 'john.d@spam.com', role: 'user', status: 'suspended', joinDate: '2023-06-10', lastActive: '5 days ago', totalTrips: 0 },
  { id: '4', name: 'Emily Wang', email: 'emily.w@travel.co', role: 'premium', status: 'active', joinDate: '2023-02-05', lastActive: '1 hr ago', totalTrips: 24 },
  { id: '5', name: 'Michael Brown', email: 'mike.b@web.net', role: 'user', status: 'pending', joinDate: '2023-10-27', lastActive: 'Never', totalTrips: 0 },
];

const AdminUsers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700"><CheckCircle className="w-3 h-3" /> Active</span>;
      case 'suspended': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700"><XCircle className="w-3 h-3" /> Suspended</span>;
      default: return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700"><AlertCircle className="w-3 h-3" /> Pending</span>;
    }
  };

  const filteredUsers = MOCK_ADMIN_USERS.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
           <h3 className="text-2xl font-bold text-slate-800">User Directory</h3>
           <p className="text-slate-500">Manage user access and profiles.</p>
        </div>
        <div className="flex gap-3">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search users..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 shadow-sm w-64"
              />
           </div>
           <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-violet-600 hover:border-violet-300 transition-colors shadow-sm">
              <Filter className="w-5 h-5" />
           </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
         <table className="w-full text-left border-collapse">
            <thead>
               <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Trips</th>
                  <th className="px-6 py-4">Last Active</th>
                  <th className="px-6 py-4 text-right">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                     <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                              {user.name.charAt(0)}
                           </div>
                           <div>
                              <p className="font-bold text-slate-900">{user.name}</p>
                              <p className="text-xs text-slate-500">{user.email}</p>
                           </div>
                        </div>
                     </td>
                     <td className="px-6 py-4">{getStatusBadge(user.status)}</td>
                     <td className="px-6 py-4">
                        <span className={`text-xs font-bold uppercase ${user.role === 'premium' ? 'text-violet-600' : 'text-slate-500'}`}>
                           {user.role}
                        </span>
                     </td>
                     <td className="px-6 py-4 font-bold text-slate-700">{user.totalTrips}</td>
                     <td className="px-6 py-4 text-sm text-slate-500">{user.lastActive}</td>
                     <td className="px-6 py-4 text-right">
                        <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                           <MoreHorizontal className="w-5 h-5" />
                        </button>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
    </div>
  );
};

export default AdminUsers;
