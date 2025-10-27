import { z } from 'zod';

export const itemCommissionTypeEnum = z.enum(['percentage', 'fixed']);

export const createItemSchema = z.object({
  name: z.string().min(2).max(160).transform((value) => value.trim()),
  description: z
    .string()
    .max(65535)
    .optional()
    .transform((value) => value?.trim() ?? null),
  price: z
    .string()
    .transform((value) => value.trim())
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, 'Informe um preço válido'),
  cost: z
    .string()
    .optional()
    .transform((value) => {
      if (value == null || value.trim() === '') return null;
      return value.trim();
    })
    .refine((value) => value === null || (!Number.isNaN(Number(value)) && Number(value) >= 0), {
      message: 'Informe um custo válido',
    }),
  stock: z.coerce.number().int().min(0),
  minStock: z.coerce.number().int().min(0),
  category: z
    .string()
    .max(120)
    .optional()
    .transform((value) => value?.trim() ?? null),
  supplierId: z
    .preprocess(
      (value) => (value === '' || value === null || value === undefined ? null : value),
      z.coerce.number().int().nullable(),
    )
    .optional(),
  barcode: z
    .string()
    .max(80)
    .optional()
    .transform((value) => value?.trim() ?? null),
  commissionType: itemCommissionTypeEnum.nullable().optional(),
  commissionValue: z
    .string()
    .transform((value) => value.trim())
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, 'Informe um valor válido'),
});

export const updateItemSchema = createItemSchema.partial();
export type CreateItemInput = z.input<typeof createItemSchema>;
export type UpdateItemInput = z.input<typeof updateItemSchema>;
