import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/DataTable";
import { DollarSign, TrendingUp, Users, Download, FileText, Check, MoreHorizontal, Pencil, ChevronDown, ChevronUp, Filter } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { format, parseISO } from "date-fns";
import { useCommissionsQuery, useMarkCommissionAsPaid, useUpdateCommission } from "@/hooks/commissions";
import { Skeleton } from "@/components/ui/skeleton";
import type { Commission } from "@/types/commission";
import { displayCurrency, formatCurrencyInput } from "@/utils/formatters";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { usePermission } from "@/hooks/usePermission";

export default function Commissions() {
  const isMobile = useIsMobile();
  const { canAccess } = usePermission();

  const defaultStart = useMemo(() => format(new Date(), "yyyy-MM-01"), []);
  const defaultEnd = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  const [selectedProfessional, setSelectedProfessional] = useState<string>("all");
  const [start_date, setStartDate] = useState(defaultStart);
  const [end_date, setEndDate] = useState(defaultEnd);

  const [filtersOpen, setFiltersOpen] = useState(false);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Commission | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editAmount, setEditAmount] = useState<string>("");

  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<number | string | null>(null);

  const isProfessionalView = useMemo(() => {
    return (
      canAccess("commissions") &&
      !canAccess("cashier") &&
      !canAccess("accounts-payable") &&
      !canAccess("suppliers") &&
      !canAccess("item-prices") &&
      !canAccess("item-price-histories") &&
      !canAccess("professionals") &&
      !canAccess("users")
    );
  }, [canAccess]);

  const showActions = !isProfessionalView;

  const { data, isLoading } = useCommissionsQuery({
    start_date,
    end_date,
    professional_id:
      !isProfessionalView && selectedProfessional !== "all"
        ? Number(selectedProfessional)
        : undefined,
  });

  const updateMutation = useUpdateCommission(editing?.id ?? 0);
  const { mutate: markAsPaid, isPending: isMarkingPaid } = useMarkCommissionAsPaid();

  const commissions = data ?? [];

  const uniqueProfessionals = useMemo(() => {
    const names = new Map<number, string>();
    commissions.forEach((c) => {
      if (c.professional) names.set(c.professional.id, c.professional.name);
    });
    return Array.from(names.entries());
  }, [commissions]);

  const selectedProfessionalName = useMemo(() => {
    if (isProfessionalView) return "Meu";
    if (selectedProfessional === "all") return "Todos";
    const id = Number(selectedProfessional);
    return uniqueProfessionals.find(([pid]) => pid === id)?.[1] ?? selectedProfessional;
  }, [isProfessionalView, selectedProfessional, uniqueProfessionals]);

  const filteredCommissions = useMemo(() => {
    if (isProfessionalView) return commissions;

    return commissions.filter((c) => {
      const byProf =
        selectedProfessional === "all" ||
        c.professional?.id === Number(selectedProfessional);
      return byProf;
    });
  }, [commissions, selectedProfessional, isProfessionalView]);

  const summary = useMemo(() => {
    const totalCommissions = filteredCommissions.reduce(
      (sum, c) => sum + Number(c.commission_amount || 0),
      0
    );
    const totalServices = filteredCommissions.reduce(
      (sum, c) => sum + Number(c.service_price || 0),
      0
    );
    const serviceCount = filteredCommissions.length;

    const byProfessional = filteredCommissions.reduce((acc, c) => {
      const name = c.professional?.name ?? "Sem profissional";
      if (!acc[name]) acc[name] = { total: 0, services: 0 };
      acc[name].total += Number(c.commission_amount || 0);
      acc[name].services += 1;
      return acc;
    }, {} as Record<string, { total: number; services: number }>);

    return { totalCommissions, totalServices, serviceCount, byProfessional };
  }, [filteredCommissions]);

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Relatório de Comissões", 14, 22);
    doc.setFontSize(11);
    doc.text(
      `Período: ${format(new Date(start_date), "dd/MM/yyyy")} a ${format(
        new Date(end_date),
        "dd/MM/yyyy"
      )}`,
      14,
      32
    );
    doc.text(`Profissional: ${selectedProfessionalName}`, 14, 40);
    doc.text(`Total em Comissões: ${displayCurrency(summary.totalCommissions)}`, 14, 48);
    doc.text(`Total em Serviços: ${displayCurrency(summary.totalServices)}`, 14, 56);

    autoTable(doc, {
      startY: 65,
      head: [["Data", "Agendamento", "Profissional", "Cliente", "Serviço", "Valor Serv.", "Comissão", "AP"]],
      body: filteredCommissions.map((c) => [
        c.date ? format(parseISO(c.date), "dd/MM/yyyy") : "-",
        c.appointment?.id
          ? `#${c.appointment.id} (linha ${c.appointment_service_id ?? "-"})`
          : "-",
        c.professional?.name ?? "-",
        c.customer?.name ?? "-",
        c.service?.name ?? "-",
        displayCurrency(Number(c.service_price || 0)),
        displayCurrency(Number(c.commission_amount || 0)),
        c.account_payable_id ? `#${c.account_payable_id}` : "-",
      ]),
    });

    doc.save(`comissoes-${start_date}-${end_date}.pdf`);
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredCommissions.map((c) => ({
        Data: c.date ? format(parseISO(c.date), "dd/MM/yyyy") : "-",
        Agendamento: c.appointment?.id ? `#${c.appointment.id}` : "-",
        Linha: c.appointment_service_id ?? "-",
        Profissional: c.professional?.name ?? "-",
        Cliente: c.customer?.name ?? "-",
        Serviço: c.service?.name ?? "-",
        "Valor do Serviço": displayCurrency(Number(c.service_price || 0)),
        "Tipo Comissão": c.commission_type === "percentage" ? "Percentual" : "Fixa",
        "Valor Comissão":
          c.commission_type === "percentage"
            ? `${c.commission_value}%`
            : displayCurrency(Number(c.commission_value || 0)),
        "Total Comissão": displayCurrency(Number(c.commission_amount || 0)),
        AP: c.account_payable_id ? `#${c.account_payable_id}` : "-",
        Status: c.status === "paid" ? "Paga" : "Pendente",
      }))
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Comissões");

    const summaryData = Object.entries(summary.byProfessional).map(([prof, data]) => ({
      Profissional: prof,
      "Qtd Atendimentos": data.services,
      "Total em Comissões": displayCurrency(data.total),
    }));
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Resumo por Profissional");

    XLSX.writeFile(wb, `comissoes-${start_date}-${end_date}.xlsx`);
  };

  const handleMarkAsPaid = (id: number) => {
    markAsPaid(id);
  };

  const parseCurrencyToNumber = (value: string): number => {
    if (!value) return 0;
    const cleaned = value.replace(/[^\d,-]/g, "");
    if (!cleaned) return 0;
    const normalized = cleaned.replace(",", ".");
    const num = parseFloat(normalized);
    return Number.isNaN(num) ? 0 : num;
  };

  const openEdit = (c: Commission) => {
    if (!showActions) return;

    if (c.status === "paid") {
      toast.error("Não é possível editar uma comissão já paga.");
      return;
    }

    setEditing(c);
    setEditAmount(
      c.commission_amount != null
        ? formatCurrencyInput(String(c.commission_amount))
        : ""
    );
    setIsEditDialogOpen(true);
  };

  const handleSubmitEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!showActions) return;
    if (!editing) return;
    if (isSaving || updateMutation.isPending) return;

    setIsSaving(true);
    try {
      const amountNumber = parseCurrencyToNumber(editAmount);
      const amountString = amountNumber.toFixed(2);

      await updateMutation.mutateAsync({
        commission_amount: amountString,
      });

      toast.success("Comissão atualizada com sucesso!");
      setIsEditDialogOpen(false);
      setEditing(null);
      setEditAmount("");
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Erro ao atualizar comissão.");
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: Commission["status"]) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500 text-yellow-50",
      paid: "bg-green-600 text-green-50",
    };
    const labels: Record<string, string> = {
      pending: "Pendente",
      paid: "Paga",
    };

    return <Badge className={colors[status] ?? ""}>{labels[status] ?? status}</Badge>;
  };

  const searchFn = (c: Commission, termLower: string) =>
    [
      c.professional?.name,
      c.customer?.name,
      c.service?.name,
      c.appointment?.id ? String(c.appointment.id) : null,
      c.account_payable_id ? String(c.account_payable_id) : null,
      c.id ? String(c.id) : null,
    ]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(termLower));

  const mobileList = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return filteredCommissions;
    return filteredCommissions.filter((c) => searchFn(c, term));
  }, [filteredCommissions, searchTerm]);

  const toggleExpanded = (id: number | string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const MobileCommissionItem = ({ c }: { c: Commission }) => {
    const isOpen = expandedId === c.id;

    const appId = c.appointment?.id;
    const lineId = c.appointment_service_id ?? c.appointment_service?.id;

    const starts = c.appointment_service?.starts_at
      ? format(parseISO(c.appointment_service.starts_at), "HH:mm")
      : null;
    const ends = c.appointment_service?.ends_at
      ? format(parseISO(c.appointment_service.ends_at), "HH:mm")
      : null;
    const windowLabel = starts && ends ? `${starts}–${ends}` : null;

    const linePrice = c.appointment_service?.service_price ?? c.service_price ?? "0";

    const dateLabel = c.date ? format(parseISO(c.date), "dd/MM/yyyy") : "-";
    const customerName = c.customer?.name ?? "Cliente";
    const serviceName = c.service?.name ?? "Serviço";

    return (
      <div className="rounded-lg border bg-background">
        <button
          type="button"
          onClick={() => toggleExpanded(c.id)}
          className="w-full text-left p-4 flex items-start justify-between gap-3"
        >
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{dateLabel}</span>
              <span className="text-xs text-muted-foreground">
                {windowLabel ? windowLabel : appId ? `#${appId}` : ""}
              </span>
            </div>

            <div className="text-base font-semibold truncate">{customerName}</div>
            <div className="text-sm text-muted-foreground truncate">{serviceName}</div>

            <div className="pt-1 flex items-center gap-2">
              <span className="text-sm font-semibold text-green-600">
                {displayCurrency(Number(c.commission_amount || 0))}
              </span>
              <span className="text-xs text-muted-foreground">
                {c.commission_type === "percentage" ? `${c.commission_value}%` : "Fixo"}
              </span>
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              {getStatusBadge(c.status)}

              {showActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>

                    {c.status === "pending" && (
                      <>
                        <DropdownMenuItem onClick={() => openEdit(c)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar comissão
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          disabled={isMarkingPaid}
                          onClick={() => handleMarkAsPaid(c.id)}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Marcar como paga
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />
                      </>
                    )}

                    {c.account_payable_id ? (
                      <DropdownMenuItem
                        onClick={() =>
                          navigator.clipboard?.writeText(String(c.account_payable_id))
                        }
                      >
                        Copiar AP #{c.account_payable_id}
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem disabled>Sem AP vinculado</DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <div className="text-muted-foreground">
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </div>
        </button>

        {isOpen && (
          <div className="px-4 pb-4 space-y-3">
            <div className="rounded-md bg-muted/40 p-3 space-y-1">
              <div className="text-xs text-muted-foreground">
                {appId ? `Agendamento #${appId}` : "Agendamento -"}
                {lineId ? ` • Linha ${lineId}` : ""}
                {windowLabel ? ` • ${windowLabel}` : ""}
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Valor da linha: </span>
                <span className="font-semibold">
                  {displayCurrency(Number(linePrice || 0))}
                </span>
              </div>
              {c.account_payable_id ? (
                <div className="text-sm">
                  <span className="text-muted-foreground">AP: </span>
                  <span className="font-semibold">#{c.account_payable_id}</span>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Sem AP vinculado</div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const columnsBase = [
    {
      key: "date",
      header: "Data",
      render: (c: Commission) => (c.date ? format(parseISO(c.date), "dd/MM/yyyy") : "-"),
    },
    {
      key: "appointment_service_id",
      header: "Atendimento",
      render: (c: Commission) => {
        const appId = c.appointment?.id;
        const lineId = c.appointment_service_id ?? c.appointment_service?.id;

        const starts = c.appointment_service?.starts_at
          ? format(parseISO(c.appointment_service.starts_at), "HH:mm")
          : null;
        const ends = c.appointment_service?.ends_at
          ? format(parseISO(c.appointment_service.ends_at), "HH:mm")
          : null;
        const windowLabel = starts && ends ? `${starts}–${ends}` : null;

        const linePrice = c.appointment_service?.service_price ?? c.service_price ?? "0";

        return (
          <div className="space-y-0.5">
            <div className="font-medium">{appId ? `#${appId}` : "-"}</div>
            <div className="text-xs text-muted-foreground">
              Linha: {lineId ?? "-"}
              {windowLabel ? ` • ${windowLabel}` : ""}
            </div>
            <div className="text-xs text-muted-foreground">
              Valor linha: {displayCurrency(Number(linePrice || 0))}
            </div>
          </div>
        );
      },
    },
    {
      key: "professional",
      header: "Profissional",
      render: (c: Commission) => c.professional?.name ?? "-",
    },
    {
      key: "customer",
      header: "Cliente",
      render: (c: Commission) => c.customer?.name ?? "-",
    },
    {
      key: "service",
      header: "Serviço",
      render: (c: Commission) => c.service?.name ?? "-",
    },
    {
      key: "service_price",
      header: "Valor Serviço",
      render: (c: Commission) => displayCurrency(Number(c.service_price || 0)),
    },
    {
      key: "commission_amount",
      header: "Comissão",
      render: (c: Commission) => (
        <div className="space-y-1">
          <div className="font-medium text-green-600">
            {displayCurrency(Number(c.commission_amount || 0))}
          </div>
          <div className="text-xs text-muted-foreground">
            {c.commission_type === "percentage"
              ? `${c.commission_value}%`
              : `Fixo: ${displayCurrency(Number(c.commission_value || 0))}`}
          </div>
        </div>
      ),
    },
    {
      key: "account_payable_id",
      header: "Conta a Pagar",
      render: (c: Commission) =>
        c.account_payable_id ? <span className="font-medium">AP #{c.account_payable_id}</span> : "-",
    },
    {
      key: "status",
      header: "Status",
      render: (c: Commission) => getStatusBadge(c.status),
    },
  ];

  const columns = showActions
    ? [
        ...columnsBase,
        {
          key: "actions",
          header: "Ações",
          render: (c: Commission) => (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size={isMobile ? "sm" : "icon"} variant="ghost" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>

                {c.status === "pending" && (
                  <>
                    <DropdownMenuItem onClick={() => openEdit(c)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar comissão
                    </DropdownMenuItem>

                    <DropdownMenuItem disabled={isMarkingPaid} onClick={() => handleMarkAsPaid(c.id)}>
                      <Check className="mr-2 h-4 w-4" />
                      Marcar como paga
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                  </>
                )}

                {c.account_payable_id ? (
                  <DropdownMenuItem onClick={() => navigator.clipboard?.writeText(String(c.account_payable_id))}>
                    Copiar AP #{c.account_payable_id}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem disabled>Sem AP vinculado</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ),
        },
      ]
    : columnsBase;

  const hasActiveFilters =
    (!isProfessionalView && selectedProfessional !== "all") ||
    start_date !== defaultStart ||
    end_date !== defaultEnd;

  useEffect(() => {
    if (hasActiveFilters) setFiltersOpen(true);
  }, [hasActiveFilters]);

  const clearFilters = () => {
    setSelectedProfessional("all");
    setStartDate(defaultStart);
    setEndDate(defaultEnd);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="w-full h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", isMobile && "pb-12")}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Comissões</h1>
          <p className="text-muted-foreground">
            {isProfessionalView ? "Suas comissões no período selecionado" : "Relatório de comissões dos profissionais"}
          </p>
        </div>

        <div className={cn("flex gap-2", isMobile && "w-full flex-col")}>
          <Button variant="outline" onClick={exportToPDF} className={cn(isMobile && "w-full")}>
            <FileText className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <Button variant="outline" onClick={exportToExcel} className={cn(isMobile && "w-full")}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </div>

      <div className="bg-muted/40 border rounded-lg p-3 md:p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="text-xs md:text-sm font-medium text-muted-foreground">Filtros</span>

              {hasActiveFilters && (
                <span className="text-[11px] text-muted-foreground">
                  {filteredCommissions.length} resultado
                  {filteredCommissions.length === 1 ? "" : "s"} encontrado
                  {filteredCommissions.length === 1 ? "" : "s"}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {hasActiveFilters && (
              <Button type="button" variant="ghost" size="sm" className="text-[11px] md:text-xs" onClick={clearFilters}>
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
          <div className={cn("grid grid-cols-1 gap-2 mt-2", isProfessionalView ? "md:grid-cols-2" : "md:grid-cols-3")}>
            {!isProfessionalView && (
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-muted-foreground">Profissional</span>
                <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {uniqueProfessionals.map(([id, name]) => (
                      <SelectItem key={id} value={String(id)}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-muted-foreground">Data início</span>
              <Input className="h-9 text-xs" type="date" value={start_date} onChange={(e) => setStartDate(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-muted-foreground">Data fim</span>
              <Input className="h-9 text-xs" type="date" value={end_date} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total em Comissões</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{displayCurrency(summary.totalCommissions)}</div>
            <p className="text-xs text-muted-foreground">No período selecionado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total em Serviços</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayCurrency(summary.totalServices)}</div>
            <p className="text-xs text-muted-foreground">Valor total dos serviços</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-sm font-medium">Atendimentos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.serviceCount}</div>
            <p className="text-xs text-muted-foreground">Total de atendimentos</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhamento de Comissões</CardTitle>
          <CardDescription>{isMobile ? "Lista (mobile)" : "Tabela (desktop)"}</CardDescription>
        </CardHeader>

        <CardContent>
          {isMobile ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Buscar</Label>
                <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar por cliente, serviço, ID, AP..." />
              </div>

              <div className="space-y-3">
                {mobileList.map((c) => (
                  <MobileCommissionItem key={c.id} c={c} />
                ))}

                {!mobileList.length && (
                  <p className="text-sm text-muted-foreground italic">Nenhuma comissão encontrada</p>
                )}
              </div>
            </div>
          ) : (
            <DataTable
              data={filteredCommissions}
              columns={columns}
              loading={isLoading}
              searchPlaceholder="Buscar por profissional, cliente ou serviço..."
              emptyMessage="Nenhuma comissão encontrada"
              searchFn={(c, term) =>
                [
                  c.professional?.name,
                  c.customer?.name,
                  c.service?.name,
                  c.appointment?.id ? String(c.appointment.id) : null,
                  c.account_payable_id ? String(c.account_payable_id) : null,
                  c.id ? String(c.id) : null,
                ]
                  .filter(Boolean)
                  .some((v) => String(v).toLowerCase().includes(term))
              }
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumo por Profissional</CardTitle>
          <CardDescription>Total de comissões agrupadas por profissional</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(summary.byProfessional)
              .sort(([, a], [, b]) => b.total - a.total)
              .map(([prof, data]) => {
                const media = data.services > 0 ? data.total / data.services : 0;

                return (
                  <div key={prof} className="flex items-center justify-between border-b pb-3">
                    <div>
                      <p className="font-medium">{prof}</p>
                      <p className="text-sm text-muted-foreground">{data.services} atendimento(s)</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">{displayCurrency(data.total)}</p>
                      <p className="text-xs text-muted-foreground">Média: {displayCurrency(media)}</p>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {showActions && (
        <Dialog
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) {
              setEditing(null);
              setEditAmount("");
              setIsSaving(false);
            }
          }}
        >
          <DialogContent className={cn("max-h-[90vh]", isMobile ? "max-w-[95vw]" : "max-w-md")}>
            <DialogHeader>
              <DialogTitle>Editar Comissão</DialogTitle>
            </DialogHeader>

            {editing && (
              <form onSubmit={handleSubmitEdit} className="space-y-6">
                <div className="space-y-2">
                  <Label>Comissão (R$)</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={editAmount}
                    onChange={(e) => setEditAmount(formatCurrencyInput(e.target.value))}
                    placeholder="R$ 0,00"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Comissão #{editing.id}
                    {editing.account_payable_id ? ` • AP #${editing.account_payable_id}` : ""}
                  </p>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setIsEditDialogOpen(false)}
                    disabled={isSaving || updateMutation.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSaving || updateMutation.isPending}>
                    Salvar
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
