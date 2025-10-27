import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AxiosError } from 'axios';
import { Loader2, Tag } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { usePromotionsQuery } from '@/hooks/promotions';
import { useAppointmentQuery, useUpdateAppointment } from '@/hooks/appointments';
import type { ApiError } from '@/services/api';
import type { Promotion } from '@/types/promotion';

const checkoutSchema = z.object({
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.coerce.number().min(0),
  paymentMethod: z.string().min(1, 'Forma de pagamento é obrigatória'),
  cardBrand: z.string().optional(),
  installments: z.coerce.number().min(1).optional(),
  installmentFee: z.coerce.number().min(0).optional(),
});

const paymentMethods = [
  'Dinheiro',
  'Cartão de crédito',
  'Cartão de débito',
  'PIX',
  'Outros',
];

const cardBrands = ['Visa', 'Mastercard', 'Elo', 'Amex', 'Hipercard', 'Outros'];

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

type AppointmentCheckoutDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: number | null;
};

function parseCurrency(value: string | number | null | undefined): number {
  if (typeof value === 'number') {
    return value;
  }

  if (!value) {
    return 0;
  }

  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });
}

function filterActivePromotions(promotions: Promotion[]): Promotion[] {
  const now = new Date();
  return promotions.filter((promotion) => {
    if (!promotion.active) {
      return false;
    }

    const startsAt = promotion.startDate ? new Date(promotion.startDate) : null;
    const endsAt = promotion.endDate ? new Date(promotion.endDate) : null;

    if (startsAt && now < startsAt) {
      return false;
    }

    if (endsAt && now > endsAt) {
      return false;
    }

    return true;
  });
}

