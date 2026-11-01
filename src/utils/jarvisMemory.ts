/**
 * J.A.R.V.I.S. Cognitive Cortex & Autonomous Memory Engine
 * 
 * Provides continuous persistent learning across all sessions.
 * Learns travel preferences, agency policies, favorite vehicles, pacing,
 * and client nuances with every task and interaction.
 */

export interface JarvisMemoryItem {
  id: string;
  category: 'rule' | 'preference' | 'destination' | 'pricing' | 'client_profile' | 'system_directive';
  fact: string;
  confidence: number; // 0 to 1
  timesReinforced: number;
  createdAt: string;
  updatedAt: string;
  source: 'core_directive' | 'learned_from_task' | 'user_instructed';
}

export interface RecentItineraryBlueprint {
  quoteNumber: string;
  guestName: string;
  destination: string;
  durationDays: number;
  totalCost: number;
  timestamp: string;
}

export interface JarvisMemoryBank {
  version: number;
  systemIdentity: string;
  primaryMission: string;
  totalItinerariesCreated: number;
  totalTasksExecuted: number;
  lastUpdated: string;
  insights: JarvisMemoryItem[];
  recentBlueprints: RecentItineraryBlueprint[];
}

const STORAGE_KEY = 'jarvis_cognitive_cortex_v1';

export const INITIAL_JARVIS_MEMORY_ITEMS: JarvisMemoryItem[] = [
  {
    id: 'core-identity-01',
    category: 'system_directive',
    fact: 'I was created with one singular, dedicated mission: to be the elite, lightning-fast Travel Architect who builds complete, flawless day-by-day travel itineraries and quotations.',
    confidence: 1.0,
    timesReinforced: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: 'core_directive',
  },
  {
    id: 'core-speed-02',
    category: 'system_directive',
    fact: 'Work at maximum speed and efficiency. Immediately synthesize complete itineraries upon receiving destination or guest parameters without redundant back-and-forth.',
    confidence: 1.0,
    timesReinforced: 8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: 'core_directive',
  },
  {
    id: 'core-rule-sikkim-01',
    category: 'rule',
    fact: 'Sikkim Nathula Pass (Indo-China Border) is strictly CLOSED ONLY ON MONDAYS for tourists; permits require original Voter ID or Passport with 2 passport photographs.',
    confidence: 1.0,
    timesReinforced: 9,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: 'core_directive',
  },
  {
    id: 'core-rule-north-sikkim-02',
    category: 'rule',
    fact: 'North Sikkim (Lachen, Lachung, Yumthang Valley, Zero Point, Gurudongmar) compulsorily mandates the AP Meal Plan (Breakfast, Lunch & Dinner included) as per regional hotel regulations.',
    confidence: 1.0,
    timesReinforced: 12,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: 'core_directive',
  },
  {
    id: 'core-rule-andaman-03',
    category: 'rule',
    fact: 'Andaman inter-island transit operates via private high-speed catamarans (Makruzz, Nautika, Green Ocean). Single-use plastics are banned with spot fines up to INR 5,000; touching living coral reefs is penalized under the Wildlife Protection Act.',
    confidence: 1.0,
    timesReinforced: 7,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: 'core_directive',
  },
  {
    id: 'core-pref-cabs-04',
    category: 'preference',
    fact: 'Agency fixed cab fleet: Reserved Cab Option A uses Innova/Xylo, Dedicated Tata Sumo, or Tempo Traveller; Sharing Cab Option B strictly uses Tata Sumo / Bolero.',
    confidence: 0.95,
    timesReinforced: 6,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: 'core_directive',
  },
  {
    id: 'core-pref-hotels-05',
    category: 'preference',
    fact: 'Default accommodation tier to 3-Star Deluxe with Mountain/Valley/Sea View and MAP (Daily Breakfast & Dinner) meal plan for non-North Sikkim nights.',
    confidence: 0.9,
    timesReinforced: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: 'core_directive',
  },
];

