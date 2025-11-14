export type Commission = {
  id: number;
  professional: { id: number; name: string } | null;
  customer: { id: number; name: string } | null;
  service: { id: number; name: string } | null;
  appointment_id: number;
  date: string | null;
  service_price: string;
  commission_type: 'percentage' | 'fixed';
  commission_value: string;
  commission_amount: string;
  status: 'pending' | 'paid';
  payment_date: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type CreateCommissionDto = {
  professional_id: number;
  appointment_id: number;
  service_id: number;
  customer_id: number;
  date: string;
  service_price: string;
  commission_type: 'percentage' | 'fixed';
  commission_value: string;
  commission_amount: string;
  status: 'pending' | 'paid';
  payment_date?: string | null;
};

export type UpdateCommissionDto = Partial<CreateCommissionDto>;

export type MarkCommissionAsPaidDto = {
  id: number;
};
