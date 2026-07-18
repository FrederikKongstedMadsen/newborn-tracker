import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';

import { FormField } from '@/components/FormField';
import { PillButton } from '@/components/PillButton';
import { Screen } from '@/components/Screen';
import { useBaby } from '@/features/baby/hooks';
import { useDeleteTemperature, useTemperatures, useUpdateTemperature } from '@/features/sick/hooks';
import type { Temperature } from '@/features/sick/types';
import { colors, fontSize } from '@/lib/theme';

const DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

function parseDecimal(text: string): number | null {
  const normalized = text.replace(',', '.').trim();
  if (normalized === '') return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

export default function EditTemperature() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: baby } = useBaby();
  const { data: temperatures } = useTemperatures(baby?.id);
  const temperature = temperatures?.find((t) => t.id === id);
  const updateTemperature = useUpdateTemperature();
  const deleteTemperature = useDeleteTemperature();

  const [measuredAt, setMeasuredAt] = useState('');
  const [celsiusText, setCelsiusText] = useState('');
  const [note, setNote] = useState('');

  // Remember prefilled values so save() only sends fields the user actually
  // edited, vs. re-sending a redundant/rounded value on every note-only edit.
  const [prefilledMeasuredAt, setPrefilledMeasuredAt] = useState('');
  const [prefilledCelsius, setPrefilledCelsius] = useState('');

  // Sync form fields from the loaded temperature whenever it changes, without
  // a useEffect (React docs: "Adjusting some state when a prop changes").
  const [prevTemperature, setPrevTemperature] = useState<Temperature | undefined>(undefined);
  if (temperature !== prevTemperature) {
    setPrevTemperature(temperature);
    if (temperature) {
      const nextMeasuredAt = toDatetimeLocal(temperature.measured_at);
      const nextCelsius = String(temperature.celsius);
      setMeasuredAt(nextMeasuredAt);
      setCelsiusText(nextCelsius);
      setNote(temperature.note ?? '');
      setPrefilledMeasuredAt(nextMeasuredAt);
      setPrefilledCelsius(nextCelsius);
    }
  }

  const celsius = parseDecimal(celsiusText);
  const measuredAtValid =
    DATETIME_RE.test(measuredAt) && !Number.isNaN(new Date(measuredAt).getTime());
  const valid =
    !!temperature && measuredAtValid && celsius !== null && celsius >= 30 && celsius <= 43;

  function save() {
    if (!temperature || !valid || celsius === null) return;
    const measuredAtChanged = measuredAt !== prefilledMeasuredAt;
    const celsiusChanged = celsiusText !== prefilledCelsius;
    updateTemperature.mutate(
      {
        id: temperature.id,
        ...(measuredAtChanged ? { measured_at: new Date(measuredAt).toISOString() } : {}),
        ...(celsiusChanged ? { celsius } : {}),
        note: note.trim() || null,
      },
      { onSuccess: () => router.back() },
    );
  }

  function confirmDelete() {
    if (!temperature) return;
    Alert.alert('Delete temperature?', undefined, [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteTemperature.mutate(temperature.id, { onSuccess: () => router.back() }),
      },
    ]);
  }

  return (
    <Screen>
      <FormField
        label="Measured at (YYYY-MM-DDTHH:mm)"
        value={measuredAt}
        onChangeText={setMeasuredAt}
      />
      <FormField
        label="Temperature (°C)"
        value={celsiusText}
        onChangeText={setCelsiusText}
        keyboardType="decimal-pad"
      />
      <FormField label="Note" value={note} onChangeText={setNote} />
      {updateTemperature.isError ? (
        <Text style={styles.error}>{updateTemperature.error.message}</Text>
      ) : null}
      {deleteTemperature.isError ? (
        <Text style={styles.error}>{deleteTemperature.error.message}</Text>
      ) : null}
      <PillButton title="Save" disabled={!valid || updateTemperature.isPending} onPress={save} />
      <PillButton
        title="Delete"
        variant="danger"
        disabled={!temperature || deleteTemperature.isPending}
        onPress={confirmDelete}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger, fontSize: fontSize.sm },
});