export function getJarvisMemory(): JarvisMemoryBank {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial: JarvisMemoryBank = {
        version: 1,
        systemIdentity: 'J.A.R.V.I.S. Senior AI Travel Architect & Itinerary Builder',
        primaryMission: 'Build world-class travel itineraries with lightning-fast execution and proactive learning',
        totalItinerariesCreated: 0,
        totalTasksExecuted: 0,
        lastUpdated: new Date().toISOString(),
        insights: INITIAL_JARVIS_MEMORY_ITEMS,
        recentBlueprints: [],
      };
      saveJarvisMemory(initial);
      return initial;
    }

    const parsed: JarvisMemoryBank = JSON.parse(raw);
    // Ensure essential core items exist
    if (!parsed.insights || parsed.insights.length === 0) {
      parsed.insights = INITIAL_JARVIS_MEMORY_ITEMS;
      saveJarvisMemory(parsed);
    }
    return parsed;
  } catch (err) {
    console.warn('[JarvisMemory] Failed to load memory, resetting to defaults:', err);
    return {
      version: 1,
      systemIdentity: 'J.A.R.V.I.S. Senior AI Travel Architect',
      primaryMission: 'Autonomous Itinerary Building',
      totalItinerariesCreated: 0,
      totalTasksExecuted: 0,
      lastUpdated: new Date().toISOString(),
      insights: INITIAL_JARVIS_MEMORY_ITEMS,
      recentBlueprints: [],
    };
  }
}

export function saveJarvisMemory(memory: JarvisMemoryBank): void {
  try {
    memory.lastUpdated = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  } catch (err) {
    console.error('[JarvisMemory] Error persisting memory:', err);
  }
}

/**
 * Autonomous Learning: Analyzes conversation input, AI replies, and generated tour data
 * to extract actionable insights, preferences, and agency rules.
 */
export function learnFromExchange(
  userInput: string,
  replyText: string,
  itineraryData?: any
): string[] {
  const memory = getJarvisMemory();
  memory.totalTasksExecuted += 1;
  const newInsightsAdded: string[] = [];

  const lowerInput = userInput.toLowerCase();

  // Pattern 1: User explicitly commands to remember or always do something
  const alwaysMatches = userInput.match(/(?:always|never|remember to|make sure to|preference is|our clients prefer)\s+([^.!?\n]+)/gi);
  if (alwaysMatches) {
    for (const match of alwaysMatches) {
      const cleaned = match.trim();
      if (cleaned.length > 8 && cleaned.length < 160) {
        const fact = `User Instruction: ${cleaned}`;
        const added = addOrReinforceFact(memory, 'user_instructed', 'rule', fact);
        if (added) newInsightsAdded.push(fact);
      }
    }
  }

  // Pattern 2: Client or group preference detection
  if (lowerInput.includes('vegetarian') || lowerInput.includes('pure veg') || lowerInput.includes('jain meal')) {
    const fact = 'Client group dietary preference: Pure Vegetarian / Jain meals required.';
    const added = addOrReinforceFact(memory, 'learned_from_task', 'client_profile', fact);
    if (added) newInsightsAdded.push(fact);
  }

  if (lowerInput.includes('honeymoon') || lowerInput.includes('couple') || lowerInput.includes('candle light')) {
    const fact = 'Romantic / Honeymoon package nuances: Include flower bed decoration, candle light dinner, and scenic privacy.';
    const added = addOrReinforceFact(memory, 'learned_from_task', 'preference', fact);
    if (added) newInsightsAdded.push(fact);
  }

  if (lowerInput.includes('luxury') || lowerInput.includes('5 star') || lowerInput.includes('boutique') || lowerInput.includes('4 star')) {
    const fact = 'Premium Tour Preference: User values 4-Star / 5-Star Boutique mountain properties and private SUVs.';
    const added = addOrReinforceFact(memory, 'learned_from_task', 'preference', fact);
    if (added) newInsightsAdded.push(fact);
  }

  if (lowerInput.includes('budget') || lowerInput.includes('sharing cab') || lowerInput.includes('cheap')) {
    const fact = 'Budget Sensitivity: Always provide economical Sharing Cab options and competitive 2-3 star hotel rates.';
    const added = addOrReinforceFact(memory, 'learned_from_task', 'pricing', fact);
    if (added) newInsightsAdded.push(fact);
  }

  // Pattern 3: Itinerary generation blueprint recording
  if (itineraryData && itineraryData.destination) {
    memory.totalItinerariesCreated += 1;
    const dest = itineraryData.destination;
    const days = itineraryData.durationDays || itineraryData.days?.length || 5;
    const guest = itineraryData.guestName || 'Valued Guest';

    const blueprint: RecentItineraryBlueprint = {
      quoteNumber: itineraryData.quoteNumber || `NED-${Date.now().toString().slice(-4)}`,
      guestName: guest,
      destination: dest,
      durationDays: days,
      totalCost: itineraryData.sellingCost || 0,
      timestamp: new Date().toISOString(),
    };

    memory.recentBlueprints = [blueprint, ...memory.recentBlueprints.slice(0, 9)];

    const fact = `Crafted ${days}D/${Math.max(1, days - 1)}N ${dest} itinerary for ${guest} with customized day plans.`;
    addOrReinforceFact(memory, 'learned_from_task', 'destination', fact);
    newInsightsAdded.push(fact);
  }

  saveJarvisMemory(memory);
  return newInsightsAdded;
}

