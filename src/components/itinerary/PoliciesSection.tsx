import React, { useState } from 'react';
import {
  FileText,
  CheckCircle,
  ShieldAlert,
  Trash2,
  CreditCard,
  Upload,
  ExternalLink,
  QrCode,
} from 'lucide-react';
import { CompanyProfile } from '../../types';
import {
  defaultSpecialAdvisories,
  defaultTermsAndConditions,
  defaultCancellationRefundPolicy,
  getDestinationCategory,
  getDestinationCategoryName,
  getDestinationNotesTitle,
  getDestinationTermsTitle,
  getDestinationSpecialAdvisories,
  getDestinationTermsAndConditions,
  getDestinationCancellationPolicy,
  getDestinationQuickAddNotes,
} from '../../data/defaultTemplates';

interface PoliciesSectionProps {
  destination?: string;
  title?: string;
  commonInclusions: string[];
  setCommonInclusions: React.Dispatch<React.SetStateAction<string[]>>;
  commonExclusions: string[];
  setCommonExclusions: React.Dispatch<React.SetStateAction<string[]>>;
  termsAndConditions: string[];
  setTermsAndConditions: React.Dispatch<React.SetStateAction<string[]>>;
  specialAdvisories: string[];
  setSpecialAdvisories: React.Dispatch<React.SetStateAction<string[]>>;
  cancellationRefundPolicy: string[];
  setCancellationRefundPolicy: React.Dispatch<React.SetStateAction<string[]>>;
  companyProfile: CompanyProfile;
  qrInputRef: React.RefObject<HTMLInputElement | null>;
  handleQrUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenSettings?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  isFullView?: boolean;
}

