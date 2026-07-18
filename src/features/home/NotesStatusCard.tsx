import { router } from 'expo-router';

import { useNowTick } from '@/features/feeding/useNowTick';
import { useNotes } from '@/features/notes/hooks';
import { relativeTime } from '@/lib/dates';

import { StatusCard } from './StatusCard';

export function NotesStatusCard({ babyId }: { babyId: string }) {
  const { data: notes } = useNotes(babyId);
  const now = useNowTick(false);
  const latest = notes?.[0];

  return (
    <StatusCard
      tracker="notes"
      value={latest ? latest.body : 'No notes yet'}
      meta={latest ? relativeTime(latest.noted_at, now) : 'tap to write'}
      onPress={() => router.push('/notes')}
    />
  );
}
