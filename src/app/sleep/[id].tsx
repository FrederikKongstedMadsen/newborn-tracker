import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { FormField } from '@/components/FormField';
import { PillButton } from '@/components/PillButton';
import { Screen } from '@/components/Screen';
import { useBaby } from '@/features/baby/hooks';
import { useDeletePause, useDeleteSleep, useSleeps, useUpdateSleep } from '@/features/sleep/hooks';
import type { SleepPause, SleepWithPauses } from '@/features/sleep/types';
import { formatDuration } from '@/lib/duration';
import { colors, fontFamily, fontSize, spacing, trackerColors } from '@/lib/theme';

const DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const PAUSE_COLOR = '#c9922e';

interface Segment {
  kind: 'sleep' | 'pause';
  startedAt: string;
  endedAt: string;
}

/** Derives alternating sleep/pause segments between the sleep's start and end,
 * splitting the sleep span at each pause. Assumes ended sleep (both started_at
 * and ended_at present) — segments aren't meaningful for a running sleep. */
function deriveSegments(sleep: SleepWithPauses): Segment[] {
  if (!sleep.ended_at) return [];
  const pauses = [...sleep.sleep_pauses]
    .filter((p): p is SleepPause & { ended_at: string } => p.ended_at !== null)
    .sort((a, b) => Date.parse(a.started_at) - Date.parse(b.started_at));

  const segments: Segment[] = [];
  let cursor = sleep.started_at;
  for (const pause of pauses) {
    segments.push({ kind: 'sleep', startedAt: cursor, endedAt: pause.started_at });
    segments.push({ kind: 'pause', startedAt: pause.started_at, endedAt: pause.ended_at });
    cursor = pause.ended_at;
  }
  segments.push({ kind: 'sleep', startedAt: cursor, endedAt: sleep.ended_at });
  return segments;
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

function timeOnly(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function segmentSeconds(segment: Segment): number {
  return Math.max(
    0,
    Math.floor((Date.parse(segment.endedAt) - Date.parse(segment.startedAt)) / 1000),
  );
}

function SegmentRow({ segment }: { segment: Segment }) {
  const accent = segment.kind === 'sleep' ? trackerColors.sleep.accent : PAUSE_COLOR;
  return (
    <View style={styles.segmentRow}>
      <View style={[styles.dot, { backgroundColor: accent }]} />
      <Text style={styles.segmentLabel}>{segment.kind === 'sleep' ? 'Sleep' : 'Pause'}</Text>
      <Text style={styles.segmentRange}>
        {timeOnly(segment.startedAt)}–{timeOnly(segment.endedAt)}
      </Text>
      <Text style={styles.segmentDuration}>{formatDuration(segmentSeconds(segment))}</Text>
    </View>
  );
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

  const segments = sleep && !running ? deriveSegments(sleep) : [];

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
      {sleep && segments.length > 0 ? (
        <View style={styles.segments}>
          {segments.map((segment, i) => (
            <SegmentRow key={`${segment.kind}-${segment.startedAt}-${i}`} segment={segment} />
          ))}
        </View>
      ) : null}
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
      <PillButton title="Save" disabled={!valid || updateSleep.isPending} onPress={save} />
      <PillButton
        title="Delete"
        variant="danger"
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
              <PillButton
                title="Delete"
                variant="danger"
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
  info: { color: colors.mutedDark },
  segments: { gap: spacing.sm, marginBottom: spacing.sm },
  segmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  segmentLabel: {
    flex: 1,
    color: colors.text,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
  },
  segmentRange: {
    color: colors.mutedDark,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
  },
  segmentDuration: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    marginLeft: spacing.sm,
    minWidth: 56,
    textAlign: 'right',
  },
  pauses: { gap: spacing.xs },
  pausesTitle: { fontFamily: fontFamily.semibold, marginTop: spacing.sm, color: colors.text },
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
