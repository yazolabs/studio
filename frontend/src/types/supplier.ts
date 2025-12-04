export type Supplier = {
  id: number;
  name: string;
  trade_name: string | null;
  cnpj: string | null;
  cpf: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  contact_person: string | null;
  payment_terms: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type CreateSupplierDto = Pick<
  Supplier,
  | 'name'
  | 'trade_name'
  | 'cnpj'
  | 'cpf'
  | 'email'
  | 'phone'
  | 'address'
  | 'city'
  | 'state'
  | 'zip_code'
  | 'contact_person'
  | 'payment_terms'
  | 'notes'
>;

export type UpdateSupplierDto = Partial<CreateSupplierDto>;
