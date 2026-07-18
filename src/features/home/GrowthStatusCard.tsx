import { router } from 'expo-router';

import { useGrowthMeasurements } from '@/features/growth/hooks';
import type { GrowthMeasurement } from '@/features/growth/types';
import { relativeDays } from '@/lib/dates';

import { StatusCard } from './StatusCard';

// Percentile isn't shown here: computing "Nth percentile" requires inverting
// the WHO percentile curves to find which band the measured value falls
// between (curveValueAt only goes percentile -> value, not value ->
// percentile), which isn't a trivially clean addition. Relative-time meta
// keeps this card's data logic unchanged from before the redesign.
function latestSummary(m: GrowthMeasurement): string {
  if (m.weight_g != null) return `${(m.weight_g / 1000).toFixed(2)} kg`;
  if (m.height_cm != null) return `${m.height_cm} cm`;
  if (m.head_circumference_cm != null) return `head ${m.head_circumference_cm} cm`;
  return '—';
}

export function GrowthStatusCard({ babyId }: { babyId: string }) {
  const { data: measurements } = useGrowthMeasurements(babyId);
  const latest = measurements?.[measurements.length - 1];

  return (
    <StatusCard
      tracker="growth"
      value={latest ? latestSummary(latest) : '—'}
      meta={latest ? relativeDays(latest.measured_at) : 'No measurements yet — tap to add'}
      onPress={() => router.push('/growth')}
    />
  );
}
