import { api, ensureCsrfCookie } from './api';
import type { Paginated } from '../types/pagination';
import type { Commission, CreateCommissionDto, UpdateCommissionDto } from '../types/commission';

const basePath = '/commissions';

type CommissionQueryParams = {
  page?: number;
  perPage?: number;
  search?: string;
  professionalId?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
};

function mapPayload(payload: CreateCommissionDto | UpdateCommissionDto) {
  const body = {
    professional_id: payload.professionalId,
    appointment_id: payload.appointmentId,
    service_id: payload.serviceId,
    customer_id: payload.customerId,
    date: payload.date,
    service_price: payload.servicePrice,
    commission_type: payload.commissionType,
    commission_value: payload.commissionValue,
    commission_amount: payload.commissionAmount,
    status: payload.status,
    payment_date: payload.paymentDate,
  };

  return Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined),
  );
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
  await ensureCsrfCookie();
  const { data } = await api.post<Commission>(basePath, mapPayload(payload));
  return data;
}

export async function updateCommission(id: number, payload: UpdateCommissionDto) {
  await ensureCsrfCookie();
  const { data } = await api.put<Commission>(`${basePath}/${id}`, mapPayload(payload));
  return data;
}

export async function removeCommission(id: number) {
  await ensureCsrfCookie();
  await api.delete(`${basePath}/${id}`);
}
