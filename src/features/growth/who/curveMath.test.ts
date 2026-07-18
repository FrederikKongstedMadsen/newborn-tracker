import { ageInDays, curveValueAt } from './curveMath';
import type { CurvePoint } from './types';

const points: CurvePoint[] = [
  { ageDays: 0, p3: 2.5, p15: 2.9, p50: 3.3, p85: 3.9, p97: 4.3 },
  { ageDays: 30, p3: 3.4, p15: 3.9, p50: 4.5, p85: 5.1, p97: 5.7 },
  { ageDays: 60, p3: 4.4, p15: 4.9, p50: 5.6, p85: 6.3, p97: 7.0 },
];

describe('ageInDays', () => {
  it('is 0 on the birth date', () => {
    expect(ageInDays('2026-07-01', '2026-07-01')).toBe(0);
  });

  it('counts calendar days', () => {
    expect(ageInDays('2026-07-01', '2026-07-18')).toBe(17);
  });

  it('crosses month and DST boundaries safely', () => {
    expect(ageInDays('2026-02-27', '2026-03-02')).toBe(3);
    expect(ageInDays('2026-03-28', '2026-03-30')).toBe(2); // European DST switch
  });
});

describe('curveValueAt', () => {
  it('returns exact value at a data point', () => {
    expect(curveValueAt(points, 'p50', 30)).toBe(4.5);
  });

  it('interpolates linearly between points', () => {
    expect(curveValueAt(points, 'p50', 15)).toBeCloseTo(3.9, 5);
  });

  it('returns null outside the data range', () => {
    expect(curveValueAt(points, 'p50', -1)).toBeNull();
    expect(curveValueAt(points, 'p50', 61)).toBeNull();
  });
});
