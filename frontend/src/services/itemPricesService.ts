import { api } from './api';
import type { Paginated } from '../types/pagination';
import type { CreateItemPriceDto, ItemPrice, UpdateItemPriceDto } from '../types/item-price';

const basePath = '/item-prices';

type ItemPriceQueryParams = {
  page?: number;
  perPage?: number;
  search?: string;
  itemId?: number;
};

function mapPayload(payload: CreateItemPriceDto | UpdateItemPriceDto) {
  const body = {
    item_id: payload.item_id,
    price: payload.price,
    cost: payload.cost,
    margin: payload.margin,
    effective_date: payload.effective_date,
    notes: payload.notes,
  };

  return Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined),
  );
}

export async function listItemPrices(params?: ItemPriceQueryParams) {
  const { data } = await api.get<Paginated<ItemPrice>>(basePath, { params });
  return data;
}

export async function getItemPrice(id: number) {
  const { data } = await api.get<ItemPrice>(`${basePath}/${id}`);
  return data;
}

export async function createItemPrice(payload: CreateItemPriceDto) {
  const { data } = await api.post<ItemPrice>(basePath, mapPayload(payload));
  return data;
}

export async function updateItemPrice(id: number, payload: UpdateItemPriceDto) {
  const { data } = await api.put<ItemPrice>(`${basePath}/${id}`, mapPayload(payload));
  return data;
}

export async function removeItemPrice(id: number) {
  await api.delete(`${basePath}/${id}`);
}
