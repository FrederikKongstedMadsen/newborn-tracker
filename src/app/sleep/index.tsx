import { router } from 'expo-router';
import {
  Button,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { Screen } from '@/components/Screen';
import { useBaby } from '@/features/baby/hooks';
import { ActiveSleepCard } from '@/features/sleep/ActiveSleepCard';
import { useActiveSleep, useSleeps, useStartSleep } from '@/features/sleep/hooks';
import { SleepChart } from '@/features/sleep/SleepChart';
import { sleepSummary } from '@/features/sleep/sleepMath';
import type { SleepWithPauses } from '@/features/sleep/types';
import { colors, spacing } from '@/lib/theme';

function row(item: SleepWithPauses) {
  const when = new Date(item.started_at).toLocaleString([], {
    dateStyle: 'short',
    timeStyle: 'short',
  });
  const nowMs = Date.parse(item.ended_at!);
  return `${when} · ${sleepSummary(item, item.sleep_pauses, nowMs)}`;
}

export default function SleepScreen() {
  const { data: baby } = useBaby();
  const { data: activeSleep } = useActiveSleep(baby?.id);
  const { data: sleeps } = useSleeps(baby?.id);
  const startSleep = useStartSleep();
  const { width } = useWindowDimensions();

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
              <Button
                title="Start sleep"
                disabled={!baby || startSleep.isPending}
                onPress={() => startSleep.mutate({ babyId: baby!.id })}
              />
            )}
            <SleepChart sleeps={sleeps ?? []} width={width - 32} />
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => router.push(`/sleep/${item.id}`)}>
            <Text>{row(item)}</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No sleeps yet</Text>}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  header: { marginBottom: spacing.md },
  row: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 24 },
});
