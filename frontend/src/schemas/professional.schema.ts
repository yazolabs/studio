import { z } from 'zod';

const workScheduleDaySchema = z.object({
  day: z.string(),
  isWorkingDay: z.boolean(),
  isDayOff: z.boolean(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  lunchStart: z.string().nullable().optional(),
  lunchEnd: z.string().nullable().optional(),
});

export const createProfessionalSchema = z
  .object({
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
    specialties: z.array(z.string().min(1).transform((value) => value.trim())).optional(),
    active: z.boolean().default(true),
    workSchedule: z.array(workScheduleDaySchema).optional(),
  })
  .superRefine((data, ctx) => {
    data.workSchedule?.forEach((day, index) => {
      if (day.isWorkingDay && !day.isDayOff) {
        if (!day.startTime || !day.endTime) {
          ctx.addIssue({
            path: ['workSchedule', index],
            code: z.ZodIssueCode.custom,
            message: 'Informe horários válidos para dias de trabalho',
          });
        }
      }
    });
  });

export const updateProfessionalSchema = createProfessionalSchema.partial();
export type CreateProfessionalInput = z.input<typeof createProfessionalSchema>;
export type UpdateProfessionalInput = z.input<typeof updateProfessionalSchema>;
