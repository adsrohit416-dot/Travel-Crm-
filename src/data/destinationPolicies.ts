/**
 * Destination-specific Travel Notes, Advisories, Terms & Conditions, and Policies.
 * Automatically adapts based on destination name and tour title so destinations like
 * Andaman, Sikkim, Meghalaya, Kashmir, Kerala, etc. display their own respective guidelines.
 */

export type DestinationCategory =
  | 'andaman'
  | 'sikkim'
  | 'north_sikkim'
  | 'darjeeling'
  | 'meghalaya'
  | 'arunachal'
  | 'assam'
  | 'kashmir_ladakh'
  | 'kerala'
  | 'goa'
  | 'himachal_uttarakhand'
  | 'bhutan'
  | 'general';

/**
 * Detects the destination category from the destination string and/or title.
 */
export function getDestinationCategory(destination?: string, title?: string): DestinationCategory {
  const q = `${destination || ''} ${title || ''}`.toLowerCase();

  // 1. Andaman & Nicobar
  if (
    q.includes('andaman') ||
    q.includes('port blair') ||
    q.includes('havelock') ||
    q.includes('neil') ||
    q.includes('swaraj dweep') ||
    q.includes('shaheed dweep') ||
    q.includes('radhanagar') ||
    q.includes('cellular jail') ||
    q.includes('ross island') ||
    q.includes('baratang') ||
    q.includes('elephant beach') ||
    q.includes('north bay') ||
    q.includes('corbyn')
  ) {
    return 'andaman';
  }

  // 2. North Sikkim (Strict High-Altitude & All Meals)
  if (
    q.includes('north sikkim') ||
    q.includes('lachen') ||
    q.includes('lachung') ||
    q.includes('gurudongmar') ||
    q.includes('yumthang') ||
    q.includes('zero point') ||
    q.includes('yumesamdong') ||
    q.includes('chopta valley')
  ) {
    return 'north_sikkim';
  }

  // 3. Sikkim (Gangtok, Pelling, Ravangla, Tsomgo, Nathula)
  if (
    q.includes('sikkim') ||
    q.includes('gangtok') ||
    q.includes('pelling') ||
    q.includes('ravangla') ||
    q.includes('namchi') ||
    q.includes('tsomgo') ||
    q.includes('nathula') ||
    q.includes('changu')
  ) {
    return 'sikkim';
  }

  // 4. Darjeeling & surrounding hills
  if (
    q.includes('darjeeling') ||
    q.includes('kalimpong') ||
    q.includes('mirik') ||
    q.includes('kurseong') ||
    q.includes('tiger hill') ||
    q.includes('batasia') ||
    q.includes('ghoom')
  ) {
    return 'darjeeling';
  }

  // 5. Meghalaya
  if (
    q.includes('meghalaya') ||
    q.includes('shillong') ||
    q.includes('cherrapunji') ||
    q.includes('sohra') ||
    q.includes('dawki') ||
    q.includes('mawlynnong') ||
    q.includes('root bridge') ||
    q.includes('nohkalikai') ||
    q.includes('krang suri')
  ) {
    return 'meghalaya';
  }

  // 6. Arunachal Pradesh
  if (
    q.includes('arunachal') ||
    q.includes('tawang') ||
    q.includes('bomdila') ||
    q.includes('dirang') ||
    q.includes('sela pass') ||
    q.includes('bhalukpong') ||
    q.includes('madhuri lake') ||
    q.includes('sangetsar')
  ) {
    return 'arunachal';
  }

  // 7. Assam
  if (
    q.includes('assam') ||
    q.includes('kaziranga') ||
    q.includes('guwahati') ||
    q.includes('kamakhya') ||
    q.includes('majuli') ||
    q.includes('manas')
  ) {
    return 'assam';
  }

  // 8. Kashmir & Ladakh
  if (
    q.includes('kashmir') ||
    q.includes('srinagar') ||
    q.includes('gulmarg') ||
    q.includes('pahalgam') ||
    q.includes('sonamarg') ||
    q.includes('ladakh') ||
    q.includes('leh') ||
    q.includes('nubra') ||
    q.includes('pangong')
  ) {
    return 'kashmir_ladakh';
  }

  // 9. Kerala
  if (
    q.includes('kerala') ||
    q.includes('munnar') ||
    q.includes('alleppey') ||
    q.includes('alappuzha') ||
    q.includes('kochi') ||
    q.includes('cochin') ||
    q.includes('thekkady') ||
    q.includes('wayanad') ||
    q.includes('kovalam')
  ) {
    return 'kerala';
  }

  // 10. Goa
  if (
    q.includes('goa') ||
    q.includes('panaji') ||
    q.includes('calangute') ||
    q.includes('baga') ||
    q.includes('anjuna') ||
    q.includes('candolim')
  ) {
    return 'goa';
  }

  // 11. Himachal Pradesh & Uttarakhand
  if (
    q.includes('himachal') ||
    q.includes('manali') ||
    q.includes('shimla') ||
    q.includes('dharamshala') ||
    q.includes('uttarakhand') ||
    q.includes('rishikesh') ||
    q.includes('mussoorie') ||
    q.includes('nainital')
  ) {
    return 'himachal_uttarakhand';
  }

  // 12. Bhutan
  if (
    q.includes('bhutan') ||
    q.includes('paro') ||
    q.includes('thimphu') ||
    q.includes('punakha')
  ) {
    return 'bhutan';
  }

  return 'general';
}

