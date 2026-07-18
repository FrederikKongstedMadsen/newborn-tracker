import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { ClockDigits } from '@/components/ClockDigits';
import { PillButton } from '@/components/PillButton';
import { formatClock } from '@/lib/clock';
import { colors, fontFamily, fontSize, radius, spacing, trackerColors } from '@/lib/theme';

import { sideElapsedSeconds, totalElapsedSeconds } from './feedMath';
import { usePauseFeed, useStartBreastFeed, useStopFeed, useToggleSide } from './hooks';
import type { Feed, FeedSide } from './types';
import { useNowTick } from './useNowTick';

interface Props {
  babyId: string | undefined;
  feed: Feed | null | undefined;
}

interface SideBoxProps {
  label: string;
  seconds: number;
  active: boolean;
  disabled: boolean;
  onPress: () => void;
}

function SideBox({ label, seconds, active, disabled, onPress }: SideBoxProps) {
  return (
    <Pressable
      style={[styles.side, active && styles.sideActive]}
      disabled={disabled}
      onPress={onPress}
    >
      <Text style={[styles.sideLabel, active && styles.sideLabelActive]}>{label}</Text>
      <Text style={[styles.sideDigits, active && styles.sideDigitsActive]}>
        {formatClock(seconds)}
      </Text>
    </Pressable>
  );
}

export function BreastFeedCard({ babyId, feed }: Props) {
  const now = useNowTick(!!feed);
  const startBreastFeed = useStartBreastFeed();
  const toggleSide = useToggleSide();
  const pauseFeed = usePauseFeed();
  const stopFeed = useStopFeed();

  const total = feed ? totalElapsedSeconds(feed, now) : 0;
  const left = feed ? sideElapsedSeconds(feed, 'left', now) : 0;
  const right = feed ? sideElapsedSeconds(feed, 'right', now) : 0;
  const disabled =
    startBreastFeed.isPending || toggleSide.isPending || pauseFeed.isPending || stopFeed.isPending;
  const paused = !!feed && feed.active_side === null;

  function pressSide(side: FeedSide) {
    if (!feed) {
      if (!babyId) return;
      startBreastFeed.mutate({ babyId, side });
      return;
    }
    if (feed.active_side === side) {
      pauseFeed.mutate(feed);
      return;
    }
    toggleSide.mutate({ feed, side });
  }

  return (
    <Card>
      <View style={styles.clockWrap}>
        <ClockDigits seconds={total} />
      </View>
      {!feed ? <Text style={styles.hint}>Tap a side to start</Text> : null}
      {paused ? <Text style={styles.hint}>Paused — tap a side to resume</Text> : null}
      <View style={styles.sides}>
        <SideBox
          label="LEFT"
          seconds={left}
          active={feed?.active_side === 'left'}
          disabled={disabled || (!feed && !babyId)}
          onPress={() => pressSide('left')}
        />
        <SideBox
          label="RIGHT"
          seconds={right}
          active={feed?.active_side === 'right'}
          disabled={disabled || (!feed && !babyId)}
          onPress={() => pressSide('right')}
        />
      </View>
      {startBreastFeed.isError ? (
        <Text style={styles.error}>{startBreastFeed.error.message}</Text>
      ) : null}
      {toggleSide.isError ? <Text style={styles.error}>{toggleSide.error.message}</Text> : null}
      {pauseFeed.isError ? <Text style={styles.error}>{pauseFeed.error.message}</Text> : null}
      {stopFeed.isError ? <Text style={styles.error}>{stopFeed.error.message}</Text> : null}
      {feed && !paused ? (
        <PillButton
          title="Pause"
          variant="neutral"
          disabled={disabled}
          onPress={() => pauseFeed.mutate(feed)}
        />
      ) : null}
      {feed ? (
        <PillButton
          title="Stop"
          variant="danger"
          disabled={disabled}
          onPress={() => stopFeed.mutate(feed)}
        />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  clockWrap: { alignItems: 'center' },
  hint: {
    textAlign: 'center',
    color: colors.mutedDark,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    marginBottom: spacing.sm,
  },
  sides: { flexDirection: 'row', gap: spacing.sm },
  side: {
    flex: 1,
    paddingVertical: spacing.sm + spacing.xs,
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    gap: spacing.xs,
  },
  sideActive: {
    borderColor: trackerColors.feeding.accent,
    backgroundColor: trackerColors.feeding.tint,
  },
  sideLabel: {
    color: colors.muted,
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sideLabelActive: { color: trackerColors.feeding.accent },
  sideDigits: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    fontVariant: ['tabular-nums'],
  },
  sideDigitsActive: { color: colors.text },
  error: { color: colors.danger, fontSize: fontSize.sm },
});
