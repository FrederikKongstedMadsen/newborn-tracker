import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

import type { Feed, FeedSide, NewFormulaFeed } from './types';

export function useFeeds(babyId: string | undefined) {
  return useQuery({
    queryKey: ['feeds', babyId],
    enabled: !!babyId,
    queryFn: async (): Promise<Feed[]> => {
      const { data, error } = await supabase
        .from('feeds')
        .select('*')
        .eq('baby_id', babyId!)
        .order('started_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useActiveFeed(babyId: string | undefined) {
  return useQuery({
    queryKey: ['feeds', babyId, 'active'],
    enabled: !!babyId,
    refetchInterval: 10_000,
    queryFn: async (): Promise<Feed | null> => {
      const { data, error } = await supabase
        .from('feeds')
        .select('*')
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

function useInvalidateFeeds() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['feeds'] });
}

export function useStartBreastFeed() {
  const invalidate = useInvalidateFeeds();
  return useMutation({
    mutationFn: async ({ babyId, side }: { babyId: string; side: FeedSide }) => {
      const { data: auth } = await supabase.auth.getUser();
      const nowIso = new Date().toISOString();
      const { error } = await supabase.from('feeds').insert({
        baby_id: babyId,
        type: 'breast',
        started_at: nowIso,
        active_side: side,
        active_side_started_at: nowIso,
        created_by: auth.user!.id,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

/** Bank the running side's seconds into the feed row; returns update fields. */
function bankActiveSide(feed: Feed, nowMs: number) {
  const fields = { left_seconds: feed.left_seconds, right_seconds: feed.right_seconds };
  if (feed.active_side && feed.active_side_started_at) {
    const ran = Math.max(0, Math.floor((nowMs - Date.parse(feed.active_side_started_at)) / 1000));
    if (feed.active_side === 'left') fields.left_seconds += ran;
    else fields.right_seconds += ran;
  }
  return fields;
}

export function useToggleSide() {
  const invalidate = useInvalidateFeeds();
  return useMutation({
    mutationFn: async ({ feed, side }: { feed: Feed; side: FeedSide }) => {
      const nowMs = Date.now();
      const banked = bankActiveSide(feed, nowMs);
      const { error } = await supabase
        .from('feeds')
        .update({
          ...banked,
          active_side: side,
          active_side_started_at: new Date(nowMs).toISOString(),
        })
        .eq('id', feed.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function usePauseFeed() {
  const invalidate = useInvalidateFeeds();
  return useMutation({
    mutationFn: async (feed: Feed) => {
      const nowMs = Date.now();
      const banked = bankActiveSide(feed, nowMs);
      const { error } = await supabase
        .from('feeds')
        .update({
          ...banked,
          active_side: null,
          active_side_started_at: null,
        })
        .eq('id', feed.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useStopFeed() {
  const invalidate = useInvalidateFeeds();
  return useMutation({
    mutationFn: async (feed: Feed) => {
      const nowMs = Date.now();
      const banked = bankActiveSide(feed, nowMs);
      const { error } = await supabase
        .from('feeds')
        .update({
          ...banked,
          active_side: null,
          active_side_started_at: null,
          ended_at: new Date(nowMs).toISOString(),
        })
        .eq('id', feed.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useLogFormula() {
  const invalidate = useInvalidateFeeds();
  return useMutation({
    mutationFn: async (formula: NewFormulaFeed) => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from('feeds').insert({
        baby_id: formula.baby_id,
        type: 'formula',
        started_at: formula.at,
        ended_at: formula.at,
        volume_ml: formula.volume_ml,
        note: formula.note,
        created_by: auth.user!.id,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateFeed() {
  const invalidate = useInvalidateFeeds();
  return useMutation({
    mutationFn: async ({
      id,
      ...fields
    }: Partial<
      Pick<
        Feed,
        'started_at' | 'ended_at' | 'left_seconds' | 'right_seconds' | 'volume_ml' | 'note'
      >
    > & { id: string }) => {
      const { error } = await supabase.from('feeds').update(fields).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteFeed() {
  const invalidate = useInvalidateFeeds();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('feeds').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}
