import { api } from './api';
import type { Paginated } from '../types/pagination';
import type { CreateCustomerDto, Customer, UpdateCustomerDto } from '../types/customer';

const basePath = '/customers';

export type CustomerQueryParams = {
  page?: number;
  perPage?: number;
  search?: string;
};

function mapPayload(payload: CreateCustomerDto | UpdateCustomerDto) {
  const body = {
    name: payload.name,
    cpf: payload.cpf,
    gender: payload.gender,
    active: payload.active,
    email: payload.email,
    phone: payload.phone,
    alternate_phone: payload.alternate_phone,
    address: payload.address,
    number: payload.number,
    complement: payload.complement,
    neighborhood: payload.neighborhood,
    city: payload.city,
    state: payload.state,
    zip_code: payload.zip_code,
    birth_date: payload.birth_date,
    last_visit: payload.last_visit,
    notes: payload.notes,
    contact_preferences: payload.contact_preferences,
    accepts_marketing: payload.accepts_marketing,
  };

  return Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined),
  );
}

export async function listCustomers(params?: CustomerQueryParams) {
  const { data } = await api.get<Paginated<Customer>>(basePath, { params });
  return data;
}

export async function getCustomer(id: number) {
  const { data } = await api.get<Customer>(`${basePath}/${id}`);
  return data;
}

export async function createCustomer(payload: CreateCustomerDto) {
  const { data } = await api.post<Customer>(basePath, mapPayload(payload));
  return data;
}

export async function updateCustomer(id: number, payload: UpdateCustomerDto) {
  const { data } = await api.put<Customer>(`${basePath}/${id}`, mapPayload(payload));
  return data;
}

export async function removeCustomer(id: number) {
  await api.delete(`${basePath}/${id}`);
}
