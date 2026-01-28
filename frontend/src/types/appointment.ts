export type AppointmentPaymentMethod =
  | "cash"
  | "pix"
  | "debit"
  | "credit"
  | "credit_link";

export type AppointmentPayment = {
  id: number;
  method: AppointmentPaymentMethod | string;
  base_amount: string;
  fee_percent: string;
  fee_amount: string;
  amount: string;
  card_brand: string | null;
  installments: number | null;
  meta: Record<string, any> | null;
  created_at: string | null;
  updated_at: string | null;
};

export type AppointmentPaymentSummary = {
  method: AppointmentPaymentMethod | string;
  amount: string;
};

export type AppointmentServiceProfessional = {
  id: number;
  name: string | null;
};

export type AppointmentItem = {
  id: number;
  name: string;
  price: string;
  quantity: number;
};

export type AppointmentServicePromotionPivot = {
  id: number | null;
  sort_order: number;
  applied_value: number | string | null;
  applied_percent: number | string | null;
  discount_amount: number | string | null;
  applied_by_user_id: number | null;
};

export type AppointmentServicePromotion = {
  id: number;
  name: string;
  discount_type: "percentage" | "fixed" | string;
  discount_value: number | string;
  pivot: AppointmentServicePromotionPivot;
};

export type AppointmentServiceRow = {
  id: number;
  appointment_id: number;
  service_id: number;
  service: {
    id: number;
    name: string;
    duration: number | null;
  } | null;
  service_price: string;
  commission_type: "percentage" | "fixed" | string | null;
  commission_value: string;
  professional_id: number | null;
  professional?: AppointmentServiceProfessional | null;
  starts_at?: string | null;
  ends_at?: string | null;
  promotions?: AppointmentServicePromotion[];
};

export type AppointmentServiceItem = {
  id: number;
  name: string | null;
  service_price: string;
  commission_type: "percentage" | "fixed" | string | null;
  commission_value: string;
  professional_id: number | null;
  professional?: AppointmentServiceProfessional | null;
  duration?: number | null;
  starts_at?: string | null;
  ends_at?: string | null;
  appointment_service_id?: number;
};

export type AppointmentPaymentStatus = "unpaid" | "prepaid" | "paid";

export type Appointment = {
  id: number;
  customer: { id: number; name: string } | null;
  professionals?: { id: number; name: string | null }[] | null;
  services?: AppointmentServiceItem[] | null;
  appointment_services?: AppointmentServiceRow[] | null;
  items?: AppointmentItem[] | null;
  // remover mais tarde
  promotion_id?: number | null;
  promotion?: { id: number; name: string } | null;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  duration: number | null;
  status:
    | "scheduled"
    | "confirmed"
    | "completed"
    | "cancelled"
    | "no_show"
    | "rescheduled";
  payment_status: AppointmentPaymentStatus;
  total_price: string;
  discount_type: "percentage" | "fixed" | string | null;
  discount_amount: string;
  final_price: string;
  payments?: AppointmentPayment[] | null;
  payment_summary?: AppointmentPaymentSummary[] | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type CreateAppointmentDto = {
  customer_id: number;
  date: string;
  start_time: string;
  end_time?: string | null;
  duration?: number | null;
  status: Appointment["status"];
  payment_status?: AppointmentPaymentStatus;
  total_price: string;
  discount_type?: "percentage" | "fixed" | string | null;
  discount_amount: string;
  final_price: string;
  // remover mais tarde
  promotion_id?: number | null;
  notes?: string | null;
  services?: Array<{
    id: number;
    service_price: string;
    commission_type?: "percentage" | "fixed" | string | null;
    commission_value?: string;
    professional_id?: number | null;
    starts_at?: string | null;
    ends_at?: string | null;
    promotions?: Array<{
      id?: number;
      promotion_id?: number;
      sort_order?: number;
    }>;
  }>;
  items?: Array<{
    id: number;
    price: string;
    quantity: number;
  }>;
};

export type UpdateAppointmentDto = Partial<CreateAppointmentDto>;
