import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/DataTable";
import { Plus, Edit, Trash2, Calendar as CalendarIcon, X } from "lucide-react";
import { usePermission } from "@/hooks/usePermission";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { listProfessionals, createProfessional, updateProfessional, removeProfessional } from "@/services/professionalsService";
import { listUsers } from "@/services/userService";
import type { Professional, CreateProfessionalDto } from "@/types/professional";
import type { User } from "@/types/user";
import type { WorkScheduleDay } from "@/types/work-schedule";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { formatPhone } from "@/utils/formatters";
import { format, isAfter, isBefore, differenceInDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ProfessionalOpenWindow } from "@/types/professional-open-window";
import { useProfessionalOpenWindows, useCreateProfessionalOpenWindow, useCloseProfessionalOpenWindow, useDeleteProfessionalOpenWindow } from "@/hooks/professional-open-windows";

const mockServices = [
  { id: "adm", name: "ADM" },
  { id: "ceo", name: "CEO" },
  { id: "cabelereira", name: "Cabelereira" },
  { id: "design-sobrancelha", name: "Design de sobrancelha" },
  { id: "lash-design", name: "Lash design" },
  { id: "manicure", name: "Manicure" },
  { id: "nail-design", name: "Nail design" },
];

const defaultSpecialtiesByUserName: Record<string, string[]> = {
  Carla: ["Cabelereira"],
  Maria: ["Manicure", "Cabelereira"],
  Agela: ["Lash design", "Design de sobrancelha"],
  Thay: ["Nail design", "Manicure"],
  Claudia: ["Nail design"],
  Geluce: ["Manicure"],
  Jammily: ["ADM"],
  Melissa: ["ADM"],
  Symon: ["ADM"],
  Michele: ["CEO", "Nail design"],
};

const defaultSchedule: WorkScheduleDay[] = [
  {
    day: "Segunda-feira",
    isWorkingDay: true,
    isDayOff: false,
    startTime: "09:00",
    endTime: "18:00",
    lunchStart: "12:00",
    lunchEnd: "13:00",
  },
  {
    day: "Terça-feira",
    isWorkingDay: true,
    isDayOff: false,
    startTime: "09:00",
    endTime: "18:00",
    lunchStart: "12:00",
    lunchEnd: "13:00",
  },
  {
    day: "Quarta-feira",
    isWorkingDay: true,
    isDayOff: false,
    startTime: "09:00",
    endTime: "18:00",
    lunchStart: "12:00",
    lunchEnd: "13:00",
  },
  {
    day: "Quinta-feira",
    isWorkingDay: true,
    isDayOff: false,
    startTime: "09:00",
    endTime: "18:00",
    lunchStart: "12:00",
    lunchEnd: "13:00",
  },
  {
    day: "Sexta-feira",
    isWorkingDay: true,
    isDayOff: false,
    startTime: "09:00",
    endTime: "17:00",
    lunchStart: "12:00",
    lunchEnd: "13:00",
  },
  {
    day: "Sábado",
    isWorkingDay: true,
    isDayOff: false,
    startTime: "09:00",
    endTime: "16:00",
    lunchStart: "12:00",
    lunchEnd: "13:00",
  },
  {
    day: "Domingo",
    isWorkingDay: false,
    isDayOff: true,
    startTime: "09:00",
    endTime: "18:00",
    lunchStart: "12:00",
    lunchEnd: "13:00",
  },
];

const professionalSchema = z.object({
  user_id: z.number({ required_error: "Usuário é obrigatório" }),
  phone: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  active: z.boolean().default(true),
  work_schedule: z
    .array(
      z.object({
        day: z.string(),
        isWorkingDay: z.boolean(),
        isDayOff: z.boolean(),
        startTime: z.string().nullable(),
        endTime: z.string().nullable(),
        lunchStart: z.string().nullable(),
        lunchEnd: z.string().nullable(),
      })
    )
    .default([]),
});

