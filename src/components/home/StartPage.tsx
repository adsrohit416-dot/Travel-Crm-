import React, { useState, useEffect } from 'react';
import {
  Compass,
  FileText,
  Users,
  Wallet,
  Download,
  Settings,
  Sparkles,
  FileUp,
  PlusCircle,
  PhoneCall,
  Calendar,
  MapPin,
  Car,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Utensils,
  ExternalLink,
  Percent,
  Search,
  Building,
  Award,
  BookmarkCheck,
  Mic,
} from 'lucide-react';
import { CompanyProfile, Itinerary, Lead, SalesPerson, TripAccount, FIXED_RESERVED_VEHICLES, FIXED_SHARING_VEHICLE } from '../../types';
import { getSavedCustomImages } from '../../data/destinationImages';

interface StartPageProps {
  onNavigateTab: (tab: 'itinerary' | 'leads' | 'accounts' | 'saved' | 'settings') => void;
  onNewItinerary: () => void;
  onNewLead: () => void;
  onOpenAiCopilot: (prompt?: string) => void;
  onOpenVoiceModal?: () => void;
  onOpenTemplates: () => void;
  onOpenTextUpload: () => void;
  onOpenSettings: () => void;
  onOpenSalesTeam: () => void;
  onSelectItinerary: (itinerary: Itinerary) => void;
  onEditItinerary: (itinerary: Itinerary) => void;
  onSelectLead: (lead: Lead) => void;
  onGenerateNorthSikkimTour: () => void;
  itineraries: Itinerary[];
  leads: Lead[];
  tripAccounts: TripAccount[];
  salesPersons: SalesPerson[];
  companyProfile: CompanyProfile;
}

