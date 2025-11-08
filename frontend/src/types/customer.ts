export type Customer = {
  id: number;
  name: string;
  cpf: string | null;
  gender: string | null;
  active: boolean;
  email: string | null;
  phone: string | null;
  alternate_phone: string | null;
  address: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  birth_date: string | null;
  last_visit: string | null;
  notes: string | null;
  contact_preferences: string[];
  accepts_marketing: boolean;
  created_at: string | null;
  updated_at: string | null;
};

export interface CreateCustomerDto {
  name: string;
  cpf?: string | null;
  gender: 'male' | 'female' | 'other' | 'not_informed';
  email?: string | null;
  phone?: string | null;
  alternate_phone?: string | null;
  address?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  birth_date?: string | null;
  last_visit?: string | null;
  notes?: string | null;
  contact_preferences?: ('email' | 'sms' | 'whatsapp')[];
  accepts_marketing?: boolean;
  active?: boolean;
}

export type UpdateCustomerDto = Partial<CreateCustomerDto>;
