import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/DataTable';
import { Plus, Edit, Trash2, DollarSign, Calendar as CalendarIcon, Printer, Table, List, Check, X } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
import { AppointmentCheckoutDialog } from '@/components/AppointmentCheckoutDialog';
import { MonthlyAvailabilityCalendar } from '@/components/MonthlyAvailabilityCalendar';
import { CompactAppointmentList } from '@/components/CompactAppointmentList';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useAppointmentsQuery, useCreateAppointment, useUpdateAppointment, useDeleteAppointment } from '@/hooks/appointments';
import { useCustomersQuery } from '@/hooks/customers';
import { useProfessionalsQuery } from '@/hooks/professionals';
import { useServicesQuery } from '@/hooks/services';

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
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
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
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
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
  status: AppointmentBackend['status'];
  notes?: string;
  price?: number;
}

const appointmentSchema = z.object({
  customer_id: z.union([z.number(), z.string()]).pipe(z.coerce.number()),
  professionals_ids: z.array(z.union([z.number(), z.string()]).pipe(z.coerce.number())).min(1, 'Selecione pelo menos um profissional'),
  services_ids: z.array(z.union([z.number(), z.string()]).pipe(z.coerce.number())).min(1, 'Selecione ao menos um serviço'),
  date: z.date({ required_error: 'Data é obrigatória' }),
  time: z.string().min(1, 'Horário é obrigatório'),
  status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show']),
  notes: z.string().trim().max(500, 'Observações muito longas').optional(),
});

type FormValues = z.infer<typeof appointmentSchema>;

