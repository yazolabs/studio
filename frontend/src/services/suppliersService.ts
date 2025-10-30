import { api } from './api';
import type { Paginated } from '../types/pagination';
import type { CreateSupplierDto, Supplier, UpdateSupplierDto } from '../types/supplier';

const basePath = '/suppliers';

type SupplierQueryParams = {
  page?: number;
  perPage?: number;
  search?: string;
};

function mapPayload(payload: CreateSupplierDto | UpdateSupplierDto) {
  const body = {
    name: payload.name,
    trade_name: payload.tradeName,
    cnpj: payload.cnpj,
    email: payload.email,
    phone: payload.phone,
    address: payload.address,
    city: payload.city,
    state: payload.state,
    zip_code: payload.zipCode,
    contact_person: payload.contactPerson,
    payment_terms: payload.paymentTerms,
    notes: payload.notes,
  };

  return Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined),
  );
}

export async function listSuppliers(params?: SupplierQueryParams) {
  const { data } = await api.get<Paginated<Supplier>>(basePath, { params });
  return data;
}

export async function getSupplier(id: number) {
  const { data } = await api.get<Supplier>(`${basePath}/${id}`);
  return data;
}

export async function createSupplier(payload: CreateSupplierDto) {
  const { data } = await api.post<Supplier>(basePath, mapPayload(payload));
  return data;
}

export async function updateSupplier(id: number, payload: UpdateSupplierDto) {
  const { data } = await api.put<Supplier>(`${basePath}/${id}`, mapPayload(payload));
  return data;
}

export async function removeSupplier(id: number) {
  await api.delete(`${basePath}/${id}`);
}
