import { api } from './api';
import type { CreatePromotionDto, Promotion, UpdatePromotionDto } from '../types/promotion';

const basePath = '/promotions';

type PromotionQueryParams = {
  search?: string;
  active?: boolean;
  valid_on?: string;
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
    is_recurring: payload.is_recurring,
    recurrence_type: payload.recurrence_type,
    recurrence_weekdays: payload.recurrence_weekdays,
    recurrence_week_of_month: payload.recurrence_week_of_month,
    recurrence_day_of_year: payload.recurrence_day_of_year,
    applicable_services: payload.applicable_services,
    applicable_items: payload.applicable_items,
  };

  return Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined),
  );
}

export async function listPromotions(
  params?: PromotionQueryParams,
): Promise<Promotion[]> {
  const { data } = await api.get<any>(basePath, { params });

  if (data && Array.isArray(data.data)) return data.data as Promotion[];
  if (Array.isArray(data)) return data as Promotion[];
  return [];
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
  const { data } = await api.put<Promotion>(
    `${basePath}/${id}`,
    mapPayload(payload),
  );
  return data;
}

export async function removePromotion(id: number) {
  await api.delete(`${basePath}/${id}`);
}
