import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/DataTable";
import { Plus, Pencil } from "lucide-react";
import { usePermission } from "@/hooks/usePermission";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { listItems } from "@/services/itemsService";
import { listItemPrices, createItemPrice, updateItemPrice } from "@/services/itemPricesService";
import type { Item } from "@/types/item";
import type { ItemPrice, CreateItemPriceDto } from "@/types/item-price";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { formatCurrencyInput, displayCurrency, displayPercentage } from "@/utils/formatters";

const priceSchema = z.object({
  item_id: z.string().min(1, "Item é obrigatório"),
  cost: z.coerce.number().min(0, "Preço de custo inválido"),
  price: z.coerce.number().min(0, "Preço de venda inválido"),
  margin: z.coerce.number().optional(),
  notes: z.string().trim().max(200).optional(),
});

type PriceFormData = z.infer<typeof priceSchema>;

const defaultFormValues: PriceFormData = {
  item_id: "",
  cost: 0,
  price: 0,
  margin: 0,
  notes: "",
};

export default function ItemPrices() {
  const [itemPrices, setItemPrices] = useState<ItemPrice[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ItemPrice | null>(null);
  const { can } = usePermission();
  const isMobile = useIsMobile();

  const form = useForm<PriceFormData>({
    resolver: zodResolver(priceSchema),
    defaultValues: defaultFormValues,
  });

  function extractData<T>(response: T[] | { data: T[] }): T[] {
    return Array.isArray((response as any).data)
      ? (response as { data: T[] }).data
      : (response as T[]);
  }

  async function load() {
    setLoading(true);
    try {
      const [itemsData, pricesData] = await Promise.all([
        listItems({ perPage: 100 }),
        listItemPrices({ perPage: 100 }),
      ]);

      setItems(extractData<Item>(itemsData));
      setItemPrices(extractData<ItemPrice>(pricesData));
    } catch (err: any) {
      toast({
        title: "Erro ao carregar dados",
        description:
          err?.response?.data?.message ??
          "Não foi possível carregar os preços.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const handleOpenDialog = (price?: ItemPrice) => {
    if (price) {
      setEditing(price);
      form.reset({
        item_id: String(price.item_id),
        cost: Number(price.cost ?? 0),
        price: Number(price.price ?? 0),
        margin: Number(price.margin ?? 0),
        notes: price.notes ?? "",
      });
    } else {
      setEditing(null);
      form.reset(defaultFormValues);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditing(null);
    setIsDialogOpen(false);
    form.reset(defaultFormValues);
  };

  const onSubmit = async (values: PriceFormData) => {
    const costNumber = Number(values.cost) || 0;
    const priceNumber = Number(values.price) || 0;

    const marginPercent =
      costNumber > 0 ? ((priceNumber - costNumber) / costNumber) * 100 : 0;

    const payload: CreateItemPriceDto = {
      item_id: Number(values.item_id),
      price: priceNumber.toFixed(2),
      cost: costNumber.toFixed(2),
      margin: marginPercent.toFixed(2),
      effective_date: format(new Date(), "yyyy-MM-dd"),
      notes: values.notes ?? null,
    };

    try {
      if (editing) {
        await updateItemPrice(editing.id, payload);
        toast({
          title: "Preço atualizado",
          description: "Alterações salvas com sucesso.",
        });
      } else {
        await createItemPrice(payload);
        toast({
          title: "Preço cadastrado",
          description: "Novo preço adicionado com sucesso.",
        });
      }
      handleCloseDialog();
      await load();
    } catch (err: any) {
      toast({
        title: "Erro ao salvar preço",
        description:
          err?.response?.data?.message ??
          "Verifique os campos e tente novamente.",
        variant: "destructive",
      });
    }
  };

  const columns = [
    {
      key: "item_id",
      header: "Item",
      render: (p: ItemPrice) =>
        items.find((i) => i.id === p.item_id)?.name ?? "-",
    },
    {
      key: "price",
      header: "Preço Venda",
      render: (p: ItemPrice) =>
        displayCurrency(Number(p.price) || 0),
    },
    {
      key: "cost",
      header: "Custo",
      render: (p: ItemPrice) =>
        displayCurrency(Number(p.cost) || 0),
    },
    {
      key: "margin",
      header: "Margem",
      render: (p: ItemPrice) =>
        p.margin != null
          ? `${displayPercentage(Number(p.margin) || 0)}%`
          : "-",
    },
    {
      key: "effective_date",
      header: "Vigência",
      render: (p: ItemPrice) =>
        p.effective_date
          ? new Date(p.effective_date).toLocaleDateString("pt-BR")
          : "-",
    },
    {
      key: "notes",
      header: "Observações",
      render: (p: ItemPrice) => p.notes ?? "-",
    },
    {
      key: "actions",
      header: "Ações",
      render: (p: ItemPrice) => (
        <div className="flex gap-2">
          {can("item-prices", "update") && (
            <Button
              variant="ghost"
              size={isMobile ? "sm" : "icon"}
              onClick={() => handleOpenDialog(p)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const selecteditem_id = form.watch("item_id");
  const selectedItem = items.find((i) => String(i.id) === selecteditem_id);

  const watchedCost = Number(form.watch("cost") || 0);
  const watchedPrice = Number(form.watch("price") || 0);
  const hasMargin = watchedCost > 0 && watchedPrice > 0;
  const profit = hasMargin ? watchedPrice - watchedCost : 0;
  const marginPercent = hasMargin
    ? ((watchedPrice - watchedCost) / watchedCost) * 100
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Preços de Itens</h1>
          <p className="text-muted-foreground">
            Gerencie os preços e margens de lucro dos produtos
          </p>
        </div>
        {can("item-prices", "create") && (
          <Button
            className={cn("shadow-md", isMobile && "w-full")}
            onClick={() => handleOpenDialog()}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Preço
          </Button>
        )}
      </div>

      <DataTable
        data={itemPrices}
        columns={columns}
        searchPlaceholder="Buscar preços..."
        loading={loading}
      />

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditing(null);
            form.reset(defaultFormValues);
          }
        }}
      >
        <DialogContent
          className={cn(
            "max-h-[90vh]",
            isMobile ? "max-w-[95vw]" : "max-w-2xl"
          )}
        >
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar Preço" : "Novo Preço"}
            </DialogTitle>
            <DialogDescription>
              Defina o preço, custo e margem de lucro do item selecionado.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Seção: Item */}
              <section className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Item
                </h3>

                <FormField
                  control={form.control}
                  name="item_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Item <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!!editing}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o item" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {items.map((i) => (
                            <SelectItem key={i.id} value={String(i.id)}>
                              {i.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedItem && (
                  <div className="p-3 bg-muted rounded-md text-sm">
                    <p className="font-medium">{selectedItem.name}</p>
                    <div className="flex justify-between mt-2 text-muted-foreground text-sm">
                      <span>
                        Custo atual:{" "}
                        {displayCurrency(Number(selectedItem.cost ?? 0) || 0)}
                      </span>
                      <span>
                        Venda atual:{" "}
                        {displayCurrency(Number(selectedItem.price ?? 0) || 0)}
                      </span>
                    </div>
                  </div>
                )}
              </section>

              {/* Seção: Preços e margem */}
              <section className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Preços e margem
                </h3>

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
                                : formatCurrencyInput(
                                    field.value?.toString() || ""
                                  )
                            }
                            onChange={(e) => {
                              const formatted = formatCurrencyInput(
                                e.target.value
                              );
                              field.onChange(
                                formatted
                                  .replace(/[^\d,]/g, "")
                                  .replace(",", ".")
                              );
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Preço pago ao fornecedor
                        </FormDescription>
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
                            placeholder="Ex: R$ 25,00"
                            value={
                              Number(field.value) > 1
                                ? displayCurrency(Number(field.value))
                                : formatCurrencyInput(
                                    field.value?.toString() || ""
                                  )
                            }
                            onChange={(e) => {
                              const formatted = formatCurrencyInput(
                                e.target.value
                              );
                              field.onChange(
                                formatted
                                  .replace(/[^\d,]/g, "")
                                  .replace(",", ".")
                              );
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Preço cobrado ao cliente
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {hasMargin && (
                  <div className="p-3 bg-muted rounded-md text-sm">
                    <p className="font-medium">Margem de Lucro Estimada</p>
                    <p className="text-2xl font-bold mt-1">
                      {displayPercentage(marginPercent)}%
                    </p>
                    <p className="text-muted-foreground">
                      Lucro unitário: {displayCurrency(profit)}
                    </p>
                  </div>
                )}
              </section>

              {/* Seção: Observações */}
              <section className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Observações
                </h3>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Motivo da alteração (opcional)"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </section>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editing ? "Salvar Alterações" : "Criar Preço"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
