import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Button, StyleSheet, Text, View } from 'react-native';

import { FormField } from '@/components/FormField';
import { Screen } from '@/components/Screen';
import { useBaby } from '@/features/baby/hooks';
import { useDeletePause, useDeleteSleep, useSleeps, useUpdateSleep } from '@/features/sleep/hooks';
import { formatDuration } from '@/lib/duration';
import { colors, spacing } from '@/lib/theme';

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

function timeOnly(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export default function EditSleep() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: baby } = useBaby();
  const { data: sleeps } = useSleeps(baby?.id);
  const sleep = sleeps?.find((s) => s.id === id);
  const updateSleep = useUpdateSleep();
  const deleteSleep = useDeleteSleep();
  const deletePause = useDeletePause();

  const [startedDatetime, setStartedDatetime] = useState('');
  const [endedDatetime, setEndedDatetime] = useState('');
  const [note, setNote] = useState('');

  // Remember prefilled values so save() can tell whether the user actually
  // edited a field, vs. just re-saving (which would otherwise send a
  // redundant/rounded value on every note-only edit).
  const [prefilledStarted, setPrefilledStarted] = useState('');
  const [prefilledEnded, setPrefilledEnded] = useState('');

  // Sync form fields from the loaded sleep whenever it changes, without a
  // useEffect (React docs: "Adjusting some state when a prop changes").
  const [prevSleep, setPrevSleep] = useState<typeof sleep>(undefined);
  if (sleep !== prevSleep) {
    setPrevSleep(sleep);
    if (sleep) {
      const nextStarted = toDatetimeLocal(sleep.started_at);
      const nextEnded = sleep.ended_at ? toDatetimeLocal(sleep.ended_at) : '';
      setStartedDatetime(nextStarted);
      setEndedDatetime(nextEnded);
      setNote(sleep.note ?? '');
      setPrefilledStarted(nextStarted);
      setPrefilledEnded(nextEnded);
    }
  }

  const running = sleep?.ended_at === null;
  const startedValid =
    DATETIME_RE.test(startedDatetime) && !Number.isNaN(new Date(startedDatetime).getTime());
  const endedValid =
    DATETIME_RE.test(endedDatetime) && !Number.isNaN(new Date(endedDatetime).getTime());

  let valid = !!sleep;
  if (sleep && running) {
    valid = true;
  } else if (sleep) {
    valid = startedValid && endedValid;
  }

  function save() {
    if (!sleep) return;
    if (running) {
      updateSleep.mutate(
        { id: sleep.id, note: note.trim() || null },
        { onSuccess: () => router.back() },
      );
      return;
    }
    if (!startedValid || !endedValid) return;
    const startedChanged = startedDatetime !== prefilledStarted;
    const endedChanged = endedDatetime !== prefilledEnded;
    updateSleep.mutate(
      {
        id: sleep.id,
        ...(startedChanged ? { started_at: new Date(startedDatetime).toISOString() } : {}),
        ...(endedChanged ? { ended_at: new Date(endedDatetime).toISOString() } : {}),
        note: note.trim() || null,
      },
      { onSuccess: () => router.back() },
    );
  }

  function confirmDelete() {
    if (!sleep) return;
    Alert.alert('Delete sleep?', undefined, [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteSleep.mutate(sleep.id, { onSuccess: () => router.back() }),
      },
    ]);
  }

  function confirmDeletePause(pauseId: string) {
    Alert.alert('Delete pause?', undefined, [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deletePause.mutate(pauseId),
      },
    ]);
  }

  return (
    <Screen>
      {running ? (
        <Text style={styles.info}>Sleep is running — stop it before editing times</Text>
      ) : sleep ? (
        <>
          <FormField
            label="Started (YYYY-MM-DDTHH:mm)"
            value={startedDatetime}
            onChangeText={setStartedDatetime}
          />
          <FormField
            label="Ended (YYYY-MM-DDTHH:mm)"
            value={endedDatetime}
            onChangeText={setEndedDatetime}
          />
        </>
      ) : null}
      <FormField label="Note" value={note} onChangeText={setNote} />
      {updateSleep.isError ? <Text style={styles.error}>{updateSleep.error.message}</Text> : null}
      {deleteSleep.isError ? <Text style={styles.error}>{deleteSleep.error.message}</Text> : null}
      <Button title="Save" disabled={!valid || updateSleep.isPending} onPress={save} />
      <Button
        title="Delete"
        color={colors.danger}
        disabled={!sleep || deleteSleep.isPending}
        onPress={confirmDelete}
      />
      {sleep && sleep.sleep_pauses.length > 0 ? (
        <View style={styles.pauses}>
          <Text style={styles.pausesTitle}>Pauses</Text>
          {sleep.sleep_pauses.map((pause) => (
            <View key={pause.id} style={styles.pauseRow}>
              <Text style={styles.pauseText}>
                {timeOnly(pause.started_at)}–
                {pause.ended_at
                  ? `${timeOnly(pause.ended_at)} · ${formatDuration(
                      Math.max(
                        0,
                        Math.floor(
                          (Date.parse(pause.ended_at) - Date.parse(pause.started_at)) / 1000,
                        ),
                      ),
                    )}`
                  : 'ongoing'}
              </Text>
              <Button
                title="Delete"
                color={colors.danger}
                disabled={deletePause.isPending}
                onPress={() => confirmDeletePause(pause.id)}
              />
            </View>
          ))}
          {deletePause.isError ? (
            <Text style={styles.error}>{deletePause.error.message}</Text>
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger },
  info: { color: colors.muted },
  pauses: { gap: spacing.xs },
  pausesTitle: { fontWeight: '600', marginTop: spacing.sm },
  pauseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pauseText: { color: colors.text },
});
