import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { FormField } from '@/components/FormField';
import { IconChip } from '@/components/IconChip';
import { PillButton } from '@/components/PillButton';
import { Screen } from '@/components/Screen';
import { useBaby } from '@/features/baby/hooks';
import { useNowTick } from '@/features/feeding/useNowTick';
import { useAddNote, useNotes } from '@/features/notes/hooks';
import type { Note } from '@/features/notes/types';
import { useProfileMap } from '@/features/profiles/hooks';
import { relativeTime, timeHHmm } from '@/lib/dates';
import { colors, fontFamily, fontSize, spacing, trackerColors } from '@/lib/theme';

const DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

function toDatetimeLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

function NoteRow({ item, now }: { item: Note; now: number }) {
  const { data: profileMap } = useProfileMap();
  const profile = profileMap?.get(item.created_by);

  return (
    <Pressable style={styles.row} onPress={() => router.push(`/notes/${item.id}`)}>
      <IconChip
        icon={trackerColors.notes.icon}
        accent={trackerColors.notes.accent}
        tint={trackerColors.notes.tint}
      />
      <View style={styles.rowBody}>
        <Text style={styles.rowBodyText} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={styles.rowMuted}>{timeHHmm(item.noted_at)}</Text>
      </View>
      <View style={styles.rowMeta}>
        <Text style={styles.rowWhen}>{relativeTime(item.noted_at, now)}</Text>
        <View style={styles.rowProfile}>
          <Avatar profile={profile} size={20} />
          <Text style={styles.rowName}>{profile?.display_name}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function NotesScreen() {
  const { data: baby } = useBaby();
  const { data: notes } = useNotes(baby?.id);
  const addNote = useAddNote();
  const now = useNowTick(false);

  const [body, setBody] = useState('');
  const [datetime, setDatetime] = useState(() => toDatetimeLocal(new Date()));

  const datetimeValid = DATETIME_RE.test(datetime) && !Number.isNaN(new Date(datetime).getTime());
  const valid = body.trim() !== '' && datetimeValid && !!baby;

  function save() {
    if (!valid || !baby) return;
    addNote.mutate(
      {
        baby_id: baby.id,
        noted_at: new Date(datetime).toISOString(),
        body: body.trim(),
      },
      {
        onSuccess: () => {
          setBody('');
          setDatetime(toDatetimeLocal(new Date()));
        },
      },
    );
  }

  return (
    <Screen scroll={false}>
      <FlatList
        style={styles.list}
        data={notes ?? []}
        keyExtractor={(n) => n.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <Card>
              <FormField
                label="Note"
                value={body}
                onChangeText={setBody}
                placeholder="Write a note…"
                multiline
                numberOfLines={3}
                style={styles.composerInput}
              />
              <FormField
                label="Noted at (YYYY-MM-DDTHH:mm)"
                value={datetime}
                onChangeText={setDatetime}
              />
              {addNote.isError ? <Text style={styles.error}>{addNote.error.message}</Text> : null}
              <PillButton
                title="Save note"
                icon="add"
                disabled={!valid || addNote.isPending}
                onPress={save}
              />
            </Card>
            <Text style={styles.sectionLabel}>RECENT NOTES</Text>
          </View>
        }
        renderItem={({ item }) => <NoteRow item={item} now={now} />}
        ListEmptyComponent={<Text style={styles.empty}>No notes yet</Text>}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  header: { marginBottom: spacing.sm, gap: spacing.md },
  composerInput: { minHeight: 72, textAlignVertical: 'top' },
  error: { color: colors.danger, fontSize: fontSize.sm },
  sectionLabel: {
    color: colors.muted,
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm + spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowBody: { flex: 1, gap: 2 },
  rowBodyText: { fontFamily: fontFamily.regular, fontSize: fontSize.md, color: colors.text },
  rowMuted: { color: colors.mutedDark, fontFamily: fontFamily.regular, fontSize: fontSize.sm },
  rowMeta: { alignItems: 'flex-end', gap: spacing.xs },
  rowWhen: { color: colors.muted, fontSize: fontSize.sm, fontFamily: fontFamily.regular },
  rowProfile: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  rowName: { color: colors.text, fontSize: fontSize.sm, fontFamily: fontFamily.regular },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 24 },
});
