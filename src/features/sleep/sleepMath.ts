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

export interface SleepSegment {
  kind: 'sleep' | 'pause';
  startedAt: string;
  endedAt: string | null;
  seconds: number;
}

function segmentSeconds(startedAt: string, endedAt: string | null, nowMs: number): number {
  const start = Date.parse(startedAt);
  const end = endedAt ? Date.parse(endedAt) : nowMs;
  return Math.max(0, Math.floor((end - start) / 1000));
}

/** Derives alternating sleep/pause segments between the sleep's start and its
 * end (or, for a running sleep, "now"), splitting the sleep span at each
 * pause. For an ended sleep, mirrors the previous edit-screen behavior:
 * pauses left open when the sleep was stopped (a rare stop-while-paused
 * case) are excluded rather than shown as a segment. For a running sleep, at
 * most one trailing pause may still be open, and it (or the trailing sleep
 * segment, if not paused) is returned with `endedAt: null` so callers can
 * render it ticking against their own `now`. */
export function deriveSegments(sleep: Sleep, pauses: SleepPause[], nowMs: number): SleepSegment[] {
  const running = sleep.ended_at === null;
  const boundary = sleep.ended_at ?? new Date(nowMs).toISOString();
  const relevant = running ? pauses : pauses.filter((p) => p.ended_at !== null);
  const sorted = [...relevant].sort((a, b) => Date.parse(a.started_at) - Date.parse(b.started_at));

  const segments: SleepSegment[] = [];
  let cursor: string | null = sleep.started_at;

  for (const pause of sorted) {
    segments.push({
      kind: 'sleep',
      startedAt: cursor,
      endedAt: pause.started_at,
      seconds: segmentSeconds(cursor, pause.started_at, nowMs),
    });
    if (pause.ended_at === null) {
      // Only possible when running: the trailing pause is still open.
      segments.push({
        kind: 'pause',
        startedAt: pause.started_at,
        endedAt: null,
        seconds: segmentSeconds(pause.started_at, null, nowMs),
      });
      cursor = null;
      break;
    }
    segments.push({
      kind: 'pause',
      startedAt: pause.started_at,
      endedAt: pause.ended_at,
      seconds: segmentSeconds(pause.started_at, pause.ended_at, nowMs),
    });
    cursor = pause.ended_at;
  }

  if (cursor !== null) {
    segments.push({
      kind: 'sleep',
      startedAt: cursor,
      endedAt: running ? null : boundary,
      seconds: segmentSeconds(cursor, running ? null : boundary, nowMs),
    });
  }

  return segments.filter((s) => s.endedAt === null || s.seconds > 0);
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
