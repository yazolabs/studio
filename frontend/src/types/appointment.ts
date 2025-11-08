export type AppointmentServiceItem = {
  id: number;
  name: string;
  service_price: string;
  commission_type: 'percentage' | 'fixed' | null;
  commission_value: string;
  professional_id: number | null;
  duration?: number | null;
};

export type AppointmentItem = {
  id: number;
  name: string;
  price: string;
  quantity: number;
};

export type Appointment = {
  id: number;
  customer: { id: number; name: string } | null;
  // profissionais agora vêm derivados via services
  professionals?: { id: number; name: string }[] | null;
  services?: AppointmentServiceItem[] | null;
  items?: AppointmentItem[] | null;
  promotion?: { id: number; name: string } | null;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  duration: number | null;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  total_price: string;
  discount_amount: string;
  final_price: string;
  payment_method: string | null;
  card_brand: string | null;
  installments: number | null;
  installment_fee: string | null;
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
  status: Appointment['status'];
  total_price: string;
  discount_amount: string;
  final_price: string;
  payment_method?: string | null;
  card_brand?: string | null;
  installments?: number | null;
  installment_fee?: string | null;
  promotion_id?: number | null;
  notes?: string | null;

  services?: Array<{
    id: number;
    service_price: string;
    commission_type?: 'percentage' | 'fixed' | null;
    commission_value?: string;
    professional_id?: number | null;
  }>;

  items?: Array<{
    id: number;
    price: string;
    quantity: number;
  }>;
};

export type UpdateAppointmentDto = Partial<CreateAppointmentDto>;
