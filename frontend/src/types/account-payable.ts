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
  payment_date: string | null;
  payment_method: string | null;
  reference: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type CreateAccountPayableDto = Pick<
  AccountPayable,
  | 'description'
  | 'amount'
  | 'due_date'
  | 'status'
  | 'category'
  | 'supplier_id'
  | 'professional_id'
  | 'appointment_id'
  | 'payment_date'
  | 'payment_method'
  | 'reference'
  | 'notes'
>;

export type UpdateAccountPayableDto = Partial<CreateAccountPayableDto>;

export type MarkAccountAsPaidDto = {
  id: number;
};
