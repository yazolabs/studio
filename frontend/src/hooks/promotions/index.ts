import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../services/api';
import { createPromotion, getPromotion, listPromotions, removePromotion, updatePromotion } from '../../services/promotionsService';
import type { CreatePromotionDto, Promotion, UpdatePromotionDto } from '../../types/promotion';

export function usePromotionsQuery(
  params?: Parameters<typeof listPromotions>[0],
) {
  return useQuery<Promotion[]>({
    queryKey: [queryKeys.promotions[0], params],
    queryFn: () => listPromotions(params),
  });
}

export function usePromotionQuery(id: number, enabled = true) {
  return useQuery<Promotion>({
    queryKey: [queryKeys.promotions[0], id],
    queryFn: () => getPromotion(id),
    enabled,
  });
}

export function useCreatePromotion() {
  const queryClient = useQueryClient();
  return useMutation<Promotion, unknown, CreatePromotionDto>({
    mutationFn: createPromotion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.promotions });
    },
  });
}

export function useUpdatePromotion() {
  const queryClient = useQueryClient();
  return useMutation<Promotion, unknown, { id: number; data: UpdatePromotionDto }>({
    mutationFn: ({ id, data }) => updatePromotion(id, data),
    onSuccess: (promotion) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.promotions });
      queryClient.invalidateQueries({
        queryKey: [queryKeys.promotions[0], promotion.id],
      });
    },
  });
}

export function useDeletePromotion() {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, number>({
    mutationFn: (id) => removePromotion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.promotions });
    },
  });
}
