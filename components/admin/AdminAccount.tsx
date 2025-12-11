
import React from 'react';
import { DollarSign, TrendingUp, Download, PieChart } from 'lucide-react';

const AdminAccount: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
       <div className="flex justify-between items-center">
          <div>
             <h3 className="text-2xl font-bold text-slate-800">Account & Revenue</h3>
             <p className="text-slate-500">Financial overview and settings.</p>
          </div>
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm">
             <Download className="w-4 h-4" />
             Export Report
          </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-violet-600 rounded-2xl p-6 text-white shadow-lg shadow-violet-600/20">
             <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md">
                   <DollarSign className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded">+12%</span>
             </div>
             <h3 className="text-3xl font-bold mb-1">RM 45,200</h3>
             <p className="text-violet-100 text-sm font-medium">Total Revenue (YTD)</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
             <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-fuchsia-50 rounded-xl">
                   <TrendingUp className="w-6 h-6 text-fuchsia-600" />
                </div>
             </div>
             <h3 className="text-3xl font-bold text-slate-900 mb-1">RM 8,450</h3>
             <p className="text-slate-500 text-sm font-medium">Monthly Recurring Revenue</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
             <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 rounded-xl">
                   <PieChart className="w-6 h-6 text-indigo-600" />
                </div>
             </div>
             <h3 className="text-3xl font-bold text-slate-900 mb-1">RM 145</h3>
             <p className="text-slate-500 text-sm font-medium">Avg Revenue Per User</p>
          </div>
       </div>

       <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h4 className="text-lg font-bold text-slate-800 mb-6">Recent Transactions</h4>
          <div className="space-y-4">
             {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                         <DollarSign className="w-5 h-5" />
                      </div>
                      <div>
                         <p className="font-bold text-slate-900">Sponsorship Payment - Qatar Airways</p>
                         <p className="text-xs text-slate-500">Oct 24, 2023 • ID: #TRX-883{i}</p>
                      </div>
                   </div>
                   <span className="font-bold text-slate-900">RM 15,000.00</span>
                </div>
             ))}
          </div>
       </div>
    </div>
  );
};

export default AdminAccount;
