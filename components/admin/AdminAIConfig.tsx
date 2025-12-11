
import React, { useState } from 'react';
import { Bot, Sliders, MessageSquare } from 'lucide-react';

const AdminAIConfig: React.FC = () => {
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
       <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl p-8 text-white shadow-lg shadow-violet-500/20">
          <div className="flex items-center gap-4 mb-6">
             <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md">
                <Bot className="w-8 h-8 text-white" />
             </div>
             <div>
                <h2 className="text-2xl font-bold">AI Engine Configuration</h2>
                <p className="text-violet-100">Manage model parameters and prompt engineering.</p>
             </div>
          </div>
          <div className="grid grid-cols-3 gap-6">
             <div className="bg-white/10 backdrop-blur-md rounded-xl p-4">
                <p className="text-xs font-bold text-violet-200 uppercase tracking-wider mb-1">Current Model</p>
                <p className="text-xl font-bold">Gemini Pro</p>
             </div>
             <div className="bg-white/10 backdrop-blur-md rounded-xl p-4">
                <p className="text-xs font-bold text-violet-200 uppercase tracking-wider mb-1">Latency (Avg)</p>
                <p className="text-xl font-bold">1.2s</p>
             </div>
             <div className="bg-white/10 backdrop-blur-md rounded-xl p-4">
                <p className="text-xs font-bold text-violet-200 uppercase tracking-wider mb-1">Cost / 1k Tokens</p>
                <p className="text-xl font-bold">$0.00025</p>
             </div>
          </div>
       </div>

       <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
             <Sliders className="w-5 h-5 text-slate-400" />
             Model Parameters
          </h3>
          
          <div className="space-y-8 max-w-2xl">
             <div>
                <div className="flex justify-between mb-2">
                   <label className="text-sm font-bold text-slate-700">Creativity (Temperature)</label>
                   <span className="text-sm font-bold text-violet-600">{temperature}</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.1" 
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-violet-600"
                />
                <p className="text-xs text-slate-500 mt-2">Lower values produce more deterministic results. Higher values produce more creative output.</p>
             </div>

             <div>
                <div className="flex justify-between mb-2">
                   <label className="text-sm font-bold text-slate-700">Max Output Tokens</label>
                   <span className="text-sm font-bold text-violet-600">{maxTokens}</span>
                </div>
                <input 
                  type="range" 
                  min="256" 
                  max="4096" 
                  step="256" 
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-violet-600"
                />
                <p className="text-xs text-slate-500 mt-2">Controls the maximum length of the generated response.</p>
             </div>
          </div>
       </div>

       <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
             <MessageSquare className="w-5 h-5 text-slate-400" />
             System Prompt
          </h3>
          <textarea 
             className="w-full h-40 bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-sm text-slate-700 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none resize-none"
             defaultValue={`You are an expert travel planner assistant for GogoTrip.
Your tone should be enthusiastic, professional, and personalized.
Always suggest prices in MYR currency.
Focus on cultural immersion and hidden gems.`}
          />
          <div className="flex justify-end mt-4">
             <button className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800 transition-colors">
                Save Prompt
             </button>
          </div>
       </div>
    </div>
  );
};

export default AdminAIConfig;
