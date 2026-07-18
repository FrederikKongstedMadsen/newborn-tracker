import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

import type { Baby, NewBaby } from './types';

export function useBaby() {
  return useQuery({
    queryKey: ['baby'],
    queryFn: async (): Promise<Baby | null> => {
      const { data, error } = await supabase.from('babies').select('*').limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** Creates the baby row, or updates it if `id` is passed. */
export function useSaveBaby() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (baby: NewBaby & { id?: string }): Promise<Baby> => {
      const { data: auth } = await supabase.auth.getUser();
      const row = { ...baby, created_by: auth.user!.id };
      const { data, error } = await supabase.from('babies').upsert(row).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['baby'] }),
  });
}
