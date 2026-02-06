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
import type { Promotion } from "@/types/promotion";
import { formatPercentageInput, displayPercentage, formatCurrencyInput, displayCurrency } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { CARD_BRANDS_BR } from "@/constants/cardBrands";

type LocalServiceRow = {
  id: number;
  appointment_service_id?: number | null;
  name: string;
  price: number;
  commission_type: "percentage" | "fixed" | string | null;
  commission_value: number;
  professionals: number[];
  promotion_ids?: number[];
};

type LocalProductRow = {
  id: number;
  name: string;
  price: number;
  quantity: number;
};

function safeNumber(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function uniqueInts(arr: any[]) {
  const out: number[] = [];
  const seen = new Set<number>();
  for (const v of arr) {
    const n = Number(v);
    if (!Number.isFinite(n)) continue;
    const i = Math.trunc(n);
    if (!seen.has(i)) {
      seen.add(i);
      out.push(i);
    }
  }
  return out;
}

function calcPromoDiscountForService(
  servicePrice: number,
  promotionIds: number[],
  promotionById: Map<number, Promotion>
) {
  let base = Math.max(0, safeNumber(servicePrice, 0));
  let discountTotal = 0;

  const breakdown: Array<{ id: number; name: string; discount: number }> = [];

  for (const pid of promotionIds ?? []) {
    const promo: any = promotionById.get(Number(pid));
    if (!promo) continue;

    const type = String(promo.discount_type || "").trim();
    const val = safeNumber(promo.discount_value ?? 0, 0);
    if (val <= 0 || base <= 0) continue;

    let d = 0;
    if (type === "percentage") {
      d = (base * val) / 100;
    } else if (type === "fixed") {
      d = Math.min(val, base);
    } else {
      continue;
    }

    d = Number(d.toFixed(2));
    if (d <= 0) continue;

    discountTotal += d;
    base = Number((base - d).toFixed(2));

    breakdown.push({
      id: Number(pid),
      name: String(promo.name ?? `Promo #${pid}`),
      discount: d,
    });
  }

  discountTotal = Number(discountTotal.toFixed(2));
  const final = Number(Math.max(0, safeNumber(servicePrice, 0) - discountTotal).toFixed(2));

  return { discountTotal, final, breakdown };
}

const paymentSchema = z
  .object({
    method: z.string().min(1, "Forma de pagamento é obrigatória"),
    amount: z.number().min(0, "Informe um valor válido"),
    card_brand: z.string().optional().nullable(),
    installments: z.number().min(1).optional().nullable(),
    fee_percent: z.number().min(0).optional().nullable(),
    notes: z.string().optional().nullable(),
  })
  .superRefine((p, ctx) => {
    const m = String(p.method || "").trim();

    const isCredit = m === "credit";
    const isCreditLink = m === "credit_link";
    const isCreditLike = isCredit || isCreditLink;
    const isCard = isCreditLike || m === "debit";

    if (isCard) {
      const brand = String(p.card_brand ?? "").trim();
      if (!brand) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["card_brand"],
          message: "Bandeira é obrigatória para pagamentos com cartão",
        });
      }
    }

    if (isCredit) {
      if (!p.installments || p.installments < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["installments"],
          message: "Parcelas obrigatórias no crédito",
        });
      }
    }

    if (isCreditLike) {
      if (p.fee_percent != null && p.fee_percent < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["fee_percent"],
          message: "Taxa inválida",
        });
      }
    }
  });

