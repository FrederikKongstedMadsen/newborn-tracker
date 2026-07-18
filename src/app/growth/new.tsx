import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { FormField } from '@/components/FormField';
import { PillButton } from '@/components/PillButton';
import { Screen } from '@/components/Screen';
import { useBaby } from '@/features/baby/hooks';
import { useAddMeasurement } from '@/features/growth/hooks';
import { todayIso } from '@/lib/dates';
import { colors, fontSize } from '@/lib/theme';

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
  const [date, setDate] = useState(todayIso());
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
      {addMeasurement.isError ? (
        <Text style={styles.error}>{addMeasurement.error.message}</Text>
      ) : null}
      <PillButton
        title="Save"
        icon="add"
        disabled={!valid || addMeasurement.isPending}
        onPress={save}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger, fontSize: fontSize.sm },
});
