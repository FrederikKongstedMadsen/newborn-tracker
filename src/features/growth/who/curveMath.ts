import type { CurvePoint, Percentile } from './types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Both dates as 'YYYY-MM-DD'. Parsed as UTC so DST never shifts the count. */
export function ageInDays(birthDate: string, at: string): number {
  const birth = Date.parse(`${birthDate}T00:00:00Z`);
  const then = Date.parse(`${at}T00:00:00Z`);
  return Math.round((then - birth) / MS_PER_DAY);
}

export function curveValueAt(
  points: CurvePoint[],
  percentile: Percentile,
  ageDays: number,
): number | null {
  if (points.length === 0) return null;
  if (ageDays < points[0].ageDays || ageDays > points[points.length - 1].ageDays) return null;

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (ageDays >= a.ageDays && ageDays <= b.ageDays) {
      const t = b.ageDays === a.ageDays ? 0 : (ageDays - a.ageDays) / (b.ageDays - a.ageDays);
      return a[percentile] + t * (b[percentile] - a[percentile]);
    }
  }
  return null;
}
