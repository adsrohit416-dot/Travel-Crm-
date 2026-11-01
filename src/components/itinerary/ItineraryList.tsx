import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Eye,
  Edit,
  Trash2,
  Copy,
  Calendar,
  Car,
  Download,
  Plus,
  Building,
  Filter,
  X,
} from 'lucide-react';
import { Itinerary } from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';

interface ItineraryListProps {
  itineraries: Itinerary[];
  onSelectItinerary: (itinerary: Itinerary) => void;
  onEditItinerary: (itinerary: Itinerary) => void;
  onDuplicateItinerary: (itinerary: Itinerary) => void;
  onDeleteItinerary: (id: string) => void;
  onCreateNew: () => void;
}

export const ItineraryList: React.FC<ItineraryListProps> = ({
  itineraries,
  onSelectItinerary,
  onEditItinerary,
  onDuplicateItinerary,
  onDeleteItinerary,
  onCreateNew,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cabFilter, setCabFilter] = useState<string>('all');
  const [hotelFilter, setHotelFilter] = useState<string>('all');
  const [itemToDelete, setItemToDelete] = useState<Itinerary | null>(null);

  const filtered = useMemo(() => {
    const q = (searchTerm || '').trim().toLowerCase();
    return (itineraries || []).filter((item) => {
      if (!item) return false;

      // 1. Text Search Filter
      if (q) {
        const ref = (item.quoteNumber || '').toLowerCase();
        const guest = (item.guestName || '').toLowerCase();
        const title = (item.title || '').toLowerCase();
        const dest = (item.destination || '').toLowerCase();
        const pickup = (item.pickupLocation || '').toLowerCase();
        const matchesSearch =
          ref.includes(q) ||
          guest.includes(q) ||
          title.includes(q) ||
          dest.includes(q) ||
          pickup.includes(q);
        if (!matchesSearch) return false;
      }

      // 2. Cab Selection Filter
      if (cabFilter !== 'all') {
        const vehicle = (
          (item.reservedCab?.vehicleType || '') +
          ' ' +
          (item.reservedCab?.name || '')
        ).toLowerCase();
        const mode = (item.pricingMode || '').toLowerCase();

        if (cabFilter === 'dual') {
          if (mode !== 'dual_comparison' && mode !== 'both') return false;
        } else if (cabFilter === 'sharing') {
          if (mode !== 'sharing' && !vehicle.includes('sharing') && !vehicle.includes('shared')) return false;
        } else if (cabFilter === 'innova') {
          if (!vehicle.includes('innova') && !vehicle.includes('xylo')) return false;
        } else if (cabFilter === 'sumo') {
          if (!vehicle.includes('sumo') && !vehicle.includes('bolero')) return false;
        } else if (cabFilter === 'tempo') {
          if (!vehicle.includes('tempo') && !vehicle.includes('traveller')) return false;
        } else if (cabFilter === 'swift') {
          if (!vehicle.includes('swift') && !vehicle.includes('wagonr') && !vehicle.includes('small cab')) return false;
        }
      }

      // 3. Hotel Category Filter
      if (hotelFilter !== 'all') {
        const cat = (item.hotelCategory || '').toLowerCase();
        if (hotelFilter === 'deluxe') {
          if (!cat.includes('deluxe') || cat.includes('super deluxe')) return false;
        } else if (hotelFilter === 'super_deluxe') {
          if (!cat.includes('super deluxe') && !cat.includes('4-star')) return false;
        } else if (hotelFilter === 'luxury') {
          if (
            !cat.includes('luxury') &&
            !cat.includes('heritage') &&
            !cat.includes('boutique') &&
            !cat.includes('resort')
          )
            return false;
        } else if (hotelFilter === 'budget') {
          if (!cat.includes('budget') && !cat.includes('standard')) return false;
        } else if (hotelFilter === 'homestay') {
          if (!cat.includes('homestay') && !cat.includes('retreat')) return false;
        }
      }

      return true;
    });
  }, [itineraries, searchTerm, cabFilter, hotelFilter]);

  const hasActiveFilters = searchTerm.trim() !== '' || cabFilter !== 'all' || hotelFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* Top Bar with Search & Action */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Text Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search quotes by ref#, guest, destination, or route..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Cab Selection Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs">
            <Car className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <select
              value={cabFilter}
              onChange={(e) => setCabFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Cab Categories</option>
              <option value="innova" className="bg-slate-900">Innova / Xylo (4-6 Pax)</option>
              <option value="sumo" className="bg-slate-900">Tata Sumo (6-8 Pax)</option>
              <option value="tempo" className="bg-slate-900">Tempo Traveller (9-26 Pax)</option>
              <option value="swift" className="bg-slate-900">Swift / WagonR (1-4 Pax)</option>
              <option value="dual" className="bg-slate-900">Dual Rate (Reserved vs Sharing)</option>
              <option value="sharing" className="bg-slate-900">Sharing Cab Only</option>
            </select>
          </div>

          {/* Hotel Category Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs">
            <Building className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <select
              value={hotelFilter}
              onChange={(e) => setHotelFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Hotel Categories</option>
              <option value="deluxe" className="bg-slate-900">Deluxe (3-Star)</option>
              <option value="super_deluxe" className="bg-slate-900">Super Deluxe (4-Star)</option>
              <option value="luxury" className="bg-slate-900">Luxury Heritage / Resorts</option>
              <option value="budget" className="bg-slate-900">Standard Budget</option>
              <option value="homestay" className="bg-slate-900">Homestays & Retreats</option>
            </select>
          </div>

          {/* Reset Filters button if any active */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setCabFilter('all');
                setHotelFilter('all');
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors"
              title="Reset all filters"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        <button
          onClick={onCreateNew}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs rounded-lg transition-colors whitespace-nowrap shadow-sm shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create New Itinerary</span>
        </button>
      </div>

      {/* Itinerary Cards Grid */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500">
          <FileText className="w-10 h-10 mx-auto text-slate-600 mb-3" />
          <p className="text-sm font-semibold text-slate-300">No itineraries found</p>
          <p className="text-xs text-slate-500 mt-1">
            Build customized holiday proposals with dual-rate cab options and download them in PDF format.
          </p>
          <button
            onClick={onCreateNew}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg"
          >
            <Plus className="w-3.5 h-3.5" />
            Create First Itinerary
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => {
            if (!item) return null;
            const isDual = item.pricingMode === 'dual_comparison' || item.pricingMode === 'both';
            const reservedPrice =
              (item.sellingCost && item.sellingCost > 0 ? item.sellingCost : undefined) ||
              item.reservedCab?.totalPackagePrice ||
              item.packageCost ||
              0;
            const sharingPrice =
              (item.sellingCostSharing && item.sellingCostSharing > 0 ? item.sellingCostSharing : undefined) ||
              item.sharingCab?.totalPackagePrice ||
              0;
            const mealPlanShort = item.mealPlan ? item.mealPlan.split(' ')[0] : 'MAP';
            const hotelCategoryShort = item.hotelCategory ? item.hotelCategory.split(' ')[0] : 'Deluxe';
            const dateStr = item.updatedAt || item.createdAt;
            let displayDate = 'Recent';
            try {
              if (dateStr) {
                displayDate = new Date(dateStr).toLocaleDateString('en-GB');
              }
            } catch {}

            return (
              <div
                key={item.id || item.quoteNumber || Math.random().toString()}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-sm transition-all group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded">
                      {item.quoteNumber || 'Quote'}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {displayDate}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors line-clamp-1">
                      {item.title || `${item.destination || 'Custom'} Tour Package`}
                    </h3>
                    <p className="text-xs text-slate-300 font-semibold mt-0.5">
                      Guest: {item.guestName || 'Valued Guest'}
                      {item.guestCity && (
                        <span className="text-slate-400 font-normal"> ({item.guestCity})</span>
                      )}
                    </p>
                  </div>

                  <div className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {item.durationNights ?? Math.max(0, (item.durationDays || 5) - 1)}N/{item.durationDays || 5}D
                    </span>
                    <span>·</span>
                    <span>
                      {item.adults || 2} Adults
                      {(item.children || 0) > 0 ? `, ${item.children} Child` : ''}
                    </span>
                    <span>·</span>
                    <span className="text-emerald-400/90">{mealPlanShort}</span>
                  </div>

                  {/* Cab & Price Strip */}
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Car className="w-3 h-3 text-slate-500" />
                        {isDual ? 'Dual Rate Quoting' : 'Single Rate'}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase">
                        {hotelCategoryShort}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between font-mono pt-0.5">
                      <span className="text-[11px] text-slate-400">Total Price:</span>
                      <div className="text-right">
                        <span className="text-sm font-bold text-white">
                          ₹{reservedPrice.toLocaleString('en-IN')}
                        </span>
                        {isDual && sharingPrice > 0 && (
                          <span className="text-[11px] text-amber-400 block">
                            (Shared: ₹{sharingPrice.toLocaleString('en-IN')})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <button
                    onClick={() => onSelectItinerary(item)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 font-bold rounded-lg border border-emerald-500/30 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View / PDF</span>
                  </button>

                  <div className="flex items-center gap-1 text-slate-400">
                    <button
                      onClick={() => onEditItinerary(item)}
                      title="Edit Itinerary"
                      className="p-1.5 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDuplicateItinerary(item)}
                      title="Duplicate Quote"
                      className="p-1.5 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setItemToDelete(item)}
                      title="Delete Quote"
                      className="p-1.5 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Quote Confirmation Modal */}
      <ConfirmModal
        isOpen={!!itemToDelete}
        title="Delete Itinerary Quote"
        message={`Are you sure you want to delete quote "${itemToDelete?.quoteNumber}" for ${itemToDelete?.guestName}? This cannot be undone.`}
        confirmLabel="Yes, Delete Quote"
        onConfirm={() => {
          if (itemToDelete) {
            onDeleteItinerary(itemToDelete.id);
            setItemToDelete(null);
          }
        }}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
};
