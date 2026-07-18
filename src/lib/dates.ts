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

/** Short "X ago" label for a timestamp relative to nowMs. */
export function relativeTime(iso: string, nowMs: number): string {
  const diffMinutes = Math.floor((nowMs - Date.parse(iso)) / 60_000);
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}
