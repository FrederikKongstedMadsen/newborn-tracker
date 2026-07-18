import { curveValueAt } from './curveMath';
import { getCurve } from './curves';
import { PERCENTILES } from './types';

describe('vendored WHO curves', () => {
  it('covers 0-2 years for all six curve files', () => {
    for (const indicator of [
      'weight-for-age',
      'length-for-age',
      'head-circumference-for-age',
    ] as const) {
      for (const sex of ['male', 'female'] as const) {
        const curve = getCurve(indicator, sex);
        expect(curve.points[0].ageDays).toBe(0);
        expect(curve.points[curve.points.length - 1].ageDays).toBeGreaterThanOrEqual(730);
      }
    }
  });

  it('percentiles are strictly increasing at every point', () => {
    const curve = getCurve('weight-for-age', 'male');
    for (const point of curve.points) {
      for (let i = 1; i < PERCENTILES.length; i++) {
        expect(point[PERCENTILES[i]]).toBeGreaterThan(point[PERCENTILES[i - 1]]);
      }
    }
  });

  it('matches known WHO medians (±0.2)', () => {
    // WHO: boys weight-for-age P50 at birth ≈ 3.3 kg, at 1 year ≈ 9.6 kg
    expect(curveValueAt(getCurve('weight-for-age', 'male').points, 'p50', 0)).toBeCloseTo(3.3, 1);
    expect(curveValueAt(getCurve('weight-for-age', 'male').points, 'p50', 365)).toBeCloseTo(9.6, 1);
    // WHO: girls length-for-age P50 at birth ≈ 49.1 cm
    expect(curveValueAt(getCurve('length-for-age', 'female').points, 'p50', 0)).toBeCloseTo(
      49.1,
      1,
    );
  });
});