/**
 * Adds a new insight or reinforces an existing one if closely matching
 */
function addOrReinforceFact(
  memory: JarvisMemoryBank,
  source: JarvisMemoryItem['source'],
  category: JarvisMemoryItem['category'],
  fact: string
): boolean {
  const normFact = fact.toLowerCase().replace(/[^a-z0-9]/g, '');
  const existing = memory.insights.find(
    (item) => item.fact.toLowerCase().replace(/[^a-z0-9]/g, '').includes(normFact) ||
              normFact.includes(item.fact.toLowerCase().replace(/[^a-z0-9]/g, ''))
  );

  if (existing) {
    existing.timesReinforced += 1;
    existing.confidence = Math.min(1.0, existing.confidence + 0.05);
    existing.updatedAt = new Date().toISOString();
    return false;
  }

  memory.insights.push({
    id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    category,
    fact,
    confidence: 0.85,
    timesReinforced: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source,
  });
  return true;
}

/**
 * Formats the active memory into a crisp, powerful injection prompt
 * for Gemini to use during fast itinerary generation
 */
export function getFormattedMemoryPrompt(): string {
  const memory = getJarvisMemory();
  const topInsights = [...memory.insights]
    .sort((a, b) => b.timesReinforced * b.confidence - a.timesReinforced * a.confidence)
    .slice(0, 16);

  const factsList = topInsights.map((item, idx) => `${idx + 1}. [${item.category.toUpperCase()}] ${item.fact}`).join('\n');

  return `[JARVIS CONTINUOUS LEARNED MEMORY & CORE PURPOSE]:
YOU ARE DEDICATED SOLELY TO BEING THE USER'S EXPERT TRAVEL ARCHITECT & ITINERARY BUILDER.
YOUR CORE FUNCTION IS TO BUILD COMPLETE, FLAWLESS DAY-BY-DAY ITINERARIES AT LIGHTNING SPEED.
Total Itineraries Designed So Far: ${memory.totalItinerariesCreated}
Learned Agency Rules & User Preferences from Past Tasks:
${factsList}

EXECUTE TASKS WITH UNRIVALED SPEED, REFINED BRITISH WIT, AND REGIONAL PERFECTION.`;
}

export function recordCreatedItinerary(itinerary: any): void {
  learnFromExchange('Created Itinerary', 'Itinerary Created', itinerary);
}

export function addManualInsight(category: JarvisMemoryItem['category'], fact: string): void {
  const memory = getJarvisMemory();
  addOrReinforceFact(memory, 'user_instructed', category, fact);
  saveJarvisMemory(memory);
}

export function removeMemoryItem(id: string): void {
  const memory = getJarvisMemory();
  memory.insights = memory.insights.filter((item) => item.id !== id);
  saveJarvisMemory(memory);
}

export function resetJarvisMemory(): JarvisMemoryBank {
  const resetMemory: JarvisMemoryBank = {
    version: 1,
    systemIdentity: 'J.A.R.V.I.S. Senior AI Travel Architect & Itinerary Builder',
    primaryMission: 'Build world-class travel itineraries with lightning-fast execution and proactive learning',
    totalItinerariesCreated: 0,
    totalTasksExecuted: 0,
    lastUpdated: new Date().toISOString(),
    insights: INITIAL_JARVIS_MEMORY_ITEMS,
    recentBlueprints: [],
  };
  saveJarvisMemory(resetMemory);
  return resetMemory;
}
