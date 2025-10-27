import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../services/api';
import {
  createProfessional,
  getProfessional,
  listProfessionals,
  removeProfessional,
  updateProfessional,
} from '../../services/professionalsService';
import type {
  CreateProfessionalDto,
  Professional,
  UpdateProfessionalDto,
} from '../../types/professional';

export function useProfessionalsQuery(params?: Parameters<typeof listProfessionals>[0]) {
  return useQuery({
    queryKey: [queryKeys.professionals[0], params],
    queryFn: () => listProfessionals(params),
  });
}

export function useProfessionalQuery(id: number, enabled = true) {
  return useQuery({
    queryKey: [queryKeys.professionals[0], id],
    queryFn: () => getProfessional(id),
    enabled,
  });
}

export function useCreateProfessional() {
  const queryClient = useQueryClient();
  return useMutation<Professional, unknown, CreateProfessionalDto>({
    mutationFn: createProfessional,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.professionals });
    },
  });
}

export function useUpdateProfessional(id: number) {
  const queryClient = useQueryClient();
  return useMutation<Professional, unknown, UpdateProfessionalDto>({
    mutationFn: (payload) => updateProfessional(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.professionals });
      queryClient.invalidateQueries({ queryKey: [queryKeys.professionals[0], id] });
    },
  });
}

export function useDeleteProfessional() {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, number>({
    mutationFn: (id) => removeProfessional(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.professionals });
    },
  });
}
