import { localDateIso, localDateParts } from '@/lib/dates';
import { formatDuration } from '@/lib/duration';

import type { Sleep, SleepPause, SleepWithPauses } from './types';

export function pauseSeconds(pauses: SleepPause[], nowMs: number): number {
  return pauses.reduce((sum, p) => {
    const start = Date.parse(p.started_at);
    const end = p.ended_at ? Date.parse(p.ended_at) : nowMs;
    return sum + Math.max(0, Math.floor((end - start) / 1000));
  }, 0);
}

export function effectiveSleepSeconds(sleep: Sleep, pauses: SleepPause[], nowMs: number): number {
  const start = Date.parse(sleep.started_at);
  const end = sleep.ended_at ? Date.parse(sleep.ended_at) : nowMs;
  const elapsed = Math.floor((end - start) / 1000);
  return Math.max(0, elapsed - pauseSeconds(pauses, nowMs));
}

export function sleepState(sleep: Sleep, pauses: SleepPause[]): 'running' | 'paused' | 'ended' {
  if (sleep.ended_at) return 'ended';
  if (pauses.some((p) => p.ended_at === null)) return 'paused';
  return 'running';
}

export function sleepSummary(sleep: Sleep, pauses: SleepPause[], nowMs: number): string {
  const duration = formatDuration(effectiveSleepSeconds(sleep, pauses, nowMs));
  const n = pauses.length;
  if (n === 0) return duration;
  return `${duration} · ${n} pause${n === 1 ? '' : 's'}`;
}

export interface DailySleepTotal {
  dateIso: string;
  count: number;
  totalSeconds: number;
}

export function dailySleepTotals(
  sleeps: SleepWithPauses[],
  days: number,
  todayIsoStr: string,
  nowMs: number,
): DailySleepTotal[] {
  const buckets = new Map<string, DailySleepTotal>();
  const [y, m, d] = todayIsoStr.split('-').map(Number);
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(y, m - 1, d - i);
    const { y: by, m: bm, d: bd } = localDateParts(date);
    const key = `${by}-${bm}-${bd}`;
    buckets.set(key, { dateIso: key, count: 0, totalSeconds: 0 });
  }
  for (const sleep of sleeps) {
    const key = localDateIso(sleep.started_at);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.count += 1;
    bucket.totalSeconds += effectiveSleepSeconds(sleep, sleep.sleep_pauses, nowMs);
  }
  return [...buckets.values()];
}
