import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { ClockDigits } from '@/components/ClockDigits';
import { PillButton } from '@/components/PillButton';
import { useNowTick } from '@/features/feeding/useNowTick';
import { timeHHmm } from '@/lib/dates';
import { formatDuration } from '@/lib/duration';
import { colors, fontFamily, fontSize, spacing, trackerColors } from '@/lib/theme';

import { deriveSegments, effectiveSleepSeconds, sleepState, type SleepSegment } from './sleepMath';
import { usePauseSleep, useResumeSleep, useStopSleep } from './hooks';
import type { SleepWithPauses } from './types';

const PAUSE_COLOR = '#c9922e';

function SegmentRow({ segment }: { segment: SleepSegment }) {
  const accent = segment.kind === 'sleep' ? trackerColors.sleep.accent : PAUSE_COLOR;
  return (
    <View style={styles.segmentRow}>
      <View style={[styles.dot, { backgroundColor: accent }]} />
      <Text style={styles.segmentLabel}>{segment.kind === 'sleep' ? 'Sleep' : 'Pause'}</Text>
      <Text style={styles.segmentRange}>
        {timeHHmm(segment.startedAt)}–{segment.endedAt ? timeHHmm(segment.endedAt) : 'now'}
      </Text>
      <Text style={styles.segmentDuration}>{formatDuration(segment.seconds)}</Text>
    </View>
  );
}

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
  const segments = deriveSegments(sleep, sleep.sleep_pauses, now);
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
      {segments.length > 0 ? (
        <View style={styles.segments}>
          {segments.map((segment, i) => (
            <SegmentRow key={`${segment.kind}-${segment.startedAt}-${i}`} segment={segment} />
          ))}
        </View>
      ) : null}
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
  segments: { gap: spacing.sm, marginTop: spacing.sm },
  segmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  segmentLabel: {
    flex: 1,
    color: colors.text,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
  },
  segmentRange: {
    color: colors.mutedDark,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
  },
  segmentDuration: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    marginLeft: spacing.sm,
    minWidth: 56,
    textAlign: 'right',
  },
});
