export type Service = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  duration: number;
  category: string | null;
  commissionType: 'percentage' | 'fixed';
  commissionValue: string;
  active: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CreateServiceDto = Pick<
  Service,
  'name' | 'description' | 'price' | 'duration' | 'category' | 'commissionType' | 'commissionValue' | 'active'
>;

export type UpdateServiceDto = Partial<CreateServiceDto>;
