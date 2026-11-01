export interface DestinationImage {
  id: string;
  destination: string;
  title: string;
  caption: string;
  category: 'cover' | 'sightseeing' | 'landscape' | 'culture';
  tags: string[];
  url: string;
}

export const DESTINATION_IMAGE_CATALOG: DestinationImage[] = [
  // --- SIKKIM ---
  {
    id: 'sikkim-cover-kanchenjunga',
    destination: 'Sikkim',
    title: 'Mount Kanchenjunga Majestic Panorama',
    caption: 'Majestic view of Mt. Kanchenjunga overlooking the emerald hills of Sikkim',
    category: 'cover',
    tags: ['sikkim', 'gangtok', 'kanchenjunga', 'mountains', 'himalayas', 'cover'],
    url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'sikkim-tsomgo-lake',
    destination: 'Sikkim',
    title: 'Tsomgo (Changu) Lake & Yaks',
    caption: 'Glacial Tsomgo Lake at 12,310 ft with decorated Himalayan Yaks',
    category: 'sightseeing',
    tags: ['sikkim', 'tsomgo', 'changu', 'lake', 'yak', 'snow', 'day2'],
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'sikkim-nathula-pass',
    destination: 'Sikkim',
    title: 'Nathula Pass & Baba Mandir',
    caption: 'Historic Indo-China Silk Route pass and the shrine of Baba Harbhajan Singh',
    category: 'sightseeing',
    tags: ['sikkim', 'nathula', 'baba mandir', 'silk route', 'snow', 'border'],
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'sikkim-mg-marg',
    destination: 'Sikkim',
    title: 'MG Marg Gangtok Town Promenade',
    caption: 'Lively pedestrian boulevard with Victorian lamps and Sikkimese cafes',
    category: 'sightseeing',
    tags: ['gangtok', 'sikkim', 'mg marg', 'market', 'town', 'evening'],
    url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'sikkim-rumtek-monastery',
    destination: 'Sikkim',
    title: 'Rumtek Dharma Chakra Centre',
    caption: 'Seat of the Kagyu lineage adorned with Tibetan murals and golden stupas',
    category: 'culture',
    tags: ['sikkim', 'rumtek', 'monastery', 'buddhism', 'temple', 'culture'],
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1000&q=80',
  },

  // --- NORTH SIKKIM ---
  {
    id: 'north-sikkim-yumthang',
    destination: 'North Sikkim',
    title: 'Yumthang Valley of Flowers',
    caption: 'Picturesque alpine valley with winding streams and snow-clad Himalayan peaks',
    category: 'cover',
    tags: ['north sikkim', 'lachung', 'yumthang', 'valley', 'snow', 'cover'],
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'north-sikkim-zero-point',
    destination: 'North Sikkim',
    title: 'Zero Point (Yumesamdong)',
    caption: 'Vast perennial snowfields at 15,300 ft where the civilian road terminates',
    category: 'sightseeing',
    tags: ['north sikkim', 'zero point', 'yumesamdong', 'snow', 'altitude'],
    url: 'https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'north-sikkim-gurudongmar',
    destination: 'North Sikkim',
    title: 'Sacred Gurudongmar Lake',
    caption: 'High-altitude holy lake at 17,800 ft mirroring the Tibetan Himalayan plateau',
    category: 'sightseeing',
    tags: ['north sikkim', 'lachen', 'gurudongmar', 'holy lake', 'himalayas'],
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'north-sikkim-lachung-village',
    destination: 'North Sikkim',
    title: 'Lachung Mountain Village Stay',
    caption: 'Traditional riverside hamlet nestled amidst pine-scented mountain ridges',
    category: 'landscape',
    tags: ['north sikkim', 'lachung', 'village', 'river', 'homestay'],
    url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1000&q=80',
  },

  // --- DARJEELING ---
  {
    id: 'darjeeling-cover-tea-gardens',
    destination: 'Darjeeling',
    title: 'Darjeeling Rolling Tea Estates & Toy Train',
    caption: 'World-renowned emerald tea gardens with the historic Himalayan Toy Train',
    category: 'cover',
    tags: ['darjeeling', 'tea garden', 'toy train', 'hills', 'cover'],
    url: 'https://images.unsplash.com/photo-1576085898323-218337e3e43c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'darjeeling-tiger-hill',
    destination: 'Darjeeling',
    title: 'Tiger Hill Golden Sunrise',
    caption: 'Witness the unforgettable first dawn rays illuminating Mt. Kanchenjunga & Mt. Everest',
    category: 'sightseeing',
    tags: ['darjeeling', 'tiger hill', 'sunrise', 'kanchenjunga', 'everest', 'view'],
    url: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'darjeeling-batasia-loop',
    destination: 'Darjeeling',
    title: 'Batasia Loop & War Memorial',
    caption: 'Famous spiral railway loop with landscaped gardens and 360-degree mountain views',
    category: 'sightseeing',
    tags: ['darjeeling', 'batasia', 'ghoom', 'toy train', 'memorial'],
    url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'darjeeling-mall-chowrasta',
    destination: 'Darjeeling',
    title: 'Chowrasta Mall Road',
    caption: 'Colonial heritage promenade with horseback riding, pine walks, and historic tearooms',
    category: 'sightseeing',
    tags: ['darjeeling', 'mall road', 'chowrasta', 'heritage', 'walk'],
    url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1000&q=80',
  },

  // --- SOUTH & WEST SIKKIM (PELLING / RAVANGLA) ---
  {
    id: 'sikkim-ravangla-buddha-park',
    destination: 'South Sikkim',
    title: 'Ravangla Buddha Park (Tathagata Tsal)',
    caption: 'Stunning 130-foot statue of Lord Buddha framed by the snow-covered peaks',
    category: 'cover',
    tags: ['ravangla', 'south sikkim', 'pelling', 'buddha park', 'statue', 'cover'],
    url: 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'sikkim-pelling-skywalk',
    destination: 'West Sikkim',
    title: 'Pelling Glass Skywalk & Chenrezig',
    caption: 'India’s first high-altitude glass skywalk facing the Mt. Kanchenjunga massif',
    category: 'sightseeing',
    tags: ['pelling', 'west sikkim', 'skywalk', 'chenrezig', 'mountains'],
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80',
  },

  // --- MEGHALAYA ---
  {
    id: 'meghalaya-cover-cherrapunji',
    destination: 'Meghalaya',
    title: 'Cherrapunji (Sohra) Cascades & Cloud Hills',
    caption: 'Dramatically lush canyon waterfalls of Cherrapunji in the Abode of the Clouds',
    category: 'cover',
    tags: ['meghalaya', 'cherrapunji', 'waterfall', 'clouds', 'sohra', 'cover'],
    url: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'meghalaya-root-bridge',
    destination: 'Meghalaya',
    title: 'Double Decker Living Root Bridge',
    caption: 'Bio-engineering marvel woven by Khasi indigenous tribes across jungle rivers',
    category: 'sightseeing',
    tags: ['meghalaya', 'nongriat', 'root bridge', 'trek', 'jungle', 'nature'],
    url: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'meghalaya-dawki-river',
    destination: 'Meghalaya',
    title: 'Dawki Umngot Crystal Glass River',
    caption: 'Crystal-clear transparent water where boats appear to float on pure air',
    category: 'sightseeing',
    tags: ['meghalaya', 'dawki', 'umngot', 'river', 'boating', 'crystal'],
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'meghalaya-krang-suri',
    destination: 'Meghalaya',
    title: 'Krang Suri Turquoise Falls',
    caption: 'Exquisite turquoise natural plunge pool surrounded by serene jungle rocks',
    category: 'sightseeing',
    tags: ['meghalaya', 'krang suri', 'waterfall', 'pool', 'nature'],
    url: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1000&q=80',
  },

  // --- ARUNACHAL PRADESH ---
  {
    id: 'arunachal-tawang-monastery',
    destination: 'Arunachal Pradesh',
    title: 'Tawang Monastery (Galden Namgey Lhatse)',
    caption: 'Second-largest monastery in the world perched amidst high Himalayan peaks',
    category: 'cover',
    tags: ['arunachal', 'tawang', 'monastery', 'himalayas', 'buddhism', 'cover'],
    url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'arunachal-sela-pass',
    destination: 'Arunachal Pradesh',
    title: 'Sela Pass & Frozen Sela Lake',
    caption: 'Dramatic mountain pass at 13,700 ft with pristine alpine frozen lakes',
    category: 'sightseeing',
    tags: ['arunachal', 'sela pass', 'lake', 'snow', 'high altitude'],
    url: 'https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'arunachal-madhuri-lake',
    destination: 'Arunachal Pradesh',
    title: 'Sangetsar (Madhuri) Lake',
    caption: 'Surreal earthquake-formed lake surrounded by snow ridges and dead pine trunks',
    category: 'sightseeing',
    tags: ['arunachal', 'madhuri lake', 'sangetsar', 'tawang', 'lake'],
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80',
  },

  // --- ASSAM ---
  {
    id: 'assam-kaziranga-safari',
    destination: 'Assam',
    title: 'Kaziranga National Park Rhinoceros Sanctuary',
    caption: 'Home of the magnificent Great Indian One-Horned Rhinoceros & wild elephant herds',
    category: 'cover',
    tags: ['assam', 'kaziranga', 'rhino', 'wildlife', 'safari', 'cover'],
    url: 'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'assam-brahmaputra-sunset',
    destination: 'Assam',
    title: 'Brahmaputra River Twilight Cruise',
    caption: 'Scenic evening boat cruise across the mighty Brahmaputra river with golden sunsets',
    category: 'sightseeing',
    tags: ['assam', 'brahmaputra', 'river', 'cruise', 'guwahati', 'sunset'],
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
  },

  // --- BHUTAN ---
  {
    id: 'bhutan-tigers-nest',
    destination: 'Bhutan',
    title: 'Paro Taktsang (Tiger’s Nest Monastery)',
    caption: 'Iconic clifftop Himalayan Buddhist sanctuary clinging to a 3,000 ft granite cliff',
    category: 'cover',
    tags: ['bhutan', 'paro', 'tigers nest', 'monastery', 'cliff', 'cover'],
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
  },

  // --- ANDAMAN & NICOBAR ISLANDS ---
  {
    id: 'andaman-radhanagar-beach',
    destination: 'Andaman',
    title: 'Radhanagar Beach (Havelock Island / Swaraj Dweep)',
    caption: 'Asia’s premier turquoise beach with pristine white sands and tropical rainforest canopy',
    category: 'cover',
    tags: ['andaman', 'havelock', 'swaraj dweep', 'radhanagar', 'beach', 'sunset', 'cover'],
    url: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'andaman-cellular-jail',
    destination: 'Andaman',
    title: 'Historic Cellular Jail National Memorial',
    caption: 'Colonial freedom struggle pilgrimage site and the moving Light & Sound evening show',
    category: 'culture',
    tags: ['andaman', 'port blair', 'cellular jail', 'memorial', 'history'],
    url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'andaman-elephant-beach',
    destination: 'Andaman',
    title: 'Elephant Beach Coral Reef & Water Sports',
    caption: 'Vibrant living coral reefs, sea walking, snorkelling, and glass-bottom boat safaris',
    category: 'sightseeing',
    tags: ['andaman', 'elephant beach', 'snorkeling', 'scuba', 'corals', 'water sports'],
    url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'andaman-neil-island',
    destination: 'Andaman',
    title: 'Neil Island (Shaheed Dweep) Natural Bridge & Bharatpur Beach',
    caption: 'Serene coral islands, famous Howrah Bridge natural rock formation, and calm lagoons',
    category: 'landscape',
    tags: ['andaman', 'neil island', 'shaheed dweep', 'bharatpur', 'natural bridge'],
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'andaman-ross-island',
    destination: 'Andaman',
    title: 'Ross Island (Netaji Subhash Chandra Bose Dweep)',
    caption: 'Fascinating British colonial ruins embraced by ancient banyan roots and deer groves',
    category: 'sightseeing',
    tags: ['andaman', 'ross island', 'port blair', 'ruins', 'heritage'],
    url: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1000&q=80',
  },

  // --- GENERAL NORTH EAST HIMALAYAS ---
  {
    id: 'northeast-himalayas-general',
    destination: 'General',
    title: 'North East Himalayan Serenity',
    caption: 'Enchanting misty valleys, tea estates, and snow peaks of North East India',
    category: 'cover',
    tags: ['general', 'northeast', 'himalayas', 'mountains', 'cover'],
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
  },
];

