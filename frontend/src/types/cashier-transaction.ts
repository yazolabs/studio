export type CashierTransaction = {
  id: number;
  date: string | null;
  type: 'entrada' | 'saida';
  category: string;
  description: string | null;
  amount: string;
  paymentMethod: string | null;
  reference: string | null;
  userId: number | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CreateCashierTransactionDto = Pick<
  CashierTransaction,
  | 'date'
  | 'type'
  | 'category'
  | 'description'
  | 'amount'
  | 'paymentMethod'
  | 'reference'
  | 'userId'
  | 'notes'
>;

export type UpdateCashierTransactionDto = Partial<CreateCashierTransactionDto>;
