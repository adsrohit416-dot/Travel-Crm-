export interface CompanyProfile {
  name: string;
  tagline: string;
  website: string;
  email: string;
  phone1: string;
  phone2: string;
  whatsapp: string;
  addressSiliguri: string;
  addressGangtok: string;
  gstin?: string;
  govRegNo?: string;
  logoUrl: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  accountType?: string;
  ifscCode: string;
  branch: string;
  upiId: string;
  upiQrCodeUrl?: string;
}

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'itinerary_sent'
  | 'follow_up'
  | 'negotiation'
  | 'booked'
  | 'lost';

export type LeadPriority = 'high' | 'medium' | 'low';

export type CabPreference = 'reserved' | 'sharing' | 'both';

export type TripStatus = 'upcoming' | 'in_progress' | 'completed' | 'cancelled';

export interface InteractionLog {
  id: string;
  timestamp: string;
  type: 'call' | 'whatsapp' | 'email' | 'meeting' | 'note';
  summary: string;
  outcome?: string;
  loggedBy: string;
}

export interface Lead {
  id: string;
  guestName: string;
  phone: string;
  email: string;
  city?: string;
  destination: string;
  travelStartDate?: string;
  travelEndDate?: string;
  durationDays: number;
  durationNights: number;
  adults: number;
  children: number;
  infants: number;
  preferredCab: CabPreference;
  budget?: string;
  status: LeadStatus;
  priority: LeadPriority;
  source: string;
  salesPerson?: string; // Assigned Sales Person / Executive
  hotelName?: string; // Preferred or booked hotel name
  packageCost?: number; // Internal confidential buying cost
  sellingCost?: number; // Total agreed selling cost
  markupPercentage?: number; // Selling cost markup in %
  tripStatus?: TripStatus; // Lifecycle of trip
  tripCompletedDate?: string;
  nextFollowUpDate: string; // YYYY-MM-DD
  nextFollowUpTime?: string;
  notes: string;
  logs: InteractionLog[];
  quoteNumber?: string; // Linked Quotation Number (e.g. NED-2026-1234)
  packageCostSharing?: number; // Internal confidential buying cost for sharing option
  sellingCostSharing?: number; // Quoted selling cost for sharing option
  itineraryId?: string;
  voucherIssued?: boolean; // Whether the first-time booking voucher has been issued
  voucherIssuedAt?: string; // Timestamp when voucher was first provided
  voucherNumber?: string; // e.g. VCH-2026-XXXX
  createdAt: string;
  updatedAt: string;
}

export interface ItineraryDay {
  id: string;
  dayNumber: number;
  title: string;
  date?: string;
  description: string;
  sightseeingHighlights: string[];
  nightStay: string;
  mealPlan: string;
  transportDetails: string;
  imageUrl?: string;
  imageCaption?: string;

  // Day-wise Costing & Accommodation (Internal / Company Only)
  hotelName?: string; // Hotel Name for this day/night (e.g. Hotel Summit Golden Crescent)
  hotelPricingMode?: 'per_night' | 'per_person'; // Price mode: 'per_night' (per room/night) or 'per_person'
  hotelCostPerNight?: number; // Cost of 1 room per night (₹)
  hotelCostPerPerson?: number; // Cost per person per night (₹)
  roomCount?: number; // Number of rooms required (e.g. 2 for 4 adults)
  hotelTotalCost?: number; // Total hotel cost for tonight (₹)
  transportCost?: number; // Transportation cab cost for this day (₹)
  transportVehicle?: string; // Assigned vehicle type for this day
  activityCost?: number; // Extra permits, tickets, or guide fees for this day (₹)
}

export interface CabOptionRate {
  enabled: boolean;
  name: string;
  vehicleType: string;
  description: string;
  pricePerPerson: number;
  totalPackagePrice: number;
  gstPercentage?: number;
  gstIncluded?: boolean;
  specificInclusions: string[];
  specificExclusions: string[];
}

export interface FixedCabFleetItem {
  id: string;
  name: string;
  shortLabel: string;
  capacity: string;
  category: string;
  description: string;
}