const generateTimeSlots = () => {
  const slots: string[] = [];
  for (let hour = 8; hour <= 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === 18 && minute > 0) break;
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
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
  if (!selectedDate || !duration || selectedProfessionalIds.length === 0) return true;

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const [hours, minutes] = timeSlot.split(':').map(Number);
  const slotStart = hours * 60 + minutes;
  const slotEnd = slotStart + duration;

  return selectedProfessionalIds.every((profId) => {
    const proApts = allAppointments.filter((apt) => {
      const sameDay = apt.date === dateStr;
      const hasProf =
        (apt.professionals || []).some((p) => Number(p.id) === Number(profId));
      const notSelf = String(apt.id) !== String(currentAppointmentId ?? '');
      const notCancelled = apt.status !== 'cancelled';
      return sameDay && hasProf && notSelf && notCancelled;
    });

    return proApts.every((apt) => {
      const [aptHours, aptMinutes] = (apt.start_time || '00:00').split(':').map(Number);
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
  emptyLabel = 'Nada encontrado',
  searchPlaceholder = 'Buscar...',
}: {
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
                const isSelected = value.some((v) => String(v) === String(opt.value));
                return (
                  <CommandItem
                    key={String(opt.value)}
                    value={String(opt.label)}
                    onSelect={() => toggle(opt.value)}
                    className="flex items-center justify-between"
                  >
                    <span>{opt.label}</span>
                    {isSelected ? <Check className="h-4 w-4 opacity-100" /> : <X className="h-4 w-4 opacity-30" />}
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

  const { data: appointmentsResp } = useAppointmentsQuery({ page: 1, perPage: 50 });
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
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<AppointmentBackend | null>(null);
  const [deletingAppointmentId, setDeletingAppointmentId] = useState<ID | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'calendar' | 'list'>('table');

  const form = useForm<FormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      customer_id: undefined as unknown as number,
      professionals_ids: [],
      services_ids: [],
      time: '',
      status: 'scheduled',
      notes: '',
    },
  });

  const customerById = useMemo(() => new Map(customers.map((c) => [Number(c.id), c])), [customers]);
  const professionalById = useMemo(
    () => new Map(professionals.map((p) => [Number(p.id), p])),
    [professionals]
  );
  const serviceById = useMemo(() => new Map(services.map((s) => [Number(s.id), s])), [services]);

  const selectedServiceObjects = useMemo(
    () => (form.watch('services_ids') || []).map((id) => serviceById.get(Number(id))).filter(Boolean) as Service[],
    [services, serviceById, form.watch('services_ids')]
  );

  const totalDuration = useMemo(
    () => selectedServiceObjects.reduce((sum, s) => sum + Number(s.duration || 0), 0),
    [selectedServiceObjects]
  );

  const totalPrice = useMemo(
    () => selectedServiceObjects.reduce((sum, s) => sum + Number(s.price || 0), 0),
    [selectedServiceObjects]
  );

  const handleOpenDialog = (apt?: AppointmentBackend, prefilledDate?: Date) => {
    if (apt) {
      setEditingAppointment(apt);
      const defaultServicesIds = (apt.services || []).map((s) => Number(s.id));
      const defaultProfessionalsIds = (apt.professionals || []).map((p) => Number(p.id));
      const d = apt.date ? new Date(`${apt.date}T00:00:00`) : undefined;
      const toHHmm = (hhmmss?: string | null) => (hhmmss ? hhmmss.slice(0, 5) : '');

      form.reset({
        customer_id: Number(apt.customer?.id ?? 0),
        professionals_ids: defaultProfessionalsIds,
        services_ids: defaultServicesIds,
        date: d as Date,
        time: toHHmm(apt.start_time),
        status: apt.status,
        notes: apt.notes ?? '',
      });
    } else {
      setEditingAppointment(null);
      form.reset({
        customer_id: undefined as unknown as number,
        professionals_ids: [],
        services_ids: [],
        date: prefilledDate as Date | undefined,
        time: '',
        status: 'scheduled',
        notes: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCalendarDayClick = (date: Date) => {
    if (!can('appointments', 'create')) return;
    handleOpenDialog(undefined, date);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAppointment(null);
    form.reset();
  };

  const availableSlots = useMemo(() => {
    const d = form.watch('date');
    const proIds = form.watch('professionals_ids') || [];
    const duration = totalDuration > 0 ? totalDuration : undefined;
    return getAvailableTimeSlots(appointments, d, proIds, duration, editingAppointment?.id);
  }, [appointments, form.watch('date'), form.watch('professionals_ids'), totalDuration, editingAppointment?.id]);

  const buildPayload = (values: FormValues) => {
    const dateStr = format(values.date, 'yyyy-MM-dd');
    const start_time = `${values.time}:00`;

    const servicesPayload = (values.services_ids || []).map((sid) => {
      const s = serviceById.get(Number(sid));
      return {
        id: Number(sid),
        service_price: String(s?.price ?? '0'),
        commission_type: null,
        commission_value: '0',
        professional_id: null,
      };
    });

    const professionalsPayload = (values.professionals_ids || []).map((pid) => ({
      id: Number(pid),
      commission_percentage: null,
      commission_fixed: null,
    }));

    const payload = {
      customer_id: Number(values.customer_id),
      date: dateStr,
      start_time,
      duration: totalDuration,
      status: values.status,
      notes: values.notes || null,
      total_price: totalPrice.toFixed(2),
      discount_amount: '0.00',
      final_price: totalPrice.toFixed(2),
      services: servicesPayload,
      professionals: professionalsPayload,
    };

    return payload;
  };

  const onSubmit = async (values: FormValues) => {
    if ((values.services_ids || []).length === 0) {
      toast({ title: 'Selecione ao menos um serviço', variant: 'destructive' });
      return;
    }
    if ((values.professionals_ids || []).length === 0) {
      toast({ title: 'Selecione ao menos um profissional', variant: 'destructive' });
      return;
    }

    const payload = buildPayload(values);

    try {
      if (editingAppointment) {
        const { updateAppointment: updateFn } = await import('@/services/appointmentsService');
        await updateFn(Number(editingAppointment.id), payload);
        toast({ title: 'Agendamento atualizado com sucesso.' });
      } else {
        await createAppointment.mutateAsync(payload);
        toast({ title: 'Agendamento criado com sucesso.' });
      }
      setIsDialogOpen(false);
      setEditingAppointment(null);
      form.reset();
    } catch (e: any) {
      toast({
        title: 'Erro ao salvar agendamento',
        description: e?.message ?? 'Tente novamente.',
        variant: 'destructive',
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
      toast({ title: 'Agendamento excluído.' });
    } catch (e: any) {
      toast({
        title: 'Não foi possível excluir',
        description: e?.message ?? 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingAppointmentId(null);
    }
  };

  const toLegacy = (apt: AppointmentBackend): AppointmentLegacy => {
    const customerName = apt.customer?.name ?? 'Cliente';
    const customerPhone = (apt.customer as any)?.phone ?? undefined;

    const servicesNames = (apt.services || []).map((s) => s.name).join(', ');
    const profIds = (apt.professionals || []).map((p) => String(p.id));
    const time = (apt.start_time || '').slice(0, 5);

    return {
      id: String(apt.id),
      client: customerName,
      clientPhone: customerPhone,
      service: servicesNames,
      professionals: profIds,
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
    client: apt.customer?.name ?? 'Cliente',
    clientPhone: (apt.customer as any)?.phone ?? undefined,
    service: (apt.services || []).map((s) => s.name).join(', '),
    professionals: (apt.professionals || []).map((p) => String(p.id)),
    date: apt.date,
    time: (apt.start_time || '').slice(0, 5),
    duration: apt.duration ?? undefined,
    status: apt.status,
    notes: apt.notes ?? undefined,
    price: apt.total_price ?? undefined,
  });

  const handleCheckout = (apt: AppointmentBackend) => {
    const legacy = toLegacy(apt);
    setCheckoutAppointment(legacy);
    setCheckoutDialogOpen(true);
  };

  const printAppointmentReceipt = (apt: AppointmentBackend) => {
    const legacy = toLegacy(apt);

    const professionalNames = (apt.professionals || [])
      .map((p) => p.name)
      .filter(Boolean)
      .join(', ');

    const date = new Date(legacy.date);
    const formattedDate = date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      weekday: 'long',
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: 'Erro',
        description: 'Não foi possível abrir a janela de impressão. Verifique se pop-ups não estão bloqueados.',
        variant: 'destructive',
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
              ${legacy.clientPhone ? `
                <div class="info-item">
                  <div class="info-label">Telefone</div>
                  <div class="info-value">${legacy.clientPhone}</div>
                </div>
              ` : ''}
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
              ${legacy.duration ? `
                <div class="info-item">
                  <div class="info-label">Duração</div>
                  <div class="info-value">${legacy.duration} minutos</div>
                </div>
              ` : ''}
              <div class="info-item">
                <div class="info-label">Status</div>
                <div class="info-value">
                  <span class="status-badge status-${legacy.status}">
                    ${legacy.status === 'scheduled' ? 'Agendado' :
                      legacy.status === 'confirmed' ? 'Confirmado' :
                      legacy.status === 'completed' ? 'Concluído' :
                      legacy.status === 'cancelled' ? 'Cancelado' : legacy.status}
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
                <div class="info-value">${legacy.service || '-'}</div>
              </div>
              <div class="info-item full-width">
                <div class="info-label">Profissional(is)</div>
                <div class="info-value">${professionalNames || 'Não especificado'}</div>
              </div>
            </div>
          </div>

          ${legacy.price ? `
            <div class="section">
              <div class="section-title">Valores</div>
              <div class="info-item" style="text-align: center; padding: 20px;">
                <div class="info-label">Valor Total</div>
                <div class="price-highlight">R$ ${Number(legacy.price).toFixed(2)}</div>
              </div>
            </div>
          ` : ''}

          ${legacy.notes ? `
            <div class="section">
              <div class="section-title">Observações</div>
              <div class="notes-box">
                ${legacy.notes}
              </div>
            </div>
          ` : ''}

          <div class="footer">
            <p><strong>Studio Unhas Delicadas - Michele Fonseca e Equipe</strong></p>
            <p>Comanda impressa em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
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
      case 'scheduled':
        return 'secondary';
      case 'confirmed':
        return 'default';
      case 'completed':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Agendado';
      case 'confirmed':
        return 'Confirmado';
      case 'completed':
        return 'Concluído';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const columns = [
    {
      key: 'customer',
      header: 'Cliente',
      render: (apt: AppointmentBackend) => apt.customer?.name ?? '-',
    },
    {
      key: 'services',
      header: 'Serviços',
      render: (apt: AppointmentBackend) =>
        (apt.services || []).map((s) => s.name).join(', ') || '-',
    },
    {
      key: 'professionals',
      header: 'Profissionais',
      render: (apt: AppointmentBackend) => {
        const names = (apt.professionals || []).map((p) => p.name).filter(Boolean);
        if (names.length === 0) return '-';
        if (names.length === 1) return names[0];
        return (
          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary">{names[0]}</Badge>
            {names.length > 1 && <Badge variant="outline">+{names.length - 1}</Badge>}
          </div>
        );
      },
    },
    {
      key: 'date',
      header: 'Data',
      render: (apt: AppointmentBackend) => {
        const d = apt.date ? new Date(`${apt.date}T00:00:00`) : null;
        return d ? d.toLocaleDateString('pt-BR') : '-';
      },
    },
    {
      key: 'time',
      header: 'Horário',
      render: (apt: AppointmentBackend) => (apt.start_time || '').slice(0, 5),
    },
    {
      key: 'status',
      header: 'Status',
      render: (apt: AppointmentBackend) => (
        <Badge variant={getStatusVariant(apt.status)}>{getStatusLabel(apt.status)}</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
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
          {(apt.status === 'scheduled' || apt.status === 'confirmed') && can('appointments', 'update') && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleCheckout(apt)}
              title="Finalizar Atendimento"
            >
              <DollarSign className="h-4 w-4 text-success" />
            </Button>
          )}
          {can('appointments', 'update') && (
            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(apt)}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {can('appointments', 'delete') && (
            <Button variant="ghost" size="icon" onClick={() => handleDelete(apt.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const customerOptions: { value: ID; label: string }[] = customers.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const professionalOptions: { value: ID; label: string }[] = professionals.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const serviceOptions: { value: ID; label: string }[] = services.map((s) => ({
    value: s.id,
    label: `${s.name} • ${s.duration}min • R$ ${Number(s.price).toFixed(2)}`,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Agendamentos</h1>
          <p className="text-sm md:text-base text-muted-foreground">Gerencie os agendamentos do salão</p>
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          <div className="flex gap-1 border rounded-lg p-1">
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="text-xs md:text-sm hidden md:flex"
            >
              <Table className="h-4 w-4 mr-2" />
              Tabela
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="text-xs md:text-sm flex-1 md:flex-none"
            >
              <List className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
              <span className="md:inline">Lista</span>
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="text-xs md:text-sm flex-1 md:flex-none"
            >
              <CalendarIcon className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
              <span className="md:inline">Calendário</span>
            </Button>
          </div>
          {can('appointments', 'create') && (
            <Button className="shadow-md text-xs md:text-sm h-8 md:h-10" onClick={() => handleOpenDialog()}>
              <Plus className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
              <span className="hidden sm:inline">Novo Agendamento</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          )}
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <MonthlyAvailabilityCalendar
          professionals={professionals.map((p) => ({
            id: String(p.id),
            name: p.name,
          }))}
          appointments={appointments.map(toLegacyAppointment)}
          onDayClick={can('appointments', 'create') ? handleCalendarDayClick : undefined}
        />
      ) : viewMode === 'list' ? (
        <CompactAppointmentList
          appointments={appointments.map(toLegacyAppointment)}
          professionals={professionals.map((p) => ({ id: String(p.id), name: p.name }))}
          onEdit={can('appointments', 'update') ? (a) => handleOpenDialog(undefined, new Date(a.date)) : undefined}
          onDelete={can('appointments', 'delete') ? (id) => handleDelete(id) : undefined}
          onCheckout={can('appointments', 'update') ? (a) => handleCheckout(appointments.find((x) => String(x.id) === a.id)!) : undefined}
          onPrint={(a) => {
            const apt = appointments.find((x) => String(x.id) === a.id);
            if (apt) printAppointmentReceipt(apt);
          }}
          canEdit={can('appointments', 'update')}
          canDelete={can('appointments', 'delete')}
        />
      ) : (
        <DataTable
          data={appointments}
          columns={columns}
          searchPlaceholder="Buscar agendamentos..."
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}</DialogTitle>
            <DialogDescription>Preencha os dados do agendamento. Campos marcados são obrigatórios.</DialogDescription>
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
                          <SelectItem key={String(opt.value)} value={String(opt.value)}>
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
                name="professionals_ids"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profissionais *</FormLabel>
                    <MultiSelect
                      value={field.value || []}
                      onChange={(next) => field.onChange(next)}
                      options={professionalOptions}
                      placeholder="Selecione profissional(is)"
                      searchPlaceholder="Buscar profissional..."
                      emptyLabel="Nenhum profissional encontrado"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="services_ids"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serviços *</FormLabel>
                    <MultiSelect
                      value={field.value || []}
                      onChange={(next) => field.onChange(next)}
                      options={serviceOptions}
                      placeholder="Selecione serviço(s)"
                      searchPlaceholder="Buscar serviço..."
                      emptyLabel="Nenhum serviço encontrado"
                    />
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
                                'pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? format(field.value, 'PPP', { locale: ptBR }) : <span>Selecione a data</span>}
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
                    const selectedDate = form.watch('date');
                    const selectedProfessionals = form.watch('professionals_ids');
                    const duration = totalDuration > 0 ? totalDuration : undefined;
                    const slots = getAvailableTimeSlots(
                      appointments,
                      selectedDate,
                      selectedProfessionals || [],
                      duration,
                      editingAppointment?.id
                    );

                    return (
                      <FormItem>
                        <FormLabel>Horário *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!selectedDate || (selectedProfessionals || []).length === 0 || !duration}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um horário" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {slots.length === 0 ? (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">Nenhum horário disponível</div>
                            ) : (
                              slots.map((slot) => (
                                <SelectItem key={slot} value={slot}>
                                  {slot}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {!selectedDate && <p className="text-sm text-muted-foreground">Selecione uma data primeiro</p>}
                        {selectedDate && (selectedProfessionals || []).length === 0 && (
                          <p className="text-sm text-muted-foreground">Selecione ao menos um profissional</p>
                        )}
                        {selectedDate && (selectedProfessionals || []).length > 0 && !duration && (
                          <p className="text-sm text-muted-foreground">Selecione ao menos um serviço (para definir a duração)</p>
                        )}
                        {selectedDate && (selectedProfessionals || []).length > 0 && duration && slots.length === 0 && (
                          <p className="text-sm text-destructive">Sem horários disponíveis para esta data</p>
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
                      <Textarea placeholder="Observações sobre o agendamento" className="resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit">{editingAppointment ? 'Salvar' : 'Criar'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AppointmentCheckoutDialog
        open={checkoutDialogOpen}
        onOpenChange={setCheckoutDialogOpen}
        appointment={checkoutAppointment}
      />
    </div>
  );
}
