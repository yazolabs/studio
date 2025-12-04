export type PromotionRecurrenceType = 'weekly' | 'monthly_weekday' | 'yearly';

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
  is_recurring: boolean;
  recurrence_type: PromotionRecurrenceType | null;
  recurrence_weekdays: number[] | null;
  recurrence_week_of_month: number | null;
  recurrence_day_of_year: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type CreatePromotionDto = {
  name: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: string;
  start_date: string;
  end_date: string | null;
  active: boolean;
  min_purchase_amount: string | null;
  max_discount: string | null;
  applicable_services?: number[];
  applicable_items?: number[];
  is_recurring?: boolean;
  recurrence_type?: PromotionRecurrenceType | null;
  recurrence_weekdays?: number[] | null;
  recurrence_week_of_month?: number | null;
  recurrence_day_of_year?: string | null;
};

export type UpdatePromotionDto = Partial<CreatePromotionDto>;
