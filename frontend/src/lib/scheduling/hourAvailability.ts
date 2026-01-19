export type WorkWindow = {
  dayStartMin: number;
  dayEndMin: number;
  lunchStartMin?: number | null;
  lunchEndMin?: number | null;
};

export type Interval = { start: number; end: number };

export const HOUR_STEP_MIN = 60;

export const overlaps = (a: Interval, b: Interval) => a.start < b.end && b.start < a.end;

export const minutesToHHmm = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

export const hhmmToMinutes = (hhmm: string): number | null => {
  if (!hhmm) return null;
  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
};

export const buildHourSlotsForDay = (dayStartMin: number, dayEndMin: number, stepMin = HOUR_STEP_MIN) => {
  const out: string[] = [];
  for (let t = dayStartMin; t <= dayEndMin; t += stepMin) out.push(minutesToHHmm(t));
  return out;
};

export const isStartInsideLunch = (startMin: number, w: WorkWindow) => {
  const ls = w.lunchStartMin ?? null;
  const le = w.lunchEndMin ?? null;
  return ls != null && le != null && startMin >= ls && startMin < le;
};

export const isStartInsideWorkday = (startMin: number, w: WorkWindow) =>
  startMin >= w.dayStartMin && startMin <= w.dayEndMin;

export const canStartAt = (startMin: number, w: WorkWindow) =>
  isStartInsideWorkday(startMin, w) && !isStartInsideLunch(startMin, w);

export const computeHourSlotsStatus = (params: {
  workWindow: WorkWindow;
  durationMin: number;
  busy: Interval[];
}) => {
  const { workWindow, durationMin, busy } = params;
  const dur = Math.max(1, Number(durationMin || 0) || 30);

  const slots = buildHourSlotsForDay(workWindow.dayStartMin, workWindow.dayEndMin, HOUR_STEP_MIN);

  return slots.map((slot) => {
    const start = hhmmToMinutes(slot);
    if (start == null) return { time: slot, isFree: false as const, reason: "outside-working-hours" as const };

    if (!canStartAt(start, workWindow)) {
      return { time: slot, isFree: false as const, reason: "lunch" as const };
    }

    const interval = { start, end: start + dur };
    const isBusy = busy.some((b) => overlaps(interval, b));

    return isBusy
      ? { time: slot, isFree: false as const, reason: "busy" as const }
      : { time: slot, isFree: true as const, reason: undefined };
  });
};

export const canMoveTo = (params: {
  workWindow: WorkWindow;
  startMin: number;
  durationMin: number;
  busy: Interval[];
}) => {
  const { workWindow, startMin, durationMin, busy } = params;
  const dur = Math.max(1, Number(durationMin || 0) || 30);

  if (!canStartAt(startMin, workWindow)) return false;

  const candidate = { start: startMin, end: startMin + dur };
  return busy.every((b) => !overlaps(candidate, b));
};
