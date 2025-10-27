import { api, ensureCsrfCookie } from './api';
import type { Paginated } from '../types/pagination';
import type {
  CashierTransaction,
  CreateCashierTransactionDto,
  UpdateCashierTransactionDto,
} from '../types/cashier-transaction';

const basePath = '/cashier';

type CashierQueryParams = {
  page?: number;
  perPage?: number;
  search?: string;
  type?: 'entrada' | 'saida';
  startDate?: string;
  endDate?: string;
};

function mapPayload(payload: CreateCashierTransactionDto | UpdateCashierTransactionDto) {
  const body = {
    date: payload.date,
    type: payload.type,
    category: payload.category,
    description: payload.description,
    amount: payload.amount,
    payment_method: payload.paymentMethod,
    reference: payload.reference,
    user_id: payload.userId,
    notes: payload.notes,
  };

  return Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined),
  );
}

export async function listCashierTransactions(params?: CashierQueryParams) {
  const { data } = await api.get<Paginated<CashierTransaction>>(basePath, { params });
  return data;
}

export async function getCashierTransaction(id: number) {
  const { data } = await api.get<CashierTransaction>(`${basePath}/${id}`);
  return data;
}

export async function createCashierTransaction(payload: CreateCashierTransactionDto) {
  await ensureCsrfCookie();
  const { data } = await api.post<CashierTransaction>(basePath, mapPayload(payload));
  return data;
}

export async function updateCashierTransaction(
  id: number,
  payload: UpdateCashierTransactionDto,
) {
  await ensureCsrfCookie();
  const { data } = await api.put<CashierTransaction>(`${basePath}/${id}`, mapPayload(payload));
  return data;
}

export async function removeCashierTransaction(id: number) {
  await ensureCsrfCookie();
  await api.delete(`${basePath}/${id}`);
}
