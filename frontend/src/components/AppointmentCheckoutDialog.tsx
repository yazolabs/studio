import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
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

const checkoutSchema = z.object({
  discount_type: z.enum(["percentage", "fixed"]),
  discount: z.number().min(0),
  payment_method: z.string().min(1, "Forma de pagamento é obrigatória"),
  card_brand: z.string().optional(),
  installments: z.number().min(1).optional(),
  installment_fee: z.number().min(0).optional(),
});

interface AppointmentCheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: number | null;
}

export function AppointmentCheckoutDialog({
  open,
  onOpenChange,
  appointmentId,
}: AppointmentCheckoutDialogProps) {
  const {
    data: appointmentData,
    isLoading,
    refetch,
  } = useAppointmentQuery(appointmentId ?? 0, !!appointmentId);

  const { data: professionalsData } = useProfessionalsQuery();
  const { data: servicesData } = useServicesQuery();
  const { data: promotionsData } = usePromotionsQuery();
  const { data: itemsData } = useItemsQuery();

  const professionals = professionalsData?.data ?? [];
  const servicesList = servicesData ?? [];
  const promotions: Promotion[] = promotionsData ?? [];
  const productsList = itemsData?.data ?? [];

  const [services, setServices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState("");
  const [selectedProfessionals, setSelectedProfessionals] = useState<number[]>(
    []
  );
  const [selectedProduct, setSelectedProduct] = useState("");
  const [productQuantity, setProductQuantity] = useState(1);
  const [selectedPromotion, setSelectedPromotion] = useState<string>("");
  const [loadingAppointment, setLoadingAppointment] = useState(false);
  const [discountDisplay, setDiscountDisplay] = useState("");
  const [installmentFeeDisplay, setInstallmentFeeDisplay] = useState("");

  const form = useForm<z.infer<typeof checkoutSchema>>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      discount_type: "percentage",
      discount: 0,
      payment_method: "",
      card_brand: "",
      installments: 1,
      installment_fee: 0,
    },
  });

  const { mutateAsync: checkout, isPending } = useAppointmentCheckout();

  const formatPromotionShort = (promo: Promotion) => {
    const raw = Number(promo.discount_value ?? 0);
    if (!raw) return "";
    if (promo.discount_type === "percentage") {
      return `${raw.toFixed(2).replace(".", ",")}%`;
    }
    return `R$ ${raw.toFixed(2).replace(".", ",")}`;
  };

  useEffect(() => {
    if (!open || !appointmentId) return;

    const loadAppointmentData = async () => {
      setLoadingAppointment(true);
      try {
        const { data } = await refetch();

        const mapped = (data.services ?? []).map((s: any) => ({
          id: s.id,
          name: s.name,
          price: Number(s.service_price ?? s.price ?? 0),
          commission_type: s.commission_type ?? 'percentage',
          commission_value: Number(s.commission_value ?? 0),
          professionals: s.professional_id ? [Number(s.professional_id)] : [],
        }));

        setServices(mapped);
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
        const installmentFeeNum = Number(data.installment_fee ?? 0);

        form.reset({
          discount_type: discountTypeFromApi,
          discount: discountNum,
          payment_method: data.payment_method ?? "",
          card_brand: data.card_brand ?? "",
          installments: data.installments ?? 1,
          installment_fee: installmentFeeNum,
        });

        if (data.promotion_id) {
          setSelectedPromotion(String(data.promotion_id));
        } else {
          setSelectedPromotion("");
        }

        if (discountNum) {
          setDiscountDisplay(
            discountTypeFromApi === "percentage"
              ? displayPercentage(discountNum)
              : displayCurrency(discountNum)
          );
        } else {
          setDiscountDisplay("");
        }

        setInstallmentFeeDisplay(
          installmentFeeNum ? displayPercentage(installmentFeeNum) : ""
        );
      } catch (e) {
        console.error(e);
        toast.error('Não foi possível carregar os dados do atendimento.');
      } finally {
        setLoadingAppointment(false);
      }
    };

    loadAppointmentData();
  }, [open, appointmentId, refetch]);

  const activePromotions = useMemo(() => {
    const today = new Date();

    return promotions.filter((promo) => {
      if (!promo.active) return false;

      const startDate = promo.start_date ? new Date(promo.start_date) : null;
      const endDate = promo.end_date ? new Date(promo.end_date) : null;

      if (startDate && today < startDate) return false;
      if (endDate && today > endDate) return false;

      return true;
    });
  }, [promotions]);

  const handlePromotionChange = (promotionId: string) => {
    setSelectedPromotion(promotionId);

    if (!promotionId || promotionId === "none") {
      form.setValue("discount_type", "percentage");
      form.setValue("discount", 0);
      setDiscountDisplay("");
      return;
    }

    const promotion = activePromotions.find(
      (p) => p.id.toString() === promotionId
    );

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
    } else if (promotion.discount_type === "fixed") {
      form.setValue("discount_type", "fixed");
      form.setValue("discount", raw);
      setDiscountDisplay(displayCurrency(raw));
    }
  };

  const addService = () => {
    if (!selectedService || selectedProfessionals.length === 0) {
      toast.error("Selecione um serviço e pelo menos um profissional");
      return;
    }
    const service = servicesList.find(
      (s: any) => s.id.toString() === selectedService
    );
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

  const removeService = (index: number) =>
    setServices((prev) => prev.filter((_, i) => i !== index));

  const addProduct = () => {
    if (!selectedProduct || productQuantity < 1) {
      toast.error("Selecione um produto e quantidade válida");
      return;
    }
    const product = productsList.find(
      (p: any) => p.id.toString() === selectedProduct
    );
    if (product) {
      setProducts((prev) => {
        const existing = prev.find((p) => p.id === product.id);
        if (existing) {
          return prev.map((p) =>
            p.id === product.id
              ? { ...p, quantity: p.quantity + productQuantity }
              : p
          );
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

  const removeProduct = (index: number) =>
    setProducts((prev) => prev.filter((_, i) => i !== index));

  const toggleProfessional = (id: number) => {
    setSelectedProfessionals((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const servicesTotal = services.reduce((sum, s) => sum + s.price, 0);
  const productsTotal = products.reduce(
    (sum, p) => sum + p.price * p.quantity,
    0
  );
  const subtotal = servicesTotal + productsTotal;
  const discountType = form.watch("discount_type");
  const discountRaw = form.watch("discount") || 0;
  const paymentMethod = form.watch("payment_method");
  const installments = form.watch("installments") || 1;
  const installmentFeePercent = form.watch("installment_fee") || 0;

  let discountValue = 0;
  if (discountType === "percentage") {
    discountValue = (subtotal * discountRaw) / 100;
  } else {
    discountValue = Math.min(discountRaw, subtotal);
  }

  let totalAfterDiscount = subtotal - discountValue;

  const installmentFeeValue =
    paymentMethod === "credit"
      ? (totalAfterDiscount * installmentFeePercent) / 100
      : 0;

  const total = totalAfterDiscount + installmentFeeValue;

  const normalizedAppointment = useMemo(() => {
    if (!appointmentData) return null;
    return {
      id: Number(appointmentData.id),
      customer: appointmentData.customer ?? null,
    };
  }, [appointmentData]);

  const onSubmit = async (data: z.infer<typeof checkoutSchema>) => {
    if (!normalizedAppointment) return;

    if (services.length === 0) {
      toast.error("Adicione pelo menos um serviço");
      return;
    }

    const discountTypeForApi = data.discount_type;
    const discountAmountForApi = data.discount ?? 0;

    try {
      await checkout({
        appointmentId: normalizedAppointment.id,
        payload: {
          discount_type: discountTypeForApi,
          discount_amount: discountAmountForApi,
          payment_method: data.payment_method,
          card_brand: data.card_brand ?? null,
          installments: data.installments ?? 1,
          installment_fee: data.installment_fee ?? 0,
          promotion_id:
            selectedPromotion && selectedPromotion !== "none"
              ? Number(selectedPromotion)
              : null,
        },
      });

      toast.success("Atendimento finalizado com sucesso!");

      onOpenChange(false);
      setServices([]);
      setProducts([]);
      form.reset();
      setDiscountDisplay("");
      setInstallmentFeeDisplay("");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao finalizar atendimento.");
    }
  };

  if (isLoading || loadingAppointment) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md flex flex-col items-center justify-center gap-4 py-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Requisitando dados do sistema...
          </p>
        </DialogContent>
      </Dialog>
    );
  }

  if (!open || !appointmentData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Finalizar Atendimento</DialogTitle>
          <DialogDescription>
            Cliente:{" "}
            {appointmentData.customer?.name ?? "Cliente não identificado"} •{" "}
            {new Date(appointmentData.date).toLocaleDateString("pt-BR")} às{" "}
            {appointmentData.start_time?.slice(0, 5) ?? "--:--"}
          </DialogDescription>
        </DialogHeader>

        {activePromotions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Promoção/Campanha</h3>
            </div>
            <Select
              value={selectedPromotion}
              onValueChange={handlePromotionChange}
            >
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
                  {
                    activePromotions.find(
                      (p: any) => p.id.toString() === selectedPromotion
                    )?.description
                  }
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
            <Button
              type="button"
              variant="outline"
              onClick={addService}
              disabled={!selectedService || selectedProfessionals.length === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Serviço
            </Button>
          </div>

          {selectedService && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Selecione os profissionais (pode selecionar múltiplos):
              </p>
              <div className="flex flex-wrap gap-2">
                {professionals.map((p: any) => (
                  <Badge
                    key={p.id}
                    variant={
                      selectedProfessionals.includes(p.id)
                        ? "default"
                        : "outline"
                    }
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
                <div
                  key={i}
                  className="flex items-start justify-between p-3 border rounded-lg"
                >
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
                    <p className="text-sm font-medium mt-1">
                      R$ {s.price.toFixed(2)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeService(i)}
                  >
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
              onChange={(e) =>
                setProductQuantity(parseInt(e.target.value) || 1)
              }
              placeholder="Qtd"
            />

            <Button
              type="button"
              variant="outline"
              onClick={addProduct}
              disabled={!selectedProduct}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>

          {products.length > 0 && (
            <div className="space-y-2">
              {products.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Quantidade: {p.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-medium">
                      R$ {(p.price * p.quantity).toFixed(2)}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeProduct(i)}
                    >
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
            <h3 className="font-semibold">Pagamento</h3>

            <div className="grid grid-cols-3 gap-4">
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
                    <FormLabel>
                      {discountType === "percentage"
                        ? "Desconto (%)"
                        : "Desconto (R$)"}
                    </FormLabel>
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

                            const numeric = parseFloat(
                              formatted.replace(/\./g, "").replace(",", ".")
                            );

                            field.onChange(isNaN(numeric) ? 0 : numeric);
                          } else {
                            const formatted = formatCurrencyInput(value);
                            setDiscountDisplay(formatted);

                            const numeric = parseFloat(
                              formatted
                                .replace(/[^\d,]/g, "")
                                .replace(",", ".")
                            );

                            field.onChange(isNaN(numeric) ? 0 : numeric);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Dinheiro</SelectItem>
                        <SelectItem value="credit">Cartão de Crédito</SelectItem>
                        <SelectItem value="credit_link">
                          Cartão de Crédito (Link)
                        </SelectItem>
                        <SelectItem value="debit">Cartão de Débito</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {paymentMethod === "credit" && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="installments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Parcelas</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(parseInt(v))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[...Array(12)].map((_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              {i + 1}x
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="installment_fee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Acréscimo (%)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          inputMode="decimal"
                          placeholder="0,00"
                          value={installmentFeeDisplay}
                          onChange={(e) => {
                            const formatted = formatPercentageInput(e.target.value);
                            setInstallmentFeeDisplay(formatted);

                            const numeric = parseFloat(
                              formatted.replace(/\./g, "").replace(",", ".")
                            );

                            field.onChange(isNaN(numeric) ? 0 : numeric);
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}

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
                      : `Desconto (R$ ${discountRaw.toFixed(2).replace(".", ",")})`}
                  </span>
                  <span>- R$ {discountValue.toFixed(2)}</span>
                </div>
              )}

              {installmentFeeValue > 0 && (
                <div className="flex justify-between text-sm text-primary">
                  <span>Acréscimo Maquininha ({installmentFeePercent}%):</span>
                  <span>+ R$ {installmentFeeValue.toFixed(2)}</span>
                </div>
              )}

              <Separator className="my-1" />

              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>

              {paymentMethod === "credit" && installments > 1 && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{installments}x de:</span>
                  <span>R$ {(total / installments).toFixed(2)}</span>
                </div>
              )}
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
                  onClick={() => onOpenChange(false)}
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
