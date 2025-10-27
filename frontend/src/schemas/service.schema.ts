import { z } from 'zod';

export const commissionTypeEnum = z.enum(['percentage', 'fixed']);

export const baseServiceSchema = z.object({
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
  duration: z.coerce
    .number({ invalid_type_error: 'Informe a duração em minutos' })
    .int()
    .positive(),
  category: z
    .string()
    .max(120)
    .optional()
    .transform((value) => value?.trim() ?? null),
  commissionType: commissionTypeEnum,
  commissionValue: z
    .string()
    .transform((value) => value.trim())
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, 'Informe um valor válido'),
  active: z.boolean().default(true),
});

export const createServiceSchema = baseServiceSchema.superRefine((data, ctx) => {
  const numericValue = Number(data.commissionValue);

  if (data.commissionType === 'percentage' && (numericValue < 0 || numericValue > 100)) {
    ctx.addIssue({
      path: ['commissionValue'],
      code: z.ZodIssueCode.custom,
      message: 'Percentual deve estar entre 0 e 100',
    });
  }
});

export const updateServiceSchema = createServiceSchema.partial();
export type CreateServiceInput = z.input<typeof createServiceSchema>;
export type UpdateServiceInput = z.input<typeof updateServiceSchema>;
