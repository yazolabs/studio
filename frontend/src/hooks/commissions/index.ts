import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../services/api";
import { createCommission, getCommission, listCommissions, removeCommission, updateCommission, markCommissionAsPaid } from "../../services/commissionsService";
import type { Commission, CreateCommissionDto, UpdateCommissionDto } from "../../types/commission";
import { toast } from "sonner";

function getLinkedAccountPayableId(c: any): number | null {
  return (
    c?.account_payable_id ??
    c?.accountPayable?.id ??
    c?.account_payable?.id ??
    null
  );
}

export function useCommissionsQuery(params?: Parameters<typeof listCommissions>[0]) {
  return useQuery<Commission[]>({
    queryKey: [queryKeys.commissions[0], params],
    queryFn: () => listCommissions(params),
  });
}

export function useCommissionQuery(id: number, enabled = true) {
  return useQuery<Commission>({
    queryKey: [queryKeys.commissions[0], id],
    queryFn: () => getCommission(id),
    enabled,
  });
}

export function useCreateCommission() {
  const queryClient = useQueryClient();
  return useMutation<Commission, unknown, CreateCommissionDto>({
    mutationFn: createCommission,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.commissions });
      queryClient.invalidateQueries({ queryKey: queryKeys.accountsPayable });

      const apId = getLinkedAccountPayableId(data);
      if (apId) queryClient.invalidateQueries({ queryKey: [queryKeys.accountsPayable[0], apId] });
    },
  });
}

export function useUpdateCommission(id: number) {
  const queryClient = useQueryClient();
  return useMutation<Commission, unknown, UpdateCommissionDto>({
    mutationFn: (payload) => updateCommission(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.commissions });
      queryClient.invalidateQueries({ queryKey: [queryKeys.commissions[0], id] });
      queryClient.invalidateQueries({ queryKey: queryKeys.accountsPayable });

      const apId = getLinkedAccountPayableId(data);
      if (apId) queryClient.invalidateQueries({ queryKey: [queryKeys.accountsPayable[0], apId] });
    },
  });
}

export function useDeleteCommission() {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, number>({
    mutationFn: (id) => removeCommission(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.commissions });
      queryClient.invalidateQueries({ queryKey: queryKeys.accountsPayable });
    },
  });
}

export function useMarkCommissionAsPaid() {
  const queryClient = useQueryClient();

  return useMutation<Commission, unknown, number>({
    mutationFn: (id) => markCommissionAsPaid(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.commissions });
      queryClient.invalidateQueries({ queryKey: [queryKeys.commissions[0], data.id] });
      queryClient.invalidateQueries({ queryKey: queryKeys.accountsPayable });

      const apId = getLinkedAccountPayableId(data);
      if (apId) queryClient.invalidateQueries({ queryKey: [queryKeys.accountsPayable[0], apId] });

      toast.success(`Comissão #${data.id} marcada como paga com sucesso!`);
    },
    onError: () => {
      toast.error("Erro ao marcar comissão como paga.");
    },
  });
}
