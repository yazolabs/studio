import { AppointmentCheckoutDialog } from "@/components/AppointmentCheckoutDialog";
import { CompactAppointmentList } from "@/components/CompactAppointmentList";
import { DataTable } from "@/components/DataTable";
import { MonthlyAvailabilityCalendar } from "@/components/MonthlyAvailabilityCalendar";
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
import { useAppointmentsQuery, useCreateAppointment, useUpdateAppointment, useDeleteAppointment, useAppointmentQuery } from "@/hooks/appointments";
import { useCustomersQuery } from "@/hooks/customers";
import { useProfessionalsQuery } from "@/hooks/professionals";
import { useServicesQuery } from "@/hooks/services";
import { usePermission } from "@/hooks/usePermission";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Edit, Trash2, DollarSign, Calendar as CalendarIcon, Printer, Table, List, Check, X, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useIsMobile } from "@/hooks/use-mobile";

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

interface Professional {
  id: ID;
  name: string;
}

interface Service {
  id: ID;
  name: string;
  price: number;
  duration: number;
  commission_type: string;
  commission_value: number;
}

interface AppointmentServicePivot {
  id: ID;
  name: string;
  service_price: number;
  commission_type?: string | null;
  commission_value?: number | null;
  professional_id?: ID | null;
  duration?: number | null;
}

interface AppointmentItemPivot {
  id: ID;
  name: string;
  price: number;
  quantity: number;
}

interface AppointmentBackend {
  id: ID;
  customer?: Customer;
  professionals?: Professional[];
  services?: AppointmentServicePivot[];
  items?: AppointmentItemPivot[];
  date: string;
  start_time: string;
  end_time?: string | null;
  duration?: number | null;
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show" | "rescheduled";
  total_price?: number | null;
  discount_amount?: number | null;
  final_price?: number | null;
  notes?: string | null;
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
  notes?: string;
  price?: number;
}

const appointmentSchema = z.object({
  customer_id: z.union([z.number(), z.string()]).pipe(z.coerce.number()),
  services: z
    .array(
      z.object({
        service_id: z.union([z.number(), z.string()]).pipe(z.coerce.number()),
        professional_id: z
          .union([z.number(), z.string()])
          .pipe(z.coerce.number()),
        commission_type: z.string().optional(),
        commission_value: z.string().optional(),
      })
    )
    .min(1, "Selecione ao menos um serviço e profissional"),
  date: z.date({ required_error: "Data é obrigatória" }),
  time: z.string().min(1, "Horário é obrigatório"),
  status: z.enum([
    "scheduled",
    "confirmed",
    "completed",
    "cancelled",
    "no_show",
    "rescheduled",
  ]),
  notes: z.string().trim().max(500, "Observações muito longas").optional(),
});

type FormValues = z.infer<typeof appointmentSchema>;

const generateTimeSlots = () => {
  const slots: string[] = [];
  for (let hour = 8; hour <= 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === 18 && minute > 0) break;
      const timeStr = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      slots.push(timeStr);
    }
  }
  return slots;
};

const isTimeSlotAvailable = (
  allAppointments: AppointmentBackend[],
  selectedDate: Date | undefined,
  timeSlot: string,
  duration: number | undefined,
  selectedProfessionalIds: ID[],
  currentAppointmentId?: ID
): boolean => {
  if (!selectedDate || !duration || selectedProfessionalIds.length === 0)
    return true;

  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const [hours, minutes] = timeSlot.split(":").map(Number);
  const slotStart = hours * 60 + minutes;
  const slotEnd = slotStart + duration;

  return selectedProfessionalIds.every((profId) => {
    const proApts = allAppointments.filter((apt) => {
      const sameDay = apt.date === dateStr;
      const hasProf = (apt.professionals || []).some(
        (p) => Number(p.id) === Number(profId)
      );
      const notSelf = String(apt.id) !== String(currentAppointmentId ?? "");
      const notCancelled = apt.status !== "cancelled";
      return sameDay && hasProf && notSelf && notCancelled;
    });

    return proApts.every((apt) => {
      const [aptHours, aptMinutes] = (apt.start_time || "00:00")
        .split(":")
        .map(Number);
      const aptStart = aptHours * 60 + aptMinutes;
      const aptDur = Number(apt.duration || 0);
      const aptEnd = aptStart + aptDur;

      const safeAptEnd = aptDur > 0 ? aptEnd : aptStart + 30;

      return slotEnd <= aptStart || slotStart >= safeAptEnd;
    });
  });
};

