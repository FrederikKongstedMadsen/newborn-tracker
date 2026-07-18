import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Card } from '@/components/Card';
import { useNowTick } from '@/features/feeding/useNowTick';
import { useActiveSleep, useSleeps } from '@/features/sleep/hooks';
import { effectiveSleepSeconds, sleepState, sleepSummary } from '@/features/sleep/sleepMath';
import { relativeTime } from '@/lib/dates';
import { formatDuration } from '@/lib/duration';
import { colors, fontSize, spacing } from '@/lib/theme';

export function SleepStatusCard({ babyId }: { babyId: string }) {
  const { data: activeSleep } = useActiveSleep(babyId);
  const { data: sleeps } = useSleeps(babyId);
  const now = useNowTick(!!activeSleep);
  const latest = sleeps?.[0];

  const state = activeSleep ? sleepState(activeSleep, activeSleep.sleep_pauses) : null;
  const openPause = activeSleep?.sleep_pauses.find((pause) => pause.ended_at === null);

  return (
    <Card onPress={() => router.push('/sleep')}>
      <Text style={styles.title}>Sleep</Text>
      {activeSleep ? (
        state === 'paused' && openPause ? (
          <Text style={styles.value}>
            Paused ·{' '}
            {formatDuration(
              Math.max(0, Math.floor((now - Date.parse(openPause.started_at)) / 1000)),
            )}{' '}
            awake
          </Text>
        ) : (
          <Text style={styles.value}>
            Sleeping ·{' '}
            {formatDuration(effectiveSleepSeconds(activeSleep, activeSleep.sleep_pauses, now))}
          </Text>
        )
      ) : latest ? (
        <>
          <Text style={styles.value}>
            {sleepSummary(latest, latest.sleep_pauses, Date.parse(latest.ended_at!))}
          </Text>
          <Text style={styles.meta}>{relativeTime(latest.ended_at ?? latest.started_at, now)}</Text>
        </>
      ) : (
        <Text style={styles.meta}>No sleeps yet — tap to start</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.sm, color: colors.muted, textTransform: 'uppercase' },
  value: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text },
  meta: { fontSize: fontSize.sm, color: colors.muted, marginTop: spacing.xs },
});
