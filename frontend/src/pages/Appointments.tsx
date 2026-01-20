import { AppointmentCheckoutDialog } from "@/components/AppointmentCheckoutDialog";
import { Combobox } from "@/components/Combobox";
import { CompactAppointmentList } from "@/components/CompactAppointmentList";
import { DataTable } from "@/components/DataTable";
import { MonthlyAvailabilityCalendar } from "@/components/MonthlyAvailabilityCalendar";
import { ProfessionalDailyView } from "@/components/ProfessionalDailyView";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select,  SelectContent,  SelectItem,  SelectTrigger,  SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAppointmentsQuery, useCreateAppointment, useDeleteAppointment, useAppointmentQuery } from "@/hooks/appointments";
import { useCustomersQuery } from "@/hooks/customers";
import { useProfessionalsQuery } from "@/hooks/professionals";
import { usePromotionsQuery } from "@/hooks/promotions";
import { useServicesQuery } from "@/hooks/services";
import { usePermission } from "@/hooks/usePermission";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ProfessionalOpenWindow } from "@/types/professional-open-window";
import { Promotion } from "@/types/promotion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Pencil, Trash2, DollarSign, Calendar as CalendarIcon, Printer, Table, List, Check, X, Filter, ChevronDown, ChevronUp, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Appointment as AppointmentBackend } from "@/types/appointment";
import { PAPER_STEP_MIN, isLongFlexibleService, buildSlotsBetween, overlaps, minutesToHHmm, normalizeDurationForPaper, buildPaperSlotsForDay } from "@/lib/scheduling/paperSlots";
import { getStatusBadgeClass, getStatusLabel } from "@/lib/appointments/statusUI";

type ID = number | string;

type LegacyAppointment = {
  id: string;
  client: string;
  clientPhone?: string;
  service: string;
  professionals: string[];
  date: string;
  time: string;
  duration?: number;
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show" | "rescheduled";
  payment_status: "unpaid" | "prepaid" | "paid";
  notes?: string;
  price?: number;
};

type LegacyProfessional = {
  id: string;
  name: string;
};

interface Customer {
  id: ID;
  name: string;
  phone?: string | null;
}

type WorkScheduleEntry = {
  day: string;
  startTime: string;
  endTime: string;
  lunchStart?: string | null;
  lunchEnd?: string | null;
  isDayOff?: boolean;
  isWorkingDay?: boolean;
};

interface Professional {
  id: ID;
  name: string;
  open_windows?: ProfessionalOpenWindow[];
  work_schedule?: WorkScheduleEntry[] | null;
}

interface Service {
  id: ID;
  name: string;
  price: number;
  duration: number;
  commission_type: string;
  commission_value: number;
}

interface AppointmentLegacy {
  id: string;
  client: string;
  clientPhone?: string;
  service: string;
  professionals: string[];
  date: string;
  time: string;
  duration?: number;
  status: AppointmentBackend["status"];
  payment_status: AppointmentBackend["payment_status"];
  notes?: string;
  price?: number;
}

const WEEKDAY_LABELS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

type TimeSlotWithStatus = {
  time: string;
  isFree: boolean;
  reason?: "busy" | "lunch" | "outside-working-hours";
  overtime?: boolean;
};

const getWeekdayLabel = (date: Date) => WEEKDAY_LABELS[date.getDay()];

const extractTimePart = (value?: string | null): string | null => {
  if (!value) return null;
  const v = value.trim();
  if (v.includes("T")) {
    return v.split("T")[1].slice(0, 8);
  }
  if (v.includes(" ")) {
    return v.split(" ")[1].slice(0, 8);
  }
  return v.slice(0, 8);
};

const timeStringToMinutes = (value?: string | null): number | null => {
  const timePart = extractTimePart(value);
  if (!timePart) return null;
  const [hStr, mStr] = timePart.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
};

const appointmentSchema = z.object({
  customer_id: z.union([z.number(), z.string()]).pipe(z.coerce.number()),
  services: z
    .array(
      z.object({
        service_id: z.union([z.number(), z.string()]).pipe(z.coerce.number()),
        professional_id: z
          .union([z.number(), z.string()])
          .pipe(z.coerce.number()),
        start_time: z
          .string()
          .min(1, "Horário é obrigatório para cada serviço"),
        commission_type: z.string().optional(),
        commission_value: z.string().optional(),
      })
    )
    .min(1, "Selecione ao menos um serviço, profissional e horário"),
  date: z.date({ required_error: "Data é obrigatória" }),
  status: z.enum([
    "scheduled",
    "confirmed",
    "completed",
    "cancelled",
    "no_show",
    "rescheduled",
  ]),
  payment_status: z.enum(["unpaid", "prepaid", "paid"]).default("unpaid"),
  promotion_id: z
    .union([z.number(), z.string()])
    .optional()
    .nullable()
    .transform((val) => (val == null || val === "" ? null : Number(val))),
  notes: z.string().trim().max(500, "Observações muito longas").optional(),
});

type FormValues = z.infer<typeof appointmentSchema>;

type MultiSelectOption = { value: ID; label: string };

