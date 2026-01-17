import React, { useState, useEffect } from 'react';
import { Users, ShieldCheck, Map, ArrowUp, ArrowDown, Plane, FileText, DollarSign } from 'lucide-react';
import { NavItem } from '../../types';
import { API_BASE_URL } from '../../config';

interface DashboardWidgetsProps {
  onNavigate: (item: NavItem) => void;
}

interface DashboardStats {
  totalUsers: number;
  verifiedUsers: number;
  totalTrips: number;
  totalArticles: number;
  totalSubscriptions: number;
  revenueThisMonth: number;
  userGrowth: number;
  verifiedGrowth: number;
  tripGrowth: number;
  chartData: number[];
}

// A simple SVG Line Chart Component
const SimpleLineChart = ({ data }: { data: number[] }) => {
  const max = Math.max(...data, 1); // Prevent division by zero
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (val / max) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full h-64 relative animate-in fade-in duration-500">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
        {/* Grid lines */}
        <line x1="0" y1="25" x2="100" y2="25" stroke="#e2e8f0" strokeWidth="0.5" />
        <line x1="0" y1="50" x2="100" y2="50" stroke="#e2e8f0" strokeWidth="0.5" />
        <line x1="0" y1="75" x2="100" y2="75" stroke="#e2e8f0" strokeWidth="0.5" />
        
        {/* The Line */}
        <polyline
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2"
          points={points}
          vectorEffect="non-scaling-stroke"
          className="drop-shadow-sm transition-all duration-500 ease-in-out"
        />
        
        {/* Area under curve */}
        <polygon
          fill="url(#gradient)"
          points={`0,100 ${points} 100,100`}
          opacity="0.1"
          className="transition-all duration-500 ease-in-out"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Labels */}
      <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
        <span>Start</span>
        {/* Simplified labels for dynamic range */}
        <span>Mid</span>
        <span>End</span>
      </div>
    </div>
  );
};

