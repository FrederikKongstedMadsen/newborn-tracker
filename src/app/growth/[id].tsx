import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';

import { FormField } from '@/components/FormField';
import { PillButton } from '@/components/PillButton';
import { Screen } from '@/components/Screen';
import { useBaby } from '@/features/baby/hooks';
import {
  useDeleteMeasurement,
  useGrowthMeasurements,
  useUpdateMeasurement,
} from '@/features/growth/hooks';
import type { GrowthMeasurement } from '@/features/growth/types';
import { colors, fontSize } from '@/lib/theme';

import { parseDecimal } from './new';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function EditMeasurement() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: baby } = useBaby();
  const { data: measurements } = useGrowthMeasurements(baby?.id);
  const measurement = measurements?.find((m) => m.id === id);
  const updateMeasurement = useUpdateMeasurement();
  const deleteMeasurement = useDeleteMeasurement();

  const [date, setDate] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [headCm, setHeadCm] = useState('');
  const [note, setNote] = useState('');

  // Sync form fields from the loaded measurement whenever it changes, without a useEffect
  // (React docs: "Adjusting some state when a prop changes").
  const [prevMeasurement, setPrevMeasurement] = useState<GrowthMeasurement | undefined>(undefined);
  if (measurement !== prevMeasurement) {
    setPrevMeasurement(measurement);
    if (measurement) {
      setDate(measurement.measured_at);
      setWeightKg(measurement.weight_g == null ? '' : String(measurement.weight_g / 1000));
      setHeightCm(measurement.height_cm == null ? '' : String(measurement.height_cm));
      setHeadCm(
        measurement.head_circumference_cm == null ? '' : String(measurement.head_circumference_cm),
      );
      setNote(measurement.note ?? '');
    }
  }

  const weight = parseDecimal(weightKg);
  const height = parseDecimal(heightCm);
  const head = parseDecimal(headCm);
  const valid =
    DATE_RE.test(date) && (weight !== null || height !== null || head !== null) && !!measurement;

  function save() {
    if (!measurement) return;
    updateMeasurement.mutate(
      {
        id: measurement.id,
        measured_at: date,
        weight_g: weight === null ? null : Math.round(weight * 1000),
        height_cm: height,
        head_circumference_cm: head,
        note: note.trim() || null,
      },
      { onSuccess: () => router.back() },
    );
  }

  function confirmDelete() {
    if (!measurement) return;
    Alert.alert('Delete measurement?', undefined, [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMeasurement.mutate(measurement.id, { onSuccess: () => router.back() }),
      },
    ]);
  }

  return (
    <Screen>
      <FormField label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
      <FormField
        label="Weight (kg)"
        value={weightKg}
        onChangeText={setWeightKg}
        keyboardType="decimal-pad"
        placeholder="4.25"
      />
      <FormField
        label="Height (cm)"
        value={heightCm}
        onChangeText={setHeightCm}
        keyboardType="decimal-pad"
        placeholder="54.5"
      />
      <FormField
        label="Head circumference (cm)"
        value={headCm}
        onChangeText={setHeadCm}
        keyboardType="decimal-pad"
        placeholder="37.0"
      />
      <FormField label="Note" value={note} onChangeText={setNote} />
      {updateMeasurement.isError ? (
        <Text style={styles.error}>{updateMeasurement.error.message}</Text>
      ) : null}
      {deleteMeasurement.isError ? (
        <Text style={styles.error}>{deleteMeasurement.error.message}</Text>
      ) : null}
      <PillButton title="Save" disabled={!valid || updateMeasurement.isPending} onPress={save} />
      <PillButton
        title="Delete"
        variant="danger"
        disabled={!measurement || deleteMeasurement.isPending}
        onPress={confirmDelete}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger, fontSize: fontSize.sm },
});