function MultiSelect({
  value,
  onChange,
  options,
  placeholder,
  emptyLabel = "Nada encontrado",
  searchPlaceholder = "Buscar...",
} : {
  value: ID[];
  onChange: (next: ID[]) => void;
  options: MultiSelectOption[];
  placeholder: string;
  emptyLabel?: string;
  searchPlaceholder?: string;
}) {
  const [open, setOpen] = useState(false);

  const selectedMap = useMemo(() => {
    const map = new Map<ID, string>();
    options.forEach((opt) => {
      if (value.some((v) => String(v) === String(opt.value))) {
        map.set(opt.value, opt.label);
      }
    });
    return map;
  }, [value, options]);

  const toggle = (val: ID) => {
    const exists = value.some((v) => String(v) === String(val));
    if (exists) {
      onChange(value.filter((v) => String(v) !== String(val)));
    } else {
      onChange([...value, val]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <div className="flex flex-wrap gap-2 items-center">
            {value.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              Array.from(selectedMap.entries()).map(([val, label]) => (
                <Badge key={String(val)} variant="secondary" className="mr-1">
                  {label}
                </Badge>
              ))
            )}
          </div>
          <span className="ml-2 text-muted-foreground">▼</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[--radix-popover-trigger-width] max-w-[calc(100vw-2rem)]">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const isSelected = value.some(
                  (v) => String(v) === String(opt.value)
                );
                return (
                  <CommandItem
                    key={String(opt.value)}
                    value={String(opt.label)}
                    onSelect={() => toggle(opt.value)}
                    className="flex items-center justify-between"
                  >
                    <span>{opt.label}</span>
                    {isSelected ? (
                      <Check className="h-4 w-4 opacity-100" />
                    ) : (
                      <X className="h-4 w-4 opacity-30" />
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

type SingleSelectOption = { value: ID; label: string };

function FilterCombobox({
  value,
  onChange,
  options,
  placeholder,
  allLabel = "Todos",
}: {
  value: ID | "all";
  onChange: (value: ID | "all") => void;
  options: SingleSelectOption[];
  placeholder: string;
  allLabel?: string;
}) {
  const [open, setOpen] = useState(false);

  const selectedLabel =
    value === "all"
      ? allLabel
      : options.find((opt) => String(opt.value) === String(value))?.label;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full min-w-0 justify-between"
        >
          <span className="truncate">{selectedLabel ?? placeholder}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[--radix-popover-trigger-width] max-w-[calc(100vw-2rem)]">
        <Command>
          <CommandInput
            placeholder={`Buscar ${placeholder.toLowerCase()}...`}
            className="h-8 text-xs"
          />
          <CommandList>
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all"
                onSelect={() => {
                  onChange("all");
                  setOpen(false);
                }}
              >
                <span>{allLabel}</span>
                {value === "all" && (
                  <Check className="ml-auto h-4 w-4 opacity-100" />
                )}
              </CommandItem>

              {options.map((opt) => {
                const isSelected =
                  value !== "all" &&
                  String(value) === String(opt.value);

                return (
                  <CommandItem
                    key={String(opt.value)}
                    value={String(opt.label)}
                    onSelect={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between"
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && (
                      <Check className="h-4 w-4 opacity-100" />
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function Appointments() {
  const { can } = usePermission();
  const isMobile = useIsMobile();

  const {
    data: appointmentsResp,
    refetch: refetchAppointments,
  } = useAppointmentsQuery({
    page: 1,
    perPage: 50,
  });
  const { data: customersResp } = useCustomersQuery();
  const { data: professionalsResp } = useProfessionalsQuery();
  const { data: servicesResp } = useServicesQuery();
  const { data: promotionsResp } = usePromotionsQuery();

  const createAppointment = useCreateAppointment();
  const deleteAppointment = useDeleteAppointment();

  const [checkoutAppointmentId, setCheckoutAppointmentId] = useState<number | null>(null);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<AppointmentBackend | null>(null);
  const [deletingAppointmentId, setDeletingAppointmentId] = useState<ID | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "calendar" | "list" | "professional">(() => {
    if (typeof window === "undefined") {
      return "table";
    }

    const stored = window.localStorage.getItem("appointments_view_mode");

    if (stored === "table" || stored === "calendar" || stored === "list" || stored === "professional") {
      return stored;
    }

    return "table";
  });
  const [statusFilter, setStatusFilter] = useState<"all" | AppointmentBackend["status"]>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<"all" | AppointmentBackend["payment_status"]>("all");
  const [customerFilter, setCustomerFilter] = useState<ID | "all">("all");
  const [professionalFilter, setProfessionalFilter] = useState<ID | "all">("all");
  const [serviceFilter, setServiceFilter] = useState<ID | "all">("all");
  const [dateFromFilter, setDateFromFilter] = useState<Date | null>(null);
  const [dateToFilter, setDateToFilter] = useState<Date | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false);
  const [professionalViewDate, setProfessionalViewDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      customer_id: undefined as unknown as number,
      services: [],
      status: "scheduled",
      payment_status: "unpaid",
      promotion_id: null,
      notes: "",
    },
  });

  const watchedServices = form.watch("services") || [];
  const watchedPaymentStatus = form.watch("payment_status");

  const appointments: AppointmentBackend[] = useMemo(() => {
    const maybe = (appointmentsResp as any)?.data ?? appointmentsResp ?? [];
    if (!Array.isArray(maybe)) return [];

    return maybe.map((apt: any) => ({
      ...apt,
      payment_status: apt.payment_status ?? "unpaid",
    }));
  }, [appointmentsResp]);
  const customers: Customer[] = useMemo(() => {
    const maybe = (customersResp as any)?.data ?? customersResp ?? [];
    return Array.isArray(maybe) ? maybe : [];
  }, [customersResp]);
  const professionals: Professional[] = useMemo(() => {
    const maybe = (professionalsResp as any)?.data ?? professionalsResp ?? [];
    return Array.isArray(maybe) ? maybe : [];
  }, [professionalsResp]);
  const services: Service[] = useMemo(() => {
    const maybe = (servicesResp as any)?.data ?? servicesResp ?? [];
    return Array.isArray(maybe) ? maybe : [];
  }, [servicesResp]);
  const promotions: Promotion[] = useMemo(() => {
    const maybe = (promotionsResp as any)?.data ?? promotionsResp ?? [];
    return Array.isArray(maybe) ? maybe : [];
  }, [promotionsResp]);
  const activePromotions = useMemo(() => {
    const today = new Date();

    return promotions.filter((promo) => {
      if (!promo.active) return false;

      const startDate = promo.start_date ? new Date(promo.start_date) : null;
      const endDate = promo.end_date ? new Date(promo.end_date) : null;

      if (startDate && today < startDate) return false;
      if (endDate && today > endDate) return false;

      return true;
    });
  }, [promotions]);
  const filteredAppointments = useMemo(() => {
    let list = [...appointments];

    if (dateFromFilter) {
      const fromStr = format(dateFromFilter, "yyyy-MM-dd");
      list = list.filter((apt) => apt.date >= fromStr);
    }

    if (dateToFilter) {
      const toStr = format(dateToFilter, "yyyy-MM-dd");
      list = list.filter((apt) => apt.date <= toStr);
    }

    if (statusFilter !== "all") {
      list = list.filter((apt) => apt.status === statusFilter);
    }

    if (paymentStatusFilter !== "all") {
      list = list.filter((apt) => apt.payment_status === paymentStatusFilter);
    }

    if (customerFilter !== "all") {
      list = list.filter(
        (apt) => String(apt.customer?.id ?? "") === String(customerFilter)
      );
    }

    if (professionalFilter !== "all") {
      list = list.filter((apt) => {
        const byProfArray = (apt.professionals || []).some(
          (p) => String(p.id) === String(professionalFilter)
        );
        const byPivot = (apt.services || []).some(
          (s) =>
            s.professional_id &&
            String(s.professional_id) === String(professionalFilter)
        );
        return byProfArray || byPivot;
      });
    }

    if (serviceFilter !== "all") {
      list = list.filter((apt) =>
        (apt.services || []).some(
          (s) => String(s.id) === String(serviceFilter)
        )
      );
    }

    return list;
  }, [
    appointments,
    dateFromFilter,
    dateToFilter,
    statusFilter,
    paymentStatusFilter,
    customerFilter,
    professionalFilter,
    serviceFilter,
  ]);
  const selectedProfessionalIds = useMemo<number[]>(() => {
    const ids = (watchedServices as Array<{ professional_id?: number | string | null }>)
      .map((s) =>
        s?.professional_id != null ? Number(s.professional_id) : NaN
      )
      .filter((n) => Number.isFinite(n)) as number[];

    return Array.from(new Set(ids));
  }, [watchedServices]);
  const professionalOpenWindowsById = useMemo(
    () =>
      new Map<number, ProfessionalOpenWindow[]>(
        professionals.map((p) => [
          Number(p.id),
          p.open_windows ?? [],
        ])
      ),
    [professionals]
  );
  const professionalWorkScheduleById = useMemo(
    () =>
      new Map<number, WorkScheduleEntry[]>(
        professionals.map((p) => {
          const raw = (p as any).work_schedule;
          const arr = Array.isArray(raw) ? (raw as WorkScheduleEntry[]) : [];
          return [Number(p.id), arr];
        })
      ),
    [professionals]
  );
  const customerById = useMemo(
    () => new Map(customers.map((c) => [Number(c.id), c])),
    [customers]
  );
  const professionalById = useMemo(
    () => new Map(professionals.map((p) => [Number(p.id), p])),
    [professionals]
  );
  const serviceById = useMemo(
    () => new Map(services.map((s) => [Number(s.id), s])),
    [services]
  );
  const selectedServiceObjects = useMemo(() => {
    const servicesField = form.watch("services") || [];
    return servicesField
      .map((s) => serviceById.get(Number(s.service_id)))
      .filter(Boolean) as Service[];
  }, [services, serviceById, form.watch("services")]);
  const totalDuration = useMemo(
    () =>
      selectedServiceObjects.reduce(
        (sum, s) => sum + Number(s.duration || 0),
        0
      ),
    [selectedServiceObjects]
  );
  const totalPrice = useMemo(
    () =>
      selectedServiceObjects.reduce((sum, s) => sum + Number(s.price || 0), 0),
    [selectedServiceObjects]
  );
  const professionalDayAppointments = useMemo(() => {
    const dateStr = format(professionalViewDate, "yyyy-MM-dd");
    return filteredAppointments.filter((a) => a.date === dateStr);
  }, [filteredAppointments, professionalViewDate]);

  const hasWindowsConfiguredForProfessional = (profIdNum: number) => {
    const all = professionalOpenWindowsById.get(profIdNum) ?? [];
    return all.length > 0;
  };

  const hasOpenWindowForDate = (profIdNum: number, dateStr: string) => {
    const all = professionalOpenWindowsById.get(profIdNum) ?? [];
    const open = all.filter((w) => w.status === "open");
    return open.some((w) => w.start_date <= dateStr && dateStr <= w.end_date);
  };

  const effectiveViewMode = isMobile && viewMode === "table" ? "list" : viewMode;

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("appointments_view_mode", viewMode);
    } catch {
    }
  }, [viewMode]);


  const hhmmToMinutes = (hhmm: string): number | null => {
    if (!hhmm) return null;
    const [hStr, mStr] = hhmm.split(":");
    const h = Number(hStr);
    const m = Number(mStr);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
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

    const crosses = startMin < lunchStartMin && endMin > lunchStartMin;

    return crosses ? endMin + (lunchEndMin - lunchStartMin) : endMin;
  };

  type ScheduleWindow = {
    dayStartMin: number;
    dayEndMin: number;
    lunchStartMin: number | null;
    lunchEndMin: number | null;
  };

  const getScheduleWindowForProfessional = (
    professionalId: ID,
    date: Date
  ): ScheduleWindow | null => {
    const profIdNum = Number(professionalId);
    const scheduleForProf = professionalWorkScheduleById.get(profIdNum);
    if (!scheduleForProf || scheduleForProf.length === 0) return null;

    const weekdayLabel = getWeekdayLabel(date);
    const daySchedule = scheduleForProf.find((d) => d.day === weekdayLabel);

    if (!daySchedule || daySchedule.isDayOff || daySchedule.isWorkingDay === false) {
      return null;
    }

    const dayStartMin = timeStringToMinutes(daySchedule.startTime);
    const dayEndMin = timeStringToMinutes(daySchedule.endTime);

    if (dayStartMin == null || dayEndMin == null || dayEndMin <= dayStartMin) return null;

    let lunchStartMin: number | null = null;
    let lunchEndMin: number | null = null;

    if (daySchedule.lunchStart) lunchStartMin = timeStringToMinutes(daySchedule.lunchStart) ?? null;
    if (daySchedule.lunchEnd) lunchEndMin = timeStringToMinutes(daySchedule.lunchEnd) ?? null;

    if (lunchStartMin != null && lunchEndMin != null && lunchEndMin <= lunchStartMin) {
      lunchStartMin = null;
      lunchEndMin = null;
    }

    return { dayStartMin, dayEndMin, lunchStartMin, lunchEndMin };
  };

  const isWithinLunch = (t: number, lunchStart: number | null, lunchEnd: number | null) => {
    if (lunchStart == null || lunchEnd == null) return false;
    return t >= lunchStart && t < lunchEnd;
  };

  const scheduleOk = () => ({ ok: true } as const);
  const scheduleFail = (reason: "lunch" | "outside-working-hours") =>
    ({ ok: false, reason } as const);

  type ScheduleCheck =
    | ReturnType<typeof scheduleOk>
    | ReturnType<typeof scheduleFail>;

  const validateIntervalInsideSchedule = (
    startMin: number,
    endMin: number,
    win: ScheduleWindow
  ): ScheduleCheck => {
    if (startMin < win.dayStartMin) return scheduleFail("outside-working-hours");
    if (startMin >= win.dayEndMin) return scheduleFail("outside-working-hours");

    if (isWithinLunch(startMin, win.lunchStartMin, win.lunchEndMin)) {
      return scheduleFail("lunch");
    }

    return scheduleOk();
  };


  const minutesToHHmmss = (minutes: number) => `${minutesToHHmm(minutes)}:00`;

  const shiftToDateTime = (dateStr: string, value: string | null | undefined, deltaMin: number) => {
    const baseMin = timeStringToMinutes(value);
    if (baseMin == null) return null;

    const next = baseMin + deltaMin;
    if (next < 0) return null;

    const hhmmss = minutesToHHmmss(next);
    return `${dateStr} ${hhmmss}`;
  };

  const computeAppointmentDurationMinutes = (apt: AppointmentBackend): number => {
    const dur = Number(apt.duration ?? 0);
    if (dur > 0) return dur;

    const services = Array.isArray(apt.services) ? apt.services : [];
    const intervals: Array<{ start: number; end: number }> = [];

    services.forEach((s) => {
      const sStart = timeStringToMinutes(s.starts_at) ?? timeStringToMinutes(apt.start_time);
      let sEnd = timeStringToMinutes(s.ends_at);

      if (sStart != null && (sEnd == null || sEnd <= sStart)) {
        const sd = Number((s as any).duration ?? 0);
        const d = sd > 0 ? sd : 30;
        sEnd = sStart + d;
      }

      if (sStart != null && sEnd != null && sEnd > sStart) intervals.push({ start: sStart, end: sEnd });
    });

    if (intervals.length === 0) return 30;

    const minStart = Math.min(...intervals.map((i) => i.start));
    const maxEnd = Math.max(...intervals.map((i) => i.end));
    return Math.max(30, maxEnd - minStart);
  };

  const getAppointmentIntervalsForProfessional = (
    apt: AppointmentBackend,
    professionalId: ID
  ): Array<{ start: number; end: number }> => {
    const pid = String(professionalId);
    const intervals: Array<{ start: number; end: number }> = [];

    const services = Array.isArray(apt.services) ? apt.services : [];
    const svcForProf = services.filter((s) => s.professional_id != null && String(s.professional_id) === pid);

    if (svcForProf.length > 0) {
      svcForProf.forEach((s) => {
        const start = timeStringToMinutes(s.starts_at) ?? timeStringToMinutes(apt.start_time);
        let end = timeStringToMinutes(s.ends_at);

        if (start != null && (end == null || end <= start)) {
          const sd = Number((s as any).duration ?? 0);
          const d = sd > 0 ? sd : Number(apt.duration ?? 0) || 30;
          end = start + d;
        }

        if (start != null && end != null && end > start) intervals.push({ start, end });
      });

      return intervals;
    }

    const hasProf = (apt.professionals || []).some((p) => String(p.id) === pid);
    if (!hasProf) return [];

    const start = timeStringToMinutes(apt.start_time);
    const dur = computeAppointmentDurationMinutes(apt);
    if (start != null) intervals.push({ start, end: start + dur });
    return intervals;
  };

  const hasConflictForProfessional = (
    professionalId: ID,
    dateStr: string,
    candidate: { start: number; end: number },
    excludeAppointmentId?: ID
  ) => {
    const pid = String(professionalId);

    const sameDay = appointments.filter((a) => a.date === dateStr);
    for (const other of sameDay) {
      if (excludeAppointmentId && String(other.id) === String(excludeAppointmentId)) continue;
      if (other.status === "cancelled" || other.status === "no_show") continue;

      const intervals = getAppointmentIntervalsForProfessional(other, pid);
      if (intervals.some((i) => candidate.start < i.end && candidate.end > i.start)) {
        return true;
      }
    }
    return false;
  };

  const buildAvailableSlotsForProfessional = (
    professionalId: ID,
    date: Date,
    appointmentDuration: number,
    excludeAppointmentId?: ID
  ): string[] => {
    const dateStr = format(date, "yyyy-MM-dd");
    const profIdNum = Number(professionalId);

    const windowsConfigured = hasWindowsConfiguredForProfessional(profIdNum);
    if (windowsConfigured && !hasOpenWindowForDate(profIdNum, dateStr)) {
      return [];
    }

    const scheduleForProf = professionalWorkScheduleById.get(profIdNum);
    if (!scheduleForProf || scheduleForProf.length === 0) {
      return [];
    }

    const weekdayLabel = getWeekdayLabel(date);
    const daySchedule = scheduleForProf.find((d) => d.day === weekdayLabel);

    if (!daySchedule || daySchedule.isDayOff || daySchedule.isWorkingDay === false) {
      return [];
    }

    const dayStartMin = timeStringToMinutes(daySchedule.startTime);
    const dayEndMin = timeStringToMinutes(daySchedule.endTime);

    if (dayStartMin == null || dayEndMin == null || dayEndMin <= dayStartMin) {
      return [];
    }

    let lunchStartMin: number | null = null;
    let lunchEndMin: number | null = null;

    if (daySchedule.lunchStart) lunchStartMin = timeStringToMinutes(daySchedule.lunchStart) ?? null;
    if (daySchedule.lunchEnd) lunchEndMin = timeStringToMinutes(daySchedule.lunchEnd) ?? null;

    if (lunchStartMin != null && lunchEndMin != null && lunchEndMin <= lunchStartMin) {
      lunchStartMin = null;
      lunchEndMin = null;
    }

    const baseSlots = buildSlotsBetween(dayStartMin, dayEndMin, PAPER_STEP_MIN)
    .filter((hhmm) => {
      const t = timeStringToMinutes(hhmm);
      if (t == null) return false;

      if (lunchStartMin != null && lunchEndMin != null && t >= lunchStartMin && t < lunchEndMin) {
        return false;
      }

      if (t >= dayEndMin) return false;
      return true;
    });

    const slots: string[] = [];
    const paperDur = normalizeDurationForPaper(appointmentDuration || 30);

    for (const hhmm of baseSlots) {
      const start = timeStringToMinutes(hhmm);
      if (start == null) continue;

      const rawEnd = start + paperDur;
      const end = applyLunchBreakIfCrosses(start, rawEnd, lunchStartMin, lunchEndMin);

      const conflict = hasConflictForProfessional(
        professionalId,
        dateStr,
        { start, end },
        excludeAppointmentId
      );

      if (!conflict) slots.push(hhmm);
    }

    return slots;
  };

  const buildServicesPayloadFromApt = (apt: AppointmentBackend) => {
    const services = Array.isArray(apt.services) ? apt.services : [];
    return services.map((s) => ({
      id: Number(s.id),
      service_price: String((s as any).service_price ?? "0"),
      commission_type: ((s as any).commission_type ?? null) as "percentage" | "fixed" | null,
      commission_value: String((s as any).commission_value ?? "0"),
      professional_id: s.professional_id != null ? Number(s.professional_id) : null,
      starts_at: s.starts_at ?? null,
      ends_at: s.ends_at ?? null,
    }));
  };

  type ReassignScope =
    | { type: "all" }
    | { type: "only_professional"; professionalId: number };

  const hhmmToHHmmss = (hhmm: string) => {
    const t = (hhmm || "").slice(0, 5);
    return `${t}:00`;
  };

  const toDateTime = (dateStr: string, hhmm: string) => `${dateStr} ${hhmmToHHmmss(hhmm)}`;

  const handleQuickStatusChange = (
    appointmentId: number,
    newStatus: AppointmentBackend["status"]
  ): void => {
    (async () => {
      const apt = appointments.find((a) => Number(a.id) === Number(appointmentId));
      if (!apt) return;

      try {
        const { updateAppointment: updateFn } = await import("@/services/appointmentsService");
        await updateFn(Number(apt.id), { status: newStatus });

        await refetchAppointments();
        toast({ title: "Status atualizado." });
      } catch (e: any) {
        console.error(e);
        toast({
          title: "Erro ao atualizar status",
          description: e?.message ?? "Tente novamente.",
          variant: "destructive",
        });
      }
    })();
  };

  const handleQuickTimeChange = (
    appointmentId: number,
    newTime: string,
    onConflict: (availableSlots: string[]) => void
  ): void => {
    (async () => {
      const apt = appointments.find((a) => Number(a.id) === Number(appointmentId));
      if (!apt) return;

      const dateStr = apt.date ?? format(professionalViewDate, "yyyy-MM-dd");
      if (!dateStr) return;

      const oldStartMin = timeStringToMinutes(apt.start_time);
      const newStartMin = hhmmToMinutes(newTime);
      if (oldStartMin == null || newStartMin == null) return;

      const duration = computeAppointmentDurationMinutes(apt);
      const candidate = { start: newStartMin, end: newStartMin + duration };

      const profIdsFromServices = (apt.services || [])
        .map((s) => s.professional_id)
        .filter((x) => x != null)
        .map((x) => String(x));

      const profIdsFromApt = (apt.professionals || []).map((p) => String(p.id));
      const involvedProfessionals = Array.from(new Set([...profIdsFromServices, ...profIdsFromApt]));

      const primaryProfId =
        involvedProfessionals[0] ??
        (professionalFilter !== "all" ? String(professionalFilter) : null);

      for (const pid of involvedProfessionals) {
        const conflict = hasConflictForProfessional(pid, dateStr, candidate, apt.id);
        if (conflict) {
          const slots =
            primaryProfId != null
              ? buildAvailableSlotsForProfessional(primaryProfId, professionalViewDate, duration, apt.id)
              : [];
          onConflict(slots);
          return;
        }
      }

      const delta = newStartMin - oldStartMin;

      const servicesArr = Array.isArray(apt.services) ? apt.services : [];
      for (const s of servicesArr) {
        const pid = s.professional_id != null ? Number(s.professional_id) : null;
        if (!pid) continue;

        const win = getScheduleWindowForProfessional(pid, professionalViewDate);
        if (!win) {
          const slots =
            primaryProfId != null
              ? buildAvailableSlotsForProfessional(primaryProfId, professionalViewDate, duration, apt.id)
              : [];
          onConflict(slots);
          toast({
            title: "Horário indisponível",
            description: "O profissional não possui escala válida para este dia.",
            variant: "destructive",
          });
          return;
        }

        const shiftedStart = shiftToDateTime(dateStr, s.starts_at ?? apt.start_time, delta);
        const shiftedEnd = shiftToDateTime(dateStr, s.ends_at ?? null, delta);

        const startMinSvc = timeStringToMinutes(shiftedStart);
        let endMinSvc = timeStringToMinutes(shiftedEnd);

        if (startMinSvc == null) continue;

        if (endMinSvc == null) {
          const durReal = Number((s as any).duration ?? 0) || 30;
          const paperDur = normalizeDurationForPaper(durReal);
          const rawEnd = startMinSvc + paperDur;
          endMinSvc = applyLunchBreakIfCrosses(startMinSvc, rawEnd, win.lunchStartMin, win.lunchEndMin);
        }

        const scheduleCheck = validateIntervalInsideSchedule(startMinSvc, endMinSvc, win);
        if (scheduleCheck.ok === false) {
          const reason = scheduleCheck.reason;

          const slots =
            primaryProfId != null
              ? buildAvailableSlotsForProfessional(primaryProfId, professionalViewDate, duration, apt.id)
              : [];

          onConflict(slots);

          toast({
            title: "Horário indisponível",
            description:
              reason === "lunch"
                ? "Esse horário cai no intervalo do profissional."
                : "Esse horário fica fora do expediente do profissional.",
            variant: "destructive",
          });
          return;
        }
      }

      const servicesPayload = (Array.isArray(apt.services) ? apt.services : []).map((s) => ({
        id: Number(s.id),
        service_price: String((s as any).service_price ?? "0"),
        commission_type: ((s as any).commission_type ?? null) as "percentage" | "fixed" | null,
        commission_value: String((s as any).commission_value ?? "0"),
        professional_id: s.professional_id != null ? Number(s.professional_id) : null,
        starts_at: shiftToDateTime(dateStr, s.starts_at ?? apt.start_time, delta),
        ends_at: shiftToDateTime(dateStr, s.ends_at ?? null, delta),
      }));

      try {
        const { updateAppointment: updateFn } = await import("@/services/appointmentsService");
        await updateFn(Number(apt.id), {
          start_time: `${newTime}:00`,
          duration: apt.duration ?? duration,
          services: servicesPayload,
        });

        await refetchAppointments();
        toast({ title: "Horário atualizado." });
      } catch (e: any) {
        console.error(e);

        const status = e?.response?.status;
        const data = e?.response?.data;

        if (status === 422) {
          const backendMsg =
            (typeof data?.message === "string" && data.message) ||
            (data?.errors && typeof data.errors === "object"
              ? data.errors[Object.keys(data.errors)[0]]?.[0]
              : null) ||
            "Horário inválido para a escala do profissional.";

          const slots =
            primaryProfId != null
              ? buildAvailableSlotsForProfessional(primaryProfId, professionalViewDate, duration, apt.id)
              : [];

          onConflict(slots);

          toast({
            title: "Horário indisponível",
            description: backendMsg,
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Erro ao atualizar horário",
          description: e?.message ?? "Tente novamente.",
          variant: "destructive",
        });
      }
    })();
  };

  const handleReassignProfessional = (
    appointmentId: number,
    newProfessionalId: number,
    onConflict: () => void
  ): void => {
    (async () => {
      const apt = appointments.find((a) => Number(a.id) === Number(appointmentId));
      if (!apt) return;

      const dateStr = apt.date ?? format(professionalViewDate, "yyyy-MM-dd");
      if (!dateStr) return;

      const startMin = timeStringToMinutes(apt.start_time);
      if (startMin == null) return;

      const duration = computeAppointmentDurationMinutes(apt);
      const candidate = { start: startMin, end: startMin + duration };

      const conflict = hasConflictForProfessional(String(newProfessionalId), dateStr, candidate, apt.id);
      if (conflict) {
        onConflict();
        return;
      }

      const servicesPayload = buildServicesPayloadFromApt(apt).map((s) => ({
        ...s,
        professional_id: Number(newProfessionalId),
      }));

      try {
        const { updateAppointment: updateFn } = await import("@/services/appointmentsService");
        await updateFn(Number(apt.id), { services: servicesPayload });

        await refetchAppointments();
        toast({ title: "Profissional realocado." });
      } catch (e: any) {
        console.error(e);
        toast({
          title: "Erro ao realocar profissional",
          description: e?.message ?? "Tente novamente.",
          variant: "destructive",
        });
      }
    })();
  };

  const handleQuickReassign = (
    appointmentId: number,
    newProfessionalId: number,
    newTime: string,
    scope: ReassignScope,
    onConflict: (availableSlots: string[]) => void
  ): void => {
    (async () => {
      const apt = appointments.find((a) => Number(a.id) === Number(appointmentId));
      if (!apt) return;

      const dateStr = apt.date ?? format(professionalViewDate, "yyyy-MM-dd");
      if (!dateStr) return;

      const dateObj = new Date(`${dateStr}T00:00:00`);
      const newStartMin = hhmmToMinutes(newTime);
      if (newStartMin == null) return;

      const winTarget = getScheduleWindowForProfessional(newProfessionalId, dateObj);
      if (!winTarget) {
        const duration = computeAppointmentDurationMinutes(apt);
        const slots = buildAvailableSlotsForProfessional(
          newProfessionalId,
          dateObj,
          duration,
          apt.id
        );
        onConflict(slots);

        toast({
          title: "Horário indisponível",
          description: "O profissional não possui escala válida para este dia.",
          variant: "destructive",
        });
        return;
      }

      const servicesArr = Array.isArray(apt.services) ? apt.services : [];

      const shouldMoveService = (service: any) => {
        if (scope.type === "all") return true;
        const pid = service.professional_id != null ? Number(service.professional_id) : null;
        return pid != null && pid === Number(scope.professionalId);
      };

      let movedMaxEndMin: number | null = null;

      const servicesPayload = servicesArr.map((s: any) => {
        const move = shouldMoveService(s);

        const serviceId = Number(s.id);
        const durReal =
          Number(s.duration ?? 0) ||
          Number(serviceById.get(serviceId)?.duration ?? 0) ||
          30;

        if (move) {
          const paperDur = normalizeDurationForPaper(durReal);
          const rawEnd = newStartMin + paperDur;
          const endMin = applyLunchBreakIfCrosses(
            newStartMin,
            rawEnd,
            winTarget.lunchStartMin,
            winTarget.lunchEndMin
          );

          const scheduleCheck = validateIntervalInsideSchedule(newStartMin, endMin, winTarget);
          if (scheduleCheck.ok === false) {
            const reason = scheduleCheck.reason;

            const duration = computeAppointmentDurationMinutes(apt);
            const slots = buildAvailableSlotsForProfessional(
              newProfessionalId,
              dateObj,
              duration,
              apt.id
            );
            onConflict(slots);

            toast({
              title: "Horário indisponível",
              description:
                reason === "lunch"
                  ? "Esse horário cai no intervalo do profissional."
                  : "Esse horário fica fora do expediente do profissional.",
              variant: "destructive",
            });

            throw new Error("__SCHEDULE_INVALID__");
          }

          movedMaxEndMin = movedMaxEndMin == null ? endMin : Math.max(movedMaxEndMin, endMin);

          return {
            id: serviceId,
            service_price: String(s.service_price ?? "0"),
            commission_type: (s.commission_type ?? null) as "percentage" | "fixed" | null,
            commission_value: String(s.commission_value ?? "0"),
            professional_id: Number(newProfessionalId),
            starts_at: toDateTime(dateStr, newTime),
            ends_at: `${dateStr} ${minutesToHHmmss(endMin)}`,
          };
        }

        return {
          id: Number(s.id),
          service_price: String(s.service_price ?? "0"),
          commission_type: (s.commission_type ?? null) as "percentage" | "fixed" | null,
          commission_value: String(s.commission_value ?? "0"),
          professional_id: s.professional_id != null ? Number(s.professional_id) : null,
          starts_at: s.starts_at ?? null,
          ends_at: s.ends_at ?? null,
        };
      });

      const movedAny = servicesArr.some((s: any) => shouldMoveService(s));
      if (!movedAny) return;

      if (movedMaxEndMin != null) {
        const candidate = { start: newStartMin, end: movedMaxEndMin };
        const conflict = hasConflictForProfessional(
          String(newProfessionalId),
          dateStr,
          candidate,
          apt.id
        );

        if (conflict) {
          const duration = Math.max(30, movedMaxEndMin - newStartMin);
          const slots = buildAvailableSlotsForProfessional(
            newProfessionalId,
            dateObj,
            duration,
            apt.id
          );
          onConflict(slots);
          return;
        }
      }

      try {
        const { updateAppointment: updateFn } = await import("@/services/appointmentsService");

        await updateFn(Number(apt.id), {
          start_time: hhmmToHHmmss(newTime),
          services: servicesPayload,
        });

        await refetchAppointments();
        toast({ title: "Agendamento realocado." });
      } catch (e: any) {
        if (String(e?.message || "") === "__SCHEDULE_INVALID__") return;

        const status = e?.response?.status;
        const data = e?.response?.data;

        if (status === 422) {
          const backendMsg =
            (typeof data?.message === "string" && data.message) ||
            (data?.errors && typeof data.errors === "object"
              ? data.errors[Object.keys(data.errors)[0]]?.[0]
              : null) ||
            "Horário inválido para a escala do profissional.";

          onConflict([]);

          toast({
            title: "Não foi possível realocar",
            description: backendMsg,
            variant: "destructive",
          });
          return;
        }

        console.error(e);
        toast({
          title: "Erro ao realocar agendamento",
          description: e?.message ?? "Tente novamente.",
          variant: "destructive",
        });
      }
    })();
  };

  const { data: fullAppointmentData, isLoading: loadingFullAppointment } = useAppointmentQuery(checkoutAppointmentId ?? 0, !!checkoutAppointmentId);

  const getTimeSlotsForRow = (
    selectedDate: Date | undefined,
    professionalId: ID | undefined,
    serviceDuration: number | undefined,
    rowIndex: number,
    servicesFieldValue: any[],
    currentAppointmentId?: ID
  ): TimeSlotWithStatus[] => {
    if (!selectedDate || !professionalId || !serviceDuration || serviceDuration <= 0) {
      return [];
    }

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const busy: { start: number; end: number }[] = [];
    const professionalIdStr = String(professionalId);
    const profIdNum = Number(professionalId);
    const windowsConfigured = hasWindowsConfiguredForProfessional(profIdNum);
    if (windowsConfigured && !hasOpenWindowForDate(profIdNum, dateStr)) {
      return [];
    }

    let dayStart: number | null = null;
    let dayEnd: number | null = null;
    let lunchStart: number | null = null;
    let lunchEnd: number | null = null;

    const scheduleForProf = professionalWorkScheduleById.get(profIdNum);

    if (!scheduleForProf || scheduleForProf.length === 0) {
      return [];
    }

    const weekdayLabel = getWeekdayLabel(selectedDate);
    const daySchedule = scheduleForProf.find((d) => d.day === weekdayLabel);

    if (!daySchedule || daySchedule.isDayOff || daySchedule.isWorkingDay === false) {
      return [];
    }

    const startMinutes = timeStringToMinutes(daySchedule.startTime);
    const endMinutes = timeStringToMinutes(daySchedule.endTime);

    if (startMinutes == null || endMinutes == null || endMinutes <= startMinutes) {
      return [];
    }

    dayStart = startMinutes;
    dayEnd = endMinutes;

    if (daySchedule.lunchStart) {
      lunchStart = timeStringToMinutes(daySchedule.lunchStart) ?? null;
    }
    if (daySchedule.lunchEnd) {
      lunchEnd = timeStringToMinutes(daySchedule.lunchEnd) ?? null;
    }
    if (lunchStart != null && lunchEnd != null && lunchEnd <= lunchStart) {
      lunchStart = null;
      lunchEnd = null;
    }

    const reqIsLong = isLongFlexibleService(serviceDuration);
    const paperDur = normalizeDurationForPaper(serviceDuration);

    const toBusyEnd = (start: number, durReal: number) => {
      const durPaper = normalizeDurationForPaper(durReal || 30);
      const rawEnd = start + durPaper;
      return applyLunchBreakIfCrosses(start, rawEnd, lunchStart, lunchEnd);
    };

    appointments.forEach((apt) => {
      if (apt.status === "cancelled" || apt.status === "no_show") return;
      if (apt.date !== dateStr) return;

      if (currentAppointmentId && String(apt.id) === String(currentAppointmentId)) {
        return;
      }

      const servicesForProf = (apt.services || []).filter(
        (s) =>
          s.professional_id != null &&
          String(s.professional_id) === professionalIdStr
      );

      if (servicesForProf.length > 0) {
        servicesForProf.forEach((s) => {
          let start = timeStringToMinutes(s.starts_at);
          let end = timeStringToMinutes(s.ends_at);
          const pivotDuration = Number(s.duration || 0);

          if (start == null && apt.start_time) {
            start = timeStringToMinutes(apt.start_time);
          }

          if (end == null && start != null) {
            const durReal = pivotDuration || Number(apt.duration || 0) || serviceDuration;
            end = toBusyEnd(start, durReal);
          }

          if (start != null && end != null && end > start) {
            busy.push({ start, end });
          }
        });
      } else {
        const hasProfInApt = (apt.professionals || []).some(
          (p) => String(p.id) === professionalIdStr
        );
        if (!hasProfInApt) return;

        const start = timeStringToMinutes(apt.start_time);
        const durReal = Number(apt.duration || 0);
        if (start != null && durReal > 0) {
          busy.push({ start, end: toBusyEnd(start, durReal) });
        }
      }
    });

    servicesFieldValue.forEach((svc: any, index: number) => {
      if (index === rowIndex) return;
      if (!svc?.professional_id) return;
      if (String(svc.professional_id) !== professionalIdStr) return;
      if (!svc.start_time) return;

      const svcEntity = serviceById.get(Number(svc.service_id));
      const durReal = Number(svcEntity?.duration || 0);
      const start = timeStringToMinutes(svc.start_time);
      if (start != null && durReal > 0) {
        busy.push({ start, end: toBusyEnd(start, durReal) });
      }
    });

    const baseSlots = buildSlotsBetween(dayStart as number, dayEnd as number, PAPER_STEP_MIN)
    .filter((hhmm) => {
      const t = timeStringToMinutes(hhmm);
      if (t == null) return false;

      if (lunchStart != null && lunchEnd != null && t >= lunchStart && t < lunchEnd) {
        return false;
      }

      if (t >= (dayEnd as number)) return false;

      return true;
    });

    return baseSlots.map((slot): TimeSlotWithStatus => {
      const slotStart = timeStringToMinutes(slot);
      if (slotStart == null) {
        return { time: slot, isFree: false, reason: "outside-working-hours" };
      }

      const rawEnd = slotStart + paperDur;
      const slotEnd = applyLunchBreakIfCrosses(slotStart, rawEnd, lunchStart, lunchEnd);

      const interval = { start: slotStart, end: slotEnd };
      const overlapsBusy = busy.some((b) => overlaps(interval, b));
      const overtime = slotEnd > (dayEnd as number);

      if (overlapsBusy) return { time: slot, isFree: false, reason: "busy" };
      return { time: slot, isFree: true, overtime };
    });
  };

  const handleOpenDialog = (apt?: AppointmentBackend, prefilledDate?: Date) => {
    const toHHmmFromDateTime = (value?: string | null) => {
      const timePart = extractTimePart(value);
      return timePart ? timePart.slice(0, 5) : "";
    };

    if (apt) {
      setEditingAppointment(apt);

      const defaultServices = (apt.services || []).map((s) => ({
        service_id: Number(s.id),
        professional_id: Number(s.professional_id ?? 0),
        start_time: toHHmmFromDateTime(s.starts_at),
      }));

      const d = apt.date ? new Date(`${apt.date}T00:00:00`) : undefined;

      form.reset({
        customer_id: Number(apt.customer?.id ?? 0),
        services: defaultServices,
        date: d as Date,
        status: apt.status,
        payment_status: apt.payment_status,
        promotion_id: (apt as any).promotion_id ?? null,
        notes: apt.notes ?? "",
      });
    } else {
      setEditingAppointment(null);
      form.reset({
        customer_id: undefined as unknown as number,
        services: [],
        date: prefilledDate as Date | undefined,
        status: "scheduled",
        payment_status: "unpaid",
        notes: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCalendarDayClick = (date: Date) => {
    if (!can("appointments", "create")) return;
    handleOpenDialog(undefined, date);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAppointment(null);
    form.reset();
  };

  const buildPayload = (values: FormValues) => {
    const dateStr = format(values.date, "yyyy-MM-dd");

    const serviceTimes: { start: number; end: number }[] = [];

    const toDateTimeString = (minutes: number) => {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      return `${dateStr} ${hh}:${mm}:00`;
    };

    const toTimeString = (minutes: number) => {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
    };

    const servicesPayload = values.services.map((s) => {
      const svc = serviceById.get(Number(s.service_id));
      const svcDurationReal = Number(svc?.duration || 0);

      const svcDurationPaper = normalizeDurationForPaper(svcDurationReal);

      const [startHour, startMinute] = String(s.start_time)
        .split(":")
        .map((n) => Number(n));
      const serviceStartMinutes = startHour * 60 + startMinute;

      let lunchStartMin: number | null = null;
      let lunchEndMin: number | null = null;

      const profSchedule =
        professionalWorkScheduleById.get(Number(s.professional_id)) ?? [];
      const weekdayLabel = getWeekdayLabel(values.date);
      const daySchedule = profSchedule.find((d) => d.day === weekdayLabel);

      if (daySchedule?.lunchStart)
        lunchStartMin = timeStringToMinutes(daySchedule.lunchStart);
      if (daySchedule?.lunchEnd)
        lunchEndMin = timeStringToMinutes(daySchedule.lunchEnd);

      if (lunchStartMin != null && lunchEndMin != null && lunchEndMin <= lunchStartMin) {
        lunchStartMin = null;
        lunchEndMin = null;
      }

      const rawEnd = serviceStartMinutes + svcDurationPaper;
      const serviceEndMinutes = applyLunchBreakIfCrosses(
        serviceStartMinutes,
        rawEnd,
        lunchStartMin,
        lunchEndMin
      );

      serviceTimes.push({
        start: serviceStartMinutes,
        end: serviceEndMinutes,
      });

      return {
        id: Number(s.service_id),
        service_price: String(svc?.price ?? "0"),
        commission_type: (svc?.commission_type ?? "percentage") as
          | "percentage"
          | "fixed",
        commission_value: String(svc?.commission_value ?? "0"),
        professional_id: Number(s.professional_id),
        starts_at: toDateTimeString(serviceStartMinutes),
        ends_at: toDateTimeString(serviceEndMinutes),
      };
    });

    const minStart = Math.min(...serviceTimes.map((t) => t.start));
    const maxEnd = Math.max(...serviceTimes.map((t) => t.end));
    const appointmentDuration = maxEnd - minStart;

    const start_time = toTimeString(minStart);

    const totalPriceNumber = servicesPayload.reduce(
      (sum, s) => sum + Number(s.service_price || 0),
      0
    );

    return {
      customer_id: Number(values.customer_id),
      date: dateStr,
      start_time,
      duration: appointmentDuration,
      status: values.status,
      payment_status: values.payment_status,
      promotion_id: values.promotion_id ?? null,
      notes: values.notes || null,
      total_price: totalPriceNumber.toFixed(2),
      discount_amount: "0.00",
      final_price: totalPriceNumber.toFixed(2),
      services: servicesPayload,
    };
  };

  const onSubmit = async (values: FormValues) => {
    if (!values.services || values.services.length === 0) {
      toast({
        title: "Selecione ao menos um serviço e profissional",
        variant: "destructive",
      });
      return;
    }

    const hasIncomplete = values.services.some(
      (s) => !s.service_id || !s.professional_id || !s.start_time
    );

    if (hasIncomplete) {
      toast({
        title: "Preencha todos os serviços",
        description:
          "Cada linha precisa de um serviço, um profissional e um horário selecionados.",
        variant: "destructive",
      });
      return;
    }

    const payload = buildPayload(values);

    try {
      if (editingAppointment) {
        const { updateAppointment: updateFn } = await import(
          "@/services/appointmentsService"
        );
        await updateFn(Number(editingAppointment.id), payload);
        await refetchAppointments();
        toast({ title: "Agendamento atualizado com sucesso." });
      } else {
        await createAppointment.mutateAsync(payload);
        await refetchAppointments();
        toast({ title: "Agendamento criado com sucesso." });
      }
      setIsDialogOpen(false);
      setEditingAppointment(null);
      form.reset();
    } catch (e: any) {
      console.error(e);

      let description = e?.message ?? "Tente novamente.";

      const response = e?.response;
      const data = response?.data;

      if (data) {
        if (data.errors && typeof data.errors === "object") {
          const firstKey = Object.keys(data.errors)[0];
          const firstMessage = data.errors[firstKey]?.[0];
          if (firstMessage) {
            description = firstMessage;
          }
        } else if (typeof data.message === "string") {
          description = data.message;
        }
      }

      toast({
        title: "Erro ao salvar agendamento",
        description,
        variant: "destructive",
      });
    }
  };

  const handleDelete = (id: ID) => {
    setDeletingAppointmentId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingAppointmentId) return;
    try {
      await deleteAppointment.mutateAsync(Number(deletingAppointmentId));
      toast({ title: "Agendamento excluído." });
    } catch (e: any) {
      toast({
        title: "Não foi possível excluir",
        description: e?.message ?? "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingAppointmentId(null);
    }
  };

  const moneyToNumber = (value: unknown): number | undefined => {
    if (value == null) return undefined;

    if (typeof value === "number") return Number.isFinite(value) ? value : undefined;

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return undefined;

      const normalized = trimmed.replace(",", ".");
      const n = Number(normalized);
      return Number.isFinite(n) ? n : undefined;
    }

    return undefined;
  };

  const toLegacy = (apt: AppointmentBackend): AppointmentLegacy => {
    const customerName = apt.customer?.name ?? "Cliente";
    const customerPhone = (apt.customer as any)?.phone ?? undefined;

    const servicesNames = (apt.services || []).map((s) => s.name).join(", ");
    const profNames = (apt.services || [])
      .map((s) => {
        const prof = professionals.find(
          (p) => Number(p.id) === Number(s.professional_id)
        );
        return prof?.name ?? "";
      })
      .filter(Boolean)
      .join(", ");

    const time = (apt.start_time || "").slice(0, 5);

    return {
      id: String(apt.id),
      client: customerName,
      clientPhone: customerPhone,
      service: servicesNames,
      professionals: profNames ? profNames.split(", ") : [],
      date: apt.date,
      time,
      duration: apt.duration ?? undefined,
      status: apt.status,
      payment_status: apt.payment_status,
      notes: apt.notes ?? undefined,
      price: moneyToNumber(apt.total_price),
    };
  };

  const toLegacyAppointment = (apt: AppointmentBackend): LegacyAppointment => ({
    id: String(apt.id),
    client: apt.customer?.name ?? "Cliente",
    clientPhone: (apt.customer as any)?.phone ?? undefined,
    service: (apt.services || []).map((s) => s.name).join(", "),
    professionals: (apt.professionals || []).map((p) => String(p.id)),
    date: apt.date,
    time: (apt.start_time || "").slice(0, 5),
    duration: apt.duration ?? undefined,
    status: apt.status,
    payment_status: apt.payment_status,
    notes: apt.notes ?? undefined,
    price: moneyToNumber(apt.total_price),
  });

  const handleCheckout = (apt: AppointmentBackend) => {
    setCheckoutAppointmentId(Number(apt.id));
    setCheckoutDialogOpen(true);
  };

  const printAppointmentReceipt = (apt: AppointmentBackend) => {
    const legacy = toLegacy(apt);

    const professionalNames = (apt.professionals || [])
      .map((p) => p.name)
      .filter(Boolean)
      .join(", ");

    const date = new Date(legacy.date);
    const formattedDate = date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      weekday: "long",
    });

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({
        title: "Erro",
        description:
          "Não foi possível abrir a janela de impressão. Verifique se pop-ups não estão bloqueados.",
        variant: "destructive",
      });
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Comanda - ${legacy.client}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #e63888; }
            .header h1 { color: #e63888; font-size: 28px; margin-bottom: 10px; }
            .header p { color: #666; font-size: 14px; }
            .section { margin-bottom: 25px; }
            .section-title { background-color: #e63888; color: white; padding: 8px 12px; font-size: 16px; font-weight: bold; margin-bottom: 12px; border-radius: 4px; }
            .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 15px; }
            .info-item { padding: 10px; background-color: #f8f9fa; border-left: 3px solid #e63888; border-radius: 4px; }
            .info-label { font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 4px; font-weight: 600; }
            .info-value { font-size: 16px; color: #333; font-weight: 500; }
            .full-width { grid-column: 1 / -1; }
            .status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 14px; font-weight: 600; }
            .status-scheduled { background-color: #fef3c7; color: #92400e; }
            .status-confirmed { background-color: #dbeafe; color: #1e40af; }
            .status-completed { background-color: #d1fae5; color: #065f46; }
            .status-cancelled { background-color: #fee2e2; color: #991b1b; }
            .status-no_show { background-color: #d3d3d3; color: #991b1b; }
            .status-rescheduled { background-color: #fef3c7; color: #92400e; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 2px dashed #ccc; text-align: center; color: #666; font-size: 12px; }
            .price-highlight { font-size: 24px; color: #e63888; font-weight: bold; }
            .notes-box { background-color: #fffbeb; border: 1px solid #fbbf24; padding: 12px; border-radius: 4px; font-size: 14px; color: #78350f; }
            @media print { body { padding: 10px; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🌸 Studio Unhas Delicadas 🌸</h1>
            <p>Michele Fonseca e Equipe</p>
            <p style="margin-top: 10px; font-size: 16px; font-weight: 600;">COMANDA DE ATENDIMENTO</p>
          </div>

          <div class="section">
            <div class="section-title">Informações do Cliente</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Cliente</div>
                <div class="info-value">${legacy.client}</div>
              </div>
              ${
                legacy.clientPhone
                  ? `
                <div class="info-item">
                  <div class="info-label">Telefone</div>
                  <div class="info-value">${legacy.clientPhone}</div>
                </div>
              `
                  : ""
              }
            </div>
          </div>

          <div class="section">
            <div class="section-title">Detalhes do Agendamento</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Data</div>
                <div class="info-value">${formattedDate}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Horário</div>
                <div class="info-value">${legacy.time}</div>
              </div>
              ${
                legacy.duration
                  ? `
                <div class="info-item">
                  <div class="info-label">Duração</div>
                  <div class="info-value">${legacy.duration} minutos</div>
                </div>
              `
                  : ""
              }
              <div class="info-item">
                <div class="info-label">Status</div>
                <div class="info-value">
                  <span class="status-badge status-${legacy.status}">
                    ${
                      legacy.status === "scheduled"
                        ? "Agendado"
                        : legacy.status === "confirmed"
                        ? "Confirmado"
                        : legacy.status === "completed"
                        ? "Concluído"
                        : legacy.status === "cancelled"
                        ? "Cancelado"
                        : legacy.status === "no_show"
                        ? "Não Compareceu"
                        : legacy.status === "rescheduled"
                        ? "Reagendado"
                        : legacy.status
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Serviços e Profissionais</div>
            <div class="info-grid">
              <div class="info-item full-width">
                <div class="info-label">Serviços</div>
                <div class="info-value">${legacy.service || "-"}</div>
              </div>
              <div class="info-item full-width">
                <div class="info-label">Profissional(is)</div>
                <div class="info-value">${
                  professionalNames || "Não especificado"
                }</div>
              </div>
            </div>
          </div>

          ${
            legacy.price
              ? `
            <div class="section">
              <div class="section-title">Valores</div>
              <div class="info-item" style="text-align: center; padding: 20px;">
                <div class="info-label">Valor Total</div>
                <div class="price-highlight">R$ ${Number(legacy.price).toFixed(
                  2
                )}</div>
              </div>
            </div>
          `
              : ""
          }

          ${
            legacy.notes
              ? `
            <div class="section">
              <div class="section-title">Observações</div>
              <div class="notes-box">
                ${legacy.notes}
              </div>
            </div>
          `
              : ""
          }

          <div class="footer">
            <p><strong>Studio Unhas Delicadas - Michele Fonseca e Equipe</strong></p>
            <p>Comanda impressa em ${new Date().toLocaleDateString(
              "pt-BR"
            )} às ${new Date().toLocaleTimeString("pt-BR")}</p>
            <p style="margin-top: 10px;">Obrigado pela preferência! 💅</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };

  const renderBadgesWithOverflow = (
    items: string[],
    kind: "service" | "professional"
  ) => {
    const singular = kind === "service" ? "serviço" : "profissional";
    const plural = kind === "service" ? "serviços" : "profissionais";

    if (items.length === 0) return "-";

    if (items.length === 1) {
      return (
        <Badge
          variant="secondary"
          className="max-w-[220px] truncate"
          title={items[0]}
        >
          {items[0]}
        </Badge>
      );
    }

    const visible = items.slice(0, 1);
    const hidden = items.slice(1);

    return (
      <div className="flex flex-wrap items-center gap-1 max-w-[260px]">
        {visible.map((name) => (
          <Badge
            key={name}
            variant="secondary"
            className="max-w-[180px] truncate"
            title={name}
          >
            {name}
          </Badge>
        ))}

        {hidden.length > 0 && (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="cursor-pointer">
                +{hidden.length}
              </Badge>
            </TooltipTrigger>

            <TooltipContent className="max-w-xs">
              <p className="text-xs font-medium mb-1">
                Outros {hidden.length}{" "}
                {hidden.length === 1 ? singular : plural} deste atendimento:
              </p>
              <ul className="space-y-1">
                {hidden.map((name) => (
                  <li
                    key={name}
                    className="text-xs text-muted-foreground leading-snug"
                  >
                    • {name}
                  </li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    );
  };

  const getPaymentStatusLabel = (
    status: AppointmentBackend["payment_status"]
  ) => {
    switch (status) {
      case "unpaid":
        return "Não pago";
      case "prepaid":
        return "Pago antecipado";
      case "paid":
        return "Pago";
      default:
        return status;
    }
  };

  const getPaymentStatusBadgeClasses = (
    status: AppointmentBackend["payment_status"]
  ) => {
    switch (status) {
      case "unpaid":
        return "bg-rose-50 text-rose-700 border border-rose-200";
      case "prepaid":
        return "bg-amber-50 text-amber-800 border border-amber-200";
      case "paid":
        return "bg-emerald-50 text-emerald-800 border border-emerald-200";
      default:
        return "bg-muted text-muted-foreground border border-border";
    }
  };

  const columns = [
    {
      key: "customer",
      header: "Cliente",
      render: (apt: AppointmentBackend) => apt.customer?.name ?? "-",
    },
    {
      key: "services",
      header: "Serviços",
      render: (apt: AppointmentBackend) => {
        const names = (apt.services || [])
          .map((s) => s.name)
          .filter(Boolean);

        return renderBadgesWithOverflow(names, "service");
      },
    },
    {
      key: "professionals",
      header: "Profissionais",
      render: (apt: AppointmentBackend) => {
        const names = (apt.professionals || [])
          .map((p) => p.name)
          .filter(Boolean);

        return renderBadgesWithOverflow(names, "professional");
      },
    },
    {
      key: "date",
      header: "Data",
      render: (apt: AppointmentBackend) => {
        const d = apt.date ? new Date(`${apt.date}T00:00:00`) : null;
        return d ? d.toLocaleDateString("pt-BR") : "-";
      },
    },
    {
      key: "time",
      header: "Horário",
      render: (apt: AppointmentBackend) => (apt.start_time || "").slice(0, 5),
    },
    {
      key: "status",
      header: "Status",
      render: (apt: AppointmentBackend) => (
        <Badge
          variant="outline"
          className={getStatusBadgeClass(
            apt.status,
            "px-2 py-0.5 text-xs font-medium rounded-full"
          )}
        >
          {getStatusLabel(apt.status)}
        </Badge>
      ),
    },
    {
      key: "payment_status",
      header: "Pagamento",
      render: (apt: AppointmentBackend) => (
        <Badge
          variant="outline"
          className={cn(
            "px-2 py-0.5 text-xs font-medium rounded-full",
            getPaymentStatusBadgeClasses(apt.payment_status)
          )}
        >
          {getPaymentStatusLabel(apt.payment_status)}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Ações",
      render: (apt: AppointmentBackend) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => printAppointmentReceipt(apt)}
            title="Imprimir Comanda"
          >
            <Printer className="h-4 w-4" />
          </Button>
          {(apt.status === "scheduled" || apt.status === "confirmed") &&
            can("appointments", "update") && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleCheckout(apt)}
                title="Finalizar Atendimento"
              >
                <DollarSign className="h-4 w-4 text-success" />
              </Button>
            )}
          {can("appointments", "update") && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleOpenDialog(apt)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {can("appointments", "delete") && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(apt.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const customerOptions: { value: ID; label: string }[] = customers.map(
    (c) => ({
      value: c.id,
      label: c.name,
    })
  );

  const professionalOptions: { value: ID; label: string }[] = professionals.map(
    (p) => ({
      value: p.id,
      label: p.name,
    })
  );

  const serviceOptions: { value: ID; label: string }[] = services.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  const hasActiveFilters =
    statusFilter !== "all" ||
    paymentStatusFilter !== "all" ||
    customerFilter !== "all" ||
    professionalFilter !== "all" ||
    serviceFilter !== "all" ||
    dateFromFilter !== null ||
    dateToFilter !== null;

  useEffect(() => {
    if (hasActiveFilters) {
      setFiltersOpen(true);
    }
  }, [hasActiveFilters]);

  const clearFilters = () => {
    setStatusFilter("all");
    setPaymentStatusFilter("all");
    setCustomerFilter("all");
    setProfessionalFilter("all");
    setServiceFilter("all");
    setDateFromFilter(null);
    setDateToFilter(null);
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Agendamentos
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Gerencie os agendamentos do salão
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-2">
            <div className="flex gap-1 border rounded-lg p-1">
              <Button
                variant={effectiveViewMode === "professional" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("professional")}
                className="text-xs md:text-sm flex-1 md:flex-none"
              >
                <Users className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
                <span className="md:inline">Profissionais</span>
              </Button>
              <Button
                variant={effectiveViewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="text-xs md:text-sm hidden md:flex"
              >
                <Table className="h-4 w-4 mr-2" />
                Tabela
              </Button>
              <Button
                variant={effectiveViewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="text-xs md:text-sm flex-1 md:flex-none"
              >
                <List className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
                <span className="md:inline">Lista</span>
              </Button>
              <Button
                variant={effectiveViewMode === "calendar" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("calendar")}
                className="text-xs md:text-sm flex-1 md:flex-none"
              >
                <CalendarIcon className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
                <span className="md:inline">Calendário</span>
              </Button>
            </div>
            {can("appointments", "create") && (
              <Button
                className="shadow-md text-xs md:text-sm h-8 md:h-10"
                onClick={() => handleOpenDialog()}
              >
                <Plus className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
                <span className="hidden sm:inline">Novo Agendamento</span>
                <span className="sm:hidden">Novo</span>
              </Button>
            )}
          </div>
        </div>

        {effectiveViewMode === "calendar" ? (
          <MonthlyAvailabilityCalendar
            professionals={professionals.map((p) => ({
              id: String(p.id),
              name: p.name,
            }))}
            appointments={appointments.map(toLegacyAppointment)}
            onDayClick={
              can("appointments", "create") ? handleCalendarDayClick : undefined
            }
          />
        ) : (
          <>
            <div className="bg-muted/40 border rounded-lg p-3 md:p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-xs md:text-sm font-medium text-muted-foreground">
                      Filtros
                    </span>

                    {hasActiveFilters && (
                      <span className="text-[11px] text-muted-foreground">
                        {filteredAppointments.length} resultado
                        {filteredAppointments.length === 1 ? "" : "s"} encontrado
                        {filteredAppointments.length === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {hasActiveFilters && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-[11px] md:text-xs"
                      onClick={clearFilters}
                    >
                      Limpar filtros
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-[11px] md:text-xs gap-1"
                    onClick={() => setFiltersOpen((prev) => !prev)}
                  >
                    {filtersOpen ? "Ocultar filtros" : "Mostrar filtros"}
                    {filtersOpen ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>

              {filtersOpen && (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-2 mt-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-medium text-muted-foreground">
                      Data de
                    </span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-between px-3 py-2 h-9 text-xs",
                            !dateFromFilter && "text-muted-foreground"
                          )}
                        >
                          {dateFromFilter
                            ? format(dateFromFilter, "P", { locale: ptBR })
                            : "Qualquer data"}
                          <CalendarIcon className="ml-2 h-3 w-3 opacity-60" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateFromFilter ?? undefined}
                          onSelect={(date) => setDateFromFilter(date ?? null)}
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-medium text-muted-foreground">
                      Data até
                    </span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-between px-3 py-2 h-9 text-xs",
                            !dateToFilter && "text-muted-foreground"
                          )}
                        >
                          {dateToFilter
                            ? format(dateToFilter, "P", { locale: ptBR })
                            : "Qualquer data"}
                          <CalendarIcon className="ml-2 h-3 w-3 opacity-60" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateToFilter ?? undefined}
                          onSelect={(date) => setDateToFilter(date ?? null)}
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-medium text-muted-foreground">
                      Status
                    </span>
                    <Select
                      value={statusFilter}
                      onValueChange={(v) =>
                        setStatusFilter(
                          v as "all" | AppointmentBackend["status"]
                        )
                      }
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="scheduled">Agendado</SelectItem>
                        <SelectItem value="confirmed">Confirmado</SelectItem>
                        <SelectItem value="completed">Concluído</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                        <SelectItem value="no_show">Não Compareceu</SelectItem>
                        <SelectItem value="rescheduled">Reagendado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-medium text-muted-foreground">
                      Pagamento
                    </span>
                    <Select
                      value={paymentStatusFilter}
                      onValueChange={(v) =>
                        setPaymentStatusFilter(
                          v as "all" | AppointmentBackend["payment_status"]
                        )
                      }
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="unpaid">Não pago</SelectItem>
                        <SelectItem value="prepaid">Pago antecipado</SelectItem>
                        <SelectItem value="paid">Pago</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-medium text-muted-foreground">
                      Cliente
                    </span>
                    <FilterCombobox
                      value={customerFilter}
                      onChange={(v) => setCustomerFilter(v)}
                      options={customerOptions}
                      placeholder="cliente"
                      allLabel="Todos os clientes"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-medium text-muted-foreground">
                      Profissional
                    </span>
                    <FilterCombobox
                      value={professionalFilter}
                      onChange={(v) => setProfessionalFilter(v)}
                      options={professionalOptions}
                      placeholder="profissional"
                      allLabel="Todos os profissionais"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-medium text-muted-foreground">
                      Serviço
                    </span>
                    <FilterCombobox
                      value={serviceFilter}
                      onChange={(v) => setServiceFilter(v)}
                      options={serviceOptions}
                      placeholder="serviço"
                      allLabel="Todos os serviços"
                    />
                  </div>
                </div>
              )}
            </div>

            {effectiveViewMode === "professional" ? (
              <ProfessionalDailyView
                selectedDate={professionalViewDate}
                onDateChange={setProfessionalViewDate}
                professionals={professionals.map((p) => ({
                  id: p.id,
                  name: p.name,
                  work_schedule: p.work_schedule ?? null,
                }))}
                appointments={professionalDayAppointments}
                onEdit={can("appointments", "update") ? (apt) => handleOpenDialog(apt) : undefined}
                onDelete={can("appointments", "delete") ? (id) => handleDelete(id) : undefined}
                onCheckout={can("appointments", "update") ? (apt) => handleCheckout(apt) : undefined}
                onPrint={(apt) => printAppointmentReceipt(apt)}
                onQuickStatusChange={can("appointments", "update") ? handleQuickStatusChange : undefined}
                onQuickTimeChange={can("appointments", "update") ? handleQuickTimeChange : undefined}
                onReassignProfessional={can("appointments", "update") ? handleReassignProfessional : undefined}
                canEdit={can("appointments", "update")}
                canDelete={can("appointments", "delete")}
                onQuickReassign={can("appointments", "update") ? handleQuickReassign : undefined}
              />
            ) : effectiveViewMode === "list" ? (
              <CompactAppointmentList
                appointments={filteredAppointments.map(toLegacyAppointment)}
                professionals={professionals.map((p) => ({
                  id: String(p.id),
                  name: p.name,
                }))}
                onEdit={
                  can("appointments", "update")
                    ? (a) => {
                        const apt = filteredAppointments.find(
                          (x) => String(x.id) === a.id
                        );
                        if (apt) handleOpenDialog(apt);
                      }
                    : undefined
                }
                onDelete={
                  can("appointments", "delete")
                    ? (id) => handleDelete(id)
                    : undefined
                }
                onCheckout={
                  can("appointments", "update")
                    ? (a) => {
                        const apt = filteredAppointments.find(
                          (x) => String(x.id) === a.id
                        );
                        if (apt) handleCheckout(apt);
                      }
                    : undefined
                }
                onPrint={(a) => {
                  const apt = filteredAppointments.find(
                    (x) => String(x.id) === a.id
                  );
                  if (apt) printAppointmentReceipt(apt);
                }}
                canEdit={can("appointments", "update")}
                canDelete={can("appointments", "delete")}
                itemsPerPage={10}
              />
            ) : (
              <DataTable
                data={filteredAppointments}
                columns={columns}
                searchPlaceholder="Buscar agendamentos..."
                itemsPerPage={10}
              />
            )}
          </>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className={cn("max-h-[90vh] overflow-x-hidden", isMobile ? "max-w-[95vw]" : "max-w-5xl")}>
            <DialogHeader>
              <DialogTitle>
                {editingAppointment ? "Editar Agendamento" : "Novo Agendamento"}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados do agendamento. Campos marcados são obrigatórios.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 min-w-0">
                <FormField
                  control={form.control}
                  name="customer_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Cliente <span className="text-red-500">*</span>
                      </FormLabel>

                      <FormControl>
                        <Combobox
                          value={field.value ?? null}
                          onChange={(val) => {
                            field.onChange(val != null ? Number(val) : undefined);
                          }}
                          options={customerOptions}
                          placeholder="Selecione o cliente"
                          searchPlaceholder="Buscar cliente..."
                          emptyMessage="Nenhum cliente encontrado."
                        />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data <span className="text-red-500">*</span></FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "P", { locale: ptBR })
                                ) : (
                                  <span>Selecione a data</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => {
                                const today = new Date(new Date().setHours(0, 0, 0, 0));
                                if (date < today) return true;

                                if (selectedProfessionalIds.length === 0) {
                                  return false;
                                }

                                const dateStr = format(date, "yyyy-MM-dd");
                                const weekdayLabel = getWeekdayLabel(date);

                                const algumProfIndisponivel = selectedProfessionalIds.some((profId) => {
                                  const numId = Number(profId);

                                  const windows = professionalOpenWindowsById.get(numId) ?? [];
                                  const windowsConfigured = windows.length > 0;

                                  let temJanelaNaData = true;
                                  if (windowsConfigured) {
                                    const openWindows = windows.filter((w) => w.status === "open");
                                    temJanelaNaData = openWindows.some(
                                      (w) => w.start_date <= dateStr && dateStr <= w.end_date
                                    );
                                  }

                                  const schedule = professionalWorkScheduleById.get(numId);
                                  let podeTrabalharNesteDia = true;

                                  if (schedule && schedule.length > 0) {
                                    const daySchedule = schedule.find((d) => d.day === weekdayLabel);

                                    if (!daySchedule || daySchedule.isDayOff || daySchedule.isWorkingDay === false) {
                                      podeTrabalharNesteDia = false;
                                    }
                                  }

                                  return !temJanelaNaData || !podeTrabalharNesteDia;
                                });

                                return algumProfIndisponivel;
                              }}
                              locale={ptBR}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Status <span className="text-red-500">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="scheduled">Agendado</SelectItem>
                            <SelectItem value="confirmed">Confirmado</SelectItem>
                            <SelectItem value="completed">Concluído</SelectItem>
                            <SelectItem value="cancelled">Cancelado</SelectItem>
                            <SelectItem value="no_show">Não Compareceu</SelectItem>
                            <SelectItem value="rescheduled">Reagendado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="payment_status"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Status de pagamento <span className="text-red-500">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="unpaid">Não pago</SelectItem>
                            <SelectItem value="prepaid">Pago antecipado</SelectItem>
                            <SelectItem value="paid">Pago</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {watchedPaymentStatus === "prepaid" && (
                  <FormField
                    control={form.control}
                    name="promotion_id"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Promoção/Campanha</FormLabel>
                        <Select
                          value={field.value ? String(field.value) : "none"}
                          onValueChange={(v) => {
                            if (v === "none") {
                              field.onChange(null);
                            } else {
                              field.onChange(Number(v));
                            }
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione (opcional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Nenhuma promoção</SelectItem>
                            {activePromotions.map((promo) => (
                              <SelectItem key={promo.id} value={String(promo.id)}>
                                {promo.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="services"
                  render={({ field }) => {
                    const servicesValue = (field.value || []) as any[];
                    const selectedDate = form.watch("date");

                    const updateServiceAtIndex = (index: number, patch: Record<string, any>) => {
                      const updated = [...servicesValue];
                      updated[index] = {
                        ...updated[index],
                        ...patch,
                      };
                      field.onChange(updated);
                    };

                    const removeServiceAtIndex = (index: number) => {
                      const updated = servicesValue.filter((_: any, i: number) => i !== index);
                      field.onChange(updated);
                    };

                    return (
                      <FormItem>
                        <FormLabel>
                          Serviços, Profissionais e Horários{" "}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <div className="space-y-3">
                          {servicesValue.map((svc, idx) => {
                            const serviceId = svc.service_id ?? null;
                            const professionalId = svc.professional_id ?? null;

                            const serviceEntity = serviceId
                              ? serviceById.get(Number(serviceId))
                              : undefined;
                            const serviceDuration = Number(serviceEntity?.duration || 0);

                            const canSelectTime = selectedDate && professionalId && serviceId && serviceDuration > 0;

                            const slots: TimeSlotWithStatus[] =
                              canSelectTime && selectedDate
                                ? getTimeSlotsForRow(
                                    selectedDate,
                                    professionalId,
                                    serviceDuration,
                                    idx,
                                    servicesValue,
                                    editingAppointment?.id
                                  )
                                : [];

                            const hasAnySlots = slots.length > 0;
                            const hasFreeSlots = slots.some((s) => s.isFree);

                            const timeOptions = slots.map((slot) => {
                              let suffix = "";
                              let variant:
                                | "default"
                                | "success"
                                | "danger"
                                | "warning"
                                | "muted" = "default";
                              let optDisabled = false;

                              if (slot.isFree) {
                                variant = "success";
                              } else {
                                optDisabled = true;

                                if (slot.reason === "busy") {
                                  suffix = " • ocupado";
                                  variant = "danger";
                                } else if (slot.reason === "lunch") {
                                  suffix = " • intervalo";
                                  variant = "warning";
                                } else if (slot.reason === "outside-working-hours") {
                                  suffix = " • fora da escala";
                                  variant = "muted";
                                }
                              }

                              return {
                                value: slot.time,
                                label: slot.time + suffix,
                                disabled: optDisabled,
                                variant,
                              };
                            });

                            const timePlaceholder = !canSelectTime
                              ? "Selecione data, serviço e profissional"
                              : !hasAnySlots
                              ? "Nenhum horário disponível"
                              : hasFreeSlots
                              ? "Selecione o horário"
                              : "Nenhum horário livre";

                            return (
                              <div
                                key={idx}
                                className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,2fr)_auto] gap-2 items-end"
                              >
                                <FormItem>
                                  <FormLabel className="text-xs text-muted-foreground">
                                    Serviço
                                  </FormLabel>
                                  <FormControl>
                                    <Combobox
                                      value={serviceId}
                                      onChange={(val) => {
                                        updateServiceAtIndex(idx, {
                                          service_id: val != null ? Number(val) : "",
                                          start_time: "",
                                        });
                                      }}
                                      options={serviceOptions}
                                      placeholder="Selecione um serviço"
                                      searchPlaceholder="Buscar serviço..."
                                      emptyMessage="Nenhum serviço encontrado."
                                    />
                                  </FormControl>
                                </FormItem>

                                <FormItem>
                                  <FormLabel className="text-xs text-muted-foreground">
                                    Profissional
                                  </FormLabel>
                                  <FormControl>
                                    <Combobox
                                      value={professionalId}
                                      onChange={(val) => {
                                        updateServiceAtIndex(idx, {
                                          professional_id: val != null ? Number(val) : "",
                                          start_time: "",
                                        });
                                      }}
                                      options={professionalOptions}
                                      placeholder="Selecione um profissional"
                                      searchPlaceholder="Buscar profissional..."
                                      emptyMessage="Nenhum profissional encontrado."
                                    />
                                  </FormControl>
                                </FormItem>

                                <FormItem>
                                  <FormLabel className="text-xs text-muted-foreground">
                                    Horário
                                  </FormLabel>
                                  <FormControl>
                                    <Combobox
                                      value={svc.start_time || null}
                                      onChange={(val) => {
                                        const chosen = slots.find((s) => s.time === val);

                                        if (!chosen || !chosen.isFree) {
                                          toast({
                                            title: "Horário indisponível",
                                            description: "Selecione um horário livre para este serviço.",
                                            variant: "destructive",
                                          });
                                          return;
                                        }

                                        updateServiceAtIndex(idx, {
                                          start_time: (val as string) || "",
                                        });
                                      }}
                                      options={timeOptions}
                                      placeholder={timePlaceholder}
                                      searchPlaceholder="Buscar horário..."
                                      emptyMessage="Nenhum horário disponível."
                                      disabled={!hasAnySlots}
                                    />
                                  </FormControl>
                                </FormItem>

                                <div className="flex md:justify-end">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive"
                                    onClick={() => removeServiceAtIndex(idx)}
                                    title="Remover serviço"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              field.onChange([
                                ...servicesValue,
                                {
                                  service_id: "",
                                  professional_id: "",
                                  start_time: "",
                                },
                              ])
                            }
                          >
                            + Adicionar serviço
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FormItem className="flex flex-col">
                      <FormLabel>Duração total (min)</FormLabel>
                      <Input value={totalDuration} readOnly />
                    </FormItem>
                  </div>
                  <div>
                    <FormItem className="flex flex-col">
                      <FormLabel>Preço total (R$)</FormLabel>
                      <Input value={totalPrice.toFixed(2)} readOnly />
                    </FormItem>                      
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Observações sobre o agendamento"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingAppointment ? "Salvar" : "Criar"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este agendamento? Esta ação não
                pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AppointmentCheckoutDialog
          open={checkoutDialogOpen}
          onOpenChange={setCheckoutDialogOpen}
          appointmentId={checkoutAppointmentId}
        />
      </div>
    </TooltipProvider>
  );
}