/**
 * Returns human-readable display name for the destination sector.
 */
export function getDestinationCategoryName(destination?: string, title?: string): string {
  const cat = getDestinationCategory(destination, title);
  switch (cat) {
    case 'andaman':
      return 'Andaman Islands';
    case 'north_sikkim':
      return 'North Sikkim';
    case 'sikkim':
      return 'Sikkim';
    case 'darjeeling':
      return 'Darjeeling Hills';
    case 'meghalaya':
      return 'Meghalaya';
    case 'arunachal':
      return 'Arunachal Pradesh';
    case 'assam':
      return 'Assam';
    case 'kashmir_ladakh':
      return 'Ladakh & Kashmir';
    case 'kerala':
      return 'Kerala';
    case 'goa':
      return 'Goa';
    case 'himachal_uttarakhand':
      return 'Himachal & Uttarakhand';
    case 'bhutan':
      return 'Bhutan';
    default:
      return destination && destination.trim() ? destination.trim() : 'Destination';
  }
}

/**
 * Dynamic Section 6 Header in Itinerary Preview / PDF.
 */
export function getDestinationNotesTitle(destination?: string, title?: string): string {
  const cat = getDestinationCategory(destination, title);
  switch (cat) {
    case 'andaman':
      return 'Essential Andaman Islands Travel Notes & Cruise Guidelines';
    case 'north_sikkim':
      return 'Essential North Sikkim High-Altitude Notes & AP Meal Regulations';
    case 'sikkim':
      return 'Essential Sikkim Travel Notes & Permit Guidelines';
    case 'darjeeling':
      return 'Essential Darjeeling Heritage Travel Notes & Mountain Guidelines';
    case 'meghalaya':
      return 'Essential Meghalaya Travel Notes & Nature Trail Guidelines';
    case 'arunachal':
      return 'Essential Arunachal Pradesh Travel Notes & ILP Border Guidelines';
    case 'assam':
      return 'Essential Assam Travel Notes & Wildlife Safari Guidelines';
    case 'kashmir_ladakh':
      return 'Essential Ladakh & Kashmir High-Altitude Notes & Permit Guidelines';
    case 'kerala':
      return 'Essential Kerala Travel Notes & Houseboat Cruise Guidelines';
    case 'goa':
      return 'Essential Goa Coastal Travel Notes & Beach Safety Guidelines';
    case 'himachal_uttarakhand':
      return 'Essential Himachal & Uttarakhand Mountain Travel Guidelines';
    case 'bhutan':
      return 'Essential Bhutan Travel Notes & SDF Cultural Guidelines';
    default:
      return `Essential ${getDestinationCategoryName(destination, title)} Travel Notes & Guidelines`;
  }
}

/**
 * Dynamic Section 7 Terms & Conditions Title in Itinerary Preview / PDF.
 */
export function getDestinationTermsTitle(destination?: string, title?: string): string {
  const name = getDestinationCategoryName(destination, title);
  return `${name} Tour Terms & Booking Conditions:`;
}

/**
 * Destination-specific Essential Travel Notes & Advisories.
 * Replaces hardcoded North East notes for other destinations.
 */
