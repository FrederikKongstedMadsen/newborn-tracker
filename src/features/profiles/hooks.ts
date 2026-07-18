import { useQuery, UseQueryResult } from '@tanstack/react-query';

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
