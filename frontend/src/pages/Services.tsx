import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/DataTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Filter, ChevronDown, ChevronUp, CheckCircle2, XCircle, DollarSign } from "lucide-react";
import { usePermission } from "@/hooks/usePermission";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Service, CreateServiceDto } from "@/types/service";
import { listServices, createService, updateService, removeService } from "@/services/servicesService";
import { cn } from "@/lib/utils";
import { formatCurrencyInput, formatPercentageInput, displayCurrency, displayPercentage } from "@/utils/formatters";

const SERVICE_CATEGORIES = [
  "Cabelo",
  "Trança",
  "Unhas",
  "Sobrancelha",
  "Estética",
] as const;

const serviceSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  category: z.string().optional().default(""),
  duration: z.coerce.number().min(5, "Duração mínima de 5 minutos").max(480),
  price: z.coerce.number().min(0, "Preço deve ser positivo"),
  description: z.string().min(1, "Descrição é obrigatória").max(500),
  status: z.enum(["active", "inactive"]),
  commission_type: z.enum(["percentage", "fixed"]),
  commission_value: z.coerce.number().min(0, "Valor da comissão deve ser positivo"),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

const defaultFormValues: ServiceFormData = {
  name: "",
  category: "",
  duration: 30,
  price: 0,
  description: "",
  status: "active",
  commission_type: "percentage",
  commission_value: 40,
};

