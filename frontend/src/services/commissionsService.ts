import { api } from './api';
import type { Paginated } from '../types/pagination';
import type { Commission, CreateCommissionDto, UpdateCommissionDto, MarkCommissionAsPaidDto } from '../types/commission';

const basePath = '/commissions';

type CommissionQueryParams = {
  page?: number;
  perPage?: number;
  search?: string;
  professional_id?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
};

function mapPayload(payload: CreateCommissionDto | UpdateCommissionDto) {
  const body = {
    professional_id: payload.professional_id,
    appointment_id: payload.appointment_id,
    service_id: payload.service_id,
    customer_id: payload.customer_id,
    date: payload.date,
    service_price: payload.service_price,
    commission_type: payload.commission_type,
    commission_value: payload.commission_value,
    commission_amount: payload.commission_amount,
    status: payload.status,
    payment_date: payload.payment_date,
  };

  return Object.fromEntries(Object.entries(body).filter(([, value]) => value !== undefined));
}

export async function listCommissions(params?: CommissionQueryParams) {
  const { data } = await api.get<Paginated<Commission>>(basePath, { params });
  return data;
}

export async function getCommission(id: number) {
  const { data } = await api.get<Commission>(`${basePath}/${id}`);
  return data;
}

export async function createCommission(payload: CreateCommissionDto) {
  const { data } = await api.post<Commission>(basePath, mapPayload(payload));
  return data;
}

export async function updateCommission(id: number, payload: UpdateCommissionDto) {
  const { data } = await api.put<Commission>(`${basePath}/${id}`, mapPayload(payload));
  return data;
}

export async function removeCommission(id: number) {
  await api.delete(`${basePath}/${id}`);
}

export async function markCommissionAsPaid(id: number) {
  const { data } = await api.patch<Commission>(`${basePath}/${id}/mark-paid`);
  return data;
}
