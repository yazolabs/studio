import React, { useMemo, useState } from "react";
import { format, isToday, addDays, subDays, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Clock,
  User,
  Scissors,
  Phone,
  DollarSign,
  Edit,
  Trash2,
  Printer,
  ChevronDown,
  ChevronUp,
  Calendar,
  Users,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  AlertCircle,
} from "lucide-react";
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
  const v = String(value).trim();
  if (!v) return null;

  if (/^\d{2}:\d{2}(:\d{2})?$/.test(v)) return v.slice(0, 5);

  if (v.includes("T")) {
    const d = parseISO(v);
    if (isValid(d)) return format(d, "HH:mm");
    return v.split("T")[1]?.slice(0, 5) ?? null;
  }

  if (v.includes(" ")) {
    const [datePart, timePart] = v.split(" ");
    if (datePart && timePart) {
      const isoLike = `${datePart}T${timePart}`;
      const d = parseISO(isoLike);
      if (isValid(d)) return format(d, "HH:mm");
      return timePart.slice(0, 5);
    }
  }

  return v.slice(0, 5);
};

const timeStringToMinutes = (value?: string | null): number | null => {
  const hhmm = extractHHmm(value);
  if (!hhmm) return null;

  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr);
  const m = Number(mStr);

  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;

  return h * 60 + m;
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

