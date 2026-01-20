import type { Appointment } from "@/types/appointment";
import { cn } from "@/lib/utils";

export type AptStatus = Appointment["status"];

export const STATUS_LABEL: Record<AptStatus, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não Compareceu",
  rescheduled: "Reagendado",
};

export const STATUS_BADGE_CLASS: Record<AptStatus, string> = {
  scheduled:
    "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-800",
  confirmed:
    "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-900/20 dark:text-sky-200 dark:border-sky-800",
  completed:
    "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200 dark:border-emerald-800",
  cancelled:
    "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-200 dark:border-rose-800",
  no_show:
    "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-800",
  rescheduled:
    "bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-900/20 dark:text-violet-200 dark:border-violet-800",
};

export const STATUS_CARD_ACCENT_CLASS: Record<AptStatus, string> = {
  scheduled: "border-l-amber-500 bg-amber-50/50 dark:bg-amber-900/10",
  confirmed: "border-l-sky-500 bg-sky-50/50 dark:bg-sky-900/10",
  completed: "border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10",
  cancelled: "border-l-rose-500 bg-rose-50/40 dark:bg-rose-900/10 opacity-70",
  no_show: "border-l-slate-400 bg-slate-50/40 dark:bg-slate-900/20 opacity-70",
  rescheduled: "border-l-violet-500 bg-violet-50/50 dark:bg-violet-900/10",
};

export const getStatusLabel = (status: AptStatus) => STATUS_LABEL[status] ?? String(status);

export const getStatusBadgeClass = (status: AptStatus, extra?: string) =>
  cn("border", STATUS_BADGE_CLASS[status] ?? "bg-muted text-muted-foreground border-border", extra);

export const getStatusCardClass = (status: AptStatus, extra?: string) =>
  cn("border-l-4", STATUS_CARD_ACCENT_CLASS[status] ?? "border-l-border bg-muted/20", extra);

export const STATUS_OPTIONS: AptStatus[] = [
  "scheduled",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
  "rescheduled",
];