export const DashboardWidgets: React.FC<DashboardWidgetsProps> = ({ onNavigate }) => {
  const [timeRange, setTimeRange] = useState('Last 12 Months');
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    verifiedUsers: 0,
    totalTrips: 0,
    totalArticles: 0,
    totalSubscriptions: 0,
    revenueThisMonth: 0,
    userGrowth: 0,
    verifiedGrowth: 0,
    tripGrowth: 0,
    chartData: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  });
  const [loading, setLoading] = useState(true);

  // 当 timeRange 改变时重新获取数据
  useEffect(() => {
    fetchDashboardStats(timeRange);
  }, [timeRange]);

  const fetchDashboardStats = async (range: string) => {
    setLoading(true);
    try {
      // 将 range 作为查询参数传递给后端
      const queryParams = new URLSearchParams({ range });
      const response = await fetch(`${API_BASE_URL}/api/admin/dashboard-stats?${queryParams}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // 🔥 添加安全的默认值处理
        // 支持 snake_case (后端) 和 camelCase (前端) 两种命名
        const safeStats: DashboardStats = {
          totalUsers: data.total_users ?? data.totalUsers ?? 0,
          verifiedUsers: data.active_users ?? data.verifiedUsers ?? 0,
          totalTrips: data.total_trips ?? data.totalTrips ?? 0,
          totalArticles: data.total_articles ?? data.totalArticles ?? 0,
          totalSubscriptions: data.total_subscriptions ?? data.totalSubscriptions ?? 0,
          revenueThisMonth: data.revenue_this_month ?? data.revenueThisMonth ?? 0,
          userGrowth: data.user_growth ?? data.userGrowth ?? 0,
          verifiedGrowth: data.verified_growth ?? data.verifiedGrowth ?? 0,
          tripGrowth: data.trip_growth ?? data.tripGrowth ?? 0,
          chartData: data.chart_data ?? data.chartData ?? [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        };
        
        console.log('Dashboard stats loaded:', safeStats); // 调试日志
        setStats(safeStats);
      } else {
        console.error('Failed to fetch dashboard stats:', response.status);
        // 保持默认值
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // 保持默认值
    } finally {
      setLoading(false);
    }
  };

  const handleRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeRange(e.target.value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-all cursor-pointer hover:-translate-y-1" 
          onClick={() => onNavigate('User')}
        >
          <div className="flex items-center justify-between mb-4">
             <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
               <Users size={20} />
             </div>
             <span className={`flex items-center text-xs font-semibold px-2 py-1 rounded ${
               (stats.userGrowth ?? 0) >= 0 
                 ? 'text-green-600 bg-green-50' 
                 : 'text-red-600 bg-red-50'
             }`}>
               {(stats.userGrowth ?? 0) >= 0 ? <ArrowUp size={12} className="mr-1" /> : <ArrowDown size={12} className="mr-1" />}
               {Math.abs(stats.userGrowth ?? 0)}%
             </span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800">{(stats.totalUsers ?? 0).toLocaleString()}</h3>
          <p className="text-sm text-slate-500">Total Registered Users</p>
        </div>

        <div 
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-all cursor-pointer hover:-translate-y-1" 
          onClick={() => onNavigate('User')}
        >
          <div className="flex items-center justify-between mb-4">
             <div className="p-2 bg-green-50 text-green-600 rounded-lg">
               <ShieldCheck size={20} />
             </div>
             <span className={`flex items-center text-xs font-semibold px-2 py-1 rounded ${
               (stats.verifiedGrowth ?? 0) >= 0 
                 ? 'text-green-600 bg-green-50' 
                 : 'text-red-600 bg-red-50'
             }`}>
               {(stats.verifiedGrowth ?? 0) >= 0 ? <ArrowUp size={12} className="mr-1" /> : <ArrowDown size={12} className="mr-1" />}
               {Math.abs(stats.verifiedGrowth ?? 0)}%
             </span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800">{(stats.verifiedUsers ?? 0).toLocaleString()}</h3>
          <p className="text-sm text-slate-500">Verified Accounts</p>
        </div>

        <div 
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-all cursor-pointer hover:-translate-y-1" 
          onClick={() => onNavigate('Trip')}
        >
          <div className="flex items-center justify-between mb-4">
             <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
               <Plane size={20} />
             </div>
             <span className={`flex items-center text-xs font-semibold px-2 py-1 rounded ${
               (stats.tripGrowth ?? 0) >= 0 
                 ? 'text-green-600 bg-green-50' 
                 : 'text-red-600 bg-red-50'
             }`}>
               {(stats.tripGrowth ?? 0) >= 0 ? <ArrowUp size={12} className="mr-1" /> : <ArrowDown size={12} className="mr-1" />}
               {Math.abs(stats.tripGrowth ?? 0)}%
             </span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800">{(stats.totalTrips ?? 0).toLocaleString()}</h3>
          <p className="text-sm text-slate-500">Total Trips Created</p>
        </div>

        <div 
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-all cursor-pointer hover:-translate-y-1" 
          onClick={() => onNavigate('Info Blog')}
        >
          <div className="flex items-center justify-between mb-4">
             <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
               <FileText size={20} />
             </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-800">{(stats.totalArticles ?? 0).toLocaleString()}</h3>
          <p className="text-sm text-slate-500">Published Articles</p>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Revenue This Month</h3>
              <p className="text-sm text-slate-500">From premium subscriptions</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800">
            RM {(stats.revenueThisMonth ?? 0).toFixed(2)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Users size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Active Subscriptions</h3>
              <p className="text-sm text-slate-500">Premium members</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800">
            {(stats.totalSubscriptions ?? 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Main Chart Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800">User Growth</h3>
            <p className="text-sm text-slate-500">New signups over {timeRange.toLowerCase()}</p>
          </div>
          <select 
            className="text-sm border-slate-200 rounded-lg text-slate-600 focus:ring-blue-500 focus:border-blue-500 p-2 border bg-white cursor-pointer"
            onChange={handleRangeChange}
            value={timeRange}
          >
            <option>Last 12 Months</option>
            <option>Last 30 Days</option>
            <option>Last 7 Days</option>
          </select>
        </div>
        
        <SimpleLineChart data={stats.chartData ?? [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]} />
      </div>
    </div>
  );
};