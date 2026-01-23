import { api } from './api';
import type { Paginated } from '../types/pagination';
import type { AccountPayable, CreateAccountPayableDto, UpdateAccountPayableDto, MarkAccountAsPaidDto } from '../types/account-payable';

const basePath = '/accounts-payable';

type AccountsPayableQueryParams = {
  page?: number;
  perPage?: number;
  search?: string;
  status?: string;
  category?: string;
  professional_id?: number;
  appointment_id?: number;
  start_date?: string;
  end_date?: string;
};

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
    payment_date: payload.payment_date,
    payment_method: payload.payment_method,
    reference: payload.reference,
    notes: payload.notes,
  };

  return Object.fromEntries(Object.entries(body).filter(([, value]) => value !== undefined));
}

export async function listAccountsPayable(params?: AccountsPayableQueryParams) {
  const { data } = await api.get<Paginated<AccountPayable>>(basePath, { params });
  return data;
}

export async function getAccountPayable(id: number) {
  const { data } = await api.get(`${basePath}/${id}`);
  return data?.data;
}

export async function createAccountPayable(payload: CreateAccountPayableDto) {
  const { data } = await api.post(basePath, mapPayload(payload));
  return data.data;
}

export async function updateAccountPayable(id: number, payload: UpdateAccountPayableDto) {
  const { data } = await api.put(`${basePath}/${id}`, mapPayload(payload));
  return data.data;
}

export async function removeAccountPayable(id: number) {
  await api.delete(`${basePath}/${id}`);
}

export async function markAccountAsPaid(id: number, payload: { payment_method: string; payment_date: string }) {
  const { data } = await api.patch(`${basePath}/${id}/mark-paid`, payload);
  return data.data;
}
