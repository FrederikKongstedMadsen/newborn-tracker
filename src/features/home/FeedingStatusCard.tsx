import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Card } from '@/components/Card';
import { feedSummary, totalElapsedSeconds } from '@/features/feeding/feedMath';
import { useActiveFeed, useFeeds } from '@/features/feeding/hooks';
import { useNowTick } from '@/features/feeding/useNowTick';
import { relativeTime } from '@/lib/dates';
import { formatDuration } from '@/lib/duration';
import { colors, fontSize, spacing } from '@/lib/theme';

export function FeedingStatusCard({ babyId }: { babyId: string }) {
  const { data: activeFeed } = useActiveFeed(babyId);
  const { data: feeds } = useFeeds(babyId);
  const now = useNowTick(!!activeFeed);
  const latest = feeds?.find((f) => f.ended_at !== null);

  return (
    <Card onPress={() => router.push('/feeding')}>
      <Text style={styles.title}>Feeding</Text>
      {activeFeed ? (
        <>
          <Text style={styles.value}>
            {formatDuration(totalElapsedSeconds(activeFeed, now))} · {activeFeed.active_side}
          </Text>
          <Text style={styles.meta}>running</Text>
        </>
      ) : latest ? (
        <>
          <Text style={styles.value}>{feedSummary(latest)}</Text>
          <Text style={styles.meta}>{relativeTime(latest.ended_at ?? latest.started_at, now)}</Text>
        </>
      ) : (
        <Text style={styles.meta}>No feeds yet — tap to start</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.sm, color: colors.muted, textTransform: 'uppercase' },
  value: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text },
  meta: { fontSize: fontSize.sm, color: colors.muted, marginTop: spacing.xs },
});
