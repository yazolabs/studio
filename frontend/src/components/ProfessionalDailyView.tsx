import React, { useMemo, useState } from "react";
import { format, isToday, addDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, User, Scissors, Phone, DollarSign, Edit, Trash2, Printer, ChevronDown, ChevronUp, Calendar, Users, ChevronLeft, ChevronRight, GripVertical, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
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
  onQuickTimeChange?: (appointmentId: number, newTime: string, onConflict: (availableSlots: string[]) => void) => void;
  onReassignProfessional?: (appointmentId: number, newProfessionalId: number, onConflict: () => void) => void;
  canEdit?: boolean;
  canDelete?: boolean;
};

const statusOptions: Appointment["status"][] = [
  "scheduled",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
  "rescheduled",
];

const getStatusVariant = (status: Appointment["status"]) => {
  switch (status) {
    case "scheduled":
      return "secondary";
    case "confirmed":
      return "default";
    case "completed":
      return "outline";
    case "cancelled":
      return "destructive";
    case "no_show":
      return "outline";
    case "rescheduled":
      return "secondary";
    default:
      return "secondary";
  }
};

const getStatusLabel = (status: Appointment["status"]) => {
  switch (status) {
    case "scheduled":
      return "Agendado";
    case "confirmed":
      return "Confirmado";
    case "completed":
      return "Concluído";
    case "cancelled":
      return "Cancelado";
    case "no_show":
      return "No-show";
    case "rescheduled":
      return "Reagendado";
    default:
      return status;
  }
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

  const crosses = startMin < lunchStartMin && endMin > lunchStartMin;
  return crosses ? endMin + (lunchEndMin - lunchStartMin) : endMin;
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
  onReassignProfessional,
  canEdit = true,
  canDelete = true,
}: Props) {
  const [expandedProfessionals, setExpandedProfessionals] = useState<Set<string>>(new Set());
  const [draggedAppointment, setDraggedAppointment] = useState<Appointment | null>(null);
  const [dragOverProfessional, setDragOverProfessional] = useState<string | null>(null);

  const [timeConflictDialog, setTimeConflictDialog] = useState<{
    open: boolean;
    appointmentId: number;
    availableSlots: string[];
  }>({ open: false, appointmentId: 0, availableSlots: [] });

  const [professionalConflictDialog, setProfessionalConflictDialog] = useState<{
    open: boolean;
    appointmentId: number;
    targetProfessionalId: number;
    targetProfessionalName: string;
    availableSlots: string[];
  }>({ open: false, appointmentId: 0, targetProfessionalId: 0, targetProfessionalName: "", availableSlots: [] });

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
            const sStart = timeStringToMinutes(s.starts_at) ?? timeStringToMinutes(apt.start_time);

            let sEnd = timeStringToMinutes(s.ends_at);

            if (sStart != null && (sEnd == null || sEnd <= sStart)) {
              const durReal = Number(s.duration ?? 0) || Number(apt.duration ?? 0) || appointmentDuration(apt) || 30;
              sEnd = toBusyEnd(sStart, durReal);
            }

            if (sStart != null && sEnd != null && sEnd > sStart) {
              intervals.push({ start: sStart, end: sEnd });
            }
          });

          return intervals;
        }

        const start = timeStringToMinutes(apt.start_time);
        const dur = appointmentDuration(apt);
        if (start != null && dur > 0) {
          const end = workWindow ? toBusyEnd(start, dur) : start + dur;
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

    const totalAppointments = profAppointments.length;
    const completed = profAppointments.filter((a) => a.status === "completed").length;
    const pending = profAppointments.filter((a) => a.status === "scheduled" || a.status === "confirmed").length;
    const cancelled = profAppointments.filter((a) => a.status === "cancelled").length;

    const totalRevenue = profAppointments
      .filter((a) => a.status !== "cancelled")
      .reduce((sum, a) => sum + appointmentPrice(a), 0);

    const occupiedMinutes = profAppointments
      .filter((a) => a.status !== "cancelled")
      .reduce((sum, a) => sum + appointmentDuration(a), 0);

    const workDayMinutes = 600;
    const occupationPercentage = Math.min(Math.round((occupiedMinutes / workDayMinutes) * 100), 100);

    return { totalAppointments, completed, pending, cancelled, totalRevenue, occupiedMinutes, occupationPercentage };
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

  const handleDragStart = (e: React.DragEvent, appointment: Appointment) => {
    if (!canEdit || !onReassignProfessional) return;
    setDraggedAppointment(appointment);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(appointment.id));
  };

  const handleDragEnd = () => {
    setDraggedAppointment(null);
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
      return;
    }

    const targetProfName =
      professionals.find((p) => Number(p.id) === targetProfessionalId)?.name ?? "";

    const durationMin = appointmentDuration(draggedAppointment);
    const workWindow = getWorkWindowForProfessionalOnDate(professionals, targetProfessionalId, selectedDate);

    if (!workWindow) {
      setProfessionalConflictDialog({
        open: true,
        appointmentId: draggedAppointment.id,
        targetProfessionalId,
        targetProfessionalName: targetProfName,
        availableSlots: [],
      });
      setDraggedAppointment(null);
      return;
    }

    const startMin = timeStringToMinutes(draggedAppointment.start_time);
    const busy = getBusyIntervalsForProfessional(targetProfessionalId, draggedAppointment.id);

    const ok = (() => {
      if (startMin == null) return false;

      if (
        workWindow.lunchStartMin != null &&
        workWindow.lunchEndMin != null &&
        startMin >= workWindow.lunchStartMin &&
        startMin < workWindow.lunchEndMin
      ) {
        return false;
      }

      if (startMin < workWindow.dayStartMin) return false;
      if (startMin >= workWindow.dayEndMin) return false;

      const paperDur = normalizeDurationForPaper(durationMin || 30);
      const rawEnd = startMin + paperDur;
      const end = applyLunchBreakIfCrosses(
        startMin,
        rawEnd,
        workWindow.lunchStartMin ?? null,
        workWindow.lunchEndMin ?? null
      );

      const interval = { start: startMin, end };
      return !busy.some((b) => overlaps(interval, b));
    })();

    const availableSlots = getAvailableSlotsForProfessional(
      targetProfessionalId,
      durationMin,
      draggedAppointment.id
    );

    if (!ok) {
      setProfessionalConflictDialog({
        open: true,
        appointmentId: draggedAppointment.id,
        targetProfessionalId,
        targetProfessionalName: targetProfName,
        availableSlots,
      });
      setDraggedAppointment(null);
      return;
    }

    onReassignProfessional(draggedAppointment.id, targetProfessionalId, () => {
      setProfessionalConflictDialog({
        open: true,
        appointmentId: draggedAppointment.id,
        targetProfessionalId,
        targetProfessionalName: targetProfName,
        availableSlots,
      });
    });

    setDraggedAppointment(null);
  };

  const handleProfessionalConflictTimeSelect = (newTime: string) => {
    if (!onQuickTimeChange) return;

    onQuickTimeChange(
      professionalConflictDialog.appointmentId,
      newTime,
      () => {}
    );

    if (onReassignProfessional) {
      setTimeout(() => {
        onReassignProfessional(
          professionalConflictDialog.appointmentId,
          professionalConflictDialog.targetProfessionalId,
          () => {}
        );
      }, 100);
    }

    setProfessionalConflictDialog({
      open: false,
      appointmentId: 0,
      targetProfessionalId: 0,
      targetProfessionalName: "",
      availableSlots: [],
    });
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
                          <p className="text-xs text-muted-foreground">{stats.occupationPercentage}% ocupado</p>
                        </div>

                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      <Progress value={stats.occupationPercentage} className="h-2" />
                      <div className="flex gap-2 flex-wrap">
                        {stats.pending > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {stats.pending} pendente{stats.pending !== 1 ? "s" : ""}
                          </Badge>
                        )}
                        {stats.completed > 0 && (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                            {stats.completed} concluído{stats.completed !== 1 ? "s" : ""}
                          </Badge>
                        )}
                        {stats.cancelled > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {stats.cancelled} cancelado{stats.cancelled !== 1 ? "s" : ""}
                          </Badge>
                        )}
                        {stats.totalAppointments === 0 && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            Sem agendamentos
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <Separator />
                  <div className="p-4">
                    {profAppointments.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p>Nenhum agendamento para hoje</p>
                      </div>
                    ) : (
                      <ScrollArea className="max-h-[400px]">
                        <div className="space-y-3">
                          {profAppointments.map((appointment) => {
                            const time = toHHmm(appointment.start_time);
                            const dur = appointmentDuration(appointment);
                            const price = appointmentPrice(appointment);
                            const service = servicesLabel(appointment);
                            const phone = customerPhone(appointment);

                            return (
                              <Card
                                key={appointment.id}
                                draggable={canEdit && !!onReassignProfessional}
                                onDragStart={(e) => handleDragStart(e, appointment)}
                                onDragEnd={handleDragEnd}
                                className={cn(
                                  "p-4 border-l-4 transition-all hover:shadow-md",
                                  canEdit && onReassignProfessional && "cursor-grab active:cursor-grabbing",
                                  appointment.status === "completed" && "border-l-green-500 bg-green-50/50 dark:bg-green-900/10",
                                  appointment.status === "confirmed" && "border-l-primary bg-primary/5",
                                  appointment.status === "scheduled" && "border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10",
                                  appointment.status === "cancelled" && "border-l-destructive bg-destructive/5 opacity-60"
                                )}
                              >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                  <div className="flex-1 space-y-2">
                                    <div className="flex items-center justify-between md:justify-start gap-3">
                                      <div className="flex items-center gap-2">
                                        {canEdit && onReassignProfessional && (
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
                                            <Badge variant={getStatusVariant(appointment.status)} className="cursor-pointer">
                                              {getStatusLabel(appointment.status)}
                                            </Badge>
                                          </SelectTrigger>
                                          <SelectContent>
                                            {statusOptions.map((status) => (
                                              <SelectItem key={status} value={status}>
                                                <Badge variant={getStatusVariant(status)}>{getStatusLabel(status)}</Badge>
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      ) : (
                                        <Badge variant={getStatusVariant(appointment.status)}>
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
        open={timeConflictDialog.open}
        onOpenChange={(open) => !open && setTimeConflictDialog({ open: false, appointmentId: 0, availableSlots: [] })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Horário Ocupado
            </DialogTitle>
            <DialogDescription>
              O horário selecionado está ocupado. Escolha um dos horários disponíveis abaixo:
            </DialogDescription>
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
              <p className="text-center text-muted-foreground py-4">
                Nenhum horário disponível para este dia.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTimeConflictDialog({ open: false, appointmentId: 0, availableSlots: [] })}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={professionalConflictDialog.open}
        onOpenChange={(open) =>
          !open &&
          setProfessionalConflictDialog({
            open: false,
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
              <AlertCircle className="h-5 w-5 text-destructive" />
              Conflito de Horário
            </DialogTitle>
            <DialogDescription>
              {professionalConflictDialog.targetProfessionalName} já possui um agendamento neste horário.
              Escolha um horário disponível para mover o agendamento:
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {professionalConflictDialog.availableSlots.length > 0 ? (
              <ScrollArea className="h-48">
                <div className="grid grid-cols-3 gap-2">
                  {professionalConflictDialog.availableSlots.map((slot) => (
                    <Button key={slot} variant="outline" size="sm" onClick={() => handleProfessionalConflictTimeSelect(slot)}>
                      {slot}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Nenhum horário disponível para este profissional hoje.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setProfessionalConflictDialog({
                  open: false,
                  appointmentId: 0,
                  targetProfessionalId: 0,
                  targetProfessionalName: "",
                  availableSlots: [],
                })
              }
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
