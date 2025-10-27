import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../services/api';
import {
  createItemPrice,
  getItemPrice,
  listItemPrices,
  removeItemPrice,
  updateItemPrice,
} from '../../services/itemPricesService';
import type { CreateItemPriceDto, ItemPrice, UpdateItemPriceDto } from '../../types/item-price';

export function useItemPricesQuery(params?: Parameters<typeof listItemPrices>[0]) {
  return useQuery({
    queryKey: [queryKeys.itemPrices[0], params],
    queryFn: () => listItemPrices(params),
  });
}

export function useItemPriceQuery(id: number, enabled = true) {
  return useQuery({
    queryKey: [queryKeys.itemPrices[0], id],
    queryFn: () => getItemPrice(id),
    enabled,
  });
}

export function useCreateItemPrice() {
  const queryClient = useQueryClient();
  return useMutation<ItemPrice, unknown, CreateItemPriceDto>({
    mutationFn: createItemPrice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.itemPrices });
    },
  });
}

export function useUpdateItemPrice(id: number) {
  const queryClient = useQueryClient();
  return useMutation<ItemPrice, unknown, UpdateItemPriceDto>({
    mutationFn: (payload) => updateItemPrice(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.itemPrices });
      queryClient.invalidateQueries({ queryKey: [queryKeys.itemPrices[0], id] });
    },
  });
}

export function useDeleteItemPrice() {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, number>({
    mutationFn: (id) => removeItemPrice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.itemPrices });
    },
  });
}
