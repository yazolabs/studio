import type { WorkScheduleDay } from './work-schedule';

export type Professional = {
  id: number;
  userId: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  specialties: string[] | null;
  active: boolean;
  work_schedule: WorkScheduleDay[] | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CreateProfessionalDto = {
  user_id: number;
  phone?: string | null;
  specialties?: string[] | null;
  active?: boolean;
  work_schedule?: WorkScheduleDay[] | null;
};

export type UpdateProfessionalDto = Partial<CreateProfessionalDto>;
