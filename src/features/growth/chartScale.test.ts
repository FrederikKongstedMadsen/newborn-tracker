import { makeScale } from './chartScale';

describe('makeScale', () => {
  it('maps domain to range linearly', () => {
    const scale = makeScale([0, 10], [0, 100]);
    expect(scale(0)).toBe(0);
    expect(scale(5)).toBe(50);
    expect(scale(10)).toBe(100);
  });

  it('supports inverted ranges (svg y axis)', () => {
    const scale = makeScale([0, 10], [200, 0]);
    expect(scale(0)).toBe(200);
    expect(scale(10)).toBe(0);
  });
});
