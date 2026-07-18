export interface GrowthMeasurement {
  id: string;
  baby_id: string;
  measured_at: string; // 'YYYY-MM-DD'
  weight_g: number | null;
  height_cm: number | null;
  head_circumference_cm: number | null;
  note: string | null;
  created_by: string;
  created_at: string;
}

export type NewGrowthMeasurement = Pick<
  GrowthMeasurement,
  'baby_id' | 'measured_at' | 'weight_g' | 'height_cm' | 'head_circumference_cm' | 'note'
>;
