import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/DataTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Plus,
  Pencil,
  Trash2,
  Filter,
  ChevronDown,
  ChevronUp,
  Package,
  AlertTriangle,
  DollarSign,
  Barcode,
} from "lucide-react";

import { usePermission } from "@/hooks/usePermission";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

import { listItems, createItem, updateItem, removeItem } from "@/services/itemsService";
import type { Item, CreateItemDto } from "@/types/item";
import {
  formatCurrencyInput,
  formatPercentageInput,
  displayCurrency,
  displayPercentage,
} from "@/utils/formatters";

const PRODUCT_CATEGORIES = [
  "Cabelo",
  "Unhas",
  "Estética",
  "Cuidados Íntimos",
  "Comedoria",
  "Cortesia",
] as const;

const itemSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(160),
  description: z.string().trim().max(500).optional(),
  category: z.string().trim().optional().default(""),
  stock: z.coerce.number().min(0, "Estoque não pode ser negativo"),
  min_stock: z.coerce.number().min(0, "Estoque mínimo não pode ser negativo"),
  barcode: z.string().trim().max(80).optional(),
  cost: z.coerce.number().min(0, "Preço de custo inválido"),
  price: z.coerce.number().min(0, "Preço de venda inválido"),
  commission_type: z.enum(["percentage", "fixed"]),
  commission_value: z.coerce.number().min(0, "Valor da comissão deve ser positivo"),
});

type ItemFormData = z.infer<typeof itemSchema>;

const defaultFormValues: ItemFormData = {
  name: "",
  description: "",
  category: "",
  stock: 0,
  min_stock: 0,
  barcode: "",
  cost: 0,
  price: 0,
  commission_type: "percentage",
  commission_value: 0,
};

type StockFilter = "all" | "low" | "ok";

