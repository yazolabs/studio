import { api } from './api';
import type { Paginated } from '../types/pagination';
import type { CreateCustomerDto, Customer, UpdateCustomerDto } from '../types/customer';

const basePath = '/customers';

type CustomerQueryParams = {
  page?: number;
  perPage?: number;
  search?: string;
};

function mapPayload(payload: CreateCustomerDto | UpdateCustomerDto) {
  const body = {
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    alternate_phone: payload.alternatePhone,
    address: payload.address,
    city: payload.city,
    state: payload.state,
    zip_code: payload.zipCode,
    birth_date: payload.birthDate,
    notes: payload.notes,
    last_visit: payload.lastVisit,
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
