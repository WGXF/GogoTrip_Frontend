
import React from 'react';
import { Search, Map, Calendar, Filter } from 'lucide-react';
import { AdminTrip } from '../../types';

const MOCK_TRIPS: AdminTrip[] = [
  { id: 't1', user: 'Alex Chen', destination: 'Kyoto, Japan', dates: 'Oct 15 - Oct 22', status: 'upcoming', budget: 'RM 8,500', createdAt: '2023-09-10' },
  { id: 't2', user: 'Sarah Miller', destination: 'Paris, France', dates: 'Dec 05 - Dec 12', status: 'planning', budget: 'RM 12,000', createdAt: '2023-10-05' },
  { id: 't3', user: 'John Doe', destination: 'Bali, Indonesia', dates: 'Nov 10 - Nov 15', status: 'completed', budget: 'RM 3,500', createdAt: '2023-08-20' },
  { id: 't4', user: 'Emily Wang', destination: 'Seoul, South Korea', dates: 'Jan 10 - Jan 20', status: 'upcoming', budget: 'RM 6,200', createdAt: '2023-10-12' },
  { id: 't5', user: 'Michael Brown', destination: 'New York, USA', dates: 'Feb 14 - Feb 20', status: 'cancelled', budget: 'RM 15,000', createdAt: '2023-09-25' },
];

const AdminTrips: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up">
       <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
           <h3 className="text-2xl font-bold text-slate-800">Trips Database</h3>
           <p className="text-slate-500">Monitor user generated itineraries and trips.</p>
        </div>
        <div className="flex gap-3">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search destination or user..." 
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
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
               <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Destination</th>
                  <th className="px-6 py-4">Dates</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Est. Budget</th>
                  <th className="px-6 py-4">Created At</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {MOCK_TRIPS.map(trip => (
                  <tr key={trip.id} className="hover:bg-slate-50/50 transition-colors">
                     <td className="px-6 py-4 font-bold text-slate-800">{trip.user}</td>
                     <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <Map className="w-4 h-4 text-violet-500" />
                           <span className="text-slate-700 font-medium">{trip.destination}</span>
                        </div>
                     </td>
                     <td className="px-6 py-4 text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                           <Calendar className="w-3.5 h-3.5" />
                           {trip.dates}
                        </div>
                     </td>
                     <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                           trip.status === 'upcoming' ? 'bg-sky-100 text-sky-700' :
                           trip.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                           trip.status === 'planning' ? 'bg-amber-100 text-amber-700' :
                           'bg-red-100 text-red-700'
                        }`}>
                           {trip.status}
                        </span>
                     </td>
                     <td className="px-6 py-4 text-sm font-bold text-slate-700">{trip.budget}</td>
                     <td className="px-6 py-4 text-sm text-slate-400">{trip.createdAt}</td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
    </div>
  );
};

export default AdminTrips;
