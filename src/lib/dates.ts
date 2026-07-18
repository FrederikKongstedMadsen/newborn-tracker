function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

export function localDateParts(date: Date): { y: number; m: string; d: string } {
  return {
    y: date.getFullYear(),
    m: String(date.getMonth() + 1).padStart(2, '0'),
    d: String(date.getDate()).padStart(2, '0'),
  };
}

/** Returns the local calendar date of an ISO timestamp as 'YYYY-MM-DD'. */
export function localDateIso(iso: string): string {
  const { y, m, d } = localDateParts(new Date(iso));
  return `${y}-${m}-${d}`;
}

/** Returns the local calendar date as 'YYYY-MM-DD'. Deliberately avoids
 * toISOString(), which is UTC and can be off by one near local midnight. */
export function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function parseIsoAsLocalMidnight(dateIso: string): number {
  const [year, month, day] = dateIso.split('-').map(Number);
  return new Date(year, month - 1, day).getTime();
}

/** Calendar-day distance between dateIso and todayIsoStr (defaults to today),
 * both compared as local midnights so the result doesn't drift with time of
 * day. Future dates clamp to 'today'. */
export function relativeDays(dateIso: string, todayIsoStr: string = todayIso()): string {
  const msPerDay = 86_400_000;
  const days = Math.round(
    (parseIsoAsLocalMidnight(todayIsoStr) - parseIsoAsLocalMidnight(dateIso)) / msPerDay,
  );
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
}

/** Returns the local time of an ISO timestamp as 24-hour 'HH:mm'. Deliberately
 * avoids toLocaleTimeString(), whose 'hour: 2-digit' output is locale
 * dependent (e.g. renders 12-hour AM/PM on many locales) — this app's design
 * requires a consistent 24-hour format. */
export function timeHHmm(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function unit(n: number, singular: string): string {
  return `${n} ${singular}${n === 1 ? '' : 's'}`;
}

/** Human-friendly age label, staged in granularity as the baby gets older:
 * days for < 2 weeks, weeks+days for < ~2 months, months+weeks beyond that. */
export function formatAge(ageDays: number): string {
  if (ageDays < 14) {
    return `${unit(ageDays, 'day')} old`;
  }
  if (ageDays < 61) {
    const weeks = Math.floor(ageDays / 7);
    const remDays = ageDays % 7;
    const weeksPart = unit(weeks, 'week');
    return remDays === 0 ? `${weeksPart} old` : `${weeksPart} ${unit(remDays, 'day')} old`;
  }
  const daysPerMonth = 30.4375;
  const months = Math.floor(ageDays / daysPerMonth);
  const remWeeks = Math.floor((ageDays - months * daysPerMonth) / 7);
  const monthsPart = unit(months, 'month');
  return remWeeks === 0 ? `${monthsPart} old` : `${monthsPart} ${unit(remWeeks, 'week')} old`;
}

/** Short "X ago" label for a timestamp relative to nowMs. */
export function relativeTime(iso: string, nowMs: number): string {
  const diffMinutes = Math.floor((nowMs - Date.parse(iso)) / 60_000);
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}
