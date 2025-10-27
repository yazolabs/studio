import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../services/api';
import {
  createAccountPayable,
  getAccountPayable,
  listAccountsPayable,
  removeAccountPayable,
  updateAccountPayable,
} from '../../services/accountsPayableService';
import type {
  AccountPayable,
  CreateAccountPayableDto,
  UpdateAccountPayableDto,
} from '../../types/account-payable';

export function useAccountsPayableQuery(params?: Parameters<typeof listAccountsPayable>[0]) {
  return useQuery({
    queryKey: [queryKeys.accountsPayable[0], params],
    queryFn: () => listAccountsPayable(params),
  });
}

export function useAccountPayableQuery(id: number, enabled = true) {
  return useQuery({
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
      queryClient.invalidateQueries({ queryKey: [queryKeys.accountsPayable[0], id] });
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
