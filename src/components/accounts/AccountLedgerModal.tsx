import React, { useState, useEffect } from 'react';
import {
  X,
  DollarSign,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Lock,
  Award,
  Calendar,
  Building,
  Car,
  FileText,
  CreditCard,
  Printer,
  ChevronRight,
  TrendingUp,
  Percent,
} from 'lucide-react';
import { ClientPayment, SalesPerson, TripAccount, TripStatus, VendorExpense } from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';
import { SalesPersonSelect } from '../common/SalesPersonSelect';

interface AccountLedgerModalProps {
  isOpen: boolean;
  account: TripAccount | null;
  onClose: () => void;
  onSave: (updatedAccount: TripAccount) => void;
  onDelete?: (accountId: string) => void;
  salesPersons?: SalesPerson[];
  onQuickAddSalesPerson?: (name: string) => void;
  onOpenManageSalesTeam?: () => void;
}

export const AccountLedgerModal: React.FC<AccountLedgerModalProps> = ({
  isOpen,
  account,
  onClose,
  onSave,
  onDelete,
  salesPersons = [],
  onQuickAddSalesPerson,
  onOpenManageSalesTeam,
}) => {
  if (!isOpen || !account) return null;

  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  // Local state for editing
  const [sellingCost, setSellingCost] = useState<number>(account.sellingCost || 0);
  const [packageCost, setPackageCost] = useState<number>(account.packageCost || 0);
  const [salesPerson, setSalesPerson] = useState<string>(account.salesPerson || 'Rohit Sharma');
  const [tripStatus, setTripStatus] = useState<TripStatus>(account.tripStatus || 'upcoming');
  const [tripCompletedDate, setTripCompletedDate] = useState<string>(
    account.tripCompletedDate || (account.tripStatus === 'completed' ? new Date().toISOString().split('T')[0] : '')
  );

  // Inflows & Outflows
  const [clientPayments, setClientPayments] = useState<ClientPayment[]>(account.clientPayments || []);
  const [vendorExpenses, setVendorExpenses] = useState<VendorExpense[]>(account.vendorExpenses || []);

  // Commission payout fields
  const [commissionPaid, setCommissionPaid] = useState<boolean>(account.salesCommissionPaid || false);
  const [commissionPaidDate, setCommissionPaidDate] = useState<string>(
    account.salesCommissionPaidDate || new Date().toISOString().split('T')[0]
  );
  const [commissionRef, setCommissionRef] = useState<string>(account.salesCommissionRef || '');
  const [commissionNotes, setCommissionNotes] = useState<string>(account.salesCommissionNotes || '');

  // Form states for adding items
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newPayDate, setNewPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [newPayAmount, setNewPayAmount] = useState<number | ''>('');
  const [newPayMode, setNewPayMode] = useState<ClientPayment['paymentMode']>('upi');
  const [newPayRef, setNewPayRef] = useState('');
  const [newPayNotes, setNewPayNotes] = useState('');

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpDate, setNewExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [newExpCategory, setNewExpCategory] = useState<VendorExpense['category']>('hotel');
  const [newExpVendor, setNewExpVendor] = useState('');
  const [newExpAgreed, setNewExpAgreed] = useState<number | ''>('');
  const [newExpPaid, setNewExpPaid] = useState<number | ''>('');
  const [newExpMode, setNewExpMode] = useState<VendorExpense['paymentMode']>('bank_transfer');
  const [newExpRef, setNewExpRef] = useState('');
  const [newExpNotes, setNewExpNotes] = useState('');

  // Sync state on account change
  useEffect(() => {
    if (account) {
      setSellingCost(account.sellingCost || 0);
      setPackageCost(account.packageCost || 0);
      setSalesPerson(account.salesPerson || 'Rohit Sharma');
      setTripStatus(account.tripStatus || 'upcoming');
      setTripCompletedDate(
        account.tripCompletedDate ||
          (account.tripStatus === 'completed' ? new Date().toISOString().split('T')[0] : '')
      );
      setClientPayments(account.clientPayments || []);
      setVendorExpenses(account.vendorExpenses || []);
      setCommissionPaid(account.salesCommissionPaid || false);
      setCommissionPaidDate(
        account.salesCommissionPaidDate || new Date().toISOString().split('T')[0]
      );
      setCommissionRef(account.salesCommissionRef || '');
      setCommissionNotes(account.salesCommissionNotes || '');
    }
  }, [account]);

  // Derived financial metrics
  const totalClientReceived = clientPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const clientBalanceDue = Math.max(0, sellingCost - totalClientReceived);

  const totalVendorAgreed = vendorExpenses.reduce((acc, v) => acc + (v.totalAgreedCost || 0), 0);
  const totalVendorPaid = vendorExpenses.reduce((acc, v) => acc + (v.amountPaid || 0), 0);
  const vendorBalancePayable = Math.max(0, totalVendorAgreed - totalVendorPaid);

  // Effective vendor expense used for net profit:
  // If vendor expenses are recorded, use their total; otherwise fallback to estimated base packageCost
  const effectiveCost = totalVendorAgreed > 0 ? totalVendorAgreed : packageCost;
  const netProfit = Math.max(0, sellingCost - effectiveCost);
  const profitMargin = sellingCost > 0 ? Math.round((netProfit / sellingCost) * 100) : 0;

  // 50% Profit Share Rule
  const salesCommissionDue = Math.round(netProfit * 0.5);
  const agencyNetProfit = netProfit - salesCommissionDue;

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPayAmount || Number(newPayAmount) <= 0) return;

    const payment: ClientPayment = {
      id: `cp-${Date.now()}`,
      date: newPayDate,
      amount: Number(newPayAmount),
      paymentMode: newPayMode,
      referenceNumber: newPayRef.trim() || undefined,
      notes: newPayNotes.trim() || undefined,
      recordedBy: salesPerson,
    };

    setClientPayments([payment, ...clientPayments]);
    setNewPayAmount('');
    setNewPayRef('');
    setNewPayNotes('');
    setShowAddPayment(false);
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpVendor.trim()) return;
    const agreed = Number(newExpAgreed) || 0;
    const paid = Number(newExpPaid) || 0;

    const expense: VendorExpense = {
      id: `ve-${Date.now()}`,
      date: newExpDate,
      category: newExpCategory,
      vendorName: newExpVendor.trim(),
      totalAgreedCost: agreed || paid,
      amountPaid: paid,
      paymentMode: newExpMode,
      referenceNumber: newExpRef.trim() || undefined,
      notes: newExpNotes.trim() || undefined,
      status: paid >= agreed && agreed > 0 ? 'paid' : paid > 0 ? 'partial' : 'pending',
    };

    setVendorExpenses([expense, ...vendorExpenses]);
    setNewExpVendor('');
    setNewExpAgreed('');
    setNewExpPaid('');
    setNewExpRef('');
    setNewExpNotes('');
    setShowAddExpense(false);
  };

  const handleSaveAll = () => {
    const updated: TripAccount = {
      ...account,
      salesPerson,
      sellingCost,
      packageCost,
      tripStatus,
      tripCompletedDate: tripStatus === 'completed' ? tripCompletedDate || new Date().toISOString().split('T')[0] : undefined,
      clientPayments,
      vendorExpenses,
      salesCommissionPercentage: 50,
      salesCommissionPaid: commissionPaid,
      salesCommissionPaidDate: commissionPaid ? commissionPaidDate : undefined,
      salesCommissionRef: commissionPaid ? commissionRef : undefined,
      salesCommissionNotes: commissionPaid ? commissionNotes : undefined,
      updatedAt: new Date().toISOString(),
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full my-6 p-6 space-y-6 shadow-2xl max-h-[92vh] flex flex-col text-slate-100">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded">
                Quote #{account.quoteNumber}
              </span>
              <span className="text-sm font-bold text-white">{account.guestName}</span>
              <span className="text-xs text-slate-400">· {account.destination}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
              <span>Phone: <strong className="text-slate-200 font-mono">{account.guestPhone}</strong></span>
              <span>Travel: <strong className="text-slate-200">{account.travelDates || 'Dates Flexible'}</strong></span>
              <span>Executive: <strong className="text-emerald-300">{salesPerson}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              title="Print internal balance sheet voucher"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>Print Balance Sheet</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {/* SECTION 1: CONFIDENTIAL PRICING & 50% PROFIT CALCULATOR */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Confidential Financials & Profit Calculator</span>
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Package buying costs and profit margins are strictly internal and NEVER visible to the client.
                </p>
              </div>

              {/* Trip Lifecycle Status */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Trip Lifecycle:</span>
                <select
                  value={tripStatus}
                  onChange={(e) => {
                    const st = e.target.value as TripStatus;
                    setTripStatus(st);
                    if (st === 'completed' && !tripCompletedDate) {
                      setTripCompletedDate(new Date().toISOString().split('T')[0]);
                    }
                  }}
                  className={`text-xs font-bold rounded-lg px-3 py-1.5 border transition-colors cursor-pointer ${
                    tripStatus === 'completed'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/60'
                      : tripStatus === 'in_progress'
                      ? 'bg-sky-950 text-sky-300 border-sky-500/60'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  <option value="upcoming">Upcoming Tour</option>
                  <option value="in_progress">In Progress (Tour Running)</option>
                  <option value="completed">Trip Completed (50% Profit Active)</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Price Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">
                  Selling Cost (Client Price) (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={sellingCost}
                  onChange={(e) => setSellingCost(Number(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-sm font-bold"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Amount billed to guest
                </span>
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">
                  Package Cost (Base Buying) (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={packageCost}
                  onChange={(e) => setPackageCost(Number(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-sm font-bold"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Initial vendor budget
                </span>
              </div>

              <div>
                <SalesPersonSelect
                  value={salesPerson}
                  onChange={setSalesPerson}
                  salesPersons={salesPersons}
                  onQuickAddSalesPerson={onQuickAddSalesPerson}
                  onOpenManageTeam={onOpenManageSalesTeam}
                  label="Sales Person Assigned"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Entitled to 50% profit share
                </span>
              </div>

              {tripStatus === 'completed' && (
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">
                    Trip Completion Date
                  </label>
                  <input
                    type="date"
                    value={tripCompletedDate}
                    onChange={(e) => setTripCompletedDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs font-mono"
                  />
                  <span className="text-[10px] text-emerald-400 mt-0.5 block">
                    Profit calculation locked
                  </span>
                </div>
              )}
            </div>

            {/* LIVE PROFIT & 50% SALES COMMISSION RESULT BOX */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Total Client Selling
                </span>
                <span className="text-lg font-black text-white font-mono">
                  ₹{sellingCost.toLocaleString('en-IN')}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Actual Vendor Cost
                </span>
                <span className="text-lg font-black text-slate-300 font-mono">
                  ₹{effectiveCost.toLocaleString('en-IN')}
                </span>
                {totalVendorAgreed > 0 && (
                  <span className="text-[9px] text-slate-500 block">From {vendorExpenses.length} vendor items</span>
                )}
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Total Net Profit ({profitMargin}%)
                </span>
                <span className="text-lg font-black text-emerald-400 font-mono">
                  ₹{netProfit.toLocaleString('en-IN')}
                </span>
              </div>

              {/* 50% Sales Executive Commission Box */}
              <div className="bg-emerald-950/70 border border-emerald-500/50 p-2.5 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-emerald-300 block tracking-wider flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  <span>50% to {salesPerson.split(' ')[0]}</span>
                </span>
                <span className="text-lg font-black text-white font-mono block">
                  ₹{salesCommissionDue.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-emerald-400 font-medium block">
                  {tripStatus === 'completed'
                    ? commissionPaid
                      ? '✓ Paid to Executive'
                      : '★ Ready for Payout'
                    : 'Pending Trip Completion'}
                </span>
              </div>
            </div>

            {/* Commission Payout Form if Trip Completed */}
            {tripStatus === 'completed' && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-400" />
                    <span>Sales Commission Payout Record (50% Share = ₹{salesCommissionDue.toLocaleString('en-IN')})</span>
                  </span>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-emerald-400">
                    <input
                      type="checkbox"
                      checked={commissionPaid}
                      onChange={(e) => setCommissionPaid(e.target.checked)}
                      className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                    />
                    <span>Mark as Paid to {salesPerson}</span>
                  </label>
                </div>

                {commissionPaid && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800 text-xs animate-fade-in">
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">Payout Date</label>
                      <input
                        type="date"
                        value={commissionPaidDate}
                        onChange={(e) => setCommissionPaidDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">Transaction Ref / UTR</label>
                      <input
                        type="text"
                        placeholder="UPI / NEFT ref number"
                        value={commissionRef}
                        onChange={(e) => setCommissionRef(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">Payout Remarks</label>
                      <input
                        type="text"
                        placeholder="e.g. Transferred 50% incentive via GPay"
                        value={commissionNotes}
                        onChange={(e) => setCommissionNotes(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION 2: CLIENT PAYMENTS (INFLOWS) */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>Client Payments Received (Inflow)</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Total Received: <strong className="text-emerald-400 font-mono">₹{totalClientReceived.toLocaleString('en-IN')}</strong> · Balance Due: <strong className="text-amber-400 font-mono">₹{clientBalanceDue.toLocaleString('en-IN')}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddPayment(!showAddPayment)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Record Payment</span>
              </button>
            </div>

            {/* Add payment form */}
            {showAddPayment && (
              <form onSubmit={handleAddPayment} className="bg-slate-900 border border-emerald-500/40 rounded-xl p-4 space-y-3 animate-fade-in">
                <span className="text-xs font-bold text-emerald-300 block">Record New Client Inflow</span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Payment Date</label>
                    <input
                      type="date"
                      required
                      value={newPayDate}
                      onChange={(e) => setNewPayDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Amount (₹)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 20000"
                      value={newPayAmount}
                      onChange={(e) => setNewPayAmount(e.target.value ? Number(e.target.value) : '')}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Payment Mode</label>
                    <select
                      value={newPayMode}
                      onChange={(e) => setNewPayMode(e.target.value as ClientPayment['paymentMode'])}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                    >
                      <option value="upi">UPI (GPay/PhonePe/Paytm)</option>
                      <option value="net_banking">Net Banking / NEFT / IMPS</option>
                      <option value="cash">Cash Payment</option>
                      <option value="credit_card">Card Payment</option>
                      <option value="cheque">Cheque</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Transaction Ref / UTR</label>
                    <input
                      type="text"
                      placeholder="e.g. UPI/920192839120"
                      value={newPayRef}
                      onChange={(e) => setNewPayRef(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 text-xs mb-1">Payment Notes / Description</label>
                  <input
                    type="text"
                    placeholder="e.g. 30% Token advance deposit to confirm hotel rooms"
                    value={newPayNotes}
                    onChange={(e) => setNewPayNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddPayment(false)}
                    className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg"
                  >
                    Save Payment
                  </button>
                </div>
              </form>
            )}

            {/* List of payments */}
            <div className="space-y-2">
              {clientPayments.length === 0 ? (
                <div className="text-center py-5 text-slate-500 text-xs">
                  No client payments recorded yet. Click "+ Record Payment" to log inflows.
                </div>
              ) : (
                clientPayments.map((p) => (
                  <div
                    key={p.id}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                        ₹
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white font-mono">
                            ₹{p.amount.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                            {p.paymentMode.replace('_', ' ')}
                          </span>
                          {p.referenceNumber && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              Ref: {p.referenceNumber}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {p.notes || 'Client Payment Received'} · Recorded by {p.recordedBy || salesPerson} on {p.date}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setClientPayments(clientPayments.filter((item) => item.id !== p.id))}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Remove this payment entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SECTION 3: VENDOR EXPENSES & SUPPLIERS (OUTFLOWS) */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-sky-400" />
                  <span>Vendor & Supplier Payments (Outflow Breakdown)</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Total Agreed: <strong className="text-slate-300 font-mono">₹{totalVendorAgreed.toLocaleString('en-IN')}</strong> · Paid to Date: <strong className="text-emerald-400 font-mono">₹{totalVendorPaid.toLocaleString('en-IN')}</strong> · Due to Vendors: <strong className="text-rose-400 font-mono">₹{vendorBalancePayable.toLocaleString('en-IN')}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddExpense(!showAddExpense)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Record Vendor Cost</span>
              </button>
            </div>

            {/* Add expense form */}
            {showAddExpense && (
              <form onSubmit={handleAddExpense} className="bg-slate-900 border border-sky-500/40 rounded-xl p-4 space-y-3 animate-fade-in">
                <span className="text-xs font-bold text-sky-300 block">Record Vendor / Supplier Cost</span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Expense Category</label>
                    <select
                      value={newExpCategory}
                      onChange={(e) => setNewExpCategory(e.target.value as VendorExpense['category'])}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                    >
                      <option value="hotel">Hotel / Homestay</option>
                      <option value="cab_driver">Cab / Driver / Fuel</option>
                      <option value="permits">Permits / Checkposts</option>
                      <option value="activity_entry">Sightseeing / Activity Pass</option>
                      <option value="guide">Guide Fees</option>
                      <option value="train_flight">Flights / Rail Tickets</option>
                      <option value="other">Other Operations</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Vendor / Provider Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Hotel Mayur Gangtok / Karma Driver"
                      value={newExpVendor}
                      onChange={(e) => setNewExpVendor(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Total Agreed Cost (₹)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Total quote"
                      value={newExpAgreed}
                      onChange={(e) => setNewExpAgreed(e.target.value ? Number(e.target.value) : '')}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Amount Paid (₹)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Amount paid"
                      value={newExpPaid}
                      onChange={(e) => setNewExpPaid(e.target.value ? Number(e.target.value) : '')}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Payment Date</label>
                    <input
                      type="date"
                      value={newExpDate}
                      onChange={(e) => setNewExpDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Payment Mode</label>
                    <select
                      value={newExpMode}
                      onChange={(e) => setNewExpMode(e.target.value as VendorExpense['paymentMode'])}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                    >
                      <option value="bank_transfer">Bank Transfer (IMPS/NEFT)</option>
                      <option value="upi">UPI Transfer</option>
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Ref / Voucher Number</label>
                    <input
                      type="text"
                      placeholder="e.g. UTR/982019 or Voucher #8"
                      value={newExpRef}
                      onChange={(e) => setNewExpRef(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddExpense(false)}
                    className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-lg"
                  >
                    Save Vendor Cost
                  </button>
                </div>
              </form>
            )}

            {/* List of expenses */}
            <div className="space-y-2">
              {vendorExpenses.length === 0 ? (
                <div className="text-center py-5 text-slate-500 text-xs">
                  No vendor items recorded. Using baseline package cost estimate (₹{packageCost.toLocaleString('en-IN')}).
                </div>
              ) : (
                vendorExpenses.map((v) => (
                  <div
                    key={v.id}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                        {v.category === 'hotel' ? (
                          <Building className="w-4 h-4" />
                        ) : v.category === 'cab_driver' ? (
                          <Car className="w-4 h-4" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{v.vendorName}</span>
                          <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                            {v.category.replace('_', ' ')}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              v.status === 'paid'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-amber-950 text-amber-400 border border-amber-800'
                            }`}
                          >
                            {v.status === 'paid' ? 'Paid in Full' : 'Partial / Balance Due'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                          <span>
                            Paid: <strong className="text-white font-mono">₹{v.amountPaid.toLocaleString('en-IN')}</strong> / Agreed: <strong className="text-slate-300 font-mono">₹{v.totalAgreedCost.toLocaleString('en-IN')}</strong>
                          </span>
                          {v.referenceNumber && <span>Ref: {v.referenceNumber}</span>}
                          <span>({v.date})</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setVendorExpenses(vendorExpenses.filter((item) => item.id !== v.id))}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Remove this expense entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          {onDelete ? (
            <button
              type="button"
              onClick={() => setIsConfirmDeleteOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/60 rounded-lg transition-colors cursor-pointer w-full sm:w-auto justify-center"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete This Account</span>
            </button>
          ) : (
            <div></div>
          )}

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              className="inline-flex items-center gap-1.5 px-6 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[3]" />
              <span>Save Balance Sheet Changes</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        title="Delete Booking Balance Sheet"
        message={`Are you sure you want to permanently delete the financial balance sheet for "${account.guestName}" (Quote #${account.quoteNumber})? All payment inflows, vendor outflows, and profit records for this tour will be removed.`}
        confirmLabel="Yes, Delete Account"
        cancelLabel="Cancel"
        onConfirm={() => {
          setIsConfirmDeleteOpen(false);
          onDelete?.(account.id);
          onClose();
        }}
        onCancel={() => setIsConfirmDeleteOpen(false)}
      />
    </div>
  );
};
