import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Lock,
  Wallet,
  DollarSign,
  TrendingUp,
  Award,
  Calendar,
  CreditCard,
  FileCheck,
  Building,
  Car,
  User,
  ArrowRight,
  Percent,
} from 'lucide-react';
import { Lead, SalesPerson, TripStatus } from '../../types';
import { SalesPersonSelect } from '../common/SalesPersonSelect';

export interface ConvertLeadPayload {
  leadId: string;
  sellingCost: number;
  packageCost: number;
  hotelName?: string;
  markupPercentage?: number;
  advanceAmount: number;
  paymentMode: 'upi' | 'net_banking' | 'cash' | 'credit_card' | 'cheque';
  paymentDate: string;
  referenceNumber: string;
  paymentNotes: string;
  salesPerson: string;
  tripStatus: TripStatus;
  quoteNumber: string;
  travelDates: string;
}

interface ConvertLeadModalProps {
  isOpen: boolean;
  lead: Lead | null;
  onClose: () => void;
  onConfirm: (payload: ConvertLeadPayload) => void;
  salesPersons?: SalesPerson[];
  onQuickAddSalesPerson?: (name: string) => void;
  onOpenManageSalesTeam?: () => void;
}

export const ConvertLeadModal: React.FC<ConvertLeadModalProps> = ({
  isOpen,
  lead,
  onClose,
  onConfirm,
  salesPersons = [],
  onQuickAddSalesPerson,
  onOpenManageSalesTeam,
}) => {
  if (!isOpen || !lead) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  // Derive initial costs
  const initialSelling =
    lead.sellingCost && lead.sellingCost > 0
      ? lead.sellingCost
      : lead.budget && !isNaN(Number(lead.budget.replace(/[^0-9]/g, ''))) && Number(lead.budget.replace(/[^0-9]/g, '')) > 5000
      ? Number(lead.budget.replace(/[^0-9]/g, ''))
      : 55000;

  const initialPackage =
    lead.packageCost && lead.packageCost > 0
      ? lead.packageCost
      : Math.round(initialSelling * 0.65);

  const initialAdvance = Math.round(initialSelling * 0.3); // standard 30% advance deposit

  const [sellingCost, setSellingCost] = useState<number>(initialSelling);
  const [packageCost, setPackageCost] = useState<number>(initialPackage);
  const [hotelName, setHotelName] = useState<string>(lead.hotelName || '');
  const [estHotelCost, setEstHotelCost] = useState<number | ''>('');
  const [estTransportCost, setEstTransportCost] = useState<number | ''>('');
  const [markupPercentage, setMarkupPercentage] = useState<number>(() => {
    return initialPackage > 0 ? Math.round(((initialSelling - initialPackage) / initialPackage) * 100) : 25;
  });
  const [advanceAmount, setAdvanceAmount] = useState<number>(initialAdvance);
  const [paymentMode, setPaymentMode] = useState<'upi' | 'net_banking' | 'cash' | 'credit_card' | 'cheque'>('upi');
  const [paymentDate, setPaymentDate] = useState<string>(todayStr);
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('Token booking advance payment received');
  const [salesPerson, setSalesPerson] = useState<string>(lead.salesPerson || 'Rohit Sharma');
  const [quoteNumber, setQuoteNumber] = useState<string>(
    `NED-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [travelDates, setTravelDates] = useState<string>(
    lead.travelStartDate
      ? `${lead.travelStartDate} to ${lead.travelEndDate || ''}`
      : `${lead.durationNights}N/${lead.durationDays}D Tour`
  );
  const [tripStatus, setTripStatus] = useState<TripStatus>('upcoming');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const totalPax = Math.max(1, (Number(lead.adults) || 0) + (Number(lead.children) || 0));

  // Update fields whenever modal opens with a new lead
  useEffect(() => {
    if (lead) {
      const sCost =
        lead.sellingCost && lead.sellingCost > 0
          ? lead.sellingCost
          : lead.budget && !isNaN(Number(lead.budget.replace(/[^0-9]/g, ''))) && Number(lead.budget.replace(/[^0-9]/g, '')) > 5000
          ? Number(lead.budget.replace(/[^0-9]/g, ''))
          : 55000;

      const pCost =
        lead.packageCost && lead.packageCost > 0
          ? lead.packageCost
          : Math.round(sCost * 0.65);

      setSellingCost(sCost);
      setPackageCost(pCost);
      setHotelName(lead.hotelName || '');
      setMarkupPercentage(pCost > 0 ? Math.round(((sCost - pCost) / pCost) * 100) : 25);
      setAdvanceAmount(Math.round(sCost * 0.3));
      setSalesPerson(lead.salesPerson || 'Rohit Sharma');
      setPaymentDate(todayStr);
      setReferenceNumber('');
      setPaymentNotes(`Advance token deposit for ${lead.destination} tour`);
      setTravelDates(
        lead.travelStartDate
          ? `${lead.travelStartDate} to ${lead.travelEndDate || ''}`
          : `${lead.durationNights}N/${lead.durationDays}D Tour`
      );
      setErrorMessage(null);
    }
  }, [lead, isOpen, todayStr]);

  const handleMarkupChange = (newMarkup: number) => {
    setMarkupPercentage(newMarkup);
    if (packageCost > 0) {
      const newSell = Math.round(packageCost * (1 + newMarkup / 100));
      setSellingCost(newSell);
    }
  };

  const handleSellingChange = (newSell: number) => {
    setSellingCost(newSell);
    if (packageCost > 0) {
      setMarkupPercentage(Math.round(((newSell - packageCost) / packageCost) * 100));
    }
  };

  const handlePackageChange = (newPkg: number) => {
    setPackageCost(newPkg);
    if (markupPercentage > 0) {
      setSellingCost(Math.round(newPkg * (1 + markupPercentage / 100)));
    }
  };

  const handleEstHotelChange = (val: number | '') => {
    setEstHotelCost(val);
    const h = val === '' ? 0 : val;
    const t = estTransportCost === '' ? 0 : estTransportCost;
    if (h + t > 0) {
      handlePackageChange(h + t);
    }
  };

  const handleEstTransportChange = (val: number | '') => {
    setEstTransportCost(val);
    const t = val === '' ? 0 : val;
    const h = estHotelCost === '' ? 0 : estHotelCost;
    if (h + t > 0) {
      handlePackageChange(h + t);
    }
  };

  // Financial calculations
  const projectedProfit = Math.max(0, sellingCost - packageCost);
  const executiveCommission50 = Math.round(projectedProfit * 0.5);
  const guestBalanceDue = Math.max(0, sellingCost - advanceAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellingCost || sellingCost <= 0) {
      setErrorMessage('Please enter a valid package selling price.');
      return;
    }
    if (advanceAmount < 0) {
      setErrorMessage('Advance amount cannot be negative.');
      return;
    }

    onConfirm({
      leadId: lead.id,
      sellingCost,
      packageCost,
      hotelName: hotelName.trim() || undefined,
      markupPercentage,
      advanceAmount,
      paymentMode,
      paymentDate,
      referenceNumber: referenceNumber.trim() || `ADV-${Date.now().toString().slice(-6)}`,
      paymentNotes,
      salesPerson,
      tripStatus,
      quoteNumber,
      travelDates,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full text-slate-100 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <span>Convert Lead to Confirmed Booking</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded">
                  Auto-Syncs with Accounts
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Log the client advance payment to confirm this booking and automatically update the Accounts Balance Sheet.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lead Context Snapshot */}
        <div className="bg-slate-950/70 border-b border-slate-800/80 px-6 py-3 text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white text-sm">{lead.guestName}</span>
            <span className="text-slate-400">({lead.phone})</span>
          </div>
          <div className="flex items-center gap-3 text-slate-300">
            <span className="text-emerald-400 font-semibold">{lead.destination}</span>
            <span>·</span>
            <span className="font-mono">{lead.durationNights}N/{lead.durationDays}D</span>
            <span>·</span>
            <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-300">
              Assigned: {salesPerson}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-lg text-rose-300 text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          {/* Section 1: Package Financial Agreement */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>1. Package Cost & Confidential Buying Margin</span>
              </span>
              <span className="text-[10px] text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded flex items-center gap-1 font-semibold">
                <Lock className="w-3 h-3" />
                <span>Never Shared With Guest</span>
              </span>
            </div>

            {/* Hotel Name Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-sky-400" />
                <span>Hotel Name / Accommodations (Proposed Stay)</span>
              </label>
              <input
                type="text"
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
                placeholder="e.g. Hotel Summit Golden Crescent, Gangtok / Mayfair"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Hotel & Cab Cost Quick Split */}
            <div className="grid grid-cols-2 gap-3 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <div>
                <label className="block text-[11px] font-semibold text-sky-300 mb-1 flex items-center gap-1">
                  <Building className="w-3 h-3 text-sky-400" />
                  <span>Hotel Stay Cost (₹)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-slate-500 font-mono text-xs">₹</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 18000"
                    value={estHotelCost}
                    onChange={(e) => handleEstHotelChange(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded pl-6 pr-2.5 py-1 text-sky-400 font-mono text-xs placeholder-slate-600 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-emerald-300 mb-1 flex items-center gap-1">
                  <Car className="w-3 h-3 text-emerald-400" />
                  <span>Cab & Transport Cost (₹)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-slate-500 font-mono text-xs">₹</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 16000"
                    value={estTransportCost}
                    onChange={(e) => handleEstTransportChange(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded pl-6 pr-2.5 py-1 text-emerald-400 font-mono text-xs placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Confidential Package Cost (₹) *
                  </label>
                  <span className="text-[10px] font-mono text-amber-300 bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-800">
                    ₹{Math.round(packageCost / totalPax).toLocaleString('en-IN')} / pax
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 font-mono text-xs">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={packageCost || ''}
                    onChange={(e) => handlePackageChange(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-amber-300 font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
                    placeholder="e.g. 36000"
                    required
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Buying cost (Hotels + Cabs + Permits). Hidden from guest.
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Selling Price Billed to Guest (₹) *
                  </label>
                  <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800 font-bold">
                    ₹{Math.round(sellingCost / totalPax).toLocaleString('en-IN')} / pax
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 font-mono text-xs">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={sellingCost || ''}
                    onChange={(e) => handleSellingChange(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. 55000"
                    required
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Total quotation amount agreed with the client ({totalPax} Pax)
                </span>
              </div>
            </div>

            {/* Selling Cost % Markup Option */}
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                <Percent className="w-3.5 h-3.5 text-emerald-400" />
                <span>Selling Markup Option:</span>
                <input
                  type="number"
                  min="0"
                  max="300"
                  value={markupPercentage}
                  onChange={(e) => handleMarkupChange(Number(e.target.value) || 0)}
                  className="w-12 bg-slate-900 border border-emerald-500/60 rounded px-1.5 py-0.5 text-emerald-300 font-mono font-bold text-center"
                />
                <span className="text-emerald-400">%</span>
              </div>

              <div className="flex items-center gap-1">
                {[15, 20, 25, 30, 40, 50].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleMarkupChange(pct)}
                    className={`text-[9px] px-2 py-0.5 rounded font-mono font-semibold transition-colors cursor-pointer ${
                      markupPercentage === pct
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    +{pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Live Profit Preview Box */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Projected Net Profit
                </span>
                <span className="text-base font-black text-emerald-400 font-mono block mt-0.5">
                  ₹{projectedProfit.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {sellingCost > 0 ? `${Math.round((projectedProfit / sellingCost) * 100)}% margin` : ''}
                </span>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-amber-500/20">
                <span className="text-[10px] uppercase font-bold text-amber-300 block tracking-wider flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>50% Executive Profit Share</span>
                </span>
                <span className="text-base font-black text-amber-300 font-mono block mt-0.5">
                  ₹{executiveCommission50.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-amber-400/80 block">
                  For {salesPerson} (Disbursed on trip end)
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Advance Payment Received */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <span>2. Advance Payment Inflow (Credited Immediately)</span>
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                Balance Due Later: ₹{guestBalanceDue.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Advance Amount Received (₹) *
                  </label>
                  <div className="flex items-center gap-1">
                    {[
                      { label: '25%', val: Math.round(sellingCost * 0.25) },
                      { label: '30%', val: Math.round(sellingCost * 0.3) },
                      { label: '50%', val: Math.round(sellingCost * 0.5) },
                      { label: 'Full 100%', val: sellingCost },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setAdvanceAmount(preset.val)}
                        className="text-[10px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded cursor-pointer transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-emerald-500 font-mono text-xs">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={advanceAmount || ''}
                    onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-emerald-500/50 rounded-lg pl-7 pr-3 py-2 text-emerald-400 font-mono font-black text-base focus:outline-none focus:border-emerald-400"
                    placeholder="e.g. 15000"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                  >
                    <option value="upi">UPI / QR Code / GPay</option>
                    <option value="net_banking">Net Banking / NEFT / IMPS</option>
                    <option value="cash">Cash In Hand</option>
                    <option value="credit_card">Credit / Debit Card</option>
                    <option value="cheque">Bank Cheque / Draft</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Reference / UTR / Receipt #
                  </label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="e.g. UPI/293819/HDFC"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Payment Receipt Note
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Advance token deposit to confirm booking & lock cab"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Booking Administrative Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-xs">
            <div>
              <SalesPersonSelect
                value={salesPerson}
                onChange={setSalesPerson}
                salesPersons={salesPersons}
                onQuickAddSalesPerson={onQuickAddSalesPerson}
                onOpenManageTeam={onOpenManageSalesTeam}
                label="Sales Executive"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Booking / Quote #
              </label>
              <input
                type="text"
                value={quoteNumber}
                onChange={(e) => setQuoteNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Trip Lifecycle
              </label>
              <select
                value={tripStatus}
                onChange={(e) => setTripStatus(e.target.value as TripStatus)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
              >
                <option value="upcoming">Upcoming Tour</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed Tour</option>
              </select>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold rounded-xl shadow-lg transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[3]" />
              <span>Confirm & Credit ₹{advanceAmount.toLocaleString('en-IN')} to Balance Sheet</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