const moneyToNumber = (value: string | null | undefined): number => {
  if (!value) return 0;
  const normalized = String(value).replace(",", ".");
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
  const effectiveProfessionals = useMemo<Professional[]>(() => {
    const base = Array.isArray(professionals) ? professionals : [];
    if (base.length > 0) return base;

    const map = new Map<number, Professional>();
    const apts = Array.isArray(appointments) ? appointments : [];

    for (const apt of apts) {
      const aptAny: any = apt as any;

      const aptProfs = Array.isArray(aptAny?.professionals) ? aptAny.professionals : [];
      for (const p of aptProfs) {
        const pid = Number(p?.id);
        if (!Number.isFinite(pid) || pid <= 0) continue;
        const name = String(p?.name ?? "").trim() || `Profissional #${pid}`;
        if (!map.has(pid)) map.set(pid, { id: pid, name, work_schedule: null });
      }

      const svcs = Array.isArray(aptAny?.services) ? aptAny.services : [];
      for (const s of svcs) {
        const pid = Number(s?.professional_id ?? s?.professionalId ?? s?.pivot?.professional_id);
        if (!Number.isFinite(pid) || pid <= 0) continue;

        const name =
          String(s?.professional?.name ?? s?.professional_name ?? s?.professionalName ?? "").trim() ||
          String(aptProfs.find((p: any) => Number(p?.id) === pid)?.name ?? "").trim() ||
          `Profissional #${pid}`;

        if (!map.has(pid)) map.set(pid, { id: pid, name, work_schedule: null });
      }
    }

    const list = Array.from(map.values());
    list.sort((a, b) => String(a.name).localeCompare(String(b.name), "pt-BR"));
    return list;
  }, [professionals, appointments]);

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
    () => (appointments || []).filter((apt) => apt.date === dateStr),
    [appointments, dateStr]
  );

  const appointmentHasProfessional = (apt: Appointment, professionalId: number) => {
    const aptAny: any = apt as any;
    const svcs = Array.isArray(aptAny?.services) ? aptAny.services : [];
    const profs = Array.isArray(aptAny?.professionals) ? aptAny.professionals : [];

    const bySvc = svcs.some(
      (s: any) =>
        Number(s?.professional_id ?? s?.professionalId ?? s?.pivot?.professional_id) ===
        Number(professionalId)
    );
    const byRel = profs.some((p: any) => Number(p?.id) === Number(professionalId));

    return bySvc || byRel;
  };

  const customerPhone = (apt: Appointment) => (apt.customer as any)?.phone as string | undefined;

  const appointmentDuration = (apt: Appointment) => {
    const aptAny: any = apt as any;
    const services = Array.isArray(aptAny?.services) ? aptAny.services : [];
    const intervals: Array<{ start: number; end: number }> = [];

    services.forEach((s: any) => {
      const sStart = timeStringToMinutes(s?.starts_at) ?? timeStringToMinutes(apt.start_time);
      let sEnd = timeStringToMinutes(s?.ends_at);

      if (sStart != null && (sEnd == null || sEnd <= sStart)) {
        const sd = Number(s?.duration ?? 0);
        const d = sd > 0 ? sd : Number((apt as any).duration ?? 0) || 30;
        sEnd = sStart + d;
      }

      if (sStart != null && sEnd != null && sEnd > sStart) {
        intervals.push({ start: sStart, end: sEnd });
      }
    });

    if (intervals.length === 0) {
      const d = Number((apt as any).duration ?? 0);
      return d > 0 ? d : 30;
    }

    const minStart = Math.min(...intervals.map((i) => i.start));
    const maxEnd = Math.max(...intervals.map((i) => i.end));
    return Math.max(30, maxEnd - minStart);
  };

  const getServicesForProfessional = (apt: Appointment, professionalId: number) => {
    const aptAny: any = apt as any;
    const services: any[] = Array.isArray(aptAny?.services) ? aptAny.services : [];
    return services.filter(
      (s: any) =>
        Number(s?.professional_id ?? s?.professionalId ?? s?.pivot?.professional_id) ===
        Number(professionalId)
    );
  };

  const minutesToHHmmLocal = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const getServiceInterval = (apt: Appointment, s: any) => {
    const startMin = timeStringToMinutes(s?.starts_at) ?? timeStringToMinutes(apt.start_time);
    let endMin = timeStringToMinutes(s?.ends_at);

    if (startMin != null && (endMin == null || endMin <= startMin)) {
      const sd = Number(s?.duration ?? 0);
      const d = sd > 0 ? sd : Number((apt as any).duration ?? 0) || 30;
      endMin = startMin + d;
    }

    if (startMin == null || endMin == null || endMin <= startMin) return null;
    return { start: startMin, end: endMin };
  };

  const appointmentPrice = (apt: Appointment) => {
    const final = moneyToNumber((apt as any).final_price);
    if (final > 0) return final;
    return moneyToNumber((apt as any).total_price);
  };

  const getAppointmentSliceForProfessional = (apt: Appointment, professionalId: number) => {
    const svc = getServicesForProfessional(apt, professionalId);

    const servicesLabelForProf =
      svc.map((s) => s?.name).filter(Boolean).join(", ") || "Serviço";

    const intervals = svc
      .map((s) => getServiceInterval(apt, s))
      .filter(Boolean) as Array<{ start: number; end: number }>;

    const startMin =
      intervals.length > 0
        ? Math.min(...intervals.map((i) => i.start))
        : timeStringToMinutes((apt as any).start_time);

    const endMin =
      intervals.length > 0
        ? Math.max(...intervals.map((i) => i.end))
        : startMin != null
          ? startMin + (Number((apt as any).duration ?? 0) || 30)
          : null;

    const durationMin =
      startMin != null && endMin != null ? Math.max(30, endMin - startMin) : 30;

    const timeHHmm =
      startMin != null ? minutesToHHmmLocal(startMin) : (extractHHmm((apt as any).start_time) || "--:--");

    const profPrice = svc.reduce((sum: number, s: any) => {
      const v = moneyToNumber(String(s?.service_price ?? s?.price ?? "0"));
      return sum + (v || 0);
    }, 0);

    const price = profPrice > 0 ? profPrice : appointmentPrice(apt);

    return {
      startMin: startMin ?? 0,
      timeHHmm,
      durationMin,
      servicesLabelForProf,
      price,
    };
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
        const aptAny: any = apt as any;
        const services = Array.isArray(aptAny?.services) ? aptAny.services : [];

        const workWindow = getWorkWindowForProfessionalOnDate(effectiveProfessionals, pid, selectedDate);
        const svcForProf = services.filter(
          (s: any) => Number(s?.professional_id ?? s?.professionalId ?? s?.pivot?.professional_id) === pid
        );

        if (svcForProf.length > 0) {
          svcForProf.forEach((s: any) => {
            const sStart = timeStringToMinutes(s?.starts_at) ?? timeStringToMinutes((apt as any).start_time);
            let rawEnd = timeStringToMinutes(s?.ends_at);

            if (sStart != null && (rawEnd == null || rawEnd <= sStart)) {
              const durReal =
                Number(s?.duration ?? 0) ||
                Number((apt as any).duration ?? 0) ||
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

        const start = timeStringToMinutes((apt as any).start_time);
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

  const getProfessionalAppointments = (professionalId: number) => {
    return dayAppointments
      .filter((apt) => appointmentHasProfessional(apt, professionalId))
      .sort((a, b) => {
        const aStart = getAppointmentSliceForProfessional(a, professionalId).startMin;
        const bStart = getAppointmentSliceForProfessional(b, professionalId).startMin;
        return aStart - bStart;
      });
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
    const occupationPercentage = Math.min(Math.round((occupiedMinutes / workDayMinutes) * 100), 100);

    return {
      totalAppointments,
      scheduledCount,
      confirmedCount,
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

  const getSlotsStatusForProfessional = (
    professionalId: number,
    durationMin: number,
    excludeAppointmentId?: number
  ) => {
    const workWindow = getWorkWindowForProfessionalOnDate(
      effectiveProfessionals,
      professionalId,
      selectedDate
    );
    if (!workWindow) return [];

    const busy = getBusyIntervalsForProfessional(professionalId, excludeAppointmentId);
    const paperDur = normalizeDurationForPaper(durationMin || 30);

    const baseSlots = buildSlotsBetween(workWindow.dayStartMin, workWindow.dayEndMin, PAPER_STEP_MIN).filter((hhmm) => {
      const t = hhmmToMinutes(hhmm);
      if (t == null) return false;

      if (workWindow.lunchStartMin != null && workWindow.lunchEndMin != null && t >= workWindow.lunchStartMin && t < workWindow.lunchEndMin) {
        return false;
      }

      if (t >= workWindow.dayEndMin) return false;
      return true;
    });

    return baseSlots.map((hhmm) => {
      const start = hhmmToMinutes(hhmm);
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

  const handleTimeSelect = (appointmentId: number, newTime: string) => {
    if (!onQuickTimeChange) return;

    onQuickTimeChange(appointmentId, newTime, (availableSlots) => {
      setTimeConflictDialog({ open: true, appointmentId, availableSlots });
    });
  };

  const handleConflictTimeSelect = (newTime: string) => {
    if (!onQuickTimeChange) return;

    onQuickTimeChange(timeConflictDialog.appointmentId, newTime, () => {});
    setTimeConflictDialog({ open: false, appointmentId: 0, availableSlots: [] });
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

    setDraggedAppointment(null);
    setDragSourceProfessionalId(null);
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

  const pluralize = (n: number, singular: string, plural: string) => (n === 1 ? singular : plural);

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
              {effectiveProfessionals.length} profissiona{effectiveProfessionals.length !== 1 ? "is" : "l"}
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
        {effectiveProfessionals.map((professional) => {
          const profId = Number(professional.id);
          const stats = getProfessionalStats(profId);
          const profAppointments = getProfessionalAppointments(profId);
          const isExpanded = expandedProfessionals.has(String(professional.id));
          const isDragOver = dragOverProfessional === String(professional.id);

          const shouldInnerScroll = profAppointments.length >= 3;

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
                  isDragOver && "ring-2 ring-primary ring-offset-2 bg-primary/5",
                  isExpanded && "overflow-hidden"
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
                            {stats.totalAppointments} atendimento{stats.totalAppointments !== 1 ? "s" : ""} hoje
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
                      (shouldInnerScroll ? (
                        <ScrollArea className="h-[420px] md:h-[520px] lg:h-[560px] pr-4">
                          <div className="space-y-3">
                            {profAppointments.map((appointment) => {
                              const slice = getAppointmentSliceForProfessional(appointment, profId);

                              const time = slice.timeHHmm;
                              const dur = slice.durationMin;
                              const price = slice.price;
                              const service = slice.servicesLabelForProf;
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

                                          <Badge
                                            variant="outline"
                                            className="h-5 px-1.5 py-0 text-[12px] font-medium text-muted-foreground border-muted/60 bg-transparent"
                                            title={`Agendamento #${appointment.id}`}
                                          >
                                            #{appointment.id}
                                          </Badge>

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
                                          <Badge
                                            variant="outline"
                                            className={getStatusBadgeClass(appointment.status, "cursor-pointer")}
                                          >
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

                                      {onCheckout &&
                                        (appointment.status === "scheduled" || appointment.status === "confirmed") &&
                                        canEdit && (
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
                      ) : (
                        <div className="space-y-3">
                          {profAppointments.map((appointment) => {
                            const slice = getAppointmentSliceForProfessional(appointment, profId);

                            const time = slice.timeHHmm;
                            const dur = slice.durationMin;
                            const price = slice.price;
                            const service = slice.servicesLabelForProf;
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
                                    <div className="flex items-center gap-2">
                                      {canDrag && (
                                        <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                                      )}

                                      <Badge
                                        variant="outline"
                                        className="h-5 px-1.5 py-0 text-[12px] font-medium text-muted-foreground border-muted/60 bg-transparent"
                                        title={`Agendamento #${appointment.id}`}
                                      >
                                        #{appointment.id}
                                      </Badge>

                                      <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-primary" />
                                        <span className="font-bold text-lg">{time || "--:--"}</span>
                                      </div>

                                      <Badge
                                        variant="outline"
                                        className={getStatusBadgeClass(appointment.status, "cursor-pointer")}
                                      >
                                        {getStatusLabel(appointment.status)}
                                      </Badge>
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
                      ))
                    )}
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>

      {/* dialogs (mantive como no seu arquivo original) */}
      <Dialog open={timeConflictDialog.open} onOpenChange={(open) => !open && setTimeConflictDialog({ open: false, appointmentId: 0, availableSlots: [] })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Conflito de horário
            </DialogTitle>
            <DialogDescription>Esse horário gerou conflito. Escolha outro horário disponível:</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {timeConflictDialog.availableSlots.length > 0 ? (
              <ScrollArea className="h-48">
                <div className="grid grid-cols-3 gap-2">
                  {timeConflictDialog.availableSlots.map((slot) => (
                    <Button key={slot} variant="outline" size="sm" onClick={() => handleConflictTimeSelect(slot)}>
                      {slot}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum horário sugerido. Verifique a agenda do profissional.</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTimeConflictDialog({ open: false, appointmentId: 0, availableSlots: [] })}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={multiProfDialog.open} onOpenChange={(open) => !open && setMultiProfDialog(EMPTY_MULTI_PROF_DIALOG)}>
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
            <Button variant="outline" onClick={() => setMultiProfDialog(EMPTY_MULTI_PROF_DIALOG)}>
              Cancelar
            </Button>
            <Button onClick={() => setMultiProfDialog(EMPTY_MULTI_PROF_DIALOG)}>Mover tudo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reassignDialog.open} onOpenChange={(open) => !open && setReassignDialog({ open: false, reason: "busy", message: "", appointmentId: 0, targetProfessionalId: 0, targetProfessionalName: "", availableSlots: [] })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className={cn("h-5 w-5", reassignDialog.reason === "status_locked" ? "text-slate-500" : reassignDialog.reason === "no_schedule" ? "text-amber-500" : "text-destructive")} />
              Conflito / Bloqueio
            </DialogTitle>
            <DialogDescription>{reassignDialog.message || "Não foi possível concluir esta ação."}</DialogDescription>
          </DialogHeader>

          {reassignDialog.availableSlots.length > 0 && onQuickTimeChange ? (
            <div className="py-4">
              <ScrollArea className="h-48">
                <div className="grid grid-cols-3 gap-2">
                  {reassignDialog.availableSlots.map((slot) => (
                    <Button key={slot} variant="outline" size="sm" onClick={() => onQuickTimeChange?.(reassignDialog.appointmentId, slot, () => {})}>
                      {slot}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReassignDialog({ open: false, reason: "busy", message: "", appointmentId: 0, targetProfessionalId: 0, targetProfessionalName: "", availableSlots: [] })}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
