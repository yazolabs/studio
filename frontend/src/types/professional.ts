import type { WorkScheduleDay } from './work-schedule';

export type Professional = {
  id: number;
  user_id: number;
  user?: { name: string } | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  specialties: string[] | null;
  active: boolean;
  work_schedule: WorkScheduleDay[] | null;
  created_at: string | null;
  updated_at: string | null;
};

export type CreateProfessionalDto = {
  user_id: number;
  phone?: string | null;
  specialties?: string[] | null;
  active?: boolean;
  work_schedule?: WorkScheduleDay[] | null;
};

export type UpdateProfessionalDto = Partial<CreateProfessionalDto>;