export const StartPage: React.FC<StartPageProps> = ({
  onNavigateTab,
  onNewItinerary,
  onNewLead,
  onOpenAiCopilot,
  onOpenVoiceModal,
  onOpenTemplates,
  onOpenTextUpload,
  onOpenSettings,
  onOpenSalesTeam,
  onSelectItinerary,
  onEditItinerary,
  onSelectLead,
  onGenerateNorthSikkimTour,
  itineraries,
  leads,
  tripAccounts,
  salesPersons,
  companyProfile,
}) => {
  const [savedImagesCount, setSavedImagesCount] = useState<number>(() => getSavedCustomImages().length);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleUpdate = () => setSavedImagesCount(getSavedCustomImages().length);
    window.addEventListener('custom-images-updated', handleUpdate);
    return () => window.removeEventListener('custom-images-updated', handleUpdate);
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  // Overdue and today's follow-up leads
  const dueLeads = leads.filter(
    (l) => l.status !== 'booked' && l.status !== 'lost' && l.nextFollowUpDate && l.nextFollowUpDate <= todayStr
  );

  // Accounts revenue & profit aggregates
  const totalRevenue = tripAccounts.reduce((sum, a) => sum + (a.sellingCost || 0), 0);
  const totalProfit = tripAccounts.reduce((sum, a) => sum + Math.max(0, (a.sellingCost || 0) - (a.packageCost || 0)), 0);

  // Filtered recent quotes for quick access
  const filteredItineraries = itineraries.filter((i) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      i.guestName.toLowerCase().includes(q) ||
      (i.destination && i.destination.toLowerCase().includes(q)) ||
      (i.quoteNumber && i.quoteNumber.toLowerCase().includes(q)) ||
      (i.title && i.title.toLowerCase().includes(q))
    );
  }).slice(0, 6);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* 1. Header / Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <Compass className="w-3.5 h-3.5" />
                <span>Tour Operations Command Center</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono bg-sky-950/80 text-sky-300 border border-sky-800/60">
                <Car className="w-3 h-3 text-sky-400" />
                <span>Dual Cab Quoting (Reserved & Sharing)</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono bg-amber-950/80 text-amber-300 border border-amber-800/60">
                <Utensils className="w-3 h-3 text-amber-400" />
                <span>North Sikkim: All Meals Compulsory</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              Welcome to {companyProfile.name}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Create professional quotations with dual cab rates (Reserved Innova/Xylo/Sumo vs Sharing Bolero), upload text itineraries, manage client follow-ups, and track booking balance sheets from one central dashboard.
            </p>
          </div>

          {/* Quick Action Primary Buttons in Hero */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
            {onOpenVoiceModal && (
              <button
                type="button"
                onClick={onOpenVoiceModal}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-cyan-500/30 transition-all cursor-pointer whitespace-nowrap active:scale-98 animate-pulse-subtle"
                title="Start live spoken conversation with JARVIS (gemini-3.8-live)"
              >
                <Mic className="w-4 h-4 text-slate-950" />
                <span>Talk to JARVIS (Live Voice)</span>
                <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping"></span>
              </button>
            )}

            <button
              type="button"
              onClick={onNewItinerary}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer whitespace-nowrap active:scale-98"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Quotation</span>
            </button>

            <button
              type="button"
              onClick={onOpenTextUpload}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 font-bold text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap"
              title="Paste WhatsApp or Text itinerary to auto-extract and build"
            >
              <FileUp className="w-4 h-4 text-emerald-400" />
              <span>Upload Text Itinerary</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenAiCopilot()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500/20 to-emerald-500/20 hover:from-teal-500/30 hover:to-emerald-500/30 text-teal-300 border border-teal-500/40 font-bold text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>JARVIS Text Copilot</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Operational Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Quotations */}
        <div
          onClick={() => onNavigateTab('saved')}
          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-xl transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Saved Quotations</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
              <Download className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">{itineraries.length}</span>
            <span className="text-[11px] text-emerald-400 font-medium">Ready for PDF</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Dual cab comparative quotes</p>
        </div>

        {/* Metric 2: CRM Inquiries */}
        <div
          onClick={() => onNavigateTab('leads')}
          className="bg-slate-900 border border-slate-800 hover:border-sky-500/50 p-4 rounded-xl transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Client Inquiries</span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center group-hover:bg-sky-500/20 transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">{leads.length}</span>
            {dueLeads.length > 0 ? (
              <span className="text-[11px] font-bold text-amber-400 font-mono">
                {dueLeads.length} Due Today
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">All updated</span>
            )}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Lead status & phone follow-ups</p>
        </div>

        {/* Metric 3: Accounts Revenue */}
        <div
          onClick={() => onNavigateTab('accounts')}
          className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-4 rounded-xl transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Booked Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
              ₹{totalRevenue >= 100000 ? `${(totalRevenue / 100000).toFixed(1)}L` : totalRevenue.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-emerald-400 font-bold font-mono">
              +₹{Math.round(totalProfit).toLocaleString('en-IN')} Profit
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">{tripAccounts.length} confirmed tour bookings</p>
        </div>

        {/* Metric 4: Saved Images Library */}
        <div
          onClick={() => onNavigateTab('itinerary')}
          className="bg-slate-900 border border-slate-800 hover:border-teal-500/50 p-4 rounded-xl transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Custom Photos Saved</span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center group-hover:bg-teal-500/20 transition-colors">
              <BookmarkCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">{savedImagesCount}</span>
            <span className="text-[11px] text-teal-300 font-medium">For Future Quotes</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Uploaded photos kept permanently</p>
        </div>
      </div>

      {/* 3. North Sikkim Compulsory All Meals Banner Card */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/30 border border-amber-500/40 rounded-2xl p-5 sm:p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-mono">
              Union Rule Notice
            </span>
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5" />
              <span>North Sikkim Compulsory All Meals (AP Plan)</span>
            </span>
          </div>
          <h3 className="text-base font-bold text-white">
            Daily Breakfast, Lunch & Dinner Included for North Sikkim Tours
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            As per regional mountain tourism regulations, all hotel stays and transport in remote high-altitude North Sikkim (Lachen, Gurudongmar Lake, Lachung & Yumthang Valley) strictly require full board All Meals (AP Plan).
          </p>
        </div>

        <button
          type="button"
          onClick={onGenerateNorthSikkimTour}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap shrink-0"
        >
          <Compass className="w-4 h-4" />
          <span>Launch North Sikkim Tour (All Meals)</span>
        </button>
      </div>

      {/* 4. Operations Launchpad: All App Options in 1-Click */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Operations & Tools Launchpad</span>
          </h2>
          <span className="text-xs text-slate-400">All features ready for convenient access</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Itinerary Builder */}
          <div
            onClick={() => onNavigateTab('itinerary')}
            className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/60 rounded-xl p-5 space-y-3 cursor-pointer group transition-all hover:bg-slate-900"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors flex items-center justify-between">
                <span>Itinerary Builder</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Build day-by-day tour itineraries, set hotel categories, calculate profit margins, and export branded A4 PDFs.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-emerald-400 font-medium">
              <span>Dual Cab Quotation Active</span>
              <span className="font-mono">Open Builder →</span>
            </div>
          </div>

          {/* Card 2: Upload Text Itinerary */}
          <div
            onClick={onOpenTextUpload}
            className="bg-slate-900/90 border border-slate-800 hover:border-sky-500/60 rounded-xl p-5 space-y-3 cursor-pointer group transition-all hover:bg-slate-900"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
              <FileUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm group-hover:text-sky-400 transition-colors flex items-center justify-between">
                <span>Upload Text Itinerary</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Paste raw itinerary text, WhatsApp plans, or notes. Automatically detects destination, days, hotels, and vehicle rates.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-sky-400 font-medium">
              <span>Instant AI text parsing</span>
              <span className="font-mono">Paste Text →</span>
            </div>
          </div>

          {/* Card 3: JARVIS AI Voice & Copilot */}
          <div
            onClick={() => {
              if (onOpenVoiceModal) {
                onOpenVoiceModal();
              } else {
                onOpenAiCopilot();
              }
            }}
            className="bg-slate-900/90 border border-slate-800 hover:border-cyan-400/60 rounded-xl p-5 space-y-3 cursor-pointer group transition-all hover:bg-slate-900 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-300 group-hover:scale-110 transition-transform">
                <Mic className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                <span>Live Voice</span>
              </span>
            </div>
            <div>
              <h3 className="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors flex items-center justify-between">
                <span>JARVIS AI Architect</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Speak directly with JARVIS via real-time Live Voice (Gemini 3.8 Live API) or chat to plan, optimize, and edit tours hands-free.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-cyan-300 font-medium">
              <span>Voice & Text Available</span>
              <span className="font-mono">Talk to JARVIS →</span>
            </div>
          </div>

          {/* Card 4: Load Templates */}
          <div
            onClick={onOpenTemplates}
            className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/60 rounded-xl p-5 space-y-3 cursor-pointer group transition-all hover:bg-slate-900"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm group-hover:text-amber-400 transition-colors flex items-center justify-between">
                <span>Tour Templates</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Preloaded itineraries for Sikkim, Darjeeling, Meghalaya & Kaziranga with day-by-day images and dual quotes ready to customize.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-amber-400 font-medium">
              <span>Curated itineraries</span>
              <span className="font-mono">Browse Packages →</span>
            </div>
          </div>

          {/* Card 5: Lead CRM */}
          <div
            onClick={() => onNavigateTab('leads')}
            className="bg-slate-900/90 border border-slate-800 hover:border-blue-500/60 rounded-xl p-5 space-y-3 cursor-pointer group transition-all hover:bg-slate-900"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors flex items-center justify-between">
                <span>Lead & Client CRM</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Track client phone calls, preferred cab choices (Reserved vs Sharing), travel dates, follow-up alarms, and convert to bookings.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-blue-400 font-medium">
              <span>{dueLeads.length} follow-ups due</span>
              <span className="font-mono">Open CRM →</span>
            </div>
          </div>

          {/* Card 6: Accounts & Balance Sheet */}
          <div
            onClick={() => onNavigateTab('accounts')}
            className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/60 rounded-xl p-5 space-y-3 cursor-pointer group transition-all hover:bg-slate-900"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors flex items-center justify-between">
                <span>Accounts & Profit</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Profit ledger with 50% sales executive commission splits, day-wise hotel/cab payments, advance receipts, and balance status.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-emerald-400 font-medium">
              <span>50% Executive Splits</span>
              <span className="font-mono">View Ledger →</span>
            </div>
          </div>

          {/* Card 7: Sales Team Management */}
          <div
            onClick={onOpenSalesTeam}
            className="bg-slate-900/90 border border-slate-800 hover:border-purple-500/60 rounded-xl p-5 space-y-3 cursor-pointer group transition-all hover:bg-slate-900"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm group-hover:text-purple-400 transition-colors flex items-center justify-between">
                <span>Sales Team & Executives</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Manage your agency sales executives, assign leads and itineraries, and track executive commission balances automatically.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-purple-400 font-medium">
              <span>{salesPersons.length} Consultants</span>
              <span className="font-mono">Manage Team →</span>
            </div>
          </div>

          {/* Card 8: Agency Profile & Bank Credentials */}
          <div
            onClick={onOpenSettings}
            className="bg-slate-900/90 border border-slate-800 hover:border-rose-500/60 rounded-xl p-5 space-y-3 cursor-pointer group transition-all hover:bg-slate-900"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm group-hover:text-rose-400 transition-colors flex items-center justify-between">
                <span>Agency Settings & QR</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Update agency logo, address, phone contacts, bank account numbers, IFSC codes, and payment QR code printed on quotations.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-rose-400 font-medium">
              <span>PDF Branding & UPI</span>
              <span className="font-mono">Edit Settings →</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Fixed Vehicle Fleet Reference Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Car className="w-4 h-4 text-emerald-400" />
              <span>Agency Fixed Cab Fleet Standards</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Standardized vehicle allocations used throughout your quotations for Reserved and Sharing packages
            </p>
          </div>
          <span className="text-[10px] bg-slate-950 text-emerald-400 font-mono px-2.5 py-1 rounded border border-slate-800 shrink-0">
            North East Union Compliant
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Reserved Fleet */}
          <div className="bg-slate-950 p-4 rounded-xl border border-sky-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <span>Category 1: Reserved Cab Fleet (Private)</span>
              </span>
              <span className="text-[10px] text-slate-400">Exclusive Dedicated</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {FIXED_RESERVED_VEHICLES.map((v) => (
                <div key={v.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{v.name}</span>
                    <span className="text-[9px] font-mono text-sky-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-700">
                      {v.capacity}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block line-clamp-1">{v.category}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
              Private vehicle allocated exclusively for your client group from pickup to drop with flexible sightseeing & photo stops.
            </p>
          </div>

          {/* Sharing Fleet */}
          <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <span>Category 2: Sharing Cab Facility (Fixed)</span>
              </span>
              <span className="text-[10px] text-amber-300 bg-amber-950 px-2 py-0.5 rounded font-mono border border-amber-800">
                Union Standard
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{FIXED_SHARING_VEHICLE.name}</span>
                <span className="text-[10px] font-mono text-amber-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-700">
                  {FIXED_SHARING_VEHICLE.capacity}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {FIXED_SHARING_VEHICLE.fixedNotice}
              </p>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
              Seat allocation on scheduled departure slots between mountain taxi hubs (Siliguri, Gangtok, Darjeeling).
            </p>
          </div>
        </div>
      </div>

      {/* 6. Recent Quotations & Pending Inquiries Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recent Quotations (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3 flex-wrap">
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Recent Itinerary Quotes ({itineraries.length})</span>
              </h3>
              <span className="text-xs text-slate-400">Quickly preview, edit, or share proposals</span>
            </div>

            {/* Quick search input */}
            <div className="relative w-44">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search quotes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-2.5 py-1 text-xs text-white placeholder-slate-500"
              />
            </div>
          </div>

          {filteredItineraries.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No quotations found matching your search.
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredItineraries.map((itin) => {
                const isDual = itin.pricingMode === 'both' || itin.pricingMode === 'dual_comparison';
                return (
                  <div
                    key={itin.id}
                    className="p-3 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-emerald-400 text-[11px]">
                          #{itin.quoteNumber}
                        </span>
                        <span className="font-bold text-white truncate max-w-[140px] sm:max-w-[200px]">
                          {itin.guestName || 'Unnamed Guest'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {itin.durationDays}D / {itin.durationNights}N
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span className="truncate">{itin.destination || 'Sikkim'}</span>
                        <span>·</span>
                        <span className={isDual ? 'text-emerald-400 font-semibold' : 'text-slate-300'}>
                          {isDual ? 'Dual Cab Rates' : itin.pricingMode === 'sharing' ? 'Sharing Cab' : 'Reserved Cab'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onSelectItinerary(itin)}
                        className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg font-semibold text-[11px] transition-colors cursor-pointer"
                        title="Preview & Export PDF"
                      >
                        PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditItinerary(itin)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold text-[11px] transition-colors cursor-pointer"
                        title="Edit Itinerary"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-2 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => onNavigateTab('saved')}
              className="text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View All {itineraries.length} Saved Quotations →</span>
            </button>
            <button
              type="button"
              onClick={onNewItinerary}
              className="text-slate-400 hover:text-white font-medium cursor-pointer"
            >
              + Create New
            </button>
          </div>
        </div>

        {/* Right: Urgent Follow-Ups & New Inquiries (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-sky-400" />
                <span>Follow-ups Due ({dueLeads.length})</span>
              </h3>
              <span className="text-xs text-slate-400">Leads requiring client contact</span>
            </div>
            <button
              type="button"
              onClick={onNewLead}
              className="text-[11px] font-bold text-sky-400 hover:text-sky-300 bg-sky-950 px-2 py-0.5 rounded border border-sky-800 cursor-pointer"
            >
              + Add Lead
            </button>
          </div>

          {dueLeads.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 bg-slate-950 rounded-xl p-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="font-semibold text-slate-300">All client follow-ups are up to date!</p>
              <p className="text-[11px] text-slate-500 mt-0.5">No overdue call reminders today.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {dueLeads.slice(0, 5).map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => onSelectLead(lead)}
                  className="p-3 bg-slate-950 rounded-xl border border-slate-800 hover:border-sky-500/50 transition-colors cursor-pointer space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{lead.guestName}</span>
                    <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                      Due: {lead.nextFollowUpDate}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{lead.phone || 'No phone'}</span>
                    <span className="text-slate-300 truncate max-w-[120px]">{lead.destination || 'Tour'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => onNavigateTab('leads')}
              className="text-sky-400 hover:text-sky-300 font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Go to Lead CRM ({leads.length} Leads) →</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
