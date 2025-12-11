
import React, { useState } from 'react';
import { Plus, MoreHorizontal } from 'lucide-react';
import { Sponsor } from '../../types';

const MOCK_SPONSORS: Sponsor[] = [
  { id: '1', name: 'Qatar Airways', industry: 'Airlines', status: 'Active', activeAds: 3, totalSpent: 'RM 45,000', contact: 'marketing@qatar.com' },
  { id: '2', name: 'Marriott Bonvoy', industry: 'Hospitality', status: 'Active', activeAds: 5, totalSpent: 'RM 82,000', contact: 'partners@marriott.com' },
  { id: '3', name: 'Klook', industry: 'Travel Tech', status: 'Paused', activeAds: 0, totalSpent: 'RM 12,500', contact: 'ads@klook.com' },
  { id: '4', name: 'Tourism Japan', industry: 'Government', status: 'Pending', activeAds: 1, totalSpent: 'RM 0', contact: 'info@jnto.go.jp' },
];

const AdminSponsors: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sponsors' | 'posts'>('sponsors');

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center">
        <div>
           <h3 className="text-2xl font-bold text-slate-800">Sponsors & Advertisements</h3>
           <p className="text-slate-500">Manage partners and sponsored content.</p>
        </div>
        <button className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-500 transition-colors flex items-center gap-2 shadow-lg shadow-violet-600/20">
           <Plus className="w-4 h-4" />
           New Sponsor
        </button>
      </div>

      <div className="flex gap-4 border-b border-slate-200">
         <button 
           onClick={() => setActiveTab('sponsors')}
           className={`pb-3 px-4 text-sm font-bold transition-colors border-b-2 ${activeTab === 'sponsors' ? 'border-violet-600 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
         >
           Sponsor Directory
         </button>
         <button 
           onClick={() => setActiveTab('posts')}
           className={`pb-3 px-4 text-sm font-bold transition-colors border-b-2 ${activeTab === 'posts' ? 'border-violet-600 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
         >
           Sponsored Posts
         </button>
      </div>

      {activeTab === 'sponsors' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
           <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                 <tr>
                    <th className="px-6 py-4">Company Name</th>
                    <th className="px-6 py-4">Industry</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Active Ads</th>
                    <th className="px-6 py-4">Total Spent</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                 {MOCK_SPONSORS.map(sponsor => (
                    <tr key={sponsor.id} className="hover:bg-slate-50/50 transition-colors">
                       <td className="px-6 py-4 font-bold text-slate-800">{sponsor.name}</td>
                       <td className="px-6 py-4 text-sm text-slate-500">{sponsor.industry}</td>
                       <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                             sponsor.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                             sponsor.status === 'Paused' ? 'bg-slate-100 text-slate-600' :
                             'bg-amber-100 text-amber-700'
                          }`}>
                             {sponsor.status}
                          </span>
                       </td>
                       <td className="px-6 py-4 text-sm font-bold text-slate-700">{sponsor.activeAds}</td>
                       <td className="px-6 py-4 text-sm text-slate-600">{sponsor.totalSpent}</td>
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
      )}

      {activeTab === 'posts' && (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
               <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                     <span className="bg-violet-100 text-violet-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">Sponsored</span>
                     <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal className="w-5 h-5" /></button>
                  </div>
                  <h4 className="font-bold text-slate-900 mb-2">50% Off Flights to Tokyo</h4>
                  <p className="text-sm text-slate-500 mb-4">Exclusive deal for GogoTrip users. Valid until Dec 31st.</p>
                  <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-3">
                     <span>Client: Qatar Airways</span>
                     <span className="text-emerald-600 font-bold">Active</span>
                  </div>
               </div>
            ))}
         </div>
      )}
    </div>
  );
};

export default AdminSponsors;