export const FIXED_RESERVED_VEHICLES: FixedCabFleetItem[] = [
  {
    id: 'innova_xylo',
    name: 'Innova / Xylo',
    shortLabel: 'Innova / Xylo',
    capacity: '4 - 6 Pax',
    category: 'SUV / MUV',
    description: 'Dedicated Toyota Innova / Mahindra Xylo allocated exclusively for your group.',
  },
  {
    id: 'tata_sumo_reserved',
    name: 'Tata Sumo (Reserved Dedicated)',
    shortLabel: 'Tata Sumo',
    capacity: '6 - 8 Pax',
    category: 'Dedicated Mountain SUV',
    description: 'Rugged high-ground clearance mountain SUV exclusively for your tour party.',
  },
  {
    id: 'tempo_traveller',
    name: 'Tempo Traveller',
    shortLabel: 'Tempo Traveller',
    capacity: '9 - 26 Pax',
    category: 'Mini Coach',
    description: 'Spacious Force Tempo Traveller with push-back seats, ideal for family and group tours.',
  },
  {
    id: 'small_cab_swift_wagonr',
    name: 'Small Cab (Swift / WagonR)',
    shortLabel: 'Swift / WagonR',
    capacity: '1 - 4 Pax',
    category: 'Small Cab (Hatchback/Sedan)',
    description: 'Private dedicated Maruti Swift / WagonR for budget-friendly small group travel.',
  },
];

export const FIXED_SHARING_VEHICLE = {
  name: 'Tata Sumo / Mahindra Bolero',
  shortLabel: 'Tata Sumo / Bolero',
  capacity: 'Per Seat Transit',
  category: 'Fixed Shared Hill Vehicle',
  description: 'Seat allocation in shared Tata Sumo / Mahindra Bolero on scheduled departure slots between taxi hubs.',
  fixedNotice: 'In Sharing Cab, the vehicle is strictly fixed to Tata Sumo / Bolero as per North East mountain union norms.',
};

export interface Itinerary {
  id: string;
  quoteNumber: string;
  title: string;
  destination?: string;
  heroImageUrl?: string;
  heroImageCaption?: string;
  leadId?: string;
  salesPerson?: string; // Assigned sales person
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  guestCity: string;
  adults: number;
  children: number;
  infants: number;
  travelStartDate: string;
  travelEndDate: string;
  durationDays: number;
  durationNights: number;
  pickupLocation: string;
  dropLocation: string;
  hotelCategory: string;
  mealPlan: string;

  // 3 Types of Package Cost as per Cab: Reserved, Sharing, Both (Dual Comparison)
  pricingMode: 'reserved' | 'sharing' | 'both' | 'single' | 'dual_comparison';
  reservedCab: CabOptionRate;
  sharingCab: CabOptionRate;

  // Internal Confidential Accounting & Costing Breakdown (visible ONLY to company staff, NEVER in guest PDF)
  packageCost?: number; // Total internal buying cost (Sum of Day Transports + Hotel Stays + Activities)
  packageCostPerPerson?: number; // Package cost per person (packageCost / pax)
  markupPercentage?: number; // Selling cost markup in % (e.g. 25%)
  sellingCost?: number; // Total finalized selling price to guest
  sellingCostPerPerson?: number; // Selling price per person (sellingCost / pax)
  totalTransportCost?: number; // Sum of day-wise transportation costs
  totalHotelCost?: number; // Sum of day-wise hotel costs
  totalActivitiesCost?: number; // Sum of day-wise activities/permits

  // Internal Confidential Accounting for Sharing Cab Option
  packageCostSharing?: number; // Total internal buying cost for sharing cab option
  packageCostPerPersonSharing?: number; // Package cost per person for sharing cab
  markupPercentageSharing?: number; // Markup % for sharing cab
  sellingCostSharing?: number; // Total finalized selling price for sharing cab
  sellingCostPerPersonSharing?: number; // Selling price per person for sharing cab
  selectedBookingOption?: 'reserved' | 'sharing'; // Which option was chosen on booking conversion

  tripStatus?: TripStatus;
  tripCompletedDate?: string;
  voucherIssued?: boolean; // Whether first-time booking voucher has been generated
  voucherIssuedAt?: string;
  voucherNumber?: string;