export function getDestinationSpecialAdvisories(destination?: string, title?: string): string[] {
  const cat = getDestinationCategory(destination, title);

  switch (cat) {
    case 'andaman':
      return [
        'Inter-Island Catamaran Cruises: Private high-speed catamaran ferries (Makruzz / Nautika / Green Ocean) operate between Port Blair, Havelock (Swaraj Dweep), and Neil (Shaheed Dweep) on fixed scheduled timings. Boarding gates close 45 minutes prior to sailing; carrying government photo ID is mandatory.',
        'Weather & Coast Guard Clearances: Ferry departures and water sports are strictly subject to weather and Indian Coast Guard port clearances. In case of sudden squalls, cyclone alerts, or rough seas, ferry timings may be rescheduled for passenger safety without administrative liability.',
        'Water Sports & Coral Reef Guidelines: Scuba diving, Sea Walk, and Snorkeling at Elephant Beach or North Bay require physical fitness and weather clearance. Touching, standing on, damaging, or collecting dead corals or sea shells is strictly prohibited under the Indian Wildlife Protection Act.',
        'Strict Environmental & Plastic Ban: Single-use plastic bottles, polythene carry bags, and littering are strictly prohibited throughout Andaman beaches and islands. Heavy spot fines are levied by the Andaman Administration.',
        'Tribal Reserve Regulations: Photography, videography, or interaction with indigenous Jarawa and Sentinelese tribes along the Andaman Trunk Road (ATR) is strictly illegal under the PAT Regulation Act. Convoy speed limits and guidelines must be followed.',
        'Mobile Network Connectivity: Only BSNL and Airtel networks have reliable coverage in Port Blair and Havelock. High-speed 4G/5G data is intermittent on Neil and outer islands; hotel Wi-Fi is satellite-based.',
        'Airport Reporting: Due to strict naval air station operational rules at Veer Savarkar International Airport (Port Blair), reporting 2.5 hours prior to domestic flight departure is compulsory.',
      ];

    case 'north_sikkim':
      return [
        'North Sikkim Tour Regulation: Daily Breakfast, Lunch & Dinner (AP Plan) are strictly COMPULSORY for all nights in Lachen and Lachung as per regional tourism administration rules.',
        'Permits & ID Proofs: North Sikkim (Lachen, Lachung, Gurudongmar & Yumthang) requires Indian Army & Police tourism permits. All guests must carry Original Valid Voter ID Card / Passport (Aadhaar/PAN card not valid for Army checkpoints) + 4 passport size photos.',
        'High Altitude Acclimatization: Gurudongmar Lake is situated at 17,800 ft and Zero Point at 15,300 ft. Stay well-hydrated and avoid running. Not recommended for infants under 4 years and guests with severe cardiac/respiratory conditions.',
        'Carry heavy woolens, thermal innerwear, windproof jackets, woollen caps, and waterproof gloves throughout the year.',
        'Only Postpaid BSNL, Airtel, and Jio mobile networks work in parts of North Sikkim; connectivity can be intermittent in interior valleys.',
        'Vehicle AC does not operate in hilly terrain to preserve engine cooling and mountain safety.',
      ];

    case 'sikkim':
      return [
        'Nathula Pass (Indo-China Border) is closed ONLY on Mondays for tourists (open Tuesday through Sunday) and is subject to Indian Army permit availability (additional supplemental permit fee applicable).',
        'Permits & ID Proofs: Sikkim border circuits (Tsomgo Lake, Baba Mandir & Nathula) require government tourism permits. All guests must carry Original Valid Voter ID Card / Passport + 4 passport size photographs.',
        'High Altitude & Weather Disruption: In case of landslides, heavy snowfall, military closures, or roadblocks at high passes, alternate sightseeing will be arranged where feasible.',
        'Carry warm woolens, light thermals, and comfortable walking shoes for monastery stairways and high-altitude lakes.',
        'Vehicle AC does not operate in hilly terrain to preserve engine cooling and mountain road safety.',
      ];

    case 'darjeeling':
      return [
        'Tiger Hill Sunrise: Early morning departure (approx 04:00 AM) is required to view the dawn over Mt. Kanchenjunga; traffic permits are allocated by local authorities.',
        'Darjeeling Himalayan Railway (Toy Train): Joy ride steam/diesel tickets are subject to Indian Railways scheduling. Advance seat reservation is strongly recommended.',
        'Heritage Walk & Mall Road: Chowrasta Mall Road and Observatory Hill are pedestrian-only zones; vehicles are restricted by municipal police.',
        'Carry light woolens in summer and heavy woolens with windcheaters from October to March.',
        'Vehicle AC does not operate on mountain uphill roads to maintain engine power and safety.',
      ];

    case 'meghalaya':
      return [
        'Rainwear & Footwear Advisory: Carry raincoats, compact umbrellas, and sturdy grip sports shoes for waterfall trails, living root bridges, and limestone caves.',
        'Dawki Umngot River Boating: Transparent crystal water visibility is optimal between October and April. Boating is subject to local river safety protocols and river water levels.',
        'Mawlynnong Cleanliness Code: Mawlynnong is Asia’s cleanest village; smoking in public, using plastic carry bags, and littering are strictly prohibited by the village council.',
        'Cherrapunji (Sohra) Weather: Weather changes rapidly with sudden mist and showers; keep electronics in waterproof pouches during canyon excursions.',
        'Airtel and Jio networks provide steady 4G/5G mobile connectivity across Shillong and Cherrapunji; reception in deep gorges and waterfalls may be intermittent.',
      ];

    case 'arunachal':
      return [
        'Inner Line Permit (ILP): ILP is mandatory for all Indian citizens entering Arunachal Pradesh. Foreign nationals require a Protected Area Permit (PAP). Keep original ID proofs and permit copies accessible at all check gates.',
        'Sela Pass & Bum La Pass: Sela Pass (13,700 ft) and Bum La (Indo-China border) are subject to high-altitude snowfall and military clearance. Bum La requires an additional Army permit issued in Tawang.',
        'Carry heavy woollens, thermal innerwear, gloves, and winter caps year-round due to high Himalayan winds.',
        'Only Postpaid BSNL and Airtel networks operate reliably across West Kameng and Tawang districts.',
      ];

    case 'assam':
      return [
        'Kaziranga Safari Regulations: Forest safari zones (Central Kohora, Western Bagori, Eastern Agoratoli) are allocated by Assam Forest Department. Carry valid photo IDs for forest checkpoint verification.',
        'Safari Seasons: Kaziranga National Park is generally open for safaris from October/November through April/May, subject to flood clearance and forest notifications.',
        'Brahmaputra River Cruises: Evening river cruise boarding closes 30 minutes prior to departure at Guwahati river ghats.',
        'Maa Kamakhya Temple: VIP darshan passes or general queue timings depend on temple trust regulations and daily pilgrimage schedules.',
      ];

    case 'kashmir_ladakh':
      return [
        'High Altitude Acclimatization (Ladakh): Minimum 24 to 48 hours of complete rest is mandatory upon landing in Leh (11,500 ft) to prevent Acute Mountain Sickness (AMS). Stay hydrated and avoid exertion.',
        'Mobile Connectivity: Prepaid SIM cards from other Indian states do NOT work in Jammu & Kashmir or Ladakh as per telecom security regulations. Only Indian POSTPAID SIM cards (Jio, Airtel, BSNL) function.',
        'Permits: Pangong Lake, Nubra Valley, and Khardung La require Protected Area Permits / Environmental Fees. Keep original photo IDs and multiple photocopies handy.',
        'Union Taxi Regulations: Local union vehicles operate for internal sightseeing in Gulmarg, Sonamarg, and Nubra Valley as per local taxi union norms.',
      ];

    case 'kerala':
      return [
        'Alleppey Houseboat Timings: Houseboats check in around 12:30 PM, cruise until 05:30 PM (as per government fishing net safety laws), and anchor overnight. Standard AC in deluxe houseboats runs from 09:00 PM to 06:00 AM.',
        'Temple Dress Code: Traditional dress code (dhoti for men, saree/salwar for women) is mandatory for Padmanabhaswamy and Guruvayur temples. Leather belts and wallets are prohibited inside sanctums.',
        'Hill Station Climate: Munnar and Wayanad experience cool evenings; light woollens or cardigans are recommended between November and February.',
        'Monsoon & Beach Safety: Swimming in rough sea conditions during monsoon high tides is dangerous and prohibited by coastal lifeguards.',
      ];

    case 'goa':
      return [
        'Beach Safety & Swimming: Swimming after sunset or in red-flagged sea zones during high tide is hazardous and strictly prohibited by coastal lifeguards.',
        'Water Sports Season: Parasailing, jet ski, and boat trips at Baga, Calangute, and Grand Island operate weather permitting between October and May.',
        'Vehicle & Taxi Rules: Goa taxi operations are union-managed; outside commercial cabs have designated drop and pickup spots at private resorts and airports.',
        'Environmental Rules: Consumption of alcohol on open public beaches and littering glass bottles is penalized by Goa Tourism Police.',
      ];

    case 'himachal_uttarakhand':
      return [
        'Rohtang Pass & Atal Tunnel: NGT green permits are mandatory for vehicles visiting Rohtang Pass. High-altitude mountain passes are subject to snow conditions.',
        'Mountain Driving & AC: Vehicle air conditioning is switched off while ascending steep Himalayan mountain inclines to ensure engine power.',
        'Trekking & Pilgrimage: Certified health certificates and biometric registration are mandatory for high-altitude pilgrimage routes (Chardham, Kedarnath, Hemkund Sahib).',
        'Carry warm clothing, thermals, and windcheaters from October to April.',
      ];

    case 'bhutan':
      return [
        'Sustainable Development Fee (SDF): Mandatory government daily SDF and licensed local Bhutanese tour guide are required throughout the tour.',
        'Entry Permits: Indian citizens require a valid Passport (min 6 months validity) or Original Voter ID card for Bhutan immigration clearance.',
        'Dress Code & Respect: Full-sleeve shirts/trousers with collars are mandatory for entering Dzongs, monasteries, and government administrative complexes.',
        'Tiger’s Nest Hike: Paro Taktsang involves a 4 to 6-hour uphill trek; pony hire is available up to the cafeteria for elderly guests.',
      ];

    default:
      return [
        'Identity Proofs: All guests (including children) must carry Original Valid Government Photo ID Cards (Aadhaar / Voter ID / Passport) during travel and hotel check-in.',
        'Hotel Check-in / Check-out: Standard hotel check-in is 12:00 PM - 02:00 PM and check-out is 10:00 AM - 11:00 AM. Early check-in is subject to room availability.',
        'Vehicle Operation Rules: Vehicles are provided strictly as per itinerary on point-to-point basis from 08:30 AM to 06:00 PM and not on disposal for personal night outings.',
        'Unforeseen Delays & Disruptions: Sightseeing disrupted due to natural force majeure, weather conditions, roadblocks, or flight delays will be adjusted with alternate plans where feasible.',
      ];
  }
}

