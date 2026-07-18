import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { IconChip } from '@/components/IconChip';
import { PillButton } from '@/components/PillButton';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { useBaby } from '@/features/baby/hooks';
import { useNowTick } from '@/features/feeding/useNowTick';
import { GrowthChart } from '@/features/growth/GrowthChart';
import { useGrowthMeasurements } from '@/features/growth/hooks';
import type { GrowthMeasurement } from '@/features/growth/types';
import type { Indicator } from '@/features/growth/who/types';
import { useProfileMap } from '@/features/profiles/hooks';
import { relativeTime } from '@/lib/dates';
import { colors, fontFamily, fontSize, radius, spacing, trackerColors } from '@/lib/theme';

const INDICATORS: { value: Indicator; label: string }[] = [
  { value: 'weight-for-age', label: 'Weight' },
  { value: 'length-for-age', label: 'Height' },
  { value: 'head-circumference-for-age', label: 'Head' },
];

function summary(m: GrowthMeasurement): string {
  const parts: string[] = [];
  if (m.weight_g != null) parts.push(`${(m.weight_g / 1000).toFixed(2)} kg`);
  if (m.height_cm != null) parts.push(`${m.height_cm} cm`);
  if (m.head_circumference_cm != null) parts.push(`head ${m.head_circumference_cm} cm`);
  return parts.join(' · ');
}

function GrowthRow({ item, now }: { item: GrowthMeasurement; now: number }) {
  const { data: profileMap } = useProfileMap();
  const profile = profileMap?.get(item.created_by);

  return (
    <Pressable style={styles.row} onPress={() => router.push(`/growth/${item.id}`)}>
      <IconChip
        icon={trackerColors.growth.icon}
        accent={trackerColors.growth.accent}
        tint={trackerColors.growth.tint}
      />
      <View style={styles.rowBody}>
        <Text style={styles.rowSummary}>{summary(item)}</Text>
        <Text style={styles.rowDate}>{item.measured_at}</Text>
      </View>
      <View style={styles.rowMeta}>
        <Text style={styles.rowWhen}>{relativeTime(item.measured_at, now)}</Text>
        <View style={styles.rowProfile}>
          <Avatar profile={profile} size={20} />
          <Text style={styles.rowName}>{profile?.display_name}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function GrowthScreen() {
  const { data: baby } = useBaby();
  const { data: measurements } = useGrowthMeasurements(baby?.id);
  const [indicator, setIndicator] = useState<Indicator>('weight-for-age');
  const { width } = useWindowDimensions();
  const now = useNowTick(false);

  return (
    <Screen scroll={false} topInset>
      <View style={styles.titleRow}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.heading}>Growth</Text>
      </View>
      <FlatList
        style={styles.list}
        data={[...(measurements ?? [])].reverse()}
        keyExtractor={(m) => m.id}
        ListHeaderComponent={
          baby ? (
            <View style={styles.header}>
              <SegmentedControl
                options={INDICATORS.map((opt) => opt.label)}
                selected={INDICATORS.find((opt) => opt.value === indicator)!.label}
                onSelect={(label) =>
                  setIndicator(INDICATORS.find((opt) => opt.label === label)!.value)
                }
              />
              <GrowthChart
                indicator={indicator}
                sex={baby.sex}
                birthDate={baby.birth_date}
                measurements={measurements ?? []}
                width={width - 32}
                height={260}
              />
              <PillButton
                title="Add measurement"
                icon="add"
                onPress={() => router.push('/growth/new')}
              />
              <Text style={styles.sectionLabel}>MEASUREMENTS</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => <GrowthRow item={item} now={now} />}
        ListEmptyComponent={<Text style={styles.empty}>No measurements yet</Text>}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#221f1b',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  heading: { fontSize: fontSize.xl, fontFamily: fontFamily.bold, color: colors.text },
  header: { marginBottom: spacing.sm, gap: spacing.md },
  sectionLabel: {
    color: colors.muted,
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm + spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowBody: { flex: 1, gap: 2 },
  rowSummary: { fontFamily: fontFamily.bold, fontSize: fontSize.md, color: colors.text },
  rowDate: { color: colors.mutedDark, fontFamily: fontFamily.regular, fontSize: fontSize.sm },
  rowMeta: { alignItems: 'flex-end', gap: spacing.xs },
  rowWhen: { color: colors.muted, fontSize: fontSize.sm, fontFamily: fontFamily.regular },
  rowProfile: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  rowName: { color: colors.text, fontSize: fontSize.sm, fontFamily: fontFamily.regular },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 24 },
});
