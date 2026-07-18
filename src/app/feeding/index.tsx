import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Card } from '@/components/Card';
import { IconChip } from '@/components/IconChip';
import { RowAttribution } from '@/components/RowAttribution';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { useBaby } from '@/features/baby/hooks';
import { BreastFeedCard } from '@/features/feeding/BreastFeedCard';
import { FeedingChart } from '@/features/feeding/FeedingChart';
import { feedSummary, totalElapsedSeconds } from '@/features/feeding/feedMath';
import { FormulaForm } from '@/features/feeding/FormulaForm';
import { useActiveFeed, useFeeds } from '@/features/feeding/hooks';
import type { Feed } from '@/features/feeding/types';
import { useNowTick } from '@/features/feeding/useNowTick';
import { useProfileMap } from '@/features/profiles/hooks';
import { relativeTime, timeHHmm } from '@/lib/dates';
import { formatDuration } from '@/lib/duration';
import { colors, fontFamily, fontSize, radius, spacing, trackerColors } from '@/lib/theme';

type Segment = 'Breast' | 'Formula';

function BreastFeedBanner({ feed, onPress }: { feed: Feed; onPress: () => void }) {
  const now = useNowTick(true);
  const seconds = totalElapsedSeconds(feed, now);
  return (
    <Card onPress={onPress}>
      <View style={styles.bannerRow}>
        <IconChip
          icon={trackerColors.feeding.icon}
          accent={trackerColors.feeding.accent}
          tint={trackerColors.feeding.tint}
          size={32}
        />
        <Text style={styles.bannerText}>Breast feed running · {formatDuration(seconds)}</Text>
      </View>
    </Card>
  );
}

function rowDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function FeedRow({ item, now }: { item: Feed; now: number }) {
  const { data: profileMap } = useProfileMap();
  const profile = profileMap?.get(item.created_by);

  return (
    <Pressable style={styles.row} onPress={() => router.push(`/feeding/${item.id}`)}>
      <IconChip
        icon={trackerColors.feeding.icon}
        accent={trackerColors.feeding.accent}
        tint={trackerColors.feeding.tint}
      />
      <View style={styles.rowBody}>
        <Text style={styles.rowSummary}>{feedSummary(item)}</Text>
        <Text style={styles.rowDatetime}>
          {timeHHmm(item.started_at)} · {rowDate(item.started_at)}
        </Text>
      </View>
      <RowAttribution
        note={item.note}
        timeLabel={relativeTime(item.ended_at ?? item.started_at, now)}
        profile={profile}
      />
    </Pressable>
  );
}

export default function FeedingScreen() {
  const { data: baby } = useBaby();
  const { data: activeFeed } = useActiveFeed(baby?.id);
  const { data: feeds } = useFeeds(baby?.id);
  const { width } = useWindowDimensions();
  const now = useNowTick(false);
  const [segment, setSegment] = useState<Segment>('Breast');

  return (
    <Screen scroll={false} topInset>
      <View style={styles.titleRow}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.heading}>Feeding</Text>
      </View>
      <FlatList
        style={styles.list}
        data={(feeds ?? []).filter((f) => f.ended_at !== null)}
        keyExtractor={(f) => f.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <SegmentedControl
              options={['Breast', 'Formula']}
              selected={segment}
              onSelect={(option) => setSegment(option as Segment)}
            />
            {segment === 'Breast' ? (
              <BreastFeedCard babyId={baby?.id} feed={activeFeed} />
            ) : (
              <>
                {activeFeed ? (
                  <BreastFeedBanner feed={activeFeed} onPress={() => setSegment('Breast')} />
                ) : null}
                <Card>
                  <FormulaForm babyId={baby?.id} />
                </Card>
              </>
            )}
            <Card>
              <View style={styles.chartTitleRow}>
                <Text style={styles.chartTitle}>Feeds per day</Text>
                <Text style={styles.chartSubtitle}>count · last 7 days</Text>
              </View>
              <FeedingChart feeds={feeds ?? []} width={width - 32 - spacing.md * 2} />
            </Card>
            <Text style={styles.sectionLabel}>RECENT FEEDS</Text>
          </View>
        }
        renderItem={({ item }) => <FeedRow item={item} now={now} />}
        ListEmptyComponent={<Text style={styles.empty}>No feeds yet</Text>}
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
  bannerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bannerText: { fontFamily: fontFamily.semibold, fontSize: fontSize.md, color: colors.text },
  chartTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  chartTitle: { fontFamily: fontFamily.bold, fontSize: fontSize.md, color: colors.text },
  chartSubtitle: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.muted },
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
  rowSummary: { fontFamily: fontFamily.bold, fontSize: fontSize.md, color: colors.text },
  rowDatetime: { color: colors.mutedDark, fontFamily: fontFamily.regular, fontSize: fontSize.sm },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 24 },
});
