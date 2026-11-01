import { Itinerary, ItineraryDay, FIXED_RESERVED_VEHICLES, FIXED_SHARING_VEHICLE } from '../types';
import {
  defaultPaymentMilestones,
  defaultSpecialAdvisories,
  defaultTermsAndConditions,
  defaultPackageInclusions,
  defaultPackageExclusions,
} from '../data/defaultTemplates';
import {
  getDefaultDestinationCover,
  isNorthSikkimLocation,
  isNorthSikkimTour,
  NORTH_SIKKIM_COMPULSORY_MEAL_PLAN,
  NORTH_SIKKIM_DAY_MEAL_PLAN,
} from '../data/destinationImages';
import { buildFullItineraryFromAi } from './itineraryBuilderHelper';

export interface ParseResult {
  itinerary: Partial<Itinerary>;
  detectedFields: string[];
  missingFields: string[];
  rawText: string;
}

const KNOWN_DESTINATIONS = [
  'Gangtok',
  'Darjeeling',
  'Pelling',
  'Lachen',
  'Lachung',
  'Ravangla',
  'Namchi',
  'Kalimpong',
  'Yuksom',
  'Rinchenpong',
  'Zuluk',
  'Aritar',
  'Shillong',
  'Cherrapunji',
  'Sohra',
  'Dawki',
  'Kaziranga',
  'Guwahati',
  'Tawang',
  'Bomdila',
  'Dirang',
  'Bhalukpong',
  'Majuli',
  'Kohima',
];

const MONTH_NAMES: { [key: string]: string } = {
  jan: '01', january: '01',
  feb: '02', february: '02',
  mar: '03', march: '03',
  apr: '04', april: '04',
  may: '05',
  jun: '06', june: '06',
  jul: '07', july: '07',
  aug: '08', august: '08',
  sep: '09', sept: '09', september: '09',
  oct: '10', october: '10',
  nov: '11', november: '11',
  dec: '12', december: '12',
};

function parseNaturalDate(str: string): string | null {
  // Try DD Month YYYY (e.g. "15 Nov 2026", "15th November 2026")
  const m = str.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s*,?\s*(\d{4})/i);
  if (m) {
    const day = m[1].padStart(2, '0');
    const monthKey = m[2].toLowerCase();
    const month = MONTH_NAMES[monthKey] || MONTH_NAMES[monthKey.slice(0, 3)];
    const year = m[3];
    if (month) return `${year}-${month}-${day}`;
  }
  return null;
}

/**
 * Robust local parser for any unstructured or structured itinerary text.
 * Accurately extracts guest details, origin city, pickup/drop hubs, days, accommodations,
 * inclusions, exclusions, pricing mode ('reserved', 'sharing', 'both'), and fixed cab fleet.
 */
