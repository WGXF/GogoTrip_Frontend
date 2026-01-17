import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Appointment, User } from '../../types';
import { Plane, Utensils, BedDouble, Sparkles, MapPin, Globe, Map, Clock } from 'lucide-react';
import { AdvertisementBanner } from './AdvertisementBanner';
import { API_BASE_URL } from '../../config';

interface DashboardViewProps {
  user: User;
}

interface DashboardData {
  upcomingTrips: number;
  countriesVisited: number;
  savedItineraries: number;
  nextTrip: {
    destination: string;
    daysUntil: number;
  } | null;
  upcomingAppointments: Appointment[];
  savedDrafts: any[];
}

// UI: 恢复原有的 StatCard 样式
const StatCard: React.FC<{ 
  title: string; 
  value: string; 
  badgeText?: string; 
  badgeColor?: 'default' | 'green';
  icon: React.ReactNode 
}> = ({ title, value, badgeText, badgeColor = 'default', icon }) => (
  <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-transparent hover:border-sky-400 dark:hover:border-indigo-400 transition-all duration-300 ease-out group relative overflow-hidden hover:-translate-y-2 hover:scale-105 hover:shadow-2xl hover:shadow-sky-100 dark:hover:shadow-indigo-900/20">
    <div className="flex justify-between items-start mb-8">
      <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:bg-sky-50 group-hover:text-sky-600 dark:group-hover:bg-indigo-500/20 dark:group-hover:text-indigo-400 transition-colors">
        {icon}
      </div>
      {badgeText && (
        <span className={`
          text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full
          ${badgeColor === 'green' 
            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}
        `}>
          {badgeText}
        </span>
      )}
    </div>
    <div>
      <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</h3>
      <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</p>
    </div>
  </div>
);

// UI: 恢复原有的 AppointmentCard 样式（带左侧日期方块）
const AppointmentCard: React.FC<{ appointment: Appointment }> = ({ appointment }) => {
  const aptDate = new Date(appointment.date);
  
  const getIcon = () => {
    switch(appointment.type) {
      case 'flight': return <Plane className="w-4 h-4" />;
      case 'activity': return <Utensils className="w-4 h-4" />;
      case 'stay': return <BedDouble className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  }

  const dateColor = appointment.status === 'confirmed' ? 'bg-emerald-500' : 'bg-amber-500';
  const dateBg = appointment.status === 'confirmed' ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-amber-50 dark:bg-amber-500/10';
  const dateText = appointment.status === 'confirmed' ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400';

  return (
    <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/50 hover:border-sky-400 dark:hover:border-indigo-400 hover:shadow-2xl hover:shadow-sky-100 dark:hover:shadow-indigo-900/20 transition-all duration-300 ease-out group cursor-pointer hover:-translate-y-1 hover:scale-[1.02]">
      {/* Date Badge */}
      <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl ${dateBg} relative overflow-hidden flex-shrink-0 transition-transform group-hover:scale-110 duration-300`}>
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${dateColor}`}></div>
        <span className={`text-[10px] font-bold uppercase tracking-widest ${dateText} mb-0.5`}>
          {aptDate.toLocaleString('en-US', { month: 'short' })}
        </span>
        <span className={`text-xl font-bold ${appointment.status === 'confirmed' ? 'text-emerald-900 dark:text-emerald-200' : 'text-amber-900 dark:text-amber-200'}`}>
          {aptDate.getDate()}
        </span>
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="text-base font-bold text-slate-900 dark:text-white truncate group-hover:text-sky-600 dark:group-hover:text-indigo-400 transition-colors">
          {appointment.title}
        </h4>
        <div className="flex items-center gap-3 mt-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{aptDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
          {appointment.location && (
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate">{appointment.location}</span>
            </div>
          )}
        </div>
      </div>

      <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-white group-hover:text-sky-600 dark:group-hover:text-indigo-400 dark:group-hover:bg-slate-700 transition-all shadow-sm group-hover:scale-110 group-hover:rotate-12">
        {getIcon()}
      </div>
    </div>
  );
};

