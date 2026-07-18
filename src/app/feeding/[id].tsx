import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Button, StyleSheet, Text } from 'react-native';

import { FormField } from '@/components/FormField';
import { Screen } from '@/components/Screen';
import { useBaby } from '@/features/baby/hooks';
import { useDeleteFeed, useFeeds, useUpdateFeed } from '@/features/feeding/hooks';
import type { Feed } from '@/features/feeding/types';
import { colors } from '@/lib/theme';

import { parseVolume } from './formula';

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

function parseMinutes(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === '') return null;
  if (!/^\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

export default function EditFeed() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: baby } = useBaby();
  const { data: feeds } = useFeeds(baby?.id);
  const feed = feeds?.find((f) => f.id === id);
  const updateFeed = useUpdateFeed();
  const deleteFeed = useDeleteFeed();

  const [datetime, setDatetime] = useState('');
  const [leftMinutes, setLeftMinutes] = useState('');
  const [rightMinutes, setRightMinutes] = useState('');
  const [volumeMl, setVolumeMl] = useState('');
  const [note, setNote] = useState('');

  // Sync form fields from the loaded feed whenever it changes, without a useEffect
  // (React docs: "Adjusting some state when a prop changes").
  const [prevFeed, setPrevFeed] = useState<Feed | undefined>(undefined);
  if (feed !== prevFeed) {
    setPrevFeed(feed);
    if (feed) {
      setDatetime(toDatetimeLocal(feed.started_at));
      setLeftMinutes(String(Math.round(feed.left_seconds / 60)));
      setRightMinutes(String(Math.round(feed.right_seconds / 60)));
      setVolumeMl(feed.volume_ml == null ? '' : String(feed.volume_ml));
      setNote(feed.note ?? '');
    }
  }

  const running = feed?.type === 'breast' && feed.ended_at === null;
  const datetimeValid = DATETIME_RE.test(datetime) && !Number.isNaN(new Date(datetime).getTime());
  const left = parseMinutes(leftMinutes);
  const right = parseMinutes(rightMinutes);
  const volume = parseVolume(volumeMl);

  let valid = !!feed;
  if (feed && running) {
    valid = true;
  } else if (feed?.type === 'breast') {
    valid = datetimeValid && left !== null && right !== null;
  } else if (feed?.type === 'formula') {
    valid = datetimeValid && volume !== null && volume > 0;
  }

  function save() {
    if (!feed) return;
    if (running) {
      updateFeed.mutate(
        { id: feed.id, note: note.trim() || null },
        { onSuccess: () => router.back() },
      );
      return;
    }
    if (feed.type === 'breast') {
      if (left === null || right === null) return;
      updateFeed.mutate(
        {
          id: feed.id,
          started_at: new Date(datetime).toISOString(),
          left_seconds: left * 60,
          right_seconds: right * 60,
          note: note.trim() || null,
        },
        { onSuccess: () => router.back() },
      );
    } else {
      if (volume === null) return;
      const iso = new Date(datetime).toISOString();
      updateFeed.mutate(
        {
          id: feed.id,
          started_at: iso,
          ended_at: iso,
          volume_ml: volume,
          note: note.trim() || null,
        },
        { onSuccess: () => router.back() },
      );
    }
  }

  function confirmDelete() {
    if (!feed) return;
    Alert.alert('Delete feed?', undefined, [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteFeed.mutate(feed.id, { onSuccess: () => router.back() }),
      },
    ]);
  }

  return (
    <Screen>
      {running ? (
        <Text style={styles.info}>Feed is running — stop it before editing times</Text>
      ) : feed?.type === 'breast' ? (
        <>
          <FormField
            label="Started (YYYY-MM-DDTHH:mm)"
            value={datetime}
            onChangeText={setDatetime}
          />
          <FormField
            label="Left (minutes)"
            value={leftMinutes}
            onChangeText={setLeftMinutes}
            keyboardType="number-pad"
          />
          <FormField
            label="Right (minutes)"
            value={rightMinutes}
            onChangeText={setRightMinutes}
            keyboardType="number-pad"
          />
        </>
      ) : feed?.type === 'formula' ? (
        <>
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
          />
        </>
      ) : null}
      <FormField label="Note" value={note} onChangeText={setNote} />
      {updateFeed.isError ? <Text style={styles.error}>{updateFeed.error.message}</Text> : null}
      {deleteFeed.isError ? <Text style={styles.error}>{deleteFeed.error.message}</Text> : null}
      <Button title="Save" disabled={!valid || updateFeed.isPending} onPress={save} />
      <Button
        title="Delete"
        color={colors.danger}
        disabled={!feed || deleteFeed.isPending}
        onPress={confirmDelete}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger },
  info: { color: colors.muted },
});
