import { api } from './api';
import type { Paginated } from '../types/pagination';
import type {
  AccountPayable,
  CreateAccountPayableDto,
  UpdateAccountPayableDto,
} from '../types/account-payable';

const basePath = '/accounts-payable';

type AccountsPayableQueryParams = {
  page?: number;
  perPage?: number;
  search?: string;
  status?: string;
  dueDate?: string;
};

function mapPayload(payload: CreateAccountPayableDto | UpdateAccountPayableDto) {
  const body = {
    description: payload.description,
    amount: payload.amount,
    due_date: payload.dueDate,
    status: payload.status,
    category: payload.category,
    supplier_id: payload.supplierId,
    professional_id: payload.professionalId,
    appointment_id: payload.appointmentId,
    payment_date: payload.paymentDate,
    payment_method: payload.paymentMethod,
    reference: payload.reference,
    notes: payload.notes,
  };

  return Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined),
  );
}

export async function listAccountsPayable(params?: AccountsPayableQueryParams) {
  const { data } = await api.get<Paginated<AccountPayable>>(basePath, { params });
  return data;
}

export async function getAccountPayable(id: number) {
  const { data } = await api.get<AccountPayable>(`${basePath}/${id}`);
  return data;
}

export async function createAccountPayable(payload: CreateAccountPayableDto) {
  const { data } = await api.post<AccountPayable>(basePath, mapPayload(payload));
  return data;
}

export async function updateAccountPayable(id: number, payload: UpdateAccountPayableDto) {
  const { data } = await api.put<AccountPayable>(`${basePath}/${id}`, mapPayload(payload));
  return data;
}

export async function removeAccountPayable(id: number) {
  await api.delete(`${basePath}/${id}`);
}
