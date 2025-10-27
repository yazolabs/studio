import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../services/api';
import {
  createItemPriceHistory,
  getItemPriceHistory,
  listItemPriceHistories,
  removeItemPriceHistory,
  updateItemPriceHistory,
} from '../../services/itemPriceHistoriesService';
import type {
  CreateItemPriceHistoryDto,
  ItemPriceHistory,
  UpdateItemPriceHistoryDto,
} from '../../types/item-price-history';

export function useItemPriceHistoriesQuery(params?: Parameters<typeof listItemPriceHistories>[0]) {
  return useQuery({
    queryKey: [queryKeys.itemPriceHistories[0], params],
    queryFn: () => listItemPriceHistories(params),
  });
}

export function useItemPriceHistoryQuery(id: number, enabled = true) {
  return useQuery({
    queryKey: [queryKeys.itemPriceHistories[0], id],
    queryFn: () => getItemPriceHistory(id),
    enabled,
  });
}

export function useCreateItemPriceHistory() {
  const queryClient = useQueryClient();
  return useMutation<ItemPriceHistory, unknown, CreateItemPriceHistoryDto>({
    mutationFn: createItemPriceHistory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.itemPriceHistories });
    },
  });
}

export function useUpdateItemPriceHistory(id: number) {
  const queryClient = useQueryClient();
  return useMutation<ItemPriceHistory, unknown, UpdateItemPriceHistoryDto>({
    mutationFn: (payload) => updateItemPriceHistory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.itemPriceHistories });
      queryClient.invalidateQueries({ queryKey: [queryKeys.itemPriceHistories[0], id] });
    },
  });
}

export function useDeleteItemPriceHistory() {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, number>({
    mutationFn: (id) => removeItemPriceHistory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.itemPriceHistories });
    },
  });
}
