import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Building,
  Phone,
  Mail,
  Globe,
  MapPin,
  CreditCard,
  FileCheck,
  RotateCcw,
  Check,
  Image as ImageIcon,
  QrCode,
} from 'lucide-react';
import { defaultCompanyProfile } from '../../data/defaultTemplates';
import { CompanyProfile } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyProfile: CompanyProfile;
  onSaveProfile: (profile: CompanyProfile) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  companyProfile,
  onSaveProfile,
}) => {
  const [profile, setProfile] = useState<CompanyProfile>(companyProfile);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrCodeInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Logo image should be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setProfile((prev) => ({
        ...prev,
        logoUrl: result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = () => {
    setProfile((prev) => ({
      ...prev,
      logoUrl: defaultCompanyProfile.logoUrl,
    }));
  };

  const handleQrCodeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('QR code image should be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setProfile((prev) => ({
        ...prev,
        upiQrCodeUrl: result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleResetQrCode = () => {
    setProfile((prev) => ({
      ...prev,
      upiQrCodeUrl: defaultCompanyProfile.upiQrCodeUrl,
    }));
  };

  const handleRemoveQrCode = () => {
    setProfile((prev) => ({
      ...prev,
      upiQrCodeUrl: '',
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(profile);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-3xl w-full my-8 text-slate-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Building className="w-5 h-5 text-emerald-400" />
              <span>Agency Profile & PDF Header Branding</span>
            </h2>
            <p className="text-xs text-slate-400">
              Upload your company logo and configure details that reflect directly on the PDF
              itinerary and quotes
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-xs max-h-[75vh] overflow-y-auto">
          {/* Logo Upload Section - Highlighted Feature */}
          <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                  Company Logo (Reflected in PDF & Quotes)
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Upload your high-resolution travel agency logo. It will appear at the top of every generated PDF.
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetLogo}
                className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
                title="Reset to official North East Destinations logo"
              >
                <RotateCcw className="w-3 h-3" />
                Reset default
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              {/* Logo Preview Container */}
              <div className="w-28 h-28 rounded-xl bg-white p-2 border-2 border-dashed border-emerald-500/50 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                {profile.logoUrl ? (
                  <img
                    src={profile.logoUrl}
                    alt="Company Logo Preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center text-slate-400">
                    <ImageIcon className="w-8 h-8 mx-auto text-slate-300" />
                    <span className="text-[10px] block mt-1">No Logo</span>
                  </div>
                )}
              </div>

              {/* Upload controls */}
              <div className="space-y-2 flex-1 text-left">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition-colors cursor-pointer text-xs"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Company Logo</span>
                  </button>

                  <span className="text-[11px] text-slate-400">
                    PNG, JPG, or SVG (Recommended 400x400px+)
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  ✓ The uploaded logo will be automatically formatted for crisp rendering on A4 PDF pages, email proposals, and printable customer vouchers.
                </p>
              </div>
            </div>
          </div>

          {/* Agency Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Company & Contact Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Website URL</label>
                <input
                  type="text"
                  value={profile.website}
                  onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Primary Phone</label>
                <input
                  type="text"
                  value={profile.phone1}
                  onChange={(e) => setProfile({ ...profile, phone1: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">WhatsApp Helpline</label>
                <input
                  type="text"
                  value={profile.whatsapp}
                  onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-medium mb-1">Support Email</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Siliguri / Hub Office Address
                </label>
                <textarea
                  rows={2}
                  value={profile.addressSiliguri}
                  onChange={(e) => setProfile({ ...profile, addressSiliguri: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Gangtok / Regional Office Address
                </label>
                <textarea
                  rows={2}
                  value={profile.addressGangtok}
                  onChange={(e) => setProfile({ ...profile, addressGangtok: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                />
              </div>
            </div>
          </div>

          {/* Payment & Bank Details Section with Payment QR Code */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>Bank Details & Payment QR Code (Reflected on PDF Itineraries)</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  These bank account details and your payment QR code will be embedded in the quotation PDF for client advance payments.
                </p>
              </div>
            </div>

            {/* QR Code Upload Card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center gap-5">
              {/* QR Preview Box */}
              <div className="w-32 h-32 rounded-xl bg-white p-2 border-2 border-dashed border-emerald-500/50 flex flex-col items-center justify-center overflow-hidden shrink-0 shadow-md relative group">
                {profile.upiQrCodeUrl ? (
                  <img
                    src={profile.upiQrCodeUrl}
                    alt="Payment QR Code"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center text-slate-400 p-2">
                    <QrCode className="w-8 h-8 mx-auto text-slate-400 mb-1" />
                    <span className="text-[9px] block text-slate-500">No QR Code</span>
                  </div>
                )}
              </div>

              {/* QR Upload Controls */}
              <div className="space-y-2 flex-1 text-left w-full sm:w-auto">
                <input
                  type="file"
                  ref={qrCodeInputRef}
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                  onChange={handleQrCodeUpload}
                  className="hidden"
                />

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => qrCodeInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition-colors cursor-pointer text-xs shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Payment QR Code</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetQrCode}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset Default QR
                  </button>

                  {profile.upiQrCodeUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveQrCode}
                      className="inline-flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 px-2 py-1 rounded hover:bg-rose-950/40 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  ✓ Upload your official <strong>Google Pay, PhonePe, Paytm, BHIM, or Bank UPI QR code</strong>.
                  It will be printed side-by-side with your account numbers on every customer itinerary PDF for instant scanning.
                </p>
              </div>
            </div>

            {/* Bank Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Bank Name</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Bank Ltd"
                  value={profile.bankName}
                  onChange={(e) => setProfile({ ...profile, bankName: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Account Holder Name</label>
                <input
                  type="text"
                  placeholder="e.g. North East Destinations"
                  value={profile.accountName}
                  onChange={(e) => setProfile({ ...profile, accountName: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Account Type</label>
                <select
                  value={profile.accountType || 'Current Account'}
                  onChange={(e) => setProfile({ ...profile, accountType: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                >
                  <option value="Current Account">Current Account</option>
                  <option value="Savings Account">Savings Account</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Account Number</label>
                <input
                  type="text"
                  placeholder="e.g. 50200084920194"
                  value={profile.accountNumber}
                  onChange={(e) => setProfile({ ...profile, accountNumber: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">IFSC Code</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC0000492"
                  value={profile.ifscCode}
                  onChange={(e) => setProfile({ ...profile, ifscCode: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Branch Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sevoke Road, Siliguri"
                  value={profile.branch}
                  onChange={(e) => setProfile({ ...profile, branch: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-slate-300 font-medium mb-1">
                  Official UPI ID (VPA) for Direct Online Transfer
                </label>
                <input
                  type="text"
                  placeholder="e.g. northeastdestinations@hdfcbank"
                  value={profile.upiId}
                  onChange={(e) => setProfile({ ...profile, upiId: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono font-medium"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            {saveSuccess ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                Settings saved successfully!
              </span>
            ) : (
              <span className="text-slate-400 text-[11px]">
                Changes persist automatically in your browser storage.
              </span>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg shadow-sm transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
