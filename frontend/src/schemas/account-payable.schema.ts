import { z } from 'zod';

export const accountPayableStatusEnum = z.enum(['pending', 'paid', 'overdue']);

export const createAccountPayableSchema = z.object({
  description: z.string().min(3).max(255).transform((value) => value.trim()),
  amount: z
    .string()
    .transform((value) => value.trim())
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, 'Informe um valor válido'),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/u, { message: 'Data no formato AAAA-MM-DD' })
    .optional()
    .transform((value) => value ?? null),
  status: accountPayableStatusEnum,
  category: z
    .string()
    .max(80)
    .optional()
    .transform((value) => value?.trim() ?? null),
  supplierId: z.number().int().positive().optional().nullable(),
  professionalId: z.number().int().positive().optional().nullable(),
  appointmentId: z.number().int().positive().optional().nullable(),
  paymentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/u, { message: 'Data no formato AAAA-MM-DD' })
    .optional()
    .transform((value) => value ?? null),
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
  notes: z
    .string()
    .max(65535)
    .optional()
    .transform((value) => value?.trim() ?? null),
});

export const updateAccountPayableSchema = createAccountPayableSchema.partial();
export type CreateAccountPayableInput = z.input<typeof createAccountPayableSchema>;
export type UpdateAccountPayableInput = z.input<typeof updateAccountPayableSchema>;
