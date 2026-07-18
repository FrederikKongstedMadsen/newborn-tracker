import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { colors, fontSize, spacing } from '@/lib/theme';

import { formatDuration, sideElapsedSeconds, totalElapsedSeconds } from './feedMath';
import { useStopFeed, useToggleSide } from './hooks';
import type { Feed, FeedSide } from './types';
import { useNowTick } from './useNowTick';

interface Props {
  feed: Feed;
}

export function ActiveFeedCard({ feed }: Props) {
  const now = useNowTick(true);
  const toggleSide = useToggleSide();
  const stopFeed = useStopFeed();

  const total = totalElapsedSeconds(feed, now);
  const left = sideElapsedSeconds(feed, 'left', now);
  const right = sideElapsedSeconds(feed, 'right', now);
  const disabled = toggleSide.isPending || stopFeed.isPending;

  function pressSide(side: FeedSide) {
    if (feed.active_side === side) return;
    toggleSide.mutate({ feed, side });
  }

  return (
    <Card>
      <Text style={styles.total}>{formatDuration(total)}</Text>
      <View style={styles.sides}>
        <Pressable
          style={[styles.side, feed.active_side === 'left' && styles.sideActive]}
          disabled={disabled || feed.active_side === 'left'}
          onPress={() => pressSide('left')}
        >
          <Text style={[styles.sideLabel, feed.active_side === 'left' && styles.sideLabelActive]}>
            Left {formatDuration(left)}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.side, feed.active_side === 'right' && styles.sideActive]}
          disabled={disabled || feed.active_side === 'right'}
          onPress={() => pressSide('right')}
        >
          <Text style={[styles.sideLabel, feed.active_side === 'right' && styles.sideLabelActive]}>
            Right {formatDuration(right)}
          </Text>
        </Pressable>
      </View>
      {toggleSide.isError ? <Text style={styles.error}>{toggleSide.error.message}</Text> : null}
      {stopFeed.isError ? <Text style={styles.error}>{stopFeed.error.message}</Text> : null}
      <Pressable
        style={[styles.stop, disabled && styles.stopDisabled]}
        disabled={disabled}
        onPress={() => stopFeed.mutate(feed)}
      >
        <Text style={styles.stopLabel}>Stop</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  total: { fontSize: fontSize.xl, fontWeight: '700', textAlign: 'center' },
  sides: { flexDirection: 'row', gap: spacing.sm },
  side: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  sideActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  sideLabel: { fontSize: fontSize.md, color: colors.text },
  sideLabelActive: { color: '#fff', fontWeight: '600' },
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
