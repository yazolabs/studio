import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { usePermission } from '@/hooks/usePermission';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { formatPercentageInput, displayPercentage, displayCurrency, formatCurrencyInput } from '@/utils/formatters';
import { usePromotionsQuery, useCreatePromotion, useUpdatePromotion, useDeletePromotion } from '@/hooks/promotions';
import type { Promotion, CreatePromotionDto } from '@/types/promotion';

const WEEKDAY_OPTIONS = [
  { value: 1, label: 'Segunda', short: 'Seg' },
  { value: 2, label: 'Terça', short: 'Ter' },
  { value: 3, label: 'Quarta', short: 'Qua' },
  { value: 4, label: 'Quinta', short: 'Qui' },
  { value: 5, label: 'Sexta', short: 'Sex' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
  { value: 0, label: 'Domingo', short: 'Dom' },
];

const WEEKDAY_LABELS: Record<number, string> = {
  0: 'Dom',
  1: 'Seg',
  2: 'Ter',
  3: 'Qua',
  4: 'Qui',
  5: 'Sex',
  6: 'Sáb',
};

const promotionSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(160),
  description: z.string().optional(),
  discount_type: z.enum(['percentage', 'fixed']),
  discount_value: z.coerce.number().min(0, 'Valor do desconto deve ser positivo'),
  start_date: z.string().min(1, 'Data de início é obrigatória'),
  end_date: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive']),
  min_purchase_amount: z.coerce.number().min(0).optional(),
  max_discount: z.coerce.number().min(0).optional(),
  recurrence_type: z.enum(['none', 'weekly', 'monthly_weekday', 'yearly']),
  recurrence_weekdays: z.array(z.number().int().min(0).max(6)).optional(),
  recurrence_week_of_month: z.coerce.number().int().min(1).max(5).optional().nullable(),
  recurrence_day_of_year: z.string().optional().nullable(),
});

type PromotionFormData = z.infer<typeof promotionSchema>;

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-';

  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;

  const [yearStr, monthStr, dayStr] = parts;
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (!year || !month || !day) return dateStr;

  const d = new Date(year, month - 1, day);

  if (Number.isNaN(d.getTime())) return dateStr;

  return d.toLocaleDateString('pt-BR');
};

const formatDiscount = (promotion: Promotion) => {
  if (!promotion.discount_value) return '-';
  const n = Number(promotion.discount_value);
  if (promotion.discount_type === 'percentage') {
    return `${n.toFixed(2).replace('.', ',')}%`;
  }
  return `R$ ${n.toFixed(2).replace('.', ',')}`;
};

const formatRecurrence = (p: Promotion) => {
  if (!p.is_recurring || !p.recurrence_type) return 'Não recorrente';

  if (p.recurrence_type === 'weekly') {
    const days = (p.recurrence_weekdays ?? [])
      .map((d) => WEEKDAY_LABELS[d] ?? String(d))
      .join(', ');
    return days ? `Semanal (${days})` : 'Semanal';
  }

  if (p.recurrence_type === 'monthly_weekday') {
    const days = (p.recurrence_weekdays ?? [])
      .map((d) => WEEKDAY_LABELS[d] ?? String(d))
      .join(', ');
    const weekLabel = p.recurrence_week_of_month
      ? `${p.recurrence_week_of_month}ª semana`
      : '';
    if (days && weekLabel) return `Mensal (${weekLabel} - ${days})`;
    if (weekLabel) return `Mensal (${weekLabel})`;
    return 'Mensal (dia da semana)';
  }

  if (p.recurrence_type === 'yearly') {
    if (p.recurrence_day_of_year) {
      const [mm, dd] = p.recurrence_day_of_year.split('-');
      return `Anual (${dd}/${mm})`;
    }
    return 'Anual';
  }

  return 'Recorrente';
};

