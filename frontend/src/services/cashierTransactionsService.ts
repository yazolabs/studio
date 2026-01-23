import { api } from "./api";
import type { CashierTransaction, CreateCashierTransactionDto, UpdateCashierTransactionDto } from "../types/cashier-transaction";

const basePath = "/cashier";

export type CashierQueryParams = {
  search?: string;
  type?: "entrada" | "saida";
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
    payment_method: payload.payment_method,
    reference: payload.reference,
    user_id: payload.user_id,
    notes: payload.notes,
  };

  return Object.fromEntries(Object.entries(body).filter(([, value]) => value !== undefined));
}

export async function listCashierTransactions(params?: CashierQueryParams) {
  const { data } = await api.get<CashierTransaction[]>(basePath, { params });
  return data;
}

export async function getCashierTransaction(id: number) {
  const { data } = await api.get<CashierTransaction>(`${basePath}/${id}`);
  return data;
}

export async function createCashierTransaction(payload: CreateCashierTransactionDto) {
  const { data } = await api.post<CashierTransaction>(basePath, mapPayload(payload));
  return data;
}

export async function updateCashierTransaction(id: number, payload: UpdateCashierTransactionDto) {
  const { data } = await api.put<CashierTransaction>(`${basePath}/${id}`, mapPayload(payload));
  return data;
}

export async function removeCashierTransaction(id: number) {
  await api.delete(`${basePath}/${id}`);
}
