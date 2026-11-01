import { BookingVoucherData, Itinerary, Lead, TripAccount } from '../types';

/**
 * Builds a structured BookingVoucherData object from an Itinerary and advance conversion payload.
 */
export function buildVoucherFromItinerary(
  itinerary: Itinerary,
  payload: {
    advanceAmount: number;
    paymentMode: string;
    paymentDate: string;
    referenceNumber: string;
    paymentNotes?: string;
    salesPerson?: string;
    sellingCost?: number;
    selectedBookingOption?: 'reserved' | 'sharing';
  },
  existingVoucherNumber?: string
): BookingVoucherData {
  const currentYear = new Date().getFullYear();
  const voucherNumber =
    existingVoucherNumber ||
    itinerary.voucherNumber ||
    `VCH-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`;

  const totalPax = Math.max(1, (itinerary.adults || 0) + (itinerary.children || 0));
  const sellingCost = Number(payload.sellingCost || itinerary.sellingCost || 0);
  const advanceAmount = Number(payload.advanceAmount || 0);
  const balanceDue = Math.max(0, sellingCost - advanceAmount);

  const isSharing =
    payload.selectedBookingOption === 'sharing' || itinerary.selectedBookingOption === 'sharing';
  const assignedCab = isSharing ? itinerary.sharingCab : itinerary.reservedCab;

  return {
    voucherNumber,
    confirmationDate: new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    itineraryId: itinerary.id,
    leadId: itinerary.leadId,
    quoteNumber: itinerary.quoteNumber || 'NED-BOOKING',
    tripStatus: 'upcoming',

    // Guest & Lead Info
    guestName: itinerary.guestName || 'Valued Guest',
    guestPhone: itinerary.guestPhone || '',
    guestEmail: itinerary.guestEmail || '',
    guestCity: itinerary.guestCity || '',
    adults: itinerary.adults || 2,
    children: itinerary.children || 0,
    infants: itinerary.infants || 0,
    totalPax,
    salesPerson: payload.salesPerson || itinerary.salesPerson || 'Rohit Sharma',

    // Package Details
    title: itinerary.title || `${itinerary.destination || 'North East'} Tour`,
    destination: itinerary.destination || 'Sikkim & Darjeeling',
    travelStartDate: itinerary.travelStartDate,
    travelEndDate: itinerary.travelEndDate,
    durationDays: itinerary.durationDays || itinerary.days?.length || 1,
    durationNights: itinerary.durationNights || Math.max(0, (itinerary.durationDays || 1) - 1),
    pickupLocation: itinerary.pickupLocation || 'Bagdogra Airport / NJP Station',
    dropLocation: itinerary.dropLocation || 'Bagdogra Airport / NJP Station',
    hotelCategory: itinerary.hotelCategory || 'Deluxe Category (3-Star Mountain View)',
    hotelName: itinerary.days?.[0]?.hotelName,
    mealPlan: itinerary.mealPlan || 'MAP (Daily Breakfast & Dinner)',

    // Cab allocation
    preferredCab: isSharing ? 'Sharing Cab Facility' : 'Reserved Cab Facility',
    assignedVehicle:
      assignedCab?.vehicleType || (isSharing ? 'Tata Sumo / Mahindra Bolero' : 'Toyota Innova / Xylo'),
    cabFacilityDescription:
      assignedCab?.description ||
      (isSharing
        ? 'Scheduled shared Tata Sumo / Mahindra Bolero transit between mountain taxi stands.'
        : 'Dedicated private mountain SUV allocated exclusively for your party from pickup to drop.'),

    // Day schedule
    days: itinerary.days?.map((d) => ({
      dayNumber: d.dayNumber,
      title: d.title,
      nightStay: d.nightStay,
      mealPlan: d.mealPlan,
      sightseeingHighlights: d.sightseeingHighlights,
      date: d.date,
    })),

    // Financial statement
    sellingCost,
    advanceAmount,
    balanceDue,
    paymentMode: payload.paymentMode || 'upi',
    paymentDate: payload.paymentDate || new Date().toISOString().split('T')[0],
    referenceNumber: payload.referenceNumber || `ADV-${Date.now().toString().slice(-6)}`,
    paymentNotes: payload.paymentNotes || 'Booking token advance payment received',

    // Inclusions & Policies
    inclusions: itinerary.commonInclusions,
    exclusions: itinerary.commonExclusions,
    advisories: itinerary.specialAdvisories,
    termsAndConditions: itinerary.termsAndConditions,
  };
}

