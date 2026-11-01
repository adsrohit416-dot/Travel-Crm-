import React, { useState, useEffect, memo } from 'react';
import {
  Sparkles,
  MoveUp,
  MoveDown,
  Trash2,
  Calendar,
  Building,
  Car,
  Lock,
  Upload,
  MapPin,
} from 'lucide-react';
import { ItineraryDay } from '../../types';
import { getDayOfWeekAbbr, formatDateWithDayAbbr } from '../../utils/dateUtils';
import {
  getDefaultDayImage,
  isNorthSikkimLocation,
  NORTH_SIKKIM_DAY_MEAL_PLAN,
} from '../../data/destinationImages';

interface DayCardProps {
  day: ItineraryDay;
  index: number;
  totalDays: number;
  totalPax: number;
  destination: string;
  onUpdateDay: (index: number, field: keyof ItineraryDay, value: any) => void;
  onUpdateDayBatch: (index: number, updates: Partial<ItineraryDay>) => void;
  onMoveDay: (index: number, direction: 'up' | 'down') => void;
  onRemoveDay: (index: number) => void;
  onOpenImageModal: (dayNumber: number) => void;
  onOpenAiCopilot?: (prompt: string) => void;
}

const DayCardComponent: React.FC<DayCardProps> = ({
  day,
  index,
  totalDays,
  totalPax,
  destination,
  onUpdateDay,
  onUpdateDayBatch,
  onMoveDay,
  onRemoveDay,
  onOpenImageModal,
  onOpenAiCopilot,
}) => {
  // Local state for smooth comma-separated highlights input without cursor jumping
  const [highlightsText, setHighlightsText] = useState(
    () => day.sightseeingHighlights?.join(', ') || ''
  );

  // Sync highlights text if day.sightseeingHighlights changed externally (e.g. from AI rewrite)
  useEffect(() => {
    const joined = day.sightseeingHighlights?.join(', ') || '';
    if (joined !== highlightsText.trim()) {
      setHighlightsText(joined);
    }
  }, [day.sightseeingHighlights]);

  const handleHighlightsChange = (val: string) => {
    setHighlightsText(val);
    const parsed = val
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    onUpdateDay(index, 'sightseeingHighlights', parsed);
  };

  const dayTotalHotel =
    day.hotelTotalCost !== undefined && day.hotelTotalCost > 0
      ? Number(day.hotelTotalCost)
      : day.hotelPricingMode === 'per_person' && (Number(day.hotelCostPerPerson) || 0) > 0
      ? (Number(day.hotelCostPerPerson) || 0) * totalPax
      : (Number(day.hotelCostPerNight) || 0) * (day.roomCount || Math.max(1, Math.ceil(totalPax / 2)));

  const dayTotalTransport = Number(day.transportCost) || 0;
  const dayTotalActivity = Number(day.activityCost) || 0;
  const dayInternalTotal = dayTotalHotel + dayTotalTransport + dayTotalActivity;

  const fallbackDayImg = getDefaultDayImage(
    destination,
    day.dayNumber,
    day.title,
    day.nightStay
  );

  return (
    <div className="bg-slate-950 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 sm:p-7 space-y-6 relative group transition-all shadow-lg">
      {/* Day header */}
      <div className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 font-bold text-base sm:text-lg flex items-center justify-center shrink-0 font-mono shadow-md">
            D{day.dayNumber}
          </div>
          {day.date && (
            <div className="bg-slate-900 border border-slate-700 px-3 py-2 rounded-xl text-xs sm:text-sm text-emerald-300 font-mono font-medium flex items-center gap-1.5 shrink-0 shadow-sm">
              <span className="font-bold text-emerald-400">{getDayOfWeekAbbr(day.date)}</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-300">{formatDateWithDayAbbr(day.date, 'suffix')}</span>
            </div>
          )}
          <input
            type="text"
            value={day.title || ''}
            onChange={(e) => onUpdateDay(index, 'title', e.target.value)}
            placeholder={`Day ${day.dayNumber} Title (e.g. Arrival in Gangtok & MG Marg Evening Walk)`}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm sm:text-base text-white font-semibold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 transition-all placeholder-slate-500"
          />
        </div>

        {/* Order & Remove actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenAiCopilot && (
            <button
              type="button"
              onClick={() =>
                onOpenAiCopilot(
                  `Rewrite and enhance Day ${day.dayNumber} (${day.title || 'Tour day'}) with vivid mountain details, photo spots, viewpoints, and meal recommendations.`
                )
              }
              className="p-2.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/60 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-emerald-500/30"
              title={`AI Polish Day ${day.dayNumber}`}
            >
              <Sparkles className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onMoveDay(index, 'up')}
            disabled={index === 0}
            className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 rounded-xl transition-colors cursor-pointer"
            title="Move Up"
          >
            <MoveUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onMoveDay(index, 'down')}
            disabled={index === totalDays - 1}
            className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 rounded-xl transition-colors cursor-pointer"
            title="Move Down"
          >
            <MoveDown className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onRemoveDay(index)}
            className="p-2.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors ml-1 cursor-pointer"
            title="Delete this day"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Day Description */}
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-2">
          Day Itinerary Description & Activities
        </label>
        <textarea
          rows={3}
          value={day.description || ''}
          onChange={(e) => onUpdateDay(index, 'description', e.target.value)}
          placeholder="Describe the route, panoramic viewpoints, cultural stops, photo opportunities, and driving schedule for this day..."
          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm sm:text-base text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 transition-all leading-relaxed min-h-[96px]"
        />
      </div>

      {/* Highlights and Tags */}
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-2">
          Sightseeing Highlights (comma-separated tags)
        </label>
        <input
          type="text"
          value={highlightsText}
          onChange={(e) => handleHighlightsChange(e.target.value)}
          placeholder="e.g. Tsomgo Lake, Baba Mandir, Ropeway Ride, MG Marg Promenade"
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm sm:text-base text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 transition-all"
        />
      </div>

      {/* Meta row: Day Date, Night Stay, Meal Plan, Cab transfer note */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs sm:text-sm font-semibold text-slate-300">Day Date</label>
            {day.date && (
              <span className="text-xs font-bold text-emerald-400 font-mono">
                {getDayOfWeekAbbr(day.date)}
              </span>
            )}
          </div>
          <input
            type="date"
            value={day.date || ''}
            onChange={(e) => onUpdateDay(index, 'date', e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-1.5">
            Night Stay Location
          </label>
          <input
            type="text"
            value={day.nightStay || ''}
            onChange={(e) => onUpdateDay(index, 'nightStay', e.target.value)}
            placeholder="e.g. Gangtok"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm sm:text-base text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs sm:text-sm font-semibold text-slate-300">Day Meal Plan</label>
            {isNorthSikkimLocation(day.title, day.nightStay, day.description) && (
              <span className="text-[10px] font-bold text-amber-300 bg-amber-950 border border-amber-800 px-2 py-0.5 rounded-md font-mono">
                Compulsory AP
              </span>
            )}
          </div>
          <input
            type="text"
            value={day.mealPlan || ''}
            onChange={(e) => onUpdateDay(index, 'mealPlan', e.target.value)}
            placeholder="e.g. Breakfast & Dinner"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm sm:text-base text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
          {/* Quick Meal Plan Shortcuts */}
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {[
              { label: 'MAP', val: 'Breakfast & Dinner', title: 'Modified American Plan: Breakfast & Dinner' },
              { label: 'AP', val: 'All Meals (B/L/D)', title: 'American Plan: All Meals' },
              { label: 'CP', val: 'Breakfast Included', title: 'Continental Plan: Breakfast Only' },
              { label: 'EP', val: 'Room Only', title: 'European Plan: Room Only' },
            ].map((p) => {
              const currentLower = (day.mealPlan || '').toLowerCase();
              const isMatch =
                currentLower.includes(p.label.toLowerCase()) ||
                (p.label === 'MAP' && (currentLower.includes('breakfast & dinner') || currentLower.includes('breakfast and dinner'))) ||
                (p.label === 'AP' && currentLower.includes('all meals')) ||
                (p.label === 'CP' && currentLower.includes('breakfast included') && !currentLower.includes('dinner')) ||
                (p.label === 'EP' && currentLower.includes('room only'));
              return (
                <button
                  key={p.label}
                  type="button"
                  title={p.title}
                  onClick={() => onUpdateDay(index, 'mealPlan', p.val)}
                  className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold transition-all cursor-pointer border ${
                    isMatch
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-xs'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          {isNorthSikkimLocation(day.title, day.nightStay, day.description) && day.mealPlan !== NORTH_SIKKIM_DAY_MEAL_PLAN && (
            <button
              type="button"
              onClick={() => onUpdateDay(index, 'mealPlan', NORTH_SIKKIM_DAY_MEAL_PLAN)}
              className="mt-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer block"
            >
              ⚡ Set to Compulsory All Meals (B/L/D)
            </button>
          )}
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-1.5">
            Transport & Route Note
          </label>
          <input
            type="text"
            value={day.transportDetails || ''}
            onChange={(e) => onUpdateDay(index, 'transportDetails', e.target.value)}
            placeholder="e.g. Dedicated Innova / Shared Bolero"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm sm:text-base text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Day-Wise Transportation & Hotel Accommodation Cost Breakdown (Internal Confidential Costing) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-sm font-bold text-amber-300 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Day {day.dayNumber} Internal Confidential Cost Breakdown</span>
          </span>
          <span className="text-xs sm:text-sm text-slate-300">
            Day Total Cost:{' '}
            <strong className="text-emerald-400 font-mono font-bold text-sm sm:text-base">
              ₹{dayInternalTotal.toLocaleString('en-IN')}
            </strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Hotel Accommodation Day-Wise */}
          <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-sky-400" />
                <span>Hotel Stay ({day.nightStay || `Night ${day.dayNumber}`})</span>
              </label>

              {/* Price Mode Toggle: Per Night vs Per Person */}
              <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => onUpdateDay(index, 'hotelPricingMode', 'per_night')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                    (day.hotelPricingMode || 'per_night') === 'per_night'
                      ? 'bg-sky-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Set price per room per night"
                >
                  Per Night (Room)
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateDay(index, 'hotelPricingMode', 'per_person')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                    day.hotelPricingMode === 'per_person'
                      ? 'bg-sky-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Set price per person per night"
                >
                  Per Person
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Hotel Property Name</label>
              <input
                type="text"
                placeholder="e.g. Hotel Summit Golden Crescent / Mayfair"
                value={day.hotelName || ''}
                onChange={(e) => onUpdateDay(index, 'hotelName', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-white text-sm placeholder-slate-500 focus:border-sky-500"
              />
            </div>

            {day.hotelPricingMode === 'per_person' ? (
              /* PER PERSON PRICING MODE */
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="block text-xs text-sky-300 font-semibold mb-1">₹ / Person</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 1500"
                    value={day.hotelCostPerPerson !== undefined && day.hotelCostPerPerson > 0 ? day.hotelCostPerPerson : ''}
                    onChange={(e) => {
                      const pp = e.target.value === '' ? 0 : Number(e.target.value);
                      const total = pp * totalPax;
                      const rooms = day.roomCount || Math.max(1, Math.ceil(totalPax / 2));
                      onUpdateDayBatch(index, {
                        hotelPricingMode: 'per_person',
                        hotelCostPerPerson: pp,
                        hotelTotalCost: total,
                        hotelCostPerNight: rooms > 0 ? Math.round(total / rooms) : total,
                      });
                    }}
                    className="w-full bg-slate-900 border border-sky-500/60 rounded-lg px-2.5 py-2 text-sky-300 font-mono font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Total Guests</label>
                  <div className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white font-mono font-bold text-sm flex items-center justify-between">
                    <span>{totalPax} Pax</span>
                    <span className="text-[10px] text-slate-500">Party</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Night Total (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 6000"
                    value={day.hotelTotalCost !== undefined && day.hotelTotalCost > 0 ? day.hotelTotalCost : ''}
                    onChange={(e) => {
                      const total = e.target.value === '' ? 0 : Number(e.target.value);
                      const pp = totalPax > 0 ? Math.round(total / totalPax) : total;
                      const rooms = day.roomCount || Math.max(1, Math.ceil(totalPax / 2));
                      onUpdateDayBatch(index, {
                        hotelPricingMode: 'per_person',
                        hotelTotalCost: total,
                        hotelCostPerPerson: pp,
                        hotelCostPerNight: rooms > 0 ? Math.round(total / rooms) : total,
                      });
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-sky-300 font-mono font-bold text-sm"
                  />
                </div>
              </div>
            ) : (
              /* PER NIGHT (ROOM) PRICING MODE */
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="block text-xs text-sky-300 font-semibold mb-1">₹ / Room / Night</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 3500"
                    value={day.hotelCostPerNight !== undefined && day.hotelCostPerNight > 0 ? day.hotelCostPerNight : ''}
                    onChange={(e) => {
                      const rate = e.target.value === '' ? 0 : Number(e.target.value);
                      const rooms = day.roomCount || Math.max(1, Math.ceil(totalPax / 2));
                      const total = rate * rooms;
                      onUpdateDayBatch(index, {
                        hotelPricingMode: 'per_night',
                        hotelCostPerNight: rate,
                        hotelTotalCost: total,
                        hotelCostPerPerson: totalPax > 0 ? Math.round(total / totalPax) : total,
                      });
                    }}
                    className="w-full bg-slate-900 border border-sky-500/60 rounded-lg px-2.5 py-2 text-sky-400 font-mono font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Rooms Req.</label>
                  <input
                    type="number"
                    min="1"
                    value={day.roomCount || Math.max(1, Math.ceil(totalPax / 2))}
                    onChange={(e) => {
                      const rooms = e.target.value === '' ? 1 : Math.max(1, Number(e.target.value));
                      const rate = Number(day.hotelCostPerNight) || 0;
                      const total = rate * rooms;
                      onUpdateDayBatch(index, {
                        roomCount: rooms,
                        hotelTotalCost: total,
                        hotelCostPerPerson: totalPax > 0 ? Math.round(total / totalPax) : total,
                      });
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white font-mono font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Night Total (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 7000"
                    value={day.hotelTotalCost !== undefined && day.hotelTotalCost > 0 ? day.hotelTotalCost : ''}
                    onChange={(e) => {
                      const total = e.target.value === '' ? 0 : Number(e.target.value);
                      const rooms = day.roomCount || Math.max(1, Math.ceil(totalPax / 2));
                      onUpdateDayBatch(index, {
                        hotelPricingMode: 'per_night',
                        hotelTotalCost: total,
                        hotelCostPerNight: rooms > 0 ? Math.round(total / rooms) : total,
                        hotelCostPerPerson: totalPax > 0 ? Math.round(total / totalPax) : total,
                      });
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-sky-300 font-mono font-bold text-sm"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-900">
              <span>Total Hotel Cost for Night:</span>
              <span className="font-mono font-bold text-sky-300 text-sm">
                ₹{dayTotalHotel.toLocaleString('en-IN')}
                {dayTotalHotel > 0 ? (
                  <span className="text-xs text-slate-500 font-normal ml-1">
                    (₹{Math.round(dayTotalHotel / totalPax).toLocaleString('en-IN')}/pax)
                  </span>
                ) : null}
              </span>
            </div>
          </div>

          {/* Transportation Day-Wise */}
          <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-1.5">
                <Car className="w-4 h-4 text-emerald-400" />
                <span>Day {day.dayNumber} Transportation / Cab</span>
              </label>
              <span className="text-xs text-slate-400 font-mono">Day vehicle cost</span>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Assigned Vehicle Type</label>
              <input
                type="text"
                placeholder="e.g. Dedicated Innova Crysta / Tata Sumo"
                value={day.transportVehicle || ''}
                onChange={(e) => onUpdateDay(index, 'transportVehicle', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-white text-sm placeholder-slate-500 focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Cab Cost for Day (₹)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 3800"
                  value={day.transportCost !== undefined && day.transportCost > 0 ? day.transportCost : ''}
                  onChange={(e) =>
                    onUpdateDay(
                      index,
                      'transportCost',
                      e.target.value === '' ? 0 : Number(e.target.value)
                    )
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-emerald-400 font-mono font-bold text-sm focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Activities / Permits (₹)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 1000"
                  value={day.activityCost !== undefined && day.activityCost > 0 ? day.activityCost : ''}
                  onChange={(e) =>
                    onUpdateDay(
                      index,
                      'activityCost',
                      e.target.value === '' ? 0 : Number(e.target.value)
                    )
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-amber-400 font-mono font-bold text-sm focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-900">
              <span>Day Cab + Activities:</span>
              <span className="font-mono font-bold text-emerald-300 text-sm">
                ₹{(dayTotalTransport + dayTotalActivity).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Day Sightseeing Photo & Custom Upload */}
      <div className="flex items-center gap-4 pt-3 border-t border-slate-800/80 bg-slate-900/60 p-4 rounded-xl">
        <div
          onClick={() => onOpenImageModal(day.dayNumber)}
          className="w-24 h-16 sm:w-28 sm:h-20 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0 relative cursor-pointer group shadow-sm"
          title="Click to upload custom photo or choose from library"
        >
          <img
            src={day.imageUrl || fallbackDayImg.url}
            alt={`Day ${day.dayNumber}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Upload className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5" />
            <span>Day {day.dayNumber} Destination Photo</span>
          </div>
          <span className="text-sm sm:text-base text-slate-200 truncate block font-medium mt-0.5">
            {day.imageCaption || fallbackDayImg.caption}
          </span>
          <span className="text-xs text-slate-400 mt-1 block">
            Click to upload your own photo or choose from curated mountain imagery
          </span>
        </div>
        <button
          type="button"
          onClick={() => onOpenImageModal(day.dayNumber)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 rounded-xl hover:bg-emerald-900/60 hover:text-emerald-200 transition-colors cursor-pointer shrink-0 shadow-sm"
          title="Upload custom photo or choose from library for this day"
        >
          <Upload className="w-4 h-4 text-emerald-400" />
          <span>Upload / Change</span>
        </button>
      </div>
    </div>
  );
};

export const DayCard = memo(DayCardComponent);
