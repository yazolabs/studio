export type AccountPayable = {
  id: number;
  description: string;
  amount: string;
  dueDate: string | null;
  status: 'pending' | 'paid' | 'overdue';
  category: string | null;
  supplierId: number | null;
  professionalId: number | null;
  appointmentId: number | null;
  paymentDate: string | null;
  paymentMethod: string | null;
  reference: string | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CreateAccountPayableDto = Pick<
  AccountPayable,
  | 'description'
  | 'amount'
  | 'dueDate'
  | 'status'
  | 'category'
  | 'supplierId'
  | 'professionalId'
  | 'appointmentId'
  | 'paymentDate'
  | 'paymentMethod'
  | 'reference'
  | 'notes'
>;

export type UpdateAccountPayableDto = Partial<CreateAccountPayableDto>;
