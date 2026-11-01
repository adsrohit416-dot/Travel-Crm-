import React, { useState } from 'react';
import {
  X,
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Award,
  Phone,
  Mail,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Plus,
  Check,
  Search,
} from 'lucide-react';
import { SalesPerson, TripAccount } from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';

interface SalesTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  salesPersons: SalesPerson[];
  onAddSalesPerson: (person: SalesPerson) => void;
  onUpdateSalesPerson: (person: SalesPerson) => void;
  onDeleteSalesPerson: (id: string) => void;
  accounts?: TripAccount[];
}

export const SalesTeamModal: React.FC<SalesTeamModalProps> = ({
  isOpen,
  onClose,
  salesPersons,
  onAddSalesPerson,
  onUpdateSalesPerson,
  onDeleteSalesPerson,
  accounts = [],
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingPerson, setEditingPerson] = useState<SalesPerson | null>(null);
  const [personToDelete, setPersonToDelete] = useState<SalesPerson | null>(null);

  // Form states for Add / Edit
  const [name, setName] = useState('');
  const [role, setRole] = useState('Tour Consultant');
  const [phone, setPhone] = useState('+91 ');
  const [email, setEmail] = useState('');
  const [upiId, setUpiId] = useState('');
  const [commissionPercentage, setCommissionPercentage] = useState(50);
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setRole('Tour Consultant');
    setPhone('+91 ');
    setEmail('');
    setUpiId('');
    setCommissionPercentage(50);
    setNotes('');
    setIsActive(true);
    setFormError(null);
    setIsAdding(false);
    setEditingPerson(null);
  };

  const handleStartAdd = () => {
    resetForm();
    setIsAdding(true);
  };

  const handleStartEdit = (person: SalesPerson) => {
    setName(person.name);
    setRole(person.role || 'Tour Consultant');
    setPhone(person.phone || '+91 ');
    setEmail(person.email || '');
    setUpiId(person.upiId || '');
    setCommissionPercentage(person.commissionPercentage ?? 50);
    setNotes(person.notes || '');
    setIsActive(person.isActive ?? true);
    setFormError(null);
    setEditingPerson(person);
    setIsAdding(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Sales person name is required.');
      return;
    }

    // Check duplicate name
    const isDuplicate = salesPersons.some(
      (p) =>
        p.name.trim().toLowerCase() === name.trim().toLowerCase() &&
        (!editingPerson || p.id !== editingPerson.id)
    );
    if (isDuplicate) {
      setFormError(`A sales executive named "${name.trim()}" already exists.`);
      return;
    }

    if (editingPerson) {
      const updated: SalesPerson = {
        ...editingPerson,
        name: name.trim(),
        role: role.trim() || 'Tour Consultant',
        phone: phone.trim(),
        email: email.trim(),
        upiId: upiId.trim(),
        commissionPercentage: Number(commissionPercentage) || 50,
        notes: notes.trim(),
        isActive,
        updatedAt: new Date().toISOString(),
      };
      onUpdateSalesPerson(updated);
    } else {
      const newPerson: SalesPerson = {
        id: `sp-${Date.now()}`,
        name: name.trim(),
        role: role.trim() || 'Tour Consultant',
        phone: phone.trim(),
        email: email.trim(),
        upiId: upiId.trim(),
        commissionPercentage: Number(commissionPercentage) || 50,
        notes: notes.trim(),
        isActive,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onAddSalesPerson(newPerson);
    }

    resetForm();
  };

  // Filtered persons
  const filtered = salesPersons.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.role && p.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.phone && p.phone.includes(searchTerm)) ||
      (p.upiId && p.upiId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full text-slate-100 shadow-2xl overflow-hidden my-8 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Award className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <span>Sales Team & Profit Share Management</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950 border border-emerald-500/40 px-2 py-0.5 rounded">
                  {salesPersons.length} Executives
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Add, update, or remove custom sales persons. Added names will appear across CRM Leads, Quotes, and 50% Profit Balance Sheets.
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Controls: Search & Add button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search sales executives by name, role, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {!isAdding && !editingPerson && (
              <button
                type="button"
                onClick={handleStartAdd}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer justify-center"
              >
                <UserPlus className="w-4 h-4 stroke-[2.5]" />
                <span>+ Add New Sales Executive</span>
              </button>
            )}
          </div>

          {/* Add / Edit Form Panel */}
          {(isAdding || editingPerson) && (
            <form
              onSubmit={handleSave}
              className="bg-slate-950 border border-emerald-500/40 rounded-xl p-5 space-y-4 shadow-lg animate-fade-in"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span>{editingPerson ? `Edit Sales Person: ${editingPerson.name}` : 'Add New Custom Sales Person'}</span>
                </span>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {formError && (
                <div className="p-2.5 bg-rose-950/80 border border-rose-800 rounded-lg text-rose-300 text-xs font-semibold">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Suresh Thapa or Rinchen Bhutia"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Role / Designation */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Designation / Specialization
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Tour Consultant, Sikkim Desk"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98320 00000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="executive@northeastdestinations.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* UPI ID for Profit Disbursement */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    UPI ID for 50% Profit Share Disbursement
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. name@okhdfcbank or 9832000000@paytm"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-emerald-400 text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Used for 1-click commission disbursement after tour completion
                  </span>
                </div>

                {/* Commission % & Active status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Profit Share (%)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={commissionPercentage}
                      onChange={(e) => setCommissionPercentage(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-amber-300 font-mono font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Status
                    </label>
                    <select
                      value={isActive ? 'active' : 'inactive'}
                      onChange={(e) => setIsActive(e.target.value === 'active')}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white text-xs"
                    >
                      <option value="active">Active in Rotation</option>
                      <option value="inactive">Inactive / On Leave</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{editingPerson ? 'Save Changes' : 'Add Sales Person'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Sales Team List */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Registered Sales Executives ({filtered.length})
            </span>

            {filtered.length === 0 ? (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
                <Users className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p className="text-xs font-medium text-slate-400">No sales executives found</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Click the "+ Add New Sales Executive" button above to add custom team members.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filtered.map((person) => {
                  const assignedCount = accounts.filter(
                    (a) => a.salesPerson?.toLowerCase() === person.name.toLowerCase()
                  ).length;

                  return (
                    <div
                      key={person.id}
                      className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-4 space-y-3 transition-colors shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                            {person.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-white text-xs truncate flex items-center gap-2">
                              <span>{person.name}</span>
                              {person.isActive ? (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Active"></span>
                              ) : (
                                <span className="text-[9px] text-slate-500 bg-slate-800 px-1.5 py-0.2 rounded">Inactive</span>
                              )}
                            </h3>
                            <p className="text-[11px] text-slate-400 truncate">
                              {person.role || 'Tour Consultant'}
                            </p>
                          </div>
                        </div>

                        {/* Edit & Delete Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(person)}
                            className="p-1.5 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                            title="Edit sales person details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPersonToDelete(person)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-900 hover:bg-rose-950 rounded-md transition-colors cursor-pointer"
                            title="Delete sales person"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Contact & Payment Info */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                        <div className="truncate">
                          <span className="text-slate-500 block text-[9px] uppercase font-bold tracking-wider">Phone</span>
                          <span className="font-mono text-slate-300 truncate block">{person.phone || 'Not set'}</span>
                        </div>
                        <div className="truncate">
                          <span className="text-slate-500 block text-[9px] uppercase font-bold tracking-wider">UPI / Share</span>
                          <span className="font-mono text-emerald-400 truncate block">
                            {person.upiId || 'No UPI ID'}
                          </span>
                        </div>
                      </div>

                      {/* Linked Bookings Badge */}
                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="text-slate-400">
                          {assignedCount} Linked {assignedCount === 1 ? 'Booking' : 'Bookings'}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
                          {person.commissionPercentage ?? 50}% Profit Share
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>Active sales persons are available in all quote & booking forms.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(personToDelete)}
        title="Delete Sales Person"
        message={
          personToDelete
            ? `Are you sure you want to remove "${personToDelete.name}" from your sales team? Any existing leads or bookings linked to them will remain in your system, but they will no longer appear in new dropdowns.`
            : ''
        }
        confirmLabel="Yes, Delete Executive"
        cancelLabel="Cancel"
        onConfirm={() => {
          if (personToDelete) {
            onDeleteSalesPerson(personToDelete.id);
            setPersonToDelete(null);
          }
        }}
        onCancel={() => setPersonToDelete(null)}
      />
    </div>
  );
};
