import { z } from 'zod';

export const createItemPriceHistorySchema = z.object({
  itemId: z.number().int().positive(),
  oldPrice: z
    .string()
    .optional()
    .transform((value) => {
      if (value == null || value.trim() === '') return null;
      return value.trim();
    })
    .refine((value) => value === null || !Number.isNaN(Number(value)), {
      message: 'Informe um valor válido',
    }),
  newPrice: z
    .string()
    .transform((value) => value.trim())
    .refine((value) => !Number.isNaN(Number(value)), 'Informe um valor válido'),
  changeDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?$/u, { message: 'Data/hora inválida' })
    .optional()
    .transform((value) => value ?? null),
  changedBy: z.number().int().positive().optional().nullable(),
  reason: z
    .string()
    .max(65535)
    .optional()
    .transform((value) => value?.trim() ?? null),
});

export const updateItemPriceHistorySchema = createItemPriceHistorySchema.partial();
export type CreateItemPriceHistoryInput = z.input<typeof createItemPriceHistorySchema>;
export type UpdateItemPriceHistoryInput = z.input<typeof updateItemPriceHistorySchema>;
