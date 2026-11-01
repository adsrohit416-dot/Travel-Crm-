import React, { useState, useRef } from 'react';
import {
  Download,
  Printer,
  Copy,
  Check,
  Edit,
  ArrowLeft,
  Phone,
  Mail,
  Globe,
  MapPin,
  Calendar,
  Car,
  ShieldAlert,
  CreditCard,
  Upload,
  Sparkles,
  Building,
  QrCode,
  Image as ImageIcon,
  ExternalLink,
  CheckCircle2,
  FileCode,
  Trash2,
  Plus,
  MoveUp,
  MoveDown,
  RotateCcw,
} from 'lucide-react';
import { CompanyProfile, Itinerary } from '../../types';
import { exportElementToPdf, triggerNativePrint, exportStandAloneHtml, downloadBlobToSystem } from '../../utils/pdfExport';
import {
  DESTINATION_IMAGE_CATALOG,
  DestinationImage,
  getDefaultDestinationCover,
  getDefaultDayImage,
  getImagesForDestination,
} from '../../data/destinationImages';
import {
  defaultSpecialAdvisories,
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
import { ImageUploadModal } from '../common/ImageUploadModal';
import { getDayOfWeekAbbr, formatDateWithDayAbbr } from '../../utils/dateUtils';

interface ItineraryPreviewProps {
  itinerary: Itinerary;
  companyProfile: CompanyProfile;
  onEdit: () => void;
  onBack: () => void;
  onUpdateLogo?: (newLogoUrl: string) => void;
  onUpdateQrCode?: (newQrUrl: string) => void;
  onUpdateItinerary?: (updatedItinerary: Itinerary) => void;
}

export const ItineraryPreview: React.FC<ItineraryPreviewProps> = ({
  itinerary,
  companyProfile,
  onEdit,
  onBack,
  onUpdateLogo,
  onUpdateQrCode,
  onUpdateItinerary,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<string>('');
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<{
    filename: string;
    blobUrl?: string;
    blob?: Blob;
  } | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // Image Switcher Modal State
  const [imageModalTarget, setImageModalTarget] = useState<'hero' | number | null>(null);

  // Destination policy resolution and cross-destination pollution guard
  const destCategory = getDestinationCategory(itinerary.destination, itinerary.title);
  const destCategoryName = getDestinationCategoryName(itinerary.destination, itinerary.title);
  const destAdvisories = getDestinationSpecialAdvisories(itinerary.destination, itinerary.title);
  const destTerms = getDestinationTermsAndConditions(itinerary.destination, itinerary.title);
  const destCancellation = getDestinationCancellationPolicy(itinerary.destination, itinerary.title);

  // Check if existing notes contain North East references (e.g. Nathula, Sikkim, Tsomgo, Lachen)
  // while the itinerary is for Andaman (or non-Sikkim destination)
  const isNotesPolluted = (notes?: string[]) => {
    if (!notes || notes.length === 0) return true;
    if (destCategory === 'andaman') {
      const text = notes.join(' ').toLowerCase();
      if (text.includes('nathula') || text.includes('sikkim') || text.includes('tsomgo') || text.includes('lachen')) {
        return true;
      }
    }
    return false;
  };

  // Editable Important Notes / Special Advisories
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editableNotes, setEditableNotes] = useState<string[]>(() => {
    if (isNotesPolluted(itinerary.specialAdvisories)) {
      return destAdvisories;
    }
    return itinerary.specialAdvisories!;
  });
  const [newNoteInput, setNewNoteInput] = useState('');
  const [notesSaveNotice, setNotesSaveNotice] = useState<string | null>(null);

  // Destination-accurate terms and cancellation
  const termsToDisplay = React.useMemo(() => {
    if (destCategory === 'andaman') {
      const text = (itinerary.termsAndConditions || []).join(' ').toLowerCase();
      if (text.includes('sikkim') || text.includes('landslide') || text.includes('mountain roads') || text.length === 0) {
        return destTerms;
      }
    }
    return itinerary.termsAndConditions && itinerary.termsAndConditions.length > 0
      ? itinerary.termsAndConditions
      : destTerms;
  }, [itinerary.termsAndConditions, destCategory, destTerms]);

  const cancellationToDisplay = React.useMemo(() => {
    if (destCategory === 'andaman') {
      const text = (itinerary.cancellationRefundPolicy || []).join(' ').toLowerCase();
      if (text.includes('landslide') || text.includes('mountain roads') || text.length === 0) {
        return destCancellation;
      }
    }
    return itinerary.cancellationRefundPolicy && itinerary.cancellationRefundPolicy.length > 0
      ? itinerary.cancellationRefundPolicy
      : destCancellation;
  }, [itinerary.cancellationRefundPolicy, destCategory, destCancellation]);

  const handleUpdateNote = (index: number, text: string) => {
    const updated = [...editableNotes];
    updated[index] = text;
    setEditableNotes(updated);
  };

  const handleDeleteNote = (index: number) => {
    const updated = editableNotes.filter((_, i) => i !== index);
    setEditableNotes(updated);
  };

  const handleAddNote = () => {
    if (!newNoteInput.trim()) return;
    const updated = [...editableNotes, newNoteInput.trim()];
    setEditableNotes(updated);
    setNewNoteInput('');
  };

  const handleMoveNote = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= editableNotes.length) return;
    const updated = [...editableNotes];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setEditableNotes(updated);
  };

  const handleSaveNotes = () => {
    const cleaned = editableNotes.map((n) => n.trim()).filter(Boolean);
    setEditableNotes(cleaned);
    if (onUpdateItinerary) {
      onUpdateItinerary({
        ...itinerary,
        specialAdvisories: cleaned,
      });
    }
    setIsEditingNotes(false);
    setNotesSaveNotice('✓ Travel notes updated & saved.');
    setTimeout(() => setNotesSaveNotice(null), 3500);
  };

  const handleResetNotesToDefault = () => {
    setEditableNotes(getDestinationSpecialAdvisories(itinerary.destination, itinerary.title));
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);

  // Predefined default destination cover
  const defaultCover = getDefaultDestinationCover(itinerary.destination, itinerary.title);
  const activeCoverUrl = itinerary.heroImageUrl || defaultCover.url;
  const activeCoverCaption = itinerary.heroImageCaption || defaultCover.caption;

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    setExportError(null);
    setDownloadSuccess(null);
    setExportProgress('Preparing document & destination images...');

    const cleanFilename = `Itinerary_${itinerary.quoteNumber || 'NED'}_${(itinerary.guestName || 'Guest').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

    try {
      const result = await exportElementToPdf('itinerary-printable-document', {
        filename: cleanFilename,
        onProgress: (p, status) => setExportProgress(`${status} (${p}%)`),
      });

      setDownloadSuccess({
        filename: cleanFilename,
        blobUrl: result.blobUrl,
        blob: result.blob,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('PDF export error:', err);
      setExportError(msg);
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
  };

  const handleExportHtml = () => {
    const cleanFilename = `Itinerary_${itinerary.quoteNumber || 'NED'}_${(itinerary.guestName || 'Guest').replace(/[^a-zA-Z0-9]/g, '_')}.html`;
    exportStandAloneHtml('itinerary-printable-document', cleanFilename);
  };

  const handleSelectPredefinedImage = (image: DestinationImage) => {
    if (!onUpdateItinerary) return;

    if (imageModalTarget === 'hero') {
      onUpdateItinerary({
        ...itinerary,
        heroImageUrl: image.url,
        heroImageCaption: image.caption,
      });
    } else if (typeof imageModalTarget === 'number') {
      const updatedDays = itinerary.days.map((day) => {
        if (day.dayNumber === imageModalTarget) {
          return {
            ...day,
            imageUrl: image.url,
            imageCaption: image.caption,
          };
        }
        return day;
      });
      onUpdateItinerary({
        ...itinerary,
        days: updatedDays,
      });
    }
    setImageModalTarget(null);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      onUpdateLogo?.(result);
    };
    reader.readAsDataURL(file);
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      onUpdateQrCode?.(result);
    };
    reader.readAsDataURL(file);
  };

  // Dynamic pricing mode switcher in preview (defaults to itinerary.pricingMode or 'both')
  const [activePricingMode, setActivePricingMode] = useState<'both' | 'reserved' | 'sharing'>(() => {
    if (itinerary.pricingMode === 'reserved') return 'reserved';
    if (itinerary.pricingMode === 'sharing') return 'sharing';
    return 'both';
  });

  const handleSwitchPricingMode = (mode: 'both' | 'reserved' | 'sharing') => {
    setActivePricingMode(mode);
    if (onUpdateItinerary) {
      onUpdateItinerary({
        ...itinerary,
        pricingMode: mode,
      });
    }
  };

  const isDualQuote = activePricingMode === 'both';
  const isSharingOnly = activePricingMode === 'sharing';
  const isReservedOnly = activePricingMode === 'reserved';

  const reservedRate = itinerary.reservedCab?.totalPackagePrice || 0;
  const sharingRate = itinerary.sharingCab?.totalPackagePrice || 0;
  const reservedPerPerson = itinerary.reservedCab?.pricePerPerson || 0;
  const sharingPerPerson = itinerary.sharingCab?.pricePerPerson || 0;
  const savingsTotal = Math.max(0, reservedRate - sharingRate);
  const savingsPerPerson = Math.max(0, reservedPerPerson - sharingPerPerson);

  const handleCopyWhatsAppQuote = () => {
    const isDual = isDualQuote;
    const isSharing = isSharingOnly;
    let text = `*North East Destinations - Customized Holiday Proposal*\n`;
    text += `*Quote Ref:* ${itinerary.quoteNumber}\n`;
    text += `*Guest Name:* ${itinerary.guestName}\n`;
    text += `*Tour:* ${itinerary.title || 'Customized North East Holiday'}\n`;
    text += `*Duration:* ${itinerary.durationNights} Nights / ${itinerary.durationDays} Days\n`;
    text += `*Travel Dates:* ${itinerary.travelStartDate || 'Flexible'} to ${itinerary.travelEndDate || 'Flexible'}\n`;
    text += `*Pax:* ${itinerary.adults} Adults${itinerary.children > 0 ? `, ${itinerary.children} Children` : ''}\n`;
    text += `*Hotel Category:* ${itinerary.hotelCategory} (${itinerary.mealPlan})\n\n`;

    if (isDual) {
      text += `*--- CAB & VEHICLE QUOTATION (BOTH RATES COMPARISON) ---*\n\n`;
      text += `*OPTION 1: ${itinerary.reservedCab?.name || 'Reserved Dedicated Cab'}*\n`;
      text += `• Vehicle: ${itinerary.reservedCab?.vehicleType || 'Innova / Xylo'}\n`;
      text += `• Rate: ₹${(itinerary.reservedCab?.pricePerPerson || 0).toLocaleString('en-IN')} per person\n`;
      text += `• Total Package: ₹${(itinerary.reservedCab?.totalPackagePrice || 0).toLocaleString('en-IN')}\n`;
      text += `• Cab Type: Dedicated private vehicle, flexible sightseeing & photo stops\n\n`;

      text += `*OPTION 2: ${itinerary.sharingCab?.name || 'Sharing Cab Facility'}*\n`;
      text += `• Vehicle: ${itinerary.sharingCab?.vehicleType || 'Fixed Tata Sumo / Bolero'}\n`;
      text += `• Rate: ₹${(itinerary.sharingCab?.pricePerPerson || 0).toLocaleString('en-IN')} per person\n`;
      text += `• Total Package: ₹${(itinerary.sharingCab?.totalPackagePrice || 0).toLocaleString('en-IN')}\n`;
      text += `• Cab Type: Economical union shared vehicle between taxi stands\n\n`;

      if (savingsTotal > 0) {
        text += `*💡 Guest Cost Savings with Sharing Cab:* ₹${savingsPerPerson.toLocaleString('en-IN')} per person (Total Savings: ₹${savingsTotal.toLocaleString('en-IN')})\n\n`;
      }
    } else if (isSharing) {
      text += `*Cab Facility: Sharing Cab (Fixed Tata Sumo / Bolero)*\n`;
      text += `• Rate: ₹${(itinerary.sharingCab?.pricePerPerson || 0).toLocaleString('en-IN')} per person\n`;
      text += `• Total Package: ₹${(itinerary.sharingCab?.totalPackagePrice || 0).toLocaleString('en-IN')}\n`;
      text += `• Vehicle: ${itinerary.sharingCab?.vehicleType || 'Tata Sumo / Mahindra Bolero'}\n\n`;
    } else {
      text += `*Cab Facility: Reserved Dedicated Cab*\n`;
      text += `• Rate: ₹${(itinerary.reservedCab?.pricePerPerson || 0).toLocaleString('en-IN')} per person\n`;
      text += `• Total Package: ₹${(itinerary.reservedCab?.totalPackagePrice || 0).toLocaleString('en-IN')}\n`;
      text += `• Vehicle: ${itinerary.reservedCab?.vehicleType || 'Innova / Xylo'}\n\n`;
    }

    text += `*Day-wise Summary:*\n`;
    itinerary.days.forEach((d) => {
      text += `Day ${d.dayNumber}${d.title ? `: ${d.title}` : ''} (Stay: ${d.nightStay || 'As specified'})\n`;
    });

    text += `\n*Need customizations? Call ${companyProfile.phone1}.*\n`;
    text += `Website: ${companyProfile.website}`;

    navigator.clipboard.writeText(text);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2000);
  };

  const availableImages = getImagesForDestination(itinerary.destination);

  return (
    <div className="space-y-6">
      {/* Top Action Bar (hidden in print) */}
      <div className="no-print bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-16 z-30 shadow-lg">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={onBack}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Back to List / Builder"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                Quote #{itinerary.quoteNumber}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-300 font-medium">{itinerary.guestName || 'New Quote'}</span>
            </div>
            <span className="text-xs text-slate-400">
              PDF Preview & Export · {itinerary.destination ? `${itinerary.destination} · ` : ''}
              {isDualQuote ? 'Both Rates (Dual Comparison)' : isSharingOnly ? 'Sharing Cab Quote' : 'Reserved Cab Quote'}
            </span>
          </div>
        </div>

        {/* 1-Click Quote Rate Display Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs shadow-inner">
          <button
            type="button"
            onClick={() => handleSwitchPricingMode('both')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              isDualQuote
                ? 'bg-emerald-500 text-slate-950 shadow-sm ring-1 ring-emerald-400/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
            title="Display Both Rates side-by-side for guest comparison"
          >
            <span className={`w-2 h-2 rounded-full ${isDualQuote ? 'bg-slate-950' : 'bg-emerald-400'}`}></span>
            <span>Both Rates (Compare)</span>
          </button>
          <button
            type="button"
            onClick={() => handleSwitchPricingMode('reserved')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              isReservedOnly
                ? 'bg-sky-500 text-slate-950 shadow-sm ring-1 ring-sky-400/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
            title="Display Reserved Dedicated Cab rate only"
          >
            <span className={`w-2 h-2 rounded-full ${isReservedOnly ? 'bg-slate-950' : 'bg-sky-400'}`}></span>
            <span>Reserved Only</span>
          </button>
          <button
            type="button"
            onClick={() => handleSwitchPricingMode('sharing')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              isSharingOnly
                ? 'bg-amber-500 text-slate-950 shadow-sm ring-1 ring-amber-400/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
            title="Display Sharing Mountain Vehicle rate only"
          >
            <span className={`w-2 h-2 rounded-full ${isSharingOnly ? 'bg-slate-950' : 'bg-amber-400'}`}></span>
            <span>Sharing Only</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
          {/* Change Logo */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            title="Upload your company logo to reflect on this PDF"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Logo</span>
          </button>

          {/* Change QR Code */}
          <input
            type="file"
            ref={qrInputRef}
            accept="image/*"
            onChange={handleQrUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => qrInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            title="Upload or change Payment QR Code on this PDF"
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-400" />
            <span>Payment QR</span>
          </button>

          {/* Copy WhatsApp text */}
          <button
            onClick={handleCopyWhatsAppQuote}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            {copiedWhatsApp ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </>
            )}
          </button>

          {/* Native Print / Save as PDF */}
          <button
            onClick={triggerNativePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            title="Print or Save as PDF directly via system print dialog"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save as PDF</span>
          </button>

          {/* Standalone HTML Export */}
          <button
            onClick={handleExportHtml}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            title="Export standalone offline HTML document"
          >
            <FileCode className="w-3.5 h-3.5 text-sky-400" />
            <span>Export HTML</span>
          </button>

          {/* Edit Itinerary */}
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>

          {/* Primary Download PDF Button */}
          <button
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm transition-colors whitespace-nowrap disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Generating PDF...' : 'Download PDF'}</span>
          </button>
        </div>
      </div>

      {/* Progress Notice */}
      {isExporting && exportProgress && (
        <div className="no-print bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs px-4 py-3 rounded-xl flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="font-medium">{exportProgress}</span>
          </div>
          <span className="text-[11px] text-emerald-400">Rendering multi-page A4 document...</span>
        </div>
      )}

      {/* Success Notification Bar with Direct Fallback Links */}
      {downloadSuccess && (
        <div className="no-print bg-emerald-900/60 border border-emerald-500/60 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-sm block">PDF Generated Successfully!</span>
              <span className="text-slate-300">
                Downloaded as <span className="font-mono text-emerald-300">{downloadSuccess.filename}</span> to your system.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {downloadSuccess.blob && (
              <button
                onClick={() => downloadBlobToSystem(downloadSuccess.blob!, downloadSuccess.filename)}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition-colors cursor-pointer"
              >
                Re-download
              </button>
            )}
            {downloadSuccess.blobUrl && (
              <a
                href={downloadSuccess.blobUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
              >
                <span>Open in Tab</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Error Fallback Banner */}
      {exportError && (
        <div className="no-print bg-rose-950/80 border border-rose-500/50 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-rose-200">
          <div>
            <span className="font-bold text-rose-100 block">Notice on direct PDF generation</span>
            <p className="text-[11px] text-rose-300 mt-0.5">
              The direct canvas generator encountered an issue: {exportError}. You can still use the 100% reliable System Print option below:
            </p>
          </div>
          <button
            onClick={triggerNativePrint}
            className="px-3 py-1.5 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-lg transition-colors shrink-0 cursor-pointer"
          >
            Print / Save as PDF
          </button>
        </div>
      )}

      {/* =========================================================================
          PRINTABLE & EXPORTABLE ITINERARY DOCUMENT CONTAINER
          Engineered for pristine A4 PDF & paper layout
          ========================================================================= */}
      <div className="w-full flex justify-center overflow-x-auto pb-8">
        <div
          id="itinerary-printable-document"
          data-pdf-root="true"
          className="w-[820px] min-w-[820px] max-w-[820px] bg-white text-slate-900 rounded-xl shadow-2xl p-8 space-y-6 font-sans print:shadow-none print:p-0 print:w-full print:max-w-full print:min-w-0 print:rounded-none"
          style={{ boxSizing: 'border-box' }}
        >
          {/* Section 1: Header with Company Logo & Contact Information */}
          <div className="border-b-2 border-emerald-800/20 pb-5" data-pdf-block="true">
            <div className="flex items-center justify-between gap-6">
              {/* Logo & Company Identity */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-lg bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                  {companyProfile.logoUrl ? (
                    <img
                      src={companyProfile.logoUrl}
                      alt={companyProfile.name}
                      className="w-full h-full object-contain"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <Building className="w-10 h-10 text-emerald-800" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                    {companyProfile.name}
                  </h1>
                  <p className="text-xs text-slate-600 font-medium max-w-md mt-0.5 leading-snug">
                    {companyProfile.tagline}
                  </p>
                </div>
              </div>

              {/* Agency Contacts */}
              <div className="text-right text-xs space-y-1 text-slate-600 border-l border-slate-200 pl-4 shrink-0">
                <div className="font-semibold text-slate-900 flex justify-end items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span className="font-mono">{companyProfile.phone1}</span>
                </div>
                <div className="flex justify-end items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span className="text-[11px]">{companyProfile.email}</span>
                </div>
                <div className="flex justify-end items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <a
                    href={companyProfile.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-medium text-emerald-800 hover:underline"
                  >
                    {companyProfile.website.replace('https://', '')}
                  </a>
                </div>
                <div className="text-[10px] text-slate-500 pt-1 leading-tight max-w-[220px] ml-auto">
                  {companyProfile.addressSiliguri}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Quote Metadata & Guest Summary Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 print-avoid-break" data-pdf-block="true">
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-800 font-bold block">
                  Customized Holiday Itinerary & Quotation
                </span>
                <h2 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">
                  {itinerary.title || `${itinerary.destination || 'North East'} Tour Package`}
                </h2>
              </div>
              <div className="text-right font-mono text-xs">
                <div className="font-bold text-slate-900">
                  Ref: <span className="text-emerald-700">{itinerary.quoteNumber}</span>
                </div>
                <div className="text-slate-500 text-[11px]">
                  Date: {new Date(itinerary.createdAt).toLocaleDateString('en-GB')}
                </div>
              </div>
            </div>

            {/* Guest details grid */}
            <div className="grid grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Guest Name
                </span>
                <span className="font-bold text-slate-900 text-sm block truncate">
                  {itinerary.guestName || 'Valued Guest'}
                </span>
                <span className="text-slate-600 font-mono text-[11px]">
                  {itinerary.guestPhone || 'Phone Not Specified'}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Tour Duration
                </span>
                <span className="font-bold text-slate-900 font-mono">
                  {itinerary.durationNights} Nights / {itinerary.durationDays} Days
                </span>
                <span className="text-slate-500 block text-[11px]">
                  {itinerary.travelStartDate
                    ? `${formatDateWithDayAbbr(itinerary.travelStartDate, 'prefix')} to ${formatDateWithDayAbbr(itinerary.travelEndDate, 'prefix')}`
                    : 'Flexible Travel Window'}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Total Travelers
                </span>
                <span className="font-bold text-slate-900 font-mono">
                  {itinerary.adults} Adults
                  {itinerary.children > 0 ? `, ${itinerary.children} Children` : ''}
                  {itinerary.infants > 0 ? `, ${itinerary.infants} Infants` : ''}
                </span>
                <span className="text-slate-500 block text-[11px]">
                  {itinerary.guestCity ? `From: ${itinerary.guestCity}` : 'Domestic Tour'}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Hotel & Meal Plan
                </span>
                <span className="font-bold text-slate-900 block truncate" title={itinerary.hotelCategory}>
                  {itinerary.hotelCategory}
                </span>
                <span className="text-emerald-700 font-semibold text-[11px] block">
                  {itinerary.mealPlan}
                </span>
              </div>
            </div>

            {/* Pickup & Drop Points */}
            {(itinerary.pickupLocation || itinerary.dropLocation) && (
              <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-xs text-slate-600 gap-2">
                {itinerary.pickupLocation && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>
                      <strong className="text-slate-900">Pickup:</strong> {itinerary.pickupLocation}
                    </span>
                  </div>
                )}
                {itinerary.dropLocation && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                    <span>
                      <strong className="text-slate-900">Drop:</strong> {itinerary.dropLocation}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Proposed Hotel Accommodations Summary */}
            {itinerary.days?.some((d) => Boolean(d.hotelName?.trim())) && (
              <div className="border-t border-slate-200 pt-3 flex items-start gap-2 text-xs text-slate-700 bg-emerald-50/50 -mx-5 -mb-5 px-5 py-2.5 rounded-b-xl border-t">
                <Building className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="font-bold text-slate-900">Proposed Hotel Accommodations: </span>
                  <span className="font-medium text-emerald-950">
                    {Array.from(
                      new Set(
                        itinerary.days
                           .map((d) => d.hotelName?.trim())
                          .filter(Boolean) as string[]
                      )
                    ).join(' · ')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* =========================================================================
              PREDEFINED DESTINATION HERO SHOWCASE
              Prominently displayed in itinerary preview and exported PDF
              ========================================================================= */}
          <div className="rounded-xl overflow-hidden border border-slate-200 relative group print-avoid-break shadow-xs">
            <div className="relative h-44 sm:h-56 w-full bg-slate-900">
              <img
                src={activeCoverUrl}
                alt={itinerary.destination || 'North East Destination'}
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />
              {/* Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>

              {/* Destination Tag */}
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-bold text-slate-900 shadow-sm flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-emerald-700" />
                <span>{itinerary.destination || 'Himalayan Holiday'}</span>
              </div>

              {/* Cover Caption */}
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-300 block">
                  Featured Destination
                </span>
                <p className="text-xs sm:text-sm font-semibold text-white leading-snug drop-shadow-sm">
                  {activeCoverCaption}
                </p>
              </div>

              {/* Upload & Change Photo Button in Preview Mode (Hidden in Print) */}
              {onUpdateItinerary && (
                <button
                  type="button"
                  onClick={() => setImageModalTarget('hero')}
                  className="no-print absolute top-3 right-3 bg-slate-900/85 hover:bg-slate-900 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md border border-white/20 transition-all opacity-85 group-hover:opacity-100 flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Upload custom destination photo or select from library"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Upload / Change Cover</span>
                </button>
              )}
            </div>
          </div>

          {/* Section 3: Vehicle & Cab Facility Quoting System */}
          <div className="space-y-4 print-avoid-break" data-pdf-block="true">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Car className="w-4 h-4 text-emerald-800" />
                <span>Vehicle & Transportation Quotation</span>
              </h3>
              <span className="text-xs font-mono text-slate-500">
                {isDualQuote ? 'Comparative Rate Analysis' : 'Single Vehicle Option'}
              </span>
            </div>

            {/* DUAL COMPARISON CARDS */}
            {isDualQuote ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                {/* Option A: Reserved Cab */}
                <div className="border-2 border-emerald-800/40 rounded-xl p-5 bg-emerald-50/20 flex flex-col justify-between space-y-4 relative">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        Option 1 · Recommended
                      </span>
                      <span className="text-xs font-semibold text-emerald-900">Dedicated SUV</span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 leading-tight">
                      {itinerary.reservedCab.name}
                    </h4>

                    <div className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{itinerary.reservedCab.vehicleType}</span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {itinerary.reservedCab.description}
                    </p>

                    {/* Specific Inclusions for Reserved Cab */}
                    <div className="pt-2 space-y-1">
                      <span className="text-[11px] font-bold text-slate-800 block">
                        Reserved Cab Advantages:
                      </span>
                      {itinerary.reservedCab.specificInclusions.map((inc, i) => (
                        <div key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{inc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Price Box */}
                  <div className="pt-4 border-t border-emerald-900/10 bg-white p-3 rounded-lg border border-emerald-100">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-600 font-medium">Rate per Person:</span>
                      <span className="text-lg font-bold text-emerald-800 font-mono tabular-nums">
                        ₹{itinerary.reservedCab.pricePerPerson.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between mt-1 pt-1 border-t border-slate-100">
                      <span className="text-xs font-bold text-slate-900">Total Package (All Pax):</span>
                      <span className="text-xl font-black text-slate-900 font-mono tabular-nums">
                        ₹{itinerary.reservedCab.totalPackagePrice.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Option B: Sharing Cab */}
                <div className="border border-slate-300 rounded-xl p-5 bg-slate-50 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                        Option 2 · Budget Friendly
                      </span>
                      <span className="text-xs font-semibold text-slate-500">Shared Route</span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 leading-tight">
                      {itinerary.sharingCab.name}
                    </h4>

                    <div className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-amber-700" />
                      <span>{itinerary.sharingCab.vehicleType}</span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {itinerary.sharingCab.description}
                    </p>

                    {/* Specific Inclusions for Sharing Cab */}
                    <div className="pt-2 space-y-1">
                      <span className="text-[11px] font-bold text-slate-800 block">
                        Sharing Cab Inclusions:
                      </span>
                      {itinerary.sharingCab.specificInclusions.map((inc, i) => (
                        <div key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span>{inc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Price Box */}
                  <div className="pt-4 border-t border-slate-200 bg-white p-3 rounded-lg border border-slate-200">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-600 font-medium">Rate per Person:</span>
                      <span className="text-lg font-bold text-slate-800 font-mono tabular-nums">
                        ₹{itinerary.sharingCab.pricePerPerson.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between mt-1 pt-1 border-t border-slate-100">
                      <span className="text-xs font-bold text-slate-900">Total Package (All Pax):</span>
                      <span className="text-xl font-black text-slate-900 font-mono tabular-nums">
                        ₹{itinerary.sharingCab.totalPackagePrice.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dual Rates Comparison & Guest Value Guide */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      <span>Comparative Rates Breakdown & Guest Guide</span>
                    </span>
                    {savingsPerPerson > 0 ? (
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[11px] font-mono border border-emerald-300">
                        Guest Saves ₹{savingsPerPerson.toLocaleString('en-IN')} / person with Sharing Cab
                      </span>
                    ) : null}
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    <strong>Option 1 (Reserved):</strong> Dedicated private cab exclusively for your group, complete privacy, door-to-door hotel pickup, and flexible photo stops along scenic routes.
                    <br />
                    <strong>Option 2 (Sharing):</strong> Budget-conscious fixed mountain vehicle ({itinerary.sharingCab?.vehicleType || 'Tata Sumo / Bolero'}) operating on scheduled departure slots between taxi hubs.
                  </p>
                </div>
                {savingsTotal > 0 && (
                  <div className="bg-white border border-emerald-300 rounded-lg p-3 text-right shrink-0 min-w-[210px] shadow-2xs font-mono">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">Difference in Total Cost:</div>
                    <div className="text-base font-black text-emerald-800">
                      ₹{savingsTotal.toLocaleString('en-IN')} Less
                    </div>
                    <div className="text-[10px] text-slate-400">Total savings across {itinerary.adults + (itinerary.children || 0)} travelers</div>
                  </div>
                )}
              </div>
            </div>
            ) : isSharingOnly ? (
              /* SHARING ONLY SINGLE RATE CARD */
              <div className="border-2 border-amber-500/50 rounded-xl p-5 bg-amber-50/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-2 py-0.5 rounded font-mono">
                      Sharing Cab Facility
                    </span>
                    <span className="text-xs text-amber-800 font-semibold">Fixed Mountain Union Standard</span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900">
                    {itinerary.sharingCab.name || 'Option B: Sharing Cab Facility (Economical Shared Mountain Vehicle)'}
                  </h4>
                  <p className="text-xs text-slate-700">
                    Vehicle: <strong className="text-amber-900">{itinerary.sharingCab.vehicleType || 'Tata Sumo / Mahindra Bolero'}</strong>
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {itinerary.sharingCab.description || 'Seat allocation in shared Tata Sumo / Mahindra Bolero on scheduled departure slots between taxi hubs.'}
                  </p>
                  {itinerary.sharingCab.specificInclusions && itinerary.sharingCab.specificInclusions.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-2">
                      {itinerary.sharingCab.specificInclusions.map((inc, i) => (
                        <span key={i} className="text-[11px] bg-white border border-amber-200 text-amber-900 px-2 py-0.5 rounded flex items-center gap-1">
                          <Check className="w-3 h-3 text-amber-600" />
                          <span>{inc}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="bg-white p-4 rounded-xl border border-amber-300 min-w-[240px] text-right font-mono shrink-0 shadow-sm">
                  <div className="text-xs text-slate-500">Rate per Person:</div>
                  <div className="text-xl font-bold text-amber-800 tabular-nums">
                    ₹{itinerary.sharingCab.pricePerPerson.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Total Package Price:</div>
                  <div className="text-2xl font-black text-slate-900 tabular-nums">
                    ₹{itinerary.sharingCab.totalPackagePrice.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            ) : (
              /* RESERVED ONLY SINGLE RATE CARD */
              <div className="border-2 border-emerald-800/40 rounded-xl p-5 bg-emerald-50/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-mono">
                      Reserved Cab Facility
                    </span>
                    <span className="text-xs text-emerald-900 font-semibold">Private Dedicated Exclusive</span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900">
                    {itinerary.reservedCab.name || 'Option A: Reserved Cab Facility (Private Dedicated SUV)'}
                  </h4>
                  <p className="text-xs text-slate-700">
                    Vehicle: <strong className="text-emerald-900">{itinerary.reservedCab.vehicleType || 'Innova / Xylo'}</strong>
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {itinerary.reservedCab.description || 'Exclusive private SUV allocated strictly for your group from pickup to drop.'}
                  </p>
                  {itinerary.reservedCab.specificInclusions && itinerary.reservedCab.specificInclusions.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-2">
                      {itinerary.reservedCab.specificInclusions.map((inc, i) => (
                        <span key={i} className="text-[11px] bg-white border border-emerald-200 text-emerald-900 px-2 py-0.5 rounded flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>{inc}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="bg-white p-4 rounded-xl border border-emerald-300 min-w-[240px] text-right font-mono shrink-0 shadow-sm">
                  <div className="text-xs text-slate-500">Rate per Person:</div>
                  <div className="text-xl font-bold text-emerald-800 tabular-nums">
                    ₹{itinerary.reservedCab.pricePerPerson.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Total Package Price:</div>
                  <div className="text-2xl font-black text-slate-900 tabular-nums">
                    ₹{itinerary.reservedCab.totalPackagePrice.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Day-by-Day Comprehensive Itinerary with Predefined Destination Imagery */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
              Detailed Day-by-Day Tour Schedule
            </h3>

            <div className="space-y-5">
              {itinerary.days.map((day) => {
                const defaultDayImg = getDefaultDayImage(
                  itinerary.destination,
                  day.dayNumber,
                  day.title,
                  day.nightStay,
                  day.sightseeingHighlights
                );
                const dayImgUrl = day.imageUrl || defaultDayImg.url;
                const dayImgCaption = day.imageCaption || defaultDayImg.caption;

                return (
                  <div
                    key={day.id || day.dayNumber}
                    className="border border-slate-200 rounded-xl p-4 bg-white space-y-3 print-avoid-break hover:border-slate-300 transition-colors shadow-xs"
                    data-pdf-block="true"
                  >
                    <div className="grid grid-cols-12 gap-4 items-start">
                      {/* Left: Day Details */}
                      <div className="col-span-8 space-y-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <span className="w-7 h-7 rounded-md bg-emerald-800 text-white font-bold text-xs flex items-center justify-center shrink-0 font-mono">
                              D{day.dayNumber}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 leading-tight">
                              Day {day.dayNumber}{day.title ? `: ${day.title}` : ''}
                            </h4>
                          </div>
                          {day.date && (
                            <span className="text-[11px] font-mono text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded whitespace-nowrap flex items-center gap-1.5 font-medium shrink-0">
                              <Calendar className="w-3 h-3 text-emerald-700 shrink-0" />
                              <strong className="text-emerald-800">{getDayOfWeekAbbr(day.date)}</strong>
                              <span className="text-slate-400">·</span>
                              <span>{formatDateWithDayAbbr(day.date, 'suffix')}</span>
                            </span>
                          )}
                        </div>

                        {day.description ? (
                          <p className="text-xs text-slate-700 leading-relaxed text-left">
                            {day.description}
                          </p>
                        ) : null}

                        {/* Highlights Tags */}
                        {day.sightseeingHighlights && day.sightseeingHighlights.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-1">
                            <span className="text-[11px] font-semibold text-slate-600">Highlights:</span>
                            {day.sightseeingHighlights.map((hl, i) => (
                              <span
                                key={i}
                                className="text-[11px] text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded"
                              >
                                {hl}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Day Footer with Hotel Name, Night Stay, Meal Plan & Cab details */}
                        {(day.nightStay || day.hotelName || day.mealPlan || day.transportDetails) && (
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 flex-wrap gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              {day.hotelName && (
                                <div className="inline-flex items-center gap-1 font-semibold bg-emerald-50 text-emerald-900 px-2 py-0.5 rounded border border-emerald-200">
                                  <Building className="w-3 h-3 text-emerald-700 shrink-0" />
                                  <span>Hotel: {day.hotelName}</span>
                                </div>
                              )}
                              {day.nightStay && (
                                <>
                                  <span className="font-semibold text-slate-800">Night Stay:</span>
                                  <span className="text-emerald-800 font-semibold">{day.nightStay}</span>
                                </>
                              )}
                              {day.mealPlan && (
                                <>
                                  <span>·</span>
                                  <span className="font-semibold text-slate-800">Meal:</span>
                                  <span>{day.mealPlan}</span>
                                </>
                              )}
                            </div>

                            {day.transportDetails && (
                              <div className="text-slate-500 italic text-[10px]">
                                Cab: {day.transportDetails}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right: Predefined Day Sightseeing Image */}
                      <div className="col-span-4 shrink-0 w-full relative group">
                        <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shadow-xs">
                          <div className="h-32 w-full relative">
                            <img
                              src={dayImgUrl}
                              alt={day.title || `Day ${day.dayNumber} Sightseeing`}
                              className="w-full h-full object-cover"
                              crossOrigin="anonymous"
                            />
                            {/* Upload / Change Photo Overlay Button */}
                            {onUpdateItinerary && (
                              <button
                                type="button"
                                onClick={() => setImageModalTarget(day.dayNumber)}
                                className="no-print absolute top-1.5 right-1.5 bg-slate-900/85 hover:bg-slate-900 text-white text-[10px] font-semibold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 cursor-pointer border border-white/20 shadow-sm"
                                title="Upload custom photo or choose from library for this day"
                              >
                                <Upload className="w-2.5 h-2.5 text-emerald-400" />
                                <span>Upload / Change</span>
                              </button>
                            )}
                          </div>
                          <div className="p-1.5 bg-slate-50 text-[10px] text-slate-600 font-medium truncate flex items-center gap-1 border-t border-slate-100">
                            <MapPin className="w-3 h-3 text-emerald-700 shrink-0" />
                            <span className="truncate" title={dayImgCaption}>
                              {dayImgCaption}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 5: Inclusions & Exclusions */}
          <div className="grid grid-cols-2 gap-4 print-avoid-break" data-pdf-block="true">
            {/* Inclusions */}
            <div className="border border-emerald-600/30 rounded-xl p-4 bg-emerald-50/20 space-y-2">
              <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-700" />
                Package Inclusions
              </h4>
              <ul className="text-xs text-slate-700 space-y-1.5">
                {itinerary.commonInclusions.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5 leading-snug">
                    <span className="text-emerald-700 font-bold shrink-0">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Exclusions */}
            <div className="border border-rose-600/30 rounded-xl p-4 bg-rose-50/20 space-y-2">
              <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-700" />
                Package Exclusions
              </h4>
              <ul className="text-xs text-slate-700 space-y-1.5">
                {itinerary.commonExclusions.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5 leading-snug">
                    <span className="text-rose-700 font-bold shrink-0">✗</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Section 6: Destination Travel Advisories & Permits (Editable) */}
          <div className="border border-amber-300 rounded-xl p-4 bg-amber-50/40 space-y-3 print-avoid-break" data-pdf-block="true">
            <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
              <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-700" />
                <span>{getDestinationNotesTitle(itinerary.destination, itinerary.title)}</span>
              </h4>
              <div className="no-print flex items-center gap-2">
                {notesSaveNotice && (
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded animate-fade-in">
                    {notesSaveNotice}
                  </span>
                )}
                {!isEditingNotes ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingNotes(true)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-400 px-2.5 py-1 rounded-md transition-colors cursor-pointer shadow-xs"
                    title="Edit travel notes, add guidelines, or modify text before PDF export"
                  >
                    <Edit className="w-3 h-3 text-amber-800" />
                    <span>Edit Notes</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleResetNotesToDefault}
                      className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-900 bg-white border border-slate-300 px-2 py-0.5 rounded cursor-pointer"
                      title={`Reset to default ${destCategoryName} guidelines`}
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Defaults</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNotes}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-emerald-700 hover:bg-emerald-800 px-2.5 py-1 rounded-md transition-colors cursor-pointer shadow-xs"
                    >
                      <Check className="w-3 h-3" />
                      <span>Save Notes</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* View Mode (Default & Printable in PDF) */}
            {!isEditingNotes ? (
              <ul className="text-xs text-slate-700 space-y-1.5">
                {editableNotes.map((adv, i) => (
                  <li key={i} className="flex items-start gap-1.5 leading-snug">
                    <span className="text-amber-800 font-bold shrink-0">•</span>
                    <span>{adv}</span>
                  </li>
                ))}
              </ul>
            ) : (
              /* Edit Mode (Interactive inline note editor) */
              <div className="no-print space-y-2.5 pt-1">
                <p className="text-[11px] text-amber-900 font-medium">
                  ✏️ Edit any note directly, delete unwanted points, or add new destination guidelines. Click "Save Notes" when finished to preserve updates on the PDF.
                </p>
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {editableNotes.map((note, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 bg-white/90 p-2 rounded-lg border border-amber-300 shadow-xs"
                    >
                      <span className="text-amber-800 font-bold text-xs mt-1.5 shrink-0 font-mono">
                        #{i + 1}
                      </span>
                      <textarea
                        rows={2}
                        value={note}
                        onChange={(e) => handleUpdateNote(i, e.target.value)}
                        className="flex-1 bg-white border border-amber-200 focus:border-amber-500 rounded p-1.5 text-xs text-slate-800 focus:ring-0"
                      />
                      <div className="flex flex-col gap-1 shrink-0 pt-0.5">
                        <button
                          type="button"
                          onClick={() => handleMoveNote(i, 'up')}
                          disabled={i === 0}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                          title="Move Up"
                        >
                          <MoveUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveNote(i, 'down')}
                          disabled={i === editableNotes.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                          title="Move Down"
                        >
                          <MoveDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteNote(i)}
                          className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                          title="Delete Note"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Preset Note Chips (Dynamic per Destination) */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[10px]">
                  <span className="text-amber-900 font-semibold">Quick Add ({destCategoryName}):</span>
                  {getDestinationQuickAddNotes(itinerary.destination, itinerary.title).map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (!editableNotes.includes(chip.text)) {
                          setEditableNotes([...editableNotes, chip.text]);
                        }
                      }}
                      className="px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 font-medium cursor-pointer transition-colors"
                      title={chip.text}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* Add new note box */}
                <div className="flex items-center gap-2 pt-2 border-t border-amber-200">
                  <input
                    type="text"
                    value={newNoteInput}
                    onChange={(e) => setNewNoteInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNote();
                      }
                    }}
                    placeholder={`Type a new ${destCategoryName} guideline and click Add...`}
                    className="flex-1 bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddNote}
                    disabled={!newNoteInput.trim()}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-700 hover:bg-amber-800 disabled:opacity-40 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Note</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 7: Terms, Conditions, Bank Details & QR Code */}
          <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-4 print-avoid-break" data-pdf-block="true">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
              Booking Policy, Bank Details & Payment Schedule
            </h4>

            <div className="grid grid-cols-2 gap-6">
              {/* Terms & Conditions and Refund Policy */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="font-bold text-slate-900 text-xs block">
                    {getDestinationTermsTitle(itinerary.destination, itinerary.title)}:
                  </span>
                  <ul className="text-[11px] text-slate-600 space-y-1.5">
                    {termsToDisplay.map((term, i) => (
                      <li key={i} className="flex items-start gap-1.5 leading-snug">
                        <span className="text-slate-400 font-bold shrink-0">{i + 1}.</span>
                        <span>{term}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Explicit Cancellation & Refund Policy */}
                <div className="border border-rose-200/80 rounded-lg p-3 bg-rose-50/30 space-y-2">
                  <span className="font-bold text-rose-950 text-xs flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-700" />
                    Cancellation & Refund Policy:
                  </span>
                  <ul className="text-[11px] text-slate-700 space-y-1.5">
                    {cancellationToDisplay.map((rule, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 leading-snug">
                        <span className="text-rose-700 font-bold shrink-0">•</span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Milestones & Bank Details with QR */}
              <div className="space-y-3">
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-1.5">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                    Payment Schedule
                  </span>
                  {itinerary.paymentMilestones.map((m, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-700">{m.title}</span>
                      <span className="font-mono font-bold text-slate-900">
                        {m.percentage}% ({m.description})
                      </span>
                    </div>
                  ))}
                </div>

                {/* Bank Account & Payment QR Code Container */}
                <div className="border border-emerald-800/30 rounded-lg p-3 bg-emerald-50/40 text-[11px] space-y-2.5">
                  <div className="flex items-center justify-between border-b border-emerald-900/10 pb-1.5">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Bank Account & Instant UPI Payment</span>
                    </span>
                    <span className="text-[10px] text-emerald-800 font-medium">
                      Official Agency Account
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Left: Account details list */}
                    <div className="flex-1 space-y-1 text-slate-700 w-full">
                      <div className="flex justify-between sm:justify-start sm:gap-2">
                        <span className="text-slate-500 w-20 shrink-0">Bank:</span>
                        <span className="font-semibold text-slate-900">{companyProfile.bankName}</span>
                      </div>
                      <div className="flex justify-between sm:justify-start sm:gap-2">
                        <span className="text-slate-500 w-20 shrink-0">A/C Name:</span>
                        <span className="font-semibold text-slate-900">{companyProfile.accountName}</span>
                      </div>
                      <div className="flex justify-between sm:justify-start sm:gap-2">
                        <span className="text-slate-500 w-20 shrink-0">A/C Type:</span>
                        <span className="text-slate-800">{companyProfile.accountType || 'Current Account'}</span>
                      </div>
                      <div className="flex justify-between sm:justify-start sm:gap-2 font-mono">
                        <span className="text-slate-500 font-sans w-20 shrink-0">A/C No:</span>
                        <span className="font-bold text-slate-900 tracking-wider bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {companyProfile.accountNumber}
                        </span>
                      </div>
                      <div className="flex justify-between sm:justify-start sm:gap-2 font-mono">
                        <span className="text-slate-500 font-sans w-20 shrink-0">IFSC Code:</span>
                        <span className="font-semibold text-slate-900">
                          {companyProfile.ifscCode} <span className="font-sans text-[10px] text-slate-500">({companyProfile.branch})</span>
                        </span>
                      </div>
                      <div className="flex justify-between sm:justify-start sm:gap-2 font-mono pt-0.5">
                        <span className="text-slate-500 font-sans w-20 shrink-0">UPI ID:</span>
                        <span className="font-bold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                          {companyProfile.upiId}
                        </span>
                      </div>
                    </div>

                    {/* Right: Payment QR Code Card */}
                    <div className="shrink-0 flex flex-col items-center justify-center p-2 bg-white rounded-lg border border-emerald-600/30 shadow-xs text-center w-28">
                      {companyProfile.upiQrCodeUrl ? (
                        <img
                          src={companyProfile.upiQrCodeUrl}
                          alt="Scan to Pay via UPI"
                          className="w-20 h-20 object-contain mx-auto"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-slate-100 rounded flex flex-col items-center justify-center text-slate-400 p-1">
                          <QrCode className="w-6 h-6 mb-1 text-slate-400" />
                          <span className="text-[9px] text-slate-500 text-center leading-tight">No QR</span>
                        </div>
                      )}
                      <span className="text-[9px] font-bold text-slate-900 mt-1 block uppercase tracking-tight">
                        Scan & Pay Advance
                      </span>
                      <span className="text-[8px] text-slate-500 block leading-none">
                        GPay · PhonePe · Paytm
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 8: Signature & Agency Stamp Footer */}
          <div className="pt-6 border-t-2 border-slate-200 flex items-center justify-between text-xs text-slate-500 print-avoid-break" data-pdf-block="true">
            <div>
              <p className="font-semibold text-slate-900">{companyProfile.name}</p>
              <p className="text-[11px]">{companyProfile.website}</p>
              <p className="text-[10px] text-slate-400">Siliguri · Gangtok · Guwahati</p>
            </div>

            <div className="text-right">
              <div className="w-36 border-b border-slate-300 pb-1 mb-1 text-[10px] text-slate-400">
                Authorized Signature
              </div>
              <p className="text-[11px] font-bold text-slate-800">Tour Operations Desk</p>
              <p className="text-[10px] text-slate-500">North East Destinations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Image Upload & Selection Modal */}
      {imageModalTarget !== null && onUpdateItinerary && (() => {
        const isHero = imageModalTarget === 'hero';
        const dayTarget =
          typeof imageModalTarget === 'number'
            ? itinerary.days.find((d) => d.dayNumber === imageModalTarget)
            : null;
        const defaultHeroFallback = getDefaultDestinationCover(itinerary.destination, itinerary.title);
        const defaultDayFallback =
          typeof imageModalTarget === 'number'
            ? getDefaultDayImage(
                itinerary.destination,
                imageModalTarget,
                dayTarget?.title,
                dayTarget?.nightStay,
                dayTarget?.sightseeingHighlights
              )
            : null;

        return (
          <ImageUploadModal
            isOpen={true}
            title={
              isHero
                ? 'Destination Cover Photo (Upload / Library)'
                : `Day ${imageModalTarget} Sightseeing Photo`
            }
            subtitle={
              isHero
                ? 'Upload your own custom destination cover photo from your computer or pick from the curated gallery.'
                : `Upload custom tour photo for Day ${imageModalTarget}${dayTarget?.title ? ` (${dayTarget.title})` : ''} or pick from library.`
            }
            currentImageUrl={
              isHero
                ? itinerary.heroImageUrl || defaultHeroFallback.url
                : dayTarget?.imageUrl || defaultDayFallback?.url
            }
            currentCaption={
              isHero
                ? itinerary.heroImageCaption || defaultHeroFallback.caption
                : dayTarget?.imageCaption || defaultDayFallback?.caption
            }
            destinationContext={itinerary.destination}
            defaultFallback={isHero ? defaultHeroFallback : defaultDayFallback || undefined}
            onClose={() => setImageModalTarget(null)}
            onApply={(imgUrl, newCaption) => {
              if (isHero) {
                onUpdateItinerary({
                  ...itinerary,
                  heroImageUrl: imgUrl,
                  heroImageCaption: newCaption,
                });
              } else if (typeof imageModalTarget === 'number') {
                const updatedDays = itinerary.days.map((day) => {
                  if (day.dayNumber === imageModalTarget) {
                    return {
                      ...day,
                      imageUrl: imgUrl,
                      imageCaption: newCaption,
                    };
                  }
                  return day;
                });
                onUpdateItinerary({
                  ...itinerary,
                  days: updatedDays,
                });
              }
              setImageModalTarget(null);
            }}
          />
        );
      })()}
    </div>
  );
};
