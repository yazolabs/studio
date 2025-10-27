export type WorkScheduleDay = {
  day: string;
  isWorkingDay: boolean;
  isDayOff: boolean;
  startTime: string | null;
  endTime: string | null;
  lunchStart: string | null;
  lunchEnd: string | null;
};

export type Professional = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  specialties: string[] | null;
  active: boolean;
  workSchedule: WorkScheduleDay[] | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CreateProfessionalDto = Pick<
  Professional,
  'name' | 'email' | 'phone' | 'specialties' | 'active' | 'workSchedule'
>;

export type UpdateProfessionalDto = Partial<CreateProfessionalDto>;
