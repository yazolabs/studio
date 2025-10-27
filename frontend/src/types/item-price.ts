export type ItemPrice = {
  id: number;
  itemId: number;
  price: string;
  cost: string | null;
  margin: string | null;
  effectiveDate: string | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CreateItemPriceDto = Pick<
  ItemPrice,
  'itemId' | 'price' | 'cost' | 'margin' | 'effectiveDate' | 'notes'
>;

export type UpdateItemPriceDto = Partial<CreateItemPriceDto>;
