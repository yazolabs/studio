import { api } from './api';
import type { Service, CreateServiceDto, UpdateServiceDto } from '../types/service';

const basePath = '/services';

type ServiceQueryParams = {
  search?: string;
  category?: string;
  active?: boolean;
  commission_type?: "percentage" | "fixed";
  min_price?: number | string;
  max_price?: number | string;
};

function toDecimalString(value: any) {
  if (value === undefined || value === null) return undefined;
  const n = Number(value);
  if (isNaN(n)) return undefined;
  return n.toFixed(2);
}

function mapPayload(payload: CreateServiceDto | UpdateServiceDto) {
  const body = {
    name: payload.name,
    description: payload.description,
    price: toDecimalString(payload.price),
    duration: payload.duration,
    category: payload.category,
    commission_type: payload.commission_type,
    commission_value: toDecimalString(payload.commission_value),
    active: payload.active,
  };

  return Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined));
}

export async function listServices(params?: ServiceQueryParams): Promise<Service[]> {
  const { data } = await api.get<any>(basePath, { params });

  if (data && Array.isArray(data.data)) return data.data as Service[];
  if (Array.isArray(data)) return data as Service[];
  return [];
}

export async function getService(id: number): Promise<Service> {
  const { data } = await api.get<Service>(`${basePath}/${id}`);
  return data;
}

export async function createService(payload: CreateServiceDto): Promise<Service> {
  const { data } = await api.post<Service>(basePath, mapPayload(payload));
  return data;
}

export async function updateService(id: number, payload: UpdateServiceDto): Promise<Service> {
  const { data } = await api.put<Service>(`${basePath}/${id}`, mapPayload(payload));
  return data;
}

export async function removeService(id: number): Promise<void> {
  await api.delete(`${basePath}/${id}`);
}
