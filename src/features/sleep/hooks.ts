import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

import type { Sleep, SleepWithPauses } from './types';

export function useSleeps(babyId: string | undefined) {
  return useQuery({
    queryKey: ['sleeps', babyId],
    enabled: !!babyId,
    queryFn: async (): Promise<SleepWithPauses[]> => {
      const { data, error } = await supabase
        .from('sleeps')
        .select('*, sleep_pauses(*)')
        .eq('baby_id', babyId!)
        .order('started_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useActiveSleep(babyId: string | undefined) {
  return useQuery({
    queryKey: ['sleeps', babyId, 'active'],
    enabled: !!babyId,
    refetchInterval: 10_000,
    queryFn: async (): Promise<SleepWithPauses | null> => {
      const { data, error } = await supabase
        .from('sleeps')
        .select('*, sleep_pauses(*)')
        .eq('baby_id', babyId!)
        .is('ended_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

function useInvalidateSleeps() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['sleeps'] });
}

export function useStartSleep() {
  const invalidate = useInvalidateSleeps();
  return useMutation({
    mutationFn: async ({ babyId }: { babyId: string }) => {
      const { data: auth } = await supabase.auth.getUser();
      const nowIso = new Date().toISOString();
      const { error } = await supabase.from('sleeps').insert({
        baby_id: babyId,
        started_at: nowIso,
        created_by: auth.user!.id,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function usePauseSleep() {
  const invalidate = useInvalidateSleeps();
  return useMutation({
    mutationFn: async ({ sleepId }: { sleepId: string }) => {
      const nowIso = new Date().toISOString();
      const { error } = await supabase.from('sleep_pauses').insert({
        sleep_id: sleepId,
        started_at: nowIso,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useResumeSleep() {
  const invalidate = useInvalidateSleeps();
  return useMutation({
    mutationFn: async ({ pauseId }: { pauseId: string }) => {
      const nowIso = new Date().toISOString();
      const { error } = await supabase
        .from('sleep_pauses')
        .update({ ended_at: nowIso })
        .eq('id', pauseId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useStopSleep() {
  const invalidate = useInvalidateSleeps();
  return useMutation({
    mutationFn: async (sleep: SleepWithPauses) => {
      const nowMs = Date.now();
      const nowIso = new Date(nowMs).toISOString();
      const openPause = sleep.sleep_pauses.find((pause) => pause.ended_at === null);
      if (openPause) {
        const { error: pauseError } = await supabase
          .from('sleep_pauses')
          .update({ ended_at: nowIso })
          .eq('id', openPause.id);
        if (pauseError) throw pauseError;
      }
      const { error } = await supabase
        .from('sleeps')
        .update({ ended_at: nowIso })
        .eq('id', sleep.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateSleep() {
  const invalidate = useInvalidateSleeps();
  return useMutation({
    mutationFn: async ({
      id,
      ...fields
    }: Partial<Pick<Sleep, 'started_at' | 'ended_at' | 'note'>> & { id: string }) => {
      const { error } = await supabase.from('sleeps').update(fields).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteSleep() {
  const invalidate = useInvalidateSleeps();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sleeps').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useDeletePause() {
  const invalidate = useInvalidateSleeps();
  return useMutation({
    mutationFn: async (pauseId: string) => {
      const { error } = await supabase.from('sleep_pauses').delete().eq('id', pauseId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}