const DashboardView: React.FC<DashboardViewProps> = ({ user }) => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    upcomingTrips: 0,
    countriesVisited: 0,
    savedItineraries: 0,
    nextTrip: null,
    upcomingAppointments: [],
    savedDrafts: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/dashboard`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-slate-500">Loading user data...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  const nextTripBadge = dashboardData.nextTrip 
    ? `NEXT: ${dashboardData.nextTrip.destination.toUpperCase()} (${dashboardData.nextTrip.daysUntil}D)`
    : 'NO TRIPS PLANNED';

  const nextTripText = dashboardData.nextTrip
    ? `Your next adventure to ${dashboardData.nextTrip.destination} begins in ${dashboardData.nextTrip.daysUntil} days.`
    : 'Plan your next adventure today!';

  return (
    <div className="p-6 md:p-8 w-full mx-auto space-y-8 animate-fade-in-up">
      
      {/* 1. Travel Dashboard Header Container - UI Restore */}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] p-8 relative overflow-hidden shadow-sm border border-transparent hover:border-sky-300 dark:hover:border-indigo-500 transition-all duration-500 ease-out hover:shadow-xl hover:bg-white/70 dark:hover:bg-slate-900/70">
       {/* Background blobs for header */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-white/40 to-transparent dark:from-indigo-500/10 dark:to-transparent rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
 
        <div className="relative z-10">
          {/* Top Row: Text & Buttons */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
            <div>
              <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Travel Dashboard</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">{nextTripText}</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => navigate('/trips')}
                className="px-5 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95 border border-transparent hover:border-slate-300 dark:hover:border-slate-500 hover:-translate-y-1 hover:shadow-md"
              >
                View All Trips
              </button>
              <button 
                onClick={() => navigate('/chat')}
                className="px-5 py-3 bg-sky-600 dark:bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-sky-500 dark:hover:bg-indigo-500 transition-all shadow-lg shadow-sky-600/30 dark:shadow-indigo-600/30 flex items-center gap-2 active:scale-95 hover:-translate-y-1 hover:shadow-xl"
              >
                <Sparkles className="w-4 h-4" />
                Start AI Planning
              </button>
            </div>
          </div>

          {/* Stats Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
              title="Upcoming Trips" 
              value={dashboardData.upcomingTrips.toString()} 
              badgeText={nextTripBadge}
              icon={<Plane className="w-5 h-5" />} 
            />
            <StatCard 
              title="Countries Visited" 
              value={dashboardData.countriesVisited.toString()} 
              badgeText="EXPLORED" 
              badgeColor="green"
              icon={<Globe className="w-5 h-5" />} 
            />
            <StatCard 
              title="Saved Itineraries" 
              value={dashboardData.savedItineraries.toString()} 
              badgeText="READY TO GO" 
              badgeColor="green"
              icon={<Map className="w-5 h-5" />} 
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 2. Upcoming Itinerary Container - UI Restore */}
        <div className="lg:col-span-2 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] p-8 h-fit shadow-sm border border-transparent hover:border-sky-300 dark:hover:border-indigo-500 transition-all duration-500 ease-out hover:shadow-xl hover:bg-white/70 dark:hover:bg-slate-900/70">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Upcoming Itinerary</h3>
            <button 
              onClick={() => navigate('/calendar')}
              className="text-sm text-sky-600 hover:text-sky-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold hover:underline"
            >
              View Full Schedule
            </button>
          </div>
          <div className="space-y-4">
            {dashboardData.upcomingAppointments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500 dark:text-slate-400">No upcoming appointments</p>
                <button 
                  onClick={() => navigate('/chat')}
                  className="mt-4 text-sky-600 dark:text-indigo-400 hover:underline font-medium"
                >
                  Plan your first trip
                </button>
              </div>
            ) : (
              dashboardData.upcomingAppointments.map((apt, idx) => (
                <div key={apt.id} className="animate-fade-in-up" style={{ animationDelay: `${(idx + 1) * 100}ms` }}>
                  <AppointmentCard appointment={apt} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Col Items */}
        <div className="space-y-8 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          
          {/* Advertisement Banner */}
          <AdvertisementBanner 
            isPremium={user.subscription?.status === 'active' || user.isPremium || false} 
            // 兼容旧 Banner 的 onNavigate (如果内部还在用 ViewState，需要 Banner 组件也对应调整，或者这里传递一个兼容函数)
            // 假设 Banner 已经 update，或者 Banner 只用简单的 onClick
          />
          
          {/* 3. Trip Idea Card - UI Restore */}
          <div className="bg-gradient-to-b from-sky-500 to-blue-600 dark:from-indigo-600 dark:to-violet-700 rounded-[2.5rem] p-8 relative overflow-hidden shadow-xl shadow-sky-500/20 dark:shadow-indigo-500/20 group text-center border border-transparent hover:border-white/50 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 dark:bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:scale-125 transition-transform duration-700"></div>
            
            <h3 className="text-2xl font-bold text-white mb-2 relative z-10 tracking-tight">Trip Idea?</h3>
            <p className="text-sky-100 dark:text-indigo-100 font-medium leading-relaxed mb-8 relative z-10 px-4">
              Not sure where to go next? Ask the AI Planner to suggest destinations.
            </p>
            <div className="relative z-10">
              <button 
                onClick={() => navigate('/chat')}
                className="w-full py-3.5 bg-white text-sky-600 hover:bg-sky-50 dark:bg-white/10 dark:backdrop-blur-md dark:text-white dark:hover:bg-white/20 text-sm font-bold rounded-xl transition-all shadow-lg active:scale-95 border border-transparent hover:border-sky-100 hover:shadow-xl hover:-translate-y-1"
              >
                Ask AI Planner
              </button>
            </div>
          </div>

          {/* 4. Saved Drafts Card - UI Restore */}
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-sm border border-transparent hover:border-sky-300 dark:hover:border-indigo-500 transition-all duration-500 ease-out hover:shadow-xl hover:bg-white/70 dark:hover:bg-slate-900/70">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Saved Drafts</h3>
            <div className="space-y-3">
              {dashboardData.savedDrafts.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                  No saved drafts yet
                </p>
              ) : (
                dashboardData.savedDrafts.map((draft) => (
                  <div 
                    key={draft.id}
                    onClick={() => navigate('/chat')}
                    className="flex gap-4 p-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-2xl transition-all cursor-pointer group border border-slate-100 dark:border-slate-700/50 hover:border-sky-400 dark:hover:border-indigo-400 hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] duration-300"
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center group-hover:scale-110 group-hover:bg-white group-hover:text-sky-600 dark:group-hover:text-indigo-400 transition-all ease-out">
                      <MapPin className="w-6 h-6 text-slate-400 dark:text-slate-300 group-hover:text-sky-500 dark:group-hover:text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-900 dark:text-white font-bold group-hover:text-sky-600 dark:group-hover:text-indigo-400 transition-colors">{draft.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{draft.details}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;