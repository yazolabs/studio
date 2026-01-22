import React, { useMemo, useState } from "react";
import { format, isToday, addDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, User, Scissors, Phone, DollarSign, Edit, Trash2, Printer, ChevronDown, ChevronUp, Calendar, Users, ChevronLeft, ChevronRight, GripVertical, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { hhmmToMinutes, type Interval } from "@/lib/scheduling/hourAvailability";
import { PAPER_STEP_MIN, buildSlotsBetween, overlaps, normalizeDurationForPaper } from "@/lib/scheduling/paperSlots";
import type { Appointment } from "@/types/appointment";
import { STATUS_OPTIONS, getStatusLabel, getStatusBadgeClass, getStatusCardClass } from "@/lib/appointments/statusUI";

type ID = number | string;

type WorkScheduleEntry = {
  day: string;
  startTime: string;
  endTime: string;
  lunchStart?: string | null;
  lunchEnd?: string | null;
  isDayOff?: boolean;
  isWorkingDay?: boolean;
};

type Professional = {
  id: ID;
  name: string;
  work_schedule?: WorkScheduleEntry[] | null;
};

type ReassignScope =
  | { type: "all" }
  | { type: "only_professional"; professionalId: number };

type Props = {
  appointments: Appointment[];
  professionals: Professional[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onEdit?: (appointment: Appointment) => void;
  onDelete?: (id: number) => void;
  onCheckout?: (appointment: Appointment) => void;
  onPrint?: (appointment: Appointment) => void;
  onQuickStatusChange?: (appointmentId: number, newStatus: Appointment["status"]) => void;
  onQuickTimeChange?: (
    appointmentId: number,
    newTime: string,
    onConflict: (availableSlots: string[]) => void
  ) => void;
  onReassignProfessional?: (
    appointmentId: number,
    newProfessionalId: number,
    onConflict: () => void
  ) => void;
  onReassignProfessionalScoped?: (
    appointmentId: number,
    newProfessionalId: number,
    scope: ReassignScope,
    onConflict: () => void
  ) => void;
  onQuickReassign?: (
    appointmentId: number,
    newProfessionalId: number,
    newTime: string,
    scope: ReassignScope,
    onConflict: (availableSlots: string[]) => void
  ) => void;
  canEdit?: boolean;
  canDelete?: boolean;
};

const WEEKDAY_LABELS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

const getWeekdayLabel = (date: Date) => WEEKDAY_LABELS[date.getDay()];

const extractHHmm = (value?: string | null): string | null => {
  if (!value) return null;
  const v = value.trim();
  if (v.includes("T")) return v.split("T")[1]?.slice(0, 5) ?? null;
  if (v.includes(" ")) return v.split(" ")[1]?.slice(0, 5) ?? null;
  return v.slice(0, 5);
};

const timeStringToMinutes = (value?: string | null): number | null => {
  const hhmm = extractHHmm(value);
  if (!hhmm) return null;
  return hhmmToMinutes(hhmm);
};

const applyLunchBreakIfCrosses = (
  startMin: number,
  endMin: number,
  lunchStartMin: number | null,
  lunchEndMin: number | null
) => {
  if (lunchStartMin == null || lunchEndMin == null) return endMin;
  if (lunchEndMin <= lunchStartMin) return endMin;

  const overlapsLunch = startMin < lunchEndMin && lunchStartMin < endMin;

  return overlapsLunch ? endMin + (lunchEndMin - lunchStartMin) : endMin;
};

function getWorkWindowForProfessionalOnDate(
  professionals: Professional[],
  professionalId: number,
  date: Date
): {
  dayStartMin: number;
  dayEndMin: number;
  lunchStartMin?: number | null;
  lunchEndMin?: number | null;
} | null {
  const prof = professionals.find((p) => Number(p.id) === Number(professionalId));
  const schedule = prof?.work_schedule;

  if (!schedule || schedule.length === 0) return null;

  const weekdayLabel = getWeekdayLabel(date);
  const daySchedule = schedule.find((d) => d.day === weekdayLabel);

  if (!daySchedule || daySchedule.isDayOff || daySchedule.isWorkingDay === false) {
    return null;
  }

  const dayStartMin = timeStringToMinutes(daySchedule.startTime);
  const dayEndMin = timeStringToMinutes(daySchedule.endTime);

  if (dayStartMin == null || dayEndMin == null || dayEndMin <= dayStartMin) {
    return null;
  }

  let lunchStartMin: number | null = null;
  let lunchEndMin: number | null = null;

  if (daySchedule.lunchStart) lunchStartMin = timeStringToMinutes(daySchedule.lunchStart) ?? null;
  if (daySchedule.lunchEnd) lunchEndMin = timeStringToMinutes(daySchedule.lunchEnd) ?? null;

  if (lunchStartMin != null && lunchEndMin != null && lunchEndMin <= lunchStartMin) {
    lunchStartMin = null;
    lunchEndMin = null;
  }

  return { dayStartMin, dayEndMin, lunchStartMin, lunchEndMin };
}

const toHHmm = (time: string | null) => extractHHmm(time) ?? "";

const moneyToNumber = (value: string | null | undefined): number => {
  if (!value) return 0;
  const normalized = value.replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
};

const timeToMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const pluralize = (n: number, singular: string, plural: string) => (n === 1 ? singular : plural);

const SUMMARY_STATUS_LABEL: Partial<Record<Appointment["status"], { singular: string; plural: string }>> = {
  scheduled: { singular: "agendado", plural: "agendados" },
  confirmed: { singular: "confirmado", plural: "confirmados" },
  completed: { singular: "concluído", plural: "concluídos" },
  cancelled: { singular: "cancelado", plural: "cancelados" },
  no_show: { singular: "não compareceu", plural: "não compareceram" },
  rescheduled: { singular: "reagendado", plural: "reagendados" },
};

const LOCKED_STATUSES: Appointment["status"][] = ["completed", "cancelled", "no_show"];

const isDragBlockedByStatus = (status: Appointment["status"]) =>
  LOCKED_STATUSES.includes(status);

const getStatusLockMessage = (status: Appointment["status"]) => {
  switch (status) {
    case "completed":
      return "Agendamentos concluídos não podem ser movidos por arrastar.";
    case "cancelled":
      return "Agendamentos cancelados não podem ser movidos por arrastar.";
    case "no_show":
      return "Agendamentos marcados como 'não compareceu' não podem ser movidos por arrastar.";
    default:
      return "Este agendamento não pode ser movido por arrastar.";
  }
};

const getUniqueProfessionalIdsFromServices = (apt: Appointment) => {
  const services: any[] = Array.isArray(apt.services) ? (apt.services as any[]) : [];
  const ids = services
    .map((s) => Number(s?.professional_id))
    .filter((id) => Number.isFinite(id) && id > 0);
  return Array.from(new Set(ids));
};

const isMultiProfessionalAppointment = (apt: Appointment) => {
  const ids = getUniqueProfessionalIdsFromServices(apt);
  return ids.length > 1;
};

type ReassignBlockReason =
  | "status_locked"
  | "multi_professional"
  | "no_schedule"
  | "lunch"
  | "outside_hours"
  | "does_not_fit"
  | "busy"
  | "invalid_time";

export function ProfessionalDailyView({
  appointments,
  professionals,
  selectedDate,
  onDateChange,
  onEdit,
  onDelete,
  onCheckout,
  onPrint,
  onQuickStatusChange,
  onQuickTimeChange,
  onQuickReassign,
  onReassignProfessional,
  onReassignProfessionalScoped,
  canEdit = true,
  canDelete = true,
}: Props) {
  const [expandedProfessionals, setExpandedProfessionals] = useState<Set<string>>(new Set());
  const [draggedAppointment, setDraggedAppointment] = useState<Appointment | null>(null);
  const [dragOverProfessional, setDragOverProfessional] = useState<string | null>(null);
  const [dragSourceProfessionalId, setDragSourceProfessionalId] = useState<number | null>(null);

  const [timeConflictDialog, setTimeConflictDialog] = useState<{
    open: boolean;
    appointmentId: number;
    availableSlots: string[];
  }>({ open: false, appointmentId: 0, availableSlots: [] });

  const [reassignDialog, setReassignDialog] = useState<{
    open: boolean;
    reason: ReassignBlockReason;
    message?: string;
    appointmentId: number;
    targetProfessionalId: number;
    targetProfessionalName: string;
    availableSlots: string[];
  }>({
    open: false,
    reason: "busy",
    message: "",
    appointmentId: 0,
    targetProfessionalId: 0,
    targetProfessionalName: "",
    availableSlots: [],
  });

  const EMPTY_MULTI_PROF_DIALOG = {
    open: false,
    appointmentId: 0,
    targetProfessionalId: 0,
    targetProfessionalName: "",
    sourceProfessionalId: null as number | null,
  };

  const [multiProfDialog, setMultiProfDialog] = useState<{
    open: boolean;
    appointmentId: number;
    targetProfessionalId: number;
    targetProfessionalName: string;
    sourceProfessionalId: number | null;
  }>(EMPTY_MULTI_PROF_DIALOG);

  const dateStr = useMemo(() => format(selectedDate, "yyyy-MM-dd"), [selectedDate]);
  const isTodaySelected = useMemo(() => isToday(selectedDate), [selectedDate]);

  const dayAppointments = useMemo(
    () => appointments.filter((apt) => apt.date === dateStr),
    [appointments, dateStr]
  );

  const appointmentHasProfessional = (apt: Appointment, professionalId: number) => {
    const services = apt.services ?? [];
    return services.some((s) => Number(s.professional_id) === Number(professionalId));
  };

  const servicesLabel = (apt: Appointment) =>
    (apt.services ?? []).map((s) => s.name).filter(Boolean).join(", ") || "Serviço";

  const customerPhone = (apt: Appointment) => (apt.customer as any)?.phone as string | undefined;

  const appointmentDuration = (apt: Appointment) => {
    const services = Array.isArray(apt.services) ? apt.services : [];
    const intervals: Array<{ start: number; end: number }> = [];

    services.forEach((s: any) => {
      const sStart =
        timeStringToMinutes(s.starts_at) ?? timeStringToMinutes(apt.start_time);
      let sEnd = timeStringToMinutes(s.ends_at);

      if (sStart != null && (sEnd == null || sEnd <= sStart)) {
        const sd = Number(s.duration ?? 0);
        const d = sd > 0 ? sd : Number(apt.duration ?? 0) || 30;
        sEnd = sStart + d;
      }

      if (sStart != null && sEnd != null && sEnd > sStart) {
        intervals.push({ start: sStart, end: sEnd });
      }
    });

    if (intervals.length === 0) {
      const d = Number(apt.duration ?? 0);
      return d > 0 ? d : 30;
    }

    const minStart = Math.min(...intervals.map((i) => i.start));
    const maxEnd = Math.max(...intervals.map((i) => i.end));
    return Math.max(30, maxEnd - minStart);
  };

  const getBusyIntervalsForProfessional = (
    professionalId: number,
    excludeAppointmentId?: number
  ): Interval[] => {
    const pid = Number(professionalId);

    return dayAppointments
      .filter((apt) => {
        if (excludeAppointmentId != null && Number(apt.id) === Number(excludeAppointmentId)) return false;
        if (apt.status === "cancelled" || apt.status === "no_show") return false;
        return appointmentHasProfessional(apt, pid);
      })
      .flatMap((apt) => {
        const intervals: Interval[] = [];

        const services = apt.services ?? [];
        const workWindow = getWorkWindowForProfessionalOnDate(professionals, pid, selectedDate);

        const toBusyEnd = (start: number, durReal: number) => {
          const durPaper = normalizeDurationForPaper(durReal || 30);
          const rawEnd = start + durPaper;

          return applyLunchBreakIfCrosses(
            start,
            rawEnd,
            workWindow?.lunchStartMin ?? null,
            workWindow?.lunchEndMin ?? null
          );
        };

        const svcForProf = services.filter((s: any) => Number(s.professional_id) === pid);

        if (svcForProf.length > 0) {
          svcForProf.forEach((s: any) => {
            const sStart =
              timeStringToMinutes(s.starts_at) ?? timeStringToMinutes(apt.start_time);

            let rawEnd = timeStringToMinutes(s.ends_at);

            if (sStart != null && (rawEnd == null || rawEnd <= sStart)) {
              const durReal =
                Number(s.duration ?? 0) ||
                Number(apt.duration ?? 0) ||
                appointmentDuration(apt) ||
                30;

              const durPaper = normalizeDurationForPaper(durReal || 30);
              rawEnd = sStart + durPaper;
            }

            if (sStart != null && rawEnd != null && rawEnd > sStart) {
              const busyEnd = applyLunchBreakIfCrosses(
                sStart,
                rawEnd,
                workWindow?.lunchStartMin ?? null,
                workWindow?.lunchEndMin ?? null
              );

              intervals.push({ start: sStart, end: busyEnd });
            }
          });

          return intervals;
        }

        const start = timeStringToMinutes(apt.start_time);
        const dur = appointmentDuration(apt);
        if (start != null && dur > 0) {
          const durPaper = normalizeDurationForPaper(dur || 30);
          const rawEnd = start + durPaper;

          const end = workWindow
            ? applyLunchBreakIfCrosses(
                start,
                rawEnd,
                workWindow.lunchStartMin ?? null,
                workWindow.lunchEndMin ?? null
              )
            : rawEnd;

          intervals.push({ start, end });
        }

        return intervals;
      });
  };

  const appointmentPrice = (apt: Appointment) => {
    const final = moneyToNumber(apt.final_price);
    if (final > 0) return final;
    return moneyToNumber(apt.total_price);
  };

  const getProfessionalAppointments = (professionalId: number) => {
    return dayAppointments
      .filter((apt) => appointmentHasProfessional(apt, professionalId))
      .sort((a, b) => toHHmm(a.start_time).localeCompare(toHHmm(b.start_time)));
  };

  const getProfessionalStats = (professionalId: number) => {
    const profAppointments = getProfessionalAppointments(professionalId);

    const counts = profAppointments.reduce(
      (acc, a) => {
        acc[a.status] = (acc[a.status] ?? 0) + 1;
        return acc;
      },
      {} as Partial<Record<Appointment["status"], number>>
    );

    const totalAppointments = profAppointments.length;
    const scheduledCount = counts.scheduled ?? 0;
    const confirmedCount = counts.confirmed ?? 0;
    const pending = scheduledCount + confirmedCount;
    const completed = counts.completed ?? 0;
    const cancelled = counts.cancelled ?? 0;
    const noShowCount = counts.no_show ?? 0;
    const rescheduledCount = counts.rescheduled ?? 0;
    const totalRevenue = profAppointments
      .filter((a) => a.status !== "cancelled")
      .reduce((sum, a) => sum + appointmentPrice(a), 0);
    const occupiedMinutes = profAppointments
      .filter((a) => a.status !== "cancelled")
      .reduce((sum, a) => sum + appointmentDuration(a), 0);
    const workDayMinutes = 600;
    const occupationPercentage = Math.min(
      Math.round((occupiedMinutes / workDayMinutes) * 100),
      100
    );

    return {
      totalAppointments,
      scheduledCount,
      confirmedCount,
      pending,
      completed,
      cancelled,
      noShowCount,
      rescheduledCount,
      totalRevenue,
      occupiedMinutes,
      occupationPercentage,
    };
  };

  const toggleProfessional = (id: string) => {
    setExpandedProfessionals((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePreviousDay = () => onDateChange(subDays(selectedDate, 1));
  const handleNextDay = () => onDateChange(addDays(selectedDate, 1));
  const handleToday = () => onDateChange(new Date());

  const getAvailableSlotsForProfessional = (
    professionalId: number,
    durationMin: number,
    excludeAppointmentId?: number
  ) => {
    const workWindow = getWorkWindowForProfessionalOnDate(
      professionals,
      professionalId,
      selectedDate
    );
    if (!workWindow) return [];

    const busy = getBusyIntervalsForProfessional(professionalId, excludeAppointmentId);

    const paperDur = normalizeDurationForPaper(durationMin || 30);

    const baseSlots = buildSlotsBetween(
      workWindow.dayStartMin,
      workWindow.dayEndMin,
      PAPER_STEP_MIN
    ).filter((hhmm) => {
      const t = timeStringToMinutes(hhmm);
      if (t == null) return false;

      if (
        workWindow.lunchStartMin != null &&
        workWindow.lunchEndMin != null &&
        t >= workWindow.lunchStartMin &&
        t < workWindow.lunchEndMin
      ) {
        return false;
      }

      if (t >= workWindow.dayEndMin) return false;

      return true;
    });

    const out: string[] = [];

    for (const hhmm of baseSlots) {
      const start = timeStringToMinutes(hhmm);
      if (start == null) continue;

      const rawEnd = start + paperDur;
      const end = applyLunchBreakIfCrosses(
        start,
        rawEnd,
        workWindow.lunchStartMin ?? null,
        workWindow.lunchEndMin ?? null
      );

      const interval = { start, end };
      const hasOverlap = busy.some((b) => overlaps(interval, b));
      if (!hasOverlap) out.push(hhmm);
    }

    return out;
  };

  const getSlotsStatusForProfessional = (
    professionalId: number,
    durationMin: number,
    excludeAppointmentId?: number
  ) => {
    const workWindow = getWorkWindowForProfessionalOnDate(
      professionals,
      professionalId,
      selectedDate
    );
    if (!workWindow) return [];

    const busy = getBusyIntervalsForProfessional(professionalId, excludeAppointmentId);

    const paperDur = normalizeDurationForPaper(durationMin || 30);

    const baseSlots = buildSlotsBetween(
      workWindow.dayStartMin,
      workWindow.dayEndMin,
      PAPER_STEP_MIN
    ).filter((hhmm) => {
      const t = timeStringToMinutes(hhmm);
      if (t == null) return false;

      if (
        workWindow.lunchStartMin != null &&
        workWindow.lunchEndMin != null &&
        t >= workWindow.lunchStartMin &&
        t < workWindow.lunchEndMin
      ) {
        return false;
      }

      if (t >= workWindow.dayEndMin) return false;

      return true;
    });

    return baseSlots.map((hhmm) => {
      const start = timeStringToMinutes(hhmm);
      if (start == null) return { time: hhmm, isFree: false, reason: "outside-working-hours" as const };

      const rawEnd = start + paperDur;
      const end = applyLunchBreakIfCrosses(
        start,
        rawEnd,
        workWindow.lunchStartMin ?? null,
        workWindow.lunchEndMin ?? null
      );

      const interval = { start, end };
      const hasOverlap = busy.some((b) => overlaps(interval, b));

      if (hasOverlap) return { time: hhmm, isFree: false, reason: "busy" as const };
      return { time: hhmm, isFree: true as const };
    });
  };

  const handleDragStart = (e: React.DragEvent, appointment: Appointment, sourceProfessionalId: number) => {
    if (!canEdit || !onReassignProfessional) return;

    if (isDragBlockedByStatus(appointment.status)) {
      e.preventDefault();
      setDraggedAppointment(null);
      setDragSourceProfessionalId(null);

      setReassignDialog({
        open: true,
        reason: "status_locked",
        message: getStatusLockMessage(appointment.status),
        appointmentId: appointment.id,
        targetProfessionalId: 0,
        targetProfessionalName: "",
        availableSlots: [],
      });
      return;
    }

    setDraggedAppointment(appointment);
    setDragSourceProfessionalId(sourceProfessionalId);

    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(appointment.id));
  };

  const handleDragEnd = () => {
    setDraggedAppointment(null);
    setDragSourceProfessionalId(null);
    setDragOverProfessional(null);
  };

  const handleDragOver = (e: React.DragEvent, professionalId: string) => {
    if (!draggedAppointment || !canEdit) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverProfessional(professionalId);
  };

  const openReassignDialog = (params: {
    reason: ReassignBlockReason;
    message?: string;
    appointmentId: number;
    targetProfessionalId: number;
    targetProfessionalName: string;
    availableSlots?: string[];
  }) => {
    setReassignDialog({
      open: true,
      reason: params.reason,
      message: params.message ?? "",
      appointmentId: params.appointmentId,
      targetProfessionalId: params.targetProfessionalId,
      targetProfessionalName: params.targetProfessionalName,
      availableSlots: params.availableSlots ?? [],
    });
  };

  const performReassign = (
    appointmentId: number,
    targetProfessionalId: number,
    scope: ReassignScope,
    onConflict: () => void
  ) => {
    if (onReassignProfessionalScoped) {
      onReassignProfessionalScoped(appointmentId, targetProfessionalId, scope, onConflict);
      return;
    }
    onReassignProfessional?.(appointmentId, targetProfessionalId, onConflict);
  };

  const tryReassign = (opts: {
    appointment: Appointment;
    targetProfessionalId: number;
    targetProfessionalName: string;
    scope: ReassignScope;
  }) => {
    const { appointment, targetProfessionalId, targetProfessionalName, scope } = opts;

    if (!onReassignProfessional) return;

    if (isDragBlockedByStatus(appointment.status)) {
      openReassignDialog({
        reason: "status_locked",
        message: getStatusLockMessage(appointment.status),
        appointmentId: appointment.id,
        targetProfessionalId,
        targetProfessionalName,
        availableSlots: [],
      });
      return;
    }

    const durationMin = appointmentDuration(appointment);

    const workWindow = getWorkWindowForProfessionalOnDate(
      professionals,
      targetProfessionalId,
      selectedDate
    );

    if (!workWindow) {
      openReassignDialog({
        reason: "no_schedule",
        message: `${targetProfessionalName} não possui escala configurada para este dia.`,
        appointmentId: appointment.id,
        targetProfessionalId,
        targetProfessionalName,
        availableSlots: [],
      });
      return;
    }

    const startMin = timeStringToMinutes(appointment.start_time);
    const availableSlots = getAvailableSlotsForProfessional(
      targetProfessionalId,
      durationMin,
      appointment.id
    );

    if (startMin == null) {
      openReassignDialog({
        reason: "invalid_time",
        message: "Não foi possível interpretar o horário deste agendamento. Ajuste o horário antes de mover.",
        appointmentId: appointment.id,
        targetProfessionalId,
        targetProfessionalName,
        availableSlots,
      });
      return;
    }

    if (
      workWindow.lunchStartMin != null &&
      workWindow.lunchEndMin != null &&
      startMin >= workWindow.lunchStartMin &&
      startMin < workWindow.lunchEndMin
    ) {
      openReassignDialog({
        reason: "lunch",
        message: "Este horário cai no intervalo do profissional. Escolha um horário disponível:",
        appointmentId: appointment.id,
        targetProfessionalId,
        targetProfessionalName,
        availableSlots,
      });
      return;
    }

    if (startMin < workWindow.dayStartMin || startMin >= workWindow.dayEndMin) {
      openReassignDialog({
        reason: "outside_hours",
        message: "Este horário está fora do expediente do profissional. Escolha um horário disponível:",
        appointmentId: appointment.id,
        targetProfessionalId,
        targetProfessionalName,
        availableSlots,
      });
      return;
    }

    const paperDur = normalizeDurationForPaper(durationMin || 30);
    const rawEnd = startMin + paperDur;
    const end = applyLunchBreakIfCrosses(
      startMin,
      rawEnd,
      workWindow.lunchStartMin ?? null,
      workWindow.lunchEndMin ?? null
    );

    const busy = getBusyIntervalsForProfessional(targetProfessionalId, appointment.id);
    const interval = { start: startMin, end };
    const hasOverlap = busy.some((b) => overlaps(interval, b));

    if (hasOverlap) {
      openReassignDialog({
        reason: "busy",
        message: `${targetProfessionalName} já possui um agendamento nesse horário. Escolha um horário disponível:`,
        appointmentId: appointment.id,
        targetProfessionalId,
        targetProfessionalName,
        availableSlots,
      });
      return;
    }

    performReassign(appointment.id, targetProfessionalId, scope, () => {
      openReassignDialog({
        reason: "busy",
        message: `${targetProfessionalName} não ficou disponível nesse horário (conflito). Escolha um horário:`,
        appointmentId: appointment.id,
        targetProfessionalId,
        targetProfessionalName,
        availableSlots,
      });
    });
  };

  const handleDrop = (e: React.DragEvent, targetProfessionalIdStr: string) => {
    e.preventDefault();
    setDragOverProfessional(null);

    if (!draggedAppointment || !onReassignProfessional) return;

    const targetProfessionalId = Number(targetProfessionalIdStr);

    if (appointmentHasProfessional(draggedAppointment, targetProfessionalId)) {
      setDraggedAppointment(null);
      setDragSourceProfessionalId(null);
      return;
    }

    const targetProfName =
      professionals.find((p) => Number(p.id) === targetProfessionalId)?.name ?? "";

    if (isDragBlockedByStatus(draggedAppointment.status)) {
      openReassignDialog({
        reason: "status_locked",
        message: getStatusLockMessage(draggedAppointment.status),
        appointmentId: draggedAppointment.id,
        targetProfessionalId,
        targetProfessionalName: targetProfName,
        availableSlots: [],
      });
      setDraggedAppointment(null);
      setDragSourceProfessionalId(null);
      return;
    }

    if (isMultiProfessionalAppointment(draggedAppointment)) {
      setMultiProfDialog({
        open: true,
        appointmentId: draggedAppointment.id,
        targetProfessionalId,
        targetProfessionalName: targetProfName,
        sourceProfessionalId: dragSourceProfessionalId,
      });
      return;
    }

    tryReassign({
      appointment: draggedAppointment,
      targetProfessionalId,
      targetProfessionalName: targetProfName,
      scope: { type: "all" },
    });

    setDraggedAppointment(null);
    setDragSourceProfessionalId(null);
  };

  const handleReassignDialogTimeSelect = (newTime: string) => {
    const appointmentId = reassignDialog.appointmentId;
    const targetProfessionalId = reassignDialog.targetProfessionalId;
    const targetProfessionalName = reassignDialog.targetProfessionalName;

    if (onQuickReassign) {
      onQuickReassign(
        appointmentId,
        targetProfessionalId,
        newTime,
        { type: "all" },
        (availableSlots) => {
          openReassignDialog({
            reason: "busy",
            message: `${targetProfessionalName} não ficou disponível nesse horário. Escolha outro:`,
            appointmentId,
            targetProfessionalId,
            targetProfessionalName,
            availableSlots: availableSlots?.length ? availableSlots : reassignDialog.availableSlots,
          });
        }
      );

      setReassignDialog({
        open: false,
        reason: "busy",
        message: "",
        appointmentId: 0,
        targetProfessionalId: 0,
        targetProfessionalName: "",
        availableSlots: [],
      });
      setDraggedAppointment(null);
      setDragSourceProfessionalId(null);
      return;
    }

    if (!onQuickTimeChange) return;

    onQuickTimeChange(appointmentId, newTime, () => {});

    setTimeout(() => {
      performReassign(appointmentId, targetProfessionalId, { type: "all" }, () => {
        openReassignDialog({
          reason: "busy",
          message: `${targetProfessionalName} não ficou disponível nesse horário (conflito). Escolha um horário:`,
          appointmentId,
          targetProfessionalId,
          targetProfessionalName,
          availableSlots: reassignDialog.availableSlots,
        });
      });
    }, 0);

    setReassignDialog({
      open: false,
      reason: "busy",
      message: "",
      appointmentId: 0,
      targetProfessionalId: 0,
      targetProfessionalName: "",
      availableSlots: [],
    });
    setDraggedAppointment(null);
    setDragSourceProfessionalId(null);
  };

  const handleTimeSelect = (appointmentId: number, newTime: string) => {
    if (!onQuickTimeChange) return;

    onQuickTimeChange(
      appointmentId,
      newTime,
      (availableSlots) => {
        setTimeConflictDialog({
          open: true,
          appointmentId,
          availableSlots,
        });
      }
    );
  };

  const handleConflictTimeSelect = (newTime: string) => {
    if (!onQuickTimeChange) return;

    onQuickTimeChange(
      timeConflictDialog.appointmentId,
      newTime,
      () => {}
    );

    setTimeConflictDialog({ open: false, appointmentId: 0, availableSlots: [] });
  };

  function HeaderProgress({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value || 0));

  const tone = v > 85 ? "danger" : v >= 60 ? "warn" : "ok";

  const fillClass =
    tone === "danger"
      ? "bg-rose-600 dark:bg-rose-500"
      : tone === "warn"
        ? "bg-amber-500 dark:bg-amber-400"
        : "bg-emerald-600 dark:bg-emerald-500";

  const tintClass =
    tone === "danger"
      ? "bg-rose-500/10 dark:bg-rose-400/10"
      : tone === "warn"
        ? "bg-amber-400/10 dark:bg-amber-300/10"
        : "bg-emerald-500/10 dark:bg-emerald-400/10";

  const glowClass =
    tone === "danger"
      ? "shadow-[0_0_12px_rgba(244,63,94,0.25)]"
      : tone === "warn"
        ? "shadow-[0_0_12px_rgba(245,158,11,0.25)]"
        : "shadow-[0_0_12px_rgba(16,185,129,0.25)]";

  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full ring-1 ring-border/60">
      <div className="absolute inset-0 bg-muted/70 dark:bg-muted/30" />
      <div className={cn("absolute inset-0", tintClass)} />
      <div
        className={cn("relative h-full transition-all", fillClass, glowClass)}
        style={{ width: `${v}%` }}
        aria-label={`Ocupação ${v}%`}
      />
    </div>
  );
}

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-primary/10 rounded-lg border border-primary/20">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-primary" />
          <div>
            <h2 className="font-semibold text-primary">
              Agenda do Dia - {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </h2>
            <p className="text-sm text-muted-foreground">
              {dayAppointments.length} agendamento{dayAppointments.length !== 1 ? "s" : ""} •{" "}
              {professionals.length} profissiona{professionals.length !== 1 ? "is" : "l"}
              {onReassignProfessional && canEdit && (
                <span className="ml-2 text-xs text-primary">• Arraste para realocar</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePreviousDay} title="Dia anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-w-[120px]">
                {isTodaySelected ? "Hoje" : format(selectedDate, "dd/MM/yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <CalendarPicker
                mode="single"
                selected={selectedDate}
                onSelect={(d) => d && onDateChange(d)}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <Button variant="outline" size="icon" onClick={handleNextDay} title="Próximo dia">
            <ChevronRight className="h-4 w-4" />
          </Button>

          {!isTodaySelected && (
            <Button variant="secondary" size="sm" onClick={handleToday}>
              Hoje
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {professionals.map((professional) => {
          const profId = Number(professional.id);
          const stats = getProfessionalStats(profId);
          const profAppointments = getProfessionalAppointments(profId);
          const isExpanded = expandedProfessionals.has(String(professional.id));
          const isDragOver = dragOverProfessional === String(professional.id);

          return (
            <Collapsible
              key={String(professional.id)}
              open={isExpanded}
              onOpenChange={() => toggleProfessional(String(professional.id))}
            >
              <Card
                className={cn(
                  "transition-all duration-300",
                  isExpanded ? "col-span-1 md:col-span-2 lg:col-span-3" : "",
                  stats.totalAppointments === 0 && "opacity-60",
                  isDragOver && "ring-2 ring-primary ring-offset-2 bg-primary/5"
                )}
                onDragOver={(e) => handleDragOver(e, String(professional.id))}
                onDragLeave={() => setDragOverProfessional(null)}
                onDrop={(e) => handleDrop(e, String(professional.id))}
              >
                <CollapsibleTrigger className="w-full">
                  <div className="p-4 cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-lg">
                          {professional.name.charAt(0)}
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold">{professional.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {stats.totalAppointments} agendamento{stats.totalAppointments !== 1 ? "s" : ""} hoje
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                          <p className="text-sm font-medium text-primary">{formatCurrency(stats.totalRevenue)}</p>
                        </div>

                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <HeaderProgress value={stats.occupationPercentage} />
                        </div>

                        <span className="text-xs font-medium text-muted-foreground tabular-nums">
                          {stats.occupationPercentage}%
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {stats.totalAppointments === 0 ? (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            Sem agendamentos
                          </Badge>
                        ) : (
                          [
                            { status: "scheduled" as const, count: stats.scheduledCount },
                            { status: "confirmed" as const, count: stats.confirmedCount },
                            { status: "completed" as const, count: stats.completed },
                            { status: "rescheduled" as const, count: stats.rescheduledCount },
                            { status: "no_show" as const, count: stats.noShowCount },
                            { status: "cancelled" as const, count: stats.cancelled },
                          ]
                            .filter((i) => i.count > 0)
                            .map(({ status, count }) => {
                              const label = SUMMARY_STATUS_LABEL[status];
                              const text = label ? pluralize(count, label.singular, label.plural) : getStatusLabel(status);

                              return (
                                <Badge
                                  key={status}
                                  variant="outline"
                                  className={getStatusBadgeClass(status, "text-xs")}
                                  title={getStatusLabel(status)}
                                >
                                  {count} {text}
                                </Badge>
                              );
                            })
                        )}
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <Separator />
                  <div className="p-4 min-h-0">
                    {profAppointments.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p>Nenhum agendamento para hoje</p>
                      </div>
                    ) : (
                      <ScrollArea className="h-[60vh] md:h-[65vh] lg:h-[70vh] pr-5">
                        <div className="space-y-3">
                          {profAppointments.map((appointment) => {
                            const time = toHHmm(appointment.start_time);
                            const dur = appointmentDuration(appointment);
                            const price = appointmentPrice(appointment);
                            const service = servicesLabel(appointment);
                            const phone = customerPhone(appointment);
                            const canDrag = !!(canEdit && onReassignProfessional && !isDragBlockedByStatus(appointment.status));

                            return (
                              <Card
                                key={appointment.id}
                                draggable={canDrag}
                                onDragStart={(e) => handleDragStart(e, appointment, profId)}
                                onDragEnd={handleDragEnd}
                                className={cn(
                                  "p-4 transition-all hover:shadow-md",
                                  canDrag && "cursor-grab active:cursor-grabbing",
                                  !canDrag && canEdit && onReassignProfessional && "cursor-not-allowed opacity-80",
                                  draggedAppointment?.id === appointment.id && "opacity-70",
                                  getStatusCardClass(appointment.status)
                                )}
                              >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                  <div className="flex-1 space-y-2">
                                    <div className="flex items-center justify-between md:justify-start gap-3">
                                      <div className="flex items-center gap-2">
                                        {canDrag && (
                                          <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                                        )}

                                        {onQuickTimeChange && canEdit ? (
                                          <Popover>
                                            <PopoverTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-auto p-1 hover:bg-primary/10"
                                                onClick={(e) => e.stopPropagation()}
                                              >
                                                <Clock className="h-4 w-4 text-primary mr-1" />
                                                <span className="font-bold text-lg">{time || "--:--"}</span>
                                              </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-48 p-2" align="start">
                                              <p className="text-xs text-muted-foreground mb-2">Alterar horário:</p>

                                              {(() => {
                                                const slotStatuses = getSlotsStatusForProfessional(profId, dur, appointment.id);
                                                const current = time || "";

                                                const hasCurrent = current && slotStatuses.some((s) => s.time === current);
                                                const finalList = hasCurrent
                                                  ? slotStatuses
                                                  : current
                                                    ? [{ time: current, isFree: true as const } as any, ...slotStatuses]
                                                    : slotStatuses;

                                                if (finalList.length === 0) {
                                                  return (
                                                    <p className="text-xs text-muted-foreground py-2">
                                                      Sem horários na escala deste profissional.
                                                    </p>
                                                  );
                                                }

                                                return (
                                                  <ScrollArea className="h-48">
                                                    <div className="space-y-1">
                                                      {finalList.map((slot) => {
                                                        const isCurrent = slot.time === current;
                                                        const disabled = !slot.isFree && !isCurrent;

                                                        const reasonLabel =
                                                          !slot.isFree && !isCurrent
                                                            ? slot.reason === "busy"
                                                              ? "ocupado"
                                                              : slot.reason === "lunch"
                                                                ? "intervalo"
                                                                : "fora da escala"
                                                            : null;

                                                        return (
                                                          <Button
                                                            key={slot.time}
                                                            variant={isCurrent ? "secondary" : "ghost"}
                                                            size="sm"
                                                            className={cn(
                                                              "w-full justify-start",
                                                              disabled && "opacity-60",
                                                              slot.reason === "busy" && disabled && "text-destructive"
                                                            )}
                                                            disabled={disabled}
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              if (slot.time !== current && slot.isFree) {
                                                                handleTimeSelect(appointment.id, slot.time);
                                                              }
                                                            }}
                                                          >
                                                            {slot.time}
                                                            {reasonLabel ? (
                                                              <span className="ml-2 text-[10px] text-muted-foreground">• {reasonLabel}</span>
                                                            ) : null}
                                                          </Button>
                                                        );
                                                      })}
                                                    </div>
                                                  </ScrollArea>
                                                );
                                              })()}
                                            </PopoverContent>
                                          </Popover>
                                        ) : (
                                          <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-primary" />
                                            <span className="font-bold text-lg">{time || "--:--"}</span>
                                          </div>
                                        )}
                                      </div>

                                      {onQuickStatusChange && canEdit ? (
                                        <Select
                                          value={appointment.status}
                                          onValueChange={(value) => {
                                            onQuickStatusChange(appointment.id, value as Appointment["status"]);
                                          }}
                                        >
                                          <SelectTrigger
                                            className="w-auto h-auto border-0 p-0 focus:ring-0"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <Badge
                                              variant="outline"
                                              className={getStatusBadgeClass(appointment.status, "cursor-pointer")}
                                            >
                                              {getStatusLabel(appointment.status)}
                                            </Badge>
                                          </SelectTrigger>
                                          <SelectContent>
                                             {STATUS_OPTIONS.map((status) => (
                                              <SelectItem key={status} value={status}>
                                                <Badge variant="outline" className={getStatusBadgeClass(status)}>
                                                  {getStatusLabel(status)}
                                                </Badge>
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      ) : (
                                        <Badge variant="outline" className={getStatusBadgeClass(appointment.status, "cursor-pointer")}>
                                          {getStatusLabel(appointment.status)}
                                        </Badge>
                                      )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                      <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">{appointment.customer?.name ?? "Cliente"}</span>
                                      </div>

                                      {phone && (
                                        <div className="flex items-center gap-2">
                                          <Phone className="h-4 w-4 text-muted-foreground" />
                                          <span>{phone}</span>
                                        </div>
                                      )}

                                      <div className="flex items-center gap-2">
                                        <Scissors className="h-4 w-4 text-muted-foreground" />
                                        <span>{service}</span>
                                      </div>

                                      {dur > 0 && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                          <Clock className="h-4 w-4" />
                                          <span>{formatDuration(dur)}</span>
                                        </div>
                                      )}
                                    </div>

                                    {price > 0 && (
                                      <div className="flex items-center gap-2 text-primary font-semibold">
                                        <DollarSign className="h-4 w-4" />
                                        <span>{formatCurrency(price)}</span>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex gap-1 md:flex-col">
                                    {onPrint && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onPrint(appointment);
                                        }}
                                        title="Imprimir"
                                      >
                                        <Printer className="h-4 w-4" />
                                      </Button>
                                    )}

                                    {onCheckout && (appointment.status === "scheduled" || appointment.status === "confirmed") && canEdit && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onCheckout(appointment);
                                        }}
                                        title="Finalizar"
                                      >
                                        <DollarSign className="h-4 w-4 text-green-600" />
                                      </Button>
                                    )}

                                    {onEdit && canEdit && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onEdit(appointment);
                                        }}
                                        title="Editar"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    )}

                                    {onDelete && canDelete && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onDelete(appointment.id);
                                        }}
                                        title="Excluir"
                                      >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>

      <Dialog
        open={multiProfDialog.open}
        onOpenChange={(open) => !open && setMultiProfDialog(EMPTY_MULTI_PROF_DIALOG)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Agendamento com múltiplos profissionais
            </DialogTitle>
            <DialogDescription>
              Este agendamento possui serviços atribuídos a mais de um profissional.
              <br />
              Por padrão, ao mover, <b>todo o agendamento</b> será realocado para {multiProfDialog.targetProfessionalName}.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setMultiProfDialog(EMPTY_MULTI_PROF_DIALOG)}
            >
              Cancelar
            </Button>

            {onReassignProfessionalScoped && multiProfDialog.sourceProfessionalId != null && (
              <Button
                variant="secondary"
                onClick={() => {
                  const apt = appointments.find((a) => Number(a.id) === Number(multiProfDialog.appointmentId));
                  if (!apt) return;

                  setMultiProfDialog(EMPTY_MULTI_PROF_DIALOG);

                  tryReassign({
                    appointment: apt,
                    targetProfessionalId: multiProfDialog.targetProfessionalId,
                    targetProfessionalName: multiProfDialog.targetProfessionalName,
                    scope: { type: "only_professional", professionalId: multiProfDialog.sourceProfessionalId },
                  });

                  setDragSourceProfessionalId(null);
                  setDraggedAppointment(null);
                }}
              >
                Mover só deste profissional
              </Button>
            )}

            <Button
              onClick={() => {
                const apt = appointments.find((a) => Number(a.id) === Number(multiProfDialog.appointmentId));
                if (!apt) return;

                setMultiProfDialog(EMPTY_MULTI_PROF_DIALOG);

                tryReassign({
                  appointment: apt,
                  targetProfessionalId: multiProfDialog.targetProfessionalId,
                  targetProfessionalName: multiProfDialog.targetProfessionalName,
                  scope: { type: "all" },
                });

                setDraggedAppointment(null);
                setDragSourceProfessionalId(null);
              }}
            >
              Mover tudo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={reassignDialog.open}
        onOpenChange={(open) =>
          !open &&
          setReassignDialog({
            open: false,
            reason: "busy",
            message: "",
            appointmentId: 0,
            targetProfessionalId: 0,
            targetProfessionalName: "",
            availableSlots: [],
          })
        }
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className={cn(
                "h-5 w-5",
                reassignDialog.reason === "status_locked" ? "text-slate-500" :
                reassignDialog.reason === "no_schedule" ? "text-amber-500" :
                "text-destructive"
              )} />
              {reassignDialog.reason === "status_locked"
                ? "Movimentação bloqueada"
                : reassignDialog.reason === "no_schedule"
                  ? "Sem escala"
                  : reassignDialog.reason === "lunch"
                    ? "Intervalo"
                    : reassignDialog.reason === "outside_hours"
                      ? "Fora do expediente"
                      : reassignDialog.reason === "does_not_fit"
                        ? "Não cabe na agenda"
                        : reassignDialog.reason === "invalid_time"
                          ? "Horário inválido"
                          : "Conflito de horário"}
            </DialogTitle>

            <DialogDescription>
              {reassignDialog.message ||
                (reassignDialog.targetProfessionalName
                  ? `${reassignDialog.targetProfessionalName} não está disponível para esta ação.`
                  : "Não foi possível concluir esta ação.")}
            </DialogDescription>
          </DialogHeader>

          {reassignDialog.availableSlots.length > 0 && onQuickTimeChange ? (
            <div className="py-4">
              <ScrollArea className="h-48">
                <div className="grid grid-cols-3 gap-2">
                  {reassignDialog.availableSlots.map((slot) => (
                    <Button
                      key={slot}
                      variant="outline"
                      size="sm"
                      onClick={() => handleReassignDialogTimeSelect(slot)}
                    >
                      {slot}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setReassignDialog({
                  open: false,
                  reason: "busy",
                  message: "",
                  appointmentId: 0,
                  targetProfessionalId: 0,
                  targetProfessionalName: "",
                  availableSlots: [],
                })
              }
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
