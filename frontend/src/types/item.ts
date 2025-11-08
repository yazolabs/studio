export type Item = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  cost: string | null;
  stock: number;
  min_stock: number;
  category: string | null;
  supplier_id: number | null;
  barcode: string | null;
  commission_type: 'percentage' | 'fixed' | null;
  commission_value: string;
  created_at: string | null;
  updated_at: string | null;
};

export type CreateItemDto = Pick<
  Item,
  | 'name'
  | 'description'
  | 'price'
  | 'cost'
  | 'stock'
  | 'min_stock'
  | 'category'
  | 'supplier_id'
  | 'barcode'
  | 'commission_type'
  | 'commission_value'
>;

export type UpdateItemDto = Partial<CreateItemDto>;