type StatusFilter = "all" | "active" | "inactive";

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingServiceId, setDeletingServiceId] = useState<number | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const { can } = usePermission();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const showActions = can("services", "update") || can("services", "delete");

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: defaultFormValues,
  });

  async function load() {
    setLoading(true);
    try {
      const result = await listServices();
      setServices(result);
    } catch (err: any) {
      toast({
        title: "Erro ao carregar serviços",
        description: err?.response?.data?.message ?? "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const handleAdd = () => {
    setEditingService(null);
    form.reset(defaultFormValues);
    setDialogOpen(true);
  };

  const handleEdit = (s: Service) => {
    setEditingService(s);
    form.reset({
      name: s.name,
      category: s.category ?? "",
      duration: s.duration,
      price: Number(s.price),
      description: s.description ?? "",
      status: s.active ? "active" : "inactive",
      commission_type: s.commission_type,
      commission_value: Number(s.commission_value),
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    setDeletingServiceId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingServiceId) return;

    try {
      await removeService(deletingServiceId);
      toast({ title: "Serviço excluído", description: "Removido com sucesso." });
      await load();
    } catch (err: any) {
      toast({
        title: "Erro ao excluir",
        description: err?.response?.data?.message ?? "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeletingServiceId(null);
    }
  };

  const onSubmit = async (values: ServiceFormData) => {
    const payload: CreateServiceDto = {
      name: values.name,
      description: values.description || null,
      price: values.price.toString(),
      duration: values.duration,
      category: values.category || null,
      commission_type: values.commission_type,
      commission_value: values.commission_value.toString(),
      active: values.status === "active",
    };

    try {
      if (editingService) {
        await updateService(Number(editingService.id), payload);
        toast({ title: "Serviço atualizado", description: "Alterações salvas." });
      } else {
        await createService(payload);
        toast({ title: "Serviço criado", description: "Novo serviço adicionado." });
      }

      setDialogOpen(false);
      form.reset(defaultFormValues);
      await load();
    } catch (err: any) {
      toast({
        title: "Erro ao salvar",
        description: err?.response?.data?.message ?? "Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    }
  };

  const hasActiveFilters = categoryFilter !== "all" || statusFilter !== "all";

  useEffect(() => {
    if (hasActiveFilters) setFiltersOpen(true);
  }, [hasActiveFilters]);

  const clearFilters = () => {
    setCategoryFilter("all");
    setStatusFilter("all");
  };

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const byCategory =
        categoryFilter === "all" || String(s.category ?? "") === String(categoryFilter);

      const byStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? !!s.active : !s.active);

      return byCategory && byStatus;
    });
  }, [services, categoryFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = services.length;
    const active = services.filter((s) => s.active).length;
    const inactive = total - active;

    const avgPrice =
      total > 0
        ? services.reduce((sum, s) => sum + (Number(s.price) || 0), 0) / total
        : 0;

    return { total, active, inactive, avgPrice };
  }, [services]);

  const commissionLabel = (s: Service) => {
    const type = String(s.commission_type || "").toLowerCase();
    const v = Number(s.commission_value || 0);

    const percentText = (() => {
      const txt = String(displayPercentage(v) ?? "").trim();
      return txt.includes("%") ? txt : `${txt}%`;
    })();

    const moneyText = (() => {
      const txt = String(displayCurrency(v) ?? "").trim();
      return txt.startsWith("R$") ? txt : `R$ ${txt}`;
    })();

    if (type === "percentage") return `Comissão: ${percentText}`;
    return `Comissão: ${moneyText}`;
  };

  const columnsBase = [
    {
      key: "name",
      header: "Serviço",
      render: (s: Service) => (
        <div className="min-w-0 space-y-1">
          <div className="font-medium truncate">{s.name}</div>

          <div className="flex flex-wrap items-center gap-1">
            <Badge variant="secondary" className="text-[11px]">
              {s.category ?? "Sem categoria"}
            </Badge>

            <Badge variant="outline" className="text-[11px]">
              {commissionLabel(s)}
            </Badge>

            <Badge variant={s.active ? "default" : "secondary"} className="text-[11px]">
              {s.active ? "Ativo" : "Inativo"}
            </Badge>
          </div>

          {s.description ? (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {s.description}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: "duration",
      header: "Duração",
      render: (s: Service) => (
        <span className="whitespace-nowrap">{s.duration} min</span>
      ),
    },
    {
      key: "price",
      header: "Preço",
      render: (s: Service) => (
        <span className="whitespace-nowrap font-medium">
          {displayCurrency(Number(s.price) || 0)}
        </span>
      ),
    },
  ];

  const columns = showActions
    ? [
        ...columnsBase,
        {
          key: "actions",
          header: "Ações",
          render: (s: Service) => (
            <div className="flex justify-end gap-2">
              {can("services", "update") && (
                <Button
                  variant="ghost"
                  size={isMobile ? "sm" : "icon"}
                  onClick={() => handleEdit(s)}
                  title="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              {can("services", "delete") && (
                <Button
                  variant="ghost"
                  size={isMobile ? "sm" : "icon"}
                  onClick={() => handleDelete(Number(s.id))}
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ),
        },
      ]
    : columnsBase;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Serviços</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Gerencie os serviços oferecidos pelo salão
          </p>
        </div>

        {can("services", "create") && (
          <Button
            className={cn("shadow-sm", isMobile && "w-full")}
            onClick={handleAdd}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Serviço
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {stats.total}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Serviços cadastrados</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Disponíveis no salão</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inativos</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground">Ocultos/pausados</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Preço médio</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayCurrency(stats.avgPrice)}</div>
            <p className="text-xs text-muted-foreground">Média dos valores</p>
          </CardContent>
        </Card>
      </div>

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
                  {filteredServices.length} resultado{filteredServices.length === 1 ? "" : "s"}
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
              {filtersOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        {filtersOpen && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-muted-foreground">
                Categoria
              </span>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {SERVICE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-muted-foreground">
                Status
              </span>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Lista de Serviços</CardTitle>
            <CardDescription>
              {loading
                ? "Carregando..."
                : `${filteredServices.length} serviço${filteredServices.length === 1 ? "" : "s"} encontrado${filteredServices.length === 1 ? "" : "s"}`}
            </CardDescription>
          </div>

          {can("services", "create") && !isMobile && (
            <Button variant="outline" onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar
            </Button>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          <DataTable
            data={filteredServices}
            columns={columns}
            searchPlaceholder="Buscar serviços..."
            loading={loading}
          />
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingService(null);
            form.reset(defaultFormValues);
          }
        }}
      >
        <DialogContent className={cn("max-h-[90vh]", isMobile ? "max-w-[95vw]" : "max-w-2xl")}>
          <DialogHeader>
            <DialogTitle>{editingService ? "Editar Serviço" : "Novo Serviço"}</DialogTitle>
            <DialogDescription>
              {editingService ? "Atualize as informações do serviço." : "Preencha os dados para criar um novo serviço."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <section className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Informações gerais</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Nome <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do serviço" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SERVICE_CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="inactive">Inativo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Preço e duração</h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duração (min)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>
                          Preço (R$) <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="R$ 0,00"
                            value={
                              Number(field.value) > 1
                                ? displayCurrency(Number(field.value))
                                : formatCurrencyInput(field.value?.toString() || "")
                            }
                            onChange={(e) => {
                              const formatted = formatCurrencyInput(e.target.value);
                              field.onChange(formatted.replace(/[^\d,]/g, "").replace(",", "."));
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Comissão</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="commission_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Comissão</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="percentage">Percentual (%)</SelectItem>
                            <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="commission_value"
                    render={({ field }) => {
                      const type = form.watch("commission_type");

                      return (
                        <FormItem>
                          <FormLabel>{type === "percentage" ? "Percentual (%)" : "Valor Fixo (R$)"}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={type === "percentage" ? "Ex: 5,00" : "Ex: R$ 15,00"}
                              value={
                                type === "percentage"
                                  ? displayPercentage(field.value)
                                  : Number(field.value) > 1
                                    ? displayCurrency(Number(field.value))
                                    : formatCurrencyInput(field.value?.toString() || "")
                              }
                              onChange={(e) => {
                                const value = e.target.value;

                                if (type === "percentage") {
                                  const formatted = formatPercentageInput(value);
                                  field.onChange(formatted.replace(",", "."));
                                } else {
                                  const formatted = formatCurrencyInput(value);
                                  field.onChange(formatted.replace(/[^\d,]/g, "").replace(",", "."));
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Descrição</h3>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Descrição Detalhada <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva o serviço em detalhes..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </section>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">{editingService ? "Salvar Alterações" : "Criar Serviço"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
