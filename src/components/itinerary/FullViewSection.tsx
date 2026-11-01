import React from 'react';
import { Eye, Save, Download, Globe, CheckCircle2 } from 'lucide-react';

interface FullViewSectionProps {
  guestName: string;
  destination: string;
  daysCount: number;
  nightsCount: number;
  pricingMode: 'reserved' | 'sharing' | 'both';
  sellingCost: number;
  sharingSellingCost: number;
  onPreview: () => void;
  onSave: () => void;
  onDownloadPdf: () => void;
  onJumpToStep: (step: 'guest' | 'days' | 'rates' | 'policies') => void;
}

export const FullViewSection: React.FC<FullViewSectionProps> = ({
  guestName,
  destination,
  daysCount,
  nightsCount,
  pricingMode,
  sellingCost,
  sharingSellingCost,
  onPreview,
  onSave,
  onDownloadPdf,
  onJumpToStep,
}) => {
  const displayPrice =
    pricingMode === 'sharing'
      ? sharingSellingCost
      : sellingCost;

  return (
    <div className="bg-gradient-to-r from-slate-900 via-emerald-950/70 to-slate-900 border-2 border-emerald-500/60 rounded-3xl p-6 sm:p-8 md:p-10 space-y-6 shadow-2xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-emerald-500/30 pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">
              Step 5 of 5 · Final Full View & Review
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <Globe className="w-6 h-6 text-emerald-400" />
            <span>All Information Added — Itinerary Ready for Preview</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-300">
            All 4 sections have been verified. Click Preview to see the exact guest PDF layout, then save or export to PDF.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
          <span className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200">
            👤 {guestName || 'Valued Guest'}
          </span>
          <span className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200">
            📍 {destination || 'Sikkim'} ({daysCount}D / {nightsCount}N)
          </span>
          {displayPrice > 0 && (
            <span className="px-3.5 py-2 rounded-xl bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-bold text-sm">
              ₹{displayPrice.toLocaleString('en-IN')}
            </span>
          )}
        </div>
      </div>

      {/* Verification Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div
          onClick={() => onJumpToStep('guest')}
          className="bg-slate-950/80 border border-emerald-500/30 hover:border-emerald-500 rounded-xl p-3.5 cursor-pointer transition-colors"
        >
          <span className="text-emerald-400 font-bold flex items-center gap-1.5 mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>1. Guest & Dates</span>
          </span>
          <span className="text-slate-300 block truncate">{guestName || 'Guest Configured'}</span>
          <span className="text-[10px] text-slate-500">Click to edit ↗</span>
        </div>

        <div
          onClick={() => onJumpToStep('days')}
          className="bg-slate-950/80 border border-emerald-500/30 hover:border-emerald-500 rounded-xl p-3.5 cursor-pointer transition-colors"
        >
          <span className="text-emerald-400 font-bold flex items-center gap-1.5 mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>2. Tour Plan</span>
          </span>
          <span className="text-slate-300 block">{daysCount} Day Sightseeing Milestones</span>
          <span className="text-[10px] text-slate-500">Click to edit ↗</span>
        </div>

        <div
          onClick={() => onJumpToStep('rates')}
          className="bg-slate-950/80 border border-emerald-500/30 hover:border-emerald-500 rounded-xl p-3.5 cursor-pointer transition-colors"
        >
          <span className="text-emerald-400 font-bold flex items-center gap-1.5 mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>3. Cab Rates & Account</span>
          </span>
          <span className="text-slate-300 block truncate">
            {pricingMode === 'both' ? 'Dual Comparison' : pricingMode === 'sharing' ? 'Sharing Cab' : 'Reserved Cab'}
          </span>
          <span className="text-[10px] text-slate-500">Click to edit ↗</span>
        </div>

        <div
          onClick={() => onJumpToStep('policies')}
          className="bg-slate-950/80 border border-emerald-500/30 hover:border-emerald-500 rounded-xl p-3.5 cursor-pointer transition-colors"
        >
          <span className="text-emerald-400 font-bold flex items-center gap-1.5 mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>4. Policies & Refund</span>
          </span>
          <span className="text-slate-300 block">Terms & Refund Slabs Active</span>
          <span className="text-[10px] text-slate-500">Click to edit ↗</span>
        </div>
      </div>

      {/* User Request: "after that there should be a preview button before saving it and genrating pdf" */}
      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-emerald-500/20">
        <button
          type="button"
          onClick={() => onJumpToStep('policies')}
          className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-2xl text-xs sm:text-sm transition-colors cursor-pointer order-last sm:order-first"
        >
          <span>⬅ Back to Step 4: Policies</span>
        </button>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* 1. PREVIEW BUTTON (User requested: preview button before saving it and generating pdf) */}
          <button
            type="button"
            onClick={onPreview}
            className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-sm sm:text-base rounded-2xl shadow-xl hover:scale-102 transition-all cursor-pointer ring-2 ring-emerald-300/40"
          >
            <Eye className="w-5 h-5 stroke-[2.5]" />
            <span>Preview Itinerary (Guest View)</span>
          </button>

          {/* 2. SAVE BUTTON */}
          <button
            type="button"
            onClick={onSave}
            className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm rounded-2xl border border-slate-700 shadow-md transition-all cursor-pointer hover:border-slate-600"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            <span>Save Itinerary Quote</span>
          </button>

          {/* 3. GENERATE & DOWNLOAD PDF BUTTON */}
          <button
            type="button"
            onClick={onDownloadPdf}
            className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs sm:text-sm rounded-2xl shadow-lg transition-all cursor-pointer hover:scale-102"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Generate & Download PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
