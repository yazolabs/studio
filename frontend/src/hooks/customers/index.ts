import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../services/api';
import {
  createCustomer,
  getCustomer,
  listCustomers,
  removeCustomer,
  updateCustomer,
} from '../../services/customersService';
import type { CreateCustomerDto, Customer, UpdateCustomerDto } from '../../types/customer';

export function useCustomersQuery(params?: Parameters<typeof listCustomers>[0]) {
  return useQuery({
    queryKey: [queryKeys.customers[0], params],
    queryFn: () => listCustomers(params),
  });
}

export function useCustomerQuery(id: number, enabled = true) {
  return useQuery({
    queryKey: [queryKeys.customers[0], id],
    queryFn: () => getCustomer(id),
    enabled,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation<Customer, unknown, CreateCustomerDto>({
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers });
    },
  });
}

export function useUpdateCustomer(id: number) {
  const queryClient = useQueryClient();
  return useMutation<Customer, unknown, UpdateCustomerDto>({
    mutationFn: (payload) => updateCustomer(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers });
      queryClient.invalidateQueries({ queryKey: [queryKeys.customers[0], id] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, number>({
    mutationFn: (id) => removeCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers });
    },
  });
}
