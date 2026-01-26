import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  TrendingUp,
  ArrowUpCircle,
  ArrowDownCircle,
  Download,
  FileText,
  Tag,
  CreditCard,
  Check,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { listAccountsPayable } from "@/services/accountsPayableService";
import { listCashierTransactions } from "@/services/cashierTransactionsService";
import type { AccountPayable } from "@/types/account-payable";
import type { CashierTransaction } from "@/types/cashier-transaction";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

type MultiSelectOption = { value: string; label: string };

function MultiSelectString({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder = "Buscar...",
  emptyLabel = "Nada encontrado",
}: {
  value: string[];
  onChange: (next: string[]) => void;
  options: MultiSelectOption[];
  placeholder: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
}) {
  const [open, setOpen] = useState(false);

  const toggle = (val: string) => {
    const exists = value.includes(val);
    if (exists) onChange(value.filter((v) => v !== val));
    else onChange([...value, val]);
  };

  const selectedLabels = options
    .filter((o) => value.includes(o.value))
    .map((o) => o.label);

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
              selectedLabels.map((label) => (
                <Badge key={label} variant="secondary">
                  {label}
                </Badge>
              ))
            )}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="p-0 w-[--radix-popover-trigger-width] max-w-[calc(100vw-2rem)]">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const isSelected = value.includes(opt.value);
                return (
                  <CommandItem
                    key={opt.value}
                    value={opt.label}
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

export default function Cashier() {
  const [selectedType, setSelectedType] = useState<"all" | "entrada" | "saida">(
    "all"
  );
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>(
    []
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const PAYMENT_METHOD_LABEL: Record<string, string> = {
    pix: "Pix",
    cash: "Dinheiro",
    debit: "Débito",
    credit: "Crédito",
    credit_link: "Crédito (link)",
  };

  const toStartOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const isWithinRange = (date: Date, from?: Date | null, to?: Date | null) => {
    const day = toStartOfDay(date);

    if (from) {
      const s = toStartOfDay(from);
      if (day < s) return false;
    }
    if (to) {
      const e = toStartOfDay(to);
      if (day > e) return false;
    }
    return true;
  };

  const hasActiveFilters =
    selectedType !== "all" ||
    selectedCategory !== "all" ||
    selectedPaymentMethods.length > 0 ||
    dateFrom !== null ||
    dateTo !== null;

  useEffect(() => {
    if (hasActiveFilters) setFiltersOpen(true);
  }, [hasActiveFilters]);

  const clearFilters = () => {
    setSelectedType("all");
    setSelectedCategory("all");
    setSelectedPaymentMethods([]);
    setDateFrom(null);
    setDateTo(null);
  };

  const periodText = useMemo(() => {
    if (!dateFrom && !dateTo) return "Todos os períodos";
    const fmt = (d: Date) => format(d, "dd/MM/yyyy", { locale: ptBR });
    const fromTxt = dateFrom ? fmt(dateFrom) : "…";
    const toTxt = dateTo ? fmt(dateTo) : "…";
    return `${fromTxt} a ${toTxt}`;
  }, [dateFrom, dateTo]);

  const { data: transactionsRaw, isLoading, isError } = useQuery({
    queryKey: ["cashier-transactions"],
    queryFn: () => listCashierTransactions(),
  });

  const { data: accountsPayableRaw } = useQuery({
    queryKey: ["accounts-payable", "cashier"],
    queryFn: () => listAccountsPayable({ perPage: 1000 }),
  });

  const accountsPayable: AccountPayable[] = useMemo(
    () => (accountsPayableRaw as any)?.data ?? [],
    [accountsPayableRaw]
  );

  const transactions: CashierTransaction[] = useMemo(
    () => transactionsRaw ?? [],
    [transactionsRaw]
  );

  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set).sort();
  }, [transactions]);

  const uniquePaymentMethods = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => {
      if (t.payment_method) set.add(t.payment_method);
    });
    return Array.from(set).sort();
  }, [transactions]);

  const paymentMethodOptions = useMemo(() => {
    const base = ["pix", "cash", "debit", "credit", "credit_link"];
    const fromData = uniquePaymentMethods.filter((m) => m && !base.includes(m)).sort();
    const all = [...base, ...fromData];

    return all.map((m) => ({
      value: m,
      label: PAYMENT_METHOD_LABEL[m] ?? m,
    }));
  }, [uniquePaymentMethods]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const transactionDate = t.date ? new Date(t.date) : null;
      if (!transactionDate || Number.isNaN(transactionDate.getTime())) return false;

      // ✅ Datas só filtram se o usuário escolher
      const dateMatch =
        !dateFrom && !dateTo ? true : isWithinRange(transactionDate, dateFrom, dateTo);

      const typeMatch = selectedType === "all" || t.type === selectedType;

      const categoryMatch =
        selectedCategory === "all" || (t.category && t.category === selectedCategory);

      const paymentMatch =
        selectedPaymentMethods.length === 0 ||
        (t.payment_method && selectedPaymentMethods.includes(t.payment_method));

      return dateMatch && typeMatch && categoryMatch && paymentMatch;
    });
  }, [transactions, dateFrom, dateTo, selectedType, selectedCategory, selectedPaymentMethods]);

  const summary = useMemo(() => {
    const entradas = filteredTransactions.filter((t) => t.type === "entrada");
    const saidas = filteredTransactions.filter((t) => t.type === "saida");

    const totalEntradas = entradas.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalSaidas = saidas.reduce((sum, t) => sum + Number(t.amount), 0);
    const saldo = totalEntradas - totalSaidas;
    const transactionsCount = filteredTransactions.length;
    const avgTicketEntradas = entradas.length > 0 ? totalEntradas / entradas.length : 0;

    const byPaymentMethod = filteredTransactions.reduce((acc, t) => {
      const key = t.payment_method || "Não informado";
      acc[key] = (acc[key] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>);

    const byCategory = filteredTransactions.reduce((acc, t) => {
      const key = t.category || "Sem categoria";
      acc[key] = (acc[key] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>);

    return {
      totalEntradas,
      totalSaidas,
      saldo,
      transactions: transactionsCount,
      avgTicketEntradas,
      byPaymentMethod,
      byCategory,
    };
  }, [filteredTransactions]);

  const pendingPayablesInRange = useMemo(() => {
    // ✅ Se não tem datas, considera todas as pendências
    if (!dateFrom && !dateTo) {
      return accountsPayable.filter((a) => a.status === "pending");
    }

    const start = dateFrom ? toStartOfDay(dateFrom) : null;
    const end = dateTo ? toStartOfDay(dateTo) : null;

    return accountsPayable.filter((a) => {
      if (a.status !== "pending") return false;
      if (!a.due_date) return false;

      const due = new Date(`${a.due_date}T00:00:00`);
      if (Number.isNaN(due.getTime())) return false;

      if (start && due < start) return false;
      if (end && due > end) return false;

      return true;
    });
  }, [accountsPayable, dateFrom, dateTo]);

  const pendingPayablesTotal = useMemo(() => {
    return pendingPayablesInRange.reduce((sum, a) => sum + Number(a.amount || 0), 0);
  }, [pendingPayablesInRange]);

  const projectedBalance = useMemo(() => {
    return summary.saldo - pendingPayablesTotal;
  }, [summary.saldo, pendingPayablesTotal]);

  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Relatório de Fluxo de Caixa", 14, 22);
    doc.setFontSize(11);
    doc.text(`Período: ${periodText}`, 14, 32);
    doc.text(`Total Entradas: R$ ${summary.totalEntradas.toFixed(2)}`, 14, 40);
    doc.text(`Total Saídas: R$ ${summary.totalSaidas.toFixed(2)}`, 14, 48);
    doc.text(`Saldo: R$ ${summary.saldo.toFixed(2)}`, 14, 56);
    doc.text(`Transações: ${summary.transactions}`, 14, 64);

    autoTable(doc, {
      startY: 72,
      head: [["Data", "Tipo", "Descrição", "Referência", "Forma Pgto", "Valor"]],
      body: filteredTransactions.map((t) => [
        new Date(t.date).toLocaleString("pt-BR"),
        t.type === "entrada" ? "Entrada" : "Saída",
        t.description ?? "-",
        t.reference ?? "-",
        PAYMENT_METHOD_LABEL[t.payment_method ?? ""] ?? t.payment_method ?? "-",
        `R$ ${Number(t.amount).toFixed(2)}`,
      ]),
    });

    const suffix =
      dateFrom || dateTo
        ? `${dateFrom ? format(dateFrom, "yyyy-MM-dd") : "x"}_a_${dateTo ? format(dateTo, "yyyy-MM-dd") : "x"}`
        : "todos";

    doc.save(`relatorio-caixa-${suffix}.pdf`);
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredTransactions.map((t) => ({
        Data: new Date(t.date).toLocaleString("pt-BR"),
        Tipo: t.type === "entrada" ? "Entrada" : "Saída",
        Descrição: t.description ?? "-",
        Categoria: t.category ?? "-",
        Referência: t.reference ?? "-",
        "Forma de Pagamento":
          PAYMENT_METHOD_LABEL[t.payment_method ?? ""] ?? t.payment_method ?? "-",
        "Valor (R$)": Number(t.amount).toFixed(2),
      }))
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transações");

    const summaryData = [
      { Métrica: "Período", Valor: periodText },
      { Métrica: "Total Entradas", Valor: `R$ ${summary.totalEntradas.toFixed(2)}` },
      { Métrica: "Total Saídas", Valor: `R$ ${summary.totalSaidas.toFixed(2)}` },
      { Métrica: "Saldo", Valor: `R$ ${summary.saldo.toFixed(2)}` },
      { Métrica: "Número de Transações", Valor: summary.transactions },
      { Métrica: "Ticket Médio (Entradas)", Valor: `R$ ${summary.avgTicketEntradas.toFixed(2)}` },
    ];

    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Resumo");

    const suffix =
      dateFrom || dateTo
        ? `${dateFrom ? format(dateFrom, "yyyy-MM-dd") : "x"}_a_${dateTo ? format(dateTo, "yyyy-MM-dd") : "x"}`
        : "todos";

    XLSX.writeFile(wb, `relatorio-caixa-${suffix}.xlsx`);
  };

  const columns = [
    {
      key: "type",
      header: "Tipo",
      render: (transaction: CashierTransaction) => (
        <Badge
          variant={transaction.type === "entrada" ? "default" : "destructive"}
          className={transaction.type === "entrada" ? "bg-green-500" : "bg-red-500"}
        >
          {transaction.type === "entrada" ? (
            <>
              <ArrowUpCircle className="h-3 w-3 mr-1" /> Entrada
            </>
          ) : (
            <>
              <ArrowDownCircle className="h-3 w-3 mr-1" /> Saída
            </>
          )}
        </Badge>
      ),
    },
    {
      key: "date",
      header: "Data/Hora",
      render: (t: CashierTransaction) =>
        t.date ? new Date(t.date).toLocaleDateString("pt-BR") : "-",
    },
    {
      key: "description",
      header: "Descrição",
      render: (transaction: CashierTransaction) => transaction.description ?? "-",
    },
    {
      key: "reference",
      header: "Referência",
      render: (transaction: CashierTransaction) => transaction.reference ?? "-",
    },
    {
      key: "payment_method",
      header: "Forma de Pagamento",
      render: (transaction: CashierTransaction) => {
        const m = transaction.payment_method;
        if (!m) return "-";
        return PAYMENT_METHOD_LABEL[m] ?? m;
      },
    },
    {
      key: "amount",
      header: "Valor",
      render: (transaction: CashierTransaction) => (
        <span
          className={
            transaction.type === "entrada"
              ? "text-green-600 font-semibold"
              : "text-red-600 font-semibold"
          }
        >
          {transaction.type === "entrada" ? "+" : "-"} R$ {Number(transaction.amount).toFixed(2)}
        </span>
      ),
    },
  ];

  if (isLoading && !transactionsRaw) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Caixa</h1>
            <p className="text-muted-foreground">Gestão financeira e relatórios</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Caixa</h1>
            <p className="text-muted-foreground">Gestão financeira e relatórios</p>
          </div>
        </div>
        <p className="text-sm text-red-500">
          Ocorreu um erro ao carregar os dados do caixa. Verifique suas permissões ou tente novamente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Caixa</h1>
          <p className="text-muted-foreground">Gestão financeira e relatórios</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToPDF}>
            <FileText className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <Button variant="outline" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* ✅ Filtros no estilo /appointments */}
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
                  {filteredTransactions.length} resultado
                  {filteredTransactions.length === 1 ? "" : "s"} encontrado
                  {filteredTransactions.length === 1 ? "" : "s"}
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
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    {dateFrom ? format(dateFrom, "P", { locale: ptBR }) : "Qualquer data"}
                    <CalendarIcon className="ml-2 h-3 w-3 opacity-60" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom ?? undefined}
                    onSelect={(d) => setDateFrom(d ?? null)}
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
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    {dateTo ? format(dateTo, "P", { locale: ptBR }) : "Qualquer data"}
                    <CalendarIcon className="ml-2 h-3 w-3 opacity-60" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo ?? undefined}
                    onSelect={(d) => setDateTo(d ?? null)}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-1 lg:col-span-2">
              <span className="text-[11px] font-medium text-muted-foreground">
                Forma de Pagamento
              </span>
              <MultiSelectString
                value={selectedPaymentMethods}
                onChange={setSelectedPaymentMethods}
                options={paymentMethodOptions}
                placeholder="Todas as formas"
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-muted-foreground">
                Tipo
              </span>
              <Select
                value={selectedType}
                onValueChange={(value) =>
                  setSelectedType(value as "all" | "entrada" | "saida")
                }
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="entrada">Entradas</SelectItem>
                  <SelectItem value="saida">Saídas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-muted-foreground">
                Categoria
              </span>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Categorias</SelectItem>
                  {uniqueCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entradas</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {summary.totalEntradas.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {hasActiveFilters ? periodText : "Todos os períodos"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saídas</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {summary.totalSaidas.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {hasActiveFilters ? periodText : "Todos os períodos"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                summary.saldo >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              R$ {summary.saldo.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Entradas - Saídas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transações</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.transactions}</div>
            <p className="text-xs text-muted-foreground">Total nos filtros</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {summary.avgTicketEntradas.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Por atendimento (entradas)</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Saídas Pendentes (Contas a Pagar)
            </CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              R$ {pendingPayablesTotal.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {hasActiveFilters ? `Previstas para: ${periodText}` : "Todas as pendências"}
            </p>
            {pendingPayablesInRange.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {pendingPayablesInRange.length} conta(s) pendente(s)
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Saldo Projetado (se pagar pendências)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                projectedBalance >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              R$ {projectedBalance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Saldo atual - saídas pendentes
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList className="grid grid-cols-4 lg:grid-cols-5 w-full">
          <TabsTrigger value="transactions">Todas</TabsTrigger>
          <TabsTrigger value="entradas">Entradas</TabsTrigger>
          <TabsTrigger value="saidas">Saídas</TabsTrigger>
          <TabsTrigger value="payment">Forma Pgto</TabsTrigger>
          <TabsTrigger value="category">Categorias</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Todas as Transações</CardTitle>
              <CardDescription>
                Lista completa de entradas e saídas{" "}
                {hasActiveFilters ? `(${periodText})` : "(todos os períodos)"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={filteredTransactions}
                columns={columns}
                searchPlaceholder="Buscar por descrição ou referência..."
              />
              {filteredTransactions.length === 0 && (
                <p className="text-sm text-muted-foreground italic mt-4">
                  Nenhuma transação encontrada para os filtros selecionados.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entradas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Receitas (Entradas)</CardTitle>
              <CardDescription>Entradas financeiras conforme filtros</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={filteredTransactions.filter((t) => t.type === "entrada")}
                columns={columns}
                searchPlaceholder="Buscar por descrição ou referência..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saidas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Despesas (Saídas)</CardTitle>
              <CardDescription>Saídas financeiras conforme filtros</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={filteredTransactions.filter((t) => t.type === "saida")}
                columns={columns}
                searchPlaceholder="Buscar por descrição ou referência..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Faturamento por Forma de Pagamento</CardTitle>
              <CardDescription>Distribuição de valores por método</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(summary.byPaymentMethod).length === 0 && (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma transação para exibir por forma de pagamento.
                  </p>
                )}
                {Object.entries(summary.byPaymentMethod).map(([method, amount]) => (
                  <div
                    key={method}
                    className="flex items-center justify-between border-b pb-2"
                  >
                    <span className="flex items-center gap-2 font-medium">
                      <CreditCard className="h-4 w-4" />
                      {PAYMENT_METHOD_LABEL[method] ?? method}
                    </span>
                    <span className="text-lg font-bold">R$ {amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="category" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Movimentação por Categoria</CardTitle>
              <CardDescription>Distribuição por categoria</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(summary.byCategory).length === 0 && (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma transação categorizada.
                  </p>
                )}
                {Object.entries(summary.byCategory)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, amount]) => (
                    <div
                      key={category}
                      className="flex items-center justify-between border-b pb-2"
                    >
                      <span className="font-medium">{category}</span>
                      <span className="text-lg font-bold">R$ {amount.toFixed(2)}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
