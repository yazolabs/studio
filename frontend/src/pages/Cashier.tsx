import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DollarSign, TrendingUp, ArrowUpCircle, ArrowDownCircle, Download, FileText, Tag, CreditCard, Check, X, Filter, ChevronDown, ChevronUp, Calendar as CalendarIcon, Lock, Search, XCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { listAccountsPayable } from "@/services/accountsPayableService";
import { listCashierTransactions } from "@/services/cashierTransactionsService";
import type { AccountPayable } from "@/types/account-payable";
import type { CashierTransaction } from "@/types/cashier-transaction";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { cashierLock, cashierUnlockStatus, type CashierPinStatus } from "@/services/cashierPinService";
import { CashierPinDialog } from "@/components/CashierPinDialog";

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

  const selectedLabels = options.filter((o) => value.includes(o.value)).map((o) => o.label);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
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

function MobileSearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>
      {value.trim().length > 0 && (
        <Button type="button" variant="outline" size="icon" onClick={() => onChange("")} aria-label="Limpar busca">
          <XCircle className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

function TransactionCards({
  data,
  paymentLabel,
}: {
  data: CashierTransaction[];
  paymentLabel: (m?: string | null) => string;
}) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Nenhuma transação encontrada para os filtros selecionados.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((t: any, idx) => {
        const key = t?.id ?? `${t?.reference ?? "ref"}-${t?.date ?? "date"}-${idx}`;
        const isEntrada = t.type === "entrada";

        return (
          <Card key={key} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={isEntrada ? "default" : "destructive"}
                      className={cn(isEntrada ? "bg-green-500" : "bg-red-500")}
                    >
                      {isEntrada ? (
                        <>
                          <ArrowUpCircle className="h-3 w-3 mr-1" /> Entrada
                        </>
                      ) : (
                        <>
                          <ArrowDownCircle className="h-3 w-3 mr-1" /> Saída
                        </>
                      )}
                    </Badge>

                    <span className="text-xs text-muted-foreground">
                      {t.date ? new Date(t.date).toLocaleDateString("pt-BR") : "-"}
                    </span>
                  </div>

                  <p className="mt-2 font-medium leading-snug break-words">
                    {t.description ?? "-"}
                  </p>

                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">Referência</span>
                      <span className="text-xs font-medium truncate max-w-[60%] text-right">
                        {t.reference ?? "-"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">Forma de pagamento</span>
                      <span className="text-xs font-medium text-right">{paymentLabel(t.payment_method)}</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div className={cn("text-lg font-bold", isEntrada ? "text-green-600" : "text-red-600")}>
                    {isEntrada ? "+" : "-"} R$ {Number(t.amount).toFixed(2)}
                  </div>
                  <p className="text-[11px] text-muted-foreground">Valor</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function Cashier() {
  const queryClient = useQueryClient();

  useEffect(() => {
    return () => {
      cashierLock().catch(() => {});
      queryClient.setQueryData<CashierPinStatus | undefined>(["cashier-pin-status"], (old) =>
        old ? { ...old, unlocked: false } : old
      );

      queryClient.removeQueries({ queryKey: ["cashier-transactions"] });
      queryClient.removeQueries({ queryKey: ["accounts-payable", "cashier"] });
    };
  }, [queryClient]);

  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pinDialogMode, setPinDialogMode] = useState<"unlock" | "set">("unlock");

  const {
    data: pinStatus,
    isLoading: pinStatusLoading,
    refetch: refetchPinStatus,
  } = useQuery<CashierPinStatus>({
    queryKey: ["cashier-pin-status"],
    queryFn: cashierUnlockStatus,
    retry: false,
  });

  const unlocked = pinStatus?.unlocked === true;
  const pinSet = pinStatus?.pin_set === true;

  const openPinDialog = useCallback(
    (forceMode?: "unlock" | "set") => {
      const nextMode = forceMode ?? (pinSet ? "unlock" : "set");
      setPinDialogMode(nextMode);
      setPinDialogOpen(true);
    },
    [pinSet]
  );

  useEffect(() => {
    if (!pinStatus) return;

    if (!pinSet) {
      openPinDialog("set");
      return;
    }

    if (!unlocked) {
      openPinDialog("unlock");
      return;
    }

    setPinDialogOpen(false);
  }, [pinStatus, pinSet, unlocked, openPinDialog]);

  const onPinSuccess = async () => {
    setPinDialogOpen(false);
    await refetchPinStatus();
    await queryClient.invalidateQueries({ queryKey: ["cashier-transactions"] });
    await queryClient.invalidateQueries({ queryKey: ["accounts-payable", "cashier"] });
  };

  const [selectedType, setSelectedType] = useState<"all" | "entrada" | "saida">("all");
  const [dateFrom, setDateFrom] = useState<Date | null>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });
  const [dateTo, setDateTo] = useState<Date | null>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [mobileSearch, setMobileSearch] = useState("");

  const [activeTab, setActiveTab] = useState<"transactions" | "entradas" | "saidas" | "payment" | "category">("transactions");

  useEffect(() => {
    setMobileSearch("");
  }, [activeTab]);

  const PAYMENT_METHOD_LABEL: Record<string, string> = {
    pix: "Pix",
    cash: "Dinheiro",
    debit: "Débito",
    credit: "Crédito",
    credit_link: "Crédito (link)",
  };

  const paymentLabel = useCallback(
    (m?: string | null) => {
      if (!m) return "-";
      return PAYMENT_METHOD_LABEL[m] ?? m;
    },
    [PAYMENT_METHOD_LABEL]
  );

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

  const today = toStartOfDay(new Date());

  const isDefaultTodayRange =
    !!dateFrom &&
    !!dateTo &&
    toStartOfDay(dateFrom).getTime() === today.getTime() &&
    toStartOfDay(dateTo).getTime() === today.getTime();

  const hasActiveFilters =
    selectedType !== "all" ||
    selectedCategory !== "all" ||
    selectedPaymentMethods.length > 0 ||
    !isDefaultTodayRange;

  useEffect(() => {
    if (hasActiveFilters) setFiltersOpen(true);
  }, [hasActiveFilters]);

  const clearFilters = () => {
    const today = toStartOfDay(new Date());
    setSelectedType("all");
    setSelectedCategory("all");
    setSelectedPaymentMethods([]);
    setDateFrom(today);
    setDateTo(today);
  };

  const periodText = useMemo(() => {
    const fmt = (d: Date) => format(d, "dd/MM/yyyy", { locale: ptBR });

    const fromDate = dateFrom ?? toStartOfDay(new Date());
    const toDate = dateTo ?? toStartOfDay(new Date());

    const fromTxt = fmt(fromDate);
    const toTxt = fmt(toDate);

    if (fromTxt === toTxt) return `Dia: ${fromTxt}`;
    return `${fromTxt} a ${toTxt}`;
  }, [dateFrom, dateTo]);

  const startDateParam = useMemo(() => {
    if (!dateFrom) return undefined;
    return format(dateFrom, "yyyy-MM-dd");
  }, [dateFrom]);

  const endDateParam = useMemo(() => {
    if (!dateTo) return undefined;
    return format(dateTo, "yyyy-MM-dd");
  }, [dateTo]);

  const typeParam = useMemo(() => {
    if (selectedType === "all") return undefined;
    return selectedType;
  }, [selectedType]);

  const {
    data: transactionsRaw,
    isLoading: transactionsLoading,
    isError: transactionsIsError,
    error: transactionsError,
  } = useQuery<CashierTransaction[]>({
    queryKey: ["cashier-transactions", startDateParam, endDateParam, typeParam],
    queryFn: () =>
      listCashierTransactions({
        startDate: startDateParam,
        endDate: endDateParam,
        type: typeParam,
      }),
    enabled: unlocked,
    retry: false,
  });

  useEffect(() => {
    if (!unlocked) return;
    if (!transactionsIsError) return;

    const status = (transactionsError as any)?.response?.status;
    const code = (transactionsError as any)?.response?.data?.code;

    if (status === 423 || code === "CASHIER_PIN_REQUIRED") {
      openPinDialog("unlock");

      queryClient.setQueryData<CashierPinStatus | undefined>(["cashier-pin-status"], (old) =>
        old ? { ...old, unlocked: false } : old
      );
    }
  }, [unlocked, transactionsIsError, transactionsError, queryClient, openPinDialog]);

  const { data: accountsPayableRaw } = useQuery<AccountPayable[]>({
    queryKey: ["accounts-payable", "cashier", startDateParam, endDateParam],
    queryFn: () =>
      listAccountsPayable({
        status: "pending",
        start_date: startDateParam,
        end_date: endDateParam,
      }),
    enabled: unlocked,
    retry: false,
  });

  const accountsPayable = useMemo(() => accountsPayableRaw ?? [], [accountsPayableRaw]);
  const transactions = useMemo(() => transactionsRaw ?? [], [transactionsRaw]);

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
      const categoryMatch = selectedCategory === "all" || (t.category && t.category === selectedCategory);

      const paymentMatch =
        selectedPaymentMethods.length === 0 || (t.payment_method && selectedPaymentMethods.includes(t.payment_method));

      return categoryMatch && paymentMatch;
    });
  }, [transactions, selectedCategory, selectedPaymentMethods]);

  const mobileSearchText = mobileSearch.trim().toLowerCase();
  const applyMobileSearch = useCallback(
    (rows: CashierTransaction[]) => {
      if (!mobileSearchText) return rows;
      return rows.filter((t) => {
        const d = (t.description ?? "").toLowerCase();
        const r = (t.reference ?? "").toLowerCase();
        return d.includes(mobileSearchText) || r.includes(mobileSearchText);
      });
    },
    [mobileSearchText]
  );

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

  const pendingPayablesInRange = useMemo(() => accountsPayable, [accountsPayable]);

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
        "Forma de Pagamento": PAYMENT_METHOD_LABEL[t.payment_method ?? ""] ?? t.payment_method ?? "-",
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
      render: (t: CashierTransaction) => (t.date ? new Date(t.date).toLocaleDateString("pt-BR") : "-"),
    },
    { key: "description", header: "Descrição", render: (t: CashierTransaction) => t.description ?? "-" },
    { key: "reference", header: "Referência", render: (t: CashierTransaction) => t.reference ?? "-" },
    {
      key: "payment_method",
      header: "Forma de Pagamento",
      render: (t: CashierTransaction) => paymentLabel(t.payment_method),
    },
    {
      key: "amount",
      header: "Valor",
      render: (t: CashierTransaction) => (
        <span className={t.type === "entrada" ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
          {t.type === "entrada" ? "+" : "-"} R$ {Number(t.amount).toFixed(2)}
        </span>
      ),
    },
  ];


  if (pinStatusLoading) {
    return (
      <div className="relative space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Caixa</h1>
            <p className="text-muted-foreground">Gestão financeira e relatórios</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Verificando acesso...</p>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="relative space-y-8 sm:space-y-10">
        <CashierPinDialog
          open={pinDialogOpen}
          mode={pinDialogMode}
          onSuccess={onPinSuccess}
          onOpenChange={setPinDialogOpen}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Caixa</h1>
            <p className="text-muted-foreground">Gestão financeira e relatórios</p>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
          <p className="text-sm text-muted-foreground">Para acessar esta tela, informe o PIN do caixa.</p>

          <Button onClick={() => openPinDialog()} className="w-full sm:w-auto">
            <Lock className="h-4 w-4 mr-2" />
            {pinSet ? "Inserir PIN" : "Definir PIN"}
          </Button>
        </div>
      </div>
    );
  }

  if (transactionsLoading && !transactionsRaw) {
    return (
      <div className="relative space-y-8 sm:space-y-10">
        <CashierPinDialog
          open={pinDialogOpen}
          mode={pinDialogMode}
          onSuccess={onPinSuccess}
          onOpenChange={setPinDialogOpen}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Caixa</h1>
            <p className="text-muted-foreground">Gestão financeira e relatórios</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (transactionsIsError) {
    const status = (transactionsError as any)?.response?.status;
    const code = (transactionsError as any)?.response?.data?.code;
    const pinRequired = status === 423 || code === "CASHIER_PIN_REQUIRED";

    return (
      <div className="relative space-y-8 sm:space-y-10">
        <CashierPinDialog
          open={pinDialogOpen}
          mode={pinDialogMode}
          onSuccess={onPinSuccess}
          onOpenChange={setPinDialogOpen}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Caixa</h1>
            <p className="text-muted-foreground">Gestão financeira e relatórios</p>
          </div>
        </div>

        <p className="text-sm text-red-500">
          {pinRequired
            ? "PIN do caixa requerido. Informe o PIN para continuar."
            : "Ocorreu um erro ao carregar os dados do caixa. Verifique suas permissões ou tente novamente."}
        </p>
      </div>
    );
  }


  return (
    <div className="relative space-y-8 sm:space-y-10">
      <CashierPinDialog
        open={pinDialogOpen}
        mode={pinDialogMode}
        onSuccess={onPinSuccess}
        onOpenChange={setPinDialogOpen}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Caixa</h1>
          <p className="text-muted-foreground">Gestão financeira e relatórios</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={async () => {
              await cashierLock();
              queryClient.removeQueries({ queryKey: ["cashier-transactions"] });
              queryClient.removeQueries({ queryKey: ["accounts-payable", "cashier"] });
              await refetchPinStatus();
            }}
          >
            <Lock className="h-4 w-4 mr-2" />
            Bloquear
          </Button>

          <Button variant="outline" className="w-full sm:w-auto" onClick={exportToPDF}>
            <FileText className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>

          <Button variant="outline" className="w-full sm:w-auto" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </div>

      <div className="bg-muted/40 border rounded-lg p-3 sm:p-4 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">Filtros</span>

              {hasActiveFilters && (
                <span className="text-[11px] text-muted-foreground">
                  {filteredTransactions.length} resultado{filteredTransactions.length === 1 ? "" : "s"} encontrado
                  {filteredTransactions.length === 1 ? "" : "s"}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-[11px] sm:text-xs"
                onClick={clearFilters}
              >
                Limpar filtros
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-[11px] sm:text-xs gap-1"
              onClick={() => setFiltersOpen((prev) => !prev)}
            >
              {filtersOpen ? "Ocultar filtros" : "Mostrar filtros"}
              {filtersOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        {filtersOpen && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 mt-2">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-muted-foreground">Data de</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("justify-between px-3 py-2 h-9 text-xs", !dateFrom && "text-muted-foreground")}
                  >
                    {dateFrom ? format(dateFrom, "P", { locale: ptBR }) : "Qualquer data"}
                    <CalendarIcon className="ml-2 h-3 w-3 opacity-60" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom ?? undefined}
                    onSelect={(d) => setDateFrom(d ?? toStartOfDay(new Date()))}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-muted-foreground">Data até</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("justify-between px-3 py-2 h-9 text-xs", !dateTo && "text-muted-foreground")}
                  >
                    {dateTo ? format(dateTo, "P", { locale: ptBR }) : "Qualquer data"}
                    <CalendarIcon className="ml-2 h-3 w-3 opacity-60" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo ?? undefined}
                    onSelect={(d) => setDateTo(d ?? toStartOfDay(new Date()))}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-1 lg:col-span-2 sm:col-span-2">
              <span className="text-[11px] font-medium text-muted-foreground">Forma de Pagamento</span>
              <MultiSelectString
                value={selectedPaymentMethods}
                onChange={setSelectedPaymentMethods}
                options={paymentMethodOptions}
                placeholder="Todas as formas"
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-muted-foreground">Tipo</span>
              <Select value={selectedType} onValueChange={(value) => setSelectedType(value as "all" | "entrada" | "saida")}>
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
              <span className="text-[11px] font-medium text-muted-foreground">Categoria</span>
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

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entradas</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R$ {summary.totalEntradas.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{periodText}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saídas</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">R$ {summary.totalSaidas.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{periodText}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.saldo >= 0 ? "text-green-600" : "text-red-600"}`}>
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
            <div className="text-2xl font-bold">R$ {summary.avgTicketEntradas.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Por atendimento (entradas)</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saídas Pendentes (Contas a Pagar)</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">R$ {pendingPayablesTotal.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{`Previstas para: ${periodText}`}</p>
            {pendingPayablesInRange.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">{pendingPayablesInRange.length} conta(s) pendente(s)</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Projetado (se pagar pendências)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${projectedBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
              R$ {projectedBalance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Saldo atual - saídas pendentes</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
        <div className="md:hidden">
          <Select value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <SelectTrigger className="w-full h-10">
              <SelectValue placeholder="Visualização" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="transactions">Todas</SelectItem>
              <SelectItem value="entradas">Entradas</SelectItem>
              <SelectItem value="saidas">Saídas</SelectItem>
              <SelectItem value="payment">Forma Pgto</SelectItem>
              <SelectItem value="category">Categorias</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsList className="hidden md:grid w-full grid-cols-5 gap-2">
          <TabsTrigger className="w-full" value="transactions">Todas</TabsTrigger>
          <TabsTrigger className="w-full" value="entradas">Entradas</TabsTrigger>
          <TabsTrigger className="w-full" value="saidas">Saídas</TabsTrigger>
          <TabsTrigger className="w-full" value="payment">Forma Pgto</TabsTrigger>
          <TabsTrigger className="w-full" value="category">Categorias</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Todas as Transações</CardTitle>
              <CardDescription>Lista completa de entradas e saídas ({periodText})</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="hidden md:block">
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
              </div>

              <div className="md:hidden space-y-4">
                <MobileSearchBar
                  value={mobileSearch}
                  onChange={setMobileSearch}
                  placeholder="Buscar por descrição ou referência..."
                />
                <TransactionCards data={applyMobileSearch(filteredTransactions)} paymentLabel={paymentLabel} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entradas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Receitas (Entradas)</CardTitle>
              <CardDescription>Entradas financeiras conforme filtros</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="hidden md:block">
                <DataTable
                  data={filteredTransactions.filter((t) => t.type === "entrada")}
                  columns={columns}
                  searchPlaceholder="Buscar por descrição ou referência..."
                />
              </div>

              <div className="md:hidden space-y-4">
                <MobileSearchBar
                  value={mobileSearch}
                  onChange={setMobileSearch}
                  placeholder="Buscar por descrição ou referência..."
                />
                <TransactionCards
                  data={applyMobileSearch(filteredTransactions.filter((t) => t.type === "entrada"))}
                  paymentLabel={paymentLabel}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saidas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Despesas (Saídas)</CardTitle>
              <CardDescription>Saídas financeiras conforme filtros</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="hidden md:block">
                <DataTable
                  data={filteredTransactions.filter((t) => t.type === "saida")}
                  columns={columns}
                  searchPlaceholder="Buscar por descrição ou referência..."
                />
              </div>

              <div className="md:hidden space-y-4">
                <MobileSearchBar
                  value={mobileSearch}
                  onChange={setMobileSearch}
                  placeholder="Buscar por descrição ou referência..."
                />
                <TransactionCards
                  data={applyMobileSearch(filteredTransactions.filter((t) => t.type === "saida"))}
                  paymentLabel={paymentLabel}
                />
              </div>
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
                  <div key={method} className="flex items-center justify-between border-b pb-2">
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
                  <p className="text-muted-foreground text-center py-8">Nenhuma transação categorizada.</p>
                )}
                {Object.entries(summary.byCategory)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, amount]) => (
                    <div key={category} className="flex items-center justify-between border-b pb-2">
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
