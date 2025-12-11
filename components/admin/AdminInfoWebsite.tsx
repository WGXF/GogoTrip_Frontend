
import React from 'react';
import { Plus, Edit2, Trash2, Eye, Globe } from 'lucide-react';
import { Article } from '../../types';

const MOCK_ARTICLES: Article[] = [
  { id: '1', title: 'Top 10 Hidden Gems in Kyoto', category: 'Destinations', status: 'Published', views: 1245, date: '2023-10-20' },
  { id: '2', title: 'Travel Guide: Budgeting 101', category: 'Tips', status: 'Published', views: 890, date: '2023-10-18' },
  { id: '3', title: 'New Visa Requirements for Japan', category: 'News', status: 'Draft', views: 0, date: '2023-10-25' },
];

const AdminInfoWebsite: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up">
       <div className="flex justify-between items-center">
          <div>
             <h3 className="text-2xl font-bold text-slate-800">Manage Info Website</h3>
             <p className="text-slate-500">Update news, articles, and public information.</p>
          </div>
          <button className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-500 transition-colors flex items-center gap-2 shadow-lg shadow-violet-600/20">
             <Plus className="w-4 h-4" />
             Create Article
          </button>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
             {MOCK_ARTICLES.map(article => (
                <div key={article.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                   <div>
                      <div className="flex items-center gap-2 mb-1">
                         <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{article.category}</span>
                         <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${article.status === 'Published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {article.status}
                         </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-lg">{article.title}</h4>
                      <p className="text-xs text-slate-400 mt-1">Last updated: {article.date} • {article.views} Views</p>
                   </div>
                   <div className="flex gap-2">
                      <button className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                   </div>
                </div>
             ))}
          </div>

          <div className="space-y-6">
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                   <Globe className="w-4 h-4 text-violet-500" />
                   Website Preview
                </h4>
                <div className="aspect-video bg-slate-100 rounded-lg mb-4 flex items-center justify-center text-slate-400 text-xs font-bold uppercase">
                   Preview Thumbnail
                </div>
                <button className="w-full py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                   <Eye className="w-4 h-4" />
                   View Live Site
                </button>
             </div>
          </div>
       </div>
    </div>
  );
};

export default AdminInfoWebsite;
