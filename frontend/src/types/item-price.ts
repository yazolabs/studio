export type ItemPrice = {
  id: number;
  item_id: number;
  price: string;
  cost: string | null;
  margin: string | null;
  effective_date: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type CreateItemPriceDto = Pick<
  ItemPrice,
  'item_id' | 'price' | 'cost' | 'margin' | 'effective_date' | 'notes'
>;

export type UpdateItemPriceDto = Partial<CreateItemPriceDto>;
