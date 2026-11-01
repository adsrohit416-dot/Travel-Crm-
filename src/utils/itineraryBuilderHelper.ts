import { Itinerary, ItineraryDay } from '../types';
import {
  preconfiguredTemplates,
  defaultPackageInclusions,
  defaultPackageExclusions,
  defaultPaymentMilestones,
} from '../data/defaultTemplates';
import { getDefaultDestinationCover, getDefaultDayImage } from '../data/destinationImages';
import {
  getDestinationSpecialAdvisories,
  getDestinationTermsAndConditions,
  getDestinationCancellationPolicy,
} from '../data/destinationPolicies';

/**
 * Maps a master tour meal plan (e.g. MAP, AP, CP, EP) into an authentic day-specific meal plan label
 */
export function getDayMealPlanFromMasterPlan(masterPlan: string, isDepartureDay: boolean): string {
  const lower = (masterPlan || '').toLowerCase();
  if (isDepartureDay) {
    if (lower.includes('ep') || lower.includes('room only')) {
      return 'Room Only / Checkout Drop';
    }
    return 'Breakfast Included';
  }
  if (lower.includes('ap') || lower.includes('all meals') || lower.includes('compulsory')) {
    return 'AP (All Meals: Breakfast, Lunch & Dinner)';
  }
  if (lower.includes('map') || lower.includes('breakfast & dinner') || lower.includes('breakfast and dinner')) {
    return 'MAP (Breakfast & Dinner)';
  }
  if (lower.includes('cp') || lower.includes('breakfast only') || lower.includes('daily breakfast')) {
    return 'CP (Daily Breakfast Included)';
  }
  if (lower.includes('ep') || lower.includes('room only')) {
    return 'EP (Room Only - No Meals)';
  }
  return masterPlan || 'Breakfast & Dinner';
}

/**
 * Constructs a fully validated, complete Itinerary object from partial AI data,
 * ensuring all IDs, day images, destination policies, and pricing structures are intact.
 */
