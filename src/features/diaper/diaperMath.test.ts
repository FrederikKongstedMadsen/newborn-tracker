import { localDateIso } from '@/lib/dates';

import { todayCount } from './diaperMath';
import type { Diaper } from './types';

// Build timestamps from local calendar components (not raw UTC strings) so
// these tests hold regardless of the machine's timezone — mirrors feedMath's
// dailyTotals tests.
function localIso(y: number, m: number, d: number, h: number, min = 0): string {
  return new Date(y, m - 1, d, h, min).toISOString();
}

const TODAY_ISO = localDateIso(localIso(2026, 7, 18, 10));

const base: Diaper = {
  id: 'd1',
  baby_id: 'b1',
  happened_at: localIso(2026, 7, 18, 10),
  type: 'pee',
  note: null,
  created_by: 'u1',
  created_at: localIso(2026, 7, 18, 10),
};

describe('todayCount', () => {
  it('returns 0 for an empty list', () => {
    expect(todayCount([], TODAY_ISO)).toBe(0);
  });

  it('counts entries whose local date matches todayIsoStr', () => {
    const diapers: Diaper[] = [
      base,
      { ...base, id: 'd2', happened_at: localIso(2026, 7, 18, 23, 59) },
      { ...base, id: 'd3', happened_at: localIso(2026, 7, 18, 0, 0) },
    ];
    expect(todayCount(diapers, TODAY_ISO)).toBe(3);
  });

  it('excludes entries from yesterday (just before local midnight)', () => {
    const diapers: Diaper[] = [
      base,
      { ...base, id: 'd2', happened_at: localIso(2026, 7, 17, 23, 59) },
    ];
    expect(todayCount(diapers, TODAY_ISO)).toBe(1);
  });

  it('excludes entries from tomorrow (just after local midnight)', () => {
    const diapers: Diaper[] = [
      base,
      { ...base, id: 'd2', happened_at: localIso(2026, 7, 19, 0, 1) },
    ];
    expect(todayCount(diapers, TODAY_ISO)).toBe(1);
  });
});
