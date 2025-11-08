import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createCustomer, getCustomer, listCustomers, removeCustomer, updateCustomer } from '@/services/customersService';
import type { CreateCustomerDto, Customer, UpdateCustomerDto } from '@/types/customer';
import type { Paginated } from '@/types/pagination';
import { queryKeys } from '@/services/api';

export function useCustomersQuery(params?: Parameters<typeof listCustomers>[0]) {
  return useQuery<Paginated<Customer>>({
    queryKey: [queryKeys.customers?.[0] ?? 'customers', params],
    queryFn: () => listCustomers(params),
  });
}

export function useCustomerQuery(id: number, enabled = true) {
  return useQuery<Customer>({
    queryKey: [queryKeys.customers?.[0] ?? 'customers', id],
    queryFn: () => getCustomer(id),
    enabled,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation<Customer, unknown, CreateCustomerDto>({
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers ?? ['customers'] });
    },
  });
}

export function useUpdateCustomer(id: number) {
  const queryClient = useQueryClient();

  return useMutation<Customer, unknown, UpdateCustomerDto>({
    mutationFn: (payload) => updateCustomer(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers ?? ['customers'] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.customers?.[0] ?? 'customers', id] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, number>({
    mutationFn: (id) => removeCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers ?? ['customers'] });
    },
  });
}
