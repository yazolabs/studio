import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../services/api';
import {
  createCashierTransaction,
  getCashierTransaction,
  listCashierTransactions,
  removeCashierTransaction,
  updateCashierTransaction,
} from '../../services/cashierTransactionsService';
import type {
  CashierTransaction,
  CreateCashierTransactionDto,
  UpdateCashierTransactionDto,
} from '../../types/cashier-transaction';

export function useCashierTransactionsQuery(params?: Parameters<typeof listCashierTransactions>[0]) {
  return useQuery({
    queryKey: [queryKeys.cashier[0], params],
    queryFn: () => listCashierTransactions(params),
  });
}

export function useCashierTransactionQuery(id: number, enabled = true) {
  return useQuery({
    queryKey: [queryKeys.cashier[0], id],
    queryFn: () => getCashierTransaction(id),
    enabled,
  });
}

export function useCreateCashierTransaction() {
  const queryClient = useQueryClient();
  return useMutation<CashierTransaction, unknown, CreateCashierTransactionDto>({
    mutationFn: createCashierTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cashier });
    },
  });
}

export function useUpdateCashierTransaction(id: number) {
  const queryClient = useQueryClient();
  return useMutation<CashierTransaction, unknown, UpdateCashierTransactionDto>({
    mutationFn: (payload) => updateCashierTransaction(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cashier });
      queryClient.invalidateQueries({ queryKey: [queryKeys.cashier[0], id] });
    },
  });
}

export function useDeleteCashierTransaction() {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, number>({
    mutationFn: (id) => removeCashierTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cashier });
    },
  });
}
