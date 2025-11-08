export type Promotion = {
  id: number;
  name: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: string;
  start_date: string | null;
  end_date: string | null;
  active: boolean;
  min_purchase_amount: string | null;
  max_discount: string | null;
  applicable_services?: number[];
  applicable_items?: number[];
  created_at: string | null;
  updated_at: string | null;
};

export type CreatePromotionDto = Pick<
  Promotion,
  | 'name'
  | 'description'
  | 'discount_type'
  | 'discount_value'
  | 'start_date'
  | 'end_date'
  | 'active'
  | 'min_purchase_amount'
  | 'max_discount'
> & {
  applicable_services?: number[];
  applicable_items?: number[];
};

export type UpdatePromotionDto = Partial<CreatePromotionDto>;
