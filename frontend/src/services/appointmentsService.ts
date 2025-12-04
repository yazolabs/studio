import { api } from "./api";
import type { Paginated } from "../types/pagination";
import type { Appointment, CreateAppointmentDto, UpdateAppointmentDto } from "../types/appointment";

const basePath = "/appointments";

type AppointmentQueryParams = {
  page?: number;
  perPage?: number;
  search?: string;
  status?: string;
  professional_id?: number;
  customer_id?: number;
  start_date?: string;
  end_date?: string;
};

export type CheckoutAppointmentDto = {
  discount_type?: "percentage" | "fixed";
  discount_amount?: number;
  payment_method: string;
  card_brand?: string | null;
  installments?: number | null;
  installment_fee?: number | null;
  promotion_id?: number | null;
};

function mapPayload(payload: CreateAppointmentDto | UpdateAppointmentDto) {
  const body = {
    customer_id: payload.customer_id,
    date: payload.date,
    start_time: payload.start_time,
    end_time: payload.end_time,
    duration: payload.duration,
    status: payload.status,
    total_price: payload.total_price,
    discount_type: payload.discount_type,
    discount_amount: payload.discount_amount,
    final_price: payload.final_price,
    payment_method: payload.payment_method,
    card_brand: payload.card_brand,
    installments: payload.installments,
    installment_fee: payload.installment_fee,
    promotion_id: payload.promotion_id,
    notes: payload.notes,
    services: payload.services?.map((s) => ({
      service_id: s.id,
      service_price: s.service_price,
      commission_type: s.commission_type,
      commission_value: s.commission_value,
      professional_id: s.professional_id,
      starts_at: s.starts_at,
      ends_at: s.ends_at,
    })),
    items: payload.items?.map((i) => ({
      item_id: i.id,
      price: i.price,
      quantity: i.quantity,
    })),
  };

  return Object.fromEntries(
    Object.entries(body).filter(([, v]) => v !== undefined)
  );
}

export async function listAppointments(params?: AppointmentQueryParams) {
  const { data } = await api.get<Paginated<Appointment>>(basePath, { params });
  return data;
}

export async function getAppointment(id: number) {
  const { data } = await api.get<{ data: Appointment }>(`${basePath}/${id}`);
  return data.data;
}

export async function createAppointment(payload: CreateAppointmentDto) {
  const { data } = await api.post<Appointment>(basePath, mapPayload(payload));
  return data;
}

export async function updateAppointment(
  id: number,
  payload: UpdateAppointmentDto
) {
  const { data } = await api.put<Appointment>(
    `${basePath}/${id}`,
    mapPayload(payload)
  );
  return data;
}

export async function removeAppointment(id: number) {
  await api.delete(`${basePath}/${id}`);
}

export async function listAppointmentsCalendar(params?: {
  start_date?: string;
  end_date?: string;
  professional_id?: number;
}) {
  const { data } = await api.get<Appointment[]>(
    `${basePath}/calendar`,
    { params }
  );
  return data;
}

export async function checkoutAppointment(
  id: number,
  payload: CheckoutAppointmentDto
) {
  const { data } = await api.patch<Appointment>(
    `${basePath}/${id}/checkout`,
    payload
  );
  return data;
}
