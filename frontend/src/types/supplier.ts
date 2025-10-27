export type Supplier = {
  id: number;
  name: string;
  tradeName: string | null;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  contactPerson: string | null;
  paymentTerms: string | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CreateSupplierDto = Pick<
  Supplier,
  | 'name'
  | 'tradeName'
  | 'cnpj'
  | 'email'
  | 'phone'
  | 'address'
  | 'city'
  | 'state'
  | 'zipCode'
  | 'contactPerson'
  | 'paymentTerms'
  | 'notes'
>;

export type UpdateSupplierDto = Partial<CreateSupplierDto>;
