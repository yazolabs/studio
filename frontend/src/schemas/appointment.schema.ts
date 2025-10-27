import { z } from 'zod';

const appointmentStatusEnum = z.enum(['scheduled', 'confirmed', 'completed', 'cancelled']);

const appointmentServiceSchema = z.object({
  id: z.number().int().positive(),
  servicePrice: z
    .string()
    .transform((value) => value.trim())
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, 'Informe um valor válido'),
  commissionType: z.enum(['percentage', 'fixed']).optional().nullable(),
  commissionValue: z
    .string()
    .optional()
    .transform((value) => (value == null ? '0' : value.trim()))
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, {
      message: 'Informe um valor válido',
    }),
  professionalId: z.number().int().positive().optional().nullable(),
});

export const createAppointmentSchema = z.object({
  customerId: z.number().int().positive(),
  professionalId: z.number().int().positive(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/u, { message: 'Data no formato AAAA-MM-DD' }),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/u, { message: 'Horário no formato HH:MM' }),
  status: appointmentStatusEnum,
  totalPrice: z
    .string()
    .transform((value) => value.trim())
    .refine((value) => !Number.isNaN(Number(value)), 'Informe um valor válido'),
  discountAmount: z
    .string()
    .transform((value) => value.trim())
    .refine((value) => !Number.isNaN(Number(value)), 'Informe um valor válido'),
  finalPrice: z
    .string()
    .transform((value) => value.trim())
    .refine((value) => !Number.isNaN(Number(value)), 'Informe um valor válido'),
  paymentMethod: z
    .string()
    .max(60)
    .optional()
    .transform((value) => value?.trim() ?? null),
  promotionId: z.number().int().positive().optional().nullable(),
  notes: z
    .string()
    .max(65535)
    .optional()
    .transform((value) => value?.trim() ?? null),
  services: z.array(appointmentServiceSchema).min(1, 'Inclua pelo menos um serviço'),
});

export const updateAppointmentSchema = createAppointmentSchema.partial();
export type CreateAppointmentInput = z.input<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.input<typeof updateAppointmentSchema>;
