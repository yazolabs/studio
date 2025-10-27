import { z } from 'zod';

export const discountTypeEnum = z.enum(['percentage', 'fixed']);

export const createPromotionSchema = z
  .object({
    name: z.string().min(2).max(160).transform((value) => value.trim()),
    description: z
      .string()
      .max(65535)
      .optional()
      .transform((value) => value?.trim() ?? null),
    discountType: discountTypeEnum,
    discountValue: z
      .string()
      .transform((value) => value.trim())
      .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, 'Informe um valor válido'),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/u, { message: 'Data no formato AAAA-MM-DD' })
      .transform((value) => value.trim()),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/u, { message: 'Data no formato AAAA-MM-DD' })
      .optional()
      .transform((value) => value?.trim() ?? null),
    active: z.boolean().default(true),
    minPurchaseAmount: z
      .string()
      .optional()
      .transform((value) => {
        if (value == null || value.trim() === '') return null;
        return value.trim();
      })
      .refine((value) => value === null || (!Number.isNaN(Number(value)) && Number(value) >= 0), {
        message: 'Informe um valor válido',
      }),
    maxDiscount: z
      .string()
      .optional()
      .transform((value) => {
        if (value == null || value.trim() === '') return null;
        return value.trim();
      })
      .refine((value) => value === null || (!Number.isNaN(Number(value)) && Number(value) >= 0), {
        message: 'Informe um valor válido',
      }),
    applicableServices: z.array(z.number().int().positive()).optional(),
    applicableItems: z.array(z.number().int().positive()).optional(),
  })
  .superRefine((data, ctx) => {
    const discountValue = Number(data.discountValue);

    if (data.discountType === 'percentage' && (discountValue < 0 || discountValue > 100)) {
      ctx.addIssue({
        path: ['discountValue'],
        code: z.ZodIssueCode.custom,
        message: 'Percentual deve estar entre 0 e 100',
      });
    }

    if (data.endDate && data.endDate < data.startDate) {
      ctx.addIssue({
        path: ['endDate'],
        code: z.ZodIssueCode.custom,
        message: 'Data final deve ser posterior à data inicial',
      });
    }
  });

export const updatePromotionSchema = createPromotionSchema.partial();
export type CreatePromotionInput = z.input<typeof createPromotionSchema>;
export type UpdatePromotionInput = z.input<typeof updatePromotionSchema>;