export function buildFullItineraryFromAi(
  aiData: Partial<Itinerary>,
  currentItinerary: Itinerary | null = null,
  isExplicitNewItinerary: boolean = false
): Itinerary {
  // If this is a new itinerary creation, DO NOT inherit the old destination, days, or quote number
  const baseItinerary = isExplicitNewItinerary ? null : currentItinerary;

  const destination =
    aiData.destination || baseItinerary?.destination || 'Sikkim';
  const title =
    aiData.title ||
    (baseItinerary?.destination?.toLowerCase() === destination.toLowerCase() ? baseItinerary?.title : undefined) ||
    `${destination} Special Tour Package`;

  const defaultCover = getDefaultDestinationCover(destination, title);
  const adults = Number(aiData.adults) || baseItinerary?.adults || 2;
  const children = Number(aiData.children) || baseItinerary?.children || 0;
  const infants = Number(aiData.infants) || baseItinerary?.infants || 0;
  const totalPax = Math.max(1, adults + children);

  const durationDays =
    Number(aiData.durationDays) ||
    aiData.days?.length ||
    baseItinerary?.durationDays ||
    5;
  const durationNights =
    Number(aiData.durationNights) || Math.max(0, durationDays - 1);

  const isAndaman =
    destination.toLowerCase().includes('andaman') ||
    title.toLowerCase().includes('andaman') ||
    title.toLowerCase().includes('port blair') ||
    title.toLowerCase().includes('havelock');

  const defaultPickup = isAndaman
    ? 'Veer Savarkar International Airport (IXZ), Port Blair'
    : destination.toLowerCase().includes('meghalaya') || destination.toLowerCase().includes('assam')
    ? 'Guwahati Airport (GAU) / Station'
    : 'Bagdogra Airport (IXB) / NJP Station';
  const defaultDrop = defaultPickup;

  // Determine destination template fallback intelligently
  const dLower = destination.toLowerCase();
  let matchingTemplate = preconfiguredTemplates.find(
    (t) => (t.destination || '').toLowerCase() === dLower
  );

  if (!matchingTemplate) {
    if (
      dLower.includes('north sikkim') ||
      dLower.includes('lachen') ||
      dLower.includes('lachung') ||
      dLower.includes('gurudongmar') ||
      dLower.includes('yumthang') ||
      dLower.includes('zero point')
    ) {
      matchingTemplate =
        preconfiguredTemplates.find((t) => t.quoteNumber === 'NED-2026-NS01') ||
        preconfiguredTemplates[3];
    } else if (
      dLower.includes('darjeeling') ||
      dLower.includes('tiger hill') ||
      dLower.includes('batasia') ||
      dLower.includes('mirik') ||
      dLower.includes('toy train')
    ) {
      matchingTemplate =
        preconfiguredTemplates.find((t) => t.quoteNumber === 'NED-2026-DJ01') ||
        preconfiguredTemplates[4];
    } else if (
      dLower.includes('meghalaya') ||
      dLower.includes('shillong') ||
      dLower.includes('cherrapunji') ||
      dLower.includes('dawki') ||
      dLower.includes('assam')
    ) {
      matchingTemplate =
        preconfiguredTemplates.find((t) => t.quoteNumber === 'NED-2026-MG01') ||
        preconfiguredTemplates[1];
    } else if (
      dLower.includes('andaman') ||
      dLower.includes('port blair') ||
      dLower.includes('havelock') ||
      dLower.includes('neil')
    ) {
      matchingTemplate =
        preconfiguredTemplates.find((t) => t.quoteNumber === 'NED-2026-AN01') ||
        preconfiguredTemplates[2];
    } else {
      matchingTemplate =
        preconfiguredTemplates.find((t) => t.quoteNumber === 'NED-2026-SK01') ||
        preconfiguredTemplates[0];
    }
  }

  // Construct Days: If destination changed or new itinerary, use aiData.days or fall back to authentic matching template days
  const isSameDestination = baseItinerary && baseItinerary.destination?.toLowerCase() === destination.toLowerCase();
  const rawDays = aiData.days && aiData.days.length > 0
    ? aiData.days
    : isSameDestination && baseItinerary?.days && baseItinerary.days.length > 0
    ? baseItinerary.days
    : (matchingTemplate?.days || []);

  const processedDays: ItineraryDay[] = [];
  const dayCount = Math.max(durationDays, rawDays.length || 1);

  // Compute travel start & end dates
  let calculatedStartDate = aiData.travelStartDate || baseItinerary?.travelStartDate || '';
  if (!calculatedStartDate) {
    const today = new Date();
    today.setDate(today.getDate() + 14); // 2 weeks advance booking standard
    calculatedStartDate = today.toISOString().split('T')[0];
  }
  let calculatedEndDate = aiData.travelEndDate || baseItinerary?.travelEndDate || '';
  if (!calculatedEndDate && dayCount > 0) {
    try {
      const d = new Date(calculatedStartDate);
      d.setDate(d.getDate() + (dayCount - 1));
      calculatedEndDate = d.toISOString().split('T')[0];
    } catch {}
  }

  for (let i = 0; i < dayCount; i++) {
    const rawDay = rawDays[i] || {};
    const tplDay = matchingTemplate?.days?.[i % (matchingTemplate?.days?.length || 1)];
    const dayNum = rawDay.dayNumber || i + 1;
    const isLastDay = dayNum === dayCount;
    const defaultDayImg = getDefaultDayImage(destination, dayNum);

    let dayDate = rawDay.date || '';
    if (!dayDate && calculatedStartDate) {
      try {
        const d = new Date(calculatedStartDate);
        d.setDate(d.getDate() + i);
        dayDate = d.toISOString().split('T')[0];
      } catch {
        dayDate = '';
      }
    }

    // Departure Day (Final day of tour) vs Sightseeing/Transfer Days
    let dayTitle = rawDay.title || '';
    let dayNightStay = rawDay.nightStay || '';
    let dayMealPlan = rawDay.mealPlan || '';
    let dayHotel = rawDay.hotelName || '';
    let hotelCostPerNight = Number(rawDay.hotelCostPerNight) || 0;
    let hotelTotalCost = Number(rawDay.hotelTotalCost) || 0;
    let transportCost = Number(rawDay.transportCost) || 0;
    let dayTransport = rawDay.transportDetails || '';
    let dayDescription = rawDay.description || '';
    let dayHighlights: string[] = Array.isArray(rawDay.sightseeingHighlights) ? rawDay.sightseeingHighlights : [];

    if (isLastDay) {
      // The final day is ALWAYS the departure day: Checkout, transit to hub, tour concludes
      if (!dayTitle || (!dayTitle.toLowerCase().includes('departure') && !dayTitle.toLowerCase().includes('drop'))) {
        if (destination.toLowerCase().includes('sikkim') || destination.toLowerCase().includes('darjeeling')) {
          dayTitle = 'Pelling / Gangtok to Bagdogra Airport (IXB) / NJP Railway Station Departure';
          dayDescription = rawDay.description || 'After breakfast, check out from hotel. Chauffeur drive down through pine forests and Teesta river valley to Bagdogra Airport (IXB) or NJP Railway Station for your return journey with cherished memories.';
          dayHighlights = dayHighlights.length > 0 ? dayHighlights : ['Morning Valley Views', 'Scenic Teesta Valley Chauffeur Drive', 'Bagdogra Airport (IXB) / NJP Drop'];
        } else if (destination.toLowerCase().includes('meghalaya') || destination.toLowerCase().includes('assam')) {
          dayTitle = 'Transfer to Guwahati Airport (GAU) - Tour Concludes with Fond Memories';
          dayDescription = rawDay.description || 'Post breakfast, check out from resort. Chauffeur drive to Guwahati Airport (GAU) with optional visit to Kamakhya Temple atop Nilachal Hill before boarding your return flight.';
          dayHighlights = dayHighlights.length > 0 ? dayHighlights : ['Kamakhya Temple View', 'Brahmaputra Scenic Drive', 'Guwahati Airport Drop'];
        } else if (isAndaman) {
          dayTitle = 'Port Blair Hotel Checkout & Airport Transfer for Return Flight';
          dayDescription = rawDay.description || 'Post breakfast, transfer to Veer Savarkar International Airport (Port Blair) with unforgettable tropical island memories for your return flight.';
          dayHighlights = dayHighlights.length > 0 ? dayHighlights : ['Chatham Coastal Drive', 'Veer Savarkar Airport Drop'];
        } else {
          dayTitle = `${destination} Departure Transfer - Tour Concludes`;
          dayDescription = rawDay.description || 'Post breakfast, transfer to departure hub for onward flight/train.';
          dayHighlights = dayHighlights.length > 0 ? dayHighlights : ['Morning Hotel Checkout', 'Departure Hub Drop'];
        }
      }

      dayNightStay = 'Departure';
      dayMealPlan = dayMealPlan || getDayMealPlanFromMasterPlan(aiData.mealPlan || baseItinerary?.mealPlan || 'MAP (Daily Breakfast & Dinner)', true);
      dayHotel = ''; // No hotel room on departure night
      hotelCostPerNight = 0;
      hotelTotalCost = 0;
      transportCost = transportCost || (isAndaman ? 2800 : 3800);
      dayTransport = dayTransport || (isAndaman ? 'Dedicated Chauffeur Airport Drop Cab' : 'Dedicated Mountain Chauffeur Drop to Bagdogra / NJP');
    } else {
      // Intermediate / Sightseeing Days
      dayTitle = dayTitle || tplDay?.title || (isAndaman ? `Day ${dayNum}: Island Sightseeing` : `Day ${dayNum}: Scenic Mountain Excursion`);
      dayNightStay = dayNightStay || tplDay?.nightStay || (isAndaman ? 'Port Blair' : 'Gangtok');
      dayMealPlan = dayMealPlan || getDayMealPlanFromMasterPlan(aiData.mealPlan || baseItinerary?.mealPlan || tplDay?.mealPlan || 'MAP (Daily Breakfast & Dinner)', false);
      dayHotel = dayHotel || tplDay?.hotelName || (isAndaman ? 'Symphony Palms or Similar Deluxe' : 'Hotel Summit Golden Crescent or Similar Deluxe');
      hotelCostPerNight = hotelCostPerNight || tplDay?.hotelCostPerNight || 3500;
      const roomCount = Number(rawDay.roomCount) || Math.max(1, Math.ceil(adults / 2));
      hotelTotalCost = hotelTotalCost || hotelCostPerNight * roomCount;
      transportCost = transportCost || tplDay?.transportCost || (isAndaman ? 4200 : 3800);
      dayTransport = dayTransport || tplDay?.transportDetails || (isAndaman ? 'Dedicated AC Chauffeur Cab & High-Speed Catamaran' : 'Dedicated Private Mountain Vehicle');
      dayDescription = dayDescription || tplDay?.description || 'Scenic tour and transfer as per travel schedule with dedicated chauffeur assistance.';
      dayHighlights = dayHighlights.length > 0 ? dayHighlights : (tplDay?.sightseeingHighlights || []);
    }

    processedDays.push({
      id: rawDay.id || `day-${dayNum}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      dayNumber: dayNum,
      title: dayTitle,
      date: dayDate,
      description: dayDescription,
      sightseeingHighlights: dayHighlights,
      nightStay: dayNightStay,
      mealPlan: dayMealPlan,
      transportDetails: dayTransport,
      imageUrl: rawDay.imageUrl || defaultDayImg.url,
      imageCaption: rawDay.imageCaption || defaultDayImg.caption,
      hotelName: dayHotel,
      hotelPricingMode: 'per_night',
      hotelCostPerNight,
      hotelCostPerPerson: 0,
      roomCount: isLastDay ? 0 : (Number(rawDay.roomCount) || Math.max(1, Math.ceil(adults / 2))),
      hotelTotalCost,
      transportCost,
      transportVehicle: rawDay.transportVehicle || (adults > 4 ? 'Innova / Xylo' : 'Swift / WagonR'),
      activityCost: Number(rawDay.activityCost) || tplDay?.activityCost || 0,
    });
  }

  // Aggregate day-wise costs to compute realistic package cost
  let computedTotalHotel = 0;
  let computedTotalTransport = 0;
  let computedTotalActivities = 0;
  for (const d of processedDays) {
    computedTotalHotel += d.hotelTotalCost || 0;
    computedTotalTransport += d.transportCost || 0;
    computedTotalActivities += d.activityCost || 0;
  }
  const computedDaysTotal = computedTotalHotel + computedTotalTransport + computedTotalActivities;

  const packageCost =
    computedDaysTotal > 0
      ? computedDaysTotal
      : Number(aiData.packageCost) || baseItinerary?.packageCost || (isAndaman ? 42000 : 35000);

  const sellingCost = Math.max(
    Number(aiData.sellingCost) || 0,
    baseItinerary?.sellingCost || Math.round(packageCost * 1.38)
  );

  const sellingCostSharing = Math.max(
    Number(aiData.sellingCostSharing) || 0,
    baseItinerary?.sellingCostSharing || Math.round(sellingCost * 0.72)
  );

  const packageCostSharing = Math.round(sellingCostSharing * 0.75);

  // Construct complete itinerary
  const destCode = destination.toLowerCase().includes('sikkim')
    ? 'SK'
    : destination.toLowerCase().includes('meghalaya')
    ? 'MG'
    : isAndaman
    ? 'AN'
    : 'NE';
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const quoteNumber =
    (!isExplicitNewItinerary && baseItinerary?.quoteNumber) ||
    aiData.quoteNumber ||
    `NED-${new Date().getFullYear()}-${destCode}${randomSuffix}`;

  return {
    id: (!isExplicitNewItinerary && baseItinerary?.id) || aiData.id || `itin-${Date.now()}`,
    quoteNumber,
    title,
    destination,
    heroImageUrl: aiData.heroImageUrl || defaultCover.url,
    heroImageCaption: aiData.heroImageCaption || defaultCover.caption,
    leadId: baseItinerary?.leadId || aiData.leadId,
    salesPerson: baseItinerary?.salesPerson || aiData.salesPerson || 'Rohit Sharma',
    guestName: aiData.guestName || baseItinerary?.guestName || 'Valued Guest',
    guestPhone: aiData.guestPhone || baseItinerary?.guestPhone || '',
    guestEmail: aiData.guestEmail || baseItinerary?.guestEmail || '',
    guestCity: aiData.guestCity || baseItinerary?.guestCity || '',
    adults,
    children,
    infants,
    travelStartDate: calculatedStartDate,
    travelEndDate: calculatedEndDate,
    durationDays: dayCount,
    durationNights: Math.max(0, dayCount - 1),
    pickupLocation: aiData.pickupLocation || baseItinerary?.pickupLocation || defaultPickup,
    dropLocation: aiData.dropLocation || baseItinerary?.dropLocation || defaultDrop,
    hotelCategory:
      aiData.hotelCategory ||
      baseItinerary?.hotelCategory ||
      (dLower.includes('darjeeling')
        ? 'Heritage Deluxe (Colonial Mountain View)'
        : dLower.includes('north sikkim')
        ? 'Deluxe Mountain Lodge (North Sikkim Category)'
        : 'Deluxe Category (3-Star Mountain/Beach View)'),
    mealPlan:
      aiData.mealPlan ||
      (dLower.includes('north sikkim')
        ? 'AP (Compulsory All Meals: Breakfast, Lunch & Dinner)'
        : baseItinerary?.mealPlan || 'MAP (Daily Breakfast & Dinner)'),
    pricingMode: aiData.pricingMode || baseItinerary?.pricingMode || 'both',
    packageCost,
    sellingCost,
    sellingCostSharing,
    packageCostSharing,
    markupPercentage: packageCost > 0 ? Math.round(((sellingCost - packageCost) / packageCost) * 100) : 38,
    markupPercentageSharing: packageCostSharing > 0 ? Math.round(((sellingCostSharing - packageCostSharing) / packageCostSharing) * 100) : 33,
    totalTransportCost: computedTotalTransport,
    totalHotelCost: computedTotalHotel,
    totalActivitiesCost: computedTotalActivities,
    packageCostPerPerson: Math.round(packageCost / totalPax),
    sellingCostPerPerson: Math.round(sellingCost / totalPax),
    reservedCab: {
      enabled: true,
      name: isAndaman
        ? 'Option A: Reserved Cab & Catamaran (Private Dedicated AC Vehicle)'
        : 'Option A: Reserved Cab Facility (Private Dedicated SUV)',
      vehicleType: isAndaman
        ? 'Dedicated AC Ertiga / Innova'
        : adults > 4
        ? 'Innova / Xylo'
        : 'Small Cab (Swift / WagonR)',
      description: isAndaman
        ? 'Exclusive private AC vehicle allocated strictly for your group across Port Blair, Havelock & Neil with pre-booked luxury catamaran tickets.'
        : 'Exclusive private SUV allocated strictly for your group from pickup to drop. Complete comfort, flexibility, and hotel doorstep convenience.',
      pricePerPerson: Math.round(sellingCost / totalPax),
      totalPackagePrice: sellingCost,
      gstPercentage: 0,
      gstIncluded: true,
      specificInclusions: [
        isAndaman
          ? 'Exclusive private AC vehicle for all transfers and sightseeing'
          : 'Exclusive private vehicle allocated strictly for your party',
        'Hotel porch doorstep pickup & drop for all excursions',
        'Driver mountain/island allowances, toll taxes, parking fees, and entry permits',
      ],
      specificExclusions: [
        'Vehicle not on disposal for unannounced personal late-night outings',
      ],
    },
    sharingCab: {
      enabled: true,
      name: isAndaman
        ? 'Option B: Standard Island Transit'
        : 'Option B: Sharing Cab Facility (Economical Shared Mountain Vehicle)',
      vehicleType: isAndaman ? 'Shared AC Coach & Catamaran' : 'Tata Sumo / Mahindra Bolero',
      description: isAndaman
        ? 'Budget-conscious shared vehicle transfers between ferry jetties and hotels.'
        : 'Budget-conscious shared vehicle facility between major taxi hubs with scheduled departures.',
      pricePerPerson: Math.round(sellingCostSharing / totalPax),
      totalPackagePrice: sellingCostSharing,
      gstPercentage: 0,
      gstIncluded: true,
      specificInclusions: [
        'Shared vehicle transfer on scheduled departure slots',
        'Standard luggage allowance (1 main bag per passenger)',
      ],
      specificExclusions: [
        'Door-to-door detour pickups not covered under shared route points',
      ],
    },
    days: processedDays,
    commonInclusions:
      aiData.commonInclusions && aiData.commonInclusions.length > 0
        ? aiData.commonInclusions
        : [...defaultPackageInclusions],
    commonExclusions:
      aiData.commonExclusions && aiData.commonExclusions.length > 0
        ? aiData.commonExclusions
        : [...defaultPackageExclusions],
    specialAdvisories: getDestinationSpecialAdvisories(destination, title),
    termsAndConditions: getDestinationTermsAndConditions(destination, title),
    cancellationRefundPolicy: getDestinationCancellationPolicy(destination, title),
    paymentMilestones: [...defaultPaymentMilestones],
    createdAt: currentItinerary?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
