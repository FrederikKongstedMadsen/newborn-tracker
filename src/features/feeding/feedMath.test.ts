import { localDateIso } from '@/lib/dates';

import { dailyTotals, feedSummary, sideElapsedSeconds, totalElapsedSeconds } from './feedMath';
import type { Feed } from './types';

const base: Feed = {
  id: 'f1',
  baby_id: 'b1',
  type: 'breast',
  started_at: '2026-07-18T10:00:00.000Z',
  ended_at: null,
  left_seconds: 300,
  right_seconds: 120,
  volume_ml: null,
  active_side: 'left',
  active_side_started_at: '2026-07-18T10:07:00.000Z',
  note: null,
  created_by: 'u1',
  created_at: '2026-07-18T10:00:00.000Z',
};
const NOW = Date.parse('2026-07-18T10:08:30.000Z'); // 90s after side start

describe('sideElapsedSeconds', () => {
  it('adds running time to the active side only', () => {
    expect(sideElapsedSeconds(base, 'left', NOW)).toBe(390);
    expect(sideElapsedSeconds(base, 'right', NOW)).toBe(120);
  });

  it('returns banked seconds when feed ended', () => {
    const ended: Feed = {
      ...base,
      ended_at: '2026-07-18T10:20:00.000Z',
      active_side: null,
      active_side_started_at: null,
    };
    expect(sideElapsedSeconds(ended, 'left', NOW)).toBe(300);
  });
});

describe('totalElapsedSeconds', () => {
  it('sums both sides including running share', () => {
    expect(totalElapsedSeconds(base, NOW)).toBe(510);
  });
});

describe('feedSummary', () => {
  it('summarizes breast feeds per side', () => {
    const ended: Feed = {
      ...base,
      ended_at: '2026-07-18T10:20:00.000Z',
      active_side: null,
      active_side_started_at: null,
      left_seconds: 720,
      right_seconds: 480,
    };
    expect(feedSummary(ended)).toBe('L 12m · R 8m');
  });
  it('summarizes formula feeds by volume', () => {
    const formula: Feed = {
      ...base,
      type: 'formula',
      volume_ml: 80,
      active_side: null,
      active_side_started_at: null,
      ended_at: base.started_at,
      left_seconds: 0,
      right_seconds: 0,
    };
    expect(feedSummary(formula)).toBe('80 ml');
  });
});

describe('dailyTotals', () => {
  it('buckets the last N days including empty days, oldest first', () => {
    const feeds: Feed[] = [
      {
        ...base,
        ended_at: '2026-07-18T10:20:00.000Z',
        active_side: null,
        active_side_started_at: null,
      }, // today, 420s banked
      {
        ...base,
        id: 'f2',
        started_at: '2026-07-16T08:00:00.000Z',
        ended_at: '2026-07-16T08:10:00.000Z',
        active_side: null,
        active_side_started_at: null,
        left_seconds: 600,
        right_seconds: 0,
      },
    ];
    const totals = dailyTotals(feeds, 3, '2026-07-18');
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
  });
});
