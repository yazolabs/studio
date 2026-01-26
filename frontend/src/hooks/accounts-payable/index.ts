import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createAccountPayable, getAccountPayable, listAccountsPayable, removeAccountPayable, updateAccountPayable, markAccountAsPaid } from '../../services/accountsPayableService';
import type { AccountPayable, CreateAccountPayableDto, UpdateAccountPayableDto } from '../../types/account-payable';
import { toast } from 'sonner';
import { queryKeys } from '../../services/api';

export function useAccountsPayableQuery(
  params?: Parameters<typeof listAccountsPayable>[0]
) {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accountsPayable });
    },
  });
}

export function useUpdateAccountPayable(id: number) {
  const queryClient = useQueryClient();
  return useMutation<AccountPayable, unknown, UpdateAccountPayableDto>({
    mutationFn: (payload) => updateAccountPayable(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accountsPayable });
      queryClient.invalidateQueries({
        queryKey: [queryKeys.accountsPayable[0], id],
      });
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
      queryClient.invalidateQueries({
        queryKey: [queryKeys.accountsPayable[0], data.id],
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.cashierTransactions,
      });
      toast.success(`Conta #${data.id} marcada como paga com sucesso!`);
    },
    onError: () => {
      toast.error('Erro ao marcar conta como paga.');
    },
  });
}
