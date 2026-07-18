import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Card } from '@/components/Card';
import { useGrowthMeasurements } from '@/features/growth/hooks';
import type { GrowthMeasurement } from '@/features/growth/types';
import { colors, fontSize, spacing } from '@/lib/theme';

function latestSummary(m: GrowthMeasurement): string {
  const parts: string[] = [];
  if (m.weight_g != null) parts.push(`${(m.weight_g / 1000).toFixed(2)} kg`);
  if (m.height_cm != null) parts.push(`${m.height_cm} cm`);
  if (m.head_circumference_cm != null) parts.push(`head ${m.head_circumference_cm} cm`);
  return parts.join(' · ');
}

function relativeDays(dateIso: string): string {
  const days = Math.round((Date.now() - Date.parse(`${dateIso}T00:00:00`)) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
}

export function GrowthStatusCard({ babyId }: { babyId: string }) {
  const { data: measurements } = useGrowthMeasurements(babyId);
  const latest = measurements?.[measurements.length - 1];

  return (
    <Card onPress={() => router.push('/growth')}>
      <Text style={styles.title}>Growth</Text>
      {latest ? (
        <>
          <Text style={styles.value}>{latestSummary(latest)}</Text>
          <Text style={styles.meta}>{relativeDays(latest.measured_at)}</Text>
        </>
      ) : (
        <Text style={styles.meta}>No measurements yet — tap to add</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.sm, color: colors.muted, textTransform: 'uppercase' },
  value: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text },
  meta: { fontSize: fontSize.sm, color: colors.muted, marginTop: spacing.xs },
});
