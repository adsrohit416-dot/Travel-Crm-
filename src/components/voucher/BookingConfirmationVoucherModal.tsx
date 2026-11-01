import React, { useState, useRef } from 'react';
import {
  X,
  Download,
  Printer,
  CheckCircle2,
  Calendar,
  MapPin,
  Car,
  Users,
  ShieldCheck,
  CreditCard,
  Building,
  Phone,
  Mail,
  FileCheck,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { BookingVoucherData, CompanyProfile } from '../../types';
import { exportElementToPdf, triggerNativePrint } from '../../utils/pdfExport';

interface BookingConfirmationVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  voucherData: BookingVoucherData | null;
  companyProfile: CompanyProfile;
}

export const BookingConfirmationVoucherModal: React.FC<BookingConfirmationVoucherModalProps> = ({
  isOpen,
  onClose,
  voucherData,
  companyProfile,
}) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportStatusText, setExportStatusText] = useState<string>('');

  if (!isOpen || !voucherData) return null;

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    setExportProgress(10);
    setExportStatusText('Initializing voucher layout & assets...');

    try {
      const cleanGuest = (voucherData.guestName || 'Guest').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Booking_Voucher_${voucherData.voucherNumber || 'NED'}_${cleanGuest}.pdf`;

      await exportElementToPdf('tour-confirmation-voucher-doc', {
        filename,
        onProgress: (prog, text) => {
          setExportProgress(prog);
          setExportStatusText(text);
        },
      });
    } catch (err) {
      console.error('Failed to export voucher PDF:', err);
      alert('Unable to generate PDF automatically. Opening native print dialog to Save as PDF.');
      triggerNativePrint();
    } finally {
      setIsExportingPdf(false);
      setExportProgress(0);
      setExportStatusText('');
    }
  };

  const handleNativePrint = () => {
    triggerNativePrint();
  };

  const formattedDate = (dateStr?: string) => {
    if (!dateStr) return 'TBA';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] my-auto">
        {/* Top Celebration & Action Header Bar (No-Print) */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 border-b border-emerald-500/30 flex items-center justify-between gap-3 shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-widest">
                  Package Confirmed · First-Time Voucher
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  #{voucherData.voucherNumber}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white">
                Official Tour Booking Confirmation Voucher
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Primary Download PDF Button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
              title="Download High-Resolution A4 Voucher PDF"
            >
              <Download className="w-4 h-4 text-slate-950" />
              <span>{isExportingPdf ? `Generating PDF (${exportProgress}%)...` : 'Download Voucher in PDF'}</span>
            </button>

            {/* Print / Save as PDF Fallback */}
            <button
              type="button"
              onClick={handleNativePrint}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
              title="Print Voucher or Save as PDF via Browser"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span>Print</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              title="Close Voucher Preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* First-Time Notice Banner (No-Print) */}
        <div className="px-5 py-2.5 bg-emerald-950/40 border-b border-emerald-500/20 flex items-center justify-between text-xs text-emerald-300 shrink-0 no-print">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              <strong>First-Time Confirmation:</strong> Tour package has been officially locked and credited to Accounts. Share this PDF voucher with the guest as proof of booking.
            </span>
          </div>
          <span className="font-mono text-[11px] text-emerald-400/80 hidden sm:inline">
            Issued on {voucherData.confirmationDate}
          </span>
        </div>

        {/* Scrollable Printable Voucher Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950">
          <div
            id="tour-confirmation-voucher-doc"
            className="w-full max-w-[800px] mx-auto bg-white text-slate-900 rounded-xl shadow-xl p-6 sm:p-8 space-y-6 text-xs leading-relaxed font-sans border border-slate-200"
            style={{ minHeight: '1050px' }}
          >
            {/* 1. VOUCHER HEADER */}
            <div className="border-b-2 border-emerald-800 pb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  {companyProfile.logoUrl ? (
                    <img
                      src={companyProfile.logoUrl}
                      alt={companyProfile.name}
                      className="h-10 object-contain rounded"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded bg-emerald-800 text-white flex items-center justify-center font-black text-base">
                      NED
                    </div>
                  )}
                  <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
                      {companyProfile.name || 'North East Destinations'}
                    </h1>
                    <p className="text-[11px] font-semibold text-emerald-700">
                      {companyProfile.tagline || 'Leading Tour Operator & Destination Management Company'}
                    </p>
                  </div>
                </div>

                <div className="mt-2 text-[10px] text-slate-500 space-y-0.5">
                  <p>
                    <strong>Siliguri Office:</strong> {companyProfile.addressSiliguri || 'Pradhan Nagar, Siliguri, West Bengal - 734003'}
                  </p>
                  <p>
                    <strong>Gangtok Office:</strong> {companyProfile.addressGangtok || 'Near MG Marg, Gangtok, Sikkim - 737101'}
                  </p>
                  <p>
                    <strong>Helpline:</strong> {companyProfile.phone1 || '+91 98320 12345'} | <strong>Email:</strong> {companyProfile.email || 'info@northeastdestinations.in'}
                  </p>
                </div>
              </div>

              {/* Voucher Reference Box */}
              <div className="sm:text-right shrink-0 bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 min-w-[210px]">
                <span className="inline-block px-2 py-0.5 bg-emerald-700 text-white font-black text-[10px] rounded tracking-wider uppercase mb-1">
                  CONFIRMATION VOUCHER
                </span>
                <p className="text-xs font-mono font-bold text-slate-900">
                  Voucher #: <span className="text-emerald-800">{voucherData.voucherNumber}</span>
                </p>
                <p className="text-[11px] font-mono text-slate-600">
                  Booking Quote: #{voucherData.quoteNumber}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Date: <strong>{voucherData.confirmationDate}</strong>
                </p>
                <p className="text-[10px] text-slate-500">
                  Sales Exec: <strong>{voucherData.salesPerson}</strong>
                </p>
              </div>
            </div>

            {/* 2. LEAD / GUEST INFORMATION */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5 text-emerald-800">
                <Users className="w-3.5 h-3.5 text-emerald-700" />
                <span>Primary Lead & Traveler Information</span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Lead Guest Name</span>
                  <span className="font-bold text-slate-900 text-xs">{voucherData.guestName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Contact Phone</span>
                  <span className="font-semibold text-slate-800">{voucherData.guestPhone || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Email Address</span>
                  <span className="text-slate-700 truncate block">{voucherData.guestEmail || 'info@guest.com'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">City of Origin</span>
                  <span className="text-slate-800">{voucherData.guestCity || 'India'}</span>
                </div>
                <div className="col-span-2 sm:col-span-4 pt-1.5 border-t border-slate-200 flex flex-wrap items-center gap-4 text-slate-700">
                  <span>
                    <strong>Total Travelers:</strong> {voucherData.totalPax} Pax
                  </span>
                  <span>•</span>
                  <span>
                    <strong>Adults:</strong> {voucherData.adults}
                  </span>
                  <span>•</span>
                  <span>
                    <strong>Children:</strong> {voucherData.children || 0}
                  </span>
                  {voucherData.infants > 0 && (
                    <>
                      <span>•</span>
                      <span>
                        <strong>Infants:</strong> {voucherData.infants}
                      </span>
                    </>
                  )}
                  <span>•</span>
                  <span className="text-emerald-700 font-bold">
                    ✓ Booking Status: CONFIRMED
                  </span>
                </div>
              </div>
            </div>

            {/* 3. CONFIRMED PACKAGE & TOUR INFORMATION */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-emerald-800">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                <span>Confirmed Tour & Accommodation Package</span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                <div className="col-span-2 sm:col-span-2">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Tour Title</span>
                  <span className="font-bold text-slate-900 text-xs">{voucherData.title}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Destination Circuit</span>
                  <span className="font-semibold text-slate-800">{voucherData.destination}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Duration</span>
                  <span className="font-semibold text-slate-800">
                    {voucherData.durationDays} Days / {voucherData.durationNights} Nights
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Travel Start Date</span>
                  <span className="font-semibold text-slate-800">{formattedDate(voucherData.travelStartDate)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Travel End Date</span>
                  <span className="font-semibold text-slate-800">{formattedDate(voucherData.travelEndDate)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Pickup Hub</span>
                  <span className="text-slate-800">{voucherData.pickupLocation || 'Bagdogra / NJP'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Drop Hub</span>
                  <span className="text-slate-800">{voucherData.dropLocation || 'Bagdogra / NJP'}</span>
                </div>

                <div className="col-span-2">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Hotel Category</span>
                  <span className="font-bold text-slate-800">
                    {voucherData.hotelCategory || 'Deluxe Category (3-Star Mountain View)'}
                    {voucherData.hotelName ? ` — ${voucherData.hotelName}` : ''}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Tour Meal Plan</span>
                  <span className="font-bold text-emerald-800">
                    {voucherData.mealPlan || 'MAP (Daily Breakfast & Dinner)'}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. TRANSPORT & CAB ALLOCATION */}
            <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5 text-emerald-800">
                <Car className="w-3.5 h-3.5 text-emerald-700" />
                <span>Dedicated Cab & Transit Allocation</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Assigned Fleet</span>
                  <span className="font-bold text-slate-900">
                    {voucherData.assignedVehicle || voucherData.preferredCab || 'Dedicated Mountain SUV (Innova / Xylo)'}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Fleet Transit Terms</span>
                  <span className="text-slate-700">
                    {voucherData.cabFacilityDescription ||
                      'Exclusive private mountain vehicle allocated for your party from pickup to drop. Includes driver allowances, mountain fuel, road tolls, and parking.'}
                  </span>
                </div>
              </div>
            </div>

            {/* 5. DAY-BY-DAY TOUR ITINERARY TABLE */}
            {voucherData.days && voucherData.days.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-emerald-800">
                    <Clock className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Confirmed Day-by-Day Tour Program</span>
                  </h2>
                  <span className="text-[10px] text-slate-500">
                    Total {voucherData.days.length} Days Itinerary
                  </span>
                </div>

                <div className="divide-y divide-slate-100 text-[11px]">
                  {voucherData.days.map((day) => (
                    <div key={day.dayNumber} className="px-4 py-2.5 flex items-start justify-between gap-3 hover:bg-slate-50/50">
                      <div className="w-16 shrink-0 font-bold text-emerald-800">
                        Day {day.dayNumber}
                        {day.date && <span className="block text-[9px] font-normal text-slate-500">{day.date}</span>}
                      </div>
                      <div className="flex-1">
                        <span className="font-bold text-slate-900">{day.title || `Day ${day.dayNumber} Sightseeing`}</span>
                        {day.sightseeingHighlights && day.sightseeingHighlights.length > 0 && (
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Sightseeing: {day.sightseeingHighlights.slice(0, 3).join(' • ')}
                          </p>
                        )}
                      </div>
                      <div className="w-32 text-right shrink-0">
                        <span className="text-slate-700 font-medium block">
                          {day.nightStay ? `Night @ ${day.nightStay}` : 'Night Stay'}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold block">
                          {day.mealPlan || voucherData.mealPlan || 'Breakfast & Dinner'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. FINANCIAL SETTLEMENT & ADVANCE RECEIPT (CRUCIAL VOUCHER BLOCK) */}
            <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Financial Statement & Advance Payment Receipt</span>
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ADVANCE TOKEN RECEIVED
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Package Cost</span>
                  <span className="text-sm font-black text-white">
                    ₹{voucherData.sellingCost.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40">
                  <span className="text-[10px] text-emerald-400 uppercase font-semibold block">Advance Paid</span>
                  <span className="text-sm font-black text-emerald-300">
                    ₹{voucherData.advanceAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Balance Payable</span>
                  <span className="text-sm font-black text-amber-400">
                    ₹{voucherData.balanceDue.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Payment Mode / Ref</span>
                  <span className="text-[11px] font-mono text-slate-200 truncate block">
                    {voucherData.paymentMode.toUpperCase()} · {voucherData.referenceNumber || 'ADV-REC'}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-300 pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px]">
                <p>
                  <strong>Payment Date:</strong> {voucherData.paymentDate} | <strong>Transaction Note:</strong> {voucherData.paymentNotes || 'Booking Confirmation Deposit'}
                </p>
                <p className="text-amber-300 font-semibold">
                  * Balance amount ₹{voucherData.balanceDue.toLocaleString('en-IN')} is due on arrival during pickup / hotel check-in.
                </p>
              </div>
            </div>

            {/* 7. CONFIRMED INCLUSIONS & EXCLUSIONS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px]">
              <div className="border border-emerald-200 rounded-xl p-3.5 bg-emerald-50/30">
                <h3 className="font-bold text-emerald-900 uppercase text-[10px] tracking-wider mb-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Confirmed Inclusions</span>
                </h3>
                <ul className="space-y-1 text-slate-700">
                  {(voucherData.inclusions && voucherData.inclusions.length > 0
                    ? voucherData.inclusions.slice(0, 5)
                    : [
                        'Accommodation in double sharing rooms as per chosen hotel category',
                        'Daily meals as per specified meal plan (Breakfast & Dinner)',
                        'All transfers and sightseeing by dedicated vehicle throughout',
                        'Driver allowances, mountain fuel charges, road permits, tolls, and parking taxes',
                        'All applicable state border entry permissions (except optional restricted zones)',
                      ]
                  ).map((inc, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-700 font-bold shrink-0">✓</span>
                      <span>{inc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50">
                <h3 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-2 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                  <span>Package Exclusions</span>
                </h3>
                <ul className="space-y-1 text-slate-600">
                  {(voucherData.exclusions && voucherData.exclusions.length > 0
                    ? voucherData.exclusions.slice(0, 4)
                    : [
                        'Airfare, train tickets, and travel insurance',
                        'Personal expenses such as laundry, telephone calls, room heater, and alcoholic drinks',
                        'Monument entry fees, guide fees, camera charges, and adventure ride tickets',
                        'Nathula Pass / Zero Point supplement charges (subject to permits & military clearance)',
                      ]
                  ).map((exc, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-slate-400 font-bold shrink-0">•</span>
                      <span>{exc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 8. MANDATORY TRAVEL & REGIONAL PERMIT ADVISORIES */}
            <div className="border border-amber-200 rounded-xl p-3.5 bg-amber-50/40 text-[10px] text-amber-900 space-y-1">
              <h4 className="font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                <span>Mandatory Travel Advisories & Regional Permit Documents</span>
              </h4>
              <p>
                1. <strong>Photo ID Requirement:</strong> All Indian travelers must carry <strong>Original Voter ID Card or Passport</strong> (Aadhaar Card is not accepted by defense authorities for Sikkim border permits) along with 4 recent passport-size photographs per person.
              </p>
              <p>
                2. <strong>High Altitude Health:</strong> North Sikkim (Gurudongmar, Yumthang) exceeds 15,000 ft altitude. Warm heavy woolens, gloves, thermals, and camphor/diamox are recommended for sensitive travelers.
              </p>
              <p>
                3. <strong>24/7 Operations Helpline:</strong> For on-tour assistance or driver coordination, contact our regional coordinator at {companyProfile.phone2 || companyProfile.phone1 || '+91 98320 12345'}.
              </p>
            </div>

            {/* 9. AUTHORIZED SIGNATORY & SIGN OFF */}
            <div className="pt-4 border-t-2 border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <div>
                <p className="font-bold text-slate-900">{companyProfile.name || 'North East Destinations'}</p>
                <p className="text-[10px]">Siliguri & Gangtok, India · Certified Regional Tour Operator</p>
                <p className="text-[9px] text-slate-400 mt-0.5">
                  Computer-generated confirmation voucher · Valid without physical seal
                </p>
              </div>

              <div className="text-right">
                <div className="h-10 border-b border-dashed border-slate-400 w-36 ml-auto mb-1 flex items-end justify-center">
                  <span className="font-mono text-[9px] text-emerald-800 font-bold uppercase">
                    [AUTHORIZED STAMP]
                  </span>
                </div>
                <p className="font-bold text-slate-800 text-[10px]">Authorized Booking Desk</p>
                <p className="text-[9px] text-slate-400">{voucherData.salesPerson}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer (No-Print) */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0 no-print">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Voucher generated in PDF format. Stored in booking archive.</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4 text-slate-950" />
              <span>{isExportingPdf ? 'Exporting PDF...' : 'Download Voucher in PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
