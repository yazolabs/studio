import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createProfessional, getProfessional, listProfessionals, removeProfessional, updateProfessional } from '../../services/professionalsService';
import type { CreateProfessionalDto, Professional, UpdateProfessionalDto } from '../../types/professional';

const PROFESSIONALS_KEY = ['professionals'];

export function useProfessionalsQuery(params?: Parameters<typeof listProfessionals>[0]) {
  return useQuery({
    queryKey: [...PROFESSIONALS_KEY, params],
    queryFn: () => listProfessionals(params),
  });
}

export function useProfessionalQuery(id: number, enabled = true) {
  return useQuery({
    queryKey: [...PROFESSIONALS_KEY, id],
    queryFn: () => getProfessional(id),
    enabled,
  });
}

export function useCreateProfessional() {
  const queryClient = useQueryClient();
  return useMutation<Professional, unknown, CreateProfessionalDto>({
    mutationFn: createProfessional,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFESSIONALS_KEY });
    },
  });
}

export function useUpdateProfessional(id: number) {
  const queryClient = useQueryClient();
  return useMutation<Professional, unknown, UpdateProfessionalDto>({
    mutationFn: (payload) => updateProfessional(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFESSIONALS_KEY });
      queryClient.invalidateQueries({ queryKey: [...PROFESSIONALS_KEY, id] });
    },
  });
}

export function useDeleteProfessional() {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, number>({
    mutationFn: (id) => removeProfessional(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFESSIONALS_KEY });
    },
  });
}
