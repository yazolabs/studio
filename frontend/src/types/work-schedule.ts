export type WorkScheduleDay = {
  day: string;
  isWorkingDay: boolean;
  isDayOff: boolean;
  startTime: string | null;
  endTime: string | null;
  lunchStart: string | null;
  lunchEnd: string | null;
};
