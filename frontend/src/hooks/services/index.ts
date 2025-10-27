import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../services/api';
import {
  createService,
  getService,
  listServices,
  removeService,
  updateService,
} from '../../services/servicesService';
import type { CreateServiceDto, Service, UpdateServiceDto } from '../../types/service';

export function useServicesQuery(params?: Parameters<typeof listServices>[0]) {
  return useQuery({
    queryKey: [queryKeys.services[0], params],
    queryFn: () => listServices(params),
  });
}

export function useServiceQuery(id: number, enabled = true) {
  return useQuery({
    queryKey: [queryKeys.services[0], id],
    queryFn: () => getService(id),
    enabled,
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation<Service, unknown, CreateServiceDto>({
    mutationFn: createService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services });
    },
  });
}

export function useUpdateService(id: number) {
  const queryClient = useQueryClient();
  return useMutation<Service, unknown, UpdateServiceDto>({
    mutationFn: (payload) => updateService(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services });
      queryClient.invalidateQueries({ queryKey: [queryKeys.services[0], id] });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, number>({
    mutationFn: (id) => removeService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services });
    },
  });
}