/**
 * Builds a structured BookingVoucherData object from a Lead and advance conversion payload.
 */
export function buildVoucherFromLead(
  lead: Lead,
  payload: {
    advanceAmount: number;
    paymentMode: string;
    paymentDate: string;
    referenceNumber: string;
    paymentNotes?: string;
    salesPerson?: string;
    sellingCost?: number;
    quoteNumber?: string;
    travelDates?: string;
    hotelName?: string;
  },
  linkedItinerary?: Itinerary | null,
  existingVoucherNumber?: string
): BookingVoucherData {
  if (linkedItinerary) {
    return buildVoucherFromItinerary(
      linkedItinerary,
      {
        advanceAmount: payload.advanceAmount,
        paymentMode: payload.paymentMode,
        paymentDate: payload.paymentDate,
        referenceNumber: payload.referenceNumber,
        paymentNotes: payload.paymentNotes,
        salesPerson: payload.salesPerson || lead.salesPerson,
        sellingCost: payload.sellingCost || lead.sellingCost,
      },
      existingVoucherNumber
    );
  }

  const currentYear = new Date().getFullYear();
  const voucherNumber =
    existingVoucherNumber ||
    lead.voucherNumber ||
    `VCH-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`;

  const totalPax = Math.max(1, (lead.adults || 0) + (lead.children || 0));
  const sellingCost = Number(payload.sellingCost || lead.sellingCost || 0);
  const advanceAmount = Number(payload.advanceAmount || 0);
  const balanceDue = Math.max(0, sellingCost - advanceAmount);

  const isSharing = lead.preferredCab === 'sharing';

  return {
    voucherNumber,
    confirmationDate: new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    leadId: lead.id,
    quoteNumber:
      payload.quoteNumber ||
      lead.quoteNumber ||
      `NED-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`,
    tripStatus: 'upcoming',

    // Guest Info
    guestName: lead.guestName || 'Valued Guest',
    guestPhone: lead.phone || '',
    guestEmail: lead.email || '',
    guestCity: lead.city || '',
    adults: lead.adults || 2,
    children: lead.children || 0,
    infants: lead.infants || 0,
    totalPax,
    salesPerson: payload.salesPerson || lead.salesPerson || 'Rohit Sharma',

    // Package Details
    title: `${lead.destination || 'North East'} Holiday Package`,
    destination: lead.destination || 'Sikkim & Darjeeling',
    travelStartDate: lead.travelStartDate,
    travelEndDate: lead.travelEndDate,
    durationDays: lead.durationDays || 5,
    durationNights: lead.durationNights || 4,
    pickupLocation: 'Bagdogra Airport (IXB) / NJP Railway Station',
    dropLocation: 'Bagdogra Airport (IXB) / NJP Railway Station',
    hotelCategory: 'Deluxe Category (3-Star Mountain View)',
    hotelName: payload.hotelName || lead.hotelName,
    mealPlan: 'MAP (Daily Breakfast & Dinner)',

    preferredCab: isSharing
      ? 'Sharing Cab (Tata Sumo / Bolero)'
      : 'Reserved Dedicated SUV (Innova / Xylo)',
    assignedVehicle: isSharing ? 'Tata Sumo / Mahindra Bolero' : 'Toyota Innova / Xylo',
    cabFacilityDescription: isSharing
      ? 'Scheduled point-to-point transit in shared Tata Sumo / Mahindra Bolero with fellow travelers.'
      : 'Dedicated private mountain SUV allocated exclusively for your party from arrival to departure.',

    days: Array.from({ length: lead.durationDays || 5 }, (_, i) => ({
      dayNumber: i + 1,
      title:
        i === 0
          ? 'Arrival & Mountain Transit'
          : i === (lead.durationDays || 5) - 1
          ? 'Departure Transfer'
          : `Day ${i + 1} Sightseeing & Local Exploration`,
      nightStay: lead.destination || 'Gangtok',
      mealPlan: 'Breakfast & Dinner',
    })),

    sellingCost,
    advanceAmount,
    balanceDue,
    paymentMode: payload.paymentMode || 'upi',
    paymentDate: payload.paymentDate || new Date().toISOString().split('T')[0],
    referenceNumber: payload.referenceNumber || `ADV-${Date.now().toString().slice(-6)}`,
    paymentNotes: payload.paymentNotes || 'Booking token advance payment received',

    inclusions: [
      'Accommodation in double sharing rooms as per chosen hotel category',
      'Daily meals as per MAP meal plan (Breakfast & Dinner)',
      'All transfers and sightseeing by assigned vehicle',
      'Driver allowances, mountain fuel, road tolls, and parking taxes',
    ],
    exclusions: [
      'Airfare and train tickets',
      'Personal expenses, laundry, telephone calls, room heaters, alcoholic beverages',
      'Entry fees at monuments, camera charges, and guide fees',
      'Nathula Pass / Zero Point supplement charges (subject to permits & military clearance)',
    ],
  };
}

