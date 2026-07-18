import { Link, router } from 'expo-router';
import { Button, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { useBaby } from '@/features/baby/hooks';
import { useGrowthMeasurements } from '@/features/growth/hooks';
import type { GrowthMeasurement } from '@/features/growth/types';

function summary(m: GrowthMeasurement): string {
  const parts: string[] = [];
  if (m.weight_g != null) parts.push(`${(m.weight_g / 1000).toFixed(2)} kg`);
  if (m.height_cm != null) parts.push(`${m.height_cm} cm`);
  if (m.head_circumference_cm != null) parts.push(`head ${m.head_circumference_cm} cm`);
  return parts.join(' · ');
}

export default function GrowthScreen() {
  const { data: baby } = useBaby();
  const { data: measurements } = useGrowthMeasurements(baby?.id);

  return (
    <View style={styles.container}>
      <FlatList
        data={[...(measurements ?? [])].reverse()}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => router.push(`/growth/${item.id}`)}>
            <Text style={styles.date}>{item.measured_at}</Text>
            <Text>{summary(item)}</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No measurements yet</Text>}
      />
      <Link href="/growth/new" asChild>
        <Button title="Add measurement" />
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  row: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  date: { fontWeight: '600' },
  empty: { textAlign: 'center', color: '#888', marginTop: 24 },
});