  days: ItineraryDay[];
  commonInclusions: string[];
  commonExclusions: string[];
  specialAdvisories: string[];
  termsAndConditions: string[];
  cancellationRefundPolicy?: string[];
  paymentMilestones: {
    title: string;
    percentage: number;
    description: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// ACCOUNTING, BALANCE SHEET & PROFIT MODELS
// ==========================================

export interface ClientPayment {
  id: string;
  date: string;
  amount: number;
  paymentMode: 'upi' | 'net_banking' | 'cash' | 'credit_card' | 'cheque';
  referenceNumber?: string; // Transaction Ref / UTR #
  notes?: string;
  recordedBy?: string;
}

export interface VendorExpense {
  id: string;
  date: string;
  category: 'hotel' | 'cab_driver' | 'permits' | 'activity_entry' | 'train_flight' | 'guide' | 'other';
  vendorName: string; // e.g., "Hotel Mayur Gangtok", "Lachung Driver Karma", "Sikkim Tourism Dept"
  amountPaid: number;
  totalAgreedCost: number; // Total agreed vendor charge
  paymentMode: 'upi' | 'bank_transfer' | 'cash' | 'card';
  referenceNumber?: string;
  notes?: string;
  status: 'paid' | 'partial' | 'pending';
}

export interface TripAccount {
  id: string;
  leadId?: string;
  itineraryId?: string;
  quoteNumber: string;
  guestName: string;
  guestPhone: string;
  destination: string;
  salesPerson: string; // Assigned Sales Executive
  travelDates?: string;
  tripStatus: TripStatus;
  tripCompletedDate?: string;

  // Confidential Financials (NOT shared with guests)
  sellingCost: number; // Quoted/Billed amount to client
  packageCost: number; // Estimated base vendor buying cost

  // Inflows (Received from Guest)
  clientPayments: ClientPayment[];

  // Outflows (Paid to Suppliers/Vendors)
  vendorExpenses: VendorExpense[];

  // Profit & Sales Commission Share (50% rule)
  salesCommissionPercentage: number; // Default 50%
  salesCommissionPaid: boolean;
  salesCommissionPaidDate?: string;
  salesCommissionRef?: string;
  salesCommissionNotes?: string;

  voucherIssued?: boolean;
  voucherIssuedAt?: string;
  voucherNumber?: string;

  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// SALES PERSON & COMMISSION EXECUTIVE MODELS
// ==========================================

export interface SalesPerson {
  id: string;
  name: string;
  role?: string;
  phone?: string;
  email?: string;
  upiId?: string; // UPI ID for 50% profit share disbursement
  commissionPercentage?: number; // Defaults to 50%
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

// ==========================================
// TOUR BOOKING CONFIRMATION VOUCHER MODEL
// ==========================================

export interface BookingVoucherData {
  voucherNumber: string;
  confirmationDate: string;
  leadId?: string;
  itineraryId?: string;
  quoteNumber: string;
  tripStatus: TripStatus;

  // Guest & Traveler Information
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  guestCity?: string;
  adults: number;
  children: number;
  infants: number;
  totalPax: number;
  salesPerson: string;

  // Package & Tour Circuit Information
  title: string;
  destination: string;
  travelStartDate?: string;
  travelEndDate?: string;
  durationDays: number;
  durationNights: number;
  pickupLocation?: string;
  dropLocation?: string;
  hotelCategory?: string;
  hotelName?: string;
  mealPlan?: string;

  // Cab & Fleet Facility Details
  preferredCab?: string;
  assignedVehicle?: string;
  cabFacilityDescription?: string;

  // Day-wise Tour Schedule
  days?: {
    dayNumber: number;
    title: string;
    nightStay?: string;
    mealPlan?: string;
    sightseeingHighlights?: string[];
    date?: string;
  }[];

  // Financial Summary & Advance Received
  sellingCost: number;
  advanceAmount: number;
  balanceDue: number;
  paymentMode: string;
  paymentDate: string;
  referenceNumber: string;
  paymentNotes?: string;

  // Inclusions, Exclusions & Regional Advisories
  inclusions?: string[];
  exclusions?: string[];
  advisories?: string[];
  termsAndConditions?: string[];
}


