import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';

import { FormField } from '@/components/FormField';
import { PillButton } from '@/components/PillButton';
import { Screen } from '@/components/Screen';
import { useBaby } from '@/features/baby/hooks';
import { useDeleteNote, useNotes, useUpdateNote } from '@/features/notes/hooks';
import { colors, fontSize } from '@/lib/theme';

const DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

export default function EditNote() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: baby } = useBaby();
  const { data: notes } = useNotes(baby?.id);
  const note = notes?.find((n) => n.id === id);
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  const [body, setBody] = useState('');
  const [datetime, setDatetime] = useState('');

  // Remember prefilled values so save() can tell whether the user actually
  // edited a field, vs. just re-saving.
  const [prefilledBody, setPrefilledBody] = useState('');
  const [prefilledDatetime, setPrefilledDatetime] = useState('');

  // Sync form fields from the loaded note whenever it changes, without a
  // useEffect (React docs: "Adjusting some state when a prop changes").
  const [prevNote, setPrevNote] = useState<typeof note>(undefined);
  if (note !== prevNote) {
    setPrevNote(note);
    if (note) {
      const nextDatetime = toDatetimeLocal(note.noted_at);
      setBody(note.body);
      setDatetime(nextDatetime);
      setPrefilledBody(note.body);
      setPrefilledDatetime(nextDatetime);
    }
  }

  const datetimeValid = DATETIME_RE.test(datetime) && !Number.isNaN(new Date(datetime).getTime());
  const valid = !!note && body.trim() !== '' && datetimeValid;

  function save() {
    if (!note || !valid) return;
    const bodyChanged = body.trim() !== prefilledBody;
    const datetimeChanged = datetime !== prefilledDatetime;
    updateNote.mutate(
      {
        id: note.id,
        ...(bodyChanged ? { body: body.trim() } : {}),
        ...(datetimeChanged ? { noted_at: new Date(datetime).toISOString() } : {}),
      },
      { onSuccess: () => router.back() },
    );
  }

  function confirmDelete() {
    if (!note) return;
    Alert.alert('Delete note?', undefined, [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteNote.mutate(note.id, { onSuccess: () => router.back() }),
      },
    ]);
  }

  return (
    <Screen>
      <FormField label="Note" value={body} onChangeText={setBody} multiline numberOfLines={5} />
      <FormField label="Noted at (YYYY-MM-DDTHH:mm)" value={datetime} onChangeText={setDatetime} />
      {updateNote.isError ? <Text style={styles.error}>{updateNote.error.message}</Text> : null}
      {deleteNote.isError ? <Text style={styles.error}>{deleteNote.error.message}</Text> : null}
      <PillButton title="Save" disabled={!valid || updateNote.isPending} onPress={save} />
      <PillButton
        title="Delete"
        variant="danger"
        disabled={!note || deleteNote.isPending}
        onPress={confirmDelete}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger, fontSize: fontSize.sm },
});