/**
 * Builds BookingVoucherData from a TripAccount record.
 */
export function buildVoucherFromTripAccount(
  account: TripAccount,
  linkedItinerary?: Itinerary | null,
  linkedLead?: Lead | null
): BookingVoucherData {
  if (linkedItinerary) {
    const totalPaid = account.clientPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const lastPayment = account.clientPayments[account.clientPayments.length - 1];
    return buildVoucherFromItinerary(
      linkedItinerary,
      {
        advanceAmount: totalPaid,
        paymentMode: lastPayment?.paymentMode || 'upi',
        paymentDate: lastPayment?.date || account.createdAt.split('T')[0],
        referenceNumber: lastPayment?.referenceNumber || `PAY-${account.quoteNumber}`,
        paymentNotes: lastPayment?.notes,
        salesPerson: account.salesPerson,
        sellingCost: account.sellingCost,
      },
      account.voucherNumber
    );
  }

  const currentYear = new Date().getFullYear();
  const voucherNumber =
    account.voucherNumber || `VCH-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`;

  const totalPaid = account.clientPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const lastPayment = account.clientPayments[account.clientPayments.length - 1];
  const balanceDue = Math.max(0, account.sellingCost - totalPaid);

  return {
    voucherNumber,
    confirmationDate: new Date(account.createdAt).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    leadId: account.leadId,
    itineraryId: account.itineraryId,
    quoteNumber: account.quoteNumber,
    tripStatus: account.tripStatus,

    guestName: account.guestName || 'Valued Guest',
    guestPhone: account.guestPhone || '',
    guestEmail: linkedLead?.email || '',
    guestCity: linkedLead?.city || '',
    adults: linkedLead?.adults || 2,
    children: linkedLead?.children || 0,
    infants: linkedLead?.infants || 0,
    totalPax: Math.max(1, (linkedLead?.adults || 2) + (linkedLead?.children || 0)),
    salesPerson: account.salesPerson || 'Rohit Sharma',

    title: `${account.destination || 'North East'} Holiday Tour`,
    destination: account.destination || 'Sikkim & Darjeeling',
    travelStartDate: account.travelDates?.split(' to ')?.[0],
    travelEndDate: account.travelDates?.split(' to ')?.[1],
    durationDays: 6,
    durationNights: 5,
    pickupLocation: 'Bagdogra Airport (IXB) / NJP Railway Station',
    dropLocation: 'Bagdogra Airport (IXB) / NJP Railway Station',
    hotelCategory: 'Deluxe Category (3-Star Mountain View)',
    mealPlan: 'MAP (Daily Breakfast & Dinner)',

    preferredCab: 'Reserved Mountain SUV',
    assignedVehicle: 'Dedicated Innova / Xylo',
    cabFacilityDescription:
      'Dedicated mountain vehicle allocated for your group from pickup to drop with mountain fuel, driver, and tolls.',

    sellingCost: account.sellingCost,
    advanceAmount: totalPaid,
    balanceDue,
    paymentMode: lastPayment?.paymentMode || 'upi',
    paymentDate: lastPayment?.date || account.createdAt.split('T')[0],
    referenceNumber: lastPayment?.referenceNumber || `VCH-CONF-${account.quoteNumber}`,
    paymentNotes: lastPayment?.notes || 'Advance payment recorded in Accounts ledger',

    inclusions: [
      'Accommodation in double sharing rooms in chosen deluxe category',
      'Daily breakfast & dinner as per MAP meal plan',
      'All transfers and sightseeing by dedicated vehicle',
      'Driver allowances, mountain fuel, road tolls, and parking taxes',
    ],
    exclusions: [
      'Airfare and train tickets',
      'Personal expenses, laundry, telephone calls, room heaters, alcoholic beverages',
      'Entry fees at monuments and adventure ride tickets',
    ],
  };
}
