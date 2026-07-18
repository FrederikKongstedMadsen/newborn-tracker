import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

import type { Diaper, NewDiaper } from './types';

export function useDiapers(babyId: string | undefined) {
  return useQuery({
    queryKey: ['diapers', babyId],
    enabled: !!babyId,
    queryFn: async (): Promise<Diaper[]> => {
      const { data, error } = await supabase
        .from('diapers')
        .select('*')
        .eq('baby_id', babyId!)
        .order('happened_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

function useInvalidateDiapers() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['diapers'] });
}

export function useLogDiaper() {
  const invalidate = useInvalidateDiapers();
  return useMutation({
    mutationFn: async (diaper: NewDiaper) => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from('diapers').insert({
        ...diaper,
        created_by: auth.user!.id,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateDiaper() {
  const invalidate = useInvalidateDiapers();
  return useMutation({
    mutationFn: async ({
      id,
      ...fields
    }: Partial<Pick<Diaper, 'happened_at' | 'type' | 'note'>> & { id: string }) => {
      const { error } = await supabase.from('diapers').update(fields).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteDiaper() {
  const invalidate = useInvalidateDiapers();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('diapers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}