export default function Items() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");

  const { can } = usePermission();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const showActions = can("items", "update") || can("items", "delete");

  const form = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: defaultFormValues,
  });

  const load = async () => {
    setLoading(true);
    try {
      const result = await listItems({ page: 1, perPage: 200 });
      setItems(result.data ?? []);
    } catch (err: any) {
      toast({
        title: "Erro ao carregar itens",
        description: err?.response?.data?.message ?? "Não foi possível carregar os itens.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = () => {
    setEditingItem(null);
    form.reset(defaultFormValues);
    setDialogOpen(true);
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    form.reset({
      name: item.name,
      description: item.description ?? "",
      category: item.category ?? "",
      stock: item.stock,
      min_stock: item.min_stock,
      barcode: item.barcode ?? "",
      cost: Number(item.cost),
      price: Number(item.price),
      commission_type: item.commission_type ?? "percentage",
      commission_value: Number(item.commission_value),
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    setDeletingItemId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingItemId) return;

    try {
      await removeItem(deletingItemId);
      toast({ title: "Item excluído", description: "Removido com sucesso." });
      await load();
    } catch (err: any) {
      toast({
        title: "Erro ao excluir",
        description: err?.response?.data?.message ?? "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeletingItemId(null);
    }
  };

  const onSubmit = async (values: ItemFormData) => {
    const payload: CreateItemDto = {
      name: values.name,
      description: values.description || null,
      category: values.category || null,
      stock: values.stock,
      min_stock: values.min_stock,
      barcode: values.barcode || null,
      cost: Number(values.cost || 0).toFixed(2),
      price: Number(values.price || 0).toFixed(2),
      commission_type: values.commission_type,
      commission_value: Number(values.commission_value || 0).toFixed(2),
      supplier_id: null,
    };

    try {
      if (editingItem) {
        await updateItem(editingItem.id, payload);
        toast({ title: "Item atualizado", description: "Alterações salvas com sucesso." });
      } else {
        await createItem(payload);
        toast({ title: "Item criado", description: "Novo item adicionado com sucesso." });
      }

      setDialogOpen(false);
      setEditingItem(null);
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

  const hasActiveFilters = categoryFilter !== "all" || stockFilter !== "all";

  useEffect(() => {
    if (hasActiveFilters) setFiltersOpen(true);
  }, [hasActiveFilters]);

  const clearFilters = () => {
    setCategoryFilter("all");
    setStockFilter("all");
  };

  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      const byCategory =
        categoryFilter === "all" || String(it.category ?? "") === String(categoryFilter);

      const isLow = Number(it.stock || 0) < Number(it.min_stock || 0);
      const byStock =
        stockFilter === "all" ||
        (stockFilter === "low" ? isLow : !isLow);

      return byCategory && byStock;
    });
  }, [items, categoryFilter, stockFilter]);

  const stats = useMemo(() => {
    const total = items.length;
    const lowStock = items.filter((it) => Number(it.stock || 0) < Number(it.min_stock || 0)).length;

    const totalUnits = items.reduce((sum, it) => sum + Number(it.stock || 0), 0);

    const stockValueCost = items.reduce(
      (sum, it) => sum + (Number(it.stock || 0) * Number(it.cost || 0)),
      0
    );

    const stockValueSale = items.reduce(
      (sum, it) => sum + (Number(it.stock || 0) * Number(it.price || 0)),
      0
    );

    return { total, lowStock, totalUnits, stockValueCost, stockValueSale };
  }, [items]);

  const commissionText = (it: Item) => {
    const type = String(it.commission_type || "").toLowerCase();
    const v = Number(it.commission_value || 0);

    if (type === "percentage") {
      const txt = String(displayPercentage(v) ?? "").trim();
      return txt.includes("%") ? txt : `${txt}%`;
    }

    const money = String(displayCurrency(v) ?? "").trim();
    return money.startsWith("R$") ? money : `R$ ${money}`;
  };

  const stockBadge = (it: Item) => {
    const low = Number(it.stock || 0) < Number(it.min_stock || 0);
    const label = `${it.stock} / min ${it.min_stock}`;

    return (
      <Badge variant={low ? "destructive" : "outline"} className="whitespace-nowrap">
        {label}
      </Badge>
    );
  };

  const columnsBase = [
    {
      key: "name",
      header: "Item",
      render: (it: Item) => (
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-medium truncate">{it.name}</span>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            <Badge variant="secondary" className="text-[11px]">
              {it.category ?? "Sem categoria"}
            </Badge>

            <Badge variant="outline" className="text-[11px]">
              Comissão: {commissionText(it)}
            </Badge>

            {it.barcode ? (
              <Badge variant="outline" className="text-[11px] flex items-center gap-1">
                <Barcode className="h-3 w-3" />
                <span className="truncate max-w-[140px]">{it.barcode}</span>
              </Badge>
            ) : null}

            {Number(it.stock || 0) < Number(it.min_stock || 0) ? (
              <Badge variant="destructive" className="text-[11px]">
                Baixo estoque
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[11px]">
                Estoque ok
              </Badge>
            )}
          </div>

          {it.description ? (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {it.description}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: "stock",
      header: "Estoque",
      render: (it: Item) => stockBadge(it),
    },
    {
      key: "cost",
      header: "Custo",
      render: (it: Item) => (
        <span className="whitespace-nowrap">{displayCurrency(Number(it.cost) || 0)}</span>
      ),
    },
    {
      key: "price",
      header: "Venda",
      render: (it: Item) => (
        <span className="whitespace-nowrap font-medium">{displayCurrency(Number(it.price) || 0)}</span>
      ),
    },
  ];

  const columns = showActions
    ? [
        ...columnsBase,
        {
          key: "actions",
          header: "Ações",
          render: (it: Item) => (
            <div className="flex justify-end gap-2">
              {can("items", "update") && (
                <Button
                  variant="ghost"
                  size={isMobile ? "sm" : "icon"}
                  onClick={() => handleEdit(it)}
                  title="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              {can("items", "delete") && (
                <Button
                  variant="ghost"
                  size={isMobile ? "sm" : "icon"}
                  onClick={() => handleDelete(it.id)}
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
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Itens</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Gerencie o estoque de produtos e materiais
          </p>
        </div>

        {can("items", "create") && (
          <Button className={cn("shadow-sm", isMobile && "w-full")} onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Item
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Cadastrados</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Baixo estoque</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lowStock}</div>
            <p className="text-xs text-muted-foreground">Abaixo do mínimo</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unidades</CardTitle>
            <Badge variant="secondary" className="text-xs">
              total
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUnits}</div>
            <p className="text-xs text-muted-foreground">Somatório do estoque</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor (custo)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayCurrency(stats.stockValueCost)}</div>
            <p className="text-xs text-muted-foreground">Estoque × custo</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor (venda)</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayCurrency(stats.stockValueSale)}</div>
            <p className="text-xs text-muted-foreground">Estoque × venda</p>
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
                  {filteredItems.length} resultado{filteredItems.length === 1 ? "" : "s"}
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
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-muted-foreground">
                Estoque
              </span>
              <Select value={stockFilter} onValueChange={(v) => setStockFilter(v as StockFilter)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ok">OK</SelectItem>
                  <SelectItem value="low">Baixo estoque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Lista de Itens</CardTitle>
            <CardDescription>
              {loading
                ? "Carregando..."
                : `${filteredItems.length} item${filteredItems.length === 1 ? "" : "s"} encontrado${filteredItems.length === 1 ? "" : "s"}`}
            </CardDescription>
          </div>

          {can("items", "create") && !isMobile && (
            <Button variant="outline" onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar
            </Button>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          <DataTable
            data={filteredItems}
            columns={columns}
            searchPlaceholder="Buscar itens..."
            loading={loading}
          />
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingItem(null);
            form.reset(defaultFormValues);
          }
        }}
      >
        <DialogContent className={cn("max-h-[90vh]", isMobile ? "max-w-[95vw]" : "max-w-2xl")}>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Editar Item" : "Novo Item"}</DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Atualize as informações do item."
                : "Preencha os dados para cadastrar um novo item."}
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
                          <Input placeholder="Nome do item" {...field} />
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
                            {PRODUCT_CATEGORIES.map((cat) => (
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

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descrição do item" className="resize-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Estoque e identificação</h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="barcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código de Barras</FormLabel>
                        <FormControl>
                          <Input placeholder="EAN/Código" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Estoque Atual <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="min_stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Estoque Mínimo <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Preços</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Preço de Custo <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: R$ 10,00"
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

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Preço de Venda <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: R$ 20,00"
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

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    setEditingItem(null);
                    form.reset(defaultFormValues);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">{editingItem ? "Salvar Alterações" : "Criar Item"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
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