export default function Promotions() {
  const { toast } = useToast();
  const { can } = usePermission();
  const isMobile = useIsMobile();

  const { data: promotionsData, isLoading } = usePromotionsQuery();
  const promotions = promotionsData ?? [];

  const createPromotion = useCreatePromotion();
  const updatePromotion = useUpdatePromotion();
  const deletePromotion = useDeletePromotion();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const form = useForm<PromotionFormData>({
    resolver: zodResolver(promotionSchema),
    defaultValues: {
      name: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 0,
      start_date: '',
      end_date: '',
      status: 'active',
      min_purchase_amount: undefined,
      max_discount: undefined,
      recurrence_type: 'none',
      recurrence_weekdays: [],
      recurrence_week_of_month: undefined,
      recurrence_day_of_year: null,
    },
  });

  const resetToDefaults = () => {
    form.reset({
      name: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 0,
      start_date: '',
      end_date: '',
      status: 'active',
      min_purchase_amount: undefined,
      max_discount: undefined,
      recurrence_type: 'none',
      recurrence_weekdays: [],
      recurrence_week_of_month: undefined,
      recurrence_day_of_year: null,
    });
  };

  const handleAdd = () => {
    setEditingPromotion(null);
    resetToDefaults();
    setDialogOpen(true);
  };

  const handleEdit = (promotion: Promotion) => {
    const recurrenceType =
      promotion.is_recurring && promotion.recurrence_type
        ? promotion.recurrence_type
        : 'none';

    form.reset({
      name: promotion.name,
      description: promotion.description ?? '',
      discount_type: promotion.discount_type,
      discount_value: Number(promotion.discount_value ?? 0),
      start_date: promotion.start_date ?? '',
      end_date: promotion.end_date ?? '',
      status: promotion.active ? 'active' : 'inactive',
      min_purchase_amount:
        promotion.min_purchase_amount != null
          ? Number(promotion.min_purchase_amount)
          : undefined,
      max_discount:
        promotion.max_discount != null
          ? Number(promotion.max_discount)
          : undefined,
      recurrence_type: recurrenceType as PromotionFormData['recurrence_type'],
      recurrence_weekdays: promotion.recurrence_weekdays ?? [],
      recurrence_week_of_month: promotion.recurrence_week_of_month ?? undefined,
      recurrence_day_of_year: promotion.recurrence_day_of_year ?? null,
    });

    setEditingPromotion(promotion);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPromotion(null);
    resetToDefaults();
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;

    try {
      await deletePromotion.mutateAsync(deletingId);
      toast({
        title: 'Promoção excluída',
        description: 'Removida com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir promoção',
        description: error?.response?.data?.message ?? 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const onSubmit = async (values: PromotionFormData) => {
    const isRecurring = values.recurrence_type !== 'none';
    const discountValueForApi = values.discount_value.toFixed(2);

    const payload: CreatePromotionDto = {
      name: values.name,
      description: values.description || null,
      discount_type: values.discount_type,
      discount_value: discountValueForApi,
      start_date: values.start_date,
      end_date: values.end_date || null,
      active: values.status === 'active',
      min_purchase_amount:
        values.min_purchase_amount != null
          ? values.min_purchase_amount.toString()
          : null,
      max_discount:
        values.max_discount != null ? values.max_discount.toString() : null,
      is_recurring: isRecurring,
      recurrence_type:
        isRecurring && values.recurrence_type !== 'none'
          ? values.recurrence_type
          : null,
      recurrence_weekdays:
        isRecurring &&
        (values.recurrence_type === 'weekly' ||
          values.recurrence_type === 'monthly_weekday')
          ? values.recurrence_weekdays && values.recurrence_weekdays.length > 0
            ? values.recurrence_weekdays
            : null
          : null,
      recurrence_week_of_month:
        isRecurring && values.recurrence_type === 'monthly_weekday'
          ? values.recurrence_week_of_month ?? null
          : null,
      recurrence_day_of_year:
        isRecurring && values.recurrence_type === 'yearly'
          ? values.recurrence_day_of_year ?? null
          : null,
    };

    try {
      if (editingPromotion) {
        await updatePromotion.mutateAsync({
          id: editingPromotion.id,
          data: payload,
        });
        toast({
          title: 'Promoção atualizada',
          description: 'Alterações salvas com sucesso.',
        });
      } else {
        await createPromotion.mutateAsync(payload);
        toast({
          title: 'Promoção criada',
          description: 'Nova promoção adicionada com sucesso.',
        });
      }
      handleCloseDialog();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar promoção',
        description:
          error?.response?.data?.message ??
          'Verifique os dados e tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const discountType = form.watch('discount_type');
  const recurrenceType = form.watch('recurrence_type');

  const columns = [
    {
      key: 'name',
      header: 'Nome',
      render: (p: Promotion) => p.name,
    },
    {
      key: 'discount',
      header: 'Desconto',
      render: (p: Promotion) => formatDiscount(p),
    },
    {
      key: 'period',
      header: 'Período',
      render: (p: Promotion) => {
        const start = formatDate(p.start_date);
        const end = formatDate(p.end_date);
        return end && end !== '-' ? `${start} até ${end}` : start;
      },
    },
    {
      key: 'recurrence',
      header: 'Recorrência',
      render: (p: Promotion) => formatRecurrence(p),
    },
    {
      key: 'status',
      header: 'Status',
      render: (p: Promotion) => (
        <Badge variant={p.active ? 'default' : 'secondary'}>
          {p.active ? 'Ativa' : 'Inativa'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (p: Promotion) => (
        <div className="flex gap-2">
          {can('promotions', 'update') && (
            <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}

          {can('promotions', 'delete') && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setDeletingId(p.id);
                setDeleteDialogOpen(true);
              }}
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
          <h1 className="text-3xl font-bold tracking-tight">Promoções</h1>
          <p className="text-muted-foreground">
            Gerencie promoções e descontos do salão
          </p>
        </div>

        {can('promotions', 'create') && (
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              if (!open) {
                handleCloseDialog();
              } else {
                setDialogOpen(true);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button
                className={cn('shadow-md', isMobile && 'w-full')}
                onClick={handleAdd}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova Promoção
              </Button>
            </DialogTrigger>

            <DialogContent
              className={cn(
                'max-h-[90vh]',
                isMobile ? 'max-w-[95vw]' : 'max-w-2xl',
              )}
            >
              <DialogHeader>
                <DialogTitle>
                  {editingPromotion ? 'Editar Promoção' : 'Nova Promoção'}
                </DialogTitle>
              </DialogHeader>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <section className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Informações gerais
                    </h3>

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Nome <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nome da promoção"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Descreva a promoção em detalhes..."
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </section>

                  <section className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Desconto
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="discount_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de desconto</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="percentage">
                                  Percentual (%)
                                </SelectItem>
                                <SelectItem value="fixed">
                                  Valor Fixo (R$)
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="discount_value"
                        render={({ field }) => (
                          <FormItem className="sm:col-span-2">
                            <FormLabel>
                              {discountType === 'percentage'
                                ? 'Desconto (%)'
                                : 'Desconto (R$)'}
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder={
                                  discountType === 'percentage'
                                    ? 'Ex: 10,00'
                                    : 'Ex: R$ 20,00'
                                }
                                value={
                                  discountType === 'percentage'
                                    ? displayPercentage(field.value)
                                    : Number(field.value) > 1
                                    ? displayCurrency(Number(field.value))
                                    : formatCurrencyInput(
                                        field.value?.toString() || '',
                                      )
                                }
                                onChange={(e) => {
                                  const value = e.target.value;

                                  if (discountType === 'percentage') {
                                    const formatted =
                                      formatPercentageInput(value);
                                    field.onChange(
                                      formatted.replace(',', '.'),
                                    );
                                  } else {
                                    const formatted =
                                      formatCurrencyInput(value);
                                    field.onChange(
                                      formatted
                                        .replace(/[^\d,]/g, '')
                                        .replace(',', '.'),
                                    );
                                  }
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
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Período e status
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="start_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Data de início{' '}
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="end_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data de término (opcional)</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                value={field.value ?? ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="active">Ativa</SelectItem>
                                <SelectItem value="inactive">Inativa</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </section>

                  <section className="space-y-3 border rounded-md p-3">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Recorrência
                    </h3>

                    <FormField
                      control={form.control}
                      name="recurrence_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de recorrência</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sem recorrência" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">
                                Sem recorrência
                              </SelectItem>
                              <SelectItem value="weekly">
                                Semanal (dias fixos)
                              </SelectItem>
                              <SelectItem value="monthly_weekday">
                                Mensal (dia da semana)
                              </SelectItem>
                              <SelectItem value="yearly">
                                Anual (data fixa)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {(recurrenceType === 'weekly' ||
                      recurrenceType === 'monthly_weekday') && (
                      <FormField
                        control={form.control}
                        name="recurrence_weekdays"
                        render={({ field }) => {
                          const value = field.value || [];
                          return (
                            <FormItem>
                              <FormLabel>Dias da semana</FormLabel>
                              <FormControl>
                                <div className="flex flex-wrap gap-2">
                                  {WEEKDAY_OPTIONS.map((wd) => {
                                    const isSelected = value.includes(
                                      wd.value,
                                    );
                                    return (
                                      <Button
                                        key={wd.value}
                                        type="button"
                                        variant={
                                          isSelected ? 'default' : 'outline'
                                        }
                                        size="sm"
                                        onClick={() => {
                                          if (isSelected) {
                                            field.onChange(
                                              value.filter(
                                                (v) => v !== wd.value,
                                              ),
                                            );
                                          } else {
                                            field.onChange([
                                              ...value,
                                              wd.value,
                                            ]);
                                          }
                                        }}
                                      >
                                        {wd.short}
                                      </Button>
                                    );
                                  })}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                    )}

                    {recurrenceType === 'monthly_weekday' && (
                      <FormField
                        control={form.control}
                        name="recurrence_week_of_month"
                        render={({ field }) => (
                          <FormItem className="sm:max-w-[220px]">
                            <FormLabel>Semana do mês</FormLabel>
                            <Select
                              onValueChange={(v) =>
                                field.onChange(v ? Number(v) : undefined)
                              }
                              value={
                                field.value != null ? String(field.value) : ''
                              }
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1">1ª semana</SelectItem>
                                <SelectItem value="2">2ª semana</SelectItem>
                                <SelectItem value="3">3ª semana</SelectItem>
                                <SelectItem value="4">4ª semana</SelectItem>
                                <SelectItem value="5">5ª semana</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {recurrenceType === 'yearly' && (
                      <FormField
                        control={form.control}
                        name="recurrence_day_of_year"
                        render={({ field }) => (
                          <FormItem className="sm:max-w-[220px]">
                            <FormLabel>Data fixa no ano</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                value={
                                  field.value ? `2000-${field.value}` : ''
                                }
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (!val) {
                                    field.onChange(null);
                                    return;
                                  }
                                  const parts = val.split('-');
                                  const month = parts[1];
                                  const day = parts[2];
                                  field.onChange(`${month}-${day}`);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </section>

                  <section className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Regras de valor (opcional)
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="min_purchase_amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Valor mínimo da compra (opcional)
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex: R$ 50,00"
                                value={
                                  field.value != null
                                    ? Number(field.value) > 1
                                      ? displayCurrency(Number(field.value))
                                      : formatCurrencyInput(
                                          field.value.toString(),
                                        )
                                    : ''
                                }
                                onChange={(e) => {
                                  const formatted =
                                    formatCurrencyInput(e.target.value);
                                  field.onChange(
                                    formatted
                                      .replace(/[^\d,]/g, '')
                                      .replace(',', '.'),
                                  );
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="max_discount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Desconto máximo (R$) (opcional)
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex: R$ 100,00"
                                value={
                                  field.value != null
                                    ? Number(field.value) > 1
                                      ? displayCurrency(Number(field.value))
                                      : formatCurrencyInput(
                                          field.value.toString(),
                                        )
                                    : ''
                                }
                                onChange={(e) => {
                                  const formatted =
                                    formatCurrencyInput(e.target.value);
                                  field.onChange(
                                    formatted
                                      .replace(/[^\d,]/g, '')
                                      .replace(',', '.'),
                                  );
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </section>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseDialog}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingPromotion
                        ? 'Salvar Alterações'
                        : 'Criar Promoção'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <DataTable
        columns={columns}
        data={promotions}
        loading={isLoading}
        searchPlaceholder="Buscar promoções..."
        itemsPerPage={10}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta promoção? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
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
