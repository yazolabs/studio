import { api, ensureCsrfCookie } from './api';
import type { Paginated } from '../types/pagination';
import type { CreateServiceDto, Service, UpdateServiceDto } from '../types/service';

const basePath = '/services';

type ServiceQueryParams = {
  page?: number;
  perPage?: number;
  search?: string;
};

function mapPayload(payload: CreateServiceDto | UpdateServiceDto) {
  const body = {
    name: payload.name,
    description: payload.description,
    price: payload.price,
    duration: payload.duration,
    category: payload.category,
    commission_type: payload.commissionType,
    commission_value: payload.commissionValue,
    active: payload.active,
  };

  return Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined),
  );
}

export async function listServices(params?: ServiceQueryParams) {
  const { data } = await api.get<Paginated<Service>>(basePath, { params });
  return data;
}

export async function getService(id: number) {
  const { data } = await api.get<Service>(`${basePath}/${id}`);
  return data;
}

export async function createService(payload: CreateServiceDto) {
  await ensureCsrfCookie();
  const { data } = await api.post<Service>(basePath, mapPayload(payload));
  return data;
}

export async function updateService(id: number, payload: UpdateServiceDto) {
  await ensureCsrfCookie();
  const { data } = await api.put<Service>(`${basePath}/${id}`, mapPayload(payload));
  return data;
}

export async function removeService(id: number) {
  await ensureCsrfCookie();
  await api.delete(`${basePath}/${id}`);
}
