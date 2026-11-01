import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  Save,
  Eye,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Sparkles,
  Car,
  Calendar,
  MapPin,
  Users,
  CheckCircle,
  ShieldAlert,
  Upload,
  RotateCcw,
  Building,
  DollarSign,
  FileText,
  FileUp,
  FileCheck,
  AlertCircle,
  QrCode,
  CreditCard,
  ExternalLink,
  Image as ImageIcon,
  Lock,
  Wallet,
  Award,
  CheckCircle2,
  TrendingUp,
  Percent,
  Globe,
  ChevronRight,
  ChevronLeft,
  Download,
  Check,
} from 'lucide-react';
import {
  defaultPackageExclusions,
  defaultPackageInclusions,
  defaultPaymentMilestones,
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
import {
  DestinationImage,
  getDefaultDestinationCover,
  getDefaultDayImage,
  getImagesForDestination,
  saveCustomDestinationImage,
  isNorthSikkimLocation,
  isNorthSikkimTour,
  NORTH_SIKKIM_COMPULSORY_MEAL_PLAN,
  NORTH_SIKKIM_DAY_MEAL_PLAN,
} from '../../data/destinationImages';
import {
  CompanyProfile,
  Itinerary,
  ItineraryDay,
  Lead,
  SalesPerson,
  FIXED_RESERVED_VEHICLES,
  FIXED_SHARING_VEHICLE,
} from '../../types';
import { DayCard } from './DayCard';
import { PoliciesSection } from './PoliciesSection';
import { FullViewSection } from './FullViewSection';
import { TextItineraryUploadModal } from './TextItineraryUploadModal';
import { ImageUploadModal } from '../common/ImageUploadModal';
import { SalesPersonSelect } from '../common/SalesPersonSelect';
import {
  getDayOfWeekAbbr,
  formatDateWithDayAbbr,
  addDaysToDate,
  calculateInclusiveDays,
} from '../../utils/dateUtils';
import { getDayMealPlanFromMasterPlan } from '../../utils/itineraryBuilderHelper';

interface ItineraryBuilderProps {
  initialItinerary?: Itinerary | null;
  leads?: Lead[];
  companyProfile: CompanyProfile;
  salesPersons: SalesPerson[];
  onSaveItinerary: (itinerary: Itinerary) => void;
  onPreviewItinerary: (itinerary: Itinerary) => void;
  onOpenTemplates: () => void;
  onUpdateLogo: (logoUrl: string) => void;
  onUpdateQrCode?: (qrUrl: string) => void;
  onOpenSettings?: () => void;
  onConvertItineraryToBooking?: (
    itinerary: Itinerary,
    advancePayload: {
      advanceAmount: number;
      paymentMode: 'upi' | 'net_banking' | 'cash' | 'credit_card' | 'cheque';
      paymentDate: string;
      referenceNumber: string;
      paymentNotes: string;
      salesPerson: string;
      sellingCost: number;
      packageCost: number;
    }
  ) => void;
  onQuickAddSalesPerson?: (name: string) => void;
  onOpenManageSalesTeam?: () => void;
  onNavigateToAccounts?: () => void;
  onUnbookItinerary?: (itineraryId: string, quoteNumber?: string) => void;
  onOpenAiCopilot?: (initialPrompt?: string) => void;
  onOpenVoucher?: (itinerary: Itinerary) => void;
}

export const ItineraryBuilder: React.FC<ItineraryBuilderProps> = ({
  initialItinerary,
  leads = [],
  companyProfile,
  salesPersons = [],
  onSaveItinerary,
  onPreviewItinerary,
  onOpenTemplates,
  onUpdateLogo,
  onUpdateQrCode,
  onOpenSettings,
  onConvertItineraryToBooking,
  onQuickAddSalesPerson,
  onOpenManageSalesTeam,
  onNavigateToAccounts,
  onUnbookItinerary,
  onOpenAiCopilot,
  onOpenVoucher,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);
  const [isTextUploadOpen, setIsTextUploadOpen] = useState(false);
  const [autofillNotice, setAutofillNotice] = useState<string | null>(null);

  // Section Navigation Tab State (1. Guest & Journey, 2. Tour Plan, 3. Cab Rates, 4. Policies & Refund, 5. Full View at the last)
  type BuilderSection = 'guest' | 'days' | 'rates' | 'policies' | 'full_view';
  const [activeSection, setActiveSection] = useState<BuilderSection>('guest');

  // Form State
  const [itineraryId, setItineraryId] = useState<string>(
    () => initialItinerary?.id || `itin-${Date.now()}`
  );
  const [quoteNumber, setQuoteNumber] = useState(
    initialItinerary?.quoteNumber || `NED-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [destination, setDestination] = useState(
    initialItinerary?.destination || ''
  );
  const [title, setTitle] = useState(
    initialItinerary?.title || ''
  );

  const initialCover = getDefaultDestinationCover(initialItinerary?.destination || '', initialItinerary?.title || '');
  const [heroImageUrl, setHeroImageUrl] = useState(
    initialItinerary?.heroImageUrl || initialCover.url
  );
  const [heroImageCaption, setHeroImageCaption] = useState(
    initialItinerary?.heroImageCaption || initialCover.caption
  );
  const [imageModalTarget, setImageModalTarget] = useState<'hero' | number | null>(null);

  const [leadId, setLeadId] = useState(initialItinerary?.leadId || '');
  const [guestName, setGuestName] = useState(initialItinerary?.guestName || '');
  const [guestPhone, setGuestPhone] = useState(initialItinerary?.guestPhone || '');
  const [guestEmail, setGuestEmail] = useState(initialItinerary?.guestEmail || '');
  const [guestCity, setGuestCity] = useState(initialItinerary?.guestCity || '');
  const [adults, setAdults] = useState(initialItinerary?.adults || 2);
  const [children, setChildren] = useState(initialItinerary?.children || 0);
  const [infants, setInfants] = useState(initialItinerary?.infants || 0);
  const [travelStartDate, setTravelStartDate] = useState(
    initialItinerary?.travelStartDate || ''
  );
  const [travelEndDate, setTravelEndDate] = useState(
    initialItinerary?.travelEndDate || ''
  );
  const [durationDays, setDurationDays] = useState(initialItinerary?.durationDays || 1);
  const [durationNights, setDurationNights] = useState(
    initialItinerary?.durationNights !== undefined ? initialItinerary.durationNights : 0
  );
  const [pickupLocation, setPickupLocation] = useState(
    initialItinerary?.pickupLocation || ''
  );
  const [dropLocation, setDropLocation] = useState(
    initialItinerary?.dropLocation || ''
  );
  const [hotelCategory, setHotelCategory] = useState(
    initialItinerary?.hotelCategory || 'Deluxe Category (3-Star Mountain View)'
  );
  const [mealPlan, setMealPlan] = useState(
    initialItinerary?.mealPlan || 'MAP (Daily Breakfast & Dinner)'
  );

  // 3 TYPES OF PACKAGE COST AS PER CAB: 'reserved' | 'sharing' | 'both'
  const [pricingMode, setPricingMode] = useState<'reserved' | 'sharing' | 'both'>(() => {
    const mode = initialItinerary?.pricingMode;
    if (mode === 'reserved' || (mode as any) === 'single') return 'reserved';
    if (mode === 'sharing') return 'sharing';
    return 'both';
  });

  // Reserved Cab facility (Fixed fleet: Innova / Xylo, Tata Sumo Reserved, Tempo Traveller, Small Cab Swift/WagonR)
  const [reservedCabName, setReservedCabName] = useState(
    initialItinerary?.reservedCab?.name ||
      'Option A: Reserved Cab Facility (Private Dedicated SUV)'
  );
  const [reservedCabVehicle, setReservedCabVehicle] = useState(
    initialItinerary?.reservedCab?.vehicleType || FIXED_RESERVED_VEHICLES[0].name
  );
  const [reservedCabDesc, setReservedCabDesc] = useState(
    initialItinerary?.reservedCab?.description ||
      'Exclusive private SUV allocated strictly for your group from pickup to drop. Complete comfort, flexibility, and hotel doorstep convenience.'
  );
  // Total Number of Travelers
  const totalPax = Math.max(1, (Number(adults) || 0) + (Number(children) || 0));

  const initialSelling =
    initialItinerary?.sellingCost !== undefined && initialItinerary.sellingCost > 0
      ? initialItinerary.sellingCost
      : initialItinerary?.reservedCab?.totalPackagePrice && initialItinerary.reservedCab.totalPackagePrice > 0
      ? initialItinerary.reservedCab.totalPackagePrice
      : 0;

  const initialPerPerson =
    initialItinerary?.reservedCab?.pricePerPerson && initialItinerary.reservedCab.pricePerPerson > 0
      ? initialItinerary.reservedCab.pricePerPerson
      : initialSelling > 0
      ? Math.round(initialSelling / totalPax)
      : 0;

  const initialPackage =
    initialItinerary?.packageCost !== undefined && initialItinerary.packageCost > 0
      ? initialItinerary.packageCost
      : 0;

  const [reservedPerPerson, setReservedPerPerson] = useState<number>(initialPerPerson);
  const [reservedTotal, setReservedTotal] = useState<number>(initialSelling);

  // Sharing Cab facility (Strictly fixed: Tata Sumo / Mahindra Bolero)
  const [sharingCabName, setSharingCabName] = useState(
    initialItinerary?.sharingCab?.name ||
      'Option B: Sharing Cab Facility (Economical Shared Mountain Vehicle)'
  );
  const [sharingCabVehicle, setSharingCabVehicle] = useState(
    initialItinerary?.sharingCab?.vehicleType || FIXED_SHARING_VEHICLE.name
  );
  const [sharingCabDesc, setSharingCabDesc] = useState(
    initialItinerary?.sharingCab?.description ||
      'Seat allocation in shared Tata Sumo / Mahindra Bolero between major transit stands on scheduled departure timings.'
  );
  const [sharingPerPerson, setSharingPerPerson] = useState<number>(() => {
    if (initialItinerary?.sharingCab?.pricePerPerson && initialItinerary.sharingCab.pricePerPerson > 0) {
      return initialItinerary.sharingCab.pricePerPerson;
    }
    return 0;
  });
  const [sharingTotal, setSharingTotal] = useState<number>(() => {
    if (initialItinerary?.sharingCab?.totalPackagePrice && initialItinerary.sharingCab.totalPackagePrice > 0) {
      return initialItinerary.sharingCab.totalPackagePrice;
    }
    return 0;
  });

  // CONFIDENTIAL ACCOUNTS & SALES PERSON ASSIGNMENT STATE
  const [salesPerson, setSalesPerson] = useState<string>(
    initialItinerary?.salesPerson || (salesPersons.length > 0 ? salesPersons[0].name : 'Rohit Sharma')
  );

  // Reserved Cab Accounting
  const [sellingCost, setSellingCost] = useState<number>(initialSelling);
  const [packageCost, setPackageCost] = useState<number>(initialPackage);
  const [markupPercentage, setMarkupPercentage] = useState<number>(() => {
    if (initialItinerary?.markupPercentage !== undefined && initialItinerary.markupPercentage > 0) {
      return initialItinerary.markupPercentage;
    }
    if (initialPackage > 0 && initialSelling > initialPackage) {
      return Math.round(((initialSelling - initialPackage) / initialPackage) * 100);
    }
    return 0;
  });

  // Sharing Cab Accounting (Dedicated separate calculation)
  const initialSharingSelling =
    initialItinerary?.sellingCostSharing !== undefined && initialItinerary.sellingCostSharing > 0
      ? initialItinerary.sellingCostSharing
      : initialItinerary?.sharingCab?.totalPackagePrice && initialItinerary.sharingCab.totalPackagePrice > 0
      ? initialItinerary.sharingCab.totalPackagePrice
      : 0;

  const initialSharingPackage =
    initialItinerary?.packageCostSharing !== undefined && initialItinerary.packageCostSharing > 0
      ? initialItinerary.packageCostSharing
      : 0;

  const [sharingSellingCost, setSharingSellingCost] = useState<number>(initialSharingSelling);
  const [sharingPackageCost, setSharingPackageCost] = useState<number>(initialSharingPackage);
  const [sharingMarkupPercentage, setSharingMarkupPercentage] = useState<number>(() => {
    if (initialItinerary?.markupPercentageSharing !== undefined && initialItinerary.markupPercentageSharing > 0) {
      return initialItinerary.markupPercentageSharing;
    }
    if (initialSharingPackage > 0 && initialSharingSelling > initialSharingPackage) {
      return Math.round(((initialSharingSelling - initialSharingPackage) / initialSharingPackage) * 100);
    }
    return 0;
  });

  const [selectedBookingOption, setSelectedBookingOption] = useState<'reserved' | 'sharing'>(
    initialItinerary?.selectedBookingOption || 'reserved'
  );

  const [autoSyncPackageWithDays, setAutoSyncPackageWithDays] = useState<boolean>(false);
  const [isConvertedToBooking, setIsConvertedToBooking] = useState<boolean>(
    initialItinerary?.tripStatus === 'upcoming' ||
      initialItinerary?.tripStatus === 'in_progress' ||
      initialItinerary?.tripStatus === 'completed'
  );

  // Advance Payment Flow states for direct conversion from Itinerary
  const [showConvertForm, setShowConvertForm] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState<number>(() =>
    initialSelling > 0 ? Math.round(initialSelling * 0.3) : 0
  );
  const [paymentMode, setPaymentMode] = useState<
    'upi' | 'net_banking' | 'cash' | 'credit_card' | 'cheque'
  >('upi');
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState(
    'Advance token payment received to lock booking'
  );
  const [bulkHotelMode, setBulkHotelMode] = useState<'per_night' | 'per_person'>('per_night');
  const [bulkHotelRate, setBulkHotelRate] = useState<string>('');
  const [bulkCabRate, setBulkCabRate] = useState<string>('');
  const [cabSyncOption, setCabSyncOption] = useState<boolean>(true);

  // Days list: blank day sections with default destination imagery
  const defaultDay1 = getDefaultDayImage(initialItinerary?.destination, 1);
  const [days, setDays] = useState<ItineraryDay[]>(
    initialItinerary?.days && initialItinerary.days.length > 0
      ? initialItinerary.days
      : [
          {
            id: `d1-${Date.now()}`,
            dayNumber: 1,
            title: '',
            description: '',
            sightseeingHighlights: [],
            nightStay: '',
            mealPlan: 'Breakfast & Dinner',
            transportDetails: '',
            imageUrl: defaultDay1.url,
            imageCaption: defaultDay1.caption,
            hotelName: '',
            hotelPricingMode: 'per_night',
            hotelCostPerNight: 0,
            hotelCostPerPerson: 0,
            roomCount: Math.max(1, Math.ceil(totalPax / 2)),
            hotelTotalCost: 0,
            transportCost: 0,
            activityCost: 0,
          },
        ]
  );

  // Inclusions & Exclusions: retain predefined default inclusions & exclusions
  const [commonInclusions, setCommonInclusions] = useState<string[]>(
    initialItinerary?.commonInclusions || defaultPackageInclusions
  );
  const [commonExclusions, setCommonExclusions] = useState<string[]>(
    initialItinerary?.commonExclusions || defaultPackageExclusions
  );

  // Special Advisories & Terms - Destination-aware initialization with cross-destination guard
  const initialDestCategory = getDestinationCategory(initialItinerary?.destination || '', initialItinerary?.title || '');
  const [specialAdvisories, setSpecialAdvisories] = useState<string[]>(() => {
    if (initialItinerary?.specialAdvisories && initialItinerary.specialAdvisories.length > 0) {
      if (initialDestCategory === 'andaman') {
        const text = initialItinerary.specialAdvisories.join(' ').toLowerCase();
        if (text.includes('nathula') || text.includes('sikkim') || text.includes('tsomgo') || text.includes('lachen')) {
          return getDestinationSpecialAdvisories(initialItinerary.destination, initialItinerary.title);
        }
      }
      return initialItinerary.specialAdvisories;
    }
    return getDestinationSpecialAdvisories(initialItinerary?.destination || '', initialItinerary?.title || '');
  });

  const [termsAndConditions, setTermsAndConditions] = useState<string[]>(() => {
    if (initialItinerary?.termsAndConditions && initialItinerary.termsAndConditions.length > 0) {
      if (initialDestCategory === 'andaman') {
        const text = initialItinerary.termsAndConditions.join(' ').toLowerCase();
        if (text.includes('sikkim') || text.includes('mountain roads') || text.includes('landslide')) {
          return getDestinationTermsAndConditions(initialItinerary.destination, initialItinerary.title);
        }
      }
      return initialItinerary.termsAndConditions;
    }
    return getDestinationTermsAndConditions(initialItinerary?.destination || '', initialItinerary?.title || '');
  });

  const [cancellationRefundPolicy, setCancellationRefundPolicy] = useState<string[]>(() => {
    if (initialItinerary?.cancellationRefundPolicy && initialItinerary.cancellationRefundPolicy.length > 0) {
      if (initialDestCategory === 'andaman') {
        const text = initialItinerary.cancellationRefundPolicy.join(' ').toLowerCase();
        if (text.includes('mountain roads') || text.includes('landslide')) {
          return getDestinationCancellationPolicy(initialItinerary.destination, initialItinerary.title);
        }
      }
      return initialItinerary.cancellationRefundPolicy;
    }
    return getDestinationCancellationPolicy(initialItinerary?.destination || '', initialItinerary?.title || '');
  });

  // Auto-detect North Sikkim circuit (Lachen, Lachung, Gurudongmar, Yumthang)
  const isNorthSikkimActive = useMemo(() => {
    return (
      isNorthSikkimTour(destination, title) ||
      days.some((d) => isNorthSikkimLocation(d.title, d.nightStay, d.description))
    );
  }, [destination, title, days]);

  // Auto-detect Andaman circuit
  const isAndamanTourActive = useMemo(() => {
    const q = `${destination} ${title}`.toLowerCase();
    return q.includes('andaman') || q.includes('port blair') || q.includes('havelock');
  }, [destination, title]);

  const handleEnforceNorthSikkimMeals = () => {
    setMealPlan(NORTH_SIKKIM_COMPULSORY_MEAL_PLAN);
    setDays((prev) =>
      prev.map((d) => {
        if (isNorthSikkimLocation(d.title, d.nightStay, d.description) || isNorthSikkimTour(destination, title)) {
          return {
            ...d,
            mealPlan: NORTH_SIKKIM_DAY_MEAL_PLAN,
          };
        }
        return d;
      })
    );
    setCommonInclusions((prev) => {
      const exists = prev.some(
        (inc) =>
          inc.toLowerCase().includes('all meals') || inc.toLowerCase().includes('compulsory all meals')
      );
      if (!exists) {
        return [
          'COMPULSORY ALL MEALS (AP Plan): Daily Breakfast, Lunch & Dinner included throughout North Sikkim as per regional tourism regulations',
          ...prev,
        ];
      }
      return prev;
    });
  };

  // Master Tour Meal Plan Handler: Cascades new meal plan to all days in Tour Plan section
  const handleMealPlanChange = (newPlan: string) => {
    setMealPlan(newPlan);

    // Update each day's meal plan in Tour Plan
    setDays((prev) =>
      prev.map((d, idx) => {
        const isDeparture = idx === prev.length - 1 || d.nightStay?.toLowerCase().includes('departure');
        return {
          ...d,
          mealPlan: getDayMealPlanFromMasterPlan(newPlan, isDeparture),
        };
      })
    );

    // Also synchronize package inclusions accommodation line
    setCommonInclusions((prev) => {
      let mealDesc = 'daily breakfast & dinner';
      const lower = newPlan.toLowerCase();
      if (lower.includes('ap') || lower.includes('all meals') || lower.includes('compulsory')) {
        mealDesc = 'all meals (daily breakfast, lunch & dinner)';
      } else if (lower.includes('cp') || lower.includes('breakfast only')) {
        mealDesc = 'daily breakfast only';
      } else if (lower.includes('ep') || lower.includes('room only')) {
        mealDesc = 'room only basis (no meals included)';
      }

      return prev.map((inc) => {
        const incLower = inc.toLowerCase();
        if (incLower.includes('accommodation') || incLower.includes('hotel category') || incLower.includes('sharing with')) {
          if (/with (daily breakfast & dinner|daily breakfast and dinner|all meals|daily breakfast only|room only)/gi.test(inc)) {
            return inc.replace(
              /with (daily breakfast & dinner|daily breakfast and dinner|all meals|daily breakfast only|room only)/gi,
              `with ${mealDesc}`
            );
          }
          return `${inc} (${newPlan})`;
        }
        return inc;
      });
    });

    setAutofillNotice(`✓ Updated Tour Meal Plan to "${newPlan}" across all ${days.length} days in Tour Plan!`);
    setTimeout(() => setAutofillNotice(null), 3500);
  };

  // Quick inputs
  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');

  // Handle Logo Upload directly on the builder
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
      onUpdateLogo(result);
    };
    reader.readAsDataURL(file);
  };

  // Handle Payment QR Code Upload directly on the builder
  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file for the Payment QR code (PNG, JPG, SVG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      onUpdateQrCode?.(result);
    };
    reader.readAsDataURL(file);
  };

  // Sync internal state if initialItinerary prop changes externally (e.g. AI bot applied updates, template loaded, lead switched)
  const prevItinKeyRef = useRef<string | null>(
    initialItinerary
      ? `${initialItinerary.id}-${initialItinerary.quoteNumber}-${initialItinerary.destination}-${initialItinerary.durationDays}-${initialItinerary.sellingCost || ''}-${initialItinerary.days?.length || 0}-${initialItinerary.updatedAt || ''}`
      : null
  );

  useEffect(() => {
    if (!initialItinerary) return;
    const currentKey = `${initialItinerary.id}-${initialItinerary.quoteNumber}-${initialItinerary.destination}-${initialItinerary.durationDays}-${initialItinerary.sellingCost || ''}-${initialItinerary.days?.length || 0}-${initialItinerary.updatedAt || ''}`;
    if (currentKey !== prevItinKeyRef.current) {
      prevItinKeyRef.current = currentKey;
      if (initialItinerary.id) {
        setItineraryId(initialItinerary.id);
      }
      setQuoteNumber(initialItinerary.quoteNumber || '');
      setDestination(initialItinerary.destination || '');
      setTitle(initialItinerary.title || '');
      setHeroImageUrl(initialItinerary.heroImageUrl || '');
      setHeroImageCaption(initialItinerary.heroImageCaption || '');
      setLeadId(initialItinerary.leadId || '');
      setGuestName(initialItinerary.guestName || '');
      setGuestPhone(initialItinerary.guestPhone || '');
      setGuestEmail(initialItinerary.guestEmail || '');
      setGuestCity(initialItinerary.guestCity || '');
      setAdults(initialItinerary.adults || 2);
      setChildren(initialItinerary.children || 0);
      setInfants(initialItinerary.infants || 0);
      setTravelStartDate(initialItinerary.travelStartDate || '');
      setTravelEndDate(initialItinerary.travelEndDate || '');
      setDurationDays(initialItinerary.durationDays || initialItinerary.days?.length || 1);
      setDurationNights(
        initialItinerary.durationNights !== undefined
          ? initialItinerary.durationNights
          : Math.max(0, (initialItinerary.durationDays || 1) - 1)
      );
      setPickupLocation(initialItinerary.pickupLocation || '');
      setDropLocation(initialItinerary.dropLocation || '');
      setHotelCategory(initialItinerary.hotelCategory || 'Deluxe Category (3-Star Mountain View)');
      setMealPlan(initialItinerary.mealPlan || 'MAP (Daily Breakfast & Dinner)');
      if (initialItinerary.pricingMode) {
        if (initialItinerary.pricingMode === 'reserved' || (initialItinerary.pricingMode as any) === 'single') {
          setPricingMode('reserved');
        } else if (initialItinerary.pricingMode === 'sharing') {
          setPricingMode('sharing');
        } else {
          setPricingMode('both');
        }
      }

      if (initialItinerary.reservedCab) {
        setReservedCabName(initialItinerary.reservedCab.name || 'Option A: Reserved Cab Facility (Private Dedicated SUV)');
        setReservedCabVehicle(initialItinerary.reservedCab.vehicleType || FIXED_RESERVED_VEHICLES[0].name);
        setReservedCabDesc(initialItinerary.reservedCab.description || '');
      }

      if (initialItinerary.sharingCab) {
        setSharingCabName(initialItinerary.sharingCab.name || 'Option B: Sharing Cab Facility (Economical Shared Mountain Vehicle)');
        setSharingCabVehicle(initialItinerary.sharingCab.vehicleType || FIXED_SHARING_VEHICLE.name);
        setSharingCabDesc(initialItinerary.sharingCab.description || '');
      }

      const currentPax = Math.max(1, (initialItinerary.adults || 2) + (initialItinerary.children || 0));
      const selling = initialItinerary.sellingCost || initialItinerary.reservedCab?.totalPackagePrice || 0;
      const pkg = initialItinerary.packageCost || 0;
      setSellingCost(selling);
      setPackageCost(pkg);
      setReservedTotal(selling);
      setReservedPerPerson(initialItinerary.reservedCab?.pricePerPerson || (selling > 0 ? Math.round(selling / currentPax) : 0));
      if (pkg > 0 && selling > pkg) {
        setMarkupPercentage(Math.round(((selling - pkg) / pkg) * 100));
      } else if (initialItinerary.markupPercentage) {
        setMarkupPercentage(initialItinerary.markupPercentage);
      }

      const sharingSell = initialItinerary.sellingCostSharing || initialItinerary.sharingCab?.totalPackagePrice || 0;
      const sharingPkg = initialItinerary.packageCostSharing || 0;
      setSharingSellingCost(sharingSell);
      setSharingPackageCost(sharingPkg);
      setSharingTotal(sharingSell);
      setSharingPerPerson(initialItinerary.sharingCab?.pricePerPerson || (sharingSell > 0 ? Math.round(sharingSell / currentPax) : 0));
      if (sharingPkg > 0 && sharingSell > sharingPkg) {
        setSharingMarkupPercentage(Math.round(((sharingSell - sharingPkg) / sharingPkg) * 100));
      } else if (initialItinerary.markupPercentageSharing) {
        setSharingMarkupPercentage(initialItinerary.markupPercentageSharing);
      }

      if (initialItinerary.days && initialItinerary.days.length > 0) {
        setDays(
          initialItinerary.days.map((d, i) => ({
            ...d,
            id: d.id || `day-${initialItinerary.id}-${i + 1}-${Date.now()}`,
            dayNumber: d.dayNumber || i + 1,
          }))
        );
      }
      if (initialItinerary.commonInclusions) setCommonInclusions(initialItinerary.commonInclusions);
      if (initialItinerary.commonExclusions) setCommonExclusions(initialItinerary.commonExclusions);
      if (initialItinerary.specialAdvisories) setSpecialAdvisories(initialItinerary.specialAdvisories);
      if (initialItinerary.termsAndConditions) setTermsAndConditions(initialItinerary.termsAndConditions);
      if (initialItinerary.cancellationRefundPolicy) setCancellationRefundPolicy(initialItinerary.cancellationRefundPolicy);
      if (initialItinerary.salesPerson) setSalesPerson(initialItinerary.salesPerson);
    }
  }, [initialItinerary]);

  // Day-wise Computed Aggregates
  const computedDayCosts = useMemo(() => {
    let totalTransport = 0;
    let totalHotel = 0;
    let totalActivities = 0;

    days.forEach((day) => {
      totalTransport += Number(day.transportCost) || 0;

      const roomCount = day.roomCount || Math.max(1, Math.ceil(totalPax / 2));
      const hotelCost =
        day.hotelTotalCost !== undefined && day.hotelTotalCost > 0
          ? Number(day.hotelTotalCost)
          : day.hotelPricingMode === 'per_person' && (Number(day.hotelCostPerPerson) || 0) > 0
          ? (Number(day.hotelCostPerPerson) || 0) * totalPax
          : (Number(day.hotelCostPerNight) || 0) * roomCount;
      totalHotel += hotelCost;

      totalActivities += Number(day.activityCost) || 0;
    });

    const totalComputedPackageCost = totalTransport + totalHotel + totalActivities;

    return {
      totalTransport,
      totalHotel,
      totalActivities,
      totalComputedPackageCost,
    };
  }, [days, totalPax]);

  const prevComputedDayCostRef = useRef<number>(computedDayCosts.totalComputedPackageCost);

  // Auto-sync day-wise itinerary costs into Package Cost, Selling Cost, and Rate Quotation (only if user explicitly opts in)
  useEffect(() => {
    if (autoSyncPackageWithDays && computedDayCosts.totalComputedPackageCost > 0) {
      if (computedDayCosts.totalComputedPackageCost !== prevComputedDayCostRef.current) {
        prevComputedDayCostRef.current = computedDayCosts.totalComputedPackageCost;
        const newPkg = computedDayCosts.totalComputedPackageCost;
        setPackageCost(newPkg);
        const newSelling =
          markupPercentage > 0
            ? Math.round(newPkg * (1 + markupPercentage / 100))
            : newPkg;
        setSellingCost(newSelling);
        setReservedTotal(newSelling);
        setReservedPerPerson(Math.round(newSelling / totalPax));
      }
    } else if (computedDayCosts.totalComputedPackageCost === 0) {
      prevComputedDayCostRef.current = 0;
    }
  }, [computedDayCosts.totalComputedPackageCost, autoSyncPackageWithDays, totalPax]);

  // When total travelers (adults/children) count changes, update per-person prices
  const prevPaxRef = useRef<number>(totalPax);
  useEffect(() => {
    if (totalPax !== prevPaxRef.current) {
      prevPaxRef.current = totalPax;
      if (sellingCost > 0) {
        setReservedPerPerson(Math.round(sellingCost / totalPax));
      }
      if (sharingTotal > 0) {
        setSharingPerPerson(Math.round(sharingTotal / totalPax));
      }
    }
  }, [totalPax, sellingCost, sharingTotal]);

  // 1. Changing Rate Quotation Rate / Person (Reserved Cab)
  const handleReservedPerPersonChange = (perPerson: number) => {
    setReservedPerPerson(perPerson);
    const newTotal = Math.round(perPerson * totalPax);
    setReservedTotal(newTotal);
    setSellingCost(newTotal);
    if (packageCost > 0) {
      const profit = newTotal - packageCost;
      setMarkupPercentage(Math.round((profit / packageCost) * 100));
    }
  };

  // 2. Changing Rate Quotation Total Package (Reserved Cab)
  const handleReservedTotalChange = (total: number) => {
    setReservedTotal(total);
    setSellingCost(total);
    setReservedPerPerson(Math.round(total / totalPax));
    if (packageCost > 0) {
      const profit = total - packageCost;
      setMarkupPercentage(Math.round((profit / packageCost) * 100));
    }
  };

  // 3. Changing Selling Cost (Quoted to Guest - Reserved Cab)
  const handleSellingCostChange = (newSelling: number) => {
    setSellingCost(newSelling);
    setReservedTotal(newSelling);
    setReservedPerPerson(Math.round(newSelling / totalPax));
    if (packageCost > 0) {
      const profit = newSelling - packageCost;
      setMarkupPercentage(Math.round((profit / packageCost) * 100));
    }
  };

  // 4. Changing Selling Cost Per Person (Reserved Cab)
  const handleSellingPerPersonChange = (newPerPerson: number) => {
    const newSelling = Math.round(newPerPerson * totalPax);
    handleSellingCostChange(newSelling);
  };

  // 5. Changing Profit Amount Data Directly (User Request: Selling Cost - Package Cost = Profit, manually adjustable)
  const handleProfitAmountChange = (newProfit: number) => {
    const newSelling = Math.max(0, packageCost + newProfit);
    setSellingCost(newSelling);
    setReservedTotal(newSelling);
    setReservedPerPerson(Math.round(newSelling / totalPax));
    if (packageCost > 0) {
      setMarkupPercentage(Math.round((newProfit / packageCost) * 100));
    }
  };

  // 6. Changing Markup % (Reserved Cab)
  const handleMarkupChange = (newMarkup: number) => {
    setMarkupPercentage(newMarkup);
    if (packageCost > 0) {
      const newSelling = Math.round(packageCost * (1 + newMarkup / 100));
      setSellingCost(newSelling);
      setReservedTotal(newSelling);
      setReservedPerPerson(Math.round(newSelling / totalPax));
    }
  };

  // 7. Changing Package Cost (Internal Buying Cost - Reserved Cab)
  // USER REQUIREMENT: Manual input, Profit is Selling Cost - Package Cost
  const handlePackageCostChange = (newPackageCost: number) => {
    setPackageCost(newPackageCost);
    if (newPackageCost > 0 && sellingCost > 0) {
      const profit = sellingCost - newPackageCost;
      setMarkupPercentage(Math.round((profit / newPackageCost) * 100));
    }
  };

  // 8. Changing Package Cost Per Person (Reserved Cab)
  const handlePackagePerPersonChange = (newPerPerson: number) => {
    const newPkg = Math.round(newPerPerson * totalPax);
    handlePackageCostChange(newPkg);
  };

  // --------------------------------------------------------------------------
  // SHARING CAB ACCOUNTING HANDLERS (Dedicated separate calculation)
  // --------------------------------------------------------------------------

  // 9. Changing Sharing Cab Rate / Person
  const handleSharingPerPersonChange = (perPerson: number) => {
    setSharingPerPerson(perPerson);
    const newTotal = Math.round(perPerson * totalPax);
    setSharingTotal(newTotal);
    setSharingSellingCost(newTotal);
    if (sharingPackageCost > 0) {
      const profit = newTotal - sharingPackageCost;
      setSharingMarkupPercentage(Math.round((profit / sharingPackageCost) * 100));
    }
  };

  // 10. Changing Sharing Cab Total Package (Selling Price)
  const handleSharingTotalChange = (total: number) => {
    setSharingTotal(total);
    setSharingSellingCost(total);
    setSharingPerPerson(Math.round(total / totalPax));
    if (sharingPackageCost > 0) {
      const profit = total - sharingPackageCost;
      setSharingMarkupPercentage(Math.round((profit / sharingPackageCost) * 100));
    }
  };

  // 11. Changing Sharing Cab Selling Cost
  const handleSharingSellingCostChange = (newSelling: number) => {
    setSharingSellingCost(newSelling);
    setSharingTotal(newSelling);
    setSharingPerPerson(Math.round(newSelling / totalPax));
    if (sharingPackageCost > 0) {
      const profit = newSelling - sharingPackageCost;
      setSharingMarkupPercentage(Math.round((profit / sharingPackageCost) * 100));
    }
  };

  // 12. Changing Sharing Package Cost (Buying Cost)
  const handleSharingPackageCostChange = (newPackageCost: number) => {
    setSharingPackageCost(newPackageCost);
    if (newPackageCost > 0 && (sharingSellingCost > 0 || sharingTotal > 0)) {
      const currentSelling = sharingSellingCost || sharingTotal;
      const profit = currentSelling - newPackageCost;
      setSharingMarkupPercentage(Math.round((profit / newPackageCost) * 100));
    }
  };

  // 13. Changing Sharing Profit Amount Directly
  const handleSharingProfitAmountChange = (newProfit: number) => {
    const newSelling = Math.max(0, sharingPackageCost + newProfit);
    setSharingSellingCost(newSelling);
    setSharingTotal(newSelling);
    setSharingPerPerson(Math.round(newSelling / totalPax));
    if (sharingPackageCost > 0) {
      setSharingMarkupPercentage(Math.round((newProfit / sharingPackageCost) * 100));
    }
  };

  // 14. Changing Sharing Markup %
  const handleSharingMarkupChange = (newMarkup: number) => {
    setSharingMarkupPercentage(newMarkup);
    if (sharingPackageCost > 0) {
      const newSelling = Math.round(sharingPackageCost * (1 + newMarkup / 100));
      setSharingSellingCost(newSelling);
      setSharingTotal(newSelling);
      setSharingPerPerson(Math.round(newSelling / totalPax));
    }
  };

  // Quick Auto-estimate Sharing Rate (~30% lower than Reserved Dedicated Cab)
  const handleAutoEstimateSharingFromReserved = () => {
    if (packageCost <= 0 && sellingCost <= 0) {
      setAutofillNotice('Notice: Please enter Reserved Cab Buying or Selling cost first to auto-estimate Sharing.');
      setTimeout(() => setAutofillNotice(null), 3500);
      return;
    }
    const estimatedSharingPkg = Math.round((packageCost || 0) * 0.70);
    const estimatedSharingSelling = Math.round((sellingCost || 0) * 0.70);
    setSharingPackageCost(estimatedSharingPkg);
    setSharingSellingCost(estimatedSharingSelling);
    setSharingTotal(estimatedSharingSelling);
    setSharingPerPerson(Math.round(estimatedSharingSelling / totalPax));
    if (estimatedSharingPkg > 0) {
      const profit = estimatedSharingSelling - estimatedSharingPkg;
      setSharingMarkupPercentage(Math.round((profit / estimatedSharingPkg) * 100));
    }
    setAutofillNotice('✓ Auto-estimated Sharing Rates (~30% lower than Reserved Cab).');
    setTimeout(() => setAutofillNotice(null), 3500);
  };

  // Manual trigger to re-sync package cost from day-wise items
  const handleSyncPackageCostFromDays = () => {
    if (computedDayCosts.totalComputedPackageCost > 0) {
      setAutoSyncPackageWithDays(true);
      handlePackageCostChange(computedDayCosts.totalComputedPackageCost);
      setAutofillNotice(
        `✓ Synced Package Cost to ₹${computedDayCosts.totalComputedPackageCost.toLocaleString('en-IN')} based on Day-wise Transport (₹${computedDayCosts.totalTransport.toLocaleString('en-IN')}) and Hotels (₹${computedDayCosts.totalHotel.toLocaleString('en-IN')}).`
      );
    } else {
      setAutofillNotice(
        'Notice: Day-wise costs are currently ₹0. Please enter transportation or hotel costs in the day sections below.'
      );
    }
  };

  // Compile full itinerary object
  const buildCurrentItinerary = (): Itinerary => {
    const effectiveSelling = Number(sellingCost) > 0 ? Number(sellingCost) : Number(reservedTotal) || 0;
    const effectiveSharingSelling = Number(sharingSellingCost) > 0 ? Number(sharingSellingCost) : Number(sharingTotal) || 0;

    return {
      id: itineraryId || initialItinerary?.id || `itin-${Date.now()}`,
      quoteNumber: quoteNumber.trim(),
      title: title.trim(),
      destination: destination.trim(),
      heroImageUrl,
      heroImageCaption,
      leadId: leadId || undefined,
      guestName: guestName.trim() || 'Valued Guest',
      guestPhone: guestPhone.trim(),
      guestEmail: guestEmail.trim(),
      guestCity: guestCity.trim(),
      adults: Number(adults),
      children: Number(children),
      infants: Number(infants),
      travelStartDate,
      travelEndDate,
      durationDays: Number(durationDays),
      durationNights: Number(durationNights),
      pickupLocation: pickupLocation.trim(),
      dropLocation: dropLocation.trim(),
      hotelCategory,
      mealPlan,
      pricingMode,
      reservedCab: {
        enabled: pricingMode === 'reserved' || pricingMode === 'both',
        name: reservedCabName,
        vehicleType: reservedCabVehicle,
        description: reservedCabDesc,
        pricePerPerson: Number(reservedPerPerson) || (effectiveSelling > 0 ? Math.round(effectiveSelling / totalPax) : 0),
        totalPackagePrice: effectiveSelling,
        gstPercentage: 0,
        gstIncluded: true,
        specificInclusions:
          initialItinerary?.reservedCab?.specificInclusions && initialItinerary.reservedCab.specificInclusions.length > 0
            ? initialItinerary.reservedCab.specificInclusions
            : [
                `Exclusive private ${reservedCabVehicle} allocated for your tour party only`,
                'Hotel porch door-to-door pickup & drop for all excursions',
                'Flexible photo stops along river and mountain valley view points',
                'Driver allowance, hill fuel, inter-state permit tax, and parking included',
              ],
        specificExclusions:
          initialItinerary?.reservedCab?.specificExclusions && initialItinerary.reservedCab.specificExclusions.length > 0
            ? initialItinerary.reservedCab.specificExclusions
            : [
                'Zero Point / Katao vehicle supplement if booked on spot',
                'Vehicle not on disposal for unannounced personal night outings',
              ],
      },
      sharingCab: {
        enabled: pricingMode === 'sharing' || pricingMode === 'both',
        name: sharingCabName,
        vehicleType: FIXED_SHARING_VEHICLE.name,
        description: sharingCabDesc,
        pricePerPerson: Number(sharingPerPerson) || (effectiveSharingSelling > 0 ? Math.round(effectiveSharingSelling / totalPax) : 0),
        totalPackagePrice: effectiveSharingSelling,
        gstPercentage: 0,
        gstIncluded: true,
        specificInclusions:
          initialItinerary?.sharingCab?.specificInclusions && initialItinerary.sharingCab.specificInclusions.length > 0
            ? initialItinerary.sharingCab.specificInclusions
            : [
                'Seat allocation in shared Tata Sumo / Mahindra Bolero on scheduled departure slots',
                'Standard route transfers between designated taxi hub terminals',
                'All driver mountain allowances and route toll taxes',
              ],
        specificExclusions:
          initialItinerary?.sharingCab?.specificExclusions && initialItinerary.sharingCab.specificExclusions.length > 0
            ? initialItinerary.sharingCab.specificExclusions
            : [
                'Local small taxi from terminal stand to interior uphill hotel',
                'Luggage exceeding standard 1 trolley bag per person',
              ],
      },
      days: days.map((d, idx) => ({
        ...d,
        dayNumber: idx + 1,
      })),
      commonInclusions,
      commonExclusions,
      specialAdvisories,
      termsAndConditions,
      cancellationRefundPolicy,
      paymentMilestones:
        initialItinerary?.paymentMilestones && initialItinerary.paymentMilestones.length > 0
          ? initialItinerary.paymentMilestones
          : defaultPaymentMilestones,
      salesPerson: salesPerson.trim(),
      sellingCost: effectiveSelling,
      packageCost: Number(packageCost) || 0,
      markupPercentage: Number(markupPercentage) || 0,
      sellingCostSharing: effectiveSharingSelling,
      packageCostSharing: Number(sharingPackageCost) || 0,
      markupPercentageSharing: Number(sharingMarkupPercentage) || 0,
      selectedBookingOption,
      totalTransportCost: computedDayCosts.totalTransport,
      totalHotelCost: computedDayCosts.totalHotel,
      totalActivitiesCost: computedDayCosts.totalActivities,
      packageCostPerPerson: Math.round((Number(packageCost) || 0) / totalPax),
      sellingCostPerPerson: Math.round(effectiveSelling / totalPax),
      tripStatus: isConvertedToBooking ? 'upcoming' : undefined,
      voucherIssued: initialItinerary?.voucherIssued,
      voucherIssuedAt: initialItinerary?.voucherIssuedAt,
      voucherNumber: initialItinerary?.voucherNumber,
      createdAt: initialItinerary?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const handleSave = () => {
    if (!guestName.trim()) {
      setAutofillNotice('⚠️ Please enter the guest name before saving the quote.');
      return;
    }
    const itin = buildCurrentItinerary();
    const savedKey = `${itin.id}-${itin.quoteNumber}-${itin.destination}-${itin.durationDays}-${itin.sellingCost || ''}-${itin.days?.length || 0}-${itin.updatedAt || ''}`;
    prevItinKeyRef.current = savedKey;
    onSaveItinerary(itin);
    setAutofillNotice(`✓ Successfully saved changes to Quote #${itin.quoteNumber}!`);
    setTimeout(() => setAutofillNotice(null), 3500);
  };

  const handlePreview = () => {
    const itin = buildCurrentItinerary();
    const savedKey = `${itin.id}-${itin.quoteNumber}-${itin.destination}-${itin.durationDays}-${itin.sellingCost || ''}-${itin.days?.length || 0}-${itin.updatedAt || ''}`;
    prevItinKeyRef.current = savedKey;
    onPreviewItinerary(itin);
  };

  // Convert Itinerary directly to confirmed booking in Accounts
  const handleConvertBooking = () => {
    if (!guestName.trim()) {
      setAutofillNotice('⚠️ Please enter the guest name before confirming the booking.');
      return;
    }

    const itin = buildCurrentItinerary();
    const finalSelling =
      selectedBookingOption === 'sharing'
        ? (Number(sharingSellingCost) || Number(sharingTotal) || 0)
        : Number(sellingCost);
    const finalPackage =
      selectedBookingOption === 'sharing'
        ? (Number(sharingPackageCost) || 0)
        : Number(packageCost);

    const updatedItin: Itinerary = {
      ...itin,
      salesPerson: salesPerson.trim(),
      sellingCost: Number(sellingCost),
      packageCost: Number(packageCost),
      sellingCostSharing: Number(sharingSellingCost) || Number(sharingTotal) || 0,
      packageCostSharing: Number(sharingPackageCost) || 0,
      selectedBookingOption,
      tripStatus: 'upcoming',
      updatedAt: new Date().toISOString(),
    };
    onSaveItinerary(updatedItin);

    if (onConvertItineraryToBooking) {
      onConvertItineraryToBooking(updatedItin, {
        advanceAmount: Number(advanceAmount) || 0,
        paymentMode,
        paymentDate,
        referenceNumber: paymentReference.trim() || `ADV-${Date.now().toString().slice(-6)}`,
        paymentNotes:
          paymentNotes.trim() ||
          `Advance booking deposit received (${
            selectedBookingOption === 'sharing' ? 'Sharing Cab Option' : 'Reserved Cab Option'
          })`,
        salesPerson: salesPerson.trim(),
        sellingCost: Number(finalSelling),
        packageCost: Number(finalPackage),
      });
    }

    setIsConvertedToBooking(true);
    setShowConvertForm(false);
  };

  const handleRevertBooking = () => {
    if (
      window.confirm(
        'Are you sure you want to unbook this tour? This will cancel the booking status, remove this trip from the Accounts balance sheet ledger, and return the quote to active follow-up.'
      )
    ) {
      setIsConvertedToBooking(false);
      setShowConvertForm(false);
      const itin = buildCurrentItinerary();
      const revertedItin = { ...itin, tripStatus: undefined };
      onSaveItinerary(revertedItin);
      if (onUnbookItinerary) {
        onUnbookItinerary(revertedItin.id, revertedItin.quoteNumber);
      }
      setAutofillNotice('✓ Booking reverted to quotation and purged from Accounts balance sheet.');
    }
  };

  // Auto-calculate travel end date and synchronize day dates when start date changes
  // Auto-calculate travel end date and synchronize day dates when start date changes
  const handleStartDateChange = useCallback((newStartDate: string) => {
    setTravelStartDate(newStartDate);
    if (newStartDate && days.length > 0) {
      const computedEnd = addDaysToDate(newStartDate, days.length - 1);
      setTravelEndDate(computedEnd);
      // Synchronize dates across all days
      setDays((prev) =>
        prev.map((d, idx) => ({
          ...d,
          date: addDaysToDate(newStartDate, idx),
        }))
      );
    }
  }, [days.length]);

  const handleEndDateChange = useCallback((newEndDate: string) => {
    setTravelEndDate(newEndDate);
    if (travelStartDate && newEndDate) {
      const calculatedDays = calculateInclusiveDays(travelStartDate, newEndDate);
      if (calculatedDays > 0) {
        setDurationDays(calculatedDays);
        setDurationNights(Math.max(1, calculatedDays - 1));
        // Keep days array length and dates in exact synchronization with duration
        setDays((prev) => {
          if (calculatedDays === prev.length) {
            return prev.map((d, i) => ({
              ...d,
              date: addDaysToDate(travelStartDate, i),
            }));
          }
          if (calculatedDays > prev.length) {
            const added: ItineraryDay[] = [];
            for (let i = prev.length; i < calculatedDays; i++) {
              const dayNum = i + 1;
              const defaultImg = getDefaultDayImage(destination, dayNum);
              added.push({
                id: `day-${Date.now()}-${dayNum}`,
                dayNumber: dayNum,
                date: addDaysToDate(travelStartDate, i),
                title: '',
                description: '',
                sightseeingHighlights: [],
                nightStay: '',
                mealPlan: 'Breakfast & Dinner',
                transportDetails: '',
                hotelName: '',
                hotelPricingMode: 'per_night',
                hotelCostPerNight: 0,
                hotelCostPerPerson: 0,
                roomCount: Math.max(1, Math.ceil(totalPax / 2)),
                hotelTotalCost: 0,
                transportCost: 0,
                transportVehicle: reservedCabVehicle || 'Dedicated Vehicle',
                activityCost: 0,
                imageUrl: defaultImg.url,
                imageCaption: defaultImg.caption,
              });
            }
            return [...prev, ...added].map((d, i) => ({
              ...d,
              dayNumber: i + 1,
              date: addDaysToDate(travelStartDate, i),
            }));
          }
          // calculatedDays < prev.length
          return prev.slice(0, calculatedDays).map((d, i) => ({
            ...d,
            dayNumber: i + 1,
            date: addDaysToDate(travelStartDate, i),
          }));
        });
      }
    }
  }, [travelStartDate, destination, totalPax, reservedCabVehicle]);

  // Day modification helpers with automatic end date and day dates update
  const handleAddDay = useCallback(() => {
    setDays((prev) => {
      const nextNum = prev.length + 1;
      const nextDate = travelStartDate ? addDaysToDate(travelStartDate, nextNum - 1) : '';
      const defaultImg = getDefaultDayImage(destination, nextNum);
      const newDay: ItineraryDay = {
        id: `day-${Date.now()}-${nextNum}`,
        dayNumber: nextNum,
        date: nextDate,
        title: '',
        description: '',
        sightseeingHighlights: [],
        nightStay: '',
        mealPlan: 'Breakfast & Dinner',
        transportDetails: '',
        hotelName: '',
        hotelPricingMode: 'per_night',
        hotelCostPerNight: 0,
        hotelCostPerPerson: 0,
        roomCount: Math.max(1, Math.ceil(totalPax / 2)),
        hotelTotalCost: 0,
        transportCost: 0,
        transportVehicle: reservedCabVehicle || 'Dedicated Vehicle',
        activityCost: 0,
        imageUrl: defaultImg.url,
        imageCaption: defaultImg.caption,
      };
      setDurationDays(nextNum);
      setDurationNights(Math.max(1, nextNum - 1));
      if (travelStartDate) {
        setTravelEndDate(addDaysToDate(travelStartDate, nextNum - 1));
      }
      return [...prev, newDay];
    });
  }, [travelStartDate, destination, totalPax, reservedCabVehicle]);

  const handleRemoveDay = useCallback((index: number) => {
    setDays((prev) => {
      if (prev.length <= 1) {
        setAutofillNotice('⚠️ Itinerary must contain at least 1 day.');
        return prev;
      }
      const updated = prev
        .filter((_, i) => i !== index)
        .map((d, i) => ({
          ...d,
          dayNumber: i + 1,
          date: travelStartDate ? addDaysToDate(travelStartDate, i) : d.date,
        }));
      setDurationDays(updated.length);
      setDurationNights(Math.max(1, updated.length - 1));
      if (travelStartDate) {
        setTravelEndDate(addDaysToDate(travelStartDate, updated.length - 1));
      }
      return updated;
    });
  }, [travelStartDate]);

  const handleMoveDay = useCallback((index: number, direction: 'up' | 'down') => {
    setDays((prev) => {
      const targetIdx = direction === 'up' ? index - 1 : index + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const newDays = [...prev];
      const temp = newDays[index];
      newDays[index] = newDays[targetIdx];
      newDays[targetIdx] = temp;
      return newDays.map((d, i) => ({
        ...d,
        dayNumber: i + 1,
        date: travelStartDate ? addDaysToDate(travelStartDate, i) : d.date,
      }));
    });
  }, [travelStartDate]);

  const handleUpdateDay = useCallback((index: number, field: keyof ItineraryDay, value: any) => {
    setDays((prev) => {
      if (!prev[index] || prev[index][field] === value) return prev;
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const handleUpdateDayBatch = useCallback((index: number, updates: Partial<ItineraryDay>) => {
    setDays((prev) => {
      if (!prev[index]) return prev;
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updates };
      return updated;
    });
  }, []);

  const handleApplyBulkHotelRate = () => {
    const rate = Number(bulkHotelRate);
    if (isNaN(rate) || rate <= 0) {
      setAutofillNotice('⚠️ Please enter a valid rate amount to apply.');
      return;
    }
    const defaultRooms = Math.max(1, Math.ceil(totalPax / 2));
    setDays((prev) =>
      prev.map((d, idx) => {
        const isDeparture = idx === prev.length - 1 || d.nightStay?.toLowerCase().includes('departure');
        if (isDeparture) {
          return {
            ...d,
            hotelCostPerNight: 0,
            hotelCostPerPerson: 0,
            roomCount: 0,
            hotelTotalCost: 0,
          };
        }
        const rooms = d.roomCount || defaultRooms;
        if (bulkHotelMode === 'per_person') {
          const totalCost = rate * totalPax;
          return {
            ...d,
            hotelPricingMode: 'per_person',
            hotelCostPerPerson: rate,
            hotelCostPerNight: rooms > 0 ? Math.round(totalCost / rooms) : totalCost,
            roomCount: rooms,
            hotelTotalCost: totalCost,
          };
        } else {
          const totalCost = rate * rooms;
          return {
            ...d,
            hotelPricingMode: 'per_night',
            hotelCostPerNight: rate,
            hotelCostPerPerson: totalPax > 0 ? Math.round(totalCost / totalPax) : totalCost,
            roomCount: rooms,
            hotelTotalCost: totalCost,
          };
        }
      })
    );
    const applicableNights = Math.max(1, days.length - 1);
    setAutofillNotice(
      `✓ Applied ₹${rate.toLocaleString('en-IN')} ${
        bulkHotelMode === 'per_person' ? 'per person' : 'per room/night'
      } across all ${applicableNights} tour nights (Departure Day checkout preserved at ₹0).`
    );
    setBulkHotelRate('');
  };

  // Handler when Cab Vehicle changes from Cab Selection Filter (synchronizes to all days if opted in)
  const handleCabVehicleChange = (selectedVehicleName: string, shouldSyncDays = cabSyncOption) => {
    setReservedCabVehicle(selectedVehicleName);

    // Find matching vehicle info in fixed fleet
    const matched = FIXED_RESERVED_VEHICLES.find(
      (v) =>
        v.name.toLowerCase() === selectedVehicleName.toLowerCase() ||
        selectedVehicleName.toLowerCase().includes(v.shortLabel.toLowerCase()) ||
        v.id === selectedVehicleName
    );
    if (matched) {
      setReservedCabVehicle(matched.name);
      setReservedCabDesc(matched.description);
    }

    if (shouldSyncDays) {
      const vName = matched ? matched.name : selectedVehicleName;
      setDays((prev) =>
        prev.map((d) => ({
          ...d,
          transportVehicle: vName,
          transportDetails:
            d.transportDetails && d.transportDetails.toLowerCase().includes('dedicated')
              ? `Dedicated ${vName} mountain transfer & sightseeing`
              : d.transportDetails || `Dedicated ${vName} mountain transfer & sightseeing`,
        }))
      );
      setAutofillNotice(`✓ Selected Cab "${vName}" and synchronized across all ${days.length} days.`);
      setTimeout(() => setAutofillNotice(null), 3500);
    }
  };

  const handleApplyBulkCabRate = () => {
    const rate = Number(bulkCabRate);
    if (isNaN(rate) || rate <= 0) {
      setAutofillNotice('⚠️ Please enter a valid daily cab rate amount to apply.');
      return;
    }
    setDays((prev) =>
      prev.map((d) => ({
        ...d,
        transportCost: rate,
      }))
    );
    setAutofillNotice(
      `✓ Applied ₹${rate.toLocaleString('en-IN')} daily cab rate across all ${days.length} days.`
    );
    setBulkCabRate('');
    setTimeout(() => setAutofillNotice(null), 3500);
  };

  // Quick auto-calculator for package prices
  const handleAutoCalcTotal = (type: 'reserved' | 'sharing') => {
    const totalPax = Math.max(1, adults + (children > 0 ? children * 0.75 : 0));
    if (type === 'reserved') {
      setReservedTotal(Math.round(reservedPerPerson * totalPax));
    } else {
      setSharingTotal(Math.round(sharingPerPerson * totalPax));
    }
  };

  // Autofill itinerary from uploaded text
  const handleApplyParsedItinerary = (parsed: Partial<Itinerary>) => {
    if (parsed.title) setTitle(parsed.title);
    if (parsed.destination) setDestination(parsed.destination);
    if (parsed.heroImageUrl) setHeroImageUrl(parsed.heroImageUrl);
    if (parsed.heroImageCaption) setHeroImageCaption(parsed.heroImageCaption);
    if (parsed.guestName) setGuestName(parsed.guestName);
    if (parsed.guestPhone) setGuestPhone(parsed.guestPhone);
    if (parsed.guestEmail) setGuestEmail(parsed.guestEmail);
    if (parsed.guestCity) setGuestCity(parsed.guestCity);
    if (parsed.adults) setAdults(parsed.adults);
    if (parsed.children !== undefined) setChildren(parsed.children);
    if (parsed.infants !== undefined) setInfants(parsed.infants);
    if (parsed.durationDays) setDurationDays(parsed.durationDays);
    if (parsed.durationNights) setDurationNights(parsed.durationNights);
    if (parsed.travelStartDate) setTravelStartDate(parsed.travelStartDate);
    if (parsed.travelEndDate) setTravelEndDate(parsed.travelEndDate);
    if (parsed.pickupLocation) setPickupLocation(parsed.pickupLocation);
    if (parsed.dropLocation) setDropLocation(parsed.dropLocation);
    if (parsed.hotelCategory) setHotelCategory(parsed.hotelCategory);
    if (parsed.mealPlan) setMealPlan(parsed.mealPlan);

    if (parsed.pricingMode) {
      if (parsed.pricingMode === 'reserved' || (parsed.pricingMode as any) === 'single') {
        setPricingMode('reserved');
      } else if (parsed.pricingMode === 'sharing') {
        setPricingMode('sharing');
      } else {
        setPricingMode('both');
      }
    }

    if (parsed.days && parsed.days.length > 0) {
      setDays(parsed.days);
    }

    if (parsed.commonInclusions && parsed.commonInclusions.length > 0) {
      setCommonInclusions(parsed.commonInclusions);
    }
    if (parsed.commonExclusions && parsed.commonExclusions.length > 0) {
      setCommonExclusions(parsed.commonExclusions);
    }
    if (parsed.specialAdvisories && parsed.specialAdvisories.length > 0) {
      setSpecialAdvisories(parsed.specialAdvisories);
    }

    const currentPax = Math.max(
      1,
      (Number(parsed.adults || adults) || 0) + (Number(parsed.children ?? children) || 0)
    );

    // Reserved Cab Costing
    const parsedSelling =
      parsed.sellingCost ||
      parsed.reservedCab?.totalPackagePrice ||
      (parsed.reservedCab?.pricePerPerson ? parsed.reservedCab.pricePerPerson * currentPax : 0);

    const hasDayCosts = parsed.days?.some(
      (d) => (d.hotelCostPerNight && d.hotelCostPerNight > 0) || (d.transportCost && d.transportCost > 0)
    );

    if (parsedSelling > 0) {
      setSellingCost(parsedSelling);
      setReservedTotal(parsedSelling);
      const perPerson =
        parsed.sellingCostPerPerson ||
        parsed.reservedCab?.pricePerPerson ||
        Math.round(parsedSelling / currentPax);
      setReservedPerPerson(perPerson);

      if (!hasDayCosts) {
        setAutoSyncPackageWithDays(false);
        const defaultBuying = parsed.packageCost || Math.round(parsedSelling * 0.75);
        setPackageCost(defaultBuying);
        const profit = parsedSelling - defaultBuying;
        setMarkupPercentage(defaultBuying > 0 ? Math.round((profit / defaultBuying) * 100) : 25);
      }
    }

    // Sharing Cab Costing
    const parsedSharingSelling =
      parsed.sellingCostSharing ||
      parsed.sharingCab?.totalPackagePrice ||
      (parsed.sharingCab?.pricePerPerson ? parsed.sharingCab.pricePerPerson * currentPax : 0);

    if (parsedSharingSelling > 0) {
      setSharingSellingCost(parsedSharingSelling);
      setSharingTotal(parsedSharingSelling);
      const sharingPerPerson =
        parsed.sellingCostPerPersonSharing ||
        parsed.sharingCab?.pricePerPerson ||
        Math.round(parsedSharingSelling / currentPax);
      setSharingPerPerson(sharingPerPerson);
      const defaultSharingBuying = parsed.packageCostSharing || Math.round(parsedSharingSelling * 0.75);
      setSharingPackageCost(defaultSharingBuying);
      const sharingProfit = parsedSharingSelling - defaultSharingBuying;
      setSharingMarkupPercentage(defaultSharingBuying > 0 ? Math.round((sharingProfit / defaultSharingBuying) * 100) : 25);
    }

    if (parsed.reservedCab) {
      if (parsed.reservedCab.vehicleType) setReservedCabVehicle(parsed.reservedCab.vehicleType);
      if (parsed.reservedCab.name) setReservedCabName(parsed.reservedCab.name);
    }

    // Sharing Cab is strictly fixed to Tata Sumo / Bolero
    setSharingCabVehicle(FIXED_SHARING_VEHICLE.name);
    if (parsed.sharingCab?.name) setSharingCabName(parsed.sharingCab.name);

    setAutofillNotice(
      `✓ Itinerary text successfully loaded! Extracted ${parsed.days?.length || 0} tour days, guest info, and cab costing.${
        parsedSelling > 0
          ? ` Reserved Selling Price set to ₹${parsedSelling.toLocaleString('en-IN')}.${
              parsedSharingSelling > 0 ? ` Sharing Selling Price set to ₹${parsedSharingSelling.toLocaleString('en-IN')}.` : ''
            }`
          : ''
      }`
    );
  };

  // Dynamic Real-Time Profit Calculations (Selling Cost - Package Cost)
  const reservedNetProfit = Math.max(0, (Number(sellingCost) || 0) - (Number(packageCost) || 0));
  const reservedProfitMarginPct =
    Number(packageCost) > 0
      ? Math.round((((Number(sellingCost) || 0) - (Number(packageCost) || 0)) / Number(packageCost)) * 100)
      : 0;

  const currentSharingSelling = Number(sharingSellingCost || sharingTotal || 0);
  const sharingNetProfit = Math.max(0, currentSharingSelling - (Number(sharingPackageCost) || 0));
  const sharingProfitMarginPct =
    Number(sharingPackageCost) > 0
      ? Math.round(((currentSharingSelling - (Number(sharingPackageCost) || 0)) / Number(sharingPackageCost)) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Top Builder Control Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10 shadow-lg">
        <div className="flex items-center gap-4">
          {/* Company Logo thumbnail with 1-click change */}
          <div className="relative group">
            <div className="w-12 h-12 rounded-xl bg-white p-1.5 border border-emerald-500/40 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
              {companyProfile.logoUrl ? (
                <img
                  src={companyProfile.logoUrl}
                  alt="Agency Logo"
                  className="w-full h-full object-contain"
                />
              ) : (
                <Building className="w-6 h-6 text-emerald-700" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 text-slate-950 rounded-full hover:bg-emerald-400 shadow cursor-pointer transition-colors"
              title="Upload Company Logo (Reflected on PDF)"
            >
              <Upload className="w-3 h-3" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-base font-bold text-white font-mono bg-slate-950 px-2.5 py-0.5 rounded-lg border border-slate-800">
                {quoteNumber}
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-sm text-emerald-400 font-semibold">
                {guestName ? `Client: ${guestName}` : 'New Custom Itinerary'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Branded for <strong className="text-slate-300">{companyProfile.name}</strong> · Dual Cab Quoting Active
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5 flex-wrap ml-auto">
          {onOpenAiCopilot && (
            <button
              type="button"
              onClick={() => onOpenAiCopilot()}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 rounded-xl transition-all whitespace-nowrap shadow-md cursor-pointer animate-pulse-subtle"
              title="Open Kanchenjunga AI Copilot to plan, rewrite or update itineraries"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>AI Itinerary Bot</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsTextUploadOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-emerald-300 bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/50 rounded-xl transition-colors whitespace-nowrap shadow-sm"
            title="Upload whole itinerary in text format to autofill details"
          >
            <FileUp className="w-4 h-4 text-emerald-400" />
            <span>Upload Text Itinerary</span>
          </button>

          <button
            type="button"
            onClick={onOpenTemplates}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Load Template</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors whitespace-nowrap"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            <span>Save Quote</span>
          </button>

          <button
            type="button"
            onClick={handlePreview}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-md transition-colors whitespace-nowrap cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>Preview & Download PDF</span>
          </button>
        </div>
      </div>

      {/* Section Navigation Step Bar (Exact order as requested by user) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 sm:p-2.5 flex items-center gap-2 overflow-x-auto shadow-md">
        {[
          { id: 'guest', label: '1. Guest & Journey', icon: Users },
          { id: 'days', label: `2. Tour Plan (${days.length} Days)`, icon: Calendar },
          { id: 'rates', label: '3. Cab Rates & Account', icon: DollarSign },
          { id: 'policies', label: '4. Policies, Terms & Refund', icon: FileText },
          { id: 'full_view', label: '5. Full View (All Information)', icon: Globe },
        ].map((sec) => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSection(sec.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 shadow-md ring-2 ring-emerald-400/40'
                  : 'bg-slate-950/80 text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-emerald-400'}`} />
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* Autofill Notice Banner if text was uploaded */}
      {autofillNotice && (
        <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 px-5 py-3.5 rounded-2xl flex items-center justify-between text-sm animate-fade-in shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-medium">{autofillNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setAutofillNotice(null)}
            className="text-slate-400 hover:text-white font-bold ml-4 cursor-pointer text-base"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Builder Container (Spacious Layout with clear sections) */}
      <div className="space-y-12">
        {/* Section 1: Guest & Journey Information Card */}
        {(activeSection === 'guest' || activeSection === 'full_view') && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 md:p-10 space-y-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold font-mono">
                1
              </span>
              <div>
                <h3 className="font-bold text-white text-xl sm:text-2xl flex items-center gap-2.5">
                  <Users className="w-5 h-5 text-emerald-400" />
                  <span>Guest & Journey Information</span>
                </h3>
                <p className="text-sm text-slate-400 mt-0.5">
                  Configure client details, destination, travel dates, passenger group, and hotel standards
                </p>
              </div>
            </div>

            {/* CRM Lead Selector Dropdown */}
            {leads && leads.length > 0 && (
              <div className="flex items-center gap-2.5 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-xs sm:text-sm">
                <span className="text-slate-400 whitespace-nowrap font-medium">🔗 Link CRM Lead:</span>
                <select
                  className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs sm:text-sm max-w-[240px] truncate"
                  value={leadId || ''}
                  onChange={(e) => {
                    const selId = e.target.value;
                    setLeadId(selId);
                    const matched = leads.find((l) => l.id === selId);
                    if (matched) {
                      setGuestName(matched.guestName || '');
                      setGuestPhone(matched.phone || '');
                      setGuestEmail(matched.email || '');
                      setGuestCity(matched.city || '');
                      if (matched.destination) setDestination(matched.destination);
                      if (matched.adults) setAdults(matched.adults);
                      if (matched.children !== undefined) setChildren(matched.children);
                      if (matched.travelStartDate) setTravelStartDate(matched.travelStartDate);
                      if (matched.travelEndDate) setTravelEndDate(matched.travelEndDate);
                      if (matched.salesPerson) setSalesPerson(matched.salesPerson);
                      setAutofillNotice(`✓ Auto-filled details from CRM lead: ${matched.guestName}`);
                    }
                  }}
                >
                  <option value="">-- Fresh Quote (Auto-syncs to CRM) --</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.guestName} {l.phone ? `(${l.phone})` : ''} - {l.destination || 'Tour'}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Destination Selection with Predefined Imagery */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm sm:text-base font-semibold text-slate-200 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Tour Destination & Regional Circuit *</span>
              </label>
              <span className="text-xs text-emerald-400 font-mono">Auto-syncs regional imagery</span>
            </div>
            <input
              type="text"
              placeholder="e.g. Sikkim, North Sikkim, Darjeeling, Meghalaya, Arunachal"
              value={destination}
              onChange={(e) => {
                const val = e.target.value;
                setDestination(val);
                const newCover = getDefaultDestinationCover(val, title);
                setHeroImageUrl(newCover.url);
                setHeroImageCaption(newCover.caption);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 text-base sm:text-lg text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 transition-all font-medium"
            />
            {/* Destination quick pills */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-xs text-slate-400 font-medium">Quick Select:</span>
              {['Andaman', 'Sikkim', 'North Sikkim', 'Darjeeling', 'Meghalaya', 'Arunachal', 'Assam'].map((dest) => (
                <button
                  key={dest}
                  type="button"
                  onClick={() => {
                    setDestination(dest);
                    const newTitle = dest.toLowerCase().includes('andaman')
                      ? 'Exotic Andaman Islands Explorer'
                      : `${dest} Himalayan Holiday`;
                    if (!title) setTitle(newTitle);
                    const newCover = getDefaultDestinationCover(dest, newTitle);
                    setHeroImageUrl(newCover.url);
                    setHeroImageCaption(newCover.caption);
                    // Automatically sync destination advisories, terms, and cancellation policies
                    setSpecialAdvisories(getDestinationSpecialAdvisories(dest, newTitle));
                    setTermsAndConditions(getDestinationTermsAndConditions(dest, newTitle));
                    setCancellationRefundPolicy(getDestinationCancellationPolicy(dest, newTitle));
                    setAutofillNotice(`✓ Destination updated to ${dest}. Notes & policies synced.`);
                    setTimeout(() => setAutofillNotice(null), 3000);
                  }}
                  className={`text-xs sm:text-sm px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                    destination.toLowerCase().includes(dest.toLowerCase())
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 font-bold shadow-xs'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {dest}
                </button>
              ))}
            </div>
          </div>

          {/* Destination Cover Photo Preview & Upload */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span>Destination Quotation Cover Photo</span>
              </span>
              <button
                type="button"
                onClick={() => setImageModalTarget('hero')}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-emerald-300 hover:text-emerald-200 font-bold cursor-pointer bg-emerald-950/80 border border-emerald-500/40 px-3 py-1.5 rounded-xl transition-colors shadow-sm"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Upload Custom Photo</span>
              </button>
            </div>
            <div
              onClick={() => setImageModalTarget('hero')}
              className="h-32 sm:h-40 rounded-xl overflow-hidden relative border border-slate-700/80 group cursor-pointer shadow-inner"
              title="Click to upload custom photo or choose from library"
            >
              <img
                src={heroImageUrl}
                alt={destination || 'Destination Cover'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent"></div>
              <div className="absolute bottom-3 left-4 right-4 text-white text-sm font-semibold truncate drop-shadow-md">
                {heroImageCaption}
              </div>
              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 text-white font-bold text-sm transition-opacity">
                <Upload className="w-5 h-5 text-emerald-400" />
                <span>Upload Custom Header Photo</span>
              </div>
            </div>
          </div>

          {/* Tour Title */}
          <div>
            <label className="block text-sm sm:text-base font-semibold text-slate-200 mb-2">
              Itinerary Quotation Title *
            </label>
            <input
              type="text"
              placeholder="e.g. 5N/6D Magical Sikkim & Gangtok Luxury Tour"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 text-base sm:text-lg text-white font-medium placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 transition-all"
            />
          </div>

          {/* Quote # and Guest Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm sm:text-base font-semibold text-slate-200 mb-2">
                Quote Reference #
              </label>
              <input
                type="text"
                value={quoteNumber}
                onChange={(e) => setQuoteNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 text-white font-mono text-base focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm sm:text-base font-semibold text-slate-200 mb-2">
                Guest Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Verma"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 text-white font-semibold text-base sm:text-lg focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Phone and City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm sm:text-base font-semibold text-slate-200 mb-2">
                Phone / WhatsApp Number
              </label>
              <input
                type="text"
                placeholder="+91 98201 44521"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 text-white font-mono text-base focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm sm:text-base font-semibold text-slate-200 mb-2">
                Origin City / Hometown
              </label>
              <input
                type="text"
                placeholder="e.g. Mumbai, Kolkata, Delhi, Bangalore"
                value={guestCity}
                onChange={(e) => setGuestCity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 text-white text-base focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Pax counts: Adults, Children, Infants */}
          <div className="pt-2 border-t border-slate-800">
            <label className="block text-sm sm:text-base font-semibold text-slate-200 mb-3">
              Passenger Group Breakdown (Total Pax: {totalPax})
            </label>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
                <label className="block text-xs sm:text-sm text-slate-400 font-medium mb-1.5">
                  Adults (12+ yrs)
                </label>
                <input
                  type="number"
                  min="1"
                  value={adults}
                  onChange={(e) => setAdults(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xl sm:text-2xl font-bold text-center focus:border-emerald-500"
                />
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
                <label className="block text-xs sm:text-sm text-slate-400 font-medium mb-1.5">
                  Children (5-11 yrs)
                </label>
                <input
                  type="number"
                  min="0"
                  value={children}
                  onChange={(e) => setChildren(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xl sm:text-2xl font-bold text-center focus:border-emerald-500"
                />
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
                <label className="block text-xs sm:text-sm text-slate-400 font-medium mb-1.5">
                  Infants (0-4 yrs)
                </label>
                <input
                  type="number"
                  min="0"
                  value={infants}
                  onChange={(e) => setInfants(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xl sm:text-2xl font-bold text-center focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Travel dates & duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm sm:text-base font-semibold text-slate-200 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>Travel Start Date</span>
                </label>
                {travelStartDate && (
                  <span className="text-xs font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/30 font-mono">
                    {getDayOfWeekAbbr(travelStartDate)}
                  </span>
                )}
              </div>
              <input
                type="date"
                value={travelStartDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-base focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm sm:text-base font-semibold text-slate-200 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sky-400" />
                  <span>Travel End Date</span>
                  <span className="text-xs text-slate-500 font-normal">(Auto-calculated)</span>
                </label>
                {travelEndDate && (
                  <span className="text-xs font-bold text-sky-300 bg-sky-950/80 px-2.5 py-1 rounded-lg border border-sky-500/30 font-mono">
                    {getDayOfWeekAbbr(travelEndDate)}
                  </span>
                )}
              </div>
              <input
                type="date"
                value={travelEndDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-base focus:ring-2 focus:ring-sky-500/40"
              />
            </div>
          </div>

          {/* Hubs: Pickup & Drop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm sm:text-base font-semibold text-slate-200 mb-2">
                Pickup Hub (Airport / Railway)
              </label>
              <input
                type="text"
                placeholder="e.g. Bagdogra Airport (IXB) / NJP Station"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 text-base text-white focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm sm:text-base font-semibold text-slate-200 mb-2">
                Drop Hub (Airport / Railway)
              </label>
              <input
                type="text"
                placeholder="e.g. Bagdogra Airport (IXB) / NJP Station"
                value={dropLocation}
                onChange={(e) => setDropLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 text-base text-white focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Hotel Category & Meal Plan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm sm:text-base font-semibold text-slate-200 mb-2">
                Hotel Category Standard
              </label>
              <select
                value={hotelCategory}
                onChange={(e) => setHotelCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-base text-white"
              >
                <option value="Deluxe Category (3-Star Mountain View)">
                  Deluxe Category (3-Star Mountain View)
                </option>
                <option value="Super Deluxe Category (4-Star Premium)">
                  Super Deluxe Category (4-Star Premium)
                </option>
                <option value="Luxury Heritage / Boutique Resorts">
                  Luxury Heritage / Boutique Resorts
                </option>
                <option value="Standard Budget Clean Hotels">Standard Budget Clean Hotels</option>
                <option value="Homestay & Village Retreats">Homestay & Village Retreats</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm sm:text-base font-semibold text-slate-200">
                  Tour Meal Plan
                </label>
                {isNorthSikkimActive && (
                  <span className="text-xs font-bold text-amber-300 bg-amber-950 px-2 py-0.5 rounded-md border border-amber-800">
                    Compulsory All Meals
                  </span>
                )}
              </div>
              <select
                value={mealPlan}
                onChange={(e) => handleMealPlanChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-base text-white"
              >
                {isNorthSikkimActive && (
                  <option value={NORTH_SIKKIM_COMPULSORY_MEAL_PLAN}>
                    AP (All Meals - Compulsory for North Sikkim)
                  </option>
                )}
                <option value="MAP (Daily Breakfast & Dinner)">MAP (Daily Breakfast & Dinner)</option>
                <option value="AP (All Meals - Breakfast, Lunch, Dinner)">AP (All Meals: Breakfast, Lunch, Dinner)</option>
                <option value="CP (Daily Breakfast Only)">CP (Daily Breakfast Only)</option>
                <option value="EP (Room Only)">EP (Room Only)</option>
              </select>
            </div>

            {/* Compulsory North Sikkim All Meals Banner */}
            {isNorthSikkimActive && (
              <div className="col-span-1 sm:col-span-2 bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/60 border border-amber-500/60 rounded-2xl p-5 space-y-3 shadow-md">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-sm font-bold text-amber-300 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-amber-400" />
                    <span>North Sikkim Tourism Regulation (Mandatory All Meals)</span>
                  </span>
                  {mealPlan !== NORTH_SIKKIM_COMPULSORY_MEAL_PLAN && (
                    <button
                      type="button"
                      onClick={handleEnforceNorthSikkimMeals}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm cursor-pointer shadow-sm transition-colors"
                    >
                      ⚡ Enforce All Meals on All Days
                    </button>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  By Sikkim tourism authority mandate, all hotel stays and transport in North Sikkim (Lachen, Lachung, Gurudongmar & Yumthang) strictly require full board All Meals (AP Plan: Breakfast, Lunch & Dinner). Standalone restaurants are unavailable in remote mountain areas.
                </p>
              </div>
            )}
          </div>

          {/* Hotel Accommodations & Rate Quick Panel */}
          <div className="bg-sky-950/30 border border-sky-500/40 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-bold text-sky-300 flex items-center gap-2 text-sm sm:text-base">
                <Building className="w-5 h-5 text-sky-400" />
                <span>Hotel Stays Costing & Room Allocation</span>
              </span>
              <span className="text-xs text-sky-300 bg-sky-950 px-3 py-1 rounded-lg border border-sky-800 font-mono font-medium">
                {durationNights} Nights • {Math.max(1, Math.ceil((Number(adults) || 2) / 2))} Room{Math.max(1, Math.ceil((Number(adults) || 2) / 2)) > 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
              <span className="text-slate-300">Total Hotel Stays Cost across all nights:</span>
              <span className="font-mono font-bold text-sky-400 text-lg">
                ₹{computedDayCosts.totalHotel.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Quick Bulk Rate Setter */}
            <div className="space-y-2">
              <label className="block text-xs sm:text-sm text-slate-300 font-medium">
                Quick Apply Rate across all {durationNights} nights (₹ / Room / Night):
              </label>
              <div className="flex items-center gap-2.5">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-3 text-slate-500 font-mono text-base">₹</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 3500"
                    value={bulkHotelRate}
                    onChange={(e) => setBulkHotelRate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-2.5 text-sky-300 font-mono font-bold text-base"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyBulkHotelRate}
                  className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors shrink-0 cursor-pointer shadow-sm"
                >
                  Apply to All Nights
                </button>
              </div>
              <span className="text-xs text-slate-400 block">
                Instantly applies rate across all days. Individual hotel names and rates can also be customized per day in the tour schedule.
              </span>
            </div>
          </div>

          {/* Cab Selection & Fleet Filter Section (Requested by user) */}
          <div className="bg-slate-950/80 border border-emerald-500/30 rounded-3xl p-6 sm:p-7 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base sm:text-lg flex items-center gap-2">
                    <span>Cab Selection & Fleet Filter</span>
                    <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-800 px-2.5 py-0.5 rounded-full font-mono font-bold">
                      Vehicle Standards
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Filter and choose your mountain vehicle fleet category, capacity, and quoting model
                  </p>
                </div>
              </div>

              {/* Pricing Mode Filter Buttons */}
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPricingMode('both')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    pricingMode === 'both'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Include both Reserved SUV and Sharing Cab options side-by-side"
                >
                  Dual Rate (Reserved vs Sharing)
                </button>
                <button
                  type="button"
                  onClick={() => setPricingMode('reserved')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    pricingMode === 'reserved'
                      ? 'bg-sky-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Quote dedicated private vehicle only"
                >
                  Reserved Cab Only
                </button>
                <button
                  type="button"
                  onClick={() => setPricingMode('sharing')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    pricingMode === 'sharing'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Quote economical shared transit taxi only"
                >
                  Sharing Cab Only
                </button>
              </div>
            </div>

            {/* Cab Fleet Standard Dropdown & Vehicle Quoting Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm sm:text-base font-semibold text-slate-200 mb-2">
                  Cab Fleet Standard & Category
                </label>
                <select
                  value={reservedCabVehicle}
                  onChange={(e) => handleCabVehicleChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-base text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Innova / Xylo">Innova / Xylo (4 - 6 Pax · Mountain SUV / MUV)</option>
                  <option value="Tata Sumo (Reserved Dedicated)">Tata Sumo (Reserved Dedicated) (6 - 8 Pax · Rugged Hill SUV)</option>
                  <option value="Tempo Traveller">Tempo Traveller (9 - 26 Pax · Group Mini Coach)</option>
                  <option value="Small Cab (Swift / WagonR)">Small Cab (Swift / WagonR) (1 - 4 Pax · Budget Private Hatchback)</option>
                  <option value="Tata Sumo / Mahindra Bolero">Tata Sumo / Mahindra Bolero (Per Seat · Regional Sharing Transit)</option>
                  {isAndamanTourActive && (
                    <option value="Private AC Ertiga / Innova + Makruzz/Nautika Catamaran">
                      AC Cab + High-Speed Catamaran Cruise (Andaman Island Special)
                    </option>
                  )}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm sm:text-base font-semibold text-slate-200">
                    Cab Quoting Structure
                  </label>
                  <span className="text-xs text-emerald-400 font-mono font-semibold">
                    {pricingMode === 'both' ? 'Dual Comparison' : pricingMode === 'reserved' ? 'Private SUV' : 'Shared Transit'}
                  </span>
                </div>
                <select
                  value={pricingMode}
                  onChange={(e) => setPricingMode(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-base text-white focus:border-emerald-500"
                >
                  <option value="both">Option A (Reserved) + Option B (Sharing) Dual Rate Comparison</option>
                  <option value="reserved">Option A: Reserved Private Dedicated Cab Facility Only</option>
                  <option value="sharing">Option B: Economical Shared Stand Transit Vehicle Only</option>
                </select>
              </div>
            </div>

            {/* Quick Cab Fleet Filter Cards (5 Interactive Cards) */}
            <div>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <span className="text-xs sm:text-sm font-semibold text-slate-300">
                  Quick Filter by Passenger Capacity & Vehicle Class:
                </span>
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cabSyncOption}
                    onChange={(e) => setCabSyncOption(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-emerald-500 focus:ring-0"
                  />
                  <span>Auto-sync assigned vehicle across all {days.length} tour days</span>
                </label>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {FIXED_RESERVED_VEHICLES.map((vehicle) => {
                  const isSelected =
                    reservedCabVehicle.toLowerCase().includes(vehicle.shortLabel.toLowerCase()) ||
                    reservedCabVehicle.toLowerCase() === vehicle.name.toLowerCase();
                  return (
                    <button
                      key={vehicle.id}
                      type="button"
                      onClick={() => handleCabVehicleChange(vehicle.name)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-emerald-950/90 border-emerald-400 ring-2 ring-emerald-400/60 text-white shadow-md'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 w-full">
                        <span className="font-bold text-xs sm:text-sm text-white line-clamp-1">{vehicle.shortLabel}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                      </div>
                      <span className="text-[11px] font-mono text-emerald-400 font-semibold mt-1">
                        {vehicle.capacity}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{vehicle.category}</span>
                    </button>
                  );
                })}

                {/* Fixed Sharing Vehicle Card */}
                <button
                  type="button"
                  onClick={() => {
                    setPricingMode('both');
                    handleCabVehicleChange(FIXED_SHARING_VEHICLE.name);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    pricingMode === 'sharing' || reservedCabVehicle.includes('Sharing') || reservedCabVehicle.includes('Bolero')
                      ? 'bg-amber-950/90 border-amber-400 ring-2 ring-amber-400/60 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span className="font-bold text-xs sm:text-sm text-white line-clamp-1">Shared Sumo</span>
                    {(pricingMode === 'sharing' || reservedCabVehicle.includes('Sharing') || reservedCabVehicle.includes('Bolero')) && (
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-amber-400 font-semibold mt-1">
                    {FIXED_SHARING_VEHICLE.capacity}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">Shared Stand Cab</span>
                </button>
              </div>
            </div>

            {/* Cab Fleet Costing & Quick Day Rate Setter */}
            <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-bold text-emerald-400 flex items-center gap-2 text-xs sm:text-sm">
                  <Car className="w-4 h-4 text-emerald-400" />
                  <span>Transportation Fleet Cost Breakdown ({days.length} Days)</span>
                </span>
                <span className="text-xs text-slate-300 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 font-mono">
                  Assigned: <strong className="text-white">{reservedCabVehicle}</strong>
                </span>
              </div>

              <div className="flex items-center justify-between text-xs sm:text-sm bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-300">Total Transportation / Cab Cost across all {days.length} days:</span>
                <span className="font-mono font-bold text-emerald-400 text-base sm:text-lg">
                  ₹{computedDayCosts.totalTransport.toLocaleString('en-IN')}
                  {computedDayCosts.totalTransport > 0 && (
                    <span className="text-xs text-slate-400 font-normal ml-2">
                      (₹{Math.round(computedDayCosts.totalTransport / totalPax).toLocaleString('en-IN')}/pax)
                    </span>
                  )}
                </span>
              </div>

              {/* Quick Bulk Daily Cab Rate Setter */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs text-slate-300 font-medium">
                  Quick Apply Daily Cab Rate across all {days.length} days (₹ / Day):
                </label>
                <div className="flex items-center gap-2.5">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-slate-500 font-mono text-sm">₹</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 3800"
                      value={bulkCabRate}
                      onChange={(e) => setBulkCabRate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-emerald-300 font-mono font-bold text-sm focus:border-emerald-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyBulkCabRate}
                    className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer shadow-sm"
                  >
                    Apply to All Days
                  </button>
                </div>
                <span className="text-[11px] text-slate-400 block">
                  Sets day-wise transportation cab cost on every day in the Tour Plan. You can also customize individual days separately in Step 2.
                </span>
              </div>
            </div>
          </div>

          {/* Step 1 Completion Navigation Footer */}
          {activeSection !== 'full_view' && (
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
              <span className="text-xs text-slate-400">Step 1 of 4 Completed</span>
              <button
                type="button"
                onClick={() => setActiveSection('days')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-colors cursor-pointer shadow-md"
              >
                <span>Continue to Step 2: Tour Plan ➜</span>
              </button>
            </div>
          )}
        </div>
        )}

        {/* Section 2: Tour Plan (Day-by-Day Schedule) */}
        {(activeSection === 'days' || activeSection === 'full_view') && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 md:p-10 space-y-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold font-mono">
                2
              </span>
              <div>
                <h3 className="font-bold text-white text-xl sm:text-2xl flex items-center gap-2.5">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                  <span>2. Tour Plan ({days.length} Days)</span>
                </h3>
                <p className="text-sm text-slate-400 mt-0.5">
                  Customizable itinerary milestones with destination highlights, night stays, and meal plans
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {onOpenAiCopilot && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenAiCopilot(
                      'Rewrite all day plans in a perfect way with captivating storytelling, scenic milestones, photo stops, and accurate mountain timing'
                    )
                  }
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-md"
                  title="Ask AI Copilot to rewrite and polish all days in evocative DMC storytelling style"
                >
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>AI Rewrite All Days</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleAddDay}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Day</span>
              </button>
            </div>
          </div>

          {/* Quick Hotel Rate Setter (Per Person OR Per Night for all days) */}
          <div className="bg-slate-950 border border-sky-500/30 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 text-sm shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-950/80 border border-sky-500/40 flex items-center justify-center text-sky-400 shrink-0">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-white text-sm sm:text-base block">
                  Quick Hotel Rate Setter (Apply across all {days.length} Nights)
                </span>
                <span className="text-xs text-slate-400">
                  Fill hotel price per room/night or per person across the entire itinerary with one click
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Mode toggle */}
              <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setBulkHotelMode('per_night')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    bulkHotelMode === 'per_night'
                      ? 'bg-sky-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Per Night (Room)
                </button>
                <button
                  type="button"
                  onClick={() => setBulkHotelMode('per_person')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    bulkHotelMode === 'per_person'
                      ? 'bg-sky-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Per Person
                </button>
              </div>

              {/* Amount input */}
              <div className="relative w-36">
                <span className="absolute left-3 top-2.5 text-slate-500 font-mono text-base">₹</span>
                <input
                  type="number"
                  min="0"
                  placeholder={bulkHotelMode === 'per_person' ? 'e.g. 1500' : 'e.g. 3500'}
                  value={bulkHotelRate}
                  onChange={(e) => setBulkHotelRate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-white font-mono text-sm sm:text-base font-bold focus:border-sky-500"
                />
              </div>

              <button
                type="button"
                onClick={handleApplyBulkHotelRate}
                disabled={!bulkHotelRate || Number(bulkHotelRate) <= 0}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                Apply to All {days.length} Nights
              </button>
            </div>
          </div>

          {/* Days editor list */}
          <div className="space-y-6">
            {days.map((day, idx) => (
              <DayCard
                key={day.id || `day-${day.dayNumber}-${idx}`}
                day={day}
                index={idx}
                totalDays={days.length}
                totalPax={totalPax}
                destination={destination}
                onUpdateDay={handleUpdateDay}
                onUpdateDayBatch={handleUpdateDayBatch}
                onMoveDay={handleMoveDay}
                onRemoveDay={handleRemoveDay}
                onOpenImageModal={(dayNum) => setImageModalTarget(dayNum)}
                onOpenAiCopilot={onOpenAiCopilot}
              />
            ))}
          </div>

          {/* Add Day Option below the Last Day Section */}
          <div className="bg-slate-950/70 border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-sm">
                +{days.length + 1}
              </div>
              <div>
                <span className="font-bold text-white text-sm sm:text-base block">
                  Add another day to the tour schedule
                </span>
                <span className="text-xs text-slate-400">
                  Current itinerary has {days.length} days ({days.length - 1 > 0 ? days.length - 1 : 1} Nights)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleAddDay}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition-all cursor-pointer shadow-md hover:scale-102"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>+ Add Day {days.length + 1}</span>
              </button>
              {onOpenAiCopilot && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenAiCopilot(
                      `Add a new Day ${days.length + 1} to this ${destination || 'Sikkim'} tour itinerary with sightseeing highlights and night stay`
                    )
                  }
                  className="hidden sm:inline-flex items-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-emerald-300 font-medium text-xs rounded-xl border border-emerald-500/30 transition-colors cursor-pointer"
                  title="Ask AI to generate next day"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>AI Suggest Day</span>
                </button>
              )}
            </div>
          </div>

          {/* Step 2 Completion Navigation Footer */}
          {activeSection !== 'full_view' && (
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setActiveSection('guest')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
              >
                <span>⬅ Step 1: Guest & Journey</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('rates')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer shadow-md"
              >
                <span>Continue to Step 3: Cab Rates & Account ➜</span>
              </button>
            </div>
          )}
        </div>
        )}

        {/* =====================================================================
            SECTION 3: RATE QUOTATION, CAB FLEET & CONFIDENTIAL ACCOUNTS ENGINE
            (User Order: 1. Guest, 2. Tour Plan, 3. Cab Rates & Account, 4. Policies)
            ===================================================================== */}
        {(activeSection === 'rates' || activeSection === 'full_view') && (
        <div className="bg-slate-900 border border-emerald-500/50 rounded-3xl p-6 sm:p-8 md:p-10 space-y-8 shadow-2xl">
          {/* Section 3 Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-800 pb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                  Step 3 of 5
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40 uppercase tracking-wider">
                  Internal & Client Quoting
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    3. Rate Quotation, Cab Fleet & Accounts Engine
                  </h3>
                  <p className="text-sm text-slate-400 mt-0.5">
                    Internal package buying costs & profit formulas are strictly confidential and hidden from guest PDF itinerary.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              {/* Sales Executive Selector */}
              <div className="min-w-[240px]">
                <SalesPersonSelect
                  value={salesPerson}
                  onChange={setSalesPerson}
                  salesPersons={salesPersons}
                  onQuickAddSalesPerson={onQuickAddSalesPerson}
                  onOpenManageTeam={onOpenManageSalesTeam}
                  label="Assigned Sales Executive *"
                />
              </div>

              {/* 3-Type Pricing Mode Switcher (User Requirement: Reserved, Sharing, Both) */}
              <div className="flex items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPricingMode('reserved')}
                  className={`py-2 px-3.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                    pricingMode === 'reserved'
                      ? 'bg-sky-500 text-slate-950 shadow-md scale-102'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Option 1: Reserved Dedicated Cab Only"
                >
                  Reserved Cab
                </button>
                <button
                  type="button"
                  onClick={() => setPricingMode('sharing')}
                  className={`py-2 px-3.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                    pricingMode === 'sharing'
                      ? 'bg-amber-500 text-slate-950 shadow-md scale-102'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Option 2: Budget Sharing Mountain Vehicle Only"
                >
                  Sharing Cab
                </button>
                <button
                  type="button"
                  onClick={() => setPricingMode('both')}
                  className={`py-2 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                    pricingMode === 'both'
                      ? 'bg-emerald-500 text-slate-950 shadow-md scale-102'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Both: Side-by-side Dual Quotation Comparison"
                >
                  Both (Dual Comparison)
                </button>
              </div>
            </div>
          </div>

          {/* Day-Wise Aggregates Quick Reference Bar */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-slate-300 text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span>Day-wise Itinerary Sum:</span>
              </span>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="bg-slate-900 px-3.5 py-1.5 rounded-xl border border-slate-800 text-slate-300 text-xs sm:text-sm">
                  🚗 Cab: <strong className="text-white font-mono font-bold">₹{computedDayCosts.totalTransport.toLocaleString('en-IN')}</strong>
                </span>
                <span className="bg-slate-900 px-3.5 py-1.5 rounded-xl border border-slate-800 text-slate-300 text-xs sm:text-sm">
                  🏨 Hotel: <strong className="text-sky-400 font-mono font-bold">₹{computedDayCosts.totalHotel.toLocaleString('en-IN')}</strong>
                </span>
                <span className="bg-slate-900 px-3.5 py-1.5 rounded-xl border border-slate-800 text-slate-300 text-xs sm:text-sm">
                  🎟 Activities: <strong className="text-amber-400 font-mono font-bold">₹{computedDayCosts.totalActivities.toLocaleString('en-IN')}</strong>
                </span>
                <span className="bg-emerald-950/90 px-4 py-1.5 rounded-xl border border-emerald-500/50 text-emerald-300 font-mono font-bold text-sm">
                  Total: ₹{computedDayCosts.totalComputedPackageCost.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs sm:text-sm text-emerald-400 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSyncPackageWithDays}
                  onChange={(e) => setAutoSyncPackageWithDays(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-0"
                />
                <span>Auto-sync Reserved Buying Cost with Days</span>
              </label>
              {computedDayCosts.totalComputedPackageCost > 0 && !autoSyncPackageWithDays && (
                <button
                  type="button"
                  onClick={handleSyncPackageCostFromDays}
                  className="text-xs text-emerald-300 hover:text-emerald-200 bg-emerald-950/80 border border-emerald-500/50 rounded-xl px-3 py-1 font-semibold cursor-pointer"
                >
                  Sync Now
                </button>
              )}
            </div>
          </div>

          {/* Separate Account Calculation Cards: Option A (Reserved) & Option B (Sharing) as per selected Pricing Mode */}
          <div className={`grid grid-cols-1 ${pricingMode === 'both' ? 'lg:grid-cols-2' : ''} gap-8`}>
            {/* OPTION A: RESERVED CAB FACILITY CARD (Shown in 'reserved' or 'both' mode) */}
            {(pricingMode === 'reserved' || pricingMode === 'both') && (
            <div className="bg-slate-950 border border-sky-500/40 rounded-2xl p-6 sm:p-7 space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-950 border border-sky-500/40 flex items-center justify-center text-sky-400 shrink-0">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base sm:text-lg flex items-center gap-2">
                      <span>Option A: Reserved Cab Facility</span>
                      <span className="text-xs bg-sky-950 text-sky-300 border border-sky-800 px-2.5 py-0.5 rounded-full font-mono font-bold">
                        Exclusive Private
                      </span>
                    </h4>
                    <span className="text-xs text-slate-400">Dedicated vehicle for entire journey</span>
                  </div>
                </div>
              </div>

              {/* Fixed Cab Fleet Selector for Reserved Cab */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs sm:text-sm text-slate-300 font-semibold">
                    Fixed Cab Fleet for Reserved Booking *
                  </label>
                  <span className="text-xs text-sky-400 font-mono font-semibold">Agency Fleet Standard</span>
                </div>

                {/* 4 Fixed Vehicles Quick Select Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {FIXED_RESERVED_VEHICLES.map((vehicle) => {
                    const isSelected = reservedCabVehicle.toLowerCase().includes(vehicle.shortLabel.toLowerCase()) ||
                      reservedCabVehicle.toLowerCase().includes(vehicle.id);
                    return (
                      <button
                        key={vehicle.id}
                        type="button"
                        onClick={() => {
                          setReservedCabVehicle(vehicle.name);
                          setReservedCabDesc(vehicle.description);
                        }}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-sky-950 border-sky-400 ring-2 ring-sky-400 text-white shadow-lg'
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-bold text-sm leading-tight text-white">{vehicle.name}</span>
                          <span className="text-xs font-mono px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-700 text-sky-300 font-bold">
                            {vehicle.capacity}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 mt-2 line-clamp-1">{vehicle.category}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Editable / customized text field */}
                <div className="pt-1">
                  <input
                    type="text"
                    placeholder="e.g. Innova / Xylo, Tata Sumo, Tempo Traveller, Swift / WagonR"
                    value={reservedCabVehicle}
                    onChange={(e) => setReservedCabVehicle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* 1. Buying Cost (Package Cost) */}
              <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-amber-300 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>Internal Package Cost (Buying Cost)</span>
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Confidential · Hidden from PDF</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Total Buying Cost (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3.5 text-slate-500 font-mono text-base">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={packageCost || ''}
                        onChange={(e) =>
                          handlePackageCostChange(e.target.value === '' ? 0 : Number(e.target.value))
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3.5 py-3 text-amber-300 font-mono font-bold text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="e.g. 35000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Buying / Person (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3.5 text-slate-500 font-mono text-base">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={Math.round((packageCost || 0) / totalPax) || ''}
                        onChange={(e) =>
                          handlePackagePerPersonChange(e.target.value === '' ? 0 : Number(e.target.value))
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3.5 py-3 text-amber-300 font-mono font-bold text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="e.g. 17500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Quoted Selling Cost */}
              <div className="bg-slate-900/90 p-5 rounded-2xl border border-sky-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-sky-300 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-sky-400" />
                    <span>Selling Price (Quoted to Guest)</span>
                  </span>
                  <span className="text-xs text-sky-300 font-bold bg-sky-950 px-3 py-1 rounded-full border border-sky-800">
                    Guest PDF Price
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Total Selling Price (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3.5 text-slate-500 font-mono text-base">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={sellingCost || ''}
                        onChange={(e) =>
                          handleSellingCostChange(e.target.value === '' ? 0 : Number(e.target.value))
                        }
                        className="w-full bg-slate-950 border border-sky-500/60 rounded-xl pl-8 pr-3.5 py-3 text-white font-mono font-bold text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                        placeholder="e.g. 50000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Selling / Person (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3.5 text-slate-500 font-mono text-base">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={Math.round((sellingCost || 0) / totalPax) || ''}
                        onChange={(e) =>
                          handleSellingPerPersonChange(e.target.value === '' ? 0 : Number(e.target.value))
                        }
                        className="w-full bg-slate-950 border border-sky-500/60 rounded-xl pl-8 pr-3.5 py-3 text-sky-300 font-mono font-bold text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                        placeholder="e.g. 25000"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Explicit Profit Formula: Profit = Selling Cost - Package Cost */}
              <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                    <Percent className="w-4 h-4 text-emerald-400" />
                    <span>Profit Calculation (Selling - Package)</span>
                  </span>
                  <span className="text-xs font-mono text-emerald-300 bg-emerald-950 px-3 py-1 rounded-full border border-emerald-800 font-bold">
                    Markup: {reservedProfitMarginPct || markupPercentage}%
                  </span>
                </div>

                {/* Profit formula highlight banner */}
                <div className="bg-slate-950/90 p-4 rounded-xl border border-emerald-500/30 text-sm flex flex-wrap items-center justify-between gap-3">
                  <div className="font-mono text-slate-300 text-xs sm:text-sm">
                    <span>₹{sellingCost.toLocaleString('en-IN')} (Selling)</span>
                    <span className="text-slate-500 mx-2">-</span>
                    <span>₹{packageCost.toLocaleString('en-IN')} (Package)</span>
                    <span className="text-emerald-400 mx-2">=</span>
                    <strong className="text-emerald-400 font-black text-base sm:text-lg">
                      ₹{reservedNetProfit.toLocaleString('en-IN')} Net Profit
                    </strong>
                  </div>
                </div>

                {/* Directly Editable Profit Amount */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs sm:text-sm font-bold text-emerald-300">
                      Direct Profit Amount Data (₹)
                    </label>
                    <span className="text-xs text-slate-400">Updates selling price automatically</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3.5 text-slate-500 font-mono text-base">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={reservedNetProfit || ''}
                      onChange={(e) =>
                        handleProfitAmountChange(e.target.value === '' ? 0 : Number(e.target.value))
                      }
                      className="w-full bg-slate-900 border border-emerald-500/60 rounded-xl pl-8 pr-3.5 py-3 text-emerald-300 font-mono font-bold text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g. 15000"
                    />
                  </div>
                </div>

                {/* Quick % preset pills */}
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {[15, 20, 25, 30, 35, 40, 50].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleMarkupChange(pct)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-mono font-bold transition-all cursor-pointer ${
                        markupPercentage === pct
                          ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                          : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      +{pct}%
                    </button>
                  ))}
                </div>

                {/* 50% Sales Executive Commission */}
                <div className="pt-3 border-t border-emerald-900/60 flex items-center justify-between">
                  <span className="text-amber-300 flex items-center gap-2 font-bold text-xs sm:text-sm">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>50% Executive Commission ({salesPerson.split(' ')[0]}):</span>
                  </span>
                  <span className="font-mono font-black text-amber-300 text-base sm:text-lg">
                    ₹{Math.round(reservedNetProfit * 0.5).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
            )}

            {/* OPTION B: SHARING CAB FACILITY CARD (Shown in 'sharing' or 'both' mode) */}
            {(pricingMode === 'sharing' || pricingMode === 'both') && (
              <div className="bg-slate-950 border border-amber-500/40 rounded-2xl p-6 sm:p-7 space-y-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base sm:text-lg flex items-center gap-2">
                        <span>Option B: Sharing Cab Facility</span>
                        <span className="text-xs bg-amber-950 text-amber-300 border border-amber-800 px-2.5 py-0.5 rounded-full font-mono font-bold">
                          Fixed Shared
                        </span>
                      </h4>
                      <span className="text-xs text-slate-400">Scheduled mountain taxi hub departures</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    {pricingMode === 'both' && (
                      <button
                        type="button"
                        onClick={handleAutoEstimateSharingFromReserved}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-300 bg-amber-950/80 hover:bg-amber-900 border border-amber-600/50 rounded-xl transition-colors cursor-pointer shadow-sm"
                        title="Auto-estimate Sharing package costs as ~30% lower than Reserved Dedicated Cab"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Auto-fill from Reserved (-30%)</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Fixed Sharing Cab Notice & Locked Vehicle */}
                <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-bold text-amber-300 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span>Fixed Sharing Cab: {FIXED_SHARING_VEHICLE.name}</span>
                    </span>
                    <span className="text-xs bg-amber-900/60 border border-amber-500/40 text-amber-200 px-2.5 py-0.5 rounded-full font-mono font-bold">
                      Union Standard
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {FIXED_SHARING_VEHICLE.fixedNotice}
                  </p>
                  <div className="flex items-center gap-2 pt-1 text-xs text-amber-300 font-mono">
                    <span className="bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                      Fleet: Tata Sumo / Mahindra Bolero
                    </span>
                    <span className="bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                      Capacity: Per Seat Basis
                    </span>
                  </div>
                </div>

                {/* 1. Sharing Buying Cost */}
                <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-amber-300 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span>Sharing Package Cost (Buying Cost)</span>
                    </span>
                    <span className="text-xs text-slate-500 font-medium">Confidential · Hidden from PDF</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5 font-medium">Total Buying Cost (₹)</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-3.5 text-slate-500 font-mono text-base">₹</span>
                        <input
                          type="number"
                          min="0"
                          value={sharingPackageCost || ''}
                          onChange={(e) =>
                            handleSharingPackageCostChange(e.target.value === '' ? 0 : Number(e.target.value))
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3.5 py-3 text-amber-300 font-mono font-bold text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                          placeholder="e.g. 26000"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5 font-medium">Buying / Person (₹)</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-3.5 text-slate-500 font-mono text-base">₹</span>
                        <input
                          type="number"
                          min="0"
                          value={Math.round((sharingPackageCost || 0) / totalPax) || ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : Number(e.target.value);
                            handleSharingPackageCostChange(val * totalPax);
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3.5 py-3 text-amber-300 font-mono font-bold text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                          placeholder="e.g. 13000"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Sharing Selling Cost */}
                <div className="bg-slate-900/90 p-5 rounded-2xl border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-amber-300 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-amber-400" />
                      <span>Sharing Selling Price (Quoted to Guest)</span>
                    </span>
                    <span className="text-xs text-amber-300 font-bold bg-amber-950 px-3 py-1 rounded-full border border-amber-800">
                      Guest PDF Option 2
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5 font-medium">Total Selling Price (₹)</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-3.5 text-slate-500 font-mono text-base">₹</span>
                        <input
                          type="number"
                          min="0"
                          value={sharingSellingCost || sharingTotal || ''}
                          onChange={(e) =>
                            handleSharingSellingCostChange(e.target.value === '' ? 0 : Number(e.target.value))
                          }
                          className="w-full bg-slate-950 border border-amber-500/60 rounded-xl pl-8 pr-3.5 py-3 text-white font-mono font-bold text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                          placeholder="e.g. 38000"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5 font-medium">Selling / Person (₹)</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-3.5 text-slate-500 font-mono text-base">₹</span>
                        <input
                          type="number"
                          min="0"
                          value={sharingPerPerson || Math.round((sharingSellingCost || sharingTotal || 0) / totalPax) || ''}
                          onChange={(e) =>
                            handleSharingPerPersonChange(e.target.value === '' ? 0 : Number(e.target.value))
                          }
                          className="w-full bg-slate-950 border border-amber-500/60 rounded-xl pl-8 pr-3.5 py-3 text-amber-300 font-mono font-bold text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                          placeholder="e.g. 19000"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Explicit Sharing Profit Formula: Profit = Selling Cost - Package Cost */}
                <div className="bg-amber-950/30 border border-amber-500/40 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-amber-300 flex items-center gap-2">
                      <Percent className="w-4 h-4 text-amber-400" />
                      <span>Sharing Profit Calculation</span>
                    </span>
                    <span className="text-xs font-mono text-amber-300 bg-amber-950 px-3 py-1 rounded-full border border-amber-800 font-bold">
                      Markup: {sharingProfitMarginPct || sharingMarkupPercentage}%
                    </span>
                  </div>

                  {/* Profit formula highlight banner */}
                  <div className="bg-slate-950/90 p-4 rounded-xl border border-amber-500/30 text-sm flex flex-wrap items-center justify-between gap-3">
                    <div className="font-mono text-slate-300 text-xs sm:text-sm">
                      <span>₹{currentSharingSelling.toLocaleString('en-IN')} (Selling)</span>
                      <span className="text-slate-500 mx-2">-</span>
                      <span>₹{sharingPackageCost.toLocaleString('en-IN')} (Package)</span>
                      <span className="text-amber-400 mx-2">=</span>
                      <strong className="text-amber-400 font-black text-base sm:text-lg">
                        ₹{sharingNetProfit.toLocaleString('en-IN')} Net Profit
                      </strong>
                    </div>
                  </div>

                  {/* Directly Editable Sharing Profit */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-bold text-amber-300">
                        Direct Sharing Profit Amount Data (₹)
                      </label>
                      <span className="text-xs text-slate-400">Updates sharing selling price</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3.5 text-slate-500 font-mono text-base">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={sharingNetProfit || ''}
                        onChange={(e) =>
                          handleSharingProfitAmountChange(e.target.value === '' ? 0 : Number(e.target.value))
                        }
                        className="w-full bg-slate-900 border border-amber-500/60 rounded-xl pl-8 pr-3.5 py-3 text-amber-300 font-mono font-bold text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="e.g. 12000"
                      />
                    </div>
                  </div>

                  {/* Quick % preset pills */}
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    {[15, 20, 25, 30, 35, 40, 50].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handleSharingMarkupChange(pct)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-mono font-bold transition-all cursor-pointer ${
                          sharingMarkupPercentage === pct
                            ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                            : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                        }`}
                      >
                        +{pct}%
                      </button>
                    ))}
                  </div>

                  {/* 50% Sales Executive Commission */}
                  <div className="pt-3 border-t border-amber-900/60 flex items-center justify-between">
                    <span className="text-amber-300 flex items-center gap-2 font-bold text-xs sm:text-sm">
                      <Award className="w-4 h-4 text-amber-400" />
                      <span>50% Executive Commission ({salesPerson.split(' ')[0]}):</span>
                    </span>
                    <span className="font-mono font-black text-amber-300 text-base sm:text-lg">
                      ₹{Math.round(sharingNetProfit * 0.5).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Client savings comparison strip if dual mode */}
          {(pricingMode === 'both' || (pricingMode as any) === 'dual_comparison') && reservedTotal > 0 && sharingTotal > 0 && reservedTotal > sharingTotal && (
            <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-2xl text-sm text-emerald-300 flex items-center justify-between">
              <span className="flex items-center gap-2 font-semibold">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Client Comparison Highlight:</span>
              </span>
              <span className="font-mono font-bold text-emerald-200">
                Guest saves ₹{(reservedTotal - sharingTotal).toLocaleString('en-IN')} by selecting Sharing Cab Facility
              </span>
            </div>
          )}

          {/* Booking Conversion & Accounts Flow / Unbook Action */}
          <div className="pt-6 border-t border-slate-800">
            {isConvertedToBooking ? (
              <div className="bg-emerald-950/60 border border-emerald-500/50 rounded-2xl p-6 sm:p-7 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base sm:text-lg flex items-center gap-2">
                        <span>Tour Converted & Confirmed in Accounts Ledger</span>
                        <span className="text-xs bg-emerald-900 text-emerald-200 px-3 py-0.5 rounded-full font-bold font-mono">
                          Active Booking
                        </span>
                      </h4>
                      <p className="text-sm text-emerald-400/90 mt-1">
                        Confirmed under{' '}
                        <strong>{selectedBookingOption === 'sharing' ? 'Sharing Cab Option' : 'Reserved Cab Option'}</strong>.
                        Advance payment recorded and 50% commission active in balance sheet.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {onOpenVoucher && (
                      <button
                        type="button"
                        onClick={() => onOpenVoucher(buildCurrentItinerary())}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
                        title="View & Download Official Booking Confirmation Voucher in PDF"
                      >
                        <FileCheck className="w-4 h-4 text-slate-950" />
                        <span>Download Voucher (PDF)</span>
                      </button>
                    )}

                    {/* UNBOOK BUTTON */}
                    <button
                      type="button"
                      onClick={handleRevertBooking}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-300 text-xs sm:text-sm font-bold rounded-xl transition-colors cursor-pointer shadow-sm"
                      title="Unbook this tour and delete the account record from the Accounts Ledger"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Unbook Tour</span>
                    </button>
                  </div>
                </div>

                {onNavigateToAccounts && (
                  <button
                    type="button"
                    onClick={onNavigateToAccounts}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold rounded-xl transition-colors cursor-pointer shadow-md"
                  >
                    <Wallet className="w-5 h-5" />
                    <span>View Live Balance Sheet in Accounts ↗</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-white font-bold text-base block">
                      Status: Unconverted Quotation
                    </span>
                    <span className="text-slate-400 text-xs sm:text-sm mt-0.5 block">
                      The Accounts & Balance Sheet section remains clean and blank for this tour until marked converted with an advance payment.
                    </span>
                  </div>

                  {!showConvertForm && (
                    <button
                      type="button"
                      onClick={() => setShowConvertForm(true)}
                      className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer shrink-0 hover:scale-102"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Convert to Booking & Send to Accounts</span>
                    </button>
                  )}
                </div>

                {/* Conversion / Advance Payment Form */}
                {showConvertForm && (
                  <div className="bg-slate-950 border border-emerald-500/50 rounded-2xl p-6 sm:p-7 space-y-6 animate-fade-in shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                      <span className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-emerald-400" />
                        <span>Record Advance Payment & Confirm Booking</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowConvertForm(false)}
                        className="text-xs sm:text-sm text-slate-400 hover:text-white cursor-pointer px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800"
                      >
                        Cancel
                      </button>
                    </div>

                    {/* Option Choice for booking */}
                    {(pricingMode === 'both' || (pricingMode as any) === 'dual_comparison') && (
                      <div className="space-y-2">
                        <label className="block text-xs sm:text-sm font-bold text-slate-300">
                          Select Confirmed Cab Facility *
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <label
                            className={`p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                              selectedBookingOption === 'reserved'
                                ? 'bg-sky-950/60 border-sky-500 text-white ring-1 ring-sky-500'
                                : 'bg-slate-900 border-slate-800 text-slate-400'
                            }`}
                          >
                            <input
                              type="radio"
                              name="cabOption"
                              checked={selectedBookingOption === 'reserved'}
                              onChange={() => setSelectedBookingOption('reserved')}
                              className="w-4 h-4 text-sky-500"
                            />
                            <div>
                              <span className="font-bold text-sm block">Reserved Cab (₹{sellingCost.toLocaleString('en-IN')})</span>
                              <span className="text-xs text-slate-400">Exclusive dedicated private vehicle</span>
                            </div>
                          </label>

                          <label
                            className={`p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                              selectedBookingOption === 'sharing'
                                ? 'bg-amber-950/60 border-amber-500 text-white ring-1 ring-amber-500'
                                : 'bg-slate-900 border-slate-800 text-slate-400'
                            }`}
                          >
                            <input
                              type="radio"
                              name="cabOption"
                              checked={selectedBookingOption === 'sharing'}
                              onChange={() => setSelectedBookingOption('sharing')}
                              className="w-4 h-4 text-amber-500"
                            />
                            <div>
                              <span className="font-bold text-sm block">
                                Sharing Cab (₹{(sharingSellingCost || sharingTotal).toLocaleString('en-IN')})
                              </span>
                              <span className="text-xs text-slate-400">Budget friendly shared transport</span>
                            </div>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Advance Amount */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs sm:text-sm font-bold text-slate-300">
                            Advance Token Received (₹) *
                          </label>
                          <div className="flex items-center gap-1.5">
                            {[
                              {
                                label: '25%',
                                val: Math.round(
                                  (selectedBookingOption === 'sharing'
                                    ? sharingSellingCost || sharingTotal
                                    : sellingCost) * 0.25
                                ),
                              },
                              {
                                label: '30%',
                                val: Math.round(
                                  (selectedBookingOption === 'sharing'
                                    ? sharingSellingCost || sharingTotal
                                    : sellingCost) * 0.3
                                ),
                              },
                              {
                                label: '50%',
                                val: Math.round(
                                  (selectedBookingOption === 'sharing'
                                    ? sharingSellingCost || sharingTotal
                                    : sellingCost) * 0.5
                                ),
                              },
                            ].map((preset) => (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => setAdvanceAmount(preset.val)}
                                className="text-xs font-bold text-slate-400 hover:text-white bg-slate-800 px-2.5 py-1 rounded-lg cursor-pointer"
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={advanceAmount || ''}
                          onChange={(e) => setAdvanceAmount(Number(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-emerald-500/60 rounded-xl px-4 py-3 text-emerald-400 font-mono font-bold text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="e.g. 15000"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-1">Payment Mode</label>
                        <select
                          value={paymentMode}
                          onChange={(e) => setPaymentMode(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="upi">UPI / GPay / PhonePe / QR</option>
                          <option value="net_banking">Net Banking / NEFT / IMPS</option>
                          <option value="cash">Cash In Hand</option>
                          <option value="credit_card">Credit / Debit Card</option>
                          <option value="cheque">Bank Cheque</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-1">Payment Date</label>
                        <input
                          type="date"
                          value={paymentDate}
                          onChange={(e) => setPaymentDate(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-1">UTR / Transaction Reference #</label>
                        <input
                          type="text"
                          placeholder="e.g. UPI/293819/HDFC"
                          value={paymentReference}
                          onChange={(e) => setPaymentReference(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleConvertBooking}
                      className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm sm:text-base font-bold rounded-2xl shadow-xl transition-all cursor-pointer hover:scale-[1.01]"
                    >
                      <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                      <span>Confirm Booking & Credit ₹{advanceAmount.toLocaleString('en-IN')} to Balance Sheet</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 3 Navigation Footer */}
          {activeSection !== 'full_view' && (
            <div className="pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setActiveSection('days')}
                className="inline-flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
              >
                <span>⬅ Step 2: Tour Plan</span>
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveSection('policies')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition-all cursor-pointer shadow-lg hover:scale-102"
                >
                  <span>Continue to Step 4: Policies, Terms & Refund ➜</span>
                </button>
              </div>
            </div>
          )}
        </div>
        )}

        {/* =====================================================================
            SECTION 4: POLICIES, TERMS & CONDITIONS, REFUND POLICY & BANK QR
            (User Order: 4. Policies and terms and condition other information with refund policy also)
            ===================================================================== */}
        {(activeSection === 'policies' || activeSection === 'full_view') && (
          <PoliciesSection
            destination={destination}
            title={title}
            commonInclusions={commonInclusions}
            setCommonInclusions={setCommonInclusions}
            commonExclusions={commonExclusions}
            setCommonExclusions={setCommonExclusions}
            termsAndConditions={termsAndConditions}
            setTermsAndConditions={setTermsAndConditions}
            specialAdvisories={specialAdvisories}
            setSpecialAdvisories={setSpecialAdvisories}
            cancellationRefundPolicy={cancellationRefundPolicy}
            setCancellationRefundPolicy={setCancellationRefundPolicy}
            companyProfile={companyProfile}
            qrInputRef={qrInputRef}
            handleQrUpload={handleQrUpload}
            onOpenSettings={onOpenSettings}
            onPrev={() => setActiveSection('rates')}
            onNext={() => setActiveSection('full_view')}
            isFullView={activeSection === 'full_view'}
          />
        )}

        {/* =====================================================================
            SECTION 5: FULL VIEW (ALL INFORMATION) & FINAL PREVIEW / SAVE / PDF
            (User Order: 5. Full view section at the last after adding all information.
             After that there should be a preview button before saving it and generating pdf)
            ===================================================================== */}
        {activeSection === 'full_view' && (
          <FullViewSection
            guestName={guestName}
            destination={destination}
            daysCount={days.length}
            nightsCount={durationNights}
            pricingMode={pricingMode}
            sellingCost={sellingCost}
            sharingSellingCost={sharingSellingCost}
            onPreview={handlePreview}
            onSave={handleSave}
            onDownloadPdf={handlePreview}
            onJumpToStep={(step) => setActiveSection(step)}
          />
        )}
      </div>

      {/* Upload Itinerary From Text Modal (Unified JARVIS Suite) */}
      <TextItineraryUploadModal
        isOpen={isTextUploadOpen}
        onClose={() => setIsTextUploadOpen(false)}
        destinationContext={destination || 'Sikkim & North East'}
        leads={leads}
        onApplyParsedItinerary={handleApplyParsedItinerary}
      />

      {/* Image Upload & Selection Modal */}
      {imageModalTarget !== null && (() => {
        const isHero = imageModalTarget === 'hero';
        const dayTarget =
          typeof imageModalTarget === 'number'
            ? days.find((d) => d.dayNumber === imageModalTarget)
            : null;
        const defaultHeroFallback = getDefaultDestinationCover(destination, title);
        const defaultDayFallback =
          typeof imageModalTarget === 'number'
            ? getDefaultDayImage(destination, imageModalTarget, dayTarget?.title, dayTarget?.nightStay)
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
                ? 'Upload your own custom cover banner from your computer or choose from the curated library.'
                : `Upload custom tour photos for Day ${imageModalTarget}${dayTarget?.title ? ` (${dayTarget.title})` : ''} or select from the gallery.`
            }
            currentImageUrl={isHero ? heroImageUrl : dayTarget?.imageUrl || defaultDayFallback?.url}
            currentCaption={isHero ? heroImageCaption : dayTarget?.imageCaption || defaultDayFallback?.caption}
            destinationContext={destination}
            defaultFallback={isHero ? defaultHeroFallback : defaultDayFallback || undefined}
            onClose={() => setImageModalTarget(null)}
            onApply={(imgUrl, newCaption) => {
              if (isHero) {
                setHeroImageUrl(imgUrl);
                setHeroImageCaption(newCaption);
                saveCustomDestinationImage({
                  title: newCaption || destination || 'Custom Tour Cover',
                  url: imgUrl,
                  caption: newCaption || `${destination} Scenic Tour`,
                  destination: destination || 'North East',
                  category: 'cover',
                });
              } else if (typeof imageModalTarget === 'number') {
                setDays(
                  days.map((d) => {
                    if (d.dayNumber === imageModalTarget) {
                      return {
                        ...d,
                        imageUrl: imgUrl,
                        imageCaption: newCaption,
                      };
                    }
                    return d;
                  })
                );
                saveCustomDestinationImage({
                  title: newCaption || dayTarget?.title || `Day ${imageModalTarget} Sightseeing`,
                  url: imgUrl,
                  caption: newCaption || dayTarget?.title || `Day ${imageModalTarget} Sightseeing`,
                  destination: destination || 'North East',
                  category: 'sightseeing',
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
