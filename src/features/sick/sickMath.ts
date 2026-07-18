import type { MedicineDose } from './types';

/** Temperature tiers hardcoded per spec out-of-scope note (no age-based thresholds). */
export function tempInfo(celsius: number): { label: 'Normal' | 'Raised' | 'Fever'; color: string } {
  if (celsius < 37.5) return { label: 'Normal', color: '#3a8a6f' };
  if (celsius < 38.0) return { label: 'Raised', color: '#c9922e' };
  return { label: 'Fever', color: '#cf6257' };
}

/** "2.5 ml paracetamol" — `amount` as a plain number already drops a trailing
 * ".0" (String(2.0) === "2"), so whole amounts read as "2 ml" not "2.0 ml". */
export function doseSummary(dose: Pick<MedicineDose, 'amount' | 'unit' | 'medicine'>): string {
  return `${dose.amount} ${dose.unit} ${dose.medicine}`;
}
