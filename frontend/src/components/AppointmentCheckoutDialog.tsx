import { useState, useEffect, useMemo, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, Plus, Printer, Tag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAppointmentCheckout, useAppointmentQuery } from "@/hooks/appointments";
import { useProfessionalsQuery } from "@/hooks/professionals";
import { useServicesQuery } from "@/hooks/services";
import { usePromotionsQuery } from "@/hooks/promotions";
import { useItemsQuery } from "@/hooks/items";
import { Promotion } from "@/types/promotion";
import { formatPercentageInput, displayPercentage, formatCurrencyInput, displayCurrency } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const paymentSchema = z.object({
  payment_method: z.string().min(1, "Forma de pagamento é obrigatória"),
  amount: z.number().min(0, "Informe um valor válido"),
  card_brand: z.string().optional().nullable(),
  installments: z.number().min(1).optional().nullable(),
  installment_fee: z.number().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
});

const checkoutSchema = z
  .object({
    discount_type: z.enum(["percentage", "fixed"]),
    discount: z.number().min(0),
    payments: z.array(paymentSchema).min(1, "Adicione pelo menos 1 pagamento"),
  })
  .superRefine((val, ctx) => {
    val.payments.forEach((p, idx) => {
      if (p.payment_method === "credit") {
        if (!p.installments || p.installments < 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["payments", idx, "installments"],
            message: "Parcelas obrigatórias no crédito",
          });
        }
        if (p.installment_fee != null && p.installment_fee < 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["payments", idx, "installment_fee"],
            message: "Taxa inválida",
          });
        }
      }

    });
  });

interface AppointmentCheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: number | null;
}

