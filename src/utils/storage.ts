import { initialSampleAccounts } from '../data/defaultAccounts';
import { initialSalesPersons } from '../data/defaultSalesPersons';
import {
  defaultCompanyProfile,
  initialSampleLeads,
  preconfiguredTemplates,
} from '../data/defaultTemplates';
import {
  ClientPayment,
  CompanyProfile,
  Itinerary,
  Lead,
  SalesPerson,
  TripAccount,
  TripStatus,
  VendorExpense,
} from '../types';

const STORAGE_KEYS = {
  COMPANY: 'ned_company_profile',
  LEADS: 'ned_leads_crm',
  ITINERARIES: 'ned_itineraries',
  ACCOUNTS: 'ned_accounts_ledger',
  SALES_PERSONS: 'ned_sales_persons',
};

export const getCompanyProfile = (): CompanyProfile => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.COMPANY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to load company profile from localStorage', err);
  }
  return defaultCompanyProfile;
};

export const saveCompanyProfile = (profile: CompanyProfile): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to save company profile', err);
  }
};

export const getLeads = (): Lead[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.LEADS);
    if (data) {
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to load leads from localStorage', err);
  }
  // Initialize with rich sample leads
  saveLeads(initialSampleLeads);
  return initialSampleLeads;
};

export const saveLeads = (leads: Lead[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads));
  } catch (err) {
    console.error('Failed to save leads', err);
  }
};

export const getItineraries = (): Itinerary[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ITINERARIES);
    if (data) {
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to load itineraries from localStorage', err);
  }

  // Pre-seed with the first template as an initial saved quote
  const seedItineraries: Itinerary[] = preconfiguredTemplates.map((tpl, idx) => ({
    ...tpl,
    id: `itin-init-${idx + 1}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  saveItineraries(seedItineraries);
  return seedItineraries;
};

export const saveItineraries = (itineraries: Itinerary[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.ITINERARIES, JSON.stringify(itineraries));
  } catch (err) {
    console.error('Failed to save itineraries', err);
  }
};

// ==========================================
// TRIP ACCOUNTS & BALANCE SHEET STORAGE
// ==========================================

export const getTripAccounts = (): TripAccount[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    if (data !== null) {
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to load trip accounts from localStorage', err);
  }
  // Initialize with sample accounts only if never set before
  saveTripAccounts(initialSampleAccounts);
  return initialSampleAccounts;
};

export const saveTripAccounts = (accounts: TripAccount[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  } catch (err) {
    console.error('Failed to save trip accounts', err);
  }
};

export const clearAllTripAccounts = (): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify([]));
  } catch (err) {
    console.error('Failed to clear trip accounts', err);
  }
};

// ==========================================
// SALES TEAM & EXECUTIVES STORAGE
// ==========================================

export const getSalesPersons = (): SalesPerson[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SALES_PERSONS);
    if (data !== null) {
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to load sales team from localStorage', err);
  }
  // Initialize with predefined default sales team
  saveSalesPersons(initialSalesPersons);
  return initialSalesPersons;
};

export const saveSalesPersons = (team: SalesPerson[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SALES_PERSONS, JSON.stringify(team));
  } catch (err) {
    console.error('Failed to save sales team', err);
  }
};

/**
 * Creates or synchronizes a TripAccount whenever a lead is converted or marked booked.
 */
export const convertLeadToBookingAccount = (
  lead: Lead,
  payload: {
    sellingCost: number;
    packageCost: number;
    advanceAmount: number;
    paymentMode: 'upi' | 'net_banking' | 'cash' | 'credit_card' | 'cheque';
    paymentDate: string;
    referenceNumber: string;
    paymentNotes: string;
    salesPerson: string;
    tripStatus: TripStatus;
    quoteNumber: string;
    travelDates: string;
  },
  existingAccounts: TripAccount[] = []
): {
  updatedLead: Lead;
  updatedAccounts: TripAccount[];
  createdOrUpdatedAccount: TripAccount;
  isFirstTimeConversion: boolean;
  voucherNumber: string;
} => {
  const isFirstTimeConversion = !lead.voucherIssued;
  const currentYear = new Date().getFullYear();
  const voucherNumber =
    lead.voucherNumber ||
    `VCH-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`;

  const existingIdx = existingAccounts.findIndex(
    (acc) => acc.leadId === lead.id || acc.quoteNumber === payload.quoteNumber
  );

  const newPayment: ClientPayment = {
    id: `cp-${Date.now()}`,
    date: payload.paymentDate,
    amount: payload.advanceAmount,
    paymentMode: payload.paymentMode,
    referenceNumber: payload.referenceNumber,
    notes: payload.paymentNotes || 'Booking Advance Deposit',
    recordedBy: payload.salesPerson,
  };

  let targetAccount: TripAccount;
  let nextAccounts: TripAccount[];

  if (existingIdx >= 0) {
    const existing = existingAccounts[existingIdx];
    const payments =
      payload.advanceAmount > 0
        ? [newPayment, ...(existing.clientPayments || [])]
        : existing.clientPayments || [];

    targetAccount = {
      ...existing,
      guestName: lead.guestName,
      guestPhone: lead.phone,
      destination: lead.destination,
      salesPerson: payload.salesPerson,
      travelDates: payload.travelDates || existing.travelDates,
      tripStatus: payload.tripStatus,
      sellingCost: payload.sellingCost,
      packageCost: payload.packageCost,
      clientPayments: payments,
      voucherIssued: true,
      voucherIssuedAt: existing.voucherIssuedAt || new Date().toISOString(),
      voucherNumber: existing.voucherNumber || voucherNumber,
      updatedAt: new Date().toISOString(),
    };

    nextAccounts = [...existingAccounts];
    nextAccounts[existingIdx] = targetAccount;
  } else {
    targetAccount = {
      id: `acc-${Date.now()}`,
      leadId: lead.id,
      quoteNumber: payload.quoteNumber,
      guestName: lead.guestName,
      guestPhone: lead.phone,
      destination: lead.destination,
      salesPerson: payload.salesPerson,
      travelDates: payload.travelDates,
      tripStatus: payload.tripStatus,
      sellingCost: payload.sellingCost,
      packageCost: payload.packageCost,
      clientPayments: payload.advanceAmount > 0 ? [newPayment] : [],
      vendorExpenses: [],
      salesCommissionPercentage: 50,
      salesCommissionPaid: false,
      voucherIssued: true,
      voucherIssuedAt: new Date().toISOString(),
      voucherNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    nextAccounts = [targetAccount, ...existingAccounts];
  }

  saveTripAccounts(nextAccounts);

  const updatedLead: Lead = {
    ...lead,
    status: 'booked',
    salesPerson: payload.salesPerson,
    sellingCost: payload.sellingCost,
    packageCost: payload.packageCost,
    tripStatus: payload.tripStatus,
    voucherIssued: true,
    voucherIssuedAt: lead.voucherIssuedAt || new Date().toISOString(),
    voucherNumber,
    logs: [
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        type: 'note',
        summary: `🎉 Converted to Confirmed Booking! Voucher #${voucherNumber} issued. Advance deposit of ₹${payload.advanceAmount.toLocaleString('en-IN')} received via ${payload.paymentMode.toUpperCase()} (Ref: ${payload.referenceNumber}). Synced with Accounts Balance Sheet.`,
        loggedBy: payload.salesPerson,
      },
      ...(lead.logs || []),
    ],
  };

  return {
    updatedLead,
    updatedAccounts: nextAccounts,
    createdOrUpdatedAccount: targetAccount,
    isFirstTimeConversion,
    voucherNumber,
  };
};

