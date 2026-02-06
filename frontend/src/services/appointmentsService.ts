import { api } from "./api";
import type { Appointment, AppointmentPaymentMethod, AppointmentPaymentStatus, CreateAppointmentDto, UpdateAppointmentDto } from "../types/appointment";

const basePath = "/appointments";

type AppointmentQueryParams = {
  search?: string;
  status?: string;
  payment_status?: AppointmentPaymentStatus | string;
  professional_id?: number;
  customer_id?: number;
  start_date?: string;
  end_date?: string;
  date?: string;
};

export type CheckoutPaymentDto = {
  method?: AppointmentPaymentMethod | string;
  payment_method?: AppointmentPaymentMethod | string;
  amount: number;
  fee_percent?: number | null;
  card_brand?: string | null;
  installments?: number | null;
  installment_fee?: number | null;
  meta?: Record<string, any> | null;
  notes?: string | null;
};

export type CheckoutAppointmentServicePromotionDto = {
  id?: number | null;
  promotion_id?: number | null;
  sort_order?: number | null;
};

export type CheckoutAppointmentServiceDto = {
  id: number;
  promotions?: CheckoutAppointmentServicePromotionDto[] | null;
};

export type CheckoutServiceToAddDto = {
  service_id: number;
  professional_id?: number | null;
  service_price: number | string;
  commission_type?: "percentage" | "fixed" | string | null;
  commission_value?: number | string | null;
  promotion_ids?: number[] | null;
};

export type CheckoutItemDto = {
  id?: number;
  item_id?: number;
  price: number | string;
  quantity: number;
};

export type CheckoutAppointmentDto = {
  discount_type?: "percentage" | "fixed" | null;
  discount_amount?: number | null;
  appointment_services?: CheckoutAppointmentServiceDto[];
  services_to_add?: CheckoutServiceToAddDto[];
  items?: CheckoutItemDto[];
  payments: CheckoutPaymentDto[];
};

export type PrepayAppointmentDto = {
  received_date?: string | null;
  discount_type?: "percentage" | "fixed" | null;
  discount_amount?: number | null;
  appointment_services?: CheckoutAppointmentServiceDto[];
  services_to_add?: CheckoutServiceToAddDto[];
  items?: CheckoutItemDto[];
  payments?: CheckoutPaymentDto[];
};

function unwrapResource<T>(payload: any): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data as T;
  }
  return payload as T;
}

function mapPayload(payload: CreateAppointmentDto | UpdateAppointmentDto) {
  const body: any = {
    customer_id: payload.customer_id,
    date: payload.date,
    start_time: payload.start_time,
    end_time: payload.end_time,
    duration: payload.duration,
    status: payload.status,
    payment_status: payload.payment_status,
    total_price: payload.total_price,
    discount_type: payload.discount_type,
    discount_amount: payload.discount_amount,
    final_price: payload.final_price,
    notes: payload.notes,
    group_id: (payload as any).group_id,
    group_sequence: (payload as any).group_sequence,
    services: payload.services?.map((s) => ({
      service_id: s.id,
      service_price: s.service_price,
      commission_type: s.commission_type,
      commission_value: s.commission_value,
      professional_id: s.professional_id,
      starts_at: s.starts_at,
      ends_at: s.ends_at,
      promotions: (s.promotions ?? []).map((p, idx) => ({
        promotion_id: p.promotion_id ?? p.id ?? undefined,
        sort_order: p.sort_order ?? idx,
      })),
    })),
    items: payload.items?.map((i) => ({
      item_id: i.id,
      price: i.price,
      quantity: i.quantity,
    })),
  };

  return Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined));
}

export async function listAppointments(params?: AppointmentQueryParams) {
  const { data } = await api.get<any>(basePath, { params });

  if (data?.data && Array.isArray(data.data)) return data.data as Appointment[];
  return data as Appointment[];
}

export async function getAppointment(id: number) {
  const { data } = await api.get<any>(`${basePath}/${id}`);
  return unwrapResource<Appointment>(data);
}

export async function createAppointment(payload: CreateAppointmentDto) {
  const { data } = await api.post<any>(basePath, mapPayload(payload));
  return unwrapResource<Appointment>(data);
}

export async function updateAppointment(id: number, payload: UpdateAppointmentDto) {
  const { data } = await api.put<any>(`${basePath}/${id}`, mapPayload(payload));
  return unwrapResource<Appointment>(data);
}

export async function removeAppointment(id: number) {
  await api.delete(`${basePath}/${id}`);
}

