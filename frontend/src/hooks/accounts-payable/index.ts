import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createAccountPayable, getAccountPayable, listAccountsPayable, removeAccountPayable, updateAccountPayable, markAccountAsPaid } from "../../services/accountsPayableService";
import type { AccountPayable, CreateAccountPayableDto, UpdateAccountPayableDto } from "../../types/account-payable";
import { toast } from "sonner";
import { queryKeys } from "../../services/api";

function invalidateLinkedCommission(queryClient: ReturnType<typeof useQueryClient>, ap?: AccountPayable | null) {
  if (!ap) return;
  if (ap.origin_type === "commission" && ap.origin_id) {
    queryClient.invalidateQueries({ queryKey: queryKeys.commissions });
    queryClient.invalidateQueries({ queryKey: [queryKeys.commissions[0], ap.origin_id] });
  }
}

export function useAccountsPayableQuery(params?: Parameters<typeof listAccountsPayable>[0]) {
  return useQuery<AccountPayable[]>({
    queryKey: [queryKeys.accountsPayable[0], params],
    queryFn: () => listAccountsPayable(params),
  });
}

export function useAccountPayableQuery(id: number, enabled = true) {
  return useQuery<AccountPayable>({
    queryKey: [queryKeys.accountsPayable[0], id],
    queryFn: () => getAccountPayable(id),
    enabled,
  });
}

export function useCreateAccountPayable() {
  const queryClient = useQueryClient();
  return useMutation<AccountPayable, unknown, CreateAccountPayableDto>({
    mutationFn: createAccountPayable,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accountsPayable });
      invalidateLinkedCommission(queryClient, data);
    },
  });
}

export function useUpdateAccountPayable(id: number) {
  const queryClient = useQueryClient();
  return useMutation<AccountPayable, unknown, UpdateAccountPayableDto>({
    mutationFn: (payload) => updateAccountPayable(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accountsPayable });
      queryClient.invalidateQueries({ queryKey: [queryKeys.accountsPayable[0], id] });

      invalidateLinkedCommission(queryClient, data);
    },
  });
}

export function useDeleteAccountPayable() {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, number>({
    mutationFn: (id) => removeAccountPayable(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accountsPayable });
    },
  });
}

export function useMarkAccountAsPaid() {
  const queryClient = useQueryClient();

  return useMutation<
    AccountPayable,
    unknown,
    { id: number; payment_method: string; payment_date: string }
  >({
    mutationFn: (input) =>
      markAccountAsPaid(input.id, {
        payment_method: input.payment_method,
        payment_date: input.payment_date,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accountsPayable });
      queryClient.invalidateQueries({ queryKey: [queryKeys.accountsPayable[0], data.id] });
      queryClient.invalidateQueries({ queryKey: queryKeys.cashierTransactions });

      invalidateLinkedCommission(queryClient, data);

      toast.success(`Conta #${data.id} marcada como paga com sucesso!`);
    },
    onError: () => {
      toast.error("Erro ao marcar conta como paga.");
    },
  });
}
