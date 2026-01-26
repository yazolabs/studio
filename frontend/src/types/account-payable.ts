export type AccountPayable = {
  id: number;
  description: string;
  amount: string;
  due_date: string | null;
  status: 'pending' | 'paid';
  category: string | null;
  supplier_id: number | null;
  professional_id: number | null;
  appointment_id: number | null;
  origin_type?: 'manual' | 'commission' | string | null;
  origin_id?: number | null;
  professional?: { id: number; name: string } | null;
  appointment?: { id: number; date: string | null; payment_method: string | null } | null;
  commission?: { id: number; status: 'pending' | 'paid'; payment_date: string | null } | null;
  payment_date: string | null;
  payment_method: string | null;
  reference: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type CreateAccountPayableDto = {
  description: string;
  amount: string;
  due_date: string | null;
  status: 'pending' | 'paid';
  category: string | null;
  supplier_id: number | null;
  professional_id: number | null;
  appointment_id: number | null;
  origin_type?: 'manual' | 'commission' | string | null;
  origin_id?: number | null;
  payment_date: string | null;
  payment_method: string | null;
  reference: string | null;
  notes: string | null;
};

export type UpdateAccountPayableDto = Partial<CreateAccountPayableDto>;

export type MarkAccountAsPaidDto = {
  id: number;
  payment_method: string;
  payment_date: string;
};
