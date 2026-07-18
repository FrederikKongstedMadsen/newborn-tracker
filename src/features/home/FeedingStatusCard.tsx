import { router } from 'expo-router';

import { feedSummary, totalElapsedSeconds } from '@/features/feeding/feedMath';
import { useActiveFeed, useFeeds } from '@/features/feeding/hooks';
import { useNowTick } from '@/features/feeding/useNowTick';
import { relativeTime } from '@/lib/dates';
import { formatDuration } from '@/lib/duration';

import { StatusCard } from './StatusCard';

export function FeedingStatusCard({ babyId }: { babyId: string }) {
  const { data: activeFeed } = useActiveFeed(babyId);
  const { data: feeds } = useFeeds(babyId);
  const now = useNowTick(!!activeFeed);
  const latest = feeds?.find((f) => f.ended_at !== null);

  let value = 'No feeds yet';
  let meta = 'tap to start';

  if (activeFeed) {
    const total = formatDuration(totalElapsedSeconds(activeFeed, now));
    if (activeFeed.active_side === null) {
      value = total;
      meta = 'paused';
    } else {
      value = `${total} · ${activeFeed.active_side}`;
      meta = 'running';
    }
  } else if (latest) {
    value = feedSummary(latest);
    meta = relativeTime(latest.ended_at ?? latest.started_at, now);
  }

  return (
    <StatusCard
      tracker="feeding"
      value={value}
      meta={meta}
      onPress={() => router.push('/feeding')}
    />
  );
}
