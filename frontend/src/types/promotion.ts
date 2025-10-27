export type Promotion = {
  id: number;
  name: string;
  description: string | null;
  discountType: 'percentage' | 'fixed';
  discountValue: string;
  startDate: string | null;
  endDate: string | null;
  active: boolean;
  minPurchaseAmount: string | null;
  maxDiscount: string | null;
  applicableServices?: number[];
  applicableItems?: number[];
  createdAt: string | null;
  updatedAt: string | null;
};

export type CreatePromotionDto = Pick<
  Promotion,
  | 'name'
  | 'description'
  | 'discountType'
  | 'discountValue'
  | 'startDate'
  | 'endDate'
  | 'active'
  | 'minPurchaseAmount'
  | 'maxDiscount'
> & {
  applicableServices?: number[];
  applicableItems?: number[];
};

export type UpdatePromotionDto = Partial<CreatePromotionDto>;
