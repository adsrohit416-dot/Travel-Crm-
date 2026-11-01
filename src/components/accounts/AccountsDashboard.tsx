import React, { useState, useMemo } from 'react';
import {
  Wallet,
  DollarSign,
  TrendingUp,
  Award,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Plus,
  Lock,
  Building,
  Car,
  FileText,
  Printer,
  ChevronRight,
  ExternalLink,
  Users,
  CreditCard,
  Check,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { SalesPerson, TripAccount, TripStatus } from '../../types';
import { AccountLedgerModal } from './AccountLedgerModal';
import { ConfirmModal } from '../common/ConfirmModal';

interface AccountsDashboardProps {
  accounts: TripAccount[];
  salesPersons?: SalesPerson[];
  onQuickAddSalesPerson?: (name: string) => void;
  onOpenManageSalesTeam?: () => void;
  onUpdateAccount: (account: TripAccount) => void;
  onCreateAccount: (account: TripAccount) => void;
  onDeleteAccount: (accountId: string) => void;
  onClearAllAccounts: () => void;
  onResetToSampleAccounts: () => void;
  onNavigateToLead?: (leadId: string) => void;
  onViewVoucher?: (account: TripAccount) => void;
}

export const AccountsDashboard: React.FC<AccountsDashboardProps> = ({
  accounts,
  salesPersons = [],
  onQuickAddSalesPerson,
  onOpenManageSalesTeam,
  onUpdateAccount,
  onCreateAccount,
  onDeleteAccount,
  onClearAllAccounts,
  onResetToSampleAccounts,
  onNavigateToLead,
  onViewVoucher,
}) => {
  const [activeTab, setActiveTab] = useState<'all_trips' | 'sales_commissions' | 'vendors'>('all_trips');
  const [searchTerm, setSearchTerm] = useState('');
  const [salesPersonFilter, setSalesPersonFilter] = useState('all');
  const [tripStatusFilter, setTripStatusFilter] = useState('all');
  const [commissionStatusFilter, setCommissionStatusFilter] = useState('all');

  const [selectedAccount, setSelectedAccount] = useState<TripAccount | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<TripAccount | null>(null);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);

  // Extract unique sales people
  const uniqueSalesPeople = useMemo(() => {
    const set = new Set<string>();
    if (salesPersons) {
      salesPersons.forEach((sp) => {
        if (sp.isActive) set.add(sp.name);
      });
    }
    accounts.forEach((a) => {
      if (a.salesPerson) set.add(a.salesPerson);
    });
    return Array.from(set);
  }, [accounts, salesPersons]);

  // Overall Financial Aggregates
  const stats = useMemo(() => {
    let totalSelling = 0;
    let totalClientReceived = 0;
    let totalVendorAgreed = 0;
    let totalVendorPaid = 0;
    let completedProfit = 0;
    let totalCommissionsEarned = 0;
    let totalCommissionsPaid = 0;
    let totalCommissionsPending = 0;
    let completedTripCount = 0;

    accounts.forEach((acc) => {
      totalSelling += acc.sellingCost || 0;

      const clientRec = (acc.clientPayments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
      totalClientReceived += clientRec;

      const vendorCost = (acc.vendorExpenses || []).reduce((sum, v) => sum + (v.totalAgreedCost || 0), 0) || (acc.packageCost || 0);
      const vendorPaid = (acc.vendorExpenses || []).reduce((sum, v) => sum + (v.amountPaid || 0), 0);
      totalVendorAgreed += vendorCost;
      totalVendorPaid += vendorPaid;

      // Profit calculations
      const netProfit = Math.max(0, (acc.sellingCost || 0) - vendorCost);
      const commission50 = Math.round(netProfit * 0.5);

      if (acc.tripStatus === 'completed') {
        completedTripCount++;
        completedProfit += netProfit;
        totalCommissionsEarned += commission50;

        if (acc.salesCommissionPaid) {
          totalCommissionsPaid += commission50;
        } else {
          totalCommissionsPending += commission50;
        }
      }
    });

    const clientReceivable = Math.max(0, totalSelling - totalClientReceived);
    const vendorPayable = Math.max(0, totalVendorAgreed - totalVendorPaid);
    const agencyNetRetained = completedProfit - totalCommissionsEarned;

    return {
      totalSelling,
      totalClientReceived,
      clientReceivable,
      totalVendorAgreed,
      totalVendorPaid,
      vendorPayable,
      completedTripCount,
      completedProfit,
      totalCommissionsEarned,
      totalCommissionsPaid,
      totalCommissionsPending,
      agencyNetRetained,
    };
  }, [accounts]);

  // Filtered Accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        acc.guestName.toLowerCase().includes(q) ||
        acc.quoteNumber.toLowerCase().includes(q) ||
        acc.destination.toLowerCase().includes(q) ||
        acc.guestPhone.includes(q) ||
        acc.salesPerson.toLowerCase().includes(q);

      const matchesSales =
        salesPersonFilter === 'all' || acc.salesPerson.toLowerCase() === salesPersonFilter.toLowerCase();

      const matchesStatus =
        tripStatusFilter === 'all' || acc.tripStatus === tripStatusFilter;

      const matchesCommission =
        commissionStatusFilter === 'all'
          ? true
          : commissionStatusFilter === 'paid'
          ? acc.tripStatus === 'completed' && acc.salesCommissionPaid
          : commissionStatusFilter === 'due'
          ? acc.tripStatus === 'completed' && !acc.salesCommissionPaid
          : acc.tripStatus !== 'completed';

      return matchesSearch && matchesSales && matchesStatus && matchesCommission;
    });
  }, [accounts, searchTerm, salesPersonFilter, tripStatusFilter, commissionStatusFilter]);

  // Per-Sales Person Commission Report
  const salesTeamReport = useMemo(() => {
    const map = new Map<
      string,
      {
        salesPerson: string;
        totalTrips: number;
        completedTrips: number;
        totalSelling: number;
        totalProfit: number;
        commissionEarned: number;
        commissionPaid: number;
        commissionPending: number;
        tripList: TripAccount[];
      }
    >();

    // Pre-populate with all active sales persons so newly created executives are immediately visible in the ledger
    if (salesPersons) {
      salesPersons.forEach((sp) => {
        if (sp.isActive && !map.has(sp.name)) {
          map.set(sp.name, {
            salesPerson: sp.name,
            totalTrips: 0,
            completedTrips: 0,
            totalSelling: 0,
            totalProfit: 0,
            commissionEarned: 0,
            commissionPaid: 0,
            commissionPending: 0,
            tripList: [],
          });
        }
      });
    }

    accounts.forEach((acc) => {
      const name = acc.salesPerson || 'Unassigned';
      if (!map.has(name)) {
        map.set(name, {
          salesPerson: name,
          totalTrips: 0,
          completedTrips: 0,
          totalSelling: 0,
          totalProfit: 0,
          commissionEarned: 0,
          commissionPaid: 0,
          commissionPending: 0,
          tripList: [],
        });
      }

      const rep = map.get(name)!;
      rep.totalTrips++;
      rep.totalSelling += acc.sellingCost || 0;
      rep.tripList.push(acc);

      const vendorCost =
        (acc.vendorExpenses || []).reduce((sum, v) => sum + (v.totalAgreedCost || 0), 0) || (acc.packageCost || 0);
      const profit = Math.max(0, (acc.sellingCost || 0) - vendorCost);
      const commission50 = Math.round(profit * 0.5);

      if (acc.tripStatus === 'completed') {
        rep.completedTrips++;
        rep.totalProfit += profit;
        rep.commissionEarned += commission50;

        if (acc.salesCommissionPaid) {
          rep.commissionPaid += commission50;
        } else {
          rep.commissionPending += commission50;
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => b.commissionEarned - a.commissionEarned);
  }, [accounts, salesPersons]);

  // Quick Action: Mark trip as completed
  const handleQuickMarkCompleted = (acc: TripAccount) => {
    const updated: TripAccount = {
      ...acc,
      tripStatus: 'completed',
      tripCompletedDate: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
    };
    onUpdateAccount(updated);
  };

  // Quick Action: Mark commission paid to executive
  const handleQuickPayCommission = (acc: TripAccount) => {
    const updated: TripAccount = {
      ...acc,
      salesCommissionPaid: true,
      salesCommissionPaidDate: new Date().toISOString().split('T')[0],
      salesCommissionRef: `UPI-COMM-${Date.now().toString().slice(-6)}`,
      salesCommissionNotes: `50% profit share disbursed to ${acc.salesPerson}`,
      updatedAt: new Date().toISOString(),
    };
    onUpdateAccount(updated);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Wallet className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Agency Accounts & Profit Balance Sheet</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>Confidential Internal</span>
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Track client payments received, vendor expenses made, realized tour profit, and 50% commission shares for sales executives.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>Print Ledger</span>
          </button>

          {accounts.length > 0 ? (
            <button
              type="button"
              onClick={() => setIsClearAllModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-950/70 hover:bg-rose-900/90 text-rose-300 hover:text-white border border-rose-800/80 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              title="Remove all dummy/sample accounts and start with a fresh blank ledger"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Start Fresh (Clear Dummy Data)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onResetToSampleAccounts}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              title="Restore sample demo accounts for testing"
            >
              <RotateCcw className="w-4 h-4 text-emerald-400" />
              <span>Restore Demo Sample Data</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              const newAcc: TripAccount = {
                id: `acc-${Date.now()}`,
                quoteNumber: `NED-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                guestName: 'New Tour Booking',
                guestPhone: '+91 ',
                destination: 'Sikkim & Darjeeling',
                salesPerson: 'Rohit Sharma',
                tripStatus: 'upcoming',
                sellingCost: 55000,
                packageCost: 36000,
                clientPayments: [],
                vendorExpenses: [],
                salesCommissionPercentage: 50,
                salesCommissionPaid: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              onCreateAccount(newAcc);
              setSelectedAccount(newAcc);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Add Booking Account</span>
          </button>
        </div>
      </div>

      {/* TOP KPI FINANCIAL OVERVIEW CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Client Revenue */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Total Selling Revenue
          </span>
          <span className="text-xl font-black text-white font-mono block">
            ₹{stats.totalSelling.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-slate-500 block">
            Across {accounts.length} bookings
          </span>
        </div>

        {/* Client Payments Collected */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Client Payments Inflow
          </span>
          <span className="text-xl font-black text-emerald-400 font-mono block">
            ₹{stats.totalClientReceived.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-amber-400 font-mono block">
            ₹{stats.clientReceivable.toLocaleString('en-IN')} pending due
          </span>
        </div>

        {/* Vendor Expenses Paid */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Vendor Outflows (Cost)
          </span>
          <span className="text-xl font-black text-sky-400 font-mono block">
            ₹{stats.totalVendorPaid.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-rose-400 font-mono block">
            ₹{stats.vendorPayable.toLocaleString('en-IN')} payable to vendors
          </span>
        </div>

        {/* Realized Net Profit */}
        <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-4 space-y-1 bg-gradient-to-br from-slate-900 to-emerald-950/30">
          <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider block flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span>Realized Tour Profit</span>
          </span>
          <span className="text-xl font-black text-emerald-300 font-mono block">
            ₹{stats.completedProfit.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-emerald-400/90 font-medium block">
            From {stats.completedTripCount} completed tours
          </span>
        </div>

        {/* Sales Team 50% Profit Share */}
        <div className="bg-slate-900 border border-amber-500/40 rounded-xl p-4 space-y-1 bg-gradient-to-br from-slate-900 to-amber-950/30">
          <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider block flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>50% Sales Commission</span>
          </span>
          <span className="text-xl font-black text-amber-300 font-mono block">
            ₹{stats.totalCommissionsEarned.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-amber-200/90 font-medium block">
            Paid: ₹{stats.totalCommissionsPaid.toLocaleString('en-IN')} · Due: ₹{stats.totalCommissionsPending.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Agency Retained Profit */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Agency Retained Net
          </span>
          <span className="text-xl font-black text-white font-mono block">
            ₹{stats.agencyNetRetained.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-slate-500 block">
            50% company retained profit
          </span>
        </div>
      </div>

      {/* Main Tab Navigation Strip */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('all_trips')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'all_trips'
              ? 'bg-emerald-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>All Tour Balance Sheets ({filteredAccounts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sales_commissions')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'sales_commissions'
              ? 'bg-emerald-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Sales Team 50% Profit Ledger ({salesTeamReport.length} Executives)</span>
          {stats.totalCommissionsPending > 0 && (
            <span className="bg-amber-400 text-slate-950 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              ₹{stats.totalCommissionsPending.toLocaleString('en-IN')} Due
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: ALL TOUR BALANCE SHEETS TABLE */}
      {activeTab === 'all_trips' &&
        (accounts.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h2 className="text-lg font-black text-white">
                Ledger Cleared — Fresh Start Ready
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                All dummy accounts have been removed. You can now add real tour booking accounts, log advance client payments, track vendor costs, or convert leads with advance directly from the Lead CRM section.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  const newAcc: TripAccount = {
                    id: `acc-${Date.now()}`,
                    quoteNumber: `NED-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                    guestName: 'New Tour Booking',
                    guestPhone: '+91 ',
                    destination: 'Sikkim & Darjeeling',
                    salesPerson: 'Rohit Sharma',
                    tripStatus: 'upcoming',
                    sellingCost: 55000,
                    packageCost: 36000,
                    clientPayments: [],
                    vendorExpenses: [],
                    salesCommissionPercentage: 50,
                    salesCommissionPaid: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  };
                  onCreateAccount(newAcc);
                  setSelectedAccount(newAcc);
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold rounded-xl shadow-lg transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Add First Booking Account</span>
              </button>
              <button
                type="button"
                onClick={onResetToSampleAccounts}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-emerald-400" />
                <span>Restore Demo Sample Data</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by guest, quote #, phone, destination..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-2.5 flex-wrap text-xs">
              {/* Sales person */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px]">Sales Person:</span>
                <select
                  value={salesPersonFilter}
                  onChange={(e) => setSalesPersonFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                >
                  <option value="all">All Sales Executives</option>
                  {uniqueSalesPeople.map((person) => (
                    <option key={person} value={person}>
                      {person}
                    </option>
                  ))}
                </select>
              </div>

              {/* Trip Lifecycle */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px]">Trip Status:</span>
                <select
                  value={tripStatusFilter}
                  onChange={(e) => setTripStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                >
                  <option value="all">All Lifecycles</option>
                  <option value="completed">Completed Tours (Profit Active)</option>
                  <option value="in_progress">In Progress</option>
                  <option value="upcoming">Upcoming Tours</option>
                </select>
              </div>

              {/* Commission Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px]">Commission:</span>
                <select
                  value={commissionStatusFilter}
                  onChange={(e) => setCommissionStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                >
                  <option value="all">All Payout States</option>
                  <option value="due">50% Share Due for Payout</option>
                  <option value="paid">50% Share Paid</option>
                  <option value="pending">Trip Ongoing</option>
                </select>
              </div>

              {(searchTerm || salesPersonFilter !== 'all' || tripStatusFilter !== 'all' || commissionStatusFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSalesPersonFilter('all');
                    setTripStatusFilter('all');
                    setCommissionStatusFilter('all');
                  }}
                  className="text-xs text-slate-400 hover:text-white underline cursor-pointer ml-auto"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Booking / Guest</th>
                    <th className="py-3 px-3">Sales Person</th>
                    <th className="py-3 px-3">Lifecycle</th>
                    <th className="py-3 px-3 text-right">Selling Price</th>
                    <th className="py-3 px-3 text-right">Client Paid</th>
                    <th className="py-3 px-3 text-right">Vendor Cost</th>
                    <th className="py-3 px-3 text-right">Net Profit</th>
                    <th className="py-3 px-3 text-center">50% Profit Share</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {filteredAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-500">
                        No booking balance sheets found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredAccounts.map((acc) => {
                      const clientRec = (acc.clientPayments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
                      const clientDue = Math.max(0, acc.sellingCost - clientRec);

                      const vendorCost =
                        (acc.vendorExpenses || []).reduce((sum, v) => sum + (v.totalAgreedCost || 0), 0) || (acc.packageCost || 0);
                      const vendorPaid = (acc.vendorExpenses || []).reduce((sum, v) => sum + (v.amountPaid || 0), 0);

                      const profit = Math.max(0, acc.sellingCost - vendorCost);
                      const commission50 = Math.round(profit * 0.5);
                      const isCompleted = acc.tripStatus === 'completed';

                      return (
                        <tr
                          key={acc.id}
                          className="hover:bg-slate-800/50 transition-colors group cursor-pointer"
                          onClick={() => {
                            setSelectedAccount(acc);
                            setIsModalOpen(true);
                          }}
                        >
                          {/* Booking / Guest */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white text-xs">{acc.guestName}</div>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
                              <span className="text-emerald-400 font-semibold">{acc.quoteNumber}</span>
                              <span>·</span>
                              <span className="truncate max-w-[140px]">{acc.destination}</span>
                            </div>
                          </td>

                          {/* Sales Person */}
                          <td className="py-3.5 px-3">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-200 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded">
                              <Award className="w-3 h-3 text-emerald-400" />
                              <span>{acc.salesPerson}</span>
                            </span>
                          </td>

                          {/* Lifecycle Status */}
                          <td className="py-3.5 px-3">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                isCompleted
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : acc.tripStatus === 'in_progress'
                                  ? 'bg-sky-950 text-sky-400 border border-sky-800'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              {isCompleted ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>Completed</span>
                                </>
                              ) : acc.tripStatus === 'in_progress' ? (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
                                  <span>In Progress</span>
                                </>
                              ) : (
                                <span>Upcoming</span>
                              )}
                            </span>
                          </td>

                          {/* Selling Price */}
                          <td className="py-3.5 px-3 text-right font-mono font-bold text-white text-xs">
                            ₹{acc.sellingCost.toLocaleString('en-IN')}
                          </td>

                          {/* Client Paid */}
                          <td className="py-3.5 px-3 text-right font-mono text-xs">
                            <div className="text-emerald-400 font-semibold">
                              ₹{clientRec.toLocaleString('en-IN')}
                            </div>
                            {clientDue > 0 ? (
                              <div className="text-[10px] text-amber-400">
                                Due: ₹{clientDue.toLocaleString('en-IN')}
                              </div>
                            ) : (
                              <div className="text-[9px] text-emerald-500 font-sans">Paid in full</div>
                            )}
                          </td>

                          {/* Vendor Cost */}
                          <td className="py-3.5 px-3 text-right font-mono text-xs">
                            <div className="text-slate-300 font-semibold">
                              ₹{vendorCost.toLocaleString('en-IN')}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Paid: ₹{vendorPaid.toLocaleString('en-IN')}
                            </div>
                          </td>

                          {/* Net Profit */}
                          <td className="py-3.5 px-3 text-right font-mono text-xs">
                            <div className="text-emerald-400 font-bold">
                              ₹{profit.toLocaleString('en-IN')}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {acc.sellingCost > 0 ? `${Math.round((profit / acc.sellingCost) * 100)}% margin` : ''}
                            </div>
                          </td>

                          {/* 50% Profit Share */}
                          <td className="py-3.5 px-3 text-center">
                            <div className="font-mono font-bold text-xs text-white">
                              ₹{commission50.toLocaleString('en-IN')}
                            </div>
                            {isCompleted ? (
                              acc.salesCommissionPaid ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800">
                                  ✓ Paid ({acc.salesPerson.split(' ')[0]})
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuickPayCommission(acc);
                                  }}
                                  className="text-[9px] font-bold text-amber-300 bg-amber-950 hover:bg-amber-900 border border-amber-500/50 px-2 py-0.5 rounded transition-colors cursor-pointer mt-0.5"
                                  title="Click to mark 50% profit share paid"
                                >
                                  ★ Pay 50% Share
                                </button>
                              )
                            ) : (
                              <span className="text-[9px] text-slate-500 italic block mt-0.5">
                                Unlocks on trip end
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              {!isCompleted && (
                                <button
                                  type="button"
                                  onClick={() => handleQuickMarkCompleted(acc)}
                                  className="px-2 py-1 bg-slate-800 hover:bg-emerald-900/60 hover:text-emerald-300 text-slate-300 text-[10px] font-medium rounded transition-colors"
                                  title="Mark trip completed to calculate final profit & unlock 50% commission"
                                >
                                  Complete Trip
                                </button>
                              )}
                              {onViewVoucher && (
                                <button
                                  type="button"
                                  onClick={() => onViewVoucher(acc)}
                                  className="px-2 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 text-[10px] font-bold rounded transition-colors cursor-pointer"
                                  title="View & Download Official Booking Confirmation Voucher in PDF"
                                >
                                  Voucher (PDF)
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedAccount(acc);
                                  setIsModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-bold rounded transition-colors cursor-pointer"
                              >
                                Manage
                              </button>

                              <button
                                type="button"
                                onClick={() => setAccountToDelete(acc)}
                                className="p-1.5 bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 rounded transition-colors cursor-pointer"
                                title="Delete this booking balance sheet record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}

      {/* TAB 2: SALES TEAM 50% PROFIT SHARE LEDGER */}
      {activeTab === 'sales_commissions' && (
        <div className="space-y-6">
          {/* Header with Manage Team button */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Sales Team 50% Profit Disbursement & Ledger</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically calculates 50% commission for the assigned executive once the tour is marked completed.
              </p>
            </div>
            {onOpenManageSalesTeam && (
              <button
                type="button"
                onClick={onOpenManageSalesTeam}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-sm shrink-0"
              >
                <Users className="w-4 h-4" />
                <span>Manage Sales Team (Add / Edit / Delete)</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {salesTeamReport.map((rep) => (
              <div
                key={rep.salesPerson}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm"
              >
                {/* Rep Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                      {rep.salesPerson.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">{rep.salesPerson}</h3>
                      <span className="text-[11px] text-slate-400">
                        {rep.completedTrips} Completed / {rep.totalTrips} Total Bookings
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded">
                    50% Commission
                  </span>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase tracking-wider">
                      Revenue Generated
                    </span>
                    <span className="text-sm font-bold text-white font-mono block mt-0.5">
                      ₹{rep.totalSelling.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase tracking-wider">
                      Net Profit Generated
                    </span>
                    <span className="text-sm font-bold text-emerald-400 font-mono block mt-0.5">
                      ₹{rep.totalProfit.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* 50% Profit Share Box */}
                <div className="bg-emerald-950/40 border border-emerald-500/40 p-3.5 rounded-xl space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-bold text-emerald-300">
                      Total 50% Profit Share:
                    </span>
                    <span className="text-base font-black text-white font-mono">
                      ₹{rep.commissionEarned.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-emerald-900/30">
                    <span className="text-emerald-400">
                      Disbursed: <strong className="font-mono">₹{rep.commissionPaid.toLocaleString('en-IN')}</strong>
                    </span>
                    <span className="text-amber-300 font-semibold">
                      Pending Due: <strong className="font-mono">₹{rep.commissionPending.toLocaleString('en-IN')}</strong>
                    </span>
                  </div>
                </div>

                {/* Rep Tour Breakdown List */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                    Assigned Tours ({rep.tripList.length}):
                  </span>
                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                    {rep.tripList.map((trip) => {
                      const cost =
                        (trip.vendorExpenses || []).reduce((s, v) => s + (v.totalAgreedCost || 0), 0) || (trip.packageCost || 0);
                      const profit = Math.max(0, trip.sellingCost - cost);
                      const comm = Math.round(profit * 0.5);

                      return (
                        <div
                          key={trip.id}
                          onClick={() => {
                            setSelectedAccount(trip);
                            setIsModalOpen(true);
                          }}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80 hover:border-emerald-500/50 transition-colors cursor-pointer text-[11px]"
                        >
                          <div className="truncate mr-2">
                            <span className="font-semibold text-white block truncate">{trip.guestName}</span>
                            <span className="text-[10px] text-slate-400 truncate block">{trip.destination}</span>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-mono font-bold text-emerald-400 block">
                              +₹{comm.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[9px] text-slate-400">
                              {trip.tripStatus === 'completed'
                                ? trip.salesCommissionPaid
                                  ? 'Paid'
                                  : 'Due'
                                : 'Ongoing'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Account Details & Ledger Editor Modal */}
      {isModalOpen && selectedAccount && (
        <AccountLedgerModal
          isOpen={isModalOpen}
          account={selectedAccount}
          salesPersons={salesPersons}
          onQuickAddSalesPerson={onQuickAddSalesPerson}
          onOpenManageSalesTeam={onOpenManageSalesTeam}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedAccount(null);
          }}
          onSave={(updated) => {
            onUpdateAccount(updated);
            setSelectedAccount(updated);
          }}
          onDelete={(id) => {
            onDeleteAccount(id);
            setIsModalOpen(false);
            setSelectedAccount(null);
          }}
        />
      )}

      {/* Delete Single Account Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(accountToDelete)}
        title="Delete Booking Balance Sheet"
        message={
          accountToDelete
            ? `Are you sure you want to permanently delete the financial balance sheet for "${accountToDelete.guestName}" (Quote #${accountToDelete.quoteNumber})? All payment inflows, vendor outflows, and profit records for this tour will be removed.`
            : ''
        }
        confirmLabel="Yes, Delete Account"
        cancelLabel="Cancel"
        onConfirm={() => {
          if (accountToDelete) {
            onDeleteAccount(accountToDelete.id);
            setAccountToDelete(null);
          }
        }}
        onCancel={() => setAccountToDelete(null)}
      />

      {/* Clear All Dummy Accounts Confirmation Modal */}
      <ConfirmModal
        isOpen={isClearAllModalOpen}
        title="Start Fresh & Clear All Dummy Data"
        message={`Are you sure you want to remove all ${accounts.length} dummy/sample account balance sheets? This will reset the accounts ledger to a completely fresh state so you can start recording real booking financials without sample data cluttering your balance sheet. You can restore sample demo data at any time.`}
        confirmLabel="Yes, Clear All Dummy Data"
        cancelLabel="Cancel"
        onConfirm={() => {
          setIsClearAllModalOpen(false);
          onClearAllAccounts();
        }}
        onCancel={() => setIsClearAllModalOpen(false)}
      />
    </div>
  );
};
