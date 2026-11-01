import React, { useState } from 'react';
import {
  Brain,
  Sparkles,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  Zap,
  RotateCcw,
  BookOpen,
  FileText,
  Sliders,
  ShieldCheck,
} from 'lucide-react';
import {
  getJarvisMemory,
  addManualInsight,
  removeMemoryItem,
  resetJarvisMemory,
  JarvisMemoryBank,
  JarvisMemoryItem,
} from '../../utils/jarvisMemory';

interface JarvisMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JarvisMemoryModal: React.FC<JarvisMemoryModalProps> = ({ isOpen, onClose }) => {
  const [memoryBank, setMemoryBank] = useState<JarvisMemoryBank>(getJarvisMemory);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [newFact, setNewFact] = useState('');
  const [newCategory, setNewCategory] = useState<JarvisMemoryItem['category']>('preference');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const refreshMemory = () => {
    setMemoryBank(getJarvisMemory());
  };

  const handleAddCustomRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFact.trim()) return;

    addManualInsight(newCategory, newFact.trim());
    setNewFact('');
    refreshMemory();
    setSuccessToast('✓ New rule added to JARVIS memory bank!');
    setTimeout(() => setSuccessToast(null), 2500);
  };

  const handleDeleteItem = (id: string) => {
    removeMemoryItem(id);
    refreshMemory();
  };

  const handleResetToDefault = () => {
    if (window.confirm('Reset JARVIS memory bank to default travel agency rules?')) {
      const reset = resetJarvisMemory();
      setMemoryBank(reset);
      setSuccessToast('✓ JARVIS memory reset to defaults.');
      setTimeout(() => setSuccessToast(null), 2500);
    }
  };

  const filteredInsights =
    activeCategoryFilter === 'all'
      ? memoryBank.insights
      : memoryBank.insights.filter((item) => item.category === activeCategoryFilter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/60 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  J.A.R.V.I.S. Autonomous Memory & Learning Cortex
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 border border-cyan-500/50 text-cyan-300">
                  SELF-UPDATING
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Learns agency preferences, client travel nuances, and itinerary rules with every task.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Learning Statistics Bar */}
        <div className="grid grid-cols-3 gap-3 px-6 py-3.5 bg-slate-950/50 border-b border-slate-800/80 text-xs">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
                Itineraries Created
              </span>
              <span className="text-sm font-bold font-mono text-emerald-300">
                {memoryBank.totalItinerariesCreated} Tours
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
                Tasks & Queries
              </span>
              <span className="text-sm font-bold font-mono text-cyan-300">
                {memoryBank.totalTasksExecuted} Executions
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="w-7 h-7 rounded-lg bg-purple-950 border border-purple-500/40 flex items-center justify-center text-purple-400 font-bold">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
                Stored Rules & Insights
              </span>
              <span className="text-sm font-bold font-mono text-purple-300">
                {memoryBank.insights.length} Rules Active
              </span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Mission & Purpose Banner */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/60 to-slate-900 border border-cyan-500/30 text-xs">
            <div className="flex items-center gap-2 text-cyan-300 font-bold mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>CORE PURPOSE & SOLE IDENTITY</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              "I was created with one singular, dedicated mission: to be your elite, lightning-fast Travel Architect who builds complete, flawless day-by-day travel itineraries and quotations for North East Destinations and Andaman. With every task you assign me, I update my memory bank to deliver faster, more personalized tour proposals."
            </p>
          </div>

          {/* Add Custom User Instruction / Rule Form */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-3.5 h-3.5 text-cyan-400" />
                <span>Teach JARVIS a New Rule or Client Preference</span>
              </h4>
              <span className="text-[10px] text-slate-400">Instantly active for all future trips</span>
            </div>

            <form onSubmit={handleAddCustomRule} className="space-y-3">
              <div className="flex gap-2">
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-hidden focus:border-cyan-400 shrink-0"
                >
                  <option value="preference">Preference</option>
                  <option value="rule">Agency Rule</option>
                  <option value="destination">Destination Nuance</option>
                  <option value="pricing">Pricing & Margin</option>
                  <option value="client_profile">Diet / Guest Profile</option>
                </select>

                <input
                  type="text"
                  value={newFact}
                  onChange={(e) => setNewFact(e.target.value)}
                  placeholder="e.g. Always include private catamaran Makruzz for Andaman trips, or Default hotel is 4-Star Super Deluxe"
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-cyan-400"
                />

                <button
                  type="submit"
                  disabled={!newFact.trim()}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  Teach JARVIS
                </button>
              </div>
            </form>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              {[
                { id: 'all', label: 'All Insights' },
                { id: 'system_directive', label: 'Directives' },
                { id: 'rule', label: 'Rules & Permits' },
                { id: 'preference', label: 'Preferences' },
                { id: 'destination', label: 'Destinations' },
                { id: 'pricing', label: 'Pricing' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategoryFilter(tab.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                    activeCategoryFilter === tab.id
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleResetToDefault}
              className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset to Defaults</span>
            </button>
          </div>

          {/* Stored Memory List */}
          <div className="space-y-2.5">
            {filteredInsights.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all flex items-start justify-between gap-3 group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold tracking-wider ${
                        item.category === 'system_directive'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                          : item.category === 'rule'
                          ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                          : item.category === 'destination'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          : item.category === 'pricing'
                          ? 'bg-blue-950 text-blue-300 border border-blue-500/40'
                          : 'bg-purple-950 text-purple-300 border border-purple-500/40'
                      }`}
                    >
                      {item.category.replace('_', ' ')}
                    </span>

                    <span className="text-[10px] text-slate-400 font-mono">
                      Reinforced {item.timesReinforced}x
                    </span>

                    {item.source === 'user_instructed' && (
                      <span className="text-[10px] text-cyan-400 font-medium">
                        • User Instructed
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed font-normal">
                    {item.fact}
                  </p>
                </div>

                {item.category !== 'system_directive' && (
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Delete insight"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-950 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>Memory auto-injected into every itinerary generation task</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Toast */}
        {successToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-950 border border-emerald-500/60 text-emerald-200 px-4 py-2 rounded-xl text-xs font-semibold shadow-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successToast}</span>
          </div>
        )}
      </div>
    </div>
  );
};
