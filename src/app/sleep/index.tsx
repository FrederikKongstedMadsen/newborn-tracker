import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { ClockDigits } from '@/components/ClockDigits';
import { IconChip } from '@/components/IconChip';
import { PillButton } from '@/components/PillButton';
import { Screen } from '@/components/Screen';
import { useBaby } from '@/features/baby/hooks';
import { useNowTick } from '@/features/feeding/useNowTick';
import { useProfileMap } from '@/features/profiles/hooks';
import { ActiveSleepCard } from '@/features/sleep/ActiveSleepCard';
import { useActiveSleep, useSleeps, useStartSleep } from '@/features/sleep/hooks';
import { SleepChart } from '@/features/sleep/SleepChart';
import { effectiveSleepSeconds, pauseSeconds } from '@/features/sleep/sleepMath';
import type { SleepWithPauses } from '@/features/sleep/types';
import { relativeTime, timeHHmm } from '@/lib/dates';
import { formatDuration } from '@/lib/duration';
import { colors, fontFamily, fontSize, spacing, trackerColors } from '@/lib/theme';

function SleepRow({ item, now }: { item: SleepWithPauses; now: number }) {
  const { data: profileMap } = useProfileMap();
  const profile = profileMap?.get(item.created_by);
  const nowMs = Date.parse(item.ended_at!);
  const duration = effectiveSleepSeconds(item, item.sleep_pauses, nowMs);
  const paused = pauseSeconds(item.sleep_pauses, nowMs);

  return (
    <Pressable style={styles.row} onPress={() => router.push(`/sleep/${item.id}`)}>
      <IconChip icon="moon" accent={trackerColors.sleep.accent} tint={trackerColors.sleep.tint} />
      <View style={styles.rowBody}>
        <Text style={styles.rowLine1}>
          <Text style={styles.rowDuration}>{formatDuration(duration)}</Text>
          <Text style={styles.rowMuted}> asleep</Text>
          {paused > 0 ? (
            <Text style={styles.rowMuted}> · {formatDuration(paused)} paused</Text>
          ) : null}
        </Text>
        <Text style={styles.rowRange}>
          {timeHHmm(item.started_at)}–{timeHHmm(item.ended_at!)}
        </Text>
      </View>
      <View style={styles.rowMeta}>
        <Text style={styles.rowWhen}>{relativeTime(item.ended_at ?? item.started_at, now)}</Text>
        <View style={styles.rowProfile}>
          <Avatar profile={profile} size={20} />
          <Text style={styles.rowName}>{profile?.display_name}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function SleepScreen() {
  const { data: baby } = useBaby();
  const { data: activeSleep } = useActiveSleep(baby?.id);
  const { data: sleeps } = useSleeps(baby?.id);
  const startSleep = useStartSleep();
  const { width } = useWindowDimensions();
  const now = useNowTick(false);

  return (
    <Screen scroll={false}>
      <FlatList
        style={styles.list}
        data={(sleeps ?? []).filter((s) => s.ended_at !== null)}
        keyExtractor={(s) => s.id}
        ListHeaderComponent={
          <View style={styles.header}>
            {activeSleep ? (
              <ActiveSleepCard sleep={activeSleep} />
            ) : (
              <Card>
                <Text style={styles.eyebrow}>READY</Text>
                <View style={styles.clockWrap}>
                  <ClockDigits seconds={0} />
                </View>
                <PillButton
                  title="Start sleep"
                  icon="moon"
                  disabled={!baby || startSleep.isPending}
                  onPress={() => startSleep.mutate({ babyId: baby!.id })}
                />
              </Card>
            )}
            <Card>
              <View style={styles.chartTitleRow}>
                <Text style={styles.chartTitle}>Sleep per day</Text>
                <Text style={styles.chartSubtitle}>hours · last 7 days</Text>
              </View>
              <SleepChart sleeps={sleeps ?? []} width={width - 32 - spacing.md * 2} />
            </Card>
            <Text style={styles.sectionLabel}>RECENT SLEEPS</Text>
          </View>
        }
        renderItem={({ item }) => <SleepRow item={item} now={now} />}
        ListEmptyComponent={<Text style={styles.empty}>No sleeps yet</Text>}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  header: { marginBottom: spacing.sm, gap: spacing.md },
  eyebrow: {
    textAlign: 'center',
    color: colors.muted,
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  clockWrap: { alignItems: 'center' },
  chartTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  chartTitle: { fontFamily: fontFamily.bold, fontSize: fontSize.md, color: colors.text },
  chartSubtitle: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.muted },
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
  rowLine1: {},
  rowDuration: { fontFamily: fontFamily.bold, fontSize: fontSize.md, color: colors.text },
  rowMuted: { color: colors.mutedDark, fontFamily: fontFamily.regular, fontSize: fontSize.md },
  rowRange: { color: colors.mutedDark, fontFamily: fontFamily.regular, fontSize: fontSize.sm },
  rowMeta: { alignItems: 'flex-end', gap: spacing.xs },
  rowWhen: { color: colors.muted, fontSize: fontSize.sm, fontFamily: fontFamily.regular },
  rowProfile: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  rowName: { color: colors.text, fontSize: fontSize.sm, fontFamily: fontFamily.regular },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 24 },
});
