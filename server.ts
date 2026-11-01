import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, Modality, LiveServerMessage } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseDestinationFromText } from './src/utils/destinationParser';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI server-side with User-Agent
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Resilient generation with automatic model fallback
 * If preferred model encounters temporary high demand (503/429) or latency, seamlessly tries fallback
 */
async function generateWithGeminiFallback(
  aiClient: GoogleGenAI,
  preferredModel: string,
  config: any,
  contents: any
) {
  const modelsToTry = preferredModel === 'gemini-3.8-flash'
    ? ['gemini-3.8-flash', 'gemini-3.1-flash-lite']
    : ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];

  let lastError: any = null;
  for (const mdl of modelsToTry) {
    try {
      const response = await aiClient.models.generateContent({
        model: mdl,
        contents,
        config,
      });
      if (response && response.text) {
        return { response, usedModel: mdl };
      }
    } catch (err: any) {
      console.warn(`[Gemini Fallback] Model ${mdl} failed:`, err?.message || err);
      lastError = err;
    }
  }
  throw lastError || new Error('All Gemini model calls failed');
}

// Endpoint: AI-assisted Itinerary Text Parser
app.post('/api/parse-itinerary', async (req, res) => {
  try {
    const { rawText } = req.body;
    if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
      return res.status(400).json({ error: 'rawText string is required' });
    }

    if (!ai || !process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'Gemini API is not configured on the server, using local parser.',
      });
    }

    const systemPrompt = `You are an expert travel quotation specialist for North East Destinations (https://northeastdestinations.in/), a DMC for Sikkim, Darjeeling, Meghalaya, Assam, and Arunachal.
Given an unstructured or raw travel itinerary text (from email, WhatsApp message, PDF copy, or agency note), extract and structure ALL available information into a clean JSON object.

CRITICAL AGENCY FLEET & REGIONAL RULES:
1. Pricing Modes:
   - "reserved" (if only private/reserved cab is quoted)
   - "sharing" (if only sharing cab is quoted)
   - "both" (if both reserved and sharing rates are provided, or dual rate comparison requested)
2. Agency's FIXED Cab Fleet:
   - In Reserved Cab: MUST map vehicleType to one of our fixed fleet options:
     * "Innova / Xylo" (for Innova, Innova Crysta, Xylo, Scorpio, 4-6 pax)
     * "Tata Sumo (Reserved Dedicated)" (for private dedicated Sumo, 6-8 pax)
     * "Tempo Traveller" (for 9-26 pax group coach)
     * "Small Cab (Swift / WagonR)" (for Swift, Dzire, WagonR, Alto, 1-4 pax)
   - In Sharing Cab: vehicleType is STRICTLY FIXED to:
     * "Tata Sumo / Mahindra Bolero" (shared taxi transit)
3. NORTH SIKKIM COMPULSORY ALL MEALS RULE:
   - If the tour touches North Sikkim (Lachen, Lachung, Gurudongmar, Yumthang, Zero Point), mealPlan MUST be set to "AP (All Meals - Breakfast, Lunch, Dinner)" or "AP (Compulsory All Meals: Breakfast, Lunch & Dinner - North Sikkim Regulation)".
   - Inclusions MUST include: "Compulsory All Meals in North Sikkim (Daily Breakfast, Lunch & Dinner as per regional hotel regulation)".
4. NATHULA PASS RULE:
   - Nathula Pass permit is strictly CLOSED ONLY ON MONDAYS. It is open Tuesday through Sunday.

EXTRACT EVERY DETAIL FOUND IN THE TEXT:
1. guestName (e.g. "Mr. Sandeep Mukherjee", "Rahul Verma")
2. guestPhone (e.g. "+91 98310 99421")
3. guestEmail (if present)
4. guestCity (origin city, e.g. "Kolkata", "Mumbai", "Delhi")
5. title (e.g. "Enchanting Sikkim & Darjeeling Holiday", "Mystical Meghalaya Tour")
6. destination (e.g. "Sikkim", "Darjeeling", "Meghalaya", "North Sikkim", "Assam & Kaziranga", "Arunachal Pradesh")
7. adults (number, default 2 if not mentioned)
8. children (number, default 0)
9. infants (number, default 0)
10. travelStartDate & travelEndDate (in YYYY-MM-DD format if dates are mentioned, otherwise empty string "")
11. durationDays & durationNights (numbers, e.g. 5 days, 4 nights)
12. pickupLocation & dropLocation (e.g. "Bagdogra Airport (IXB) / NJP Station", "Guwahati Airport (GAU)", "Shillong")
13. hotelCategory (e.g. "Deluxe Category (3-Star Mountain View)", "Super Deluxe Category (4-Star Premium)", "Luxury Heritage / Boutique Resorts", "Standard Budget Clean Hotels")
14. mealPlan (e.g. "MAP (Daily Breakfast & Dinner)", "CP (Daily Breakfast Only)", "AP (All Meals - Breakfast, Lunch, Dinner)", "EP (Room Only)")
15. pricingMode ("reserved", "sharing", or "both")
16. sellingCost (number, total price for reserved cab or main package)
17. sellingCostSharing (number, total price for sharing option if quoted)
18. reservedCab: {
      pricePerPerson: number,
      totalPackagePrice: number,
      vehicleType: "Innova / Xylo" | "Tata Sumo (Reserved Dedicated)" | "Tempo Traveller" | "Small Cab (Swift / WagonR)",
      name: "Option A: Reserved Cab Facility"
    }
19. sharingCab: {
      pricePerPerson: number,
      totalPackagePrice: number,
      vehicleType: "Tata Sumo / Mahindra Bolero",
      name: "Option B: Sharing Cab Facility"
    }
20. days: array of day objects:
    - dayNumber (number, 1, 2, 3...)
    - title (string, e.g. "NJP/IXB to Gangtok - Teesta Valley Drive")
    - description (detailed narrative of sights, route, driving time, activities)
    - sightseeingHighlights (array of strings, e.g. ["Tsomgo Lake", "Baba Mandir", "MG Marg"])
    - nightStay (town name, e.g. "Gangtok", "Pelling", "Darjeeling", "Shillong", "Cherrapunji", "Lachen", "Lachung", "Departure")
    - hotelName (specific hotel name if mentioned, otherwise "")
    - mealPlan (e.g. "Breakfast & Dinner", "CP Plan", "All Meals Included (Breakfast, Lunch & Dinner)")
    - transportDetails (e.g. "Dedicated Innova Crysta", "Shared Sumo Stand Transfer")
21. commonInclusions: array of strings extracted from any "Inclusions" section in the text
22. commonExclusions: array of strings extracted from any "Exclusions" section in the text
23. detectedFields: array of short strings describing what was successfully found in the text
24. missingFields: array of short strings describing what was NOT found in the text and needs manual input

Return ONLY valid JSON matching this structure.`;

    const { response } = await generateWithGeminiFallback(
      ai,
      'gemini-3.8-flash',
      {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
      rawText
    );

    const outputText = response.text;
    if (!outputText) {
      return res.status(500).json({ error: 'No response from AI model' });
    }

    const parsedJson = JSON.parse(outputText);
    if (!parsedJson.destination || parsedJson.destination === 'Sikkim') {
      const autoDest = parseDestinationFromText(rawText);
      if (autoDest) {
        parsedJson.destination = autoDest;
      }
    }

    return res.json({
      itinerary: parsedJson,
      detectedFields: parsedJson.detectedFields || ['AI-extracted itinerary structure'],
      missingFields: parsedJson.missingFields || [],
    });
  } catch (err: any) {
    console.error('Error in /api/parse-itinerary:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// Endpoint: AI Bot for Interactive Multi-Turn Itinerary Planning, Rewriting & Updates
app.post('/api/ai-itinerary-bot', async (req, res) => {
  try {
    const {
      messages,
      currentItinerary,
      savedItineraries,
      leads,
      activeTab,
      viewMode,
      action,
      model,
      jarvisMemory,
      destinationContext,
    } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    if (!ai || !process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'Gemini API key is not configured on the server. Please attach the key in Settings > Secrets.',
      });
    }

    // Inspect user's input messages prioritizing the latest spoken/typed turn
    const userMessages = (messages || []).filter(
      (m: any) => m.role === 'user' || !m.role || m.role === 'client'
    );
    const lastUserText =
      userMessages.length > 0
        ? userMessages[userMessages.length - 1].content || userMessages[userMessages.length - 1].text || ''
        : '';

    const allUserText = userMessages
      .map((m: any) => m.content || m.text || '')
      .join(' ')
      .toLowerCase();

    // Use unified destination parser prioritizing the most recent user turn
    const requestedDestination = parseDestinationFromText(
      lastUserText,
      messages,
      destinationContext
    );

    // Determine if user intends to build a fresh/new itinerary
    const isCreatingNew =
      action === 'create_new_itinerary' ||
      /create.*itinerary|generate.*itinerary|make.*itinerary|build.*itinerary|plan.*tour|plan.*itinerary|new.*tour|new.*itinerary|different.*destination|5.*day|6.*day|4.*day|3.*day|7.*day|\b(tour|trip|package|holiday)\b/i.test(
        lastUserText || allUserText
      );

    // If destination is specified or differs from current active itinerary, NULLIFY currentItinerary so stale cached data never leaks
    let effectiveCurrentItinerary = currentItinerary;
    if (
      isCreatingNew ||
      (currentItinerary &&
        currentItinerary.destination &&
        currentItinerary.destination.toLowerCase() !== requestedDestination.toLowerCase())
    ) {
      effectiveCurrentItinerary = null;
    }

    const preferredModel = model === 'gemini-3.8-flash' ? 'gemini-3.8-flash' : 'gemini-3.1-flash-lite';

    let systemInstruction = `You are "JARVIS" — the Senior AI Travel Architect, Operations Director & Chief Quotation Specialist for North East Destinations (https://northeastdestinations.in/), a premier Destination Management Company (DMC) headquartered in Siliguri and Gangtok.
Your persona is unmistakably JARVIS: polished, executive, witty, respectful (address the user as "Sir" or "Ma'am"), completely unflappable, and brilliantly knowledgeable.

CRITICAL IDENTITY & CORE MANDATE:
YOU ARE THE MASTER TRAVEL EXPERT CONTROLLING THE ENTIRE TOUR PLANNING SYSTEM.
You have direct, synchronized authority to:
1. CREATE NEW ITINERARIES from scratch or user requirements with complete day-by-day sightseeing, hotel allocations, cab fleet allocation, and buying/selling pricing.
2. UPDATE THE ACTIVE ITINERARY currently loaded in the Itinerary Builder (modify any day, hotel, vehicle, route, dates, passenger count, or costs).
3. SEARCH, LOAD & SWITCH TO ANY SAVED QUOTATION in the agency's records by quote number (e.g. NED-2026-xxxx) or guest name.
4. MAKE CHANGES TO ANY SAVED QUOTE in the database.
5. SYNC WITH LEADS CRM: create new leads, update lead statuses (new, contacted, itinerary_sent, booked, lost), and generate tailored quotations directly for any CRM lead.
6. NAVIGATE APP VIEWS: switch between Itinerary Builder, PDF Preview, Leads CRM, and Saved Quotes.

SPEED DIRECTIVE:
You MUST work at maximum speed. Provide crisp, decisive, executive answers (under 2-3 sentences) without verbose filler. Immediately execute the requested tour adjustments and JSON synthesis.

REGIONAL SPECIALIZATIONS & GROUND INTELLIGENCE:
1. Sikkim (Flagship Destination): Gangtok, Tsomgo Lake, Nathula Pass, Baba Mandir, Pelling, Ravangla, Namchi.
   - NATHULA PASS IS CLOSED ONLY ON MONDAYS (open Tuesday through Sunday).
2. North Sikkim (High-Altitude Alpine Circuit): Lachen, Sacred Gurudongmar Lake (17,800 ft), Lachung, Yumthang Valley of Flowers, Zero Point (Yumesamdong 15,300 ft).
   - COMPULSORILY REQUIRES AP MEAL PLAN (All Meals Included: Breakfast, Lunch & Dinner) as mandated by regional hill hotel associations.
3. Darjeeling & Kalimpong: 04:00 AM Tiger Hill sunrise over Mt. Kanchenjunga & Mt. Everest, Batasia Loop spiral railway, DHR Toy Train, Himalayan Zoo (Red Panda), HMI, Happy Valley Tea Gardens, Mirik Lake.
4. Meghalaya: Shillong, Umiam Lake, Cherrapunji / Sohra, Double Decker Living Root Bridge, Mawlynnong Clean Village, Dawki Umngot river boating, Krang Shuri falls.
5. Assam: Kaziranga National Park jeep/elephant safaris, Kamakhya Temple, Guwahati Brahmaputra cruise, Majuli island.
6. Arunachal Pradesh: Tawang Monastery, Sela Pass, Madhuri Lake, Dirang, Bomdila, Ziro.
7. Andaman & Nicobar Islands: Port Blair, Cellular Jail, Havelock / Swaraj Dweep (Radhanagar & Elephant Beach), Neil / Shaheed Dweep (Bharatpur & Natural Bridge), Ross & North Bay.
   - High-speed inter-island private catamarans (Makruzz, Nautika, Green Ocean). Port Blair airport is IXZ.
8. Fixed Agency Fleet:
   - Reserved Cab: "Innova / Xylo" (4-6 pax luxury mountain SUV), "Tata Sumo (Reserved Dedicated)" (6-8 pax rugged private SUV), "Tempo Traveller" (9-26 pax coach), "Small Cab (Swift / WagonR)" (1-4 pax).
   - Sharing Cab: "Tata Sumo / Mahindra Bolero" (shared taxi transit).`;

    if (jarvisMemory) {
      const memoryText = Array.isArray(jarvisMemory)
        ? jarvisMemory.join('\n')
        : typeof jarvisMemory === 'string'
        ? jarvisMemory
        : '';
      if (memoryText.trim()) {
        systemInstruction += `\n\n[JARVIS CONTINUOUS ACCUMULATED KNOWLEDGE & USER MEMORY]:
${memoryText}
ALWAYS RESPECT AND APPLY THESE LEARNED PREFERENCES.`;
      }
    }

    if (requestedDestination) {
      systemInstruction += `\n\n[MANDATORY DESTINATION TARGET: ${requestedDestination.toUpperCase()}]:
The user explicitly requested destination: "${requestedDestination}".
1. Set "destination": "${requestedDestination}" in the itinerary JSON object.
2. Generate all sightseeing, days, hotels, and hubs strictly for ${requestedDestination}.
${
  requestedDestination === 'North Sikkim'
    ? '3. STRICT REQUIREMENT (NORTH SIKKIM): Pickup/Drop must be Bagdogra Airport (IXB) / NJP Station. Night stays: Lachen, Lachung, and Gangtok. Sightseeing must include: Sacred Gurudongmar Lake (17,800 ft), Thangu Valley, Chopta Valley, Yumthang Valley of Flowers, Zero Point (Yumesamdong 15,300 ft). MANDATORY MEAL PLAN: "AP (Compulsory All Meals: Breakfast, Lunch & Dinner)". DO NOT mention Andaman or beach destinations!'
    : requestedDestination === 'Darjeeling'
    ? '3. STRICT REQUIREMENT (DARJEELING): Pickup/Drop must be Bagdogra Airport (IXB) / NJP Station. Night stays: Darjeeling. Sightseeing must include: 04:00 AM Tiger Hill Golden Sunrise over Mt. Kanchenjunga & Mt. Everest, Batasia Loop spiral railway, Ghoom Monastery, Padmaja Naidu Himalayan Zoo (Red Panda), Himalayan Mountaineering Institute (HMI), Happy Valley Tea Gardens, and Mirik Lake (Sumendu Lake). Meal plan: "MAP (Daily Breakfast & Dinner)". DO NOT mention Andaman or beach destinations!'
    : requestedDestination === 'Sikkim'
    ? '3. STRICT REQUIREMENT (SIKKIM): Pickup/Drop must be Bagdogra Airport (IXB) / NJP Station. Night stays: Gangtok and Pelling. Include Tsomgo Lake, Baba Mandir, Nathula Pass (closed Mondays), MG Marg, and Pelling Skywalk. DO NOT mention Port Blair, Havelock, Neil, or Andaman!'
    : requestedDestination === 'Meghalaya'
    ? '3. STRICT REQUIREMENT (MEGHALAYA): Pickup/Drop must be Guwahati Airport (GAU). Night stays: Shillong, Cherrapunji. Include Umiam Lake, Nohkalikai Falls, Mawsmai Cave, Living Root Bridge, and Dawki Umngot river boating. DO NOT mention Andaman!'
    : requestedDestination === 'Andaman'
    ? '3. STRICT REQUIREMENT (ANDAMAN): Pickup/Drop must be Port Blair (IXZ). Night stays: Port Blair, Havelock, Neil. Include Cellular Jail, Radhanagar Beach, Elephant Beach, and high-speed catamarans.'
    : ''
}
4. Set "hasItineraryUpdate": true and "action": "create_new_itinerary".`;
    }

    // Active Itinerary Context (Only when not superseded by a new destination request)
    if (effectiveCurrentItinerary) {
      systemInstruction += `\n\n[CURRENT ACTIVE ITINERARY IN BUILDER]:
Quote Number: #${effectiveCurrentItinerary.quoteNumber || 'Draft'}
Title: "${effectiveCurrentItinerary.title || 'Custom Tour'}"
Destination: ${effectiveCurrentItinerary.destination || 'North East'}
Guest: ${effectiveCurrentItinerary.guestName || 'Valued Guest'} (${effectiveCurrentItinerary.adults || 2} Adults, ${effectiveCurrentItinerary.children || 0} Children)
Dates: ${effectiveCurrentItinerary.travelStartDate || 'Flexible'} to ${effectiveCurrentItinerary.travelEndDate || 'Flexible'} (${effectiveCurrentItinerary.durationDays || 5} Days / ${effectiveCurrentItinerary.durationNights || 4} Nights)
Pickup / Drop: ${effectiveCurrentItinerary.pickupLocation || 'IXB'} / ${effectiveCurrentItinerary.dropLocation || 'IXB'}
Hotel Category: ${effectiveCurrentItinerary.hotelCategory || 'Deluxe'} (${effectiveCurrentItinerary.mealPlan || 'MAP'})
Buying Cost: ₹${effectiveCurrentItinerary.packageCost || 0} | Quoted Selling: ₹${effectiveCurrentItinerary.sellingCost || 0}
Days Breakdown (${effectiveCurrentItinerary.days?.length || 0} Days):
${(effectiveCurrentItinerary.days || []).map((d: any) => ` - Day ${d.dayNumber}: ${d.title} (Stay: ${d.nightStay || 'N/A'}, Transport: ${d.transportDetails || 'Dedicated Cab'})`).join('\n')}`;
    }

    // Saved Quotes Context
    if (Array.isArray(savedItineraries) && savedItineraries.length > 0) {
      systemInstruction += `\n\n[ALL SAVED QUOTATIONS IN SYSTEM (${savedItineraries.length} Saved Quotes)]:
${savedItineraries.slice(0, 20).map((it: any, i: number) => 
  `${i + 1}. #${it.quoteNumber || 'N/A'}: "${it.title}" for ${it.guestName || 'Guest'} (${it.destination || 'North East'}, ${it.durationDays || 5}D, ₹${it.sellingCost || 0}, Date: ${it.travelStartDate || 'Flexible'}, ID: ${it.id})`
).join('\n')}
NOTE: If the user says "open quote #${savedItineraries[0]?.quoteNumber || '...'}", "switch to [guest name]'s quote", or "load [title]", you can set action: "load_saved_quote" and specify targetQuoteNumber.`;
    }

    // Leads CRM Context
    if (Array.isArray(leads) && leads.length > 0) {
      systemInstruction += `\n\n[ACTIVE CLIENT LEADS IN CRM (${leads.length} Leads)]:
${leads.slice(0, 20).map((l: any, i: number) => 
  `${i + 1}. "${l.guestName}" | ${l.destination || 'North East'} (${l.durationDays || 5}D, ${l.adults || 2} Pax) | Status: ${l.status} | Budget: ${l.budget || 'Open'} | Phone: ${l.phone || 'N/A'} | Quote: ${l.quoteNumber || 'None'} | ID: ${l.id}`
).join('\n')}
NOTE: You can create new leads, update lead statuses (e.g. booked, itinerary_sent, contacted), or generate quotes directly for any of these leads!`;
    }

    systemInstruction += `\n\nRETURN FORMAT:
You MUST respond with a valid JSON object matching this schema:
{
  "reply": "Your conversational answer in clear, refined, executive English (or Hindi if asked in Hindi). Concise (under 2-3 sentences), confident, and actionable.",
  "action": "create_new_itinerary | update_current_itinerary | load_saved_quote | update_saved_quote | create_lead | update_lead | navigate | general_chat",
  "targetQuoteNumber": "e.g. NED-2026-1042 or null",
  "targetItineraryId": "itin id or null",
  "targetLeadId": "lead id or null",
  "navigationTarget": {
    "tab": "itinerary | leads | saved | accounts | home",
    "mode": "builder | preview"
  },
  "leadData": {
    "guestName": "Guest Name",
    "phone": "Phone number",
    "email": "Email or empty",
    "destination": "Destination name",
    "durationDays": 5,
    "adults": 2,
    "status": "new | contacted | itinerary_sent | booked | lost",
    "notes": "Inquiry notes or preference"
  },
  "hasItineraryUpdate": boolean,
  "itinerary": {
    "title": "Tour Title",
    "destination": "Destination name (e.g. Sikkim, Darjeeling, Meghalaya, Andaman)",
    "guestName": "Guest Name",
    "adults": 2,
    "children": 0,
    "infants": 0,
    "travelStartDate": "YYYY-MM-DD or empty string",
    "travelEndDate": "YYYY-MM-DD or empty string",
    "durationDays": 5,
    "durationNights": 4,
    "pickupLocation": "e.g. Bagdogra Airport (IXB) / NJP Station or Port Blair (IXZ)",
    "dropLocation": "e.g. Bagdogra Airport (IXB) / NJP Station or Port Blair (IXZ)",
    "hotelCategory": "Deluxe Category (3-Star Mountain View)",
    "mealPlan": "MAP (Daily Breakfast & Dinner)",
    "pricingMode": "both",
    "packageCost": 35000,
    "sellingCost": 50000,
    "sellingCostSharing": 36000,
    "reservedCab": {
      "name": "Option A: Reserved Cab Facility",
      "vehicleType": "Innova / Xylo",
      "description": "Exclusive private SUV allocated strictly for your group from pickup to drop.",
      "pricePerPerson": 25000,
      "totalPackagePrice": 50000
    },
    "sharingCab": {
      "name": "Option B: Sharing Cab Facility",
      "vehicleType": "Tata Sumo / Mahindra Bolero",
      "description": "Budget-conscious shared seat travel between major transit stands.",
      "pricePerPerson": 18000,
      "totalPackagePrice": 36000
    },
    "days": [
      {
        "dayNumber": 1,
        "title": "Day title",
        "date": "YYYY-MM-DD or empty string",
        "description": "Vivid, engaging description of route and activities...",
        "sightseeingHighlights": ["Highlight 1", "Highlight 2"],
        "nightStay": "Town (e.g. Gangtok or Port Blair)",
        "mealPlan": "Breakfast & Dinner",
        "transportDetails": "Dedicated Private Vehicle transfer",
        "hotelName": "Hotel Summit Golden Crescent or Similar Deluxe",
        "hotelPricingMode": "per_night",
        "hotelCostPerNight": 3200,
        "transportCost": 4500,
        "activityCost": 0
      }
    ],
    "commonInclusions": ["Point 1", "Point 2"],
    "commonExclusions": ["Point 1", "Point 2"],
    "specialAdvisories": ["Point 1", "Point 2"]
  },
  "learnedInsights": [
    "Short description of newly learned user preference or client nuance"
  ],
  "suggestedPrompts": [
    "Suggested follow-up 1",
    "Suggested follow-up 2",
    "Suggested follow-up 3"
  ]
}

Whenever the user asks to create an itinerary, rewrite all days, update fields, or adjust pricing/hotels/route, set "hasItineraryUpdate" to true and populate "itinerary" with the updated tour data.`;

    if (action === 'rewrite_all_days') {
      systemInstruction += `\n\n[EXPLICIT ACTION INSTRUCTION]: The user explicitly requested to rewrite ALL day plans and tour schedule in a perfect, client-ready, luxury DMC style. Make every day's title and description captivating, detailed, and chronologically practical.`;
    }

    // Build clean alternating conversation history strictly starting with user turn
    const contents: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];

    // Filter and sanitize messages
    const validMessages = messages.filter((m: any) => {
      const text = (m.content || m.text || '').trim();
      return text.length > 0 && !text.startsWith('⚠️');
    });

    for (const msg of validMessages) {
      const isModel = msg.role === 'model' || msg.role === 'assistant';
      const role: 'user' | 'model' = isModel ? 'model' : 'user';
      const text = (msg.content || msg.text || '').trim();

      // Skip starting with model turn (Gemini requirement: first turn must be user)
      if (contents.length === 0 && role === 'model') {
        continue;
      }

      // Merge consecutive identical roles to guarantee strict alternation
      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        contents[contents.length - 1].parts[0].text += `\n\n${text}`;
      } else {
        contents.push({
          role,
          parts: [{ text }],
        });
      }
    }

    // If contents is empty, ensure at least one user turn exists
    if (contents.length === 0) {
      contents.push({
        role: 'user',
        parts: [{ text: 'Please assist me with designing and optimizing the North East itinerary.' }],
      });
    }

    // Ensure last message is from user
    if (contents[contents.length - 1].role === 'model') {
      contents.push({
        role: 'user',
        parts: [{ text: 'Please provide the updated itinerary recommendations and details.' }],
      });
    }

    const { response, usedModel } = await generateWithGeminiFallback(
      ai,
      preferredModel,
      {
        systemInstruction,
        responseMimeType: 'application/json',
      },
      contents
    );

    const outputText = response.text;
    if (!outputText) {
      return res.status(500).json({ error: 'No response from AI model' });
    }

    try {
      const parsed = JSON.parse(outputText);
      if (parsed.itinerary && typeof parsed.itinerary === 'object' && Object.keys(parsed.itinerary).length > 0) {
        parsed.hasItineraryUpdate = true;
      }
      parsed._usedModel = usedModel;
      return res.json(parsed);
    } catch {
      // Fallback if model added markdown markers
      const jsonMatch = outputText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.itinerary && typeof parsed.itinerary === 'object' && Object.keys(parsed.itinerary).length > 0) {
          parsed.hasItineraryUpdate = true;
        }
        parsed._usedModel = usedModel;
        return res.json(parsed);
      }
      return res.json({
        reply: outputText,
        hasItineraryUpdate: false,
        itinerary: null,
        _usedModel: usedModel,
        suggestedPrompts: [
          '✨ Rewrite all itinerary days in a perfect way',
          'Add North Sikkim (Lachung & Yumthang)',
          'Change to 4-Star Super Deluxe category',
        ],
      });
    }
  } catch (err: any) {
    console.error('Error in /api/ai-itinerary-bot:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// Endpoint: JARVIS High-Quality Speech Generation (TTS)
app.post('/api/jarvis-tts', async (req, res) => {
  try {
    const { text, voice } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text string is required' });
    }

    if (!ai || !process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'Gemini API is not configured on the server.' });
    }

    const cleanText = text.replace(/[*#_`]/g, '').trim().slice(0, 800);

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [{ text: `Speak politely and calmly as JARVIS: ${cleanText}` }],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || 'Fenrir' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: 'No audio generated by model' });
    }

    return res.json({ audio: base64Audio, mimeType: 'audio/wav' });
  } catch (err: any) {
    console.error('Error in /api/jarvis-tts:', err);
    return res.status(500).json({ error: err.message || 'TTS generation failed' });
  }
});