/**
 * Normalizes text for matching destinations & keywords
 */
function normalize(str: string): string {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Returns the default cover image for a given destination or tour title.
 */
export function getDefaultDestinationCover(destination?: string, title?: string): DestinationImage {
  const query = `${destination || ''} ${title || ''}`.toLowerCase();

  if (query.includes('andaman') || query.includes('port blair') || query.includes('havelock') || query.includes('neil') || query.includes('radhanagar')) {
    return DESTINATION_IMAGE_CATALOG.find((img) => img.id === 'andaman-radhanagar-beach')!;
  }
  if (query.includes('darjeeling')) {
    return DESTINATION_IMAGE_CATALOG.find((img) => img.id === 'darjeeling-cover-tea-gardens')!;
  }
  if (query.includes('north sikkim') || query.includes('lachung') || query.includes('yumthang') || query.includes('gurudongmar')) {
    return DESTINATION_IMAGE_CATALOG.find((img) => img.id === 'north-sikkim-yumthang')!;
  }
  if (query.includes('ravangla') || query.includes('pelling') || query.includes('namchi')) {
    return DESTINATION_IMAGE_CATALOG.find((img) => img.id === 'sikkim-ravangla-buddha-park')!;
  }
  if (query.includes('meghalaya') || query.includes('shillong') || query.includes('cherrapunji') || query.includes('dawki')) {
    return DESTINATION_IMAGE_CATALOG.find((img) => img.id === 'meghalaya-cover-cherrapunji')!;
  }
  if (query.includes('arunachal') || query.includes('tawang') || query.includes('sela')) {
    return DESTINATION_IMAGE_CATALOG.find((img) => img.id === 'arunachal-tawang-monastery')!;
  }
  if (query.includes('assam') || query.includes('kaziranga') || query.includes('guwahati')) {
    return DESTINATION_IMAGE_CATALOG.find((img) => img.id === 'assam-kaziranga-safari')!;
  }
  if (query.includes('bhutan') || query.includes('paro') || query.includes('thimphu')) {
    return DESTINATION_IMAGE_CATALOG.find((img) => img.id === 'bhutan-tigers-nest')!;
  }
  if (query.includes('sikkim') || query.includes('gangtok')) {
    return DESTINATION_IMAGE_CATALOG.find((img) => img.id === 'sikkim-cover-kanchenjunga')!;
  }

  // Default fallback
  return DESTINATION_IMAGE_CATALOG.find((img) => img.id === 'sikkim-cover-kanchenjunga') || DESTINATION_IMAGE_CATALOG[0];
}

/**
 * Returns a smart predefined default image for an itinerary day card.
 * Automatically analyzes day title, sightseeing highlights, night stay, and tour destination.
 */
export function getDefaultDayImage(
  destination: string | undefined,
  dayNumber: number,
  title?: string,
  nightStay?: string,
  highlights?: string[]
): DestinationImage {
  const combined = `${destination || ''} ${title || ''} ${nightStay || ''} ${(highlights || []).join(' ')}`.toLowerCase();

  // Keyword-based specific matches: Andaman
  if (combined.includes('radhanagar') || combined.includes('havelock beach')) {
    return DESTINATION_IMAGE_CATALOG.find((img) => img.id === 'andaman-radhanagar-beach')!;
  }
  if (combined.includes('cellular jail') || combined.includes('light and sound') || combined.includes('memorial')) {
    return DESTINATION_IMAGE_CATALOG.find((img) => img.id === 'andaman-cellular-jail')!;
  }
  if (combined.includes('elephant beach') || combined.includes('scuba') || combined.includes('snorkeling') || combined.includes('sea walk')) {
    return DESTINATION_IMAGE_CATALOG.find((img) => img.id === 'andaman-elephant-beach')!;
  }
  if (combined.includes('neil island') || combined.includes('shaheed dweep') || combined.includes('bharatpur') || combined.includes('natural bridge')) {
    return DESTINATION_IMAGE_CATALOG.find((img) => img.id === 'andaman-neil-island')!;
  }
  if (combined.includes('ross island') || combined.includes('subhash chandra bose') || combined.includes('viper')) {
    return DESTINATION_IMAGE_CATALOG.find((img) => img.id === 'andaman-ross-island')!;
  }

  // Keyword-based specific matches: Sikkim & North East
  if (combined.includes('tsomgo') || combined.includes('changu') || combined.includes('yak')) {
    return DESTINATION_IMAGE_CATALOG.find((img) => img.id === 'sikkim-tsomgo-lake')!;
  }
  if (combined.includes('nathula') || combined.includes('baba mandir') || combined.includes('silk route')) {
    return DESTINATION_IMAGE_CATALOG.find((img) => img.id === 'sikkim-nathula-pass')!;
  }
  if (combined.includes('zero point') || combined.includes('yumesamdong')) {
    return DESTINATION_IMAGE_CATALOG.find((img) => img.id === 'north-sikkim-zero-point')!;
  }
  if (combined.includes('gurudongmar') || combined.includes('chopta')) {
    return DESTINATION_IMAGE_CATALOG.find((img) => img.id === 'north-sikkim-gurudongmar')!;
  }
  if (combined.includes('yumthang') || combined.includes('valley of flower')) {
    return DESTINATION_IMAGE_CATALOG.find((img) => img.id === 'north-sikkim-yumthang')!;
  }
  if (combined.includes('lachung') || combined.includes('lachen')) {
    return DESTINATION_IMAGE_CATALOG.find((img) => img.id === 'north-sikkim-lachung-village')!;
  }
  if (combined.includes('tiger hill') || combined.includes('sunrise')) {
    return DESTINATION_IMAGE_CATALOG.find((img) => img.id === 'darjeeling-tiger-hill')!;
  }
  if (combined.includes('batasia') || combined.includes('ghoom') || combined.includes('toy train')) {
    return DESTINATION_IMAGE_CATALOG.find((img) => img.id === 'darjeeling-batasia-loop')!;
  }
  if (combined.includes('tea estate') || combined.includes('tea garden')) {
    return DESTINATION_IMAGE_CATALOG.find((img) => img.id === 'darjeeling-cover-tea-gardens')!;
  }
  if (combined.includes('mall') || combined.includes('chowrasta') || combined.includes('mg marg')) {
    return DESTINATION_IMAGE_CATALOG.find((img) => img.id === 'sikkim-mg-marg')!;
  }
  if (combined.includes('root bridge') || combined.includes('nongriat')) {
    return DESTINATION_IMAGE_CATALOG.find((img) => img.id === 'meghalaya-root-bridge')!;
  }
  if (combined.includes('dawki') || combined.includes('umngot')) {
    return DESTINATION_IMAGE_CATALOG.find((img) => img.id === 'meghalaya-dawki-river')!;
  }
  if (combined.includes('krang suri') || combined.includes('nohkalikai')) {
    return DESTINATION_IMAGE_CATALOG.find((img) => img.id === 'meghalaya-cover-cherrapunji')!;
  }
  if (combined.includes('tawang') || combined.includes('monastery')) {
    return DESTINATION_IMAGE_CATALOG.find((img) => img.id === 'arunachal-tawang-monastery')!;
  }
  if (combined.includes('sela')) {
    return DESTINATION_IMAGE_CATALOG.find((img) => img.id === 'arunachal-sela-pass')!;
  }
  if (combined.includes('kaziranga') || combined.includes('safari') || combined.includes('rhino')) {
    return DESTINATION_IMAGE_CATALOG.find((img) => img.id === 'assam-kaziranga-safari')!;
  }
  if (combined.includes('brahmaputra') || combined.includes('guwahati')) {
    return DESTINATION_IMAGE_CATALOG.find((img) => img.id === 'assam-brahmaputra-sunset')!;
  }
  if (combined.includes('buddha park') || combined.includes('ravangla')) {
    return DESTINATION_IMAGE_CATALOG.find((img) => img.id === 'sikkim-ravangla-buddha-park')!;
  }
  if (combined.includes('pelling') || combined.includes('skywalk')) {
    return DESTINATION_IMAGE_CATALOG.find((img) => img.id === 'sikkim-pelling-skywalk')!;
  }
  if (combined.includes('rumtek') || combined.includes('monastery') || combined.includes('gompa')) {
    return DESTINATION_IMAGE_CATALOG.find((img) => img.id === 'sikkim-rumtek-monastery')!;
  }

  // Fallback by destination & day sequence rotation
  const destMatches = DESTINATION_IMAGE_CATALOG.filter((item) =>
    (destination || '').toLowerCase().includes(item.destination.toLowerCase())
  );

  if (destMatches.length > 0) {
    const idx = (dayNumber - 1) % destMatches.length;
    return destMatches[idx];
  }

  // General rotation
  const allSightseeing = DESTINATION_IMAGE_CATALOG.filter((i) => i.category !== 'cover');
  return allSightseeing[(dayNumber - 1) % allSightseeing.length];
}

/**
 * Returns all available images suitable for a specific destination or region,
 * prioritizing user uploaded / saved custom images first.
 */
export function getImagesForDestination(destination?: string): DestinationImage[] {
  const customImages = getSavedCustomImages();
  if (!destination) {
    return [...customImages, ...DESTINATION_IMAGE_CATALOG];
  }
  const d = destination.toLowerCase();
  const matchedCustom = customImages.filter(
    (img) => d.includes(img.destination.toLowerCase()) || img.destination.toLowerCase().includes(d) || img.destination === 'Custom Uploads'
  );
  const matchedCatalog = DESTINATION_IMAGE_CATALOG.filter(
    (img) => d.includes(img.destination.toLowerCase()) || img.destination.toLowerCase().includes(d)
  );

  const combined = [...matchedCustom, ...matchedCatalog];
  return combined.length > 0 ? combined : [...customImages, ...DESTINATION_IMAGE_CATALOG];
}

// -------------------------------------------------------------
// PERSISTENT CUSTOM UPLOADED IMAGES REPOSITORY (LOCALSTORAGE)
// -------------------------------------------------------------
const CUSTOM_IMAGES_STORAGE_KEY = 'saved_custom_destination_images';

/**
 * Retrieves all previously uploaded and saved custom destination images from localStorage.
 */
export function getSavedCustomImages(): DestinationImage[] {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(CUSTOM_IMAGES_STORAGE_KEY) : null;
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to parse saved custom images:', e);
    return [];
  }
}

