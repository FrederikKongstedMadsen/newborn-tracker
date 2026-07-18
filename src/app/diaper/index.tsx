import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { IconChip } from '@/components/IconChip';
import { Screen } from '@/components/Screen';
import { useBaby } from '@/features/baby/hooks';
import { diaperMeta } from '@/features/diaper/diaperMeta';
import { useLogDiaper, useDiapers } from '@/features/diaper/hooks';
import type { Diaper, DiaperType } from '@/features/diaper/types';
import { useNowTick } from '@/features/feeding/useNowTick';
import { useProfileMap } from '@/features/profiles/hooks';
import { relativeTime, timeHHmm } from '@/lib/dates';
import { colors, fontFamily, fontSize, radius, spacing } from '@/lib/theme';

const TYPES: DiaperType[] = ['pee', 'poop', 'both', 'nothing'];

function rowDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function DiaperRow({ item, now }: { item: Diaper; now: number }) {
  const { data: profileMap } = useProfileMap();
  const profile = profileMap?.get(item.created_by);
  const meta = diaperMeta[item.type];

  return (
    <Pressable style={styles.row} onPress={() => router.push(`/diaper/${item.id}`)}>
      <IconChip icon={meta.icon} accent={meta.color} tint={meta.bg} />
      <View style={styles.rowBody}>
        <Text style={styles.rowType}>{meta.label}</Text>
        <Text style={styles.rowDatetime}>
          {timeHHmm(item.happened_at)} · {rowDate(item.happened_at)}
        </Text>
      </View>
      <View style={styles.rowMeta}>
        <Text style={styles.rowWhen}>{relativeTime(item.happened_at, now)}</Text>
        <View style={styles.rowProfile}>
          <Avatar profile={profile} size={20} />
          <Text style={styles.rowName}>{profile?.display_name}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function DiaperScreen() {
  const { data: baby } = useBaby();
  const { data: diapers } = useDiapers(baby?.id);
  const logDiaper = useLogDiaper();
  const now = useNowTick(false);

  function log(type: DiaperType) {
    if (!baby) return;
    logDiaper.mutate({
      baby_id: baby.id,
      happened_at: new Date().toISOString(),
      type,
      note: null,
    });
  }

  return (
    <Screen scroll={false} topInset>
      <View style={styles.titleRow}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.heading}>Diaper</Text>
      </View>
      <FlatList
        style={styles.list}
        data={diapers ?? []}
        keyExtractor={(d) => d.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <Card>
              <View style={styles.quickLogGrid}>
                {TYPES.map((type) => {
                  const meta = diaperMeta[type];
                  return (
                    <View key={type} style={styles.quickLogCell}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.quickLogButton,
                          { backgroundColor: meta.bg },
                          pressed && styles.quickLogButtonPressed,
                          (!baby || logDiaper.isPending) && styles.quickLogButtonDisabled,
                        ]}
                        disabled={!baby || logDiaper.isPending}
                        onPress={() => log(type)}
                      >
                        <Ionicons name={meta.icon} size={22} color={meta.color} />
                        <Text style={[styles.quickLogLabel, { color: meta.color }]}>
                          {meta.label}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
              {logDiaper.isError ? (
                <Text style={styles.error}>{logDiaper.error.message}</Text>
              ) : null}
            </Card>
            <Text style={styles.sectionLabel}>RECENT DIAPERS</Text>
          </View>
        }
        renderItem={({ item }) => <DiaperRow item={item} now={now} />}
        ListEmptyComponent={<Text style={styles.empty}>No diapers yet</Text>}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#221f1b',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  heading: { fontSize: fontSize.xl, fontFamily: fontFamily.bold, color: colors.text },
  header: { marginBottom: spacing.sm, gap: spacing.md },
  quickLogGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickLogCell: { flexBasis: '48%', flexGrow: 1 },
  quickLogButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  quickLogButtonPressed: { opacity: 0.7 },
  quickLogButtonDisabled: { opacity: 0.5 },
  quickLogLabel: { fontSize: fontSize.md, fontFamily: fontFamily.semibold },
  error: { color: colors.danger, marginTop: spacing.sm },
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
  rowType: { fontFamily: fontFamily.bold, fontSize: fontSize.md, color: colors.text },
  rowDatetime: { color: colors.mutedDark, fontFamily: fontFamily.regular, fontSize: fontSize.sm },
  rowMeta: { alignItems: 'flex-end', gap: spacing.xs },
  rowWhen: { color: colors.muted, fontSize: fontSize.sm, fontFamily: fontFamily.regular },
  rowProfile: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  rowName: { color: colors.text, fontSize: fontSize.sm, fontFamily: fontFamily.regular },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 24 },
});
