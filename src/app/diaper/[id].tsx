import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';

import { FormField } from '@/components/FormField';
import { PillButton } from '@/components/PillButton';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { useBaby } from '@/features/baby/hooks';
import { useDeleteDiaper, useDiapers, useUpdateDiaper } from '@/features/diaper/hooks';
import type { DiaperType } from '@/features/diaper/types';
import { colors } from '@/lib/theme';

const DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

const SEGMENT_OPTIONS = ['Pee', 'Poop', 'Both', 'Nothing'];

function toSegment(type: DiaperType): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function toType(segment: string): DiaperType {
  return segment.toLowerCase() as DiaperType;
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

export default function EditDiaper() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: baby } = useBaby();
  const { data: diapers } = useDiapers(baby?.id);
  const diaper = diapers?.find((d) => d.id === id);
  const updateDiaper = useUpdateDiaper();
  const deleteDiaper = useDeleteDiaper();

  const [type, setType] = useState<DiaperType>('pee');
  const [happenedDatetime, setHappenedDatetime] = useState('');
  const [note, setNote] = useState('');

  // Remember prefilled values so save() can tell whether the user actually
  // edited a field, vs. just re-saving (which would otherwise send a
  // redundant/rounded value on every note-only edit).
  const [prefilledType, setPrefilledType] = useState<DiaperType>('pee');
  const [prefilledHappened, setPrefilledHappened] = useState('');

  // Sync form fields from the loaded diaper whenever it changes, without a
  // useEffect (React docs: "Adjusting some state when a prop changes").
  const [prevDiaper, setPrevDiaper] = useState<typeof diaper>(undefined);
  if (diaper !== prevDiaper) {
    setPrevDiaper(diaper);
    if (diaper) {
      const nextHappened = toDatetimeLocal(diaper.happened_at);
      setType(diaper.type);
      setHappenedDatetime(nextHappened);
      setNote(diaper.note ?? '');
      setPrefilledType(diaper.type);
      setPrefilledHappened(nextHappened);
    }
  }

  const happenedValid =
    DATETIME_RE.test(happenedDatetime) && !Number.isNaN(new Date(happenedDatetime).getTime());
  const valid = !!diaper && happenedValid;

  function save() {
    if (!diaper || !happenedValid) return;
    const typeChanged = type !== prefilledType;
    const happenedChanged = happenedDatetime !== prefilledHappened;
    updateDiaper.mutate(
      {
        id: diaper.id,
        ...(typeChanged ? { type } : {}),
        ...(happenedChanged ? { happened_at: new Date(happenedDatetime).toISOString() } : {}),
        note: note.trim() || null,
      },
      { onSuccess: () => router.back() },
    );
  }

  function confirmDelete() {
    if (!diaper) return;
    Alert.alert('Delete diaper?', undefined, [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteDiaper.mutate(diaper.id, { onSuccess: () => router.back() }),
      },
    ]);
  }

  return (
    <Screen>
      <SegmentedControl
        options={SEGMENT_OPTIONS}
        selected={toSegment(type)}
        onSelect={(segment) => setType(toType(segment))}
      />
      <FormField
        label="Happened (YYYY-MM-DDTHH:mm)"
        value={happenedDatetime}
        onChangeText={setHappenedDatetime}
      />
      <FormField label="Note" value={note} onChangeText={setNote} />
      {updateDiaper.isError ? <Text style={styles.error}>{updateDiaper.error.message}</Text> : null}
      {deleteDiaper.isError ? <Text style={styles.error}>{deleteDiaper.error.message}</Text> : null}
      <PillButton title="Save" disabled={!valid || updateDiaper.isPending} onPress={save} />
      <PillButton
        title="Delete"
        variant="danger"
        disabled={!diaper || deleteDiaper.isPending}
        onPress={confirmDelete}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger },
});