/**
 * Destination-specific Terms & Conditions.
 */
export function getDestinationTermsAndConditions(destination?: string, title?: string): string[] {
  const cat = getDestinationCategory(destination, title);

  switch (cat) {
    case 'andaman':
      return [
        'Booking Confirmation: 30% advance deposit required at the time of confirmation to lock island resort inventory and book private catamaran cruise tickets (Makruzz / Nautika). Balance 70% must be cleared 7 days prior to arrival or upon arrival in Port Blair.',
        'Inter-Island Ferry Rules: Catamaran tickets (Port Blair - Havelock - Neil) are issued on a non-transferable basis with guest names and age as per government photo ID. Seat allocation is computer-generated by the ferry operator.',
        'Vehicle Operation Rules: Vehicles in Port Blair, Havelock, and Neil are provided strictly on a point-to-point basis as per itinerary from 08:30 AM to 06:00 PM. Local island union vehicles are not on disposal for personal night detours.',
        'Weather & Force Majeure Disruption: If inter-island ferries or water sports are cancelled due to squalls, cyclonic weather, or Indian Coast Guard directives, alternate arrangements in Port Blair will be provided where feasible. Ferry operators issue refunds or credit notes as per maritime rules.',
        'Permits & ID Proofs: All Indian travelers must carry Original Valid Voter ID Card / Passport / Driving Licence. Foreign nationals require a valid Indian Visa and must comply with current Ministry of Home Affairs island entry norms.',
        'Luggage Policy on Cruises: Standard baggage allowance on private catamaran ferries is 25 kg per passenger. Excess luggage is subject to ferry company baggage holds.',
      ];

    case 'north_sikkim':
      return [
        'Booking Confirmation: 30% advance deposit required at confirmation. Balance 70% must be cleared 7 days prior to arrival or upon arrival at Siliguri/Gangtok.',
        'Compulsory Meal Plan: As per North Sikkim Hotel & Transport Union regulations, all hotel stays in Lachen and Lachung include Compulsory All Meals (AP Plan - Breakfast, Lunch & Dinner).',
        'Vehicle Operation Rules: Dedicated private mountain vehicle (Innova Crysta / Scorpio / Xylo / Bolero) is provided strictly as per itinerary. Vehicle is not on disposal for personal night outings.',
        'Permits & ID Proofs: North Sikkim is a sensitive border sector. All guests must carry Original Valid Voter ID Card / Passport (Aadhaar/PAN card not valid for Army checkpoints) + 4 passport size photographs.',
        'High Altitude & Force Majeure: In case of landslides, heavy snowfall, military closures, or roadblocks at Gurudongmar or Yumthang, alternate sightseeing will be arranged where feasible. Hill administration does not issue cash refunds for force majeure occurrences.',
        'Acclimatization Advisory: Guests traveling to Lachen (9,000 ft) and Gurudongmar (17,800 ft) must stay hydrated and avoid strenuous exertion. Not recommended for infants under 4 years.',
      ];

    case 'sikkim':
    case 'darjeeling':
      return [
        'Booking Confirmation: 30% advance deposit required at confirmation. Balance 70% must be cleared 7 days prior to arrival or upon arrival at Siliguri/Gangtok.',
        'Vehicle Operation Rules (Reserved Cab): Dedicated private vehicle is provided strictly as per itinerary from 08:30 AM to 06:00 PM. Vehicle is not on disposal for personal night outings or out-of-itinerary detours.',
        'Vehicle Operation Rules (Sharing Cab): Sharing cab transfers operate on designated scheduled departure points (e.g. Vajra Stand / Deorali Stand). Passengers must adhere strictly to departure timings.',
        'Permits & ID Proofs: Sikkim border circuits (Tsomgo Lake, Baba Mandir & Nathula) require government tourism permits. All guests must carry Original Valid Voter ID Card / Passport + 4 passport size photographs.',
        'High Altitude & Weather Disruption: In case of landslides, heavy snowfall, military closures, or roadblocks at Nathula Pass or Tsomgo Lake, alternate sightseeing will be arranged where feasible.',
        'Acclimatization Advisory: Guests traveling to high-altitude lakes are advised to dress warmly and stay well-hydrated.',
      ];

    case 'meghalaya':
    case 'assam':
      return [
        'Booking Confirmation: 30% advance deposit required at the time of confirmation to secure hotel rooms and safari gypsy blocks. Balance 70% to be cleared 7 days prior to arrival.',
        'Vehicle Operation Rules: Dedicated private vehicle is provided as per itinerary from 08:30 AM to 06:00 PM. Night driving across highway ghats is restricted for passenger safety.',
        'Safari & Activity Bookings: Kaziranga jeep/elephant safari tickets and Dawki boating fees are non-refundable once scheduled by the respective forest department / river operators.',
        'Weather & Natural Closures: In case of heavy monsoon rains or river flooding, alternate scenic viewpoints or cultural sites will be arranged where feasible.',
        'ID Proofs: All guests must carry valid government photo IDs (Aadhaar / Voter ID / Passport) for hotel check-ins and Kaziranga forest entry.',
      ];

    case 'kashmir_ladakh':
      return [
        'Booking Confirmation: 30% advance deposit required at confirmation to block Leh/Srinagar hotels, houseboats, and inner line permits. Balance 70% must be cleared 10 days prior to arrival.',
        'Acclimatization Protocol: The first 24-48 hours in Leh must be reserved for complete rest. Sightseeing schedules are arranged strictly to facilitate high-altitude acclimatization.',
        'Local Union Vehicle Regulations: As per local taxi union regulations in Ladakh, Kashmir, Gulmarg, and Sonamarg, external commercial vehicles are restricted at specific points; internal sightseeing is operated by local union cabs.',
        'Mobile Networks: Only Indian Postpaid SIM cards (Jio, Airtel, BSNL) function in Jammu & Kashmir and Ladakh. Prepaid roaming is barred by government telecom order.',
        'Weather & Pass Closures: High-altitude passes (Khardung La, Chang La, Zoji La) are subject to sudden snow disruptions; routes will be adapted for safety without penalty.',
      ];

    case 'kerala':
      return [
        'Booking Confirmation: 30% advance deposit required at confirmation. Balance 70% must be cleared 7 days prior to arrival.',
        'Houseboat Rules: Traditional Alleppey houseboats operate from 12:30 PM to 05:30 PM and remain anchored overnight. Air conditioning in deluxe houseboats runs from 09:00 PM to 06:00 AM.',
        'Vehicle Operation: Dedicated air-conditioned private vehicle is provided for airport transfers and sightseeing as per itinerary.',
        'Temple Rules: Modest traditional attire is required for entering heritage temple premises.',
      ];

    case 'goa':
      return [
        'Booking Confirmation: 30% advance deposit required at confirmation. Balance 70% must be cleared 7 days prior to arrival.',
        'Vehicle Operation: Air-conditioned private cab is provided for North Goa and South Goa sightseeing tours as per scheduled timings.',
        'Beach & Water Sports: Water activities operate weather permitting. Safety instructions from certified lifeguards must be respected.',
      ];

    default:
      return [
        'Booking Confirmation: 30% advance deposit required at the time of confirmation. Balance 70% must be cleared 7 days prior to arrival or upon arrival as agreed.',
        'Vehicle Operation Rules: Dedicated private vehicle is provided strictly as per itinerary from 08:30 AM to 06:00 PM. Vehicle is not on disposal for personal night outings.',
        'Permits & ID Proofs: All guests must carry Original Valid Government Photo ID Cards (Aadhaar / Voter ID / Passport) + passport size photographs.',
        'Force Majeure Disruption: Unutilized services due to natural force majeure, roadblocks, airline delays, or administrative strikes are non-refundable as per sector rules; alternate options will be offered where feasible.',
      ];
  }
}

