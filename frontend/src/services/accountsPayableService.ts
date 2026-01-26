import { api } from './api';
import type { AccountPayable, CreateAccountPayableDto, UpdateAccountPayableDto } from '../types/account-payable';

const basePath = '/accounts-payable';

type AccountsPayableQueryParams = {
  search?: string;
  status?: string;
  category?: string;
  professional_id?: number;
  appointment_id?: number;
  start_date?: string;
  end_date?: string;
};

type ResourceResponse<T> = { data: T };
type CollectionResponse<T> = { data: T[] };

function mapPayload(payload: CreateAccountPayableDto | UpdateAccountPayableDto) {
  const body = {
    description: payload.description,
    amount: payload.amount,
    due_date: payload.due_date,
    status: payload.status,
    category: payload.category,
    supplier_id: payload.supplier_id,
    professional_id: payload.professional_id,
    appointment_id: payload.appointment_id,
    origin_type: payload.origin_type,
    origin_id: payload.origin_id,
    payment_date: payload.payment_date,
    payment_method: payload.payment_method,
    reference: payload.reference,
    notes: payload.notes,
  };

  return Object.fromEntries(Object.entries(body).filter(([, value]) => value !== undefined));
}

export async function listAccountsPayable(params?: AccountsPayableQueryParams) {
  const { data } = await api.get<CollectionResponse<AccountPayable>>(basePath, { params });
  return (data as any).data ?? (data as any);
}

export async function getAccountPayable(id: number) {
  const { data } = await api.get<ResourceResponse<AccountPayable>>(`${basePath}/${id}`);
  return (data as any).data ?? (data as any);
}

export async function createAccountPayable(payload: CreateAccountPayableDto) {
  const { data } = await api.post<ResourceResponse<AccountPayable>>(basePath, mapPayload(payload));
  return (data as any).data ?? (data as any);
}

export async function updateAccountPayable(id: number, payload: UpdateAccountPayableDto) {
  const { data } = await api.put<ResourceResponse<AccountPayable>>(`${basePath}/${id}`, mapPayload(payload));
  return (data as any).data ?? (data as any);
}

export async function removeAccountPayable(id: number) {
  await api.delete(`${basePath}/${id}`);
}

export async function markAccountAsPaid(id: number, payload: { payment_method: string; payment_date: string }) {
  const { data } = await api.patch<ResourceResponse<AccountPayable>>(`${basePath}/${id}/mark-paid`, payload);
  return (data as any).data ?? (data as any);
}
