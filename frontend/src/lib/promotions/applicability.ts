import type { Promotion } from "@/types/promotion";

const parseYmdLocalNoon = (ymd?: string | null) => {
  if (!ymd) return null;
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 12, 0, 0, 0);
};

export const isDateWithinRange = (date: Date, start?: string | null, end?: string | null) => {
  const s = parseYmdLocalNoon(start);
  const e = parseYmdLocalNoon(end);

  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  const t = d.getTime();

  if (s && t < s.getTime()) return false;
  if (e && t > e.getTime()) return false;
  return true;
};


export const getWeekOfMonthForWeekday = (date: Date) => {
  const weekday = date.getDay();
  const first = new Date(date.getFullYear(), date.getMonth(), 1, 12, 0, 0, 0);

  const diff = (weekday - first.getDay() + 7) % 7;
  const firstOccur = new Date(first);
  firstOccur.setDate(first.getDate() + diff);

  if (date.getTime() < firstOccur.getTime()) return null;

  const weekIndex = Math.floor((date.getDate() - firstOccur.getDate()) / 7) + 1;
  return weekIndex;
};

export const isPromotionApplicableOnDate = (promo: Promotion, date: Date) => {
  if (!promo.active) return false;

  if (!isDateWithinRange(date, promo.start_date, promo.end_date)) return false;

  if (!promo.is_recurring || !promo.recurrence_type) return true;

  const weekday = date.getDay();

  if (promo.recurrence_type === "weekly") {
    const days = Array.isArray(promo.recurrence_weekdays) ? promo.recurrence_weekdays : [];
    return days.length === 0 ? true : days.includes(weekday);
  }

  if (promo.recurrence_type === "monthly_weekday") {
    const days = Array.isArray(promo.recurrence_weekdays) ? promo.recurrence_weekdays : [];
    const okDay = days.length === 0 ? true : days.includes(weekday);
    if (!okDay) return false;

    const targetWeek = promo.recurrence_week_of_month != null ? Number(promo.recurrence_week_of_month) : null;
    if (!targetWeek) return true;

    const week = getWeekOfMonthForWeekday(date);
    return week != null && week === targetWeek;
  }

  if (promo.recurrence_type === "yearly") {
    const mm = promo.recurrence_month != null ? Number(promo.recurrence_month) : null;
    const dd = promo.recurrence_day_of_month != null ? Number(promo.recurrence_day_of_month) : null;
    if (!mm || !dd) return false;

    return date.getMonth() + 1 === mm && date.getDate() === dd;
    }

  return false;
};
