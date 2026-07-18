import type { Feed, FeedSide } from './types';

function localDateParts(date: Date): { y: number; m: string; d: string } {
  return {
    y: date.getFullYear(),
    m: String(date.getMonth() + 1).padStart(2, '0'),
    d: String(date.getDate()).padStart(2, '0'),
  };
}

export function localDateIso(iso: string): string {
  const { y, m, d } = localDateParts(new Date(iso));
  return `${y}-${m}-${d}`;
}

export function sideElapsedSeconds(feed: Feed, side: FeedSide, nowMs: number): number {
  const banked = side === 'left' ? feed.left_seconds : feed.right_seconds;
  if (feed.active_side === side && feed.active_side_started_at && !feed.ended_at) {
    return (
      banked + Math.max(0, Math.floor((nowMs - Date.parse(feed.active_side_started_at)) / 1000))
    );
  }
  return banked;
}

export function totalElapsedSeconds(feed: Feed, nowMs: number): number {
  return sideElapsedSeconds(feed, 'left', nowMs) + sideElapsedSeconds(feed, 'right', nowMs);
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${String(minutes % 60).padStart(2, '0')}m`;
}

export function feedSummary(feed: Feed): string {
  if (feed.type === 'formula') return `${feed.volume_ml ?? 0} ml`;
  return `L ${formatDuration(feed.left_seconds)} · R ${formatDuration(feed.right_seconds)}`;
}

export interface DailyTotal {
  dateIso: string;
  count: number;
  totalSeconds: number;
}

export function dailyTotals(feeds: Feed[], days: number, todayIsoStr: string): DailyTotal[] {
  const buckets = new Map<string, DailyTotal>();
  const [y, m, d] = todayIsoStr.split('-').map(Number);
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(y, m - 1, d - i);
    const { y: by, m: bm, d: bd } = localDateParts(date);
    const key = `${by}-${bm}-${bd}`;
    buckets.set(key, { dateIso: key, count: 0, totalSeconds: 0 });
  }
  for (const feed of feeds) {
    const key = localDateIso(feed.started_at);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.count += 1;
    bucket.totalSeconds += feed.left_seconds + feed.right_seconds;
  }
  return [...buckets.values()];
}
