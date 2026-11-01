import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, MapPin, Calendar, Users, DollarSign, Flag, Lock, Calculator, Award } from 'lucide-react';
import { CabPreference, Lead, LeadPriority, LeadStatus, SalesPerson, TripStatus } from '../../types';
import { SalesPersonSelect } from '../common/SalesPersonSelect';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lead: Lead) => void;
  initialLead?: Lead | null;
  salesPersons?: SalesPerson[];
  onQuickAddSalesPerson?: (name: string) => void;
  onOpenManageSalesTeam?: () => void;
}

export const LeadModal: React.FC<LeadModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialLead,
  salesPersons = [],
  onQuickAddSalesPerson,
  onOpenManageSalesTeam,
}) => {
  const [guestName, setGuestName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [destination, setDestination] = useState('Sikkim & Darjeeling');
  const [travelStartDate, setTravelStartDate] = useState('');
  const [travelEndDate, setTravelEndDate] = useState('');
  const [durationDays, setDurationDays] = useState(6);
  const [durationNights, setDurationNights] = useState(5);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [preferredCab, setPreferredCab] = useState<CabPreference>('both');
  const [budget, setBudget] = useState('');
  const [status, setStatus] = useState<LeadStatus>('new');
  const [priority, setPriority] = useState<LeadPriority>('medium');
  const [source, setSource] = useState('Website Inquiry');
  const [salesPerson, setSalesPerson] = useState('Rohit Sharma');
  const [hotelName, setHotelName] = useState('');
  const [sellingCost, setSellingCost] = useState<number | ''>('');
  const [packageCost, setPackageCost] = useState<number | ''>('');
  const [tripStatus, setTripStatus] = useState<TripStatus>('upcoming');
  const [nextFollowUpDate, setNextFollowUpDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [nextFollowUpTime, setNextFollowUpTime] = useState('11:00 AM');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setFormError(null);
    if (initialLead) {
      setGuestName(initialLead.guestName);
      setPhone(initialLead.phone);
      setEmail(initialLead.email);
      setCity(initialLead.city || '');
      setDestination(initialLead.destination);
      setTravelStartDate(initialLead.travelStartDate || '');
      setTravelEndDate(initialLead.travelEndDate || '');
      setDurationDays(initialLead.durationDays);
      setDurationNights(initialLead.durationNights);
      setAdults(initialLead.adults);
      setChildren(initialLead.children);
      setInfants(initialLead.infants);
      setPreferredCab(initialLead.preferredCab);
      setBudget(initialLead.budget || '');
      setStatus(initialLead.status);
      setPriority(initialLead.priority);
      setSource(initialLead.source);
      setSalesPerson(initialLead.salesPerson || 'Rohit Sharma');
      setHotelName(initialLead.hotelName || '');
      setSellingCost(initialLead.sellingCost !== undefined ? initialLead.sellingCost : '');
      setPackageCost(initialLead.packageCost !== undefined ? initialLead.packageCost : '');
      setTripStatus(initialLead.tripStatus || 'upcoming');
      setNextFollowUpDate(initialLead.nextFollowUpDate);
      setNextFollowUpTime(initialLead.nextFollowUpTime || '11:00 AM');
      setNotes(initialLead.notes);
    } else {
      setGuestName('');
      setPhone('');
      setEmail('');
      setCity('');
      setDestination('Sikkim & Darjeeling');
      setTravelStartDate('');
      setTravelEndDate('');
      setDurationDays(6);
      setDurationNights(5);
      setAdults(2);
      setChildren(0);
      setInfants(0);
      setPreferredCab('both');
      setBudget('');
      setStatus('new');
      setPriority('medium');
      setSource('Website Inquiry');
      setSalesPerson('Rohit Sharma');
      setSellingCost('');
      setPackageCost('');
      setTripStatus('upcoming');
      const today = new Date().toISOString().split('T')[0];
      setNextFollowUpDate(today);
      setNextFollowUpTime('11:00 AM');
      setNotes('');
    }
  }, [initialLead, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !phone.trim()) {
      setFormError('Please provide guest name and contact phone number.');
      return;
    }

    const leadData: Lead = {
      id: initialLead ? initialLead.id : `lead-${Date.now()}`,
      guestName: guestName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      city: city.trim(),
      destination: destination.trim(),
      travelStartDate,
      travelEndDate,
      durationDays: Number(durationDays),
      durationNights: Number(durationNights),
      adults: Number(adults),
      children: Number(children),
      infants: Number(infants),
      preferredCab,
      budget: budget.trim(),
      status,
      priority,
      source,
      salesPerson: salesPerson.trim() || 'Rohit Sharma',
      hotelName: hotelName.trim() || undefined,
      sellingCost: sellingCost !== '' ? Number(sellingCost) : undefined,
      packageCost: packageCost !== '' ? Number(packageCost) : undefined,
      tripStatus,
      tripCompletedDate:
        tripStatus === 'completed'
          ? initialLead?.tripCompletedDate || new Date().toISOString().split('T')[0]
          : undefined,
      nextFollowUpDate,
      nextFollowUpTime,
      notes: notes.trim(),
      logs: initialLead ? initialLead.logs : [],
      createdAt: initialLead ? initialLead.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(leadData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full my-8 text-slate-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div>
            <h2 className="text-base font-bold text-white">
              {initialLead ? 'Edit Client Inquiry' : 'Add New Client Inquiry'}
            </h2>
            <p className="text-xs text-slate-400">
              Track travel requirements, cab preference, and follow-up schedule
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {formError && (
            <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-lg text-rose-300 text-xs flex items-center justify-between">
              <span>{formError}</span>
              <button
                type="button"
                onClick={() => setFormError(null)}
                className="text-rose-400 font-bold ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* Guest Personal Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Guest Full Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Amitav Sen"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Phone / WhatsApp <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. +91 98301 22914"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  placeholder="client@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Guest Origin City</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="e.g. Kolkata, Mumbai, Delhi"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Destination & Cab Requirement */}
          <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Target Destination Route</label>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Sikkim & Darjeeling (Gangtok, Pelling, Tiger Hill)">
                  Sikkim & Darjeeling (Gangtok, Pelling, Tiger Hill)
                </option>
                <option value="North Sikkim (Lachen, Gurudongmar, Lachung, Yumthang)">
                  North Sikkim (Lachen, Gurudongmar, Lachung, Yumthang)
                </option>
                <option value="Meghalaya & Kaziranga (Shillong, Cherrapunji, Dawki, Rhino Safari)">
                  Meghalaya & Kaziranga (Shillong, Cherrapunji, Dawki, Rhino Safari)
                </option>
                <option value="Arunachal High Circuit (Tawang, Sela Pass, Dirang, Bomdila)">
                  Arunachal High Circuit (Tawang, Sela Pass, Dirang, Bomdila)
                </option>
                <option value="Silk Route Sikkim (Zuluk, Nathang Valley, Aritar)">
                  Silk Route Sikkim (Zuluk, Nathang Valley, Aritar)
                </option>
                <option value="Custom Northeast Itinerary">Custom Northeast Itinerary</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Cab Facility Preference <span className="text-emerald-400 font-semibold">(Customization)</span>
              </label>
              <select
                value={preferredCab}
                onChange={(e) => setPreferredCab(e.target.value as CabPreference)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-medium"
              >
                <option value="both">Both (Dual Comparison: Reserved Cab & Sharing Cab)</option>
                <option value="reserved">Reserved Cab Only (Innova / Xylo, Tata Sumo, Tempo Traveller, Swift / WagonR)</option>
                <option value="sharing">Sharing Cab Only (Fixed Tata Sumo / Mahindra Bolero)</option>
              </select>
            </div>
          </div>

          {/* Passenger Count & Dates */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Adults (12+ yrs)</label>
              <input
                type="number"
                min="1"
                max="50"
                value={adults}
                onChange={(e) => setAdults(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Children (5-11)</label>
              <input
                type="number"
                min="0"
                max="20"
                value={children}
                onChange={(e) => setChildren(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Infants (0-4)</label>
              <input
                type="number"
                min="0"
                max="10"
                value={infants}
                onChange={(e) => setInfants(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Duration Days</label>
              <input
                type="number"
                min="1"
                max="30"
                value={durationDays}
                onChange={(e) => {
                  const d = Math.max(1, parseInt(e.target.value) || 1);
                  setDurationDays(d);
                  setDurationNights(Math.max(1, d - 1));
                }}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Nights</label>
              <input
                type="number"
                min="1"
                max="29"
                value={durationNights}
                onChange={(e) => setDurationNights(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Tentative Start Date</label>
              <input
                type="date"
                value={travelStartDate}
                onChange={(e) => setTravelStartDate(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Approx. Budget</label>
              <input
                type="text"
                placeholder="e.g. ₹60,000 - ₹80,000 total"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          {/* Hotel Accommodations */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Hotel Name / Preferred Accommodations
            </label>
            <input
              type="text"
              placeholder="e.g. Hotel Summit Golden Crescent / Mayfair Spa Resort"
              value={hotelName}
              onChange={(e) => setHotelName(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* CRM Status & Follow-up Planner */}
          <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Inquiry Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LeadStatus)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium"
              >
                <option value="new">New Inquiry</option>
                <option value="contacted">Contacted / Call Done</option>
                <option value="itinerary_sent">Itinerary & Quote Sent</option>
                <option value="follow_up">Follow-up Scheduled</option>
                <option value="negotiation">Under Negotiation</option>
                <option value="booked">Won / Booking Confirmed</option>
                <option value="lost">Lost / Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as LeadPriority)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium"
              >
                <option value="high">High Priority (Urgent / Ready to book)</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Lead Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white"
              >
                <option value="Website Inquiry">Website Inquiry (northeastdestinations.in)</option>
                <option value="WhatsApp">Direct WhatsApp</option>
                <option value="Phone Call">Direct Phone Call</option>
                <option value="Referral">Past Guest Referral</option>
                <option value="OTA / Social Media">OTA / Social Media</option>
              </select>
            </div>
          </div>

          {/* Assigned Sales Executive & Profit Incentive Rule */}
          <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                <span>Assigned Sales Executive & 50% Profit Share</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                50% Net Profit payable after trip completes
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <SalesPersonSelect
                  value={salesPerson}
                  onChange={setSalesPerson}
                  salesPersons={salesPersons}
                  onQuickAddSalesPerson={onQuickAddSalesPerson}
                  onOpenManageTeam={onOpenManageSalesTeam}
                  label="Sales Executive Assigned *"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Trip Lifecycle Status</label>
                <select
                  value={tripStatus}
                  onChange={(e) => setTripStatus(e.target.value as TripStatus)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
                >
                  <option value="upcoming">Upcoming (Planned)</option>
                  <option value="in_progress">In Progress (Tour Running)</option>
                  <option value="completed">Trip Completed (50% Profit Active)</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Confidential Financials */}
            <div className="bg-slate-900/90 border border-slate-800/90 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Confidential Agency Accounts (Never Shared with Guest)</span>
                </span>
                <span className="text-[10px] text-amber-400 font-mono">Internal Only</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 text-[10px] mb-0.5">
                    Selling Cost (Client Price) (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 65000"
                    value={sellingCost}
                    onChange={(e) => setSellingCost(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-white text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] mb-0.5">
                    Package Cost (Vendor Buying) (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 42000"
                    value={packageCost}
                    onChange={(e) => setPackageCost(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-white text-xs font-mono"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1 bg-slate-950 p-2 rounded border border-slate-800 flex flex-col justify-center">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                    Est. Profit / 50% Share
                  </span>
                  <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                    {sellingCost !== '' && packageCost !== '' && Number(sellingCost) >= Number(packageCost) ? (
                      <>
                        ₹{(Number(sellingCost) - Number(packageCost)).toLocaleString('en-IN')}
                        <span className="text-slate-400 text-[10px] block font-normal">
                          (50% to {salesPerson.split(' ')[0]}: ₹{Math.round((Number(sellingCost) - Number(packageCost)) * 0.5).toLocaleString('en-IN')})
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-500 font-normal">Set prices to calculate</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Next Follow-up Schedule */}
          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 space-y-2">
            <span className="text-slate-300 font-semibold text-xs block">
              Follow-up Reminder Alert
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Next Follow-up Date</label>
                <input
                  type="date"
                  value={nextFollowUpDate}
                  onChange={(e) => setNextFollowUpDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Follow-up Time Slot</label>
                <input
                  type="text"
                  placeholder="e.g. 11:30 AM or 4:00 PM"
                  value={nextFollowUpTime}
                  onChange={(e) => setNextFollowUpTime(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Client Specific Notes & Requirements
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Senior citizens travelling, wants hotel near MG Marg with mountain view, requested comparison between Reserved Innova vs Shared Sumo..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg shadow-sm transition-colors"
            >
              {initialLead ? 'Save Changes' : 'Create Inquiry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
