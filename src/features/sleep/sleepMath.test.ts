import { localDateIso } from '@/lib/dates';

import {
  dailySleepTotals,
  effectiveSleepSeconds,
  pauseSeconds,
  sleepState,
  sleepSummary,
} from './sleepMath';
import type { Sleep, SleepPause, SleepWithPauses } from './types';

const base: Sleep = {
  id: 's1',
  baby_id: 'b1',
  started_at: '2026-07-18T10:00:00.000Z',
  ended_at: null,
  note: null,
  created_by: 'u1',
  created_at: '2026-07-18T10:00:00.000Z',
};

function pause(overrides: Partial<SleepPause> = {}): SleepPause {
  return {
    id: 'p1',
    sleep_id: 's1',
    started_at: '2026-07-18T10:05:00.000Z',
    ended_at: '2026-07-18T10:05:30.000Z',
    created_at: '2026-07-18T10:05:00.000Z',
    ...overrides,
  };
}

describe('pauseSeconds', () => {
  it('sums closed pauses in whole seconds, floored', () => {
    const pauses = [
      pause({
        started_at: '2026-07-18T10:05:00.000Z',
        ended_at: '2026-07-18T10:05:30.400Z', // 30.4s -> floor 30
      }),
      pause({
        id: 'p2',
        started_at: '2026-07-18T10:10:00.000Z',
        ended_at: '2026-07-18T10:10:10.000Z', // 10s
      }),
    ];
    const nowMs = Date.parse('2026-07-18T11:00:00.000Z');
    expect(pauseSeconds(pauses, nowMs)).toBe(40);
  });

  it('counts an open pause up to now', () => {
    const pauses = [
      pause({
        started_at: '2026-07-18T10:05:00.000Z',
        ended_at: null,
      }),
    ];
    const nowMs = Date.parse('2026-07-18T10:05:20.000Z'); // 20s so far
    expect(pauseSeconds(pauses, nowMs)).toBe(20);
  });

  it('clamps a pause that started after nowMs to 0', () => {
    const pauses = [
      pause({
        started_at: '2026-07-18T12:00:00.000Z',
        ended_at: null,
      }),
    ];
    const nowMs = Date.parse('2026-07-18T11:00:00.000Z'); // before pause start
    expect(pauseSeconds(pauses, nowMs)).toBe(0);
  });

  it('returns 0 for no pauses', () => {
    expect(pauseSeconds([], Date.now())).toBe(0);
  });
});

describe('effectiveSleepSeconds', () => {
  it('computes running elapsed time minus pauses', () => {
    const nowMs = Date.parse('2026-07-18T10:10:00.000Z'); // 600s after start
    const pauses = [
      pause({
        started_at: '2026-07-18T10:05:00.000Z',
        ended_at: '2026-07-18T10:05:30.400Z', // 30s floored
      }),
    ];
    expect(effectiveSleepSeconds(base, pauses, nowMs)).toBe(600 - 30);
  });

  it('computes ended sleep elapsed time from ended_at, ignoring nowMs', () => {
    const ended: Sleep = { ...base, ended_at: '2026-07-18T10:20:00.000Z' }; // 1200s
    const nowMs = Date.parse('2026-07-18T12:00:00.000Z');
    expect(effectiveSleepSeconds(ended, [], nowMs)).toBe(1200);
  });

  it('counts an open pause reducing progress so far', () => {
    const nowMs = Date.parse('2026-07-18T10:05:20.000Z'); // 320s elapsed
    const pauses = [
      pause({
        started_at: '2026-07-18T10:05:00.000Z',
        ended_at: null, // 20s open pause
      }),
    ];
    expect(effectiveSleepSeconds(base, pauses, nowMs)).toBe(320 - 20);
  });

  it('pins floor over round with a fractional-second delta', () => {
    const start = Date.parse(base.started_at);
    const nowMs = start + 90_400; // 90.4s
    expect(effectiveSleepSeconds(base, [], nowMs)).toBe(90);
  });

  it('clamps to 0 when pauses exceed elapsed time', () => {
    const nowMs = Date.parse('2026-07-18T10:00:05.000Z'); // 5s elapsed
    const pauses = [
      pause({
        started_at: '2026-07-18T10:00:00.000Z',
        ended_at: '2026-07-18T10:05:00.000Z', // 300s, larger than elapsed
      }),
    ];
    expect(effectiveSleepSeconds(base, pauses, nowMs)).toBe(0);
  });
});