export async function listAppointmentsCalendar(params?: {
  start_date?: string;
  end_date?: string;
  professional_id?: number;
}) {
  const { data } = await api.get<any>(`${basePath}/calendar`, { params });
  if (data?.data && Array.isArray(data.data)) return data.data as Appointment[];
  return data as Appointment[];
}

function normalizePayments(payments: CheckoutPaymentDto[] = []) {
  return payments.map((p) => ({
    method: p.method ?? p.payment_method,
    amount: p.amount,
    fee_percent: p.fee_percent ?? null,
    card_brand: p.card_brand ?? null,
    installments: p.installments ?? null,
    meta: p.meta ?? null,
    notes: p.notes ?? null,
  }));
}

function normalizeAppointmentServices(rows: CheckoutAppointmentServiceDto[] | undefined) {
  if (!rows) return undefined;

  return rows.map((r) => ({
    id: r.id,
    promotions: (r.promotions ?? []).map((p, idx) => ({
      promotion_id: p.promotion_id ?? p.id ?? undefined,
      sort_order: p.sort_order ?? idx,
    })),
  }));
}

function normalizeServicesToAdd(rows: CheckoutServiceToAddDto[] | undefined) {
  if (!rows) return undefined;

  return rows.map((r) => ({
    service_id: Number(r.service_id),
    professional_id: r.professional_id ?? null,
    service_price: typeof r.service_price === "string" ? Number(r.service_price) : r.service_price,
    commission_type: r.commission_type ?? null,
    commission_value:
      r.commission_value == null
        ? null
        : typeof r.commission_value === "string"
        ? Number(r.commission_value)
        : r.commission_value,
    promotion_ids: (r.promotion_ids ?? []).map((x) => Number(x)),
  }));
}

function normalizeItems(rows: CheckoutItemDto[] | undefined) {
  if (!rows) return undefined;

  return rows.map((r) => ({
    id: r.id ?? undefined,
    item_id: r.item_id ?? undefined,
    price: typeof r.price === "string" ? Number(r.price) : r.price,
    quantity: Number(r.quantity ?? 1),
  }));
}

export async function checkoutAppointment(id: number, payload: CheckoutAppointmentDto) {
  const normalized = {
    discount_type: payload.discount_type ?? null,
    discount_amount: payload.discount_amount ?? null,
    appointment_services: normalizeAppointmentServices(payload.appointment_services),
    services_to_add: normalizeServicesToAdd(payload.services_to_add),
    items: normalizeItems(payload.items),

    payments: normalizePayments(payload.payments ?? []),
  };

  const { data } = await api.patch<any>(`${basePath}/${id}/checkout`, normalized, {
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    transformRequest: [(d) => JSON.stringify(d)],
  });

  return unwrapResource<Appointment>(data);
}

export async function prepayAppointment(id: number, payload: PrepayAppointmentDto) {
  const paymentsArr = Array.isArray(payload.payments) ? payload.payments : [];

  const normalized: any = {
    received_date: payload.received_date ?? null,
    discount_type: payload.discount_type ?? null,
    discount_amount: payload.discount_amount ?? null,
    appointment_services: normalizeAppointmentServices(payload.appointment_services),
    services_to_add: normalizeServicesToAdd(payload.services_to_add),
    items: normalizeItems(payload.items),
  };

  normalized.payments = normalizePayments(paymentsArr);

  const { data } = await api.patch<any>(`${basePath}/${id}/prepay`, normalized, {
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    transformRequest: [(d) => JSON.stringify(d)],
  });

  return unwrapResource<Appointment>(data);
}

export type PrepayGroupDto = PrepayAppointmentDto & {
  group_id: string;
  intent?: "paid" | "partial" | null;
};

export async function prepayGroup(groupId: string, payload: PrepayAppointmentDto & { intent?: "paid" | "partial" | null }) {
  const gid = String(groupId || "").trim();
  if (!gid) throw new Error("Grupo inválido.");

  const paymentsArr = Array.isArray(payload.payments) ? payload.payments : [];

  const normalized: any = {
    group_id: gid,
    received_date: payload.received_date ?? null,
    intent: (payload as any).intent ?? null,
    discount_type: (payload as any).discount_type ?? null,
    discount_amount: (payload as any).discount_amount ?? null,
    appointment_services: normalizeAppointmentServices((payload as any).appointment_services),
    services_to_add: normalizeServicesToAdd((payload as any).services_to_add),
    items: normalizeItems((payload as any).items),
    payments: normalizePayments(paymentsArr),
  };

  const { data } = await api.patch<any>(
    `${basePath}/groups/${encodeURIComponent(gid)}/prepay`,
    normalized,
    {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      transformRequest: [(d) => JSON.stringify(d)],
    }
  );

  return data;
}
