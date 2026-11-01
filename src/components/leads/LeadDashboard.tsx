import React, { useState, useMemo } from 'react';
import {
  Users,
  Calendar,
  Clock,
  Phone,
  MessageSquare,
  FileText,
  Search,
  Filter,
  AlertCircle,
  Plus,
  CheckCircle2,
  Car,
  TrendingUp,
  MapPin,
  ChevronRight,
  Edit2,
  Trash2,
  ExternalLink,
  Award,
  Wallet,
  RotateCcw,
  FileCheck,
} from 'lucide-react';
import { Lead, LeadStatus, SalesPerson } from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';
import { ConvertLeadModal, ConvertLeadPayload } from './ConvertLeadModal';

interface LeadDashboardProps {
  leads: Lead[];
  salesPersons?: SalesPerson[];
  onQuickAddSalesPerson?: (name: string) => void;
  onOpenManageSalesTeam?: () => void;
  onNewLead: () => void;
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
  onConvertLeadToQuote: (lead: Lead) => void;
  onOpenInteractionLog: (lead: Lead) => void;
  onConvertLeadWithAdvance?: (payload: ConvertLeadPayload) => void;
  onNavigateToAccounts?: () => void;
  onUnbookLead?: (lead: Lead) => void;
  onViewLeadQuote?: (itineraryId: string) => void;
  onViewVoucher?: (lead: Lead) => void;
}

