/**
 * Utility functions for parsing relative dates and computing task due status.
 */

export function getTodayIso(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Returns a formatted date string (YYYY-MM-DD) for n days from now.
 */
export function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/**
 * Calculate the next upcoming target weekday ISO string.
 * weekday: 0 = Sun, 1 = Mon, ..., 6 = Sat
 */
export function getNextWeekdayIso(targetDay: number): string {
  const d = new Date();
  const currentDay = d.getDay();
  let daysToAdd = (targetDay - currentDay + 7) % 7;
  if (daysToAdd === 0) daysToAdd = 7; // Next occurrence
  d.setDate(d.getDate() + daysToAdd);
  return d.toISOString().split('T')[0];
}

/**
 * Resolves a natural language date string into an ISO YYYY-MM-DD date.
 */
export function resolveDateToIso(naturalDate: string): string {
  const normalized = naturalDate.trim().toLowerCase();
  const today = new Date();

  if (normalized.includes('today') || normalized.includes('eod') || normalized.includes('tonight')) {
    return getTodayIso();
  }
  if (normalized.includes('tomorrow')) {
    return addDays(1);
  }
  if (normalized.includes('yesterday')) {
    return addDays(-1);
  }

  // Weekdays
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let i = 0; i < dayNames.length; i++) {
    if (normalized.includes(dayNames[i])) {
      return getNextWeekdayIso(i);
    }
  }

  // "in X days"
  const inDaysMatch = normalized.match(/in\s+(\d+)\s+days?/);
  if (inDaysMatch) {
    return addDays(parseInt(inDaysMatch[1], 10));
  }

  // "next week"
  if (normalized.includes('next week')) {
    return addDays(7);
  }

  // Try parsing direct date formats e.g. "2026-10-25" or "Oct 25"
  const directTimestamp = Date.parse(naturalDate);
  if (!isNaN(directTimestamp)) {
    const parsedDate = new Date(directTimestamp);
    // If year is past or missing, default to current year
    if (parsedDate.getFullYear() < today.getFullYear()) {
      parsedDate.setFullYear(today.getFullYear());
    }
    return parsedDate.toISOString().split('T')[0];
  }

  // Fallback: Default to in 3 days if unspecified or unparseable
  return addDays(3);
}

/**
 * Returns human readable representation of date e.g. "Today", "Tomorrow", "Yesterday", "Oct 24"
 */
export function formatHumanDate(isoDate: string): string {
  if (!isoDate) return 'No date';

  const todayIso = getTodayIso();
  if (isoDate === todayIso) return 'Today';
  if (isoDate === addDays(1)) return 'Tomorrow';
  if (isoDate === addDays(-1)) return 'Yesterday';

  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return isoDate;

  const targetDate = new Date(year, month - 1, day);
  const now = new Date();

  // If within the next 6 days, show weekday e.g. "Friday"
  const diffTime = targetDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays > 1 && diffDays <= 6) {
    const weekday = targetDate.toLocaleDateString('en-US', { weekday: 'short' });
    return `${weekday}`;
  }

  // Otherwise format as "Oct 24"
  return targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export interface DueStatus {
  isOverdue: boolean;
  isDueToday: boolean;
  isDueSoon: boolean; // within 2 days
  daysRemaining: number;
}

export function getDueStatus(dueDateIso: string, status: string): DueStatus {
  if (status === 'Completed' || !dueDateIso) {
    return { isOverdue: false, isDueToday: false, isDueSoon: false, daysRemaining: 999 };
  }

  const todayIso = getTodayIso();
  const today = new Date(todayIso).getTime();
  const target = new Date(dueDateIso).getTime();

  const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));

  return {
    isOverdue: diffDays < 0,
    isDueToday: diffDays === 0,
    isDueSoon: diffDays > 0 && diffDays <= 2,
    daysRemaining: diffDays,
  };
}
