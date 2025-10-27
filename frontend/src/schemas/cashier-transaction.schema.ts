import { z } from 'zod';

export const transactionTypeEnum = z.enum(['entrada', 'saida']);

export const createCashierTransactionSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/u, { message: 'Data no formato AAAA-MM-DD' }),
  type: transactionTypeEnum,
  category: z.string().min(2).max(80).transform((value) => value.trim()),
  description: z
    .string()
    .max(255)
    .optional()
    .transform((value) => value?.trim() ?? null),
  amount: z
    .string()
    .transform((value) => value.trim())
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, 'Informe um valor válido'),
  paymentMethod: z
    .string()
    .max(60)
    .optional()
    .transform((value) => value?.trim() ?? null),
  reference: z
    .string()
    .max(160)
    .optional()
    .transform((value) => value?.trim() ?? null),
  userId: z.number().int().positive().optional().nullable(),
  notes: z
    .string()
    .max(65535)
    .optional()
    .transform((value) => value?.trim() ?? null),
});

export const updateCashierTransactionSchema = createCashierTransactionSchema.partial();
export type CreateCashierTransactionInput = z.input<typeof createCashierTransactionSchema>;
export type UpdateCashierTransactionInput = z.input<typeof updateCashierTransactionSchema>;