export const LeadDashboard: React.FC<LeadDashboardProps> = ({
  leads,
  salesPersons = [],
  onQuickAddSalesPerson,
  onOpenManageSalesTeam,
  onNewLead,
  onEditLead,
  onDeleteLead,
  onConvertLeadToQuote,
  onOpenInteractionLog,
  onConvertLeadWithAdvance,
  onNavigateToAccounts,
  onUnbookLead,
  onViewLeadQuote,
  onViewVoucher,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [cabFilter, setCabFilter] = useState<string>('all');
  const [salesFilter, setSalesFilter] = useState<string>('all');
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);
  const [leadToUnbook, setLeadToUnbook] = useState<Lead | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Compute CRM pipeline metrics
  const stats = useMemo(() => {
    let overdueCount = 0;
    let todayCount = 0;
    let bookedCount = 0;
    let quotesSent = 0;

    leads.forEach((l) => {
      if (l.status === 'booked') bookedCount++;
      if (l.status === 'itinerary_sent') quotesSent++;

      if (l.status !== 'booked' && l.status !== 'lost') {
        if (l.nextFollowUpDate === todayStr) {
          todayCount++;
        } else if (l.nextFollowUpDate && l.nextFollowUpDate < todayStr) {
          overdueCount++;
        }
      }
    });

    return {
      total: leads.length,
      today: todayCount,
      overdue: overdueCount,
      booked: bookedCount,
      quotesSent,
    };
  }, [leads, todayStr]);

  // Unique sales persons list
  const uniqueSalesPersons = useMemo(() => {
    const set = new Set<string>();
    if (salesPersons) {
      salesPersons.forEach((sp) => {
        if (sp.isActive) set.add(sp.name);
      });
    }
    leads.forEach((l) => {
      if (l.salesPerson) set.add(l.salesPerson);
    });
    return Array.from(set);
  }, [leads, salesPersons]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        l.guestName.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        (l.email && l.email.toLowerCase().includes(q)) ||
        (l.salesPerson && l.salesPerson.toLowerCase().includes(q)) ||
        l.destination.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'due_today'
          ? l.nextFollowUpDate === todayStr && l.status !== 'booked' && l.status !== 'lost'
          : statusFilter === 'overdue'
          ? l.nextFollowUpDate < todayStr && l.status !== 'booked' && l.status !== 'lost'
          : l.status === statusFilter;

      const matchesPriority =
        priorityFilter === 'all' ? true : l.priority === priorityFilter;

      const matchesCab =
        cabFilter === 'all' ? true : l.preferredCab === cabFilter;

      const matchesSales =
        salesFilter === 'all' ? true : (l.salesPerson || 'Rohit Sharma').toLowerCase() === salesFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesPriority && matchesCab && matchesSales;
    });
  }, [leads, searchTerm, statusFilter, priorityFilter, cabFilter, salesFilter, todayStr]);

  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'new':
        return <span className="text-sky-400 font-medium">New Lead</span>;
      case 'contacted':
        return <span className="text-blue-400 font-medium">Contacted</span>;
      case 'itinerary_sent':
        return <span className="text-purple-400 font-medium">Quote Sent</span>;
      case 'follow_up':
        return <span className="text-amber-400 font-medium">Follow-up Due</span>;
      case 'negotiation':
        return <span className="text-indigo-400 font-medium">Negotiating</span>;
      case 'booked':
        return <span className="text-emerald-400 font-bold">Booked (Won)</span>;
      case 'lost':
        return <span className="text-rose-400 font-medium">Lost / Closed</span>;
      default:
        return <span className="text-slate-400">{status}</span>;
    }
  };

  const getCabBadge = (pref: string) => {
    if (pref === 'both') {
      return (
        <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
          Dual Rate (Reserved + Sharing)
        </span>
      );
    }
    if (pref === 'reserved') {
      return (
        <span className="text-[11px] font-medium text-sky-400 bg-sky-950/60 border border-sky-800/60 px-2 py-0.5 rounded">
          Reserved Cab Only
        </span>
      );
    }
    return (
      <span className="text-[11px] font-medium text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded">
        Sharing Cab Only
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Stat Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Inquiries</span>
            <Users className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums mt-1">
            {stats.total}
          </div>
          <span className="text-[11px] text-slate-500">All registered leads</span>
        </div>

        <div className="bg-slate-900 border border-amber-500/30 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-300 font-medium">Follow-ups Today</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono tabular-nums mt-1">
            {stats.today}
          </div>
          <button
            onClick={() => setStatusFilter('due_today')}
            className="text-[11px] text-amber-400/80 hover:text-amber-300 underline mt-0.5 block text-left"
          >
            Show today's list
          </button>
        </div>

        <div className="bg-slate-900 border border-rose-500/30 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-rose-300 font-medium">Overdue Follow-ups</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono tabular-nums mt-1">
            {stats.overdue}
          </div>
          <button
            onClick={() => setStatusFilter('overdue')}
            className="text-[11px] text-rose-400/80 hover:text-rose-300 underline mt-0.5 block text-left"
          >
            Action required
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Quotes Sent</span>
            <FileText className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 font-mono tabular-nums mt-1">
            {stats.quotesSent}
          </div>
          <span className="text-[11px] text-slate-500">Itineraries issued</span>
        </div>

        <div className="bg-slate-900 border border-emerald-500/30 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-300 font-medium">Won / Confirmed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums mt-1">
            {stats.booked}
          </div>
          <span className="text-[11px] text-emerald-400/80">Booked guests</span>
        </div>
      </div>

      {/* SOP Lead Conversion & Accounting Pipeline Guide Strip */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px]">
            SOP
          </div>
          <span className="font-bold text-white tracking-tight">Agency Conversion Workflow:</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-300">
          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-sky-400 font-medium">
            1. New Inquiry
          </span>
          <span className="text-slate-600">→</span>
          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-purple-400 font-medium">
            2. Quote Sent
          </span>
          <span className="text-slate-600">→</span>
          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-400 font-medium">
            3. Follow-up / Negotiation
          </span>
          <span className="text-slate-600">→</span>
          <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>4. Mark Converted with Advance</span>
          </span>
          <span className="text-slate-600">→</span>
          <span className="px-2 py-0.5 rounded bg-slate-950 border border-emerald-800/60 text-emerald-300 font-semibold flex items-center gap-1">
            <Wallet className="w-3 h-3 text-emerald-400" />
            <span>5. Auto-Syncs to Balance Sheet</span>
          </span>
        </div>
      </div>

      {/* Action & Filter Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by guest name, phone, city, or destination..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                  statusFilter === 'all'
                    ? 'bg-slate-800 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({leads.length})
              </button>
              <button
                onClick={() => setStatusFilter('due_today')}
                className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                  statusFilter === 'due_today'
                    ? 'bg-amber-500/20 text-amber-300 font-medium border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Today ({stats.today})
              </button>
              <button
                onClick={() => setStatusFilter('overdue')}
                className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                  statusFilter === 'overdue'
                    ? 'bg-rose-500/20 text-rose-300 font-medium border border-rose-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Overdue ({stats.overdue})
              </button>
              <button
                onClick={() => setStatusFilter('booked')}
                className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                  statusFilter === 'booked'
                    ? 'bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Booked ({stats.booked})
              </button>
            </div>

            <button
              onClick={onNewLead}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors whitespace-nowrap ml-auto md:ml-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New Inquiry</span>
            </button>
          </div>
        </div>

        {/* Secondary filters: Cab & Priority */}
        <div className="flex items-center gap-3 text-xs text-slate-400 pt-1 border-t border-slate-800/60">
          <span className="text-[11px] font-medium text-slate-400">Filter by Cab:</span>
          <select
            value={cabFilter}
            onChange={(e) => setCabFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none"
          >
            <option value="all">All Vehicle Types</option>
            <option value="both">Dual Rate (Reserved + Sharing)</option>
            <option value="reserved">Reserved Cab Only</option>
            <option value="sharing">Sharing Cab Only</option>
          </select>

          <span className="text-[11px] font-medium text-slate-400 ml-2">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <span className="text-[11px] font-medium text-slate-400 ml-2">Executive:</span>
          <select
            value={salesFilter}
            onChange={(e) => setSalesFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none"
          >
            <option value="all">All Sales Executives</option>
            {uniqueSalesPersons.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          {onOpenManageSalesTeam && (
            <button
              type="button"
              onClick={onOpenManageSalesTeam}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium hover:underline cursor-pointer whitespace-nowrap"
              title="Add, edit or delete sales team members"
            >
              + Manage Team
            </button>
          )}

          {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || cabFilter !== 'all' || salesFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setPriorityFilter('all');
                setCabFilter('all');
                setSalesFilter('all');
              }}
              className="text-[11px] text-slate-400 hover:text-white underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Leads Table / Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="font-semibold text-slate-200">
            Client Inquiries ({filteredLeads.length})
          </div>
          <div>Sorted by upcoming follow-up date</div>
        </div>

        {filteredLeads.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <p className="text-sm font-medium text-slate-400">No matching inquiries found</p>
            <p className="text-xs text-slate-500 mt-1">
              Adjust your search keywords or create a new lead inquiry.
            </p>
            <button
              onClick={onNewLead}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-slate-950 text-xs font-semibold rounded-md hover:bg-emerald-400 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add First Lead
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredLeads.map((lead) => {
              const isOverdue =
                lead.nextFollowUpDate < todayStr &&
                lead.status !== 'booked' &&
                lead.status !== 'lost';
              const isToday =
                lead.nextFollowUpDate === todayStr &&
                lead.status !== 'booked' &&
                lead.status !== 'lost';

              return (
                <div
                  key={lead.id}
                  className="p-4 hover:bg-slate-800/40 transition-colors flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                >
                  {/* Left: Guest Details & Destination */}
                  <div className="space-y-1.5 flex-1 min-w-[280px]">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-sm font-bold text-white hover:text-emerald-400 cursor-pointer" onClick={() => onEditLead(lead)}>
                        {lead.guestName}
                      </span>
                      {lead.city && (
                        <span className="text-[11px] text-slate-400 flex items-center gap-0.5">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          {lead.city}
                        </span>
                      )}
                      <span>·</span>
                      <span className="text-xs">{getStatusBadge(lead.status)}</span>
                      {lead.priority === 'high' && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-950/60 border border-rose-900 px-1.5 py-0.5 rounded">
                          High Priority
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-300 font-medium flex items-center gap-1.5 flex-wrap">
                      <span className="text-emerald-400">{lead.destination}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400 font-mono">
                        {lead.durationNights}N/{lead.durationDays}D
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400 font-mono">
                        {lead.adults} Adults
                        {lead.children > 0 ? `, ${lead.children} Child` : ''}
                      </span>
                      {lead.budget && (
                        <>
                          <span className="text-slate-600">·</span>
                          <span className="text-slate-400 font-mono">{lead.budget}</span>
                        </>
                      )}
                    </div>

                    {/* Cab Preference, Sales Person & Accounts indicator */}
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded">
                        <Award className="w-3 h-3 text-emerald-400" />
                        <span>{lead.salesPerson || 'Rohit Sharma'}</span>
                      </span>
                      {getCabBadge(lead.preferredCab)}
                      {lead.status === 'booked' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-1.5 py-0.5 rounded">
                          <Wallet className="w-3 h-3" />
                          <span>Balance Sheet Active</span>
                        </span>
                      )}
                      {lead.notes && (
                        <span className="text-[11px] text-slate-400 italic line-clamp-1 max-w-md">
                          "{lead.notes}"
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle: Follow-up Info */}
                  <div className="text-xs space-y-1 min-w-[200px]">
                    <div className="flex items-center gap-1.5">
                      <Clock
                        className={`w-3.5 h-3.5 ${
                          isOverdue
                            ? 'text-rose-400'
                            : isToday
                            ? 'text-amber-400'
                            : 'text-slate-400'
                        }`}
                      />
                      <span
                        className={`font-mono text-xs ${
                          isOverdue
                            ? 'text-rose-400 font-bold'
                            : isToday
                            ? 'text-amber-300 font-bold'
                            : 'text-slate-300'
                        }`}
                      >
                        {isOverdue && '⚠️ Overdue: '}
                        {isToday && '⏰ Today: '}
                        {lead.nextFollowUpDate || 'No date set'}
                      </span>
                      {lead.nextFollowUpTime && (
                        <span className="text-slate-400 text-[11px]">
                          ({lead.nextFollowUpTime})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                      <span className="font-mono">{lead.phone}</span>
                      <span>·</span>
                      <button
                        onClick={() => onOpenInteractionLog(lead)}
                        className="text-slate-300 hover:text-emerald-400 underline"
                      >
                        {lead.logs?.length || 0} activity logs
                      </button>
                    </div>
                  </div>

                  {/* Right: Quick Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* SOP Convert / Unbook Buttons */}
                    {lead.status === 'booked' ? (
                      <div className="flex items-center gap-1.5">
                        {onViewVoucher && (
                          <button
                            type="button"
                            onClick={() => onViewVoucher(lead)}
                            title="View & Download Official Tour Booking Confirmation Voucher (PDF)"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 font-bold text-xs rounded-md border border-emerald-500/40 transition-colors whitespace-nowrap cursor-pointer shadow-xs"
                          >
                            <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Voucher (PDF)</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onNavigateToAccounts?.()}
                          title="Booking Confirmed! Click to view live balance sheet in Accounts section"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-400 font-bold text-xs rounded-md shadow-sm transition-colors whitespace-nowrap cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>✓ Booked (Account)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setLeadToUnbook(lead)}
                          title="Unbook / Cancel booking: reverts lead status and deletes the account from Accounts ledger"
                          className="inline-flex items-center gap-1 px-2 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/60 text-rose-300 hover:text-white text-xs font-semibold rounded-md shadow-sm transition-colors whitespace-nowrap cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3 text-rose-400" />
                          <span>Unbook</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setLeadToConvert(lead)}
                        title="Mark lead as converted/won, enter advance payment received, and auto-sync to Accounts Balance Sheet"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-md shadow-sm transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Convert / Book</span>
                      </button>
                    )}

                    {/* 1-Click Convert to Quote / View Saved Quote */}
                    {lead.itineraryId && onViewLeadQuote ? (
                      <button
                        type="button"
                        onClick={() => onViewLeadQuote(lead.itineraryId!)}
                        title={`Open saved quotation #${lead.quoteNumber || 'View Quote'}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-purple-950/70 hover:bg-purple-900/80 border border-purple-700/60 text-purple-300 hover:text-white font-semibold text-xs rounded-md transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-purple-400" />
                        <span>{lead.quoteNumber ? `#${lead.quoteNumber}` : 'View Quote'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onConvertLeadToQuote(lead)}
                        title="Generate Itinerary Quote with guest details & dual rate cab options"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs rounded-md border border-slate-700 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-purple-400" />
                        <span>Quote Itinerary</span>
                      </button>
                    )}

                    {/* Log Activity */}
                    <button
                      type="button"
                      onClick={() => onOpenInteractionLog(lead)}
                      title="Log Call / WhatsApp follow-up"
                      className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors cursor-pointer"
                    >
                      <Phone className="w-4 h-4 text-sky-400" />
                    </button>

                    {/* WhatsApp link */}
                    <a
                      href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        `Hi ${lead.guestName}, greetings from North East Destinations! Regarding your inquiry for ${lead.destination}, we are pleased to assist you.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      title="Open WhatsApp chat"
                      className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors"
                    >
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                    </a>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => onEditLead(lead)}
                      title="Edit Lead Details"
                      className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => setLeadToDelete(lead)}
                      title="Delete Lead"
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-md transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Convert Lead with Advance Payment Modal */}
      {leadToConvert && (
        <ConvertLeadModal
          isOpen={Boolean(leadToConvert)}
          lead={leadToConvert}
          salesPersons={salesPersons}
          onQuickAddSalesPerson={onQuickAddSalesPerson}
          onOpenManageSalesTeam={onOpenManageSalesTeam}
          onClose={() => setLeadToConvert(null)}
          onConfirm={(payload) => {
            onConvertLeadWithAdvance?.(payload);
            setLeadToConvert(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!leadToDelete}
        title="Delete Client Inquiry"
        message={`Are you sure you want to delete the inquiry for "${leadToDelete?.guestName}" (${leadToDelete?.destination})? This action cannot be undone.`}
        confirmLabel="Yes, Delete Lead"
        onConfirm={() => {
          if (leadToDelete) {
            onDeleteLead(leadToDelete.id);
            setLeadToDelete(null);
          }
        }}
        onCancel={() => setLeadToDelete(null)}
      />

      {/* Unbook Confirmation Modal */}
      <ConfirmModal
        isOpen={!!leadToUnbook}
        title="Unbook Client & Cancel Booking"
        message={`Are you sure you want to unbook "${leadToUnbook?.guestName}"? This will cancel the booked status, delete the booking account record from the Accounts ledger, and revert the lead back to active follow-up.`}
        confirmLabel="Yes, Unbook & Remove from Accounts"
        confirmVariant="danger"
        onConfirm={() => {
          if (leadToUnbook) {
            onUnbookLead?.(leadToUnbook);
            setLeadToUnbook(null);
          }
        }}
        onCancel={() => setLeadToUnbook(null)}
      />
    </div>
  );
};
