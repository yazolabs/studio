import { api } from './api';
import type { Paginated } from '../types/pagination';
import type { CreatePromotionDto, Promotion, UpdatePromotionDto } from '../types/promotion';

const basePath = '/promotions';

type PromotionQueryParams = {
  page?: number;
  perPage?: number;
  search?: string;
  active?: boolean;
};

function mapPayload(payload: CreatePromotionDto | UpdatePromotionDto) {
  const body = {
    name: payload.name,
    description: payload.description,
    discount_type: payload.discount_type,
    discount_value: payload.discount_value,
    start_date: payload.start_date,
    end_date: payload.end_date,
    active: payload.active,
    min_purchase_amount: payload.min_purchase_amount,
    max_discount: payload.max_discount,
    applicable_services: payload.applicable_services,
    applicable_items: payload.applicable_items,
  };

  return Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined),
  );
}

export async function listPromotions(params?: PromotionQueryParams) {
  const { data } = await api.get<Paginated<Promotion>>(basePath, { params });
  return data;
}

export async function getPromotion(id: number) {
  const { data } = await api.get<Promotion>(`${basePath}/${id}`);
  return data;
}

export async function createPromotion(payload: CreatePromotionDto) {
  const { data } = await api.post<Promotion>(basePath, mapPayload(payload));
  return data;
}

export async function updatePromotion(id: number, payload: UpdatePromotionDto) {
  const { data } = await api.put<Promotion>(`${basePath}/${id}`, mapPayload(payload));
  return data;
}

export async function removePromotion(id: number) {
  await api.delete(`${basePath}/${id}`);
}
