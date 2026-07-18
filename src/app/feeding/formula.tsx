import { router } from 'expo-router';
import { useState } from 'react';
import { Button, StyleSheet, Text } from 'react-native';

import { FormField } from '@/components/FormField';
import { Screen } from '@/components/Screen';
import { useBaby } from '@/features/baby/hooks';
import { useLogFormula } from '@/features/feeding/hooks';
import { colors } from '@/lib/theme';

const DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export function parseVolume(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === '') return null;
  if (!/^\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

export function nowDatetimeLocal(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

export default function LogFormula() {
  const { data: baby } = useBaby();
  const logFormula = useLogFormula();
  const [datetime, setDatetime] = useState(nowDatetimeLocal());
  const [volumeMl, setVolumeMl] = useState('');
  const [note, setNote] = useState('');

  const volume = parseVolume(volumeMl);
  const datetimeValid = DATETIME_RE.test(datetime) && !Number.isNaN(new Date(datetime).getTime());
  const valid = datetimeValid && volume !== null && volume > 0 && !!baby;

  function save() {
    if (!baby || volume === null) return;
    logFormula.mutate(
      {
        baby_id: baby.id,
        at: new Date(datetime).toISOString(),
        volume_ml: volume,
        note: note.trim() || null,
      },
      { onSuccess: () => router.back() },
    );
  }

  return (
    <Screen>
      <FormField
        label="Date & time (YYYY-MM-DDTHH:mm)"
        value={datetime}
        onChangeText={setDatetime}
      />
      <FormField
        label="Volume (ml)"
        value={volumeMl}
        onChangeText={setVolumeMl}
        keyboardType="number-pad"
        placeholder="120"
      />
      <FormField label="Note" value={note} onChangeText={setNote} />
      {logFormula.isError ? <Text style={styles.error}>{logFormula.error.message}</Text> : null}
      <Button title="Save" disabled={!valid || logFormula.isPending} onPress={save} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger },
});
