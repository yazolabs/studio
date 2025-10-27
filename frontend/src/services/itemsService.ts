import { api, ensureCsrfCookie } from './api';
import type { Paginated } from '../types/pagination';
import type { CreateItemDto, Item, UpdateItemDto } from '../types/item';

const basePath = '/items';

type ItemQueryParams = {
  page?: number;
  perPage?: number;
  search?: string;
  category?: string;
};

function mapPayload(payload: CreateItemDto | UpdateItemDto) {
  const body = {
    name: payload.name,
    description: payload.description,
    price: payload.price,
    cost: payload.cost,
    stock: payload.stock,
    min_stock: payload.minStock,
    category: payload.category,
    supplier_id: payload.supplierId,
    barcode: payload.barcode,
    commission_type: payload.commissionType,
    commission_value: payload.commissionValue,
  };

  return Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined),
  );
}

export async function listItems(params?: ItemQueryParams) {
  const { data } = await api.get<Paginated<Item>>(basePath, { params });
  return data;
}

export async function getItem(id: number) {
  const { data } = await api.get<Item>(`${basePath}/${id}`);
  return data;
}

export async function createItem(payload: CreateItemDto) {
  await ensureCsrfCookie();
  const { data } = await api.post<Item>(basePath, mapPayload(payload));
  return data;
}

export async function updateItem(id: number, payload: UpdateItemDto) {
  await ensureCsrfCookie();
  const { data } = await api.put<Item>(`${basePath}/${id}`, mapPayload(payload));
  return data;
}

export async function removeItem(id: number) {
  await ensureCsrfCookie();
  await api.delete(`${basePath}/${id}`);
}