export function AppointmentCheckoutDialog({ open, onOpenChange, appointmentId }: AppointmentCheckoutDialogProps) {
  const { data: appointmentData, isLoading, refetch } = useAppointmentQuery(appointmentId ?? 0, !!appointmentId);

  const { data: professionalsData } = useProfessionalsQuery();
  const { data: servicesData } = useServicesQuery();
  const { data: promotionsData } = usePromotionsQuery();
  const { data: itemsData } = useItemsQuery();

  const professionals = ((professionalsData as any)?.data ?? professionalsData ?? []) as any[];
  const servicesList = ((servicesData as any)?.data ?? servicesData ?? []) as any[];
  const promotions = ((promotionsData as any)?.data ?? promotionsData ?? []) as Promotion[];
  const productsList = ((itemsData as any)?.data ?? itemsData ?? []) as any[];

  const [services, setServices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState("");
  const [selectedProfessionals, setSelectedProfessionals] = useState<number[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [productQuantity, setProductQuantity] = useState(1);
  const [selectedPromotion, setSelectedPromotion] = useState<string>("none");
  const [loadingAppointment, setLoadingAppointment] = useState(false);
  const [discountDisplay, setDiscountDisplay] = useState("");
  const [didAutoApplyPromotion, setDidAutoApplyPromotion] = useState(false);
  const [paymentAmountDisplay, setPaymentAmountDisplay] = useState<Record<number, string>>({});
  const [paymentFeeDisplay, setPaymentFeeDisplay] = useState<Record<number, string>>({});


  const isMobile = useIsMobile();

  const form = useForm<z.infer<typeof checkoutSchema>>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      discount_type: "percentage",
      discount: 0,
      payments: [
        {
          payment_method: "",
          amount: 0,
          card_brand: null,
          installments: 1,
          installment_fee: 0,
          notes: null,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "payments",
  });

  const { mutateAsync: checkout, isPending } = useAppointmentCheckout();

  const formatPromotionShort = (promo: Promotion) => {
    const raw = Number(promo.discount_value ?? 0);
    if (!raw) return "";
    if (promo.discount_type === "percentage") return `${raw.toFixed(2).replace(".", ",")}%`;
    return `R$ ${raw.toFixed(2).replace(".", ",")}`;
  };

  useEffect(() => {
    if (open) return;
    setDidAutoApplyPromotion(false);
    setSelectedPromotion("none");
  }, [open]);

  useEffect(() => {
    if (!open || !appointmentId) return;

    const loadAppointmentData = async () => {
      setLoadingAppointment(true);
      setDidAutoApplyPromotion(false);
      try {
        const { data } = await refetch();

        const mappedServices = (data.services ?? []).map((s: any) => ({
          id: s.id,
          name: s.name,
          price: Number(s.service_price ?? s.price ?? 0),
          commission_type: s.commission_type ?? "percentage",
          commission_value: Number(s.commission_value ?? 0),
          professionals: s.professional_id ? [Number(s.professional_id)] : [],
        }));

        setServices(mappedServices);

        setProducts(
          (data.items ?? []).map((i: any) => ({
            id: i.id,
            name: i.name,
            price: Number(i.price ?? 0),
            quantity: i.quantity ?? 1,
          }))
        );

        const discountTypeFromApi = data.discount_type ?? "percentage";
        const discountNum = Number(data.discount_amount ?? 0);

        const paymentsFromApi =
          (data.payments ?? []).map((p: any) => ({
            payment_method: p.method ?? "",
            amount: Number(p.base_amount ?? p.amount ?? 0),
            card_brand: p.card_brand ?? null,
            installments: p.installments ?? 1,
            installment_fee: Number(p.fee_percent ?? 0),
            notes: null,
          })) ?? [];

        form.reset({
          discount_type: discountTypeFromApi,
          discount: discountNum,
          payments: paymentsFromApi.length
            ? paymentsFromApi
            : [
                {
                  payment_method: "",
                  amount: 0,
                  card_brand: null,
                  installments: 1,
                  installment_fee: 0,
                  notes: null,
                },
              ],
        });

        const amountDisplayMap: Record<number, string> = {};
        const feeDisplayMap: Record<number, string> = {};

        (paymentsFromApi.length ? paymentsFromApi : form.getValues("payments")).forEach((p, i) => {
          amountDisplayMap[i] = p.amount ? displayCurrency(Number(p.amount)) : "";
          feeDisplayMap[i] = p.installment_fee ? displayPercentage(Number(p.installment_fee)) : "";
        });

        setPaymentAmountDisplay(amountDisplayMap);
        setPaymentFeeDisplay(feeDisplayMap);
        setSelectedPromotion(data.promotion_id ? String(data.promotion_id) : "none");

        if (discountNum) {
          setDiscountDisplay(
            discountTypeFromApi === "percentage" ? displayPercentage(discountNum) : displayCurrency(discountNum)
          );
        } else {
          setDiscountDisplay("");
        }
      } catch (e) {
        console.error(e);
        toast.error("Não foi possível carregar os dados do atendimento.");
      } finally {
        setLoadingAppointment(false);
      }
    };

    loadAppointmentData();
  }, [open, appointmentId, refetch, form]);

  const activePromotions = useMemo(() => {
    const baseDate = appointmentData?.date ? new Date(`${appointmentData.date}T00:00:00`) : new Date();
    return promotions.filter((promo) => {
      if (!promo.active) return false;
      const startDate = promo.start_date ? new Date(`${promo.start_date}T00:00:00`) : null;
      const endDate = promo.end_date ? new Date(`${promo.end_date}T23:59:59`) : null;
      if (startDate && baseDate < startDate) return false;
      if (endDate && baseDate > endDate) return false;
      return true;
    });
  }, [promotions, appointmentData?.date]);

  const handlePromotionChange = useCallback(
    (promotionId: string) => {
      setSelectedPromotion(promotionId);

      if (!promotionId || promotionId === "none") {
        form.setValue("discount_type", "percentage");
        form.setValue("discount", 0);
        setDiscountDisplay("");
        return;
      }

      const promotion = activePromotions.find((p) => p.id.toString() === promotionId);

      if (!promotion) {
        form.setValue("discount_type", "percentage");
        form.setValue("discount", 0);
        setDiscountDisplay("");
        return;
      }

      const raw = Number(promotion.discount_value ?? 0) || 0;

      if (promotion.discount_type === "percentage") {
        form.setValue("discount_type", "percentage");
        form.setValue("discount", raw);
        setDiscountDisplay(displayPercentage(raw));
      } else {
        form.setValue("discount_type", "fixed");
        form.setValue("discount", raw);
        setDiscountDisplay(displayCurrency(raw));
      }
    },
    [activePromotions, form]
  );

  useEffect(() => {
    if (!open) return;
    if (!appointmentData?.promotion_id) return;
    if (!activePromotions.length) return;
    if (didAutoApplyPromotion) return;

    const currentDiscount = form.getValues("discount");
    if (currentDiscount && currentDiscount > 0) {
      setDidAutoApplyPromotion(true);
      return;
    }

    const promoId = String(appointmentData.promotion_id);
    const exists = activePromotions.some((p) => p.id.toString() === promoId);
    if (!exists) return;

    handlePromotionChange(promoId);
    setDidAutoApplyPromotion(true);
  }, [open, appointmentData, activePromotions, didAutoApplyPromotion, form, handlePromotionChange]);

  const addService = () => {
    if (!selectedService || selectedProfessionals.length === 0) {
      toast.error("Selecione um serviço e pelo menos um profissional");
      return;
    }

    const service = servicesList.find((s: any) => s.id.toString() === selectedService);

    if (service) {
      setServices((prev) => [
        ...prev,
        {
          id: service.id,
          name: service.name,
          price: Number(service.price),
          commission_type: service.commission_type,
          commission_value: Number(service.commission_value),
          professionals: selectedProfessionals,
        },
      ]);
      setSelectedService("");
      setSelectedProfessionals([]);
    }
  };

  const removeService = (index: number) => setServices((prev) => prev.filter((_, i) => i !== index));

  const addProduct = () => {
    if (!selectedProduct || productQuantity < 1) {
      toast.error("Selecione um produto e quantidade válida");
      return;
    }

    const product = productsList.find((p: any) => p.id.toString() === selectedProduct);

    if (product) {
      setProducts((prev) => {
        const existing = prev.find((p) => p.id === product.id);
        if (existing) {
          return prev.map((p) => (p.id === product.id ? { ...p, quantity: p.quantity + productQuantity } : p));
        }
        return [
          ...prev,
          {
            id: product.id,
            name: product.name,
            price: Number(product.price),
            quantity: productQuantity,
          },
        ];
      });

      setSelectedProduct("");
      setProductQuantity(1);
    }
  };

  const removeProduct = (index: number) => setProducts((prev) => prev.filter((_, i) => i !== index));

  const toggleProfessional = (id: number) => {
    setSelectedProfessionals((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const servicesTotal = services.reduce((sum, s) => sum + Number(s.price || 0), 0);
  const productsTotal = products.reduce((sum, p) => sum + Number(p.price || 0) * Number(p.quantity || 0), 0);
  const subtotal = servicesTotal + productsTotal;

  const discountType = form.watch("discount_type");
  const discountRaw = form.watch("discount") || 0;

  let discountValue = 0;
  if (discountType === "percentage") {
    discountValue = (subtotal * discountRaw) / 100;
  } else {
    discountValue = Math.min(discountRaw, subtotal);
  }

  const totalAfterDiscount = subtotal - discountValue;

  const paymentsWatch = form.watch("payments") ?? [];

  const feeTotal = paymentsWatch.reduce((sum, p) => {
    if (p.payment_method !== "credit") return sum;
    const base = Number(p.amount || 0);
    const fee = Number(p.installment_fee || 0);
    return sum + (base * fee) / 100;
  }, 0);

  const total = Number((totalAfterDiscount + feeTotal).toFixed(2));

  const paidTotal = paymentsWatch.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const remaining = Number((total - paidTotal).toFixed(2));

  const fillRemainingOnRow = (index: number) => {
    const current = form.getValues(`payments.${index}.amount`) || 0;
    form.setValue(`payments.${index}.amount`, Number((current + Math.max(0, remaining)).toFixed(2)));
  };

  const normalizedAppointment = useMemo(() => {
    if (!appointmentData) return null;
    return { id: Number(appointmentData.id), customer: appointmentData.customer ?? null };
  }, [appointmentData]);

  const onSubmit = async (data: z.infer<typeof checkoutSchema>) => {
    if (!normalizedAppointment) return;

    if (services.length === 0) {
      toast.error("Adicione pelo menos um serviço");
      return;
    }

    const servicesTotalLocal = services.reduce((sum, s) => sum + Number(s.price || 0), 0);
    const productsTotalLocal = products.reduce((sum, p) => sum + Number(p.price || 0) * Number(p.quantity || 0), 0);
    const subtotalLocal = servicesTotalLocal + productsTotalLocal;

    let discountValueLocal = 0;
    if (data.discount_type === "percentage") discountValueLocal = (subtotalLocal * Number(data.discount || 0)) / 100;
    else discountValueLocal = Math.min(Number(data.discount || 0), subtotalLocal);

    const totalAfterDiscountLocal = subtotalLocal - discountValueLocal;

    const feeTotalLocal = (data.payments ?? []).reduce((sum, p) => {
      if (p.payment_method !== "credit") return sum;
      const base = Number(p.amount || 0);
      const fee = Number(p.installment_fee || 0);
      return sum + (base * fee) / 100;
    }, 0);

    const expectedTotal = Number((totalAfterDiscountLocal + feeTotalLocal).toFixed(2));
    const paid = Number(
      (data.payments ?? []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0).toFixed(2)
    );

    if (Math.abs(paid - expectedTotal) > 0.01) {
      toast.error(`A soma dos pagamentos (R$ ${paid.toFixed(2)}) deve ser igual ao total (R$ ${expectedTotal.toFixed(2)}).`);
      return;
    }

    const discount_type = data.discount_type;
    const discount_amount = Number(data.discount ?? 0);

    const payments = (data.payments ?? []).map((p) => ({
      payment_method: p.payment_method,
      amount: Number(Number(p.amount || 0).toFixed(2)),
      card_brand:
        p.payment_method === "credit" || p.payment_method === "credit_link" || p.payment_method === "debit"
          ? (p.card_brand ?? null)
          : null,
      installments: p.payment_method === "credit" ? (p.installments ?? 1) : null,
      installment_fee: p.payment_method === "credit" ? (p.installment_fee ?? 0) : null,
      notes: p.notes ?? null,
    }));

    const servicesPayload = services.map((s) => ({
      id: Number(s.id),
      professional_id: Number(s.professionals?.[0] ?? 0) || null,
      service_price: Number(s.price ?? 0).toFixed(2),
      commission_type: (s.commission_type ?? "percentage") as "percentage" | "fixed",
      commission_value: Number(s.commission_value ?? 0).toFixed(2),
    }));

    const itemsPayload = products.map((p) => ({
      id: Number(p.id),
      price: Number(p.price ?? 0).toFixed(2),
      quantity: Number(p.quantity ?? 1),
    }));

    try {
      await checkout({
        appointmentId: normalizedAppointment.id,
        payload: {
          discount_type,
          discount_amount,
          promotion_id: selectedPromotion && selectedPromotion !== "none" ? Number(selectedPromotion) : null,
          payments,
          services: servicesPayload,
          items: itemsPayload,
        },
      });

      toast.success("Atendimento finalizado com sucesso!");
      onOpenChange(false);

      setServices([]);
      setProducts([]);
      form.reset();
      setDiscountDisplay("");
      setDidAutoApplyPromotion(false);
      setSelectedPromotion("none");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao finalizar atendimento.");
    }
  };

  if (isLoading || loadingAppointment) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn("max-h-[90vh]", isMobile ? "max-w-[95vw]" : "max-w-2xl")}>
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Requisitando dados do sistema...</p>
        </DialogContent>
      </Dialog>
    );
  }

  if (!open || !appointmentData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-h-[90vh]", isMobile ? "max-w-[95vw]" : "max-w-2xl")}>
        <DialogHeader>
          <DialogTitle>Finalizar Atendimento</DialogTitle>
          <DialogDescription>
            Cliente: {appointmentData.customer?.name ?? "Cliente não identificado"} •{" "}
            {new Date(`${appointmentData.date}T00:00:00`).toLocaleDateString("pt-BR")} às
            {appointmentData.start_time?.slice(0, 5) ?? "--:--"}
          </DialogDescription>
        </DialogHeader>

        {activePromotions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Promoção/Campanha</h3>
            </div>
            <Select value={selectedPromotion} onValueChange={handlePromotionChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma promoção (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma promoção</SelectItem>
                {activePromotions.map((promo: any) => (
                  <SelectItem key={promo.id} value={promo.id.toString()}>
                    <div className="flex items-center justify-between gap-3">
                      <span>{promo.name}</span>
                      {promo.discount_value && (
                        <Badge variant="secondary" className="ml-2">
                          {formatPromotionShort(promo)}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedPromotion && selectedPromotion !== "none" && (
              <Alert className="border-success/50 bg-success/5">
                <AlertDescription className="text-sm text-success">
                  ✓ Promoção aplicada:{" "}
                  {activePromotions.find((p: any) => p.id.toString() === selectedPromotion)?.description}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <div className="space-y-4 mt-6">
          <h3 className="font-semibold">Serviços Realizados</h3>
          <div className="grid grid-cols-2 gap-3">
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um serviço" />
              </SelectTrigger>
              <SelectContent>
                {servicesList.map((s: any) => (
                  <SelectItem key={s.id} value={s.id.toString()}>
                    {s.name} - R$ {Number(s.price).toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button type="button" variant="outline" onClick={addService} disabled={!selectedService || selectedProfessionals.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Serviço
            </Button>
          </div>

          {selectedService && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Selecione os profissionais (pode selecionar múltiplos):</p>
              <div className="flex flex-wrap gap-2">
                {professionals.map((p: any) => (
                  <Badge
                    key={p.id}
                    variant={selectedProfessionals.includes(p.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleProfessional(p.id)}
                  >
                    {p.user?.name || p.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {services.length > 0 && (
            <div className="space-y-2">
              {services.map((s, i) => (
                <div key={i} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{s.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Profissional:{" "}
                      {(() => {
                        const profId = s.professionals?.[0];
                        const prof = professionals.find((p: any) => Number(p.id) === Number(profId));
                        return prof?.user?.name ?? prof?.name ?? "—";
                      })()}
                    </p>
                    <p className="text-sm font-medium mt-1">R$ {Number(s.price).toFixed(2)}</p>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeService(i)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator className="my-6" />

        <div className="space-y-4">
          <h3 className="font-semibold">Produtos Adquiridos</h3>
          <div className="grid grid-cols-3 gap-3">
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um produto" />
              </SelectTrigger>
              <SelectContent>
                {productsList.map((p: any) => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.name} - R$ {Number(p.price).toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="number"
              min="1"
              value={productQuantity}
              onChange={(e) => setProductQuantity(parseInt(e.target.value) || 1)}
              placeholder="Qtd"
            />

            <Button type="button" variant="outline" onClick={addProduct} disabled={!selectedProduct}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>

          {products.length > 0 && (
            <div className="space-y-2">
              {products.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-sm text-muted-foreground">Quantidade: {p.quantity}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-medium">R$ {(Number(p.price) * Number(p.quantity)).toFixed(2)}</p>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeProduct(i)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator className="my-6" />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <h3 className="font-semibold">Desconto</h3>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="discount_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de desconto</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
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
                name="discount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{discountType === "percentage" ? "Desconto (%)" : "Desconto (R$)"}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        inputMode="decimal"
                        placeholder={discountType === "percentage" ? "0,00" : "R$ 0,00"}
                        value={discountDisplay}
                        onChange={(e) => {
                          const value = e.target.value;

                          if (discountType === "percentage") {
                            const formatted = formatPercentageInput(value);
                            setDiscountDisplay(formatted);

                            const numeric = parseFloat(formatted.replace(/\./g, "").replace(",", "."));
                            field.onChange(isNaN(numeric) ? 0 : numeric);
                          } else {
                            const formatted = formatCurrencyInput(value);
                            setDiscountDisplay(formatted);

                            const numeric = parseFloat(formatted.replace(/[^\d,]/g, "").replace(",", "."));
                            field.onChange(isNaN(numeric) ? 0 : numeric);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Método de Pagamento</h3>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    append({
                      payment_method: "",
                      amount: 0,
                      card_brand: null,
                      installments: 1,
                      installment_fee: 0,
                      notes: null,
                    });

                    setPaymentAmountDisplay((prev) => ({ ...prev, [fields.length]: "" }));
                    setPaymentFeeDisplay((prev) => ({ ...prev, [fields.length]: "" }));
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar pagamento
                </Button>
              </div>

              {fields.map((f, idx) => {
                const method = form.watch(`payments.${idx}.payment_method`);
                const amountValue = form.watch(`payments.${idx}.amount`) || 0;

                return (
                  <div key={f.id} className="rounded-lg border p-3 space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <FormField
                        control={form.control}
                        name={`payments.${idx}.payment_method`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Método</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="cash">Dinheiro</SelectItem>
                                <SelectItem value="pix">PIX</SelectItem>
                                <SelectItem value="debit">Débito</SelectItem>
                                <SelectItem value="credit">Crédito</SelectItem>
                                <SelectItem value="credit_link">Crédito (Link)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`payments.${idx}.amount`}
                        render={({ field }) => (
                          <FormItem className="min-w-0">
                            <FormLabel>Valor (R$)</FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                inputMode="decimal"
                                placeholder="R$ 0,00"
                                value={paymentAmountDisplay[idx] ?? ""}
                                onChange={(e) => {
                                  const formatted = formatCurrencyInput(e.target.value);
                                  setPaymentAmountDisplay((prev) => ({ ...prev, [idx]: formatted }));

                                  const numeric = parseFloat(formatted.replace(/[^\d,]/g, "").replace(",", "."));
                                  field.onChange(isNaN(numeric) ? 0 : numeric);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-2 items-end justify-end">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => fillRemainingOnRow(idx)}
                          disabled={remaining <= 0}
                          title="Preencher com o valor restante"
                        >
                          Usar restante (R$ {Math.max(0, remaining).toFixed(2)})
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            remove(idx);

                            setPaymentAmountDisplay((prev) => {
                              const next: Record<number, string> = {};
                              Object.keys(prev)
                                .map(Number)
                                .filter((k) => k !== idx)
                                .sort((a, b) => a - b)
                                .forEach((k, newIndex) => (next[newIndex] = prev[k]));
                              return next;
                            });

                            setPaymentFeeDisplay((prev) => {
                              const next: Record<number, string> = {};
                              Object.keys(prev)
                                .map(Number)
                                .filter((k) => k !== idx)
                                .sort((a, b) => a - b)
                                .forEach((k, newIndex) => (next[newIndex] = prev[k]));
                              return next;
                            });
                          }}
                          disabled={fields.length === 1}
                          title="Remover pagamento"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {(method === "credit" || method === "debit" || method === "credit_link") && (
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name={`payments.${idx}.card_brand`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bandeira</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Ex: Visa / Master..."
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {method === "credit" ? (
                          <div className="grid grid-cols-2 gap-3">
                            <FormField
                              control={form.control}
                              name={`payments.${idx}.installments`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Parcelas</FormLabel>
                                  <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value ?? 1)}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="1x" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {[...Array(12)].map((_, i) => (
                                        <SelectItem key={i + 1} value={String(i + 1)}>
                                          {i + 1}x
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
                              name={`payments.${idx}.installment_fee`}
                              render={({ field }) => (
                                <FormItem className="min-w-0">
                                  <FormLabel>Taxa (%)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="text"
                                      inputMode="decimal"
                                      placeholder="0,00"
                                      value={paymentFeeDisplay[idx] ?? ""}
                                      onChange={(e) => {
                                        const formatted = formatPercentageInput(e.target.value);
                                        setPaymentFeeDisplay((prev) => ({ ...prev, [idx]: formatted }));

                                        const numeric = parseFloat(formatted.replace(/\./g, "").replace(",", "."));
                                        field.onChange(isNaN(numeric) ? 0 : numeric);
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        ) : (
                          <div />
                        )}
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground flex justify-between">
                      <span>Pago nesta linha: R$ {Number(amountValue).toFixed(2)}</span>
                      <span>
                        Total pago: R$ {paidTotal.toFixed(2)} • Restante: R$ {Math.max(0, remaining).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2 p-4 bg-muted rounded-lg border border-border">
              <div className="flex justify-between text-sm">
                <span>Serviços:</span>
                <span>R$ {servicesTotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Produtos:</span>
                <span>R$ {productsTotal.toFixed(2)}</span>
              </div>

              <Separator className="my-1" />

              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>

              {discountValue > 0 && (
                <div className="flex justify-between text-sm text-destructive">
                  <span>
                    {discountType === "percentage"
                      ? `Desconto (${displayPercentage(discountRaw)}%)`
                      : `Desconto (${displayCurrency(discountRaw)})`}
                  </span>
                  <span>- R$ {discountValue.toFixed(2)}</span>
                </div>
              )}

              {feeTotal > 0 && (
                <div className="flex justify-between text-sm text-primary">
                  <span>Taxas de crédito:</span>
                  <span>+ R$ {feeTotal.toFixed(2)}</span>
                </div>
              )}

              <Separator className="my-1" />

              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Total pago:</span>
                <span>R$ {paidTotal.toFixed(2)} • Restante: R$ {Math.max(0, remaining).toFixed(2)}</span>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" className="gap-2">
                <Printer className="h-4 w-4" />
                Imprimir Comanda
              </Button>

              <div className="flex gap-2 flex-1 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                    setDidAutoApplyPromotion(false);
                    setSelectedPromotion("none");
                  }}
                >
                  Cancelar
                </Button>

                <Button type="submit" disabled={isPending}>
                  {isPending ? "Finalizando..." : "Finalizar Atendimento"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
