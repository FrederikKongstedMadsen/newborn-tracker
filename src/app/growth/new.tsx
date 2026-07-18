import { router } from 'expo-router';
import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import { FormField } from '@/components/FormField';
import { useBaby } from '@/features/baby/hooks';
import { useAddMeasurement } from '@/features/growth/hooks';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseDecimal(text: string): number | null {
  const normalized = text.replace(',', '.').trim();
  if (normalized === '') return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

export default function NewMeasurement() {
  const { data: baby } = useBaby();
  const addMeasurement = useAddMeasurement();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [headCm, setHeadCm] = useState('');
  const [note, setNote] = useState('');

  const weight = parseDecimal(weightKg);
  const height = parseDecimal(heightCm);
  const head = parseDecimal(headCm);
  const valid =
    DATE_RE.test(date) && (weight !== null || height !== null || head !== null) && !!baby;

  function save() {
    addMeasurement.mutate(
      {
        baby_id: baby!.id,
        measured_at: date,
        weight_g: weight === null ? null : Math.round(weight * 1000),
        height_cm: height,
        head_circumference_cm: head,
        note: note.trim() || null,
      },
      { onSuccess: () => router.back() },
    );
  }

  return (
    <View style={styles.container}>
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
      {addMeasurement.isError ? (
        <Text style={styles.error}>{addMeasurement.error.message}</Text>
      ) : null}
      <Button title="Save" disabled={!valid || addMeasurement.isPending} onPress={save} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16 },
  error: { color: 'red' },
});