const OPEN_WINDOW_MAX_DAYS = 180;

export default function Professionals() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProfessional, setEditingProfessional] =
    useState<Professional | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const { can } = usePermission();
  const isMobile = useIsMobile();

  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  // --- HOOKS das janelas de agenda (professional_open_windows) ---
  const professionalId = editingProfessional?.id;

  const {
    data: openWindows = [],
    isLoading: isLoadingOpenWindows,
  } = useProfessionalOpenWindows(professionalId, {
    status: "all",
    enabled: !!professionalId && dialogOpen,
  });

  const createOpenWindowMutation = useCreateProfessionalOpenWindow();
  const closeOpenWindowMutation = useCloseProfessionalOpenWindow();
  const deleteOpenWindowMutation = useDeleteProfessionalOpenWindow();

  // --- Profissionais (index sem paginação, como combinamos) ---
  const {
    data: professionalsData,
    refetch,
    isLoading,
  } = useQuery({
    queryKey: ["professionals"],
    queryFn: () => listProfessionals(),
  });

  const professionals = (professionalsData?.data ?? []) as Professional[];

  const form = useForm<z.infer<typeof professionalSchema>>({
    resolver: zodResolver(professionalSchema),
    defaultValues: {
      user_id: undefined,
      phone: "",
      specialties: [],
      active: true,
      work_schedule: defaultSchedule,
    },
  });

  const loadUsersIfNeeded = async () => {
    if (users.length > 0) return;
    try {
      const userResponse = await listUsers({ perPage: 100 });
      setUsers(userResponse.data);
    } catch {
      toast.error("Erro ao carregar usuários.");
      throw new Error("load-users-failed");
    }
  };

  const openDialog = async (professional?: Professional) => {
    try {
      await loadUsersIfNeeded();
    } catch {
      return;
    }

    if (professional) {
      form.reset({
        user_id: professional.user_id ?? undefined,
        phone: professional.phone ?? "",
        specialties: professional.specialties ?? [],
        active: professional.active ?? true,
        work_schedule:
          (professional.work_schedule as WorkScheduleDay[]) ?? defaultSchedule,
      });

      setEditingProfessional(professional);
    } else {
      form.reset({
        user_id: undefined,
        phone: "",
        specialties: [],
        active: true,
        work_schedule: defaultSchedule,
      });

      setEditingProfessional(null);
    }

    setDateRange({ from: undefined, to: undefined });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await removeProfessional(id);
      toast.success("Profissional excluído com sucesso!");
      refetch();
    } catch {
      toast.error("Erro ao excluir profissional.");
    }
  };

  const onSubmit = async (data: z.infer<typeof professionalSchema>) => {
    setIsSubmitting(true);
    const payload: CreateProfessionalDto = {
      user_id: data.user_id,
      phone: data.phone ?? null,
      specialties: data.specialties ?? [],
      active: data.active ?? true,
      work_schedule: data.work_schedule as WorkScheduleDay[],
    };

    try {
      if (editingProfessional) {
        await updateProfessional(editingProfessional.id, payload);
        toast.success("Profissional atualizado com sucesso!");
      } else {
        await createProfessional(payload);
        toast.success("Profissional criado com sucesso!");
      }

      await refetch();
      setDialogOpen(false);
      setEditingProfessional(null);
      setDateRange({ from: undefined, to: undefined });
    } catch {
      toast.error("Erro ao salvar profissional.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkDateOverlap = (
    newStart: Date,
    newEnd: Date,
    existingWindows: ProfessionalOpenWindow[]
  ): boolean => {
    const newStartDay = startOfDay(newStart);
    const newEndDay = startOfDay(newEnd);

    return existingWindows.some((window) => {
      if (window.status === "closed") return false;

      const existingStart = startOfDay(
        new Date(`${window.start_date}T00:00:00`)
      );
      const existingEnd = startOfDay(new Date(`${window.end_date}T00:00:00`));

      return !(
        isAfter(newStartDay, existingEnd) || isBefore(newEndDay, existingStart)
      );
    });
  };

  const handleAddOpenWindow = async () => {
    if (!editingProfessional?.id || !dateRange.from || !dateRange.to) return;

    const from = startOfDay(dateRange.from);
    const to = startOfDay(dateRange.to);

    if (isBefore(to, from)) {
      toast.error("A data final deve ser maior ou igual à data inicial.");
      return;
    }

    const daysDiff = differenceInDays(to, from);
    if (daysDiff > OPEN_WINDOW_MAX_DAYS) {
      toast.error(`O período não pode exceder ${OPEN_WINDOW_MAX_DAYS} dias.`);
      return;
    }

    const hasOverlap = checkDateOverlap(from, to, openWindows);
    if (hasOverlap) {
      toast.warning(
        "Existe sobreposição com janelas já cadastradas. Ajuste o período para evitar conflitos."
      );
      return;
    }

    try {
      await createOpenWindowMutation.mutateAsync({
        professional_id: editingProfessional.id,
        start_date: format(from, "yyyy-MM-dd"),
        end_date: format(to, "yyyy-MM-dd"),
      });

      setDateRange({ from: undefined, to: undefined });
      // toasts e refetch das janelas já são tratados pelo hook/mutation
    } catch {
      // erro já tratado pelo mutation (toast)
    }
  };

  const handleCloseWindow = async (windowId: number) => {
    if (!editingProfessional?.id) return;

    try {
      await closeOpenWindowMutation.mutateAsync({
        id: windowId,
        professional_id: editingProfessional.id,
      });
    } catch {
      // erro já tratado no hook
    }
  };

  const handleDeleteWindow = async (windowId: number) => {
    if (!editingProfessional?.id) return;

    try {
      await deleteOpenWindowMutation.mutateAsync({
        id: windowId,
        professional_id: editingProfessional.id,
      });
    } catch {
      // erro já tratado no hook
    }
  };

  const columns = [
    {
      key: "user",
      header: "Usuário",
      render: (p: Professional) => p.name ?? "-",
    },
    {
      key: "phone",
      header: "Telefone",
      render: (p: Professional) => p.phone ?? "-",
    },
    {
      key: "specialties",
      header: "Especializações",
      render: (p: Professional) => (
        <div className="flex flex-wrap gap-1">
          {(p.specialties ?? []).map((spec) => (
            <Badge key={spec} variant="secondary">
              {spec}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "active",
      header: "Status",
      render: (p: Professional) => (
        <Badge variant={p.active ? "success" : "outline"}>
          {p.active ? "Ativo" : "Inativo"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Ações",
      render: (p: Professional) => (
        <div className="flex gap-2">
          {can("professionals", "update") && (
            <Button variant="ghost" size="icon" onClick={() => openDialog(p)}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {can("professionals", "delete") && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(p.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profissionais</h1>
          <p className="text-muted-foreground">
            Gerencie os profissionais do salão
          </p>
        </div>
        {can("professionals", "create") && (
          <Button
            className={cn("shadow-md", isMobile && "w-full")}
            onClick={() => openDialog()}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Profissional
          </Button>
        )}
      </div>

      <DataTable
        data={professionals}
        columns={columns}
        loading={isLoading}
        searchPlaceholder="Buscar profissionais..."
        emptyMessage="Nenhum profissional encontrado."
      />

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingProfessional(null);
            setDateRange({ from: undefined, to: undefined });
          }
        }}
      >
        <DialogContent
          className={
            isMobile
              ? "max-w-[95vw] h-[90vh] overflow-y-auto"
              : "max-w-4xl max-h-[90vh] overflow-y-auto"
          }
        >
          <DialogHeader>
            <DialogTitle>
              {editingProfessional ? "Editar Profissional" : "Novo Profissional"}
            </DialogTitle>
            <DialogDescription>
              Selecione o usuário, defina as especializações, configure o horário
              de trabalho e gerencie as janelas de agenda aberta.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="dados" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="dados">Dados Básicos</TabsTrigger>
              <TabsTrigger
                value="agenda"
                disabled={!editingProfessional || !editingProfessional.id}
              >
                Agenda Aberta
              </TabsTrigger>
            </TabsList>

            {/* ABA: DADOS BÁSICOS */}
            <TabsContent value="dados" className="mt-4">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="user_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Usuário do Sistema</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value ? String(field.value) : ""}
                            onValueChange={(val) => {
                              const userId = Number(val);
                              field.onChange(userId);

                              const selectedUser = users.find(
                                (u) => u.id === userId
                              );
                              if (selectedUser) {
                                const defaults =
                                  defaultSpecialtiesByUserName[
                                    selectedUser.name
                                  ] ?? [];
                                form.setValue("specialties", defaults);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um usuário" />
                            </SelectTrigger>
                            <SelectContent>
                              {users.length === 0 ? (
                                <div className="p-2 text-sm text-muted-foreground">
                                  Carregando usuários...
                                </div>
                              ) : (
                                users.map((user) => (
                                  <SelectItem
                                    key={user.id}
                                    value={String(user.id)}
                                  >
                                    {user.name} ({user.email})
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="(81) 90011-2233"
                            value={field.value || ""}
                            onChange={(e) =>
                              field.onChange(formatPhone(e.target.value))
                            }
                            maxLength={15}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="specialties"
                    render={() => (
                      <FormItem>
                        <FormLabel>Especializações / Serviços</FormLabel>
                        <div className="grid grid-cols-2 gap-3 mt-2 sm:grid-cols-3">
                          {mockServices.map((service) => (
                            <FormField
                              key={service.id}
                              control={form.control}
                              name="specialties"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(
                                        service.name
                                      )}
                                      onCheckedChange={(checked) =>
                                        checked
                                          ? field.onChange([
                                              ...(field.value ?? []),
                                              service.name,
                                            ])
                                          : field.onChange(
                                              field.value?.filter(
                                                (v) => v !== service.name
                                              )
                                            )
                                      }
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    {service.name}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="active"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between border p-3 rounded-lg">
                        <FormLabel>Status do Profissional</FormLabel>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4 border-t pt-4">
                    <FormLabel className="text-base">
                      Horário de Trabalho
                    </FormLabel>
                    {form.watch("work_schedule")?.map((day, index) => (
                      <div
                        key={day.day}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <FormLabel className="text-sm font-medium">
                            {day.day}
                          </FormLabel>
                          <div className="flex gap-4 flex-wrap">
                            <FormField
                              control={form.control}
                              name={`work_schedule.${index}.isWorkingDay`}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-2">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-xs font-normal">
                                    Dia útil
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`work_schedule.${index}.isDayOff`}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-2">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-xs font-normal">
                                    Folga
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        {form.watch(
                          `work_schedule.${index}.isWorkingDay`
                        ) &&
                          !form.watch(`work_schedule.${index}.isDayOff`) && (
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                              {[
                                "startTime",
                                "endTime",
                                "lunchStart",
                                "lunchEnd",
                              ].map((key, i) => (
                                <FormField
                                  key={key}
                                  control={form.control}
                                  name={`work_schedule.${index}.${key}` as any}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs text-muted-foreground">
                                        {
                                          [
                                            "Entrada",
                                            "Saída",
                                            "Início do Almoço",
                                            "Fim do Almoço",
                                          ][i]
                                        }
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          type="time"
                                          value={field.value ?? ""}
                                          onChange={field.onChange}
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              ))}
                            </div>
                          )}
                      </div>
                    ))}
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting
                        ? "Salvando..."
                        : editingProfessional
                        ? "Atualizar"
                        : "Cadastrar"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </TabsContent>

            {/* ABA: AGENDA ABERTA */}
            <TabsContent value="agenda" className="mt-4 space-y-6">
              {!editingProfessional || !editingProfessional.id ? (
                <div className="text-sm text-muted-foreground">
                  Salve o profissional para gerenciar as janelas de agenda.
                </div>
              ) : (
                <>
                  <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                    <h3 className="font-semibold text-lg">
                      Adicionar Período de Agenda
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Defina um período em que este profissional estará
                      disponível para agendamentos. Máximo de{" "}
                      {OPEN_WINDOW_MAX_DAYS} dias por lançamento. O sistema
                      não permite sobreposição de períodos abertos.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                      <div className="flex-1 space-y-2">
                        <label className="text-sm font-medium">Período</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !dateRange.from && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateRange.from ? (
                                dateRange.to ? (
                                  <>
                                    {format(dateRange.from, "dd/MM/yyyy", {
                                      locale: ptBR,
                                    })}{" "}
                                    -{" "}
                                    {format(dateRange.to, "dd/MM/yyyy", {
                                      locale: ptBR,
                                    })}
                                  </>
                                ) : (
                                  format(dateRange.from, "dd/MM/yyyy", {
                                    locale: ptBR,
                                  })
                                )
                              ) : (
                                <span>Selecione o período</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-auto p-0"
                            align="start"
                          >
                            <Calendar
                              mode="range"
                              selected={{
                                from: dateRange.from,
                                to: dateRange.to,
                              }}
                              onSelect={(range) =>
                                setDateRange({
                                  from: range?.from,
                                  to: range?.to,
                                })
                              }
                              numberOfMonths={2}
                              disabled={(date) =>
                                isBefore(date, startOfDay(new Date()))
                              }
                              initialFocus
                              locale={ptBR}
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <Button
                        onClick={handleAddOpenWindow}
                        disabled={!dateRange.from || !dateRange.to}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Abrir Agenda
                      </Button>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-4">
                      Períodos Cadastrados
                    </h3>
                    {isLoadingOpenWindows ? (
                      <div className="text-sm text-muted-foreground">
                        Carregando períodos...
                      </div>
                    ) : openWindows.length === 0 ? (
                      <div className="text-center py-12">
                        <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground mt-2">
                          Nenhum período cadastrado ainda.
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Adicione períodos de disponibilidade usando o
                          formulário acima.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {openWindows
                          .slice()
                          .sort(
                            (a, b) =>
                              new Date(`${a.start_date}T00:00:00`).getTime() -
                              new Date(`${b.start_date}T00:00:00`).getTime()
                          )
                          .map((window) => {
                            const start = new Date(
                              `${window.start_date}T00:00:00`
                            );
                            const end = new Date(
                              `${window.end_date}T00:00:00`
                            );
                            const createdAt = window.created_at
                              ? new Date(window.created_at)
                              : null;

                            return (
                              <div
                                key={window.id}
                                className={cn(
                                  "flex items-center justify-between p-3 rounded-lg border",
                                  window.status === "closed" &&
                                    "opacity-50 bg-muted"
                                )}
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">
                                      {format(start, "dd/MM/yyyy", {
                                        locale: ptBR,
                                      })}{" "}
                                      até{" "}
                                      {format(end, "dd/MM/yyyy", {
                                        locale: ptBR,
                                      })}
                                    </span>
                                    <span
                                      className={cn(
                                        "text-xs px-2 py-1 rounded-full",
                                        window.status === "open"
                                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                      )}
                                    >
                                      {window.status === "open"
                                        ? "Aberto"
                                        : "Fechado"}
                                    </span>
                                  </div>
                                  {createdAt && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Criado em{" "}
                                      {format(
                                        createdAt,
                                        "dd/MM/yyyy 'às' HH:mm",
                                        { locale: ptBR }
                                      )}
                                    </p>
                                  )}
                                </div>

                                <div className="flex gap-2">
                                  {window.status === "open" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handleCloseWindow(window.id)
                                      }
                                    >
                                      Fechar
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleDeleteWindow(window.id)
                                    }
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
