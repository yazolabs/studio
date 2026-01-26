export type Commission = {
  id: number;
  professional: { id: number; name: string } | null;
  customer: { id: number; name: string } | null;
  service: { id: number; name: string } | null;
  appointment: { id: number; date: string | null; payment_method: string | null } | null;
  appointment_service_id?: number | null;
  appointment_service?: {
    id: number;
    starts_at: string | null;
    ends_at: string | null;
    service_price: string;
  } | null;
  date: string | null;
  service_price: string;
  commission_type: 'percentage' | 'fixed';
  commission_value: string;
  commission_amount: string;
  status: 'pending' | 'paid';
  payment_date: string | null;
  account_payable_id?: number | null;
  created_at: string | null;
  updated_at: string | null;
};

export type CreateCommissionDto = {
  professional_id: number;
  appointment_id: number;
  service_id: number;
  customer_id: number;
  appointment_service_id?: number | null;
  date: string;
  service_price: string;
  commission_type: 'percentage' | 'fixed';
  commission_value: string;
  commission_amount?: string;
  status: 'pending' | 'paid';
  payment_date?: string | null;
};

export type UpdateCommissionDto = Partial<CreateCommissionDto>;

export type MarkCommissionAsPaidDto = {
  id: number;
};
