export type CashierTransaction = {
  id: number;
  date: string | null;
  type: 'entrada' | 'saida';
  category: string;
  description: string | null;
  amount: string;
  payment_method: string | null;
  reference: string | null;
  user_id: number | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type CreateCashierTransactionDto = Pick<
  CashierTransaction,
  | 'date'
  | 'type'
  | 'category'
  | 'description'
  | 'amount'
  | 'payment_method'
  | 'reference'
  | 'user_id'
  | 'notes'
>;

export type UpdateCashierTransactionDto = Partial<CreateCashierTransactionDto>;
