import type { MedicineDose } from './types';

/** Fever threshold hardcoded per spec out-of-scope note (no age-based thresholds). */
export function isFever(celsius: number): boolean {
  return celsius >= 38.0;
}

/** "2.5 ml paracetamol" — `amount` as a plain number already drops a trailing
 * ".0" (String(2.0) === "2"), so whole amounts read as "2 ml" not "2.0 ml". */
export function doseSummary(dose: Pick<MedicineDose, 'amount' | 'unit' | 'medicine'>): string {
  return `${dose.amount} ${dose.unit} ${dose.medicine}`;
}