// Setup WebSocket Server for Real-Time Gemini Live API (gemini-3.8-live)
const wss = new WebSocketServer({ server, path: '/api/live' });

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('[JARVIS Live] Client connected for voice interaction');

  if (!ai || !process.env.GEMINI_API_KEY) {
    clientWs.send(
      JSON.stringify({
        type: 'error',
        error: 'Gemini API key is not configured on the server. Please attach your key in Settings > Secrets.',
      })
    );
    clientWs.close();
    return;
  }

  let liveSession: any = null;
  const pendingMessages: any[] = [];

  // Register clientWs on message handler immediately so zero messages are dropped during initialization
  clientWs.on('message', (raw: any) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (!liveSession) {
        pendingMessages.push(msg);
        return;
      }
      processLiveMessage(msg);
    } catch (err) {
      console.error('[JARVIS Live Message parse error]:', err);
    }
  });

  const processLiveMessage = (msg: any) => {
    try {
      if (msg.type === 'audio' && msg.audio && liveSession) {
        liveSession.sendRealtimeInput({
          audio: { data: msg.audio, mimeType: 'audio/pcm;rate=16000' },
        });
      } else if (msg.type === 'text' && msg.text && liveSession) {
        if (typeof liveSession.sendClientContent === 'function') {
          liveSession.sendClientContent({
            turns: [
              {
                role: 'user',
                parts: [{ text: msg.text }],
              },
            ],
            turnComplete: true,
          });
        }
      }
    } catch (e) {
      console.warn('[JARVIS Live process error]:', e);
    }
  };

  try {
    liveSession = await ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            // 'Fenrir' provides a distinguished, calm, British-butler tone perfect for JARVIS
            prebuiltVoiceConfig: { voiceName: 'Fenrir' },
          },
        },
        systemInstruction: `You are JARVIS, the ultra-sophisticated, courteous, and exceptionally capable AI travel architect and voice assistant for North East Destinations (https://northeastdestinations.in/).
Your persona is unmistakably JARVIS: refined, calm, slightly witty, British-butler-inspired elegance, completely unflappable, and genuinely helpful.
Always address the user politely as "Sir" or "Ma'am", or by their name if they introduce themselves.

CRITICAL IDENTITY & CORE PURPOSE:
YOU WERE CREATED FOR ONE MAJOR MISSION: TO BE THE USER'S EXPERT TRAVEL ARCHITECT DEDICATED TO CREATING AND STRUCTURING TRAVEL ITINERARIES.
You understand that you were made to create itineraries. Every question you ask or answer is purposefully aimed at capturing guest names, travel dates, passenger count, destinations (Sikkim, Darjeeling, Meghalaya, Assam, Arunachal, Andaman), hotels, and cab requirements, and converting them into complete, professional travel plans.
WORK AT LIGHTNING SPEED: Be decisive, give concise and crisp answers without fluff, and immediately recommend the optimal route and itinerary breakdown.

CRITICAL RULES YOU MUST ALWAYS ENFORCE IN CONVERSATION:
1. Destination Specific Advisories:
   - For Sikkim: Nathula Pass (Indo-China Border) is CLOSED ONLY ON MONDAYS for tourists (open Tuesday through Sunday).
   - For North Sikkim (Lachen, Lachung, Yumthang Valley, Gurudongmar Lake, Zero Point): The AP Meal Plan (Breakfast, Lunch & Dinner included) is STRICTLY COMPULSORY by regional tourism regulations. Standalone restaurants do not exist in high altitudes.
   - For Andaman: High-speed inter-island catamarans (Makruzz, Nautika, Green Ocean) connect Port Blair, Havelock, and Neil Island. Sea operations are subject to Coast Guard weather clearances. Touching living coral reefs or taking shells/corals is strictly penalized under the Wildlife Protection Act. Andaman & Nicobar administration strictly enforces a total ban on single-use plastics with spot fines up to INR 5,000.
2. Cab Fleet Options:
   - Option A Reserved (Dedicated SUV exclusively for client): Innova / Xylo, Tata Sumo Reserved, Tempo Traveller, Swift / WagonR.
   - Option B Sharing (Economical shared vehicle): Strictly Tata Sumo or Mahindra Bolero.

VOICE CONVERSATION GUIDANCE:
- Keep your answers rapid, conversational, engaging, concise (under 2-3 sentences), and natural for real-time speech.
- When the user asks to generate or move to builder, confirm enthusiastically and trigger the itinerary compilation.`,
      },
      callbacks: {
        onmessage: (message: LiveServerMessage) => {
          if (clientWs.readyState !== WebSocket.OPEN) return;

          // Forward model audio chunks (24kHz PCM)
          const parts = message.serverContent?.modelTurn?.parts;
          if (parts && parts.length > 0) {
            for (const part of parts) {
              if (part.inlineData?.data) {
                clientWs.send(
                  JSON.stringify({
                    type: 'audio',
                    audio: part.inlineData.data,
                  })
                );
              }
              if (part.text) {
                clientWs.send(
                  JSON.stringify({
                    type: 'transcription',
                    role: 'assistant',
                    text: part.text,
                  })
                );
              }
            }
          }

          // Output transcription (JARVIS's words)
          const outputText = (message.serverContent as any)?.outputAudioTranscription?.text;
          if (outputText) {
            clientWs.send(
              JSON.stringify({
                type: 'transcription',
                role: 'assistant',
                text: outputText,
              })
            );
          }

          // Input transcription (User's words)
          const inputText = (message.serverContent as any)?.inputAudioTranscription?.text;
          if (inputText) {
            clientWs.send(
              JSON.stringify({
                type: 'transcription',
                role: 'user',
                text: inputText,
              })
            );
          }

          // Model turn complete (Jarvis finished speaking this turn)
          if (message.serverContent?.turnComplete) {
            clientWs.send(JSON.stringify({ type: 'turn_complete' }));
          }

          // Interrupted by user speech
          if (message.serverContent?.interrupted) {
            clientWs.send(JSON.stringify({ type: 'interrupted' }));
          }
        },
        onclose: () => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'session_closed' }));
          }
        },
        onerror: (err: any) => {
          console.error('[JARVIS Live Session Error]:', err);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(
              JSON.stringify({
                type: 'error',
                error: err?.message || String(err),
              })
            );
          }
        },
      },
    });

    clientWs.send(
      JSON.stringify({
        type: 'ready',
        message: 'At your service, Sir. JARVIS Live Voice is online and listening.',
      })
    );

    // Flush any pending messages that arrived during initialization
    while (pendingMessages.length > 0) {
      const pending = pendingMessages.shift();
      processLiveMessage(pending);
    }

    clientWs.on('close', () => {
      console.log('[JARVIS Live] Client session closed');
      if (liveSession) {
        try {
          liveSession.close();
        } catch {}
      }
    });
  } catch (err: any) {
    console.error('[JARVIS Live Connect Error]:', err);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(
        JSON.stringify({
          type: 'error',
          error: err?.message || 'Failed to connect to JARVIS Live Voice.',
        })
      );
      clientWs.close();
    }
  }
});

async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT} (HTTP + WebSockets)`);
  });
}

startServer();
