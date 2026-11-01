import React, { useState } from 'react';
import { Award, Plus, Check, X, Users } from 'lucide-react';
import { SalesPerson } from '../../types';

interface SalesPersonSelectProps {
  value: string;
  onChange: (name: string) => void;
  salesPersons: SalesPerson[];
  onQuickAddSalesPerson?: (name: string) => void;
  onOpenManageTeam?: () => void;
  label?: string;
  className?: string;
  showManageButton?: boolean;
}

export const SalesPersonSelect: React.FC<SalesPersonSelectProps> = ({
  value,
  onChange,
  salesPersons,
  onQuickAddSalesPerson,
  onOpenManageTeam,
  label = 'Sales Person / Executive',
  className = '',
  showManageButton = true,
}) => {
  const [isQuickAdding, setIsQuickAdding] = useState(false);
  const [customName, setCustomName] = useState('');

  // Extract unique names list including currently selected value if not present
  const allNames = React.useMemo(() => {
    const names = new Set<string>();
    salesPersons.forEach((sp) => {
      if (sp.name) names.add(sp.name);
    });
    if (value && value.trim()) {
      names.add(value.trim());
    }
    return Array.from(names);
  }, [salesPersons, value]);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customName.trim();
    if (!trimmed) return;

    if (onQuickAddSalesPerson) {
      onQuickAddSalesPerson(trimmed);
    }
    onChange(trimmed);
    setCustomName('');
    setIsQuickAdding(false);
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-slate-300 text-xs font-semibold">
            {label}
          </label>
          {showManageButton && onOpenManageTeam && (
            <button
              type="button"
              onClick={onOpenManageTeam}
              className="text-[10px] text-emerald-400 hover:text-emerald-300 underline cursor-pointer flex items-center gap-0.5"
              title="Manage Sales Team (Add, Edit, Delete)"
            >
              <Users className="w-3 h-3" />
              <span>Manage Team</span>
            </button>
          )}
        </div>
      )}

      {isQuickAdding ? (
        <form onSubmit={handleQuickAdd} className="flex items-center gap-1.5 animate-fade-in">
          <input
            type="text"
            autoFocus
            required
            placeholder="Type new executive name..."
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            className="flex-1 bg-slate-950 border border-emerald-500 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            className="p-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg transition-colors cursor-pointer"
            title="Save and select custom name"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </button>
          <button
            type="button"
            onClick={() => setIsQuickAdding(false)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            title="Cancel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </form>
      ) : (
        <div className="flex items-center gap-1.5">
          <select
            value={value}
            onChange={(e) => {
              if (e.target.value === '__ADD_NEW__') {
                setIsQuickAdding(true);
              } else {
                onChange(e.target.value);
              }
            }}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            {allNames.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
            <option value="__ADD_NEW__" className="text-emerald-400 font-bold">
              + Add Custom Sales Person...
            </option>
          </select>

          <button
            type="button"
            onClick={() => setIsQuickAdding(true)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border border-slate-700 rounded-lg transition-colors cursor-pointer shrink-0"
            title="Add Custom Sales Person Name"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