/**
 * Destination-specific Cancellation & Refund Policy.
 */
export function getDestinationCancellationPolicy(destination?: string, title?: string): string[] {
  const cat = getDestinationCategory(destination, title);

  if (cat === 'andaman') {
    return [
      '30 Days or More Prior to Arrival: 90% Refund (10% administrative & cruise cancellation fee retained).',
      '15 to 29 Days Prior to Arrival: 75% Refund (25% cancellation fee applicable).',
      '7 to 14 Days Prior to Arrival: 50% Refund (50% package advance retained towards locked island resort & cruise seats).',
      'Less than 7 Days / No-Show: 100% Non-Refundable (Strict island sector policy as inter-island ferry seats & rooms are non-refundable).',
      'Weather Disruption / Ferry Cancellation: If private catamarans are grounded due to cyclonic weather or Coast Guard directives, government ferry or refund/credit notes are issued as per maritime operator policy.',
      'Refund Turnaround: Approved refunds are processed back to the guest bank account within 5 to 7 working days.',
    ];
  }

  if (cat === 'north_sikkim' || cat === 'sikkim' || cat === 'darjeeling') {
    return [
      '30 Days or More Prior to Arrival: 90% Refund (10% administrative & permit processing fee retained).',
      '15 to 29 Days Prior to Arrival: 75% Refund (25% cancellation fee applicable).',
      '7 to 14 Days Prior to Arrival: 50% Refund (50% package advance retained towards hotel & vehicle blocks).',
      'Less than 7 Days / No-Show: 100% Non-Refundable (Strict hill sector policy as rooms & mountain cabs are fully locked).',
      'Natural Disasters / Roadblocks: If Nathula Pass, Tsomgo Lake, or North Sikkim is blocked due to heavy snowfall, landslides, or defense restrictions, alternate sightseeing is provided. Hill administration does not issue cash refunds for force majeure occurrences.',
      'Refund Turnaround: Approved refunds are processed back to the guest bank account within 5 to 7 working days.',
    ];
  }

  return [
    '30 Days or More Prior to Arrival: 90% Refund (10% administrative charge retained).',
    '15 to 29 Days Prior to Arrival: 75% Refund (25% cancellation charge applicable).',
    '7 to 14 Days Prior to Arrival: 50% Refund (50% package advance retained towards hotel & transport blocks).',
    'Less than 7 Days / No-Show: 100% Non-Refundable (Hotels and transport arrangements are fully non-refundable within 7 days).',
    'Force Majeure Occurrences: In the event of natural disasters, flight cancellations, or administrative closures, alternate arrangements are provided where possible.',
    'Refund Turnaround: Approved refunds are processed back to the guest bank account within 5 to 7 working days.',
  ];
}

