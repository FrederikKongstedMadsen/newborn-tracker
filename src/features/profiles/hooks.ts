import { useMutation, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

import type { Profile } from './types';

export function useProfileMap(): UseQueryResult<Map<string, Profile>> {
  return useQuery({
    queryKey: ['profiles'],
    staleTime: Infinity,
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      return data;
    },
    select: (profiles) => new Map(profiles.map((profile) => [profile.id, profile])),
  });
}

/** The signed-in user's own profile row (may not exist yet). */
export function useMyProfile(): UseQueryResult<Profile | null> {
  return useQuery({
    queryKey: ['profiles', 'me'],
    queryFn: async (): Promise<Profile | null> => {
      const { data: auth } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', auth.user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

interface NewMyProfile {
  display_name: string;
  color: string;
  emoji: string | null;
}

/** Creates or updates the signed-in user's own profile row. */
export function useSaveMyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: NewMyProfile): Promise<Profile> => {
      const { data: auth } = await supabase.auth.getUser();
      const row = { ...profile, id: auth.user!.id };
      const { data, error } = await supabase.from('profiles').upsert(row).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profiles'] }),
  });
}
