import { z } from 'zod';

export const createItemPriceSchema = z.object({
  itemId: z.number().int().positive(),
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
  margin: z
    .string()
    .optional()
    .transform((value) => {
      if (value == null || value.trim() === '') return null;
      return value.trim();
    })
    .refine((value) => value === null || (!Number.isNaN(Number(value)) && Number(value) >= 0), {
      message: 'Informe uma margem válida',
    }),
  effectiveDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/u, { message: 'Data no formato AAAA-MM-DD' })
    .optional()
    .transform((value) => value ?? null),
  notes: z
    .string()
    .max(65535)
    .optional()
    .transform((value) => value?.trim() ?? null),
});

export const updateItemPriceSchema = createItemPriceSchema.partial();
export type CreateItemPriceInput = z.input<typeof createItemPriceSchema>;
export type UpdateItemPriceInput = z.input<typeof updateItemPriceSchema>;
