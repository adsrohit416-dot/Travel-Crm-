/**
 * Unified Destination Parser & Circuit Intelligence for North East Destinations
 * Prioritizes the latest user turn/speech over older conversation history
 * Distinguishes between specific circuits:
 * - North Sikkim (Lachen, Lachung, Gurudongmar, Yumthang, Zero Point, Compulsory AP meal plan)
 * - Darjeeling (Tiger Hill, Batasia, Mirik, Toy Train, Ghoom, Kalimpong)
 * - Sikkim (Gangtok, Tsomgo Lake, Nathula Pass, Baba Mandir, Pelling, Ravangla)
 * - Meghalaya (Shillong, Cherrapunji, Dawki, Mawlynnong, Living Root Bridge)
 * - Andaman (Port Blair, Havelock, Neil, Cellular Jail, Radhanagar Beach)
 * - Arunachal Pradesh (Tawang, Sela Pass, Bomdila, Dirang)
 * - Assam (Kaziranga, Guwahati, Kamakhya)
 */

export interface DestinationInfo {
  destination: string;
  isSpecificCircuit: boolean;
  hubAirportStation: string;
  compulsoryMealPlan?: string;
  keyHighlights: string[];
}

export function parseDestinationFromText(
  latestText?: string,
  historyOrContext?: string | Array<{ role?: string; content?: string; text?: string }>,
  fallbackContext?: string
): string {
  // Helper to extract text from a single turn
  const testSingleText = (rawText: string): string | null => {
    if (!rawText) return null;
    const t = rawText.toLowerCase();

    // 1. North Sikkim Check (Must precede general Sikkim check!)
    if (
      t.includes('north sikkim') ||
      t.includes('lachen') ||
      t.includes('lachung') ||
      t.includes('gurudongmar') ||
      t.includes('yumthang') ||
      t.includes('zero point') ||
      t.includes('yumesamdong') ||
      t.includes('chopta valley') ||
      t.includes('katao')
    ) {
      return 'North Sikkim';
    }

    // 2. Darjeeling Check (Must precede general Sikkim check in case user says "Darjeeling" or "Darjeeling tour")
    if (
      t.includes('darjeeling') ||
      t.includes('tiger hill') ||
      t.includes('batasia') ||
      t.includes('ghoom') ||
      t.includes('mirik') ||
      t.includes('toy train') ||
      t.includes('kurseong') ||
      t.includes('lamahatta') ||
      t.includes('kalimpong') ||
      t.includes('happy valley')
    ) {
      return 'Darjeeling';
    }

    // 3. Meghalaya Check
    if (
      t.includes('meghalaya') ||
      t.includes('shillong') ||
      t.includes('cherrapunji') ||
      t.includes('sohra') ||
      t.includes('dawki') ||
      t.includes('mawlynnong') ||
      t.includes('root bridge') ||
      t.includes('living root') ||
      t.includes('nohkalikai') ||
      t.includes('krang suri') ||
      t.includes('umiam')
    ) {
      return 'Meghalaya';
    }

    // 4. Andaman Check
    if (
      t.includes('andaman') ||
      t.includes('port blair') ||
      t.includes('havelock') ||
      t.includes('neil') ||
      t.includes('swaraj dweep') ||
      t.includes('shaheed dweep') ||
      t.includes('radhanagar') ||
      t.includes('cellular jail') ||
      t.includes('elephant beach') ||
      t.includes('ross island') ||
      t.includes('baratang')
    ) {
      return 'Andaman';
    }

    // 5. Arunachal Pradesh Check
    if (
      t.includes('arunachal') ||
      t.includes('tawang') ||
      t.includes('sela pass') ||
      t.includes('bomdila') ||
      t.includes('dirang') ||
      t.includes('madhuri lake') ||
      t.includes('bhalukpong') ||
      t.includes('sangti')
    ) {
      return 'Arunachal Pradesh';
    }

    // 6. Assam Check
    if (
      t.includes('assam') ||
      t.includes('kaziranga') ||
      t.includes('guwahati') ||
      t.includes('kamakhya') ||
      t.includes('manas') ||
      t.includes('majuli') ||
      t.includes('brahmaputra')
    ) {
      return 'Assam';
    }

    // 7. General Sikkim (Gangtok / Tsomgo / Nathula / Pelling / Ravangla)
    if (
      t.includes('sikkim') ||
      t.includes('gangtok') ||
      t.includes('tsomgo') ||
      t.includes('changu') ||
      t.includes('nathula') ||
      t.includes('baba mandir') ||
      t.includes('pelling') ||
      t.includes('ravangla') ||
      t.includes('namchi') ||
      t.includes('yuksom') ||
      t.includes('rumtek') ||
      t.includes('mg marg')
    ) {
      return 'Sikkim';
    }

    // 8. Other regions
    if (t.includes('bhutan') || t.includes('paro') || t.includes('thimphu')) {
      return 'Bhutan';
    }
    if (t.includes('kashmir') || t.includes('gulmarg') || t.includes('pahalgam') || t.includes('sonamarg') || t.includes('ladakh') || t.includes('leh')) {
      return 'Kashmir & Ladakh';
    }

    return null;
  };

  // Step 1: ALWAYS check the latest spoken or typed user input first!
  if (latestText && latestText.trim()) {
    const dest = testSingleText(latestText);
    if (dest) return dest;
  }

  // Step 2: Check conversation history in REVERSE chronological order (newest turns first)
  if (Array.isArray(historyOrContext)) {
    const userTurns = historyOrContext
      .filter((m) => m && (m.role === 'user' || m.role === 'client' || !m.role))
      .map((m) => m.content || m.text || '')
      .filter((txt) => typeof txt === 'string' && txt.trim().length > 0);

    for (let i = userTurns.length - 1; i >= 0; i--) {
      const dest = testSingleText(userTurns[i]);
      if (dest) return dest;
    }
  } else if (typeof historyOrContext === 'string' && historyOrContext.trim()) {
    const dest = testSingleText(historyOrContext);
    if (dest) return dest;
  }

  // Step 3: Check fallbackContext (ensure it doesn't default to Andaman unless Andaman was genuinely the context)
  if (fallbackContext && typeof fallbackContext === 'string' && fallbackContext.trim()) {
    const dest = testSingleText(fallbackContext);
    if (dest && dest !== 'Andaman') return dest;
    if (dest === 'Andaman' && fallbackContext.toLowerCase().includes('andaman')) return 'Andaman';
  }

  // Default flagship destination for North East Destinations
  return 'Sikkim';
}
