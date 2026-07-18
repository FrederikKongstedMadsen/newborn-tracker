import { router } from 'expo-router';
import { Button, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { useBaby } from '@/features/baby/hooks';
import { ActiveFeedCard } from '@/features/feeding/ActiveFeedCard';
import { feedSummary } from '@/features/feeding/feedMath';
import { useActiveFeed, useFeeds, useStartBreastFeed } from '@/features/feeding/hooks';
import type { Feed } from '@/features/feeding/types';
import { colors, spacing } from '@/lib/theme';

function row(item: Feed) {
  const when = new Date(item.started_at).toLocaleString([], {
    dateStyle: 'short',
    timeStyle: 'short',
  });
  const running = item.ended_at === null;
  return `${when} · ${feedSummary(item)}${running ? ' · running' : ''}`;
}

export default function FeedingScreen() {
  const { data: baby } = useBaby();
  const { data: activeFeed } = useActiveFeed(baby?.id);
  const { data: feeds } = useFeeds(baby?.id);
  const startBreastFeed = useStartBreastFeed();

  return (
    <Screen scroll={false}>
      <FlatList
        style={styles.list}
        data={feeds ?? []}
        keyExtractor={(f) => f.id}
        ListHeaderComponent={
          <View style={styles.header}>
            {activeFeed ? (
              <ActiveFeedCard feed={activeFeed} />
            ) : (
              <View style={styles.startRow}>
                <View style={styles.startButton}>
                  <Button
                    title="Start left"
                    disabled={!baby || startBreastFeed.isPending}
                    onPress={() => startBreastFeed.mutate({ babyId: baby!.id, side: 'left' })}
                  />
                </View>
                <View style={styles.startButton}>
                  <Button
                    title="Start right"
                    disabled={!baby || startBreastFeed.isPending}
                    onPress={() => startBreastFeed.mutate({ babyId: baby!.id, side: 'right' })}
                  />
                </View>
                <View style={styles.startButton}>
                  <Button title="Log formula" onPress={() => router.push('/feeding/formula')} />
                </View>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => router.push(`/feeding/${item.id}`)}>
            <Text>{row(item)}</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No feeds yet</Text>}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  header: { marginBottom: spacing.md },
  startRow: { flexDirection: 'row', gap: spacing.sm },
  startButton: { flex: 1 },
  row: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 24 },
});
