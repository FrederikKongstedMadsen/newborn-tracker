import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { ClockDigits } from '@/components/ClockDigits';
import { PillButton } from '@/components/PillButton';
import { useNowTick } from '@/features/feeding/useNowTick';
import { formatDuration } from '@/lib/duration';
import { colors, fontFamily, fontSize, spacing } from '@/lib/theme';

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
  const paused = state === 'paused' && !!openPause;

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
      <Text style={styles.eyebrow}>{paused ? 'PAUSED' : 'ASLEEP'}</Text>
      <View style={styles.clockWrap}>
        <ClockDigits seconds={total} />
      </View>
      {paused ? (
        <Text style={styles.pausedLine}>
          Paused ·{' '}
          {formatDuration(Math.max(0, Math.floor((now - Date.parse(openPause.started_at)) / 1000)))}{' '}
          awake
        </Text>
      ) : null}
      {pauseSleep.isError ? <Text style={styles.error}>{pauseSleep.error.message}</Text> : null}
      {resumeSleep.isError ? <Text style={styles.error}>{resumeSleep.error.message}</Text> : null}
      {stopSleep.isError ? <Text style={styles.error}>{stopSleep.error.message}</Text> : null}
      <PillButton
        title={state === 'paused' ? 'Resume' : 'Pause'}
        variant="neutral"
        disabled={disabled}
        onPress={pressToggle}
      />
      <PillButton
        title="Stop"
        variant="danger"
        disabled={disabled}
        onPress={() => stopSleep.mutate(sleep)}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    textAlign: 'center',
    color: colors.muted,
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  clockWrap: { alignItems: 'center' },
  pausedLine: {
    textAlign: 'center',
    color: colors.mutedDark,
    marginBottom: spacing.sm,
  },
  error: { color: colors.danger, fontSize: fontSize.sm },
});