export function AppointmentCheckoutDialog({
  open,
  onOpenChange,
  appointmentId,
}: AppointmentCheckoutDialogProps) {
  const { toast } = useToast();
  const [selectedPromotionId, setSelectedPromotionId] = useState<string>('');

  const promotionsQuery = usePromotionsQuery({ perPage: 100, active: true });
  const appointmentQuery = useAppointmentQuery(appointmentId ?? 0, open && Boolean(appointmentId));
  const updateAppointmentMutation = useUpdateAppointment(appointmentId ?? 0);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      discountType: 'percentage',
      discountValue: 0,
      paymentMethod: '',
      cardBrand: '',
      installments: 1,
      installmentFee: 0,
    },
  });

  const discountType = form.watch('discountType');
  const discountValue = form.watch('discountValue');

  useEffect(() => {
    if (!open) {
      form.reset({
        discountType: 'percentage',
        discountValue: 0,
        paymentMethod: '',
        cardBrand: '',
        installments: 1,
        installmentFee: 0,
      });
      setSelectedPromotionId('');
    }
  }, [open, form]);

  useEffect(() => {
    const appointment = appointmentQuery.data;
    if (!appointment) {
      return;
    }

    const total = parseCurrency(appointment.totalPrice);
    const discountAmount = parseCurrency(appointment.discountAmount);

    let inferredType: CheckoutFormValues['discountType'] = 'percentage';
    let inferredValue = 0;

    if (discountAmount > 0) {
      if (total > 0) {
        const percent = (discountAmount / total) * 100;
        if (percent <= 100) {
          inferredType = 'percentage';
          inferredValue = Number(percent.toFixed(2));
        } else {
          inferredType = 'fixed';
          inferredValue = Number(discountAmount.toFixed(2));
        }
      } else {
        inferredType = 'fixed';
        inferredValue = Number(discountAmount.toFixed(2));
      }
    }

    form.reset({
      discountType: inferredType,
      discountValue: inferredValue,
      paymentMethod: appointment.paymentMethod ?? '',
      cardBrand: '',
      installments: 1,
      installmentFee: 0,
    });

    setSelectedPromotionId(appointment.promotion?.id ? String(appointment.promotion.id) : '');
  }, [appointmentQuery.data, form]);

  const activePromotions = useMemo(() => {
    const promotionData = promotionsQuery.data?.data ?? [];
    return filterActivePromotions(promotionData);
  }, [promotionsQuery.data]);

  const appointmentServices = appointmentQuery.data?.services ?? [];

  const totals = useMemo(() => {
    const servicesTotal = appointmentServices.reduce((sum, service) => {
      return sum + parseCurrency(service.servicePrice);
    }, 0);

    const rawDiscount =
      discountType === 'percentage'
        ? servicesTotal * (discountValue / 100)
        : discountValue;

    const discountAmount = Math.min(rawDiscount, servicesTotal);
    const finalAmount = Math.max(servicesTotal - discountAmount, 0);

    return {
      servicesTotal,
      discountAmount,
      finalAmount,
    };
  }, [appointmentServices, discountType, discountValue]);

  const handlePromotionChange = (value: string) => {
    setSelectedPromotionId(value);

    if (!value) {
      return;
    }

    const promotion = activePromotions.find((promo) => String(promo.id) === value);
    if (!promotion) {
      return;
    }

    const parsedValue = parseCurrency(promotion.discountValue);

    if (promotion.discountType === 'percentage') {
      form.setValue('discountType', 'percentage');
      form.setValue('discountValue', parsedValue);
    } else {
      form.setValue('discountType', 'fixed');
      form.setValue('discountValue', parsedValue);
    }
  };

  const handleSubmit = (values: CheckoutFormValues) => {
    const appointment = appointmentQuery.data;

    if (!appointment || !appointmentId) {
      toast({
        title: 'Checkout indisponível',
        description: 'Selecione um agendamento válido para concluir o checkout.',
        variant: 'destructive',
      });
      return;
    }

    const servicesPayload = appointment.services?.map((service) => ({
      id: service.id,
      servicePrice: service.servicePrice,
      commissionType: service.commissionType,
      commissionValue: service.commissionValue,
      professionalId: service.professionalId,
    }));

    const discountAmount =
      values.discountType === 'percentage'
        ? totals.servicesTotal * (values.discountValue / 100)
        : values.discountValue;

    const cappedDiscount = Math.min(discountAmount, totals.servicesTotal);
    const finalAmount = Math.max(totals.servicesTotal - cappedDiscount, 0);

    updateAppointmentMutation.mutate(
      {
        status: 'completed',
        paymentMethod: values.paymentMethod,
        promotionId: selectedPromotionId ? Number(selectedPromotionId) : undefined,
        totalPrice: totals.servicesTotal.toFixed(2),
        discountAmount: cappedDiscount.toFixed(2),
        finalPrice: finalAmount.toFixed(2),
        services: servicesPayload,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Checkout concluído',
            description: 'O agendamento foi finalizado com sucesso.',
          });
          onOpenChange(false);
        },
        onError: (error: AxiosError<ApiError>) => {
          const message = error.response?.data?.message ?? 'Não foi possível concluir o checkout.';
          toast({
            title: 'Erro ao concluir checkout',
            description: message,
            variant: 'destructive',
          });
        },
      }
    );
  };

  const renderContent = () => {
    if (!appointmentId) {
      return (
        <Alert>
          <AlertTitle>Selecione um agendamento</AlertTitle>
          <AlertDescription>
            Escolha um agendamento na lista para abrir o fluxo de checkout.
          </AlertDescription>
        </Alert>
      );
    }

    if (appointmentQuery.isLoading || promotionsQuery.isLoading) {
      return (
        <div className="flex items-center justify-center py-10 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando informações do checkout...
        </div>
      );
    }

    if (appointmentQuery.isError) {
      return (
        <Alert variant="destructive">
          <AlertTitle>Não foi possível carregar o agendamento</AlertTitle>
          <AlertDescription>
            Verifique se o agendamento ainda existe ou tente novamente em instantes.
          </AlertDescription>
        </Alert>
      );
    }

    const appointment = appointmentQuery.data;

    if (!appointment) {
      return (
        <Alert variant="destructive">
          <AlertTitle>Agendamento não encontrado</AlertTitle>
          <AlertDescription>
            Este agendamento não está disponível para checkout.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <section className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold">Resumo do atendimento</h3>
              <p className="text-sm text-muted-foreground">
                Confira os serviços realizados e aplique descontos ou promoções antes de finalizar.
              </p>
            </div>

            <div className="space-y-2 rounded-md border p-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Cliente</span>
                <span className="font-medium text-foreground">{appointment.customer?.name ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Profissional</span>
                <span className="font-medium text-foreground">{appointment.professional?.name ?? '—'}</span>
              </div>
              <Separator />
              <div className="space-y-2">
                {appointmentServices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum serviço vinculado ao agendamento.</p>
                ) : (
                  appointmentServices.map((service) => (
                    <div key={service.id} className="flex items-center justify-between text-sm">
                      <span>{service.name}</span>
                      <span className="font-medium">{formatCurrency(parseCurrency(service.servicePrice))}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <FormField
              control={form.control}
              name="discountType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de desconto</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="percentage">Percentual (%)</SelectItem>
                      <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="discountValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor do desconto</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Promoção ativa</FormLabel>
              <Select value={selectedPromotionId} onValueChange={handlePromotionChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma promoção" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sem promoção</SelectItem>
                  {activePromotions.map((promotion) => (
                    <SelectItem key={promotion.id} value={String(promotion.id)}>
                      <div className="flex items-center gap-2">
                        <Tag className="h-3 w-3" />
                        <span>{promotion.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          <section className="space-y-4">
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forma de pagamento</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a forma de pagamento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch('paymentMethod')?.toLowerCase().includes('cartão') && (
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="cardBrand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bandeira do cartão</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a bandeira" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cardBrands.map((brand) => (
                            <SelectItem key={brand} value={brand}>
                              {brand}
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
                  name="installments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de parcelas</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </section>

          <section className="rounded-md border p-4">
            <h4 className="mb-4 text-sm font-semibold uppercase text-muted-foreground">Totais</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Serviços</span>
                <span>{formatCurrency(totals.servicesTotal)}</span>
              </div>
              <div className="flex items-center justify-between text-destructive">
                <span>Desconto</span>
                <span>-{formatCurrency(totals.discountAmount)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-base font-semibold">
                <span>Total a receber</span>
                <span>{formatCurrency(totals.finalAmount)}</span>
              </div>
            </div>
          </section>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateAppointmentMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={updateAppointmentMutation.isPending}>
              {updateAppointmentMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Concluir checkout
            </Button>
          </DialogFooter>
        </form>
      </Form>
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setSelectedPromotionId('');
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Checkout do agendamento</DialogTitle>
          <DialogDescription>
            Finalize o atendimento aplicando promoções, descontos e registrando a forma de pagamento.
          </DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
