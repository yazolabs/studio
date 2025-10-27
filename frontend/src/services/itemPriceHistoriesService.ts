import { api, ensureCsrfCookie } from './api';
import type { Paginated } from '../types/pagination';
import type {
  CreateItemPriceHistoryDto,
  ItemPriceHistory,
  UpdateItemPriceHistoryDto,
} from '../types/item-price-history';

const basePath = '/item-price-histories';

type ItemPriceHistoryQueryParams = {
  page?: number;
  perPage?: number;
  search?: string;
  itemId?: number;
};

function mapPayload(payload: CreateItemPriceHistoryDto | UpdateItemPriceHistoryDto) {
  const body = {
    item_id: payload.itemId,
    old_price: payload.oldPrice,
    new_price: payload.newPrice,
    change_date: payload.changeDate,
    changed_by: payload.changedBy,
    reason: payload.reason,
  };

  return Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined),
  );
}

export async function listItemPriceHistories(params?: ItemPriceHistoryQueryParams) {
  const { data } = await api.get<Paginated<ItemPriceHistory>>(basePath, { params });
  return data;
}

export async function getItemPriceHistory(id: number) {
  const { data } = await api.get<ItemPriceHistory>(`${basePath}/${id}`);
  return data;
}

export async function createItemPriceHistory(payload: CreateItemPriceHistoryDto) {
  await ensureCsrfCookie();
  const { data } = await api.post<ItemPriceHistory>(basePath, mapPayload(payload));
  return data;
}

export async function updateItemPriceHistory(
  id: number,
  payload: UpdateItemPriceHistoryDto,
) {
  await ensureCsrfCookie();
  const { data } = await api.put<ItemPriceHistory>(`${basePath}/${id}`, mapPayload(payload));
  return data;
}

export async function removeItemPriceHistory(id: number) {
  await ensureCsrfCookie();
  await api.delete(`${basePath}/${id}`);
}