export function parseItineraryTextLocally(text: string): ParseResult {
  const detectedFields: string[] = [];
  const missingFields: string[] = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // 1. Detect Guest Name
  let guestName = '';
  const guestPatterns = [
    /(?:guest\s*name|client\s*name|customer\s*name|lead\s*name|guest|client)[:\s-]+([A-Za-z\s.&'-]+)/i,
    /(?:quote\s*for|proposal\s*for|itinerary\s*for|package\s*for)[:\s-]+([A-Za-z\s.&'-]+)/i,
    /(?:mr\.|mrs\.|ms\.|dr\.)\s*([A-Za-z\s.&'-]+)/i,
  ];

  const invalidGuestKeywords = [
    'adult', 'adults', 'pax', 'person', 'people', 'children', 'child', 'kid', 'infant',
    'day', 'night', 'hotel', 'resort', 'package', 'cost', 'tour', 'trip', 'innova',
    'sumo', 'bolero', 'sikkim', 'darjeeling', 'gangtok', 'deluxe', 'rate', 'price',
    'inclusion', 'exclusion', 'itinerary', 'option', 'cab', 'vehicle', 'sharing', 'reserved'
  ];

  for (const line of lines) {
    for (const pat of guestPatterns) {
      const match = line.match(pat);
      if (match && match[1]) {
        const candidate = match[1].replace(/[,:;].*$/, '').trim();
        const lower = candidate.toLowerCase();
        const hasInvalid = invalidGuestKeywords.some((w) => lower.includes(w)) || /\d/.test(candidate);
        if (!hasInvalid && candidate.length >= 2 && candidate.length <= 40) {
          guestName = candidate;
          break;
        }
      }
    }
    if (guestName) break;
  }

  if (guestName) {
    detectedFields.push(`Guest Name: "${guestName}"`);
  } else {
    missingFields.push('Guest Name (leave blank or enter manually)');
  }

  // 2. Detect Phone / Contact
  let guestPhone = '';
  const phoneMatch = text.match(/(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/);
  if (phoneMatch) {
    guestPhone = phoneMatch[0].replace(/[\s-]/g, '').trim();
    if (guestPhone.length === 10) guestPhone = `+91 ${guestPhone}`;
    detectedFields.push(`Phone: ${guestPhone}`);
  } else {
    missingFields.push('Contact Phone');
  }

  // 3. Detect Email
  let guestEmail = '';
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    guestEmail = emailMatch[0].trim();
    detectedFields.push(`Email: ${guestEmail}`);
  } else {
    missingFields.push('Email');
  }

  // 4. Detect Guest City / Origin
  let guestCity = '';
  const cityMatch =
    text.match(/(?:origin|from\s*city|home\s*city|city|guest\s*city|residence)[:\s-]+([A-Za-z\s]+?)(?=[,;\n]|$)/i) ||
    text.match(/(?:traveling\s+from|travelling\s+from)\s+([A-Za-z\s]+?)(?=[,;\n]|$)/i);
  if (cityMatch && cityMatch[1]) {
    const candidateCity = cityMatch[1].trim();
    if (candidateCity.length >= 3 && candidateCity.length <= 30 && !invalidGuestKeywords.some((w) => candidateCity.toLowerCase().includes(w))) {
      guestCity = candidateCity;
      detectedFields.push(`Guest Origin City: ${guestCity}`);
    }
  }

  // 5. Detect Pickup & Drop Hubs
  let pickupLocation = '';
  let dropLocation = '';
  const pickupMatch =
    text.match(/(?:pickup|pick\s*up|arrival\s*at|starting\s*point|pickup\s*hub|pickup\s*point)[:\s-]+([A-Za-z0-9\s/()-]+?)(?=[,;\n]|$)/i) ||
    text.match(/(?:arrival|pickup)\s+(?:from|at)\s+([A-Za-z0-9\s/()-]+?)(?=[,;.\n]|$)/i);
  if (pickupMatch && pickupMatch[1]) {
    pickupLocation = pickupMatch[1].trim();
    detectedFields.push(`Pickup Location: ${pickupLocation}`);
  }

  const dropMatch =
    text.match(/(?:drop|drop\s*off|departure\s*at|ending\s*point|drop\s*hub|drop\s*point)[:\s-]+([A-Za-z0-9\s/()-]+?)(?=[,;\n]|$)/i) ||
    text.match(/(?:departure|drop)\s+(?:at|to)\s+([A-Za-z0-9\s/()-]+?)(?=[,;.\n]|$)/i);
  if (dropMatch && dropMatch[1]) {
    dropLocation = dropMatch[1].trim();
    detectedFields.push(`Drop Location: ${dropLocation}`);
  }

  // 6. Detect Pax (Adults, Children, Infants)
  let adults = 2;
  let children = 0;
  let infants = 0;
  let paxDetected = false;

  const adultMatch =
    text.match(/(\d+)\s*(?:adults?|pax|persons?|people|head)/i) ||
    text.match(/(?:adults?|pax|persons?)[:\s-]+(\d+)/i);
  if (adultMatch) {
    adults = parseInt(adultMatch[1]);
    paxDetected = true;
  }

  const childMatch =
    text.match(/(\d+)\s*(?:children|child|kids?)/i) ||
    text.match(/(?:children|child|kids?)[:\s-]+(\d+)/i);
  if (childMatch) {
    children = parseInt(childMatch[1]);
    paxDetected = true;
  }

  const infantMatch =
    text.match(/(\d+)\s*(?:infants?|babies|baby)/i) ||
    text.match(/(?:infants?|babies?)[:\s-]+(\d+)/i);
  if (infantMatch) {
    infants = parseInt(infantMatch[1]);
    paxDetected = true;
  }

  if (paxDetected) {
    detectedFields.push(
      `Travelers: ${adults} Adults${children ? `, ${children} Children` : ''}${
        infants ? `, ${infants} Infants` : ''
      }`
    );
  } else {
    missingFields.push('Passenger count (defaulted to 2 Adults)');
  }

  // 7. Detect Duration / Days & Nights
  let detectedDurationDays = 0;
  let detectedDurationNights = 0;
  const durationMatch =
    text.match(/(\d+)\s*(?:nights?|n)\s*[\/&,-]?\s*(\d+)\s*(?:days?|d)/i) ||
    text.match(/(\d+)\s*(?:days?|d)\s*[\/&,-]?\s*(\d+)\s*(?:nights?|n)/i);
  if (durationMatch) {
    const val1 = parseInt(durationMatch[1]);
    const val2 = parseInt(durationMatch[2]);
    if (durationMatch[0].toLowerCase().includes('n') && durationMatch[0].indexOf('n') < durationMatch[0].indexOf('d')) {
      detectedDurationNights = val1;
      detectedDurationDays = val2;
    } else {
      detectedDurationDays = val1;
      detectedDurationNights = val2;
    }
  }

  // 8. Detect Travel Dates (ISO, DMY, or Month Names e.g. 15 Nov 2026)
  let travelStartDate = '';
  let travelEndDate = '';
  const isoDateMatches = text.match(/\b\d{4}-\d{2}-\d{2}\b/g);
  if (isoDateMatches && isoDateMatches.length >= 1) {
    travelStartDate = isoDateMatches[0];
    if (isoDateMatches.length >= 2) travelEndDate = isoDateMatches[1];
  } else {
    // Check for natural month names: "15 Nov 2026 to 21 Nov 2026"
    const naturalMatches = text.match(/\b\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+\s*,?\s*\d{4}\b/gi);
    if (naturalMatches && naturalMatches.length >= 1) {
      const parsed1 = parseNaturalDate(naturalMatches[0]);
      if (parsed1) travelStartDate = parsed1;
      if (naturalMatches.length >= 2) {
        const parsed2 = parseNaturalDate(naturalMatches[1]);
        if (parsed2) travelEndDate = parsed2;
      }
    }
    if (!travelStartDate) {
      // Check for DD/MM/YYYY or DD-MM-YYYY
      const dmyMatches = text.match(/\b(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})\b/g);
      if (dmyMatches && dmyMatches.length >= 1) {
        const parts1 = dmyMatches[0].split(/[\/\.-]/);
        travelStartDate = `${parts1[2]}-${parts1[1].padStart(2, '0')}-${parts1[0].padStart(2, '0')}`;
        if (dmyMatches.length >= 2) {
          const parts2 = dmyMatches[1].split(/[\/\.-]/);
          travelEndDate = `${parts2[2]}-${parts2[1].padStart(2, '0')}-${parts2[0].padStart(2, '0')}`;
        }
      }
    }
  }

  if (travelStartDate) {
    detectedFields.push(`Travel Dates: ${travelStartDate}${travelEndDate ? ` to ${travelEndDate}` : ''}`);
  }

  // 9. Detect Title or Destination
  let title = '';
  const titleCandidate = lines.find(
    (l) =>
      l.length >= 8 &&
      l.length <= 80 &&
      !l.toLowerCase().startsWith('day') &&
      !l.toLowerCase().startsWith('d1') &&
      !l.toLowerCase().startsWith('d2') &&
      !l.toLowerCase().startsWith('client') &&
      !l.toLowerCase().startsWith('guest') &&
      !l.toLowerCase().startsWith('hotel') &&
      !l.toLowerCase().startsWith('package cost') &&
      !l.toLowerCase().startsWith('reserved') &&
      !l.toLowerCase().startsWith('sharing') &&
      (l.toLowerCase().includes('sikkim') ||
        l.toLowerCase().includes('darjeeling') ||
        l.toLowerCase().includes('meghalaya') ||
        l.toLowerCase().includes('arunachal') ||
        l.toLowerCase().includes('kaziranga') ||
        l.toLowerCase().includes('assam') ||
        l.toLowerCase().includes('tour') ||
        l.toLowerCase().includes('itinerary') ||
        l.toLowerCase().includes('holiday'))
  );
  if (titleCandidate) {
    title = titleCandidate.replace(/^#+\s*/, '').replace(/^[*-]+\s*/, '').replace(/\*+/g, '').trim();
    detectedFields.push(`Tour Title: "${title}"`);
  } else {
    title = 'Customized North East Holiday Tour';
    missingFields.push('Tour Title (assigned default title)');
  }

  // Detect Destination Region for theme & cover image
  let destination = 'Sikkim & Darjeeling';
  const textLower = text.toLowerCase();
  if (textLower.includes('meghalaya') || textLower.includes('shillong') || textLower.includes('cherrapunji')) {
    destination = 'Meghalaya';
  } else if (textLower.includes('arunachal') || textLower.includes('tawang') || textLower.includes('bomdila')) {
    destination = 'Arunachal Pradesh';
  } else if (textLower.includes('kaziranga') || textLower.includes('assam') || textLower.includes('guwahati')) {
    destination = 'Assam & Kaziranga';
  } else if (textLower.includes('darjeeling') && !textLower.includes('sikkim') && !textLower.includes('gangtok')) {
    destination = 'Darjeeling';
  } else if (textLower.includes('lachen') || textLower.includes('lachung') || textLower.includes('gurudongmar')) {
    destination = 'North Sikkim';
  } else if (textLower.includes('pelling') && !textLower.includes('gangtok')) {
    destination = 'Pelling';
  }
  detectedFields.push(`Destination Circuit: ${destination}`);

  // Default cover for destination
  const defaultCover = getDefaultDestinationCover(destination, title);

  // 10. Extract Day-by-Day Schedule
  // Handles markdown: *Day 1:* or **Day 1** or # Day 1 or Day 1: or D1:
  const days: ItineraryDay[] = [];
  const daySplits: { dayNum: number; rawTitle: string; contentLines: string[] }[] = [];
  let currentBlock: { dayNum: number; rawTitle: string; contentLines: string[] } | null = null;

  for (const line of lines) {
    const cleanLine = line.replace(/^\*+|\*+$/g, '').trim();
    const dayMatch = cleanLine.match(/^(?:day\s*(\d+)|d(\d+)|(\d+)[.)]\s*)(?:[:.-]\s*)?(.*)$/i);
    if (dayMatch) {
      const num = parseInt(dayMatch[1] || dayMatch[2] || dayMatch[3]);
      const dayTitle = dayMatch[4]?.replace(/^\*+|\*+$/g, '').trim() || `Tour Sightseeing Day ${num}`;
      currentBlock = {
        dayNum: num,
        rawTitle: dayTitle,
        contentLines: [],
      };
      daySplits.push(currentBlock);
    } else if (currentBlock) {
      // Check if this line is an inclusion/exclusion or cost block which signals the end of days
      if (
        /^(?:hotel\s*category|package\s*cost|quotation|reserved|sharing|inclusions?|exclusions?|terms)/i.test(
          cleanLine
        )
      ) {
        currentBlock = null;
      } else {
        currentBlock.contentLines.push(cleanLine);
      }
    }
  }

  if (daySplits.length > 0) {
    daySplits.forEach((split) => {
      const fullText = split.contentLines.join(' ').trim();
      const cleanTitle = split.rawTitle || `Tour Sightseeing Day ${split.dayNum}`;
      const combinedText = `${cleanTitle} ${fullText}`.toLowerCase();

      // Extract Destination / Night Stay
      let nightStay = 'Gangtok';
      let foundDest = KNOWN_DESTINATIONS.find((dest) => combinedText.includes(dest.toLowerCase()));
      if (foundDest) {
        nightStay = foundDest;
      } else if (combinedText.includes('drop') || combinedText.includes('departure') || combinedText.includes('fly out')) {
        nightStay = 'Departure';
      }

      // Extract Hotel Name if mentioned in text
      let hotelName = '';
      const hotelMatch = fullText.match(
        /(?:hotel|resort|stay\s*at|overnight\s*at\s*hotel)[:\s-]+([A-Za-z0-9\s.&'-]+?)(?=[.,;]|meal|night|$)/i
      );
      if (hotelMatch && hotelMatch[1] && !hotelMatch[1].toLowerCase().includes('category')) {
        const h = hotelMatch[1].trim();
        if (h.length > 3 && h.length < 50) hotelName = h;
      }

      // Extract Meal Plan for day
      let meal = 'Breakfast & Dinner';
      if (isNorthSikkimLocation(cleanTitle, nightStay, fullText)) {
        meal = NORTH_SIKKIM_DAY_MEAL_PLAN;
      } else if (combinedText.includes('lunch') && combinedText.includes('dinner')) {
        meal = 'All Meals (AP)';
      } else if (combinedText.includes('breakfast only') || combinedText.includes('cp plan')) {
        meal = 'Breakfast (CP)';
      } else if (split.dayNum === 1) {
        meal = 'Dinner Included';
      }

      // Extract Highlights
      const highlights: string[] = [];
      const commonHotspots = [
        'Tsomgo Lake', 'Baba Mandir', 'Nathula Pass', 'MG Marg', 'Tashi Viewpoint',
        'Ganesh Tok', 'Tiger Hill', 'Batasia Loop', 'Ghoom Monastery', 'HMI Zoo',
        'Pelling Skywalk', 'Pemayangtse Monastery', 'Khecheopalri Lake', 'Gurudongmar Lake',
        'Yumthang Valley', 'Zero Point', 'Umiam Lake', 'Nohkalikai Falls', 'Mawsmai Cave',
        'Dawki Umngot River', 'Living Root Bridge', 'Kaziranga Safari', 'Mirik Lake'
      ];
      commonHotspots.forEach((spot) => {
        if (cleanTitle.toLowerCase().includes(spot.toLowerCase()) || fullText.toLowerCase().includes(spot.toLowerCase())) {
          highlights.push(spot);
        }
      });

      days.push({
        id: `parsed-d-${split.dayNum}-${Date.now()}`,
        dayNumber: split.dayNum,
        title: cleanTitle,
        description: fullText || `${cleanTitle}. Scenic journey and local exploration as per tour itinerary.`,
        sightseeingHighlights: highlights.length > 0 ? highlights : ['Scenic Mountain Views'],
        nightStay,
        hotelName,
        hotelPricingMode: 'per_night',
        hotelCostPerNight: 0,
        hotelCostPerPerson: 0,
        roomCount: Math.max(1, Math.ceil(adults / 2)),
        hotelTotalCost: 0,
        mealPlan: meal,
        transportDetails: 'Dedicated Vehicle / Shared Cab',
        transportCost: 0,
        activityCost: 0,
      });
    });

    detectedFields.push(`Parsed ${days.length} Itinerary Days automatically`);
  } else {
    missingFields.push('Day-by-day breakdown not explicitly tagged (default template days loaded)');
  }

  // 11. Detect Hotel Category & Meal Plan
  let hotelCategory = 'Deluxe Category (3-Star Mountain View)';
  if (textLower.includes('super deluxe') || textLower.includes('4 star')) {
    hotelCategory = 'Super Deluxe Category (4-Star Premium)';
    detectedFields.push('Hotel: Super Deluxe (4-Star)');
  } else if (textLower.includes('luxury') || textLower.includes('5 star') || textLower.includes('boutique resort')) {
    hotelCategory = 'Luxury Heritage / Boutique Resorts';
    detectedFields.push('Hotel: Luxury / Boutique Resort');
  } else if (textLower.includes('deluxe') || textLower.includes('3 star')) {
    hotelCategory = 'Deluxe Category (3-Star Mountain View)';
    detectedFields.push('Hotel: Deluxe 3-Star');
  } else if (textLower.includes('budget') || textLower.includes('standard')) {
    hotelCategory = 'Standard Budget Clean Hotels';
    detectedFields.push('Hotel: Standard Budget');
  }

  let mealPlan = 'MAP (Daily Breakfast & Dinner)';
  const isNorthSikkimTourDetected =
    isNorthSikkimTour(destination, text) ||
    days.some((d) => isNorthSikkimLocation(d.title, d.nightStay, d.description));
  if (isNorthSikkimTourDetected) {
    mealPlan = NORTH_SIKKIM_COMPULSORY_MEAL_PLAN;
    detectedFields.push('Meal Plan: North Sikkim Compulsory All Meals (AP Plan)');
  } else if (textLower.includes('cp plan') || textLower.includes('breakfast only')) {
    mealPlan = 'CP (Daily Breakfast Only)';
  } else if (textLower.includes('ap plan') || textLower.includes('all meals')) {
    mealPlan = 'AP (All Meals - Breakfast, Lunch, Dinner)';
  } else if (textLower.includes('ep plan') || textLower.includes('room only')) {
    mealPlan = 'EP (Room Only)';
  }

  // 12. Costing & Rates Detection for the 3 Pricing Modes (Reserved, Sharing, Both)
  let reservedPrice = 0;
  let sharingPrice = 0;
  let detectedPerPersonPrice = 0;
  let hasReservedMention = false;
  let hasSharingMention = false;

  // Rate per person
  const perPersonMatch =
    text.match(/(?:rs\.?|inr|₹)?\s*([\d,]+)\s*(?:per\s*(?:person|pax|adult)|[\/]\s*(?:person|pax|head|adult)|pp\b)/i) ||
    text.match(/(?:rate|cost|price)\s*(?:per\s*(?:person|pax)|[\/]\s*(?:person|pax))[:\s-]+(?:rs\.?|inr|₹)?\s*([\d,]+)/i);
  if (perPersonMatch) {
    detectedPerPersonPrice = parseInt(perPersonMatch[1].replace(/,/g, ''));
    reservedPrice = detectedPerPersonPrice * Math.max(1, adults);
    detectedFields.push(
      `Detected Rate / Person: ₹${detectedPerPersonPrice.toLocaleString('en-IN')} (Total: ₹${reservedPrice.toLocaleString('en-IN')} for ${adults} Pax)`
    );
  }

  // Look for "Reserved Cab Facility: Rs XXX" or "Reserved: Rs XXX"
  const reservedMatch = text.match(/(?:reserved|private|dedicated)[^0-9\n]{0,35}(?:rs\.?|inr|₹)?\s*([\d,]+)/i);
  if (reservedMatch) {
    reservedPrice = parseInt(reservedMatch[1].replace(/,/g, ''));
    hasReservedMention = true;
    detectedFields.push(`Reserved Cab Quote: ₹${reservedPrice.toLocaleString('en-IN')}`);
  }

  // Look for "Sharing Cab Facility: Rs XXX" or "Sharing: Rs XXX"
  const sharingMatch = text.match(/(?:sharing|shared)[^0-9\n]{0,35}(?:rs\.?|inr|₹)?\s*([\d,]+)/i);
  if (sharingMatch) {
    sharingPrice = parseInt(sharingMatch[1].replace(/,/g, ''));
    hasSharingMention = true;
    detectedFields.push(`Sharing Cab Quote: ₹${sharingPrice.toLocaleString('en-IN')}`);
  }

  // General package cost fallback
  if (!reservedPrice && !sharingPrice) {
    const generalPriceMatch = text.match(
      /(?:package\s*cost|total\s*package|package\s*price|package\s*rate|selling\s*cost|total\s*cost|total\s*tour\s*cost|tour\s*cost|tour\s*price)[:\s-]+(?:rs\.?|inr|₹)?\s*([\d,]+)/i
    );
    if (generalPriceMatch) {
      reservedPrice = parseInt(generalPriceMatch[1].replace(/,/g, ''));
      detectedFields.push(`Package Selling Cost: ₹${reservedPrice.toLocaleString('en-IN')}`);
    }
  }

  // Determine Pricing Mode: 'reserved', 'sharing', or 'both'
  let pricingMode: 'reserved' | 'sharing' | 'both' = 'both';
  if (hasReservedMention && hasSharingMention) {
    pricingMode = 'both';
  } else if (hasSharingMention && !hasReservedMention) {
    pricingMode = 'sharing';
  } else if (hasReservedMention && !hasSharingMention) {
    pricingMode = 'reserved';
  } else {
    // If both prices are available, default to 'both', else 'reserved'
    pricingMode = sharingPrice > 0 ? 'both' : 'reserved';
  }
  detectedFields.push(`Pricing Mode: ${pricingMode.toUpperCase()}`);

  // Fixed Vehicle Fleet Matching for Reserved Cab
  let matchedReservedVehicle = 'Innova / Xylo';
  if (textLower.includes('tempo traveller') || textLower.includes('tempo') || adults > 8) {
    matchedReservedVehicle = 'Tempo Traveller';
  } else if (textLower.includes('swift') || textLower.includes('wagonr') || textLower.includes('wagon r') || (adults <= 3 && textLower.includes('small'))) {
    matchedReservedVehicle = 'Small Cab (Swift / WagonR)';
  } else if (textLower.includes('sumo') && !hasSharingMention) {
    matchedReservedVehicle = 'Tata Sumo (Reserved Dedicated)';
  } else {
    matchedReservedVehicle = 'Innova / Xylo';
  }

  // Fixed Vehicle for Sharing Cab: STRICTLY Tata Sumo / Mahindra Bolero
  const fixedSharingVehicle = FIXED_SHARING_VEHICLE.name;

  // 13. Extract Common Inclusions & Exclusions if present
  const commonInclusions: string[] = [];
  const commonExclusions: string[] = [];

  const inclusionSectionMatch = text.match(/(?:inclusions?|included|package\s*includes?)[:\s]+([\s\S]*?)(?=(?:exclusions?|excluded|terms|advisories|payment|$))/i);
  if (inclusionSectionMatch && inclusionSectionMatch[1]) {
    const incLines = inclusionSectionMatch[1].split(/\r?\n/).map((l) => l.replace(/^[*-•✓\d.]+\s*/, '').trim()).filter((l) => l.length > 5);
    if (incLines.length > 0) {
      commonInclusions.push(...incLines.slice(0, 10));
      detectedFields.push(`Extracted ${commonInclusions.length} Inclusions`);
    }
  }

  const exclusionSectionMatch = text.match(/(?:exclusions?|excluded|package\s*excludes?)[:\s]+([\s\S]*?)(?=(?:terms|advisories|payment|cancellation|$))/i);
  if (exclusionSectionMatch && exclusionSectionMatch[1]) {
    const excLines = exclusionSectionMatch[1].split(/\r?\n/).map((l) => l.replace(/^[*-•xX\d.]+\s*/, '').trim()).filter((l) => l.length > 5);
    if (excLines.length > 0) {
      commonExclusions.push(...excLines.slice(0, 10));
      detectedFields.push(`Extracted ${commonExclusions.length} Exclusions`);
    }
  }

  const finalDays = days.length > 0 ? days.length : (detectedDurationDays || 6);
  const finalNights = detectedDurationNights || Math.max(1, finalDays - 1);

  const parsedItinerary: Partial<Itinerary> = {
    title: title || 'Customized North East Holiday Tour',
    destination,
    heroImageUrl: defaultCover.url,
    heroImageCaption: defaultCover.caption,
    guestName: guestName || '',
    guestPhone: guestPhone || '',
    guestEmail: guestEmail || '',
    guestCity: guestCity || '',
    pickupLocation: pickupLocation || (destination.includes('Meghalaya') || destination.includes('Assam') ? 'Guwahati Airport / Rly Station' : 'Bagdogra Airport (IXB) / NJP Station'),
    dropLocation: dropLocation || (destination.includes('Meghalaya') || destination.includes('Assam') ? 'Guwahati Airport' : 'Bagdogra Airport (IXB) / NJP Station'),
    adults,
    children,
    infants,
    durationDays: finalDays,
    durationNights: finalNights,
    travelStartDate: travelStartDate || undefined,
    travelEndDate: travelEndDate || undefined,
    hotelCategory,
    mealPlan,
    pricingMode,
    days: days.length > 0 ? days : undefined,
    // Selling cost is populated from package cost; internal buying cost is kept 0 for manual input
    sellingCost: reservedPrice || 0,
    sellingCostPerPerson: detectedPerPersonPrice || (reservedPrice ? Math.round(reservedPrice / Math.max(1, adults)) : 0),
    packageCost: 0,
    markupPercentage: 0,
    sellingCostSharing: sharingPrice || 0,
    sellingCostPerPersonSharing: sharingPrice ? Math.round(sharingPrice / Math.max(1, adults)) : 0,
    packageCostSharing: 0,
    markupPercentageSharing: 0,
    reservedCab: {
      enabled: true,
      name: 'Option A: Reserved Cab Facility (Private Dedicated SUV)',
      vehicleType: matchedReservedVehicle,
      description: `Exclusive private ${matchedReservedVehicle} allocated strictly for your group from pickup to drop.`,
      pricePerPerson: detectedPerPersonPrice || (reservedPrice ? Math.round(reservedPrice / Math.max(1, adults)) : 0),
      totalPackagePrice: reservedPrice,
      gstPercentage: 0,
      gstIncluded: true,
      specificInclusions: [
        `Exclusive private ${matchedReservedVehicle} allocated for your tour party only`,
        'Hotel porch door-to-door pickup & drop for all excursions',
        'Fuel, interstate permit, driver mountain allowances & tolls included',
      ],
      specificExclusions: ['Zero Point or Nathula pass vehicle supplement if taken on spot (Nathula Pass closed on Mondays only)'],
    },
    sharingCab: {
      enabled: true,
      name: 'Option B: Sharing Cab Facility (Economical Shared Mountain Vehicle)',
      vehicleType: fixedSharingVehicle,
      description: 'Seat allocation in shared Tata Sumo / Mahindra Bolero on scheduled departure slots between taxi hubs.',
      pricePerPerson: sharingPrice ? Math.round(sharingPrice / Math.max(1, adults)) : 0,
      totalPackagePrice: sharingPrice,
      gstPercentage: 0,
      gstIncluded: true,
      specificInclusions: [
        'Seat allocation in shared Tata Sumo / Mahindra Bolero on designated route schedules',
        'Standard mountain transit stand transfers',
      ],
      specificExclusions: [
        'Local small taxi from terminal stand to uphill hotel',
        'Luggage exceeding standard 1 trolley bag per person',
      ],
    },
    commonInclusions: (() => {
      const base = commonInclusions.length > 0 ? [...commonInclusions] : [...defaultPackageInclusions];
      if (
        isNorthSikkimTourDetected &&
        !base.some((inc) => inc.toLowerCase().includes('all meals') || inc.toLowerCase().includes('compulsory'))
      ) {
        base.unshift(
          'COMPULSORY ALL MEALS (AP Plan): Daily Breakfast, Lunch & Dinner included throughout North Sikkim as per regional tourism regulations'
        );
      }
      return base;
    })(),
    commonExclusions: commonExclusions.length > 0 ? commonExclusions : defaultPackageExclusions,
    specialAdvisories: defaultSpecialAdvisories,
    termsAndConditions: defaultTermsAndConditions,
    paymentMilestones: defaultPaymentMilestones,
  };

  return {
    itinerary: parsedItinerary,
    detectedFields,
    missingFields,
    rawText: text,
  };
}

/**
 * AI-assisted text itinerary parser with automatic fallback to local parser.
 */
export async function parseItineraryText(text: string): Promise<ParseResult> {
  try {
    const res = await fetch('/api/parse-itinerary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawText: text }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.itinerary) {
        const validatedItinerary = buildFullItineraryFromAi(data.itinerary, null, true);
        return {
          itinerary: validatedItinerary,
          detectedFields: data.detectedFields && data.detectedFields.length > 0
            ? data.detectedFields
            : [
                `Destination: ${validatedItinerary.destination}`,
                `Duration: ${validatedItinerary.durationDays} Days / ${validatedItinerary.durationNights} Nights`,
                `Guest: ${validatedItinerary.guestName} (${validatedItinerary.adults} Pax)`,
                `Route: ${validatedItinerary.days.map((d) => d.nightStay).filter(Boolean).slice(0, 3).join(' ➔ ')}`,
                `Cab: ${validatedItinerary.reservedCab.vehicleType}`,
              ],
          missingFields: data.missingFields || [],
          rawText: text,
        };
      }
    }
  } catch (err) {
    console.warn('Backend AI parser unavailable, using local parser:', err);
  }

  const localRes = parseItineraryTextLocally(text);
  const validatedLocal = buildFullItineraryFromAi(localRes.itinerary, null, true);
  return {
    ...localRes,
    itinerary: validatedLocal,
  };
}
