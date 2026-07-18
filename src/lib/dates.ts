function pad(n: number): string {
  return n.toString().padStart(2, '0');
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
