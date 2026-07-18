import { doseSummary, tempInfo } from './sickMath';
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

describe('tempInfo', () => {
  it('is Normal just below the raised threshold', () => {
    expect(tempInfo(37.4)).toEqual({ label: 'Normal', color: '#3a8a6f' });
  });

  it('is Raised at the raised threshold', () => {
    expect(tempInfo(37.5)).toEqual({ label: 'Raised', color: '#c9922e' });
  });

  it('is Raised just below the fever threshold', () => {
    expect(tempInfo(37.9)).toEqual({ label: 'Raised', color: '#c9922e' });
  });

  it('is Fever at the fever threshold', () => {
    expect(tempInfo(38.0)).toEqual({ label: 'Fever', color: '#cf6257' });
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
