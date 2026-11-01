import React from 'react';
import { X, Check, MapPin, Calendar, Car, ArrowRight, Sparkles } from 'lucide-react';
import { preconfiguredTemplates } from '../../data/defaultTemplates';
import { Itinerary } from '../../types';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: Omit<Itinerary, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-4xl w-full my-8 text-slate-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>North East India Tour Templates</span>
            </h2>
            <p className="text-xs text-slate-400">
              Load battle-tested itineraries with day-by-day plans, dual-rate cab pricing, and permits
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Templates List */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {preconfiguredTemplates.map((template, idx) => (
            <div
              key={template.quoteNumber}
              className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.5 rounded">
                    {template.quoteNumber}
                  </span>
                  <span className="text-sm font-bold text-white">{template.title}</span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs font-mono text-slate-300">
                    {template.durationNights}N / {template.durationDays}D
                  </span>
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    Pickup: {template.pickupLocation}
                  </span>
                  <span>·</span>
                  <span>Hotel: {template.hotelCategory}</span>
                </div>

                {/* Pricing comparison summary */}
                <div className="pt-1 flex items-center gap-4 text-xs font-mono">
                  <div className="text-sky-300">
                    Reserved Cab:{' '}
                    <span className="font-bold text-white">
                      ₹{template.reservedCab.pricePerPerson.toLocaleString('en-IN')}/person
                    </span>{' '}
                    (₹{template.reservedCab.totalPackagePrice.toLocaleString('en-IN')} total)
                  </div>
                  <span className="text-slate-600">vs</span>
                  <div className="text-amber-300">
                    Sharing Cab:{' '}
                    <span className="font-bold text-white">
                      ₹{template.sharingCab.pricePerPerson.toLocaleString('en-IN')}/person
                    </span>{' '}
                    (₹{template.sharingCab.totalPackagePrice.toLocaleString('en-IN')} total)
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                  <span className="font-semibold text-slate-300">Route Highlights:</span>
                  <span className="line-clamp-1">
                    {template.days.map((d) => d.nightStay).filter((v, i, a) => a.indexOf(v) === i).join(' → ')}
                  </span>
                </div>
              </div>

              <div className="shrink-0">
                <button
                  onClick={() => {
                    onSelectTemplate(template);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-sm"
                >
                  <span>Use This Template</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 rounded-md transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
