import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

import type { NewNote, Note } from './types';

export function useNotes(babyId: string | undefined) {
  return useQuery({
    queryKey: ['notes', babyId],
    enabled: !!babyId,
    queryFn: async (): Promise<Note[]> => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('baby_id', babyId!)
        .order('noted_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

function useInvalidateNotes() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['notes'] });
}

export function useAddNote() {
  const invalidate = useInvalidateNotes();
  return useMutation({
    mutationFn: async (note: NewNote) => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from('notes').insert({ ...note, created_by: auth.user!.id });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateNote() {
  const invalidate = useInvalidateNotes();
  return useMutation({
    mutationFn: async ({
      id,
      ...fields
    }: Partial<Pick<Note, 'noted_at' | 'body'>> & { id: string }) => {
      const { error } = await supabase.from('notes').update(fields).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteNote() {
  const invalidate = useInvalidateNotes();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}
