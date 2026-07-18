import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  Button,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { useBaby } from '@/features/baby/hooks';
import { GrowthChart } from '@/features/growth/GrowthChart';
import { useGrowthMeasurements } from '@/features/growth/hooks';
import type { GrowthMeasurement } from '@/features/growth/types';
import type { Indicator } from '@/features/growth/who/types';

const INDICATORS: { value: Indicator; label: string }[] = [
  { value: 'weight-for-age', label: 'Weight' },
  { value: 'length-for-age', label: 'Height' },
  { value: 'head-circumference-for-age', label: 'Head' },
];

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
  const [indicator, setIndicator] = useState<Indicator>('weight-for-age');
  const { width } = useWindowDimensions();

  return (
    <View style={styles.container}>
      {baby ? (
        <>
          <View style={styles.switcher}>
            {INDICATORS.map((opt) => (
              <Pressable
                key={opt.value}
                style={[
                  styles.switcherButton,
                  indicator === opt.value && styles.switcherButtonActive,
                ]}
                onPress={() => setIndicator(opt.value)}
              >
                <Text
                  style={[
                    styles.switcherLabel,
                    indicator === opt.value && styles.switcherLabelActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <GrowthChart
            indicator={indicator}
            sex={baby.sex}
            birthDate={baby.birth_date}
            measurements={measurements ?? []}
            width={width - 32}
            height={260}
          />
        </>
      ) : null}
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
  switcher: { flexDirection: 'row', gap: 8 },
  switcherButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  switcherButtonActive: { backgroundColor: '#2a78d6', borderColor: '#2a78d6' },
  switcherLabel: { fontSize: 13, color: '#333' },
  switcherLabelActive: { color: '#fff', fontWeight: '600' },
  row: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  date: { fontWeight: '600' },
  empty: { textAlign: 'center', color: '#888', marginTop: 24 },
});