describe('sleepState', () => {
  it('is "ended" when ended_at is set', () => {
    const ended: Sleep = { ...base, ended_at: '2026-07-18T10:20:00.000Z' };
    expect(sleepState(ended, [])).toBe('ended');
  });

  it('is "paused" when an open pause exists and sleep is not ended', () => {
    const pauses = [pause({ ended_at: null })];
    expect(sleepState(base, pauses)).toBe('paused');
  });

  it('is "running" when no open pauses and not ended', () => {
    const pauses = [pause({ ended_at: '2026-07-18T10:05:30.000Z' })];
    expect(sleepState(base, pauses)).toBe('running');
  });

  it('is "running" with no pauses at all', () => {
    expect(sleepState(base, [])).toBe('running');
  });
});

describe('sleepSummary', () => {
  it('has no pause suffix at 0 pauses', () => {
    const nowMs = Date.parse('2026-07-18T10:05:00.000Z'); // 300s
    expect(sleepSummary(base, [], nowMs)).toBe('5m');
  });

  it('uses singular "1 pause" for exactly one pause', () => {
    const nowMs = Date.parse('2026-07-18T10:05:00.000Z');
    const pauses = [pause()];
    expect(sleepSummary(base, pauses, nowMs)).toBe('4m · 1 pause');
  });

  it('uses plural "N pauses" for more than one pause', () => {
    const nowMs = Date.parse('2026-07-18T10:20:00.000Z');
    const pauses = [
      pause({ started_at: '2026-07-18T10:05:00.000Z', ended_at: '2026-07-18T10:05:30.000Z' }),
      pause({
        id: 'p2',
        started_at: '2026-07-18T10:10:00.000Z',
        ended_at: '2026-07-18T10:10:30.000Z',
      }),
    ];
    expect(sleepSummary(base, pauses, nowMs)).toBe('19m · 2 pauses');
  });
});

describe('dailySleepTotals', () => {
  it('buckets the last N days including an empty middle day, oldest first', () => {
    const sleeps: SleepWithPauses[] = [
      {
        ...base,
        id: 's-today',
        started_at: '2026-07-18T10:00:00.000Z',
        ended_at: '2026-07-18T10:07:00.000Z', // 420s
        sleep_pauses: [],
      },
      {
        ...base,
        id: 's-old',
        started_at: '2026-07-16T08:00:00.000Z',
        ended_at: '2026-07-16T08:10:00.000Z', // 600s
        sleep_pauses: [],
      },
    ];
    const nowMs = Date.parse('2026-07-18T12:00:00.000Z');
    const totals = dailySleepTotals(sleeps, 3, '2026-07-18', nowMs);
    expect(totals).toHaveLength(3);
    expect(totals[0]).toEqual({
      dateIso: localDateIso('2026-07-16T08:00:00.000Z'),
      count: 1,
      totalSeconds: 600,
    });
    expect(totals[1]).toEqual({
      dateIso: localDateIso('2026-07-17T12:00:00.000Z'),
      count: 0,
      totalSeconds: 0,
    });
    expect(totals[2].dateIso).toBe(localDateIso('2026-07-18T10:00:00.000Z'));
    expect(totals[2].count).toBe(1);
    expect(totals[2].totalSeconds).toBe(420);
  });

  it('counts a running sleep as progress-so-far', () => {
    const sleeps: SleepWithPauses[] = [
      {
        ...base,
        id: 's-running',
        started_at: '2026-07-18T10:00:00.000Z',
        ended_at: null,
        sleep_pauses: [],
      },
    ];
    const nowMs = Date.parse('2026-07-18T10:02:00.000Z'); // 120s so far
    const totals = dailySleepTotals(sleeps, 1, '2026-07-18', nowMs);
    expect(totals[0].totalSeconds).toBe(120);
    expect(totals[0].count).toBe(1);
  });
});
