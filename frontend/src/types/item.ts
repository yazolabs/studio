export type Item = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  cost: string | null;
  stock: number;
  minStock: number;
  category: string | null;
  supplierId: number | null;
  barcode: string | null;
  commissionType: 'percentage' | 'fixed' | null;
  commissionValue: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CreateItemDto = Pick<
  Item,
  | 'name'
  | 'description'
  | 'price'
  | 'cost'
  | 'stock'
  | 'minStock'
  | 'category'
  | 'supplierId'
  | 'barcode'
  | 'commissionType'
  | 'commissionValue'
>;

export type UpdateItemDto = Partial<CreateItemDto>;