const checkoutSchema = z.object({
  discount_type: z.enum(["percentage", "fixed"]),
  discount: z.number().min(0),
  payments: z.array(paymentSchema).min(1, "Adicione pelo menos 1 pagamento"),
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
  const { data: promotionsData, refetch: refetchPromotions } = usePromotionsQuery() as any;

  useEffect(() => {
    if (!open) return;
    refetchPromotions?.();
  }, [open, refetchPromotions]);

  const { data: itemsData } = useItemsQuery();

  const professionals = ((professionalsData as any)?.data ?? professionalsData ?? []) as any[];
  const servicesList = ((servicesData as any)?.data ?? servicesData ?? []) as any[];
  const promotions = ((promotionsData as any)?.data ?? promotionsData ?? []) as Promotion[];
  const productsList = ((itemsData as any)?.data ?? itemsData ?? []) as any[];

  const [services, setServices] = useState<LocalServiceRow[]>([]);
  const [products, setProducts] = useState<LocalProductRow[]>([]);
  const [selectedService, setSelectedService] = useState("");
  const [selectedProfessionals, setSelectedProfessionals] = useState<number[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [productQuantity, setProductQuantity] = useState(1);
  const [loadingAppointment, setLoadingAppointment] = useState(false);

  const [discountDisplay, setDiscountDisplay] = useState("");
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
          method: "",
          amount: 0,
          card_brand: null,
          installments: 1,
          fee_percent: 0,
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
    const raw = safeNumber((promo as any).discount_value ?? 0, 0);
    if (!raw) return "";
    if ((promo as any).discount_type === "percentage") return `${raw.toFixed(2).replace(".", ",")}%`;
    return `R$ ${raw.toFixed(2).replace(".", ",")}`;
  };

  useEffect(() => {
    if (open) return;
    setServices([]);
    setProducts([]);
    setSelectedService("");
    setSelectedProfessionals([]);
    setSelectedProduct("");
    setProductQuantity(1);
    setDiscountDisplay("");
    setPaymentAmountDisplay({});
    setPaymentFeeDisplay({});
    form.reset();
  }, [open, form]);

  useEffect(() => {
    if (!open || !appointmentId) return;

    const loadAppointmentData = async () => {
      setLoadingAppointment(true);

      try {
        const { data } = await refetch();

        const apsList =
          (data as any)?.appointmentServices ??
          (data as any)?.appointment_services ??
          null;

        const svcList = (data as any)?.services ?? [];

        const mappedServices: LocalServiceRow[] = [];

        if (Array.isArray(apsList)) {
          for (const aps of apsList) {
            const serviceId = safeNumber(aps?.service_id ?? aps?.service?.id, 0);
            if (!serviceId) continue;

            const serviceName =
              aps?.service?.name ??
              aps?.name ??
              servicesList.find((s: any) => Number(s.id) === serviceId)?.name ??
              `Serviço #${serviceId}`;

            const promoIds = Array.isArray(aps?.promotions)
              ? uniqueInts(aps.promotions.map((p: any) => p?.id))
              : uniqueInts(aps?.promotion_ids ?? []);

            mappedServices.push({
              id: serviceId,
              appointment_service_id: safeNumber(aps?.id, 0) || null,
              name: String(serviceName),
              price: safeNumber(aps?.service_price ?? aps?.service?.price ?? 0),
              commission_type: (aps?.commission_type ?? aps?.service?.commission_type ?? "percentage") as any,
              commission_value: safeNumber(aps?.commission_value ?? aps?.service?.commission_value ?? 0),
              professionals: aps?.professional_id ? [safeNumber(aps.professional_id)] : [],
              promotion_ids: promoIds,
            });
          }
        } else if (Array.isArray(svcList)) {
          for (const s of svcList) {
            const serviceId = safeNumber(s?.id, 0);
            if (!serviceId) continue;

            const promoIds = Array.isArray((s as any)?.promotions)
              ? uniqueInts((s as any).promotions.map((p: any) => p?.id))
              : uniqueInts((s as any)?.promotion_ids ?? []);

            mappedServices.push({
              id: serviceId,
              name: String(s?.name ?? `Serviço #${serviceId}`),
              price: safeNumber((s as any)?.service_price ?? (s as any)?.price ?? 0),
              commission_type: (s?.commission_type ?? "percentage") as any,
              commission_value: safeNumber(s?.commission_value ?? 0),
              professionals: s?.professional_id ? [safeNumber(s.professional_id)] : [],
              promotion_ids: promoIds,
            });
          }
        }

        setServices(mappedServices);

        setProducts(
          ((data as any)?.items ?? []).map((i: any) => ({
            id: safeNumber(i?.id, 0),
            name: String(i?.name ?? "Item"),
            price: safeNumber(i?.price ?? 0),
            quantity: safeNumber(i?.quantity ?? 1, 1),
          }))
        );

        const discountTypeFromApi = (data as any)?.discount_type ?? "percentage";
        const discountNum = safeNumber((data as any)?.discount_amount ?? 0);

        const paymentsFromApi =
          (((data as any)?.payments ?? []) as any[]).map((p: any) => ({
            method: String(p?.method ?? ""),
            amount: safeNumber(p?.base_amount ?? p?.amount ?? 0),
            fee_percent: safeNumber(p?.fee_percent ?? 0),
            card_brand: p?.card_brand ?? null,
            installments: p?.installments ?? 1,
            notes: (p?.meta?.notes ?? null) as string | null,
          })) ?? [];

        form.reset({
          discount_type: discountTypeFromApi,
          discount: discountNum,
          payments: paymentsFromApi.length
            ? paymentsFromApi
            : [
                {
                  method: "",
                  amount: 0,
                  card_brand: null,
                  installments: 1,
                  fee_percent: 0,
                  notes: null,
                },
              ],
        });

        const amountDisplayMap: Record<number, string> = {};
        const feeDisplayMap: Record<number, string> = {};

        const seed = paymentsFromApi.length ? paymentsFromApi : form.getValues("payments");
        seed.forEach((p, i) => {
          amountDisplayMap[i] = p.amount ? displayCurrency(Number(p.amount)) : "";
          feeDisplayMap[i] = p.fee_percent ? displayPercentage(Number(p.fee_percent)) : "";
        });

        setPaymentAmountDisplay(amountDisplayMap);
        setPaymentFeeDisplay(feeDisplayMap);

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
  }, [open, appointmentId, refetch, form, servicesList]);

  const appointmentPromotions = useMemo(() => {
    const data: any = appointmentData as any;
    if (!data) return [] as Promotion[];

    const apsList =
      data?.appointmentServices ??
      data?.appointment_services ??
      [];

    const found: Promotion[] = [];

    if (Array.isArray(apsList)) {
      for (const aps of apsList) {
        if (Array.isArray(aps?.promotions)) {
          for (const p of aps.promotions) {
            if (p?.id) found.push(p as Promotion);
          }
        }
      }
    }

    const map = new Map<number, Promotion>();
    for (const p of found) map.set(Number((p as any).id), p);
    return Array.from(map.values());
  }, [appointmentData]);

  const promotionById = useMemo(() => {
    const all = [...promotions, ...appointmentPromotions];
    const map = new Map<number, Promotion>();
    for (const p of all) {
      const id = Number((p as any)?.id);
      if (id) map.set(id, p);
    }
    return map;
  }, [promotions, appointmentPromotions]);

  const availablePromotions = useMemo(() => {
    const baseDate = (appointmentData as any)?.date
      ? new Date(`${(appointmentData as any).date}T00:00:00`)
      : new Date();

    const actives = promotions.filter((promo: any) => {
      if (!promo.active) return false;

      const startDate = promo.start_date ? new Date(`${promo.start_date}T00:00:00`) : null;
      const endDate = promo.end_date ? new Date(`${promo.end_date}T23:59:59`) : null;

      if (startDate && baseDate < startDate) return false;
      if (endDate && baseDate > endDate) return false;

      return true;
    });

    const map = new Map<number, Promotion>();
    for (const p of [...actives, ...appointmentPromotions]) {
      const id = Number((p as any)?.id);
      if (id) map.set(id, p);
    }

    return Array.from(map.values());
  }, [promotions, appointmentPromotions, (appointmentData as any)?.date]);

  const togglePromotionForService = useCallback((serviceIndex: number, promoId: number) => {
    setServices((prev) =>
      prev.map((s, idx) => {
        if (idx !== serviceIndex) return s;

        const current = s.promotion_ids ?? [];
        const has = current.includes(promoId);
        return {
          ...s,
          promotion_ids: has ? current.filter((x) => x !== promoId) : [...current, promoId],
        };
      })
    );
  }, []);

  const addService = () => {
    if (!selectedService || selectedProfessionals.length === 0) {
      toast.error("Selecione um serviço e pelo menos um profissional");
      return;
    }

    const service = servicesList.find((s: any) => String(s.id) === String(selectedService));
    if (!service) return;

    setServices((prev) => [
      ...prev,
      {
        id: Number(service.id),
        appointment_service_id: null,
        name: String(service.name),
        price: safeNumber(service.price, 0),
        commission_type: service.commission_type ?? "percentage",
        commission_value: safeNumber(service.commission_value, 0),
        professionals: selectedProfessionals,
        promotion_ids: [],
      },
    ]);

    setSelectedService("");
    setSelectedProfessionals([]);
  };

  const removeService = (index: number) => setServices((prev) => prev.filter((_, i) => i !== index));

  const addProduct = () => {
    if (!selectedProduct || productQuantity < 1) {
      toast.error("Selecione um produto e quantidade válida");
      return;
    }

    const product = productsList.find((p: any) => String(p.id) === String(selectedProduct));
    if (!product) return;

    setProducts((prev) => {
      const existing = prev.find((p) => p.id === Number(product.id));
      if (existing) {
        return prev.map((p) => (p.id === Number(product.id) ? { ...p, quantity: (p.quantity ?? 0) + productQuantity } : p));
      }

      return [
        ...prev,
        {
          id: Number(product.id),
          name: String(product.name),
          price: safeNumber(product.price, 0),
          quantity: productQuantity,
        },
      ];
    });

    setSelectedProduct("");
    setProductQuantity(1);
  };

  const removeProduct = (index: number) => setProducts((prev) => prev.filter((_, i) => i !== index));

  const toggleProfessional = (id: number) => {
    setSelectedProfessionals((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const servicesTotal = services.reduce((sum, s) => sum + safeNumber(s.price, 0), 0);
  const productsTotal = products.reduce((sum, p) => sum + safeNumber(p.price, 0) * safeNumber(p.quantity, 0), 0);

  const promoAgg = useMemo(() => {
    let promoDiscountTotal = 0;
    const perService = services.map((s) => {
      const r = calcPromoDiscountForService(
        safeNumber(s.price, 0),
        uniqueInts(s.promotion_ids ?? []),
        promotionById
      );
      promoDiscountTotal += r.discountTotal;
      return r;
    });

    promoDiscountTotal = Number(promoDiscountTotal.toFixed(2));
    const servicesAfterPromos = Number((servicesTotal - promoDiscountTotal).toFixed(2));
    const subtotalAfterPromos = Number((servicesAfterPromos + productsTotal).toFixed(2));

    return { promoDiscountTotal, servicesAfterPromos, subtotalAfterPromos, perService };
  }, [services, servicesTotal, productsTotal, promotionById]);

  const subtotal = promoAgg.subtotalAfterPromos;

  const discountType = form.watch("discount_type");
  const discountRaw = form.watch("discount") || 0;

  let discountValue = 0;
  if (discountType === "percentage") discountValue = (subtotal * discountRaw) / 100;
  else discountValue = Math.min(discountRaw, subtotal);

  const totalAfterDiscount = subtotal - discountValue;

  const paymentsWatch = form.watch("payments") ?? [];
  const baseTotal = Number(totalAfterDiscount.toFixed(2));

  const paidBaseTotal = Number(
    paymentsWatch.reduce((sum, p) => sum + (safeNumber((p as any)?.amount, 0) || 0), 0).toFixed(2)
  );

  const remaining = Number((baseTotal - paidBaseTotal).toFixed(2));

  const feeTotal = Number(
    paymentsWatch
      .reduce((sum, p) => {
        const method = String((p as any)?.method || "").trim();
        if (method !== "credit" && method !== "credit_link") return sum;

        const base = safeNumber((p as any)?.amount, 0);
        const fee = safeNumber((p as any)?.fee_percent, 0);
        return sum + (base * fee) / 100;
      }, 0)
      .toFixed(2)
  );

  const total = Number((baseTotal + feeTotal).toFixed(2));
  const paidTotal = paidBaseTotal;

  const fillRemainingOnRow = (index: number) => {
    const current = safeNumber(form.getValues(`payments.${index}.amount`), 0);
    const add = Math.max(0, remaining);
    const next = Number((current + add).toFixed(2));

    form.setValue(`payments.${index}.amount`, next, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });

    setPaymentAmountDisplay((prev) => ({
      ...prev,
      [index]: next > 0 ? displayCurrency(next) : "",
    }));
  };

  const normalizedAppointment = useMemo(() => {
    if (!appointmentData) return null;
    return {
      id: Number((appointmentData as any).id),
      customer: (appointmentData as any).customer ?? null,
    };
  }, [appointmentData]);

  const onSubmit = async (data: z.infer<typeof checkoutSchema>) => {
    if (!normalizedAppointment) return;

    if (services.length === 0) {
      toast.error("Adicione pelo menos um serviço");
      return;
    }

    const servicesTotalLocal = services.reduce((sum, s) => sum + safeNumber(s.price, 0), 0);
    const productsTotalLocal = products.reduce(
      (sum, p) => sum + safeNumber(p.price, 0) * safeNumber(p.quantity, 0),
      0
    );

    const promoDiscountLocal = services.reduce((sum, s) => {
      const r = calcPromoDiscountForService(
        safeNumber(s.price, 0),
        uniqueInts(s.promotion_ids ?? []),
        promotionById
      );
      return sum + r.discountTotal;
    }, 0);

    const subtotalLocal = (servicesTotalLocal - promoDiscountLocal) + productsTotalLocal;

    let discountValueLocal = 0;
    if (data.discount_type === "percentage") {
      discountValueLocal = (subtotalLocal * safeNumber(data.discount, 0)) / 100;
    } else {
      discountValueLocal = Math.min(safeNumber(data.discount, 0), subtotalLocal);
    }

    const expectedBase = Number((subtotalLocal - discountValueLocal).toFixed(2));

    const paidBase = Number(
      (data.payments ?? []).reduce((sum, p) => sum + safeNumber(p.amount, 0), 0).toFixed(2)
    );

    if (Math.abs(paidBase - expectedBase) > 0.01) {
      toast.error(
        `A soma dos pagamentos (R$ ${paidBase.toFixed(2)}) deve ser igual ao valor após desconto (R$ ${expectedBase.toFixed(2)}).`
      );
      return;
    }

    const payments = (data.payments ?? []).map((p) => {
      const method = String(p.method || "").trim();
      const isCredit = method === "credit";
      const isCreditLike = method === "credit" || method === "credit_link";
      const isCard = isCreditLike || method === "debit";

      return {
        method,
        amount: Number(safeNumber(p.amount, 0).toFixed(2)),
        fee_percent: isCreditLike ? Number(safeNumber(p.fee_percent, 0).toFixed(2)) : 0,
        card_brand: isCard ? (String(p.card_brand ?? "").trim() || null) : null,
        installments: isCredit ? (p.installments ?? 1) : null,
        meta: p.notes ? { notes: p.notes } : null,
        notes: null,
      };
    });

    const appointmentServicesPayload = services
      .filter((s) => Number(s.appointment_service_id ?? 0) > 0)
      .map((s) => ({
        id: Number(s.appointment_service_id),
        promotions: uniqueInts(s.promotion_ids ?? []).map((pid, idx) => ({
          promotion_id: Number(pid),
          sort_order: idx,
        })),
      }));

    const servicesToAddPayload = services
      .filter((s) => !Number(s.appointment_service_id ?? 0))
      .map((s) => ({
        service_id: Number(s.id),
        professional_id: Number(s.professionals?.[0] ?? 0) || null,
        service_price: Number(safeNumber(s.price, 0)).toFixed(2),
        commission_type: (s.commission_type ?? "percentage") as any,
        commission_value: Number(safeNumber(s.commission_value, 0)).toFixed(2),
        promotion_ids: uniqueInts(s.promotion_ids ?? []),
      }));

    const itemsPayload = products.map((p) => ({
      id: Number(p.id),
      price: Number(safeNumber(p.price, 0)).toFixed(2),
      quantity: Number(safeNumber(p.quantity, 1)),
    }));

    try {
      await checkout({
        appointmentId: normalizedAppointment.id,
        payload: {
          discount_type: data.discount_type,
          discount_amount: Number(safeNumber(data.discount, 0)),
          payments,
          appointment_services: appointmentServicesPayload,
          services_to_add: servicesToAddPayload,
          items: itemsPayload,
        } as any,
      });

      toast.success("Atendimento finalizado com sucesso!");
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao finalizar atendimento.");
    }
  };

  if (isLoading || loadingAppointment) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn("max-h-[90vh]", isMobile ? "max-w-[95vw]" : "max-w-2xl")}>
          <div className="flex flex-col items-center gap-3 py-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Requisitando dados do sistema...</p>
          </div>
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
            Cliente: {(appointmentData as any).customer?.name ?? "Cliente não identificado"} •{" "}
            {new Date(`${(appointmentData as any).date}T00:00:00`).toLocaleDateString("pt-BR")} às{" "}
            {(appointmentData as any).start_time?.slice(0, 5) ?? "--:--"}
          </DialogDescription>
        </DialogHeader>

        {availablePromotions.length > 0 && (
          <Alert className="border-primary/30 bg-primary/5">
            <AlertDescription className="text-sm flex items-start gap-2">
              <Tag className="h-4 w-4 mt-0.5 text-primary" />
              <span>
                Promoções disponíveis para esta data. Você pode aplicar <b>por serviço</b> abaixo.
              </span>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 mt-4">
          <h3 className="font-semibold">Serviços Realizados</h3>

          <div className="grid grid-cols-2 gap-3">
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um serviço" />
              </SelectTrigger>
              <SelectContent>
                {servicesList.map((s: any) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name} - R$ {safeNumber(s.price, 0).toFixed(2)}
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
              <p className="text-sm text-muted-foreground">Selecione o profissional que executou o serviço:</p>
              <div className="flex flex-wrap gap-2">
                {professionals.map((p: any) => (
                  <Badge
                    key={p.id}
                    variant={selectedProfessionals.includes(Number(p.id)) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleProfessional(Number(p.id))}
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
                <div key={`${s.id}-${i}`} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{s.name}</p>

                    <p className="text-sm text-muted-foreground">
                      Profissional:{" "}
                      {(() => {
                        const profId = s.professionals?.[0];
                        const prof = professionals.find((p: any) => Number(p.id) === Number(profId));
                        return prof?.user?.name ?? prof?.name ?? "—";
                      })()}
                    </p>

                    <p className="text-sm font-medium mt-1">R$ {safeNumber(s.price, 0).toFixed(2)}</p>

                    {(availablePromotions.length > 0 || (s.promotion_ids ?? []).length > 0) && (
                      <div className="mt-2 space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {(s.promotion_ids ?? []).map((pid) => {
                            const promo = promotionById.get(Number(pid));
                            return (
                              <Badge
                                key={pid}
                                variant="secondary"
                                className="cursor-pointer"
                                onClick={() => togglePromotionForService(i, pid)}
                                title="Clique para remover"
                              >
                                {promo?.name ?? `Promo #${pid}`} ✕
                              </Badge>
                            );
                          })}
                        </div>

                        <Select
                          value="__none__"
                          onValueChange={(v) => {
                            if (!v || v === "__none__") return;
                            togglePromotionForService(i, Number(v));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Adicionar promoção ao serviço (opcional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Selecionar…</SelectItem>
                            {availablePromotions.map((promo: any) => {
                              const disabled = (s.promotion_ids ?? []).includes(Number(promo.id));
                              return (
                                <SelectItem key={promo.id} value={String(promo.id)} disabled={disabled}>
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="truncate">{promo.name}</span>
                                    {promo.discount_value && (
                                      <Badge variant="outline" className="ml-2">
                                        {formatPromotionShort(promo)}
                                      </Badge>
                                    )}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
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
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name} - R$ {safeNumber(p.price, 0).toFixed(2)}
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
                <div key={`${p.id}-${i}`} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-sm text-muted-foreground">Quantidade: {p.quantity}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-medium">
                      R$ {(safeNumber(p.price, 0) * safeNumber(p.quantity, 0)).toFixed(2)}
                    </p>
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
                    <Select
                      onValueChange={(v) => {
                        field.onChange(v);
                        setDiscountDisplay("");
                        form.setValue("discount", 0);
                      }}
                      value={field.value}
                    >
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
                            field.onChange(Number.isNaN(numeric) ? 0 : numeric);
                          } else {
                            const formatted = formatCurrencyInput(value);
                            setDiscountDisplay(formatted);

                            const numeric = parseFloat(formatted.replace(/[^\d,]/g, "").replace(",", "."));
                            field.onChange(Number.isNaN(numeric) ? 0 : numeric);
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
                <h3 className="font-semibold">Métodos de Pagamento</h3>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    append({
                      method: "",
                      amount: 0,
                      card_brand: null,
                      installments: 1,
                      fee_percent: 0,
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
                const method = String(form.watch(`payments.${idx}.method`) || "").trim();
                const amountValue = form.watch(`payments.${idx}.amount`) || 0;

                const isCredit = method === "credit";
                const isCreditLike = method === "credit" || method === "credit_link";
                const isCard = isCreditLike || method === "debit";

                return (
                  <div key={f.id} className="rounded-lg border p-3 space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <FormField
                        control={form.control}
                        name={`payments.${idx}.method`}
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
                                  field.onChange(Number.isNaN(numeric) ? 0 : numeric);
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

                    {(isCard || isCreditLike) && (
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name={`payments.${idx}.card_brand`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bandeira</FormLabel>
                              <Select
                                value={field.value ?? ""}
                                onValueChange={(v) => field.onChange(v || null)}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione a bandeira" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {CARD_BRANDS_BR.map((b) => (
                                    <SelectItem key={b.value} value={b.label}>
                                      {b.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {isCredit ? (
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
                              name={`payments.${idx}.fee_percent`}
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
                                        field.onChange(Number.isNaN(numeric) ? 0 : numeric);
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        ) : method === "credit_link" ? (
                          <FormField
                            control={form.control}
                            name={`payments.${idx}.fee_percent`}
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
                                      field.onChange(Number.isNaN(numeric) ? 0 : numeric);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ) : (
                          <div />
                        )}
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name={`payments.${idx}.notes`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações (opcional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: comprovante, detalhes..."
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="text-xs text-muted-foreground flex justify-between">
                      <span>Pago nesta linha: R$ {safeNumber(amountValue, 0).toFixed(2)}</span>
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

              {promoAgg.promoDiscountTotal > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Desconto em promoções (serviços):</span>
                  <span>- R$ {promoAgg.promoDiscountTotal.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span>Produtos:</span>
                <span>R$ {productsTotal.toFixed(2)}</span>
              </div>

              <Separator className="my-1" />

              <div className="flex justify-between text-sm">
                <span>Subtotal (após promoções):</span>
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
                  <span>Taxas de crédito (informativo):</span>
                  <span>+ R$ {feeTotal.toFixed(2)}</span>
                </div>
              )}

              <Separator className="my-1" />

              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Total pago (base):</span>
                <span>
                  R$ {paidTotal.toFixed(2)} • Restante: R$ {Math.max(0, remaining).toFixed(2)}
                </span>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" className="gap-2" disabled>
                <Printer className="h-4 w-4" />
                Imprimir Comanda
              </Button>

              <div className="flex gap-2 flex-1 justify-end">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
