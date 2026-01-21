import React, { useState, useEffect } from 'react';
import { ListTodo, MapPin, Clock, Search, ExternalLink } from 'lucide-react';

interface TripItem {
  id: number;
  trip_id: number;
  place_name: string; // Backend should return joined name
  day_number: number;
  order_index: number;
  notes: string;
}

export const TripItemList: React.FC = () => {
  const [items, setItems] = useState<TripItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock fetch
    fetch('/api/admin/trip_items')
      .then(res => res.ok ? res.json() : [])
      .then(data => setItems(data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <div className="p-10 text-center text-slate-500">Loading itinerary items...</div>;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-slate-200">
           <h2 className="text-lg font-bold text-slate-800">Trip Itinerary Items</h2>
           <p className="text-sm text-slate-500">Granular view of all scheduled activities.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
              <th className="p-4">Item ID</th>
              <th className="p-4">Trip Ref</th>
              <th className="p-4">Place / Activity</th>
              <th className="p-4">Timing</th>
              <th className="p-4">Notes</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100">
            {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-slate-400">#{item.id}</td>
                  <td className="p-4">
                      <span className="flex items-center gap-1 text-blue-600 hover:underline cursor-pointer">
                          <ExternalLink size={12}/> Trip #{item.trip_id}
                      </span>
                  </td>
                  <td className="p-4 font-medium text-slate-800 flex items-center gap-2">
                      <MapPin size={14} className="text-purple-500"/> {item.place_name}
                  </td>
                  <td className="p-4 text-slate-600">
                      <div className="flex items-center gap-1"><Clock size={12}/> Day {item.day_number}</div>
                      <div className="text-xs text-slate-400">Order: {item.order_index}</div>
                  </td>
                  <td className="p-4 text-slate-500 italic truncate max-w-xs">{item.notes || '-'}</td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};