export const PoliciesSection: React.FC<PoliciesSectionProps> = ({
  destination = '',
  title = '',
  commonInclusions,
  setCommonInclusions,
  commonExclusions,
  setCommonExclusions,
  termsAndConditions,
  setTermsAndConditions,
  specialAdvisories,
  setSpecialAdvisories,
  cancellationRefundPolicy,
  setCancellationRefundPolicy,
  companyProfile,
  qrInputRef,
  handleQrUpload,
  onOpenSettings,
  onPrev,
  onNext,
  isFullView = false,
}) => {
  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');
  const [newRefundClause, setNewRefundClause] = useState('');
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const destCategory = getDestinationCategory(destination, title);
  const destCategoryName = getDestinationCategoryName(destination, title);

  const handleSyncAllDestinationPolicies = () => {
    setSpecialAdvisories(getDestinationSpecialAdvisories(destination, title));
    setTermsAndConditions(getDestinationTermsAndConditions(destination, title));
    setCancellationRefundPolicy(getDestinationCancellationPolicy(destination, title));
    setSyncNotice(`✓ Policies synced to ${destCategoryName}`);
    setTimeout(() => setSyncNotice(null), 3500);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 md:p-10 space-y-8 shadow-xl">
      {/* Section 4 Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold font-mono">
            4
          </span>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                Step 4 of 4
              </span>
            </div>
            <h3 className="font-bold text-white text-xl sm:text-2xl flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-emerald-400" />
              <span>4. Policies, Terms & Conditions, and Refund Policy</span>
            </h3>
            <p className="text-sm text-slate-400 mt-0.5">
              Package inclusions, exclusions, Northeast tour terms, comprehensive cancellation & refund policy, and bank QR details
            </p>
          </div>
        </div>
      </div>

      {/* Inclusions & Exclusions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inclusions */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <h4 className="font-bold text-white text-base sm:text-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span>Package Inclusions ({commonInclusions.length})</span>
          </h4>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {commonInclusions.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 p-3 bg-slate-900 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors"
              >
                <span className="text-slate-200 text-sm leading-relaxed">{item}</span>
                <button
                  type="button"
                  onClick={() =>
                    setCommonInclusions(commonInclusions.filter((_, i) => i !== idx))
                  }
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Remove inclusion"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2.5 pt-2">
            <input
              type="text"
              placeholder="Add custom inclusion item..."
              value={newInclusion}
              onChange={(e) => setNewInclusion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newInclusion.trim()) {
                  e.preventDefault();
                  setCommonInclusions([...commonInclusions, newInclusion.trim()]);
                  setNewInclusion('');
                }
              }}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={() => {
                if (newInclusion.trim()) {
                  setCommonInclusions([...commonInclusions, newInclusion.trim()]);
                  setNewInclusion('');
                }
              }}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm cursor-pointer shadow-sm transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Exclusions */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <h4 className="font-bold text-white text-base sm:text-lg flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <span>Package Exclusions ({commonExclusions.length})</span>
          </h4>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {commonExclusions.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 p-3 bg-slate-900 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors"
              >
                <span className="text-slate-200 text-sm leading-relaxed">{item}</span>
                <button
                  type="button"
                  onClick={() =>
                    setCommonExclusions(commonExclusions.filter((_, i) => i !== idx))
                  }
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Remove exclusion"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2.5 pt-2">
            <input
              type="text"
              placeholder="Add custom exclusion item..."
              value={newExclusion}
              onChange={(e) => setNewExclusion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newExclusion.trim()) {
                  e.preventDefault();
                  setCommonExclusions([...commonExclusions, newExclusion.trim()]);
                  setNewExclusion('');
                }
              }}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-rose-500"
            />
            <button
              type="button"
              onClick={() => {
                if (newExclusion.trim()) {
                  setCommonExclusions([...commonExclusions, newExclusion.trim()]);
                  setNewExclusion('');
                }
              }}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-sm cursor-pointer shadow-sm transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* DEDICATED CANCELLATION & REFUND POLICY SECTION */}
      <div className="bg-slate-950 border border-rose-500/40 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <div>
              <h4 className="font-bold text-white text-base sm:text-lg flex items-center gap-2">
                <span>Cancellation & Refund Policy</span>
                <span className="text-[10px] font-bold text-rose-300 bg-rose-950/80 border border-rose-500/40 px-2 py-0.5 rounded uppercase font-mono">
                  Mandatory Guest Policy
                </span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Transparent refund percentage slabs and {destCategoryName} regional force majeure terms reflected on customer quotation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCancellationRefundPolicy(getDestinationCancellationPolicy(destination, title))}
            className="text-xs text-slate-400 hover:text-rose-300 underline font-medium cursor-pointer"
          >
            Reset to {destCategoryName} Refund Policy
          </button>
        </div>

        {/* Quick Helper Refund Slabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-3.5 text-center">
            <span className="text-slate-400 block text-[11px] font-semibold">30+ Days Prior</span>
            <span className="text-emerald-400 font-bold text-base sm:text-lg font-mono">90% Refund</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">10% Admin Fee</span>
          </div>
          <div className="bg-slate-900 border border-sky-500/30 rounded-xl p-3.5 text-center">
            <span className="text-slate-400 block text-[11px] font-semibold">15 - 29 Days Prior</span>
            <span className="text-sky-400 font-bold text-base sm:text-lg font-mono">75% Refund</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">25% Retained</span>
          </div>
          <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-3.5 text-center">
            <span className="text-slate-400 block text-[11px] font-semibold">7 - 14 Days Prior</span>
            <span className="text-amber-400 font-bold text-base sm:text-lg font-mono">50% Refund</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">50% Retained</span>
          </div>
          <div className="bg-slate-900 border border-rose-500/30 rounded-xl p-3.5 text-center">
            <span className="text-slate-400 block text-[11px] font-semibold">&lt; 7 Days / No-Show</span>
            <span className="text-rose-400 font-bold text-base sm:text-lg font-mono">Non-Refundable</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">100% Retained</span>
          </div>
        </div>

        {/* Editable Refund Terms List */}
        <div className="space-y-3 pt-1">
          {cancellationRefundPolicy.map((rule, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="font-bold text-rose-400 shrink-0 font-mono text-sm w-6">{i + 1}.</span>
              <input
                type="text"
                value={rule}
                onChange={(e) => {
                  const updated = [...cancellationRefundPolicy];
                  updated[i] = e.target.value;
                  setCancellationRefundPolicy(updated);
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:border-rose-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() =>
                  setCancellationRefundPolicy(cancellationRefundPolicy.filter((_, idx) => idx !== i))
                }
                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                title="Remove rule"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add Custom Refund Clause input */}
        <div className="flex gap-2.5 pt-1">
          <input
            type="text"
            placeholder={`Add custom refund condition for ${destCategoryName}...`}
            value={newRefundClause}
            onChange={(e) => setNewRefundClause(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newRefundClause.trim()) {
                e.preventDefault();
                setCancellationRefundPolicy([...cancellationRefundPolicy, newRefundClause.trim()]);
                setNewRefundClause('');
              }
            }}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-rose-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => {
              if (newRefundClause.trim()) {
                setCancellationRefundPolicy([...cancellationRefundPolicy, newRefundClause.trim()]);
                setNewRefundClause('');
              }
            }}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-sm cursor-pointer shadow-sm transition-colors"
          >
            Add Rule
          </button>
        </div>
      </div>

      {/* Terms & Conditions Section */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-3">
          <h4 className="font-bold text-white text-base sm:text-lg">
            {getDestinationTermsTitle(destination, title)}
          </h4>
          <button
            type="button"
            onClick={() => setTermsAndConditions(getDestinationTermsAndConditions(destination, title))}
            className="text-xs text-slate-400 hover:text-emerald-300 underline font-medium cursor-pointer"
          >
            Reset to {destCategoryName} Terms
          </button>
        </div>

        <div className="space-y-3">
          {termsAndConditions.map((term, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="font-bold text-slate-400 shrink-0 font-mono text-sm w-6">{i + 1}.</span>
              <input
                type="text"
                value={term}
                onChange={(e) => {
                  const updated = [...termsAndConditions];
                  updated[i] = e.target.value;
                  setTermsAndConditions(updated);
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() =>
                  setTermsAndConditions(termsAndConditions.filter((_, idx) => idx !== i))
                }
                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Important Travel Notes & Special Advisories Section */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-3">
          <h4 className="font-bold text-white text-base sm:text-lg flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <span>{getDestinationNotesTitle(destination, title)} ({specialAdvisories.length})</span>
          </h4>
          <button
            type="button"
            onClick={() => setSpecialAdvisories(getDestinationSpecialAdvisories(destination, title))}
            className="text-xs text-slate-400 hover:text-amber-300 underline font-medium cursor-pointer"
          >
            Reset to {destCategoryName} Advisories
          </button>
        </div>

        {/* Dynamic Quick Helper Chips as per Destination */}
        <div className="flex items-center gap-2 flex-wrap bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-400 font-semibold">Quick Insert ({destCategoryName}):</span>
          {getDestinationQuickAddNotes(destination, title).map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (!specialAdvisories.includes(chip.text)) {
                  setSpecialAdvisories([...specialAdvisories, chip.text]);
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-950 text-amber-300 border border-amber-800 hover:bg-amber-900 cursor-pointer font-medium transition-colors"
              title={chip.text}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {specialAdvisories.map((adv, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="font-bold text-amber-400 shrink-0 font-mono text-sm w-6">{i + 1}.</span>
              <input
                type="text"
                value={adv}
                onChange={(e) => {
                  const updated = [...specialAdvisories];
                  updated[i] = e.target.value;
                  setSpecialAdvisories(updated);
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() =>
                  setSpecialAdvisories(specialAdvisories.filter((_, idx) => idx !== i))
                }
                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Bank Details & Payment QR Code Section */}
      <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h4 className="font-bold text-white flex items-center gap-2.5 text-base sm:text-lg">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <span>Agency Bank Details & UPI Payment QR Code</span>
              <span className="text-xs text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2.5 py-0.5 rounded-md font-mono">
                Printed on PDF
              </span>
            </h4>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              These account credentials and your UPI QR code appear directly on page 2 of the customer quotation for advance token payment.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <input
              type="file"
              ref={qrInputRef as any}
              accept="image/*"
              onChange={handleQrUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => qrInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-colors cursor-pointer text-xs sm:text-sm shadow-sm"
            >
              <Upload className="w-4 h-4" />
              <span>{companyProfile.upiQrCodeUrl ? 'Change Payment QR' : 'Upload Payment QR'}</span>
            </button>

            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl border border-slate-700 transition-colors text-xs sm:text-sm cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Edit Agency Bank Info</span>
              </button>
            )}
          </div>
        </div>

        {/* Bank Details Specs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 text-sm">
            <div>
              <span className="text-xs text-slate-400 block uppercase tracking-wider font-semibold">Bank Name</span>
              <span className="text-white font-medium text-base mt-0.5 block">{companyProfile.bankName}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block uppercase tracking-wider font-semibold">Beneficiary / A/C Name</span>
              <span className="text-white font-medium text-base mt-0.5 block">{companyProfile.accountName}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block uppercase tracking-wider font-semibold">Account Type</span>
              <span className="text-slate-300 text-base mt-0.5 block">{companyProfile.accountType || 'Current Account'}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block uppercase tracking-wider font-semibold">Account Number</span>
              <span className="text-white font-mono font-bold tracking-wider text-base mt-0.5 block">{companyProfile.accountNumber}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block uppercase tracking-wider font-semibold">IFSC Code & Branch</span>
              <span className="text-white font-mono font-semibold text-base mt-0.5 block">{companyProfile.ifscCode} <span className="text-slate-400 font-sans text-sm font-normal">({companyProfile.branch})</span></span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block uppercase tracking-wider font-semibold">UPI VPA ID</span>
              <span className="text-emerald-400 font-mono font-bold text-base mt-0.5 block">{companyProfile.upiId}</span>
            </div>
          </div>

          {/* QR Code Card */}
          <div className="flex flex-col items-center justify-center p-5 bg-slate-900 rounded-2xl border border-slate-800 text-center">
            <div className="w-36 h-36 bg-white p-2.5 rounded-xl border-2 border-emerald-500/40 flex items-center justify-center overflow-hidden shadow-md">
              {companyProfile.upiQrCodeUrl ? (
                <img
                  src={companyProfile.upiQrCodeUrl}
                  alt="UPI Payment QR Code"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center p-2 text-slate-400">
                  <QrCode className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                  <span className="text-xs block text-slate-500">No QR Code Uploaded</span>
                </div>
              )}
            </div>
            <div className="mt-3">
              <span className="text-sm font-bold text-white block">UPI Payment QR</span>
              <span className="text-xs text-slate-400 block mt-0.5">GPay · PhonePe · Paytm · BHIM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Step 4 Navigation Footer */}
      {!isFullView && (
        <div className="pt-6 border-t border-slate-800 flex items-center justify-between flex-wrap gap-4">
          <button
            type="button"
            onClick={onPrev}
            className="inline-flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
          >
            <span>⬅ Step 3: Cab Rates & Account</span>
          </button>
          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer shadow-md"
          >
            <span>Continue to Step 5: Full View (Review All) ➜</span>
          </button>
        </div>
      )}
    </div>
  );
};
