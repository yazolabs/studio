import { api } from './api';
import type { Paginated } from '../types/pagination';
import type {
  Appointment,
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from '../types/appointment';

const basePath = '/appointments';

type AppointmentQueryParams = {
  page?: number;
  perPage?: number;
  search?: string;
  status?: string;
  professionalId?: number;
  customerId?: number;
};

function mapPayload(payload: CreateAppointmentDto | UpdateAppointmentDto) {
  const body = {
    customer_id: payload.customerId,
    professional_id: payload.professionalId,
    date: payload.date,
    start_time: payload.startTime,
    status: payload.status,
    total_price: payload.totalPrice,
    discount_amount: payload.discountAmount,
    final_price: payload.finalPrice,
    payment_method: payload.paymentMethod,
    promotion_id: payload.promotionId,
    notes: payload.notes,
    services: payload.services?.map((service) => ({
      service_id: service.id,
      service_price: service.servicePrice,
      commission_type: service.commissionType,
      commission_value: service.commissionValue,
      professional_id: service.professionalId,
    })),
  };

  return Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined),
  );
}

export async function listAppointments(params?: AppointmentQueryParams) {
  const { data } = await api.get<Paginated<Appointment>>(basePath, { params });
  return data;
}

export async function getAppointment(id: number) {
  const { data } = await api.get<Appointment>(`${basePath}/${id}`);
  return data;
}

export async function createAppointment(payload: CreateAppointmentDto) {
  const { data } = await api.post<Appointment>(basePath, mapPayload(payload));
  return data;
}

export async function updateAppointment(id: number, payload: UpdateAppointmentDto) {
  const { data } = await api.put<Appointment>(`${basePath}/${id}`, mapPayload(payload));
  return data;
}

export async function removeAppointment(id: number) {
  await api.delete(`${basePath}/${id}`);
}
