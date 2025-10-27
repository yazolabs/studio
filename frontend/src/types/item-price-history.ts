export type ItemPriceHistory = {
  id: number;
  itemId: number;
  oldPrice: string | null;
  newPrice: string;
  changeDate: string | null;
  changedBy: number | null;
  reason: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CreateItemPriceHistoryDto = Pick<
  ItemPriceHistory,
  'itemId' | 'oldPrice' | 'newPrice' | 'changeDate' | 'changedBy' | 'reason'
>;

export type UpdateItemPriceHistoryDto = Partial<CreateItemPriceHistoryDto>;
