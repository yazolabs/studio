import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../services/api";
import { createSupplier, getSupplier, listSuppliers, removeSupplier, updateSupplier, SupplierQueryParams } from "../../services/suppliersService";
import type { CreateSupplierDto, Supplier, UpdateSupplierDto } from "../../types/supplier";

export function useSuppliersQuery(params?: SupplierQueryParams) {
  return useQuery({
    queryKey: [queryKeys.suppliers[0], params],
    queryFn: () => listSuppliers(params),
  });
}

export function useSupplierQuery(id: number, enabled = true) {
  return useQuery({
    queryKey: [queryKeys.suppliers[0], id],
    queryFn: () => getSupplier(id),
    enabled,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation<Supplier, unknown, CreateSupplierDto>({
    mutationFn: createSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers });
    },
  });
}

export function useUpdateSupplier(id: number) {
  const queryClient = useQueryClient();
  return useMutation<Supplier, unknown, UpdateSupplierDto>({
    mutationFn: (payload) => updateSupplier(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers });
      queryClient.invalidateQueries({ queryKey: [queryKeys.suppliers[0], id] });
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, number>({
    mutationFn: (id) => removeSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers });
    },
  });
}
