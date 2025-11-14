import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../services/api';
import { createAccountPayable, getAccountPayable, listAccountsPayable, removeAccountPayable, updateAccountPayable } from '../../services/accountsPayableService';
import type { AccountPayable, CreateAccountPayableDto, UpdateAccountPayableDto } from '../../types/account-payable';
import { markAccountAsPaid } from '../../services/accountsPayableService';
import { toast } from 'sonner';

export function useAccountsPayableQuery(params?: Parameters<typeof listAccountsPayable>[0]) {
  return useQuery({
    queryKey: ['accounts-payable', params],
    queryFn: () => listAccountsPayable(params),
  });
}

export function useAccountPayableQuery(id: number, enabled = true) {
  return useQuery({
    queryKey: ['accounts-payable', id],
    queryFn: () => getAccountPayable(id),
    enabled,
  });
}

export function useCreateAccountPayable() {
  const queryClient = useQueryClient();
  return useMutation<AccountPayable, unknown, CreateAccountPayableDto>({
    mutationFn: createAccountPayable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
    },
  });
}

export function useUpdateAccountPayable(id: number) {
  const queryClient = useQueryClient();
  return useMutation<AccountPayable, unknown, UpdateAccountPayableDto>({
    mutationFn: (payload) => updateAccountPayable(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
    },
  });
}

export function useDeleteAccountPayable() {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, number>({
    mutationFn: (id) => removeAccountPayable(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
    },
  });
}

export function useMarkAccountAsPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => markAccountAsPaid(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
      toast.success(`Conta #${data.id} marcada como paga com sucesso!`);
    },
    onError: () => {
      toast.error('Erro ao marcar conta como paga.');
    },
  });
}
