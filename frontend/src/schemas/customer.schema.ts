import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(2).max(160).transform((value) => value.trim()),
  email: z
    .string()
    .email({ message: 'E-mail inválido' })
    .max(160)
    .optional()
    .transform((value) => value?.trim().toLowerCase() ?? null),
  phone: z
    .string()
    .max(40)
    .optional()
    .transform((value) => value?.trim() ?? null),
  alternatePhone: z
    .string()
    .max(40)
    .optional()
    .transform((value) => value?.trim() ?? null),
  address: z
    .string()
    .max(255)
    .optional()
    .transform((value) => value?.trim() ?? null),
  city: z
    .string()
    .max(120)
    .optional()
    .transform((value) => value?.trim() ?? null),
  state: z
    .string()
    .max(60)
    .optional()
    .transform((value) => value?.trim() ?? null),
  zipCode: z
    .string()
    .max(20)
    .optional()
    .transform((value) => value?.trim() ?? null),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/u, { message: 'Data no formato AAAA-MM-DD' })
    .optional()
    .transform((value) => value ?? null),
  notes: z
    .string()
    .max(65535)
    .optional()
    .transform((value) => value?.trim() ?? null),
  lastVisit: z
    .string()
    .optional()
    .transform((value) => value ?? null),
});

export const updateCustomerSchema = createCustomerSchema.partial();
export type CreateCustomerInput = z.input<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.input<typeof updateCustomerSchema>;
