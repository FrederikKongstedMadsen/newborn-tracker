import { router } from 'expo-router';

import { useNowTick } from '@/features/feeding/useNowTick';
import { useDoses, useTemperatures } from '@/features/sick/hooks';
import { tempInfo } from '@/features/sick/sickMath';
import { relativeTime } from '@/lib/dates';

import { StatusCard } from './StatusCard';

export function SickStatusCard({ babyId }: { babyId: string }) {
  const { data: temperatures } = useTemperatures(babyId);
  const { data: doses } = useDoses(babyId);
  const now = useNowTick(false);
  const latestTemp = temperatures?.[0];
  const latestDose = doses?.[0];

  let value = 'No entries yet';
  let meta = 'tap to add';
  let valueColor: string | undefined;

  if (latestTemp) {
    value = `${latestTemp.celsius.toFixed(1)} °C`;
    valueColor = tempInfo(latestTemp.celsius).color;
    meta = latestDose
      ? `${latestDose.medicine} · ${relativeTime(latestDose.given_at, now)}`
      : relativeTime(latestTemp.measured_at, now);
  } else if (latestDose) {
    value = `${latestDose.medicine} · ${relativeTime(latestDose.given_at, now)}`;
    meta = 'last dose';
  }

  return (
    <StatusCard
      tracker="temperature"
      value={value}
      meta={meta}
      valueColor={valueColor}
      onPress={() => router.push('/sick')}
    />
  );
}
