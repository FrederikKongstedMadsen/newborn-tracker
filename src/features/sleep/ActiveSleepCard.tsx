import { Pressable, StyleSheet, Text } from 'react-native';

import { Card } from '@/components/Card';
import { useNowTick } from '@/features/feeding/useNowTick';
import { formatDuration } from '@/lib/duration';
import { colors, fontSize, spacing } from '@/lib/theme';

import { effectiveSleepSeconds, sleepState } from './sleepMath';
import { usePauseSleep, useResumeSleep, useStopSleep } from './hooks';
import type { SleepWithPauses } from './types';

interface Props {
  sleep: SleepWithPauses;
}

export function ActiveSleepCard({ sleep }: Props) {
  const now = useNowTick(true);
  const pauseSleep = usePauseSleep();
  const resumeSleep = useResumeSleep();
  const stopSleep = useStopSleep();

  const total = effectiveSleepSeconds(sleep, sleep.sleep_pauses, now);
  const state = sleepState(sleep, sleep.sleep_pauses);
  const openPause = sleep.sleep_pauses.find((pause) => pause.ended_at === null);
  const disabled = pauseSleep.isPending || resumeSleep.isPending || stopSleep.isPending;

  function pressToggle() {
    if (state === 'paused') {
      if (!openPause) return;
      resumeSleep.mutate({ pauseId: openPause.id });
    } else {
      pauseSleep.mutate({ sleepId: sleep.id });
    }
  }

  return (
    <Card>
      <Text style={styles.total}>{formatDuration(total)}</Text>
      {state === 'paused' && openPause ? (
        <Text style={styles.stateDanger}>
          Paused ·{' '}
          {formatDuration(Math.max(0, Math.floor((now - Date.parse(openPause.started_at)) / 1000)))}{' '}
          awake
        </Text>
      ) : (
        <Text style={styles.state}>Sleeping</Text>
      )}
      {pauseSleep.isError ? <Text style={styles.error}>{pauseSleep.error.message}</Text> : null}
      {resumeSleep.isError ? <Text style={styles.error}>{resumeSleep.error.message}</Text> : null}
      {stopSleep.isError ? <Text style={styles.error}>{stopSleep.error.message}</Text> : null}
      <Pressable
        style={[styles.toggle, disabled && styles.toggleDisabled]}
        disabled={disabled}
        onPress={pressToggle}
      >
        <Text style={styles.toggleLabel}>{state === 'paused' ? 'Resume' : 'Pause'}</Text>
      </Pressable>
      <Pressable
        style={[styles.stop, disabled && styles.stopDisabled]}
        disabled={disabled}
        onPress={() => stopSleep.mutate(sleep)}
      >
        <Text style={styles.stopLabel}>Stop</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  total: { fontSize: fontSize.xl, fontWeight: '700', textAlign: 'center' },
  state: { textAlign: 'center', color: colors.muted, marginBottom: spacing.sm },
  stateDanger: { textAlign: 'center', color: colors.danger, marginBottom: spacing.sm },
  toggle: {
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  toggleDisabled: { opacity: 0.5 },
  toggleLabel: { color: colors.primary, fontWeight: '600', fontSize: fontSize.md },
  stop: {
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.danger,
    alignItems: 'center',
  },
  stopDisabled: { opacity: 0.5 },
  stopLabel: { color: '#fff', fontWeight: '600', fontSize: fontSize.md },
  error: { color: colors.danger, fontSize: fontSize.sm },
});
