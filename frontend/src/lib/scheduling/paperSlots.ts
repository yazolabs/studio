export const PAPER_STEP_MIN = 30;

export const LONG_FLEX_MIN = 240;
export const isLongFlexibleService = (durationMin: number) =>
  (durationMin || 0) >= LONG_FLEX_MIN;

export const minutesToHHmm = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

export const buildSlotsBetween = (
  startMin: number,
  endMin: number,
  stepMin = PAPER_STEP_MIN
) => {
  const out: string[] = [];
  for (let t = startMin; t <= endMin; t += stepMin) out.push(minutesToHHmm(t));
  return out;
};

export const overlaps = (a: { start: number; end: number }, b: { start: number; end: number }) =>
  a.start < b.end && b.start < a.end;

const PAPER_SLOT_TEMPLATES: Record<"short" | "hour" | "twoHours" | "long", string[]> = {
  short: [
    "08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30",
    "12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30",
    "16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30",
  ],
  hour: ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00"],
  twoHours: ["08:00","09:00","11:00","14:00","16:00","18:00"],
  long: ["08:00","09:00","13:00"],
};

export function pickPaperTemplateByDuration(durationMin: number): string[] {
  if (durationMin <= 45) return PAPER_SLOT_TEMPLATES.short;
  if (durationMin <= 75) return PAPER_SLOT_TEMPLATES.hour;
  if (durationMin <= 150) return PAPER_SLOT_TEMPLATES.twoHours;
  return PAPER_SLOT_TEMPLATES.long;
}

export function getPaperBlockMinutes(durationMin: number) {
  if (durationMin <= 45) return 30;
  if (durationMin <= 75) return 60;
  if (durationMin <= 150) return 120;
  return 240;
}

export function normalizeDurationForPaper(durationMin: number) {
  const block = getPaperBlockMinutes(durationMin);
  if (durationMin <= 0) return block;
  return Math.ceil(durationMin / block) * block;
}

export function buildPaperSlotsForDay(params: {
  durationMin: number;
  dayStartMin: number;
  dayEndMin: number;
  lunchStartMin?: number | null;
  lunchEndMin?: number | null;
  hhmmToMinutes: (hhmm: string) => number | null;
}): string[] {
  const { durationMin, dayStartMin, dayEndMin, lunchStartMin, lunchEndMin, hhmmToMinutes } = params;

  const base = [...pickPaperTemplateByDuration(durationMin)];

  const baseMins = base
    .map((h) => hhmmToMinutes(h))
    .filter((x): x is number => x != null);

  const last = baseMins.length ? Math.max(...baseMins) : dayStartMin;

  for (let t = last + PAPER_STEP_MIN; t <= dayEndMin; t += PAPER_STEP_MIN) {
    base.push(minutesToHHmm(t));
  }

  return base.filter((hhmm) => {
    const start = hhmmToMinutes(hhmm);
    if (start == null) return false;

    if (start < dayStartMin) return false;
    if (start > dayEndMin) return false;

    if (lunchStartMin != null && lunchEndMin != null) {
      if (start >= lunchStartMin && start < lunchEndMin) return false;
    }

    return true;
  });
}
