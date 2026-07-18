export type Percentile = 'p3' | 'p15' | 'p50' | 'p85' | 'p97';

export type Indicator = 'weight-for-age' | 'length-for-age' | 'head-circumference-for-age';

export interface CurvePoint {
  ageDays: number;
  p3: number;
  p15: number;
  p50: number;
  p85: number;
  p97: number;
}

export interface WhoCurve {
  indicator: Indicator;
  sex: 'male' | 'female';
  unit: 'kg' | 'cm';
  points: CurvePoint[]; // ascending ageDays
}

export const PERCENTILES: Percentile[] = ['p3', 'p15', 'p50', 'p85', 'p97'];
