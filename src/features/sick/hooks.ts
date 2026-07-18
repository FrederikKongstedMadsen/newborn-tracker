import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

import type { MedicineDose, NewMedicineDose, NewTemperature, Temperature } from './types';

export function useTemperatures(babyId: string | undefined) {
  return useQuery({
    queryKey: ['temperatures', babyId],
    enabled: !!babyId,
    queryFn: async (): Promise<Temperature[]> => {
      const { data, error } = await supabase
        .from('temperatures')
        .select('*')
        .eq('baby_id', babyId!)
        .order('measured_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

function useInvalidateTemperatures() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['temperatures'] });
}

export function useLogTemperature() {
  const invalidate = useInvalidateTemperatures();
  return useMutation({
    mutationFn: async (temperature: NewTemperature) => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('temperatures')
        .insert({ ...temperature, created_by: auth.user!.id });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateTemperature() {
  const invalidate = useInvalidateTemperatures();
  return useMutation({
    mutationFn: async ({ id, ...fields }: Partial<NewTemperature> & { id: string }) => {
      const { error } = await supabase.from('temperatures').update(fields).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteTemperature() {
  const invalidate = useInvalidateTemperatures();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('temperatures').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useDoses(babyId: string | undefined) {
  return useQuery({
    queryKey: ['medicine_doses', babyId],
    enabled: !!babyId,
    queryFn: async (): Promise<MedicineDose[]> => {
      const { data, error } = await supabase
        .from('medicine_doses')
        .select('*')
        .eq('baby_id', babyId!)
        .order('given_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

function useInvalidateDoses() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['medicine_doses'] });
}

export function useLogDose() {
  const invalidate = useInvalidateDoses();
  return useMutation({
    mutationFn: async (dose: NewMedicineDose) => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('medicine_doses')
        .insert({ ...dose, created_by: auth.user!.id });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateDose() {
  const invalidate = useInvalidateDoses();
  return useMutation({
    mutationFn: async ({ id, ...fields }: Partial<NewMedicineDose> & { id: string }) => {
      const { error } = await supabase.from('medicine_doses').update(fields).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteDose() {
  const invalidate = useInvalidateDoses();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('medicine_doses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}
