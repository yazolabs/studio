import { api, ensureCsrfCookie } from './api';
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
    discount_type: payload.discountType,
    discount_value: payload.discountValue,
    start_date: payload.startDate,
    end_date: payload.endDate,
    active: payload.active,
    min_purchase_amount: payload.minPurchaseAmount,
    max_discount: payload.maxDiscount,
    applicable_services: payload.applicableServices,
    applicable_items: payload.applicableItems,
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
  await ensureCsrfCookie();
  const { data } = await api.post<Promotion>(basePath, mapPayload(payload));
  return data;
}

export async function updatePromotion(id: number, payload: UpdatePromotionDto) {
  await ensureCsrfCookie();
  const { data } = await api.put<Promotion>(`${basePath}/${id}`, mapPayload(payload));
  return data;
}

export async function removePromotion(id: number) {
  await ensureCsrfCookie();
  await api.delete(`${basePath}/${id}`);
}
