import { z } from 'zod';

export const commissionStatusEnum = z.enum(['pending', 'paid']);
export const commissionTypeEnum = z.enum(['percentage', 'fixed']);

export const createCommissionSchema = z.object({
  professionalId: z.number().int().positive(),
  appointmentId: z.number().int().positive(),
  serviceId: z.number().int().positive(),
  customerId: z.number().int().positive(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/u, { message: 'Data no formato AAAA-MM-DD' }),
  servicePrice: z
    .string()
    .transform((value) => value.trim())
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, 'Informe um valor válido'),
  commissionType: commissionTypeEnum,
  commissionValue: z
    .string()
    .transform((value) => value.trim())
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, 'Informe um valor válido'),
  commissionAmount: z
    .string()
    .transform((value) => value.trim())
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, 'Informe um valor válido'),
  status: commissionStatusEnum,
  paymentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/u, { message: 'Data no formato AAAA-MM-DD' })
    .optional()
    .transform((value) => value ?? null),
});

export const updateCommissionSchema = createCommissionSchema.partial();
export type CreateCommissionInput = z.input<typeof createCommissionSchema>;
export type UpdateCommissionInput = z.input<typeof updateCommissionSchema>;