/**
 * Saves an uploaded image into persistent custom destination images storage for future use across all itineraries.
 */
export function saveCustomDestinationImage(image: {
  url: string;
  caption?: string;
  destination?: string;
  title?: string;
  category?: 'cover' | 'sightseeing' | 'landscape' | 'culture';
}): DestinationImage {
  try {
    const cleanUrl = (image.url || '').trim();
    if (!cleanUrl) throw new Error('Invalid image url');

    const existing = getSavedCustomImages();
    const foundIdx = existing.findIndex((item) => item.url === cleanUrl);

    if (foundIdx >= 0) {
      const updatedItem: DestinationImage = {
        ...existing[foundIdx],
        caption: image.caption || existing[foundIdx].caption,
        title: image.title || existing[foundIdx].title,
        destination: image.destination || existing[foundIdx].destination,
      };
      existing.splice(foundIdx, 1);
      existing.unshift(updatedItem);
      if (typeof window !== 'undefined') {
        localStorage.setItem(CUSTOM_IMAGES_STORAGE_KEY, JSON.stringify(existing.slice(0, 80)));
        window.dispatchEvent(new CustomEvent('custom-images-updated', { detail: updatedItem }));
      }
      return updatedItem;
    }

    const newItem: DestinationImage = {
      id: `custom-img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      destination: image.destination || 'Custom Uploads',
      title: image.title || image.caption || 'Custom Uploaded Photo',
      caption: image.caption || image.title || 'Custom Destination Photo',
      category: image.category || 'sightseeing',
      tags: [
        'custom',
        'uploaded',
        (image.destination || '').toLowerCase(),
        (image.title || '').toLowerCase(),
      ].filter(Boolean),
      url: cleanUrl,
    };

    const updatedList = [newItem, ...existing].slice(0, 80);
    if (typeof window !== 'undefined') {
      localStorage.setItem(CUSTOM_IMAGES_STORAGE_KEY, JSON.stringify(updatedList));
      window.dispatchEvent(new CustomEvent('custom-images-updated', { detail: newItem }));
    }
    return newItem;
  } catch (e) {
    console.error('Failed to save custom image:', e);
    return {
      id: `fallback-${Date.now()}`,
      destination: image.destination || 'Custom Uploads',
      title: image.title || 'Custom Photo',
      caption: image.caption || 'Custom Photo',
      category: 'sightseeing',
      tags: ['custom'],
      url: image.url,
    };
  }
}

/**
 * Deletes a saved custom image from persistent storage.
 */
export function deleteSavedCustomImage(id: string): void {
  try {
    const existing = getSavedCustomImages();
    const filtered = existing.filter((item) => item.id !== id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(CUSTOM_IMAGES_STORAGE_KEY, JSON.stringify(filtered));
      window.dispatchEvent(new CustomEvent('custom-images-updated'));
    }
  } catch (e) {
    console.error('Failed to delete custom image:', e);
  }
}

// -------------------------------------------------------------
// NORTH SIKKIM COMPULSORY MEALS HELPERS
// (All Meals: Breakfast, Lunch, and Dinner / AP Plan is mandatory)
// -------------------------------------------------------------
export const NORTH_SIKKIM_COMPULSORY_MEAL_PLAN = 'AP (All Meals - Breakfast, Lunch, Dinner)';
export const NORTH_SIKKIM_DAY_MEAL_PLAN = 'All Meals Included (Breakfast, Lunch & Dinner)';

export function isNorthSikkimLocation(...texts: (string | undefined | null)[]): boolean {
  return texts.some((text) => {
    if (!text || typeof text !== 'string') return false;
    const lower = text.toLowerCase();
    return (
      lower.includes('north sikkim') ||
      lower.includes('lachen') ||
      lower.includes('lachung') ||
      lower.includes('gurudongmar') ||
      lower.includes('yumthang') ||
      lower.includes('zero point') ||
      lower.includes('yumesamdong') ||
      lower.includes('katao') ||
      lower.includes('chopta') ||
      lower.includes('chungthang') ||
      lower.includes('mangan') ||
      lower.includes('thangu')
    );
  });
}

export function isNorthSikkimTour(
  itineraryOrDestination?: { destination?: string; title?: string; days?: Array<{ nightStay?: string; title?: string; description?: string; sightseeingHighlights?: string[] }> } | string,
  secondArgTitle?: string
): boolean {
  if (!itineraryOrDestination && !secondArgTitle) return false;
  if (typeof itineraryOrDestination === 'string') {
    return isNorthSikkimLocation(itineraryOrDestination, secondArgTitle);
  }
  if (itineraryOrDestination) {
    if (isNorthSikkimLocation(itineraryOrDestination.destination)) return true;
    if (isNorthSikkimLocation(itineraryOrDestination.title)) return true;
    if (secondArgTitle && isNorthSikkimLocation(secondArgTitle)) return true;
    if (itineraryOrDestination.days && itineraryOrDestination.days.some((d) =>
      isNorthSikkimLocation(d.nightStay, d.title, d.description) ||
      (d.sightseeingHighlights && d.sightseeingHighlights.some((h) => isNorthSikkimLocation(h)))
    )) {
      return true;
    }
  }
  return false;
}

