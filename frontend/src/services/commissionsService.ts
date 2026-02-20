import { api } from "./api";
import type { Commission, CreateCommissionDto, UpdateCommissionDto } from "../types/commission";

const basePath = "/commissions";

type CommissionQueryParams = {
  search?: string;
  professional_id?: number;
  appointment_id?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
  perPage?: number;
};

type ResourceResponse<T> = { data: T };
type CollectionResponse<T> = { data: T[] };

function unwrap<T>(payload: any): T {
  return payload?.data ?? payload;
}

function mapPayload(payload: CreateCommissionDto | UpdateCommissionDto) {
  const body = {
    professional_id: payload.professional_id,
    appointment_id: payload.appointment_id,
    service_id: payload.service_id,
    customer_id: payload.customer_id,
    appointment_service_id: payload.appointment_service_id,
    date: payload.date,
    service_price: payload.service_price,
    commission_type: payload.commission_type,
    commission_value: payload.commission_value,
    commission_amount: (payload as any).commission_amount,
    status: payload.status,
    payment_date: payload.payment_date,
  };

  return Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined)
  );
}

export async function listCommissions(params?: CommissionQueryParams) {
  const { data } = await api.get<CollectionResponse<Commission>>(basePath, {
    params,
  });

  return unwrap<Commission[]>(data as any);
}

export async function getCommission(id: number) {
  const { data } = await api.get<ResourceResponse<Commission>>(
    `${basePath}/${id}`
  );
  return unwrap<Commission>(data as any);
}

export async function createCommission(payload: CreateCommissionDto) {
  const { data } = await api.post<ResourceResponse<Commission>>(
    basePath,
    mapPayload(payload)
  );
  return unwrap<Commission>(data as any);
}

export async function updateCommission(id: number, payload: UpdateCommissionDto) {
  const { data } = await api.put<ResourceResponse<Commission>>(
    `${basePath}/${id}`,
    mapPayload(payload)
  );
  return unwrap<Commission>(data as any);
}

export async function removeCommission(id: number) {
  await api.delete(`${basePath}/${id}`);
}

export async function markCommissionAsPaid(id: number) {
  const { data } = await api.patch<ResourceResponse<Commission>>(
    `${basePath}/${id}/mark-paid`,
    {}
  );
  return unwrap<Commission>(data as any);
}
