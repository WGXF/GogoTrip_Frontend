
import React from 'react';
import { Users, Map, ArrowUpRight, ArrowDownRight, Zap, Megaphone } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const stats = [
    { label: 'Total Users', value: '12,405', change: '+12.5%', trend: 'up', icon: Users, color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { label: 'Active Trips', value: '843', change: '+5.2%', trend: 'up', icon: Map, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Active Sponsors', value: '28', change: '+2', trend: 'up', icon: Megaphone, color: 'text-fuchsia-500', bg: 'bg-fuchsia-500/10' },
    { label: 'AI Tokens', value: '1.2M', change: '-2.4%', trend: 'down', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
       
       {/* Stats Grid */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
             <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                   <div className={`p-3 rounded-xl ${stat.bg}`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                   </div>
                   <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${stat.trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {stat.change}
                   </div>
                </div>
                <h3 className="text-3xl font-bold text-slate-900">{stat.value}</h3>
                <p className="text-sm font-medium text-slate-500 mt-1">{stat.label}</p>
             </div>
          ))}
       </div>

       {/* Main Chart Section (Mock) */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-800">User Growth & Activity</h3>
                <select className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold px-3 py-1.5 outline-none text-slate-600">
                   <option>Last 7 Days</option>
                   <option>Last 30 Days</option>
                   <option>This Year</option>
                </select>
             </div>
             <div className="h-64 flex items-end justify-between gap-2 px-4 border-b border-l border-slate-100">
                {/* Mock Bars */}
                {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 95].map((h, i) => (
                   <div key={i} className="w-full bg-violet-500/20 hover:bg-violet-500 rounded-t-lg transition-all duration-500 relative group" style={{ height: `${h}%` }}>
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                         {h * 10}
                      </div>
                   </div>
                ))}
             </div>
             <div className="flex justify-between mt-2 text-xs text-slate-400 font-medium px-4">
                <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
             </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 flex flex-col">
             <h3 className="text-lg font-bold text-slate-800 mb-6">System Health</h3>
             <div className="space-y-6 flex-1">
                <div>
                   <div className="flex justify-between text-sm font-bold text-slate-600 mb-2">
                      <span>API Latency</span>
                      <span className="text-emerald-500">45ms</span>
                   </div>
                   <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 w-[20%] rounded-full"></div>
                   </div>
                </div>
                <div>
                   <div className="flex justify-between text-sm font-bold text-slate-600 mb-2">
                      <span>Database Load</span>
                      <span className="text-amber-500">62%</span>
                   </div>
                   <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 w-[62%] rounded-full"></div>
                   </div>
                </div>
                <div>
                   <div className="flex justify-between text-sm font-bold text-slate-600 mb-2">
                      <span>Storage Usage</span>
                      <span className="text-violet-500">2.1 TB</span>
                   </div>
                   <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 w-[75%] rounded-full"></div>
                   </div>
                </div>
             </div>
             <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                   <span className="text-sm font-medium text-slate-600">All Systems Operational</span>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

export default AdminDashboard;
