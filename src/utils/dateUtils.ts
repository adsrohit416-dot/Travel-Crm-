/**
 * Date calculation and formatting utilities for Itinerary and Quotations
 */

const DAY_ABBREVIATIONS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/**
 * Returns 3-letter abbreviation of day of week (e.g. "Mon", "Tue", "Wed")
 */
export const getDayOfWeekAbbr = (dateString?: string): string => {
  if (!dateString || typeof dateString !== 'string') return '';
  try {
    const parts = dateString.trim().split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        return DAY_ABBREVIATIONS[d.getDay()] || '';
      }
    }
    const d = new Date(dateString);
    if (!isNaN(d.getTime())) {
      return DAY_ABBREVIATIONS[d.getDay()] || '';
    }
  } catch {
    // fallback
  }
  return '';
};

/**
 * Formats a date string as "Mon, 12 Oct 2026" or "12 Oct 2026 (Mon)"
 */
export const formatDateWithDayAbbr = (dateString?: string, format: 'prefix' | 'suffix' = 'prefix'): string => {
  if (!dateString) return '';
  try {
    const abbr = getDayOfWeekAbbr(dateString);
    const parts = dateString.trim().split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        const monthName = d.toLocaleDateString('en-US', { month: 'short' });
        if (format === 'prefix' && abbr) {
          return `${abbr}, ${day} ${monthName} ${year}`;
        }
        return `${day} ${monthName} ${year}${abbr ? ` (${abbr})` : ''}`;
      }
    }
  } catch {
    // fallback
  }
  return dateString;
};

/**
 * Adds N days to a YYYY-MM-DD date string, returning a new YYYY-MM-DD string
 */
export const addDaysToDate = (dateString: string, daysToAdd: number): string => {
  if (!dateString) return '';
  try {
    const parts = dateString.trim().split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        d.setDate(d.getDate() + daysToAdd);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dt = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dt}`;
      }
    }
    const d = new Date(dateString);
    if (!isNaN(d.getTime())) {
      d.setDate(d.getDate() + daysToAdd);
      return d.toISOString().split('T')[0];
    }
  } catch {
    // fallback
  }
  return '';
};

/**
 * Calculates number of calendar days between two YYYY-MM-DD dates (inclusive: e.g. Oct 1 to Oct 5 = 5 days)
 */
export const calculateInclusiveDays = (startDateStr: string, endDateStr: string): number => {
  if (!startDateStr || !endDateStr) return 1;
  try {
    const startParts = startDateStr.split('-').map(Number);
    const endParts = endDateStr.split('-').map(Number);
    if (startParts.length === 3 && endParts.length === 3) {
      const d1 = new Date(startParts[0], startParts[1] - 1, startParts[2]);
      const d2 = new Date(endParts[0], endParts[1] - 1, endParts[2]);
      const diffMs = d2.getTime() - d1.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      return Math.max(1, diffDays + 1);
    }
  } catch {
    // fallback
  }
  return 1;
};
