import { doseSummary, isFever } from './sickMath';
import type { MedicineDose } from './types';

function dose(overrides: Partial<MedicineDose> = {}): MedicineDose {
  return {
    id: 'd1',
    baby_id: 'b1',
    given_at: '2026-07-18T10:00:00.000Z',
    medicine: 'paracetamol',
    amount: 2.5,
    unit: 'ml',
    note: null,
    created_by: 'u1',
    created_at: '2026-07-18T10:00:00.000Z',
    ...overrides,
  };
}

describe('isFever', () => {
  it('is false just below the threshold', () => {
    expect(isFever(37.9)).toBe(false);
  });

  it('is true at the threshold', () => {
    expect(isFever(38.0)).toBe(true);
  });
});

describe('doseSummary', () => {
  it('formats a fractional amount', () => {
    expect(doseSummary(dose({ amount: 2.5, unit: 'ml' }))).toBe('2.5 ml paracetamol');
  });

  it('trims a trailing .0', () => {
    expect(doseSummary(dose({ amount: 2, unit: 'ml' }))).toBe('2 ml paracetamol');
  });
});