/**
 * Quick-add note chips for the interactive notes editor in Itinerary Preview.
 */
export function getDestinationQuickAddNotes(
  destination?: string,
  title?: string
): { label: string; text: string }[] {
  const cat = getDestinationCategory(destination, title);

  switch (cat) {
    case 'andaman':
      return [
        {
          label: '+ Catamaran Cruise Timings',
          text: 'Inter-Island Catamaran Cruises: Private high-speed catamaran ferries (Makruzz / Nautika / Green Ocean) operate on fixed scheduled timings. Boarding gates close 45 minutes prior to sailing; carrying government photo ID is mandatory.',
        },
        {
          label: '+ Water Sports & Reef Protection',
          text: 'Water Sports & Coral Reef Guidelines: Scuba diving, Sea Walk, and Snorkeling require physical fitness and weather clearance. Touching, damaging, or collecting dead corals or sea shells is strictly punishable under Wildlife Protection laws.',
        },
        {
          label: '+ Plastic Ban & Marine Fine',
          text: 'Strict Environmental & Plastic Ban: Single-use plastic bottles, polythene carry bags, and littering are strictly prohibited throughout Andaman beaches and islands. Heavy spot fines are levied by the Andaman Administration.',
        },
        {
          label: '+ Jarawa Tribal Reserve Rules',
          text: 'Tribal Reserve Regulations: Photography, videography, or interaction with indigenous Jarawa and Sentinelese tribes along the ATR is strictly illegal under the PAT Regulation Act. Convoy regulations must be followed.',
        },
        {
          label: '+ Port Blair Airport Reporting',
          text: 'Airport Reporting: Due to strict naval air station operational rules at Veer Savarkar International Airport (Port Blair), reporting 2.5 hours prior to domestic flight departure is compulsory.',
        },
      ];

    case 'north_sikkim':
      return [
        {
          label: '+ North Sikkim: AP Meal Plan',
          text: 'North Sikkim Tour Regulation: Daily Breakfast, Lunch & Dinner (AP Plan) are strictly COMPULSORY for all nights in Lachen and Lachung as per regional tourism administration rules.',
        },
        {
          label: '+ High Altitude: Gurudongmar & Zero Point',
          text: 'High Altitude Acclimatization: Gurudongmar Lake (17,800 ft) and Zero Point (15,300 ft) require acclimatization. Stay hydrated, walk gently, and carry valid Voter ID / Passport for Army checkpoints.',
        },
        {
          label: '+ Nathula: Closed Monday Only',
          text: 'Nathula Pass (Indo-China Border) is closed ONLY on Mondays for tourists (open Tuesday through Sunday) and is subject to Indian Army permit availability (additional supplemental permit fee applicable).',
        },
        {
          label: '+ Winter Woollens & Gloves',
          text: 'Carry heavy woolens, thermal innerwear, windproof jackets, woollen caps, and waterproof gloves for North Sikkim throughout the year.',
        },
      ];

    case 'sikkim':
    case 'darjeeling':
      return [
        {
          label: '+ Nathula: Closed Monday Only',
          text: 'Nathula Pass (Indo-China Border) is closed ONLY on Mondays for tourists (open Tuesday through Sunday) and is subject to Indian Army permit availability (additional supplemental permit fee applicable).',
        },
        {
          label: '+ Voter ID / Passport Mandatory',
          text: 'Permits & ID Proofs: Sikkim border circuits (Tsomgo Lake, Baba Mandir & Nathula) require government tourism permits. All guests must carry Original Valid Voter ID Card / Passport + 4 passport size photographs.',
        },
        {
          label: '+ Mountain Vehicle AC Rules',
          text: 'Vehicle AC does not operate in hilly terrain to preserve engine cooling and mountain road safety.',
        },
        {
          label: '+ Tiger Hill Early Morning',
          text: 'Tiger Hill Sunrise: Early morning departure (approx 04:00 AM) is required to view dawn over Mt. Kanchenjunga; traffic permits are allocated by local authorities.',
        },
      ];

    case 'meghalaya':
      return [
        {
          label: '+ Rainwear & Grip Shoes',
          text: 'Rainwear & Footwear Advisory: Carry raincoats, compact umbrellas, and sturdy grip sports shoes for waterfall trails, living root bridges, and limestone caves.',
        },
        {
          label: '+ Dawki Umngot River Season',
          text: 'Dawki Umngot River Boating: Transparent crystal water visibility is optimal between October and April. Boating is subject to local river safety protocols and river water levels.',
        },
        {
          label: '+ Mawlynnong Clean Village Code',
          text: 'Mawlynnong Cleanliness Code: Mawlynnong is Asia’s cleanest village; smoking in public, using plastic carry bags, and littering are strictly prohibited by the village council.',
        },
      ];

    case 'kashmir_ladakh':
      return [
        {
          label: '+ 24-48hr Acclimatization Rest',
          text: 'High Altitude Acclimatization (Ladakh): Minimum 24 to 48 hours of complete rest is mandatory upon landing in Leh (11,500 ft) to prevent Acute Mountain Sickness (AMS). Stay hydrated and avoid exertion.',
        },
        {
          label: '+ Postpaid SIM Only (No Prepaid)',
          text: 'Mobile Connectivity: Prepaid SIM cards from other Indian states do NOT work in Jammu & Kashmir or Ladakh as per telecom security regulations. Only Indian POSTPAID SIM cards (Jio, Airtel, BSNL) function.',
        },
        {
          label: '+ Inner Line Permits (Pangong/Nubra)',
          text: 'Permits: Pangong Lake, Nubra Valley, and Khardung La require Protected Area Permits / Environmental Fees. Keep original photo IDs and multiple photocopies handy.',
        },
      ];

    default:
      return [
        {
          label: '+ Government Photo ID Proofs',
          text: 'Identity Proofs: All guests (including children) must carry Original Valid Government Photo ID Cards (Aadhaar / Voter ID / Passport) during travel and hotel check-in.',
        },
        {
          label: '+ Point-to-Point Cab Rules',
          text: 'Vehicle Operation Rules: Vehicles are provided strictly as per itinerary on point-to-point basis from 08:30 AM to 06:00 PM and not on disposal for personal night outings.',
        },
        {
          label: '+ Standard Hotel Check-in',
          text: 'Hotel Check-in / Check-out: Standard hotel check-in is 12:00 PM - 02:00 PM and check-out is 10:00 AM - 11:00 AM. Early check-in is subject to room availability.',
        },
      ];
  }
}