/**
 * Creates or synchronizes a TripAccount whenever a lead is converted or marked booked.
 */
export const syncTripAccount = (
  lead: Lead,
  itinerary?: Itinerary,
  existingAccounts: TripAccount[] = []
): TripAccount[] => {
  const existingIdx = existingAccounts.findIndex(
    (acc) => acc.leadId === lead.id || (itinerary && acc.quoteNumber === itinerary.quoteNumber)
  );

  const defaultSalesPerson = lead.salesPerson || itinerary?.salesPerson || 'Rohit Sharma';
  const selling = lead.sellingCost || itinerary?.sellingCost || (itinerary?.reservedCab?.totalPackagePrice || 45000);
  const buying = lead.packageCost || itinerary?.packageCost || Math.round(selling * 0.68); // ~32% margin estimate if not set

  if (existingIdx >= 0) {
    const updated = [...existingAccounts];
    updated[existingIdx] = {
      ...updated[existingIdx],
      guestName: lead.guestName,
      guestPhone: lead.phone,
      destination: lead.destination,
      salesPerson: defaultSalesPerson,
      travelDates: lead.travelStartDate ? `${lead.travelStartDate} to ${lead.travelEndDate || ''}` : updated[existingIdx].travelDates,
      tripStatus: lead.tripStatus || updated[existingIdx].tripStatus,
      sellingCost: selling || updated[existingIdx].sellingCost,
      packageCost: buying || updated[existingIdx].packageCost,
      updatedAt: new Date().toISOString(),
    };
    saveTripAccounts(updated);
    return updated;
  }

  const newAccount: TripAccount = {
    id: `acc-${Date.now()}`,
    leadId: lead.id,
    itineraryId: itinerary?.id,
    quoteNumber: itinerary?.quoteNumber || `NED-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    guestName: lead.guestName,
    guestPhone: lead.phone,
    destination: lead.destination,
    salesPerson: defaultSalesPerson,
    travelDates: lead.travelStartDate ? `${lead.travelStartDate} to ${lead.travelEndDate || ''}` : 'Upcoming Travel Window',
    tripStatus: lead.tripStatus || (lead.status === 'booked' ? 'upcoming' : 'upcoming'),
    sellingCost: selling,
    packageCost: buying,
    clientPayments: [],
    vendorExpenses: [],
    salesCommissionPercentage: 50,
    salesCommissionPaid: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updated = [newAccount, ...existingAccounts];
  saveTripAccounts(updated);
  return updated;
};

/**
 * Converts an Itinerary into a confirmed booking in the Accounts section
 * with client advance payment credited and 50% profit calculated.
 */
export const convertItineraryToBookingAccount = (
  itinerary: Itinerary,
  payload: {
    advanceAmount: number;
    paymentMode: 'upi' | 'net_banking' | 'cash' | 'credit_card' | 'cheque';
    paymentDate: string;
    referenceNumber: string;
    paymentNotes: string;
    salesPerson: string;
    sellingCost: number;
    packageCost: number;
  },
  existingAccounts: TripAccount[] = []
): {
  updatedItinerary: Itinerary;
  updatedAccounts: TripAccount[];
  createdOrUpdatedAccount: TripAccount;
  isFirstTimeConversion: boolean;
  voucherNumber: string;
} => {
  const isFirstTimeConversion = !itinerary.voucherIssued;
  const currentYear = new Date().getFullYear();
  const voucherNumber =
    itinerary.voucherNumber ||
    `VCH-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`;

  const existingIdx = existingAccounts.findIndex(
    (acc) => acc.quoteNumber === itinerary.quoteNumber || (itinerary.leadId && acc.leadId === itinerary.leadId)
  );

  const newPayment: ClientPayment = {
    id: `cp-${Date.now()}`,
    date: payload.paymentDate,
    amount: payload.advanceAmount,
    paymentMode: payload.paymentMode,
    referenceNumber: payload.referenceNumber,
    notes: payload.paymentNotes || 'Booking Advance Deposit',
    recordedBy: payload.salesPerson,
  };

  // Extract day-wise vendor expenses from itinerary (Transportation & Hotel Breakdown)
  const extractedExpenses: VendorExpense[] = [];
  if (itinerary.days && itinerary.days.length > 0) {
    itinerary.days.forEach((day) => {
      const dayDate = day.date || itinerary.travelStartDate || new Date().toISOString().split('T')[0];

      // Day-wise Cab / Transportation
      if (day.transportCost && day.transportCost > 0) {
        extractedExpenses.push({
          id: `ve-cab-${day.dayNumber}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          date: dayDate,
          category: 'cab_driver',
          vendorName: `Day ${day.dayNumber} Cab (${day.transportVehicle || day.transportDetails || 'Dedicated Vehicle'})`,
          totalAgreedCost: day.transportCost,
          amountPaid: 0,
          paymentMode: 'upi',
          status: 'pending',
          notes: `Day ${day.dayNumber} transport: ${day.title || 'Sightseeing / Transfer'}`,
        });
      }

      // Hotel Accommodation (Per Day / Night with Room count)
      const hotelCost =
        day.hotelTotalCost ||
        (day.hotelCostPerNight
          ? day.hotelCostPerNight * (day.roomCount || Math.max(1, Math.ceil((itinerary.adults || 2) / 2)))
          : 0);

      if (hotelCost > 0) {
        const rooms = day.roomCount || Math.max(1, Math.ceil((itinerary.adults || 2) / 2));
        extractedExpenses.push({
          id: `ve-hotel-${day.dayNumber}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          date: dayDate,
          category: 'hotel',
          vendorName: day.hotelName || `Day ${day.dayNumber} Stay (${day.nightStay || 'Hotel'})`,
          totalAgreedCost: hotelCost,
          amountPaid: 0,
          paymentMode: 'bank_transfer',
          status: 'pending',
          notes: `${rooms} room(s) @ ₹${day.hotelCostPerNight || hotelCost}/night for Night ${day.dayNumber} (${day.nightStay || 'Destination'})`,
        });
      }

      // Extra Permits / Activities
      if (day.activityCost && day.activityCost > 0) {
        extractedExpenses.push({
          id: `ve-act-${day.dayNumber}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          date: dayDate,
          category: 'activity_entry',
          vendorName: `Day ${day.dayNumber} Permits & Entry (${day.title || 'Sightseeing'})`,
          totalAgreedCost: day.activityCost,
          amountPaid: 0,
          paymentMode: 'upi',
          status: 'pending',
          notes: `Day ${day.dayNumber} activities & permits`,
        });
      }
    });
  }

  // If no day-wise expenses were extracted, but packageCost exists, populate default hotel & cab vendor expenses
  if (extractedExpenses.length === 0 && payload.packageCost > 0) {
    const estHotel = Math.round(payload.packageCost * 0.55);
    const estCab = payload.packageCost - estHotel;
    const hotelName =
      (itinerary as any).hotelName ||
      itinerary.days?.[0]?.hotelName ||
      `${itinerary.destination || 'Tour'} Hotel Accommodations`;

    extractedExpenses.push({
      id: `ve-hotel-${Date.now()}-1`,
      date: itinerary.travelStartDate || new Date().toISOString().split('T')[0],
      category: 'hotel',
      vendorName: hotelName,
      totalAgreedCost: estHotel,
      amountPaid: 0,
      paymentMode: 'bank_transfer',
      status: 'pending',
      notes: `Hotel accommodations for ${itinerary.durationNights || 5} nights`,
    });

    extractedExpenses.push({
      id: `ve-cab-${Date.now()}-2`,
      date: itinerary.travelStartDate || new Date().toISOString().split('T')[0],
      category: 'cab_driver',
      vendorName: `${itinerary.destination || 'Sikkim'} Dedicated Cab Fleet`,
      totalAgreedCost: estCab,
      amountPaid: 0,
      paymentMode: 'upi',
      status: 'pending',
      notes: `Transportation fleet for ${itinerary.durationDays || 6} days`,
    });
  }

  let targetAccount: TripAccount;
  let nextAccounts: TripAccount[];

  if (existingIdx >= 0) {
    const existing = existingAccounts[existingIdx];
    const payments =
      payload.advanceAmount > 0
        ? [newPayment, ...(existing.clientPayments || [])]
        : existing.clientPayments || [];

    const vendorExpenses =
      existing.vendorExpenses && existing.vendorExpenses.length > 0
        ? existing.vendorExpenses
        : extractedExpenses;

    targetAccount = {
      ...existing,
      guestName: itinerary.guestName,
      guestPhone: itinerary.guestPhone,
      destination: itinerary.destination || existing.destination,
      salesPerson: payload.salesPerson,
      travelDates: itinerary.travelStartDate
        ? `${itinerary.travelStartDate} to ${itinerary.travelEndDate || ''}`
        : existing.travelDates,
      tripStatus: 'upcoming',
      sellingCost: payload.sellingCost,
      packageCost: payload.packageCost,
      clientPayments: payments,
      vendorExpenses: vendorExpenses,
      voucherIssued: true,
      voucherIssuedAt: existing.voucherIssuedAt || new Date().toISOString(),
      voucherNumber: existing.voucherNumber || voucherNumber,
      updatedAt: new Date().toISOString(),
    };

    nextAccounts = [...existingAccounts];
    nextAccounts[existingIdx] = targetAccount;
  } else {
    targetAccount = {
      id: `acc-${Date.now()}`,
      leadId: itinerary.leadId,
      itineraryId: itinerary.id,
      quoteNumber: itinerary.quoteNumber,
      guestName: itinerary.guestName,
      guestPhone: itinerary.guestPhone,
      destination: itinerary.destination || 'Sikkim & Darjeeling',
      salesPerson: payload.salesPerson,
      travelDates: itinerary.travelStartDate
        ? `${itinerary.travelStartDate} to ${itinerary.travelEndDate || ''}`
        : 'Upcoming Tour Dates',
      tripStatus: 'upcoming',
      sellingCost: payload.sellingCost,
      packageCost: payload.packageCost,
      clientPayments: payload.advanceAmount > 0 ? [newPayment] : [],
      vendorExpenses: extractedExpenses,
      salesCommissionPercentage: 50,
      salesCommissionPaid: false,
      voucherIssued: true,
      voucherIssuedAt: new Date().toISOString(),
      voucherNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    nextAccounts = [targetAccount, ...existingAccounts];
  }

  saveTripAccounts(nextAccounts);

  const updatedItinerary: Itinerary = {
    ...itinerary,
    salesPerson: payload.salesPerson,
    sellingCost: payload.sellingCost,
    packageCost: payload.packageCost,
    tripStatus: 'upcoming',
    voucherIssued: true,
    voucherIssuedAt: itinerary.voucherIssuedAt || new Date().toISOString(),
    voucherNumber,
    updatedAt: new Date().toISOString(),
  };

  return {
    updatedItinerary,
    updatedAccounts: nextAccounts,
    createdOrUpdatedAccount: targetAccount,
    isFirstTimeConversion,
    voucherNumber,
  };
};


