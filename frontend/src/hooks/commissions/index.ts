import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../services/api';
import {
  createCommission,
  getCommission,
  listCommissions,
  removeCommission,
  updateCommission,
} from '../../services/commissionsService';
import type { Commission, CreateCommissionDto, UpdateCommissionDto } from '../../types/commission';

export function useCommissionsQuery(params?: Parameters<typeof listCommissions>[0]) {
  return useQuery({
    queryKey: [queryKeys.commissions[0], params],
    queryFn: () => listCommissions(params),
  });
}

export function useCommissionQuery(id: number, enabled = true) {
  return useQuery({
    queryKey: [queryKeys.commissions[0], id],
    queryFn: () => getCommission(id),
    enabled,
  });
}

export function useCreateCommission() {
  const queryClient = useQueryClient();
  return useMutation<Commission, unknown, CreateCommissionDto>({
    mutationFn: createCommission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.commissions });
    },
  });
}

export function useUpdateCommission(id: number) {
  const queryClient = useQueryClient();
  return useMutation<Commission, unknown, UpdateCommissionDto>({
    mutationFn: (payload) => updateCommission(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.commissions });
      queryClient.invalidateQueries({ queryKey: [queryKeys.commissions[0], id] });
    },
  });
}

export function useDeleteCommission() {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, number>({
    mutationFn: (id) => removeCommission(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.commissions });
    },
  });
}
