export type AccountPayableStatus = "pending" | "paid";

export type AccountPayableOriginType = "manual" | "commission" | string;

export type CommissionOrigin = {
  id: number;
  status: AccountPayableStatus;
  payment_date: string | null;
  commission_amount?: string;
};

export type AccountPayableOrigin = CommissionOrigin | Record<string, any> | null;

export type AccountPayable = {
  id: number;
  description: string;
  amount: string;
  due_date: string | null;
  status: AccountPayableStatus;
  category: string | null;
  supplier_id: number | null;
  professional_id: number | null;
  appointment_id: number | null;
  origin_type: AccountPayableOriginType | null;
  origin_id: number | null;
  origin?: AccountPayableOrigin;
  professional?: { id: number; name: string } | null;
  appointment?: { id: number; date: string | null; payment_method: string | null } | null;
  commission?: CommissionOrigin | null;
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
  status: AccountPayableStatus;
  category: string | null;
  supplier_id: number | null;
  professional_id: number | null;
  appointment_id: number | null;
  origin_type?: AccountPayableOriginType | null;
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
