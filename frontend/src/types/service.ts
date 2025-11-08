export type Service = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  duration: number;
  category: string | null;
  commission_type: 'percentage' | 'fixed';
  commission_value: string;
  active: boolean;
  created_at: string | null;
  updated_at: string | null;
};

export type CreateServiceDto = Pick<
  Service,
  'name' | 'description' | 'price' | 'duration' | 'category' | 'commission_type' | 'commission_value' | 'active'
>;

export type UpdateServiceDto = Partial<CreateServiceDto>;
