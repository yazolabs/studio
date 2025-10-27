export type Customer = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  alternatePhone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  birthDate: string | null;
  notes: string | null;
  lastVisit: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CreateCustomerDto = Pick<
  Customer,
  | 'name'
  | 'email'
  | 'phone'
  | 'alternatePhone'
  | 'address'
  | 'city'
  | 'state'
  | 'zipCode'
  | 'birthDate'
  | 'notes'
  | 'lastVisit'
>;

export type UpdateCustomerDto = Partial<CreateCustomerDto>;