const getAvailableTimeSlots = (
  allAppointments: AppointmentBackend[],
  selectedDate: Date | undefined,
  selectedProfessionalIds: ID[],
  duration: number | undefined,
  currentAppointmentId?: ID
): string[] => {
  if (!selectedDate || selectedProfessionalIds.length === 0) {
    return generateTimeSlots();
  }
  const allSlots = generateTimeSlots();
  return allSlots.filter((slot) =>
    isTimeSlotAvailable(
      allAppointments,
      selectedDate,
      slot,
      duration,
      selectedProfessionalIds,
      currentAppointmentId
    )
  );
};

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
      <PopoverContent className="p-0 w-[320px]">
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
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-9 w-full justify-between text-xs"
        >
          <span
            className={cn(
              "truncate",
              !selectedLabel && "text-muted-foreground"
            )}
          >
            {selectedLabel || placeholder}
          </span>
          <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[260px]">
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

  const { data: appointmentsResp } = useAppointmentsQuery({
    page: 1,
    perPage: 50,
  });
  const { data: customersResp } = useCustomersQuery();
  const { data: professionalsResp } = useProfessionalsQuery();
  const { data: servicesResp } = useServicesQuery();

  const createAppointment = useCreateAppointment();
  const updateAppointment = useUpdateAppointment(0 as any);
  const deleteAppointment = useDeleteAppointment();

  const appointments: AppointmentBackend[] = useMemo(() => {
    const maybe = (appointmentsResp as any)?.data ?? appointmentsResp ?? [];
    return Array.isArray(maybe) ? maybe : [];
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

  const [checkoutAppointment, setCheckoutAppointment] = useState<AppointmentLegacy | null>(null);
  const [checkoutAppointmentId, setCheckoutAppointmentId] = useState<number | null>(null);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<AppointmentBackend | null>(null);
  const [deletingAppointmentId, setDeletingAppointmentId] = useState<ID | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "calendar" | "list">(() => {
    if (typeof window === "undefined") {
      return "table";
    }

    const stored = window.localStorage.getItem("appointments_view_mode");

    if (stored === "table" || stored === "calendar" || stored === "list") {
      return stored;
    }

    return "table";
  });
  const [statusFilter, setStatusFilter] = useState<"all" | AppointmentBackend["status"]>("all");
  const [customerFilter, setCustomerFilter] = useState<ID | "all">("all");
  const [professionalFilter, setProfessionalFilter] = useState<ID | "all">("all");
  const [serviceFilter, setServiceFilter] = useState<ID | "all">("all");
  const [dateFromFilter, setDateFromFilter] = useState<Date | null>(null);
  const [dateToFilter, setDateToFilter] = useState<Date | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const effectiveViewMode = isMobile && viewMode === "table" ? "list" : viewMode;

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("appointments_view_mode", viewMode);
    } catch {
    }
  }, [viewMode]);

  const { data: fullAppointmentData, isLoading: loadingFullAppointment } =
    useAppointmentQuery(checkoutAppointmentId ?? 0, !!checkoutAppointmentId);

  const form = useForm<FormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      customer_id: undefined as unknown as number,
      services: [],
      time: "",
      status: "scheduled",
      notes: "",
    },
  });

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

  const handleOpenDialog = (apt?: AppointmentBackend, prefilledDate?: Date) => {
    if (apt) {
      setEditingAppointment(apt);
      const defaultServices = (apt.services || []).map((s) => ({
        service_id: Number(s.id),
        professional_id: Number(s.professional_id ?? 0),
      }));
      const d = apt.date ? new Date(`${apt.date}T00:00:00`) : undefined;
      const toHHmm = (hhmmss?: string | null) =>
        hhmmss ? hhmmss.slice(0, 5) : "";

      form.reset({
        customer_id: Number(apt.customer?.id ?? 0),
        services: defaultServices,
        date: d as Date,
        time: toHHmm(apt.start_time),
        status: apt.status,
        notes: apt.notes ?? "",
      });
    } else {
      setEditingAppointment(null);
      form.reset({
        customer_id: undefined as unknown as number,
        services: [],
        date: prefilledDate as Date | undefined,
        time: "",
        status: "scheduled",
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

  const watchedDate = form.watch("date");
  const watchedServices = form.watch("services") || [];

  const selectedProfessionalIds = useMemo<number[]>(() => {
    const ids = (
      watchedServices as Array<{ professional_id?: number | string | null }>
    )
      .map((s) =>
        s?.professional_id != null ? Number(s.professional_id) : NaN
      )
      .filter((n) => Number.isFinite(n)) as number[];
    return [...ids];
  }, [watchedServices]);

  const availableSlots = useMemo(() => {
    const duration = totalDuration > 0 ? totalDuration : undefined;
    return getAvailableTimeSlots(
      appointments,
      watchedDate,
      selectedProfessionalIds,
      duration,
      editingAppointment?.id
    );
  }, [
    appointments,
    watchedDate,
    selectedProfessionalIds,
    totalDuration,
    editingAppointment?.id,
  ]);

  const buildPayload = (values: FormValues) => {
    const dateStr = format(values.date, "yyyy-MM-dd");
    const start_time = `${values.time}:00`;

    const servicesPayload = values.services.map((s) => {
      const svc = serviceById.get(Number(s.service_id));
      return {
        id: Number(s.service_id),
        service_price: String(svc?.price ?? "0"),
        commission_type: (svc?.commission_type ?? "percentage") as "percentage" | "fixed",
        commission_value: String(svc?.commission_value ?? "0"),
        professional_id: Number(s.professional_id),
      };
    });

    return {
      customer_id: Number(values.customer_id),
      date: dateStr,
      start_time,
      duration: servicesPayload.reduce(
        (sum, s) => sum + (serviceById.get(Number(s.id))?.duration || 0),
        0
      ),
      status: values.status,
      notes: values.notes || null,
      total_price: servicesPayload
        .reduce((sum, s) => sum + Number(s.service_price || 0), 0)
        .toFixed(2),
      discount_amount: "0.00",
      final_price: servicesPayload
        .reduce((sum, s) => sum + Number(s.service_price || 0), 0)
        .toFixed(2),
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
      (s) => !s.service_id || !s.professional_id
    );

    if (hasIncomplete) {
      toast({
        title: "Preencha todos os serviços",
        description: "Cada linha precisa de um serviço e um profissional selecionados.",
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
        toast({ title: "Agendamento atualizado com sucesso." });
      } else {
        await createAppointment.mutateAsync(payload);
        toast({ title: "Agendamento criado com sucesso." });
      }
      setIsDialogOpen(false);
      setEditingAppointment(null);
      form.reset();
    } catch (e: any) {
      toast({
        title: "Erro ao salvar agendamento",
        description: e?.message ?? "Tente novamente.",
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
      notes: apt.notes ?? undefined,
      price: apt.total_price ?? undefined,
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
    notes: apt.notes ?? undefined,
    price: apt.total_price ?? undefined,
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

  const getStatusVariant = (status: string) => {
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
        return "destructive";
      case "rescheduled":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
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
        return "Não Compareceu";
      case "rescheduled":
        return "Reagendado";
      default:
        return status;
    }
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

  const getStatusBadgeClasses = (status: AppointmentBackend["status"]) => {
    switch (status) {
      case "scheduled":
        return "bg-amber-50 text-amber-800 border border-amber-200";
      case "confirmed":
        return "bg-sky-50 text-sky-800 border border-sky-200";
      case "completed":
        return "bg-emerald-50 text-emerald-800 border border-emerald-200";
      case "cancelled":
        return "bg-rose-50 text-rose-700 border border-rose-200";
      case "no_show":
        return "bg-slate-100 text-slate-600 border border-slate-200 line-through";
      case "rescheduled":
        return "bg-violet-50 text-violet-800 border border-violet-200";
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
          className={cn(
            "px-2 py-0.5 text-xs font-medium rounded-full",
            getStatusBadgeClasses(apt.status)
          )}
        >
          {getStatusLabel(apt.status)}
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
              <Edit className="h-4 w-4" />
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
    label: `${s.name} • ${s.duration}min • R$ ${Number(s.price).toFixed(2)}`,
  }));

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
    customerFilter,
    professionalFilter,
    serviceFilter,
  ]);

  const hasActiveFilters =
    statusFilter !== "all" ||
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
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-2 mt-2">
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
                    <Select
                      value={
                        serviceFilter === "all" ? "all" : String(serviceFilter)
                      }
                      onValueChange={(v) =>
                        setServiceFilter(v === "all" ? "all" : Number(v))
                      }
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {serviceOptions.map((opt) => (
                          <SelectItem
                            key={String(opt.value)}
                            value={String(opt.value)}
                          >
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            {effectiveViewMode === "list" ? (
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
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAppointment ? "Editar Agendamento" : "Novo Agendamento"}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados do agendamento. Campos marcados são
                obrigatórios.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="customer_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente *</FormLabel>
                      <Select
                        value={field.value ? String(field.value) : undefined}
                        onValueChange={(v) => field.onChange(Number(v))}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o cliente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customerOptions.map((opt) => (
                            <SelectItem
                              key={String(opt.value)}
                              value={String(opt.value)}
                            >
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="services"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serviços e Profissionais *</FormLabel>
                      <div className="space-y-3">
                        {(field.value || []).map((svc, idx) => (
                          <div key={idx} className="grid grid-cols-2 gap-2">
                            <Select
                              value={svc.service_id ? String(svc.service_id) : undefined}
                              onValueChange={(v) => {
                                const updated = [...(field.value || [])];
                                updated[idx].service_id = Number(v);
                                field.onChange(updated);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="--- Selecione um serviço ---" />
                              </SelectTrigger>
                              <SelectContent>
                                {serviceOptions.map((opt) => (
                                  <SelectItem
                                    key={opt.value}
                                    value={String(opt.value)}
                                  >
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <div className="flex gap-2">
                              <Select
                                value={svc.professional_id ? String(svc.professional_id) : undefined}
                                onValueChange={(v) => {
                                  const updated = [...(field.value || [])];
                                  updated[idx].professional_id = Number(v);
                                  field.onChange(updated);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="--- Selecione um profissional ---" />
                                </SelectTrigger>
                                <SelectContent>
                                  {professionalOptions.map((opt) => (
                                    <SelectItem
                                      key={opt.value}
                                      value={String(opt.value)}
                                    >
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="shrink-0 text-destructive"
                                onClick={() => {
                                  const updated = (field.value || []).filter((_, i) => i !== idx);
                                  field.onChange(updated);
                                }}
                                title="Remover serviço"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            field.onChange([
                              ...(field.value || []),
                              {
                                service_id: "",
                                professional_id: "",
                              },
                            ])
                          }
                        >
                          + Adicionar serviço
                        </Button>
                      </div>
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
                        <FormLabel>Data *</FormLabel>
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
                                  format(field.value, "PPP", { locale: ptBR })
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
                                const today = new Date(
                                  new Date().setHours(0, 0, 0, 0)
                                );
                                return date < today;
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
                    name="time"
                    render={({ field }) => {
                      const selectedDate = form.watch("date");
                      const selectedServices = form.watch("services") || [];
                      const selectedProfessionalIds = selectedServices
                        .map((s) => Number(s.professional_id))
                        .filter((id) => !!id);

                      const duration =
                        totalDuration > 0 ? totalDuration : undefined;
                      const slots = getAvailableTimeSlots(
                        appointments,
                        selectedDate,
                        selectedProfessionalIds,
                        duration,
                        editingAppointment?.id
                      );

                      return (
                        <FormItem>
                          <FormLabel>Horário *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={
                              !selectedDate ||
                              selectedProfessionalIds.length === 0 ||
                              !duration
                            }
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um horário" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {slots.length === 0 ? (
                                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                  Nenhum horário disponível
                                </div>
                              ) : (
                                slots.map((slot) => (
                                  <SelectItem key={slot} value={slot}>
                                    {slot}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          {!selectedDate && (
                            <p className="text-sm text-muted-foreground">
                              Selecione uma data primeiro
                            </p>
                          )}
                          {selectedDate &&
                            selectedProfessionalIds.length === 0 && (
                              <p className="text-sm text-muted-foreground">
                                Selecione ao menos um profissional (em cada
                                serviço)
                              </p>
                            )}
                          {selectedDate &&
                            selectedProfessionalIds.length > 0 &&
                            !duration && (
                              <p className="text-sm text-muted-foreground">
                                Selecione ao menos um serviço (para definir a
                                duração)
                              </p>
                            )}
                          {selectedDate &&
                            selectedProfessionalIds.length > 0 &&
                            duration &&
                            slots.length === 0 && (
                              <p className="text-sm text-destructive">
                                Sem horários disponíveis para esta data
                              </p>
                            )}
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FormLabel>Duração total (min)</FormLabel>
                    <Input value={totalDuration} readOnly />
                  </div>
                  <div>
                    <FormLabel>Preço total (R$)</FormLabel>
                    <Input value={totalPrice.toFixed(2)} readOnly />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
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
