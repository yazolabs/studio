import { z } from 'zod';

export const createSupplierSchema = z.object({
  name: z.string().min(2).max(160).transform((value) => value.trim()),
  tradeName: z
    .string()
    .max(160)
    .optional()
    .transform((value) => value?.trim() ?? null),
  cnpj: z
    .string()
    .regex(/^\d{14}$/u, { message: 'Informe o CNPJ sem pontuação (14 dígitos)' })
    .optional()
    .transform((value) => value ?? null),
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
  contactPerson: z
    .string()
    .max(160)
    .optional()
    .transform((value) => value?.trim() ?? null),
  paymentTerms: z
    .string()
    .max(65535)
    .optional()
    .transform((value) => value?.trim() ?? null),
  notes: z
    .string()
    .max(65535)
    .optional()
    .transform((value) => value?.trim() ?? null),
});

export const updateSupplierSchema = createSupplierSchema.partial();
export type CreateSupplierInput = z.input<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.input<typeof updateSupplierSchema>;
