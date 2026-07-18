import { router } from 'expo-router';

import { todayCount } from '@/features/diaper/diaperMath';
import { useDiapers } from '@/features/diaper/hooks';
import { useNowTick } from '@/features/feeding/useNowTick';
import { relativeTime, todayIso } from '@/lib/dates';

import { StatusCard } from './StatusCard';

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function DiaperStatusCard({ babyId }: { babyId: string }) {
  const { data: diapers } = useDiapers(babyId);
  const now = useNowTick(false);
  const latest = diapers?.[0];

  let value = 'No diapers yet';
  let meta = 'tap to log';

  if (latest) {
    value = capitalize(latest.type);
    meta = `${relativeTime(latest.happened_at, now)} · ${todayCount(diapers ?? [], todayIso())} today`;
  }

  return (
    <StatusCard tracker="diaper" value={value} meta={meta} onPress={() => router.push('/diaper')} />
  );
}
