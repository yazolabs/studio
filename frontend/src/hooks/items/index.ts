import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../services/api';
import { createItem, getItem, listItems, removeItem, updateItem } from '../../services/itemsService';
import type { CreateItemDto, Item, UpdateItemDto } from '../../types/item';

export function useItemsQuery(params?: Parameters<typeof listItems>[0]) {
  return useQuery({
    queryKey: [queryKeys.items[0], params],
    queryFn: () => listItems(params),
  });
}

export function useItemQuery(id: number, enabled = true) {
  return useQuery({
    queryKey: [queryKeys.items[0], id],
    queryFn: () => getItem(id),
    enabled,
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation<Item, unknown, CreateItemDto>({
    mutationFn: createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items });
    },
  });
}

export function useUpdateItem(id: number) {
  const queryClient = useQueryClient();
  return useMutation<Item, unknown, UpdateItemDto>({
    mutationFn: (payload) => updateItem(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items });
      queryClient.invalidateQueries({ queryKey: [queryKeys.items[0], id] });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, number>({
    mutationFn: (id) => removeItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items });
    },
  });
}
