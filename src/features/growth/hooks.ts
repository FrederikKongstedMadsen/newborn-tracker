import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

import type { GrowthMeasurement, NewGrowthMeasurement } from './types';

export function useGrowthMeasurements(babyId: string | undefined) {
  return useQuery({
    queryKey: ['growth_measurements', babyId],
    enabled: !!babyId,
    queryFn: async (): Promise<GrowthMeasurement[]> => {
      const { data, error } = await supabase
        .from('growth_measurements')
        .select('*')
        .eq('baby_id', babyId!)
        .order('measured_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

function useInvalidateMeasurements() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['growth_measurements'] });
}

export function useAddMeasurement() {
  const invalidate = useInvalidateMeasurements();
  return useMutation({
    mutationFn: async (measurement: NewGrowthMeasurement) => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('growth_measurements')
        .insert({ ...measurement, created_by: auth.user!.id });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateMeasurement() {
  const invalidate = useInvalidateMeasurements();
  return useMutation({
    mutationFn: async ({ id, ...fields }: Partial<NewGrowthMeasurement> & { id: string }) => {
      const { error } = await supabase.from('growth_measurements').update(fields).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteMeasurement() {
  const invalidate = useInvalidateMeasurements();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('growth_measurements').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}
