import type { WorkScheduleDay } from './work-schedule';
import type { User } from './user';

export type Professional = {
  id: number;
  userId: number;
  user: Pick<User, 'id' | 'name' | 'email'>;
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
