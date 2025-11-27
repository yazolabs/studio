import { api } from "./api";
import type { CreateSupplierDto, Supplier, UpdateSupplierDto } from "../types/supplier";

const basePath = "/suppliers";

export type SupplierQueryParams = {
  search?: string;
  city?: string;
  state?: string;
};

function mapPayload(payload: CreateSupplierDto | UpdateSupplierDto) {
  const body = {
    name: payload.name,
    trade_name: payload.trade_name,
    cnpj: payload.cnpj,
    cpf: payload.cpf,
    email: payload.email,
    phone: payload.phone,
    address: payload.address,
    city: payload.city,
    state: payload.state,
    zip_code: payload.zip_code,
    contact_person: payload.contact_person,
    payment_terms: payload.payment_terms,
    notes: payload.notes,
  };

  return Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined),
  );
}

export async function listSuppliers(params?: SupplierQueryParams) {
  const { data } = await api.get<{ data: Supplier[] }>(basePath, { params });
  return data.data;
}

export async function getSupplier(id: number) {
  const { data } = await api.get<{ data: Supplier }>(`${basePath}/${id}`);
  return data.data;
}

export async function createSupplier(payload: CreateSupplierDto) {
  const { data } = await api.post<{ data: Supplier }>(
    basePath,
    mapPayload(payload),
  );
  return data.data;
}

export async function updateSupplier(id: number, payload: UpdateSupplierDto) {
  const { data } = await api.put<{ data: Supplier }>(
    `${basePath}/${id}`,
    mapPayload(payload),
  );
  return data.data;
}

export async function removeSupplier(id: number) {
  await api.delete(`${basePath}/${id}`);
}
