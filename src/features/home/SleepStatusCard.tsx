import { router } from 'expo-router';

import { useNowTick } from '@/features/feeding/useNowTick';
import { useActiveSleep, useSleeps } from '@/features/sleep/hooks';
import { effectiveSleepSeconds, sleepState, sleepSummary } from '@/features/sleep/sleepMath';
import { relativeTime } from '@/lib/dates';
import { formatDuration } from '@/lib/duration';

import { StatusCard } from './StatusCard';

export function SleepStatusCard({ babyId }: { babyId: string }) {
  const { data: activeSleep } = useActiveSleep(babyId);
  const { data: sleeps } = useSleeps(babyId);
  const now = useNowTick(!!activeSleep);
  const latest = sleeps?.find((s) => s.ended_at !== null);

  const state = activeSleep ? sleepState(activeSleep, activeSleep.sleep_pauses) : null;
  const openPause = activeSleep?.sleep_pauses.find((pause) => pause.ended_at === null);

  let value = 'No sleeps yet';
  let meta = 'tap to start';

  if (activeSleep && state === 'paused' && openPause) {
    value = `Paused · ${formatDuration(
      Math.max(0, Math.floor((now - Date.parse(openPause.started_at)) / 1000)),
    )} awake`;
    meta = 'paused';
  } else if (activeSleep) {
    value = `Sleeping · ${formatDuration(
      effectiveSleepSeconds(activeSleep, activeSleep.sleep_pauses, now),
    )}`;
    meta = 'running';
  } else if (latest) {
    value = sleepSummary(latest, latest.sleep_pauses, Date.parse(latest.ended_at!));
    meta = relativeTime(latest.ended_at ?? latest.started_at, now);
  }

  return (
    <StatusCard tracker="sleep" value={value} meta={meta} onPress={() => router.push('/sleep')} />
  );
}